import { useEffect, useRef, useState } from 'react'
import {
  getSpotifySearchUrl,
  parseSongQuery,
  searchPreviewForSong,
} from '../utils/music.js'

function FavoriteSong({ song }) {
  const parsed = parseSongQuery(song)
  const audioRef = useRef(null)
  const [track, setTrack] = useState(null)
  const [status, setStatus] = useState('idle')
  const [isPlaying, setIsPlaying] = useState(false)
  const [shouldPlay, setShouldPlay] = useState(false)

  useEffect(() => {
    if (!shouldPlay || !track?.previewUrl) return undefined

    const audio = audioRef.current
    if (!audio) return undefined

    document.querySelectorAll('.song-preview-audio').forEach((element) => {
      if (element !== audio) {
        element.pause()
      }
    })

    const startPlayback = async () => {
      try {
        await audio.play()
        setStatus('ready')
      } catch {
        setStatus('unavailable')
      } finally {
        setShouldPlay(false)
      }
    }

    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      startPlayback()
      return undefined
    }

    audio.addEventListener('canplay', startPlayback, { once: true })
    audio.load()

    return () => {
      audio.removeEventListener('canplay', startPlayback)
    }
  }, [shouldPlay, track])

  if (!song?.trim()) return null

  const spotifyQuery = parsed
    ? parsed.searchQueries[0]
    : song.trim()
  const spotifyUrl = getSpotifySearchUrl(spotifyQuery)

  const loadPreview = async () => {
    if (track) return track
    if (!parsed) return null

    setStatus('loading')

    try {
      const result = await searchPreviewForSong(song)

      if (result) {
        setTrack(result)
        setStatus('ready')
        return result
      }

      setStatus('unavailable')
      return null
    } catch {
      setStatus('unavailable')
      return null
    }
  }

  const handleTogglePlay = async () => {
    if (isPlaying) {
      audioRef.current?.pause()
      return
    }

    if (track?.previewUrl) {
      setShouldPlay(true)
      return
    }

    const preview = await loadPreview()
    if (preview) {
      setShouldPlay(true)
    }
  }

  const playLabel =
    status === 'loading' ? '...' : isPlaying ? 'Pause' : 'Preview'

  return (
    <div className="card-row card-row-song">
      <span className="card-label">Favorite song</span>
      <div className="card-value song-value">
        <span className="song-title">{song}</span>
        {track && (
          <span className="song-match">
            {track.title} — {track.artist}
          </span>
        )}
        <div className="song-actions">
          {parsed && status !== 'unavailable' && (
            <button
              type="button"
              className="song-button"
              onClick={handleTogglePlay}
              disabled={status === 'loading'}
            >
              {playLabel}
            </button>
          )}
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card-social-icon"
            aria-label="Open in Spotify"
            title="Open in Spotify"
          >
            <svg className="card-social-svg" role="presentation" aria-hidden="true">
              <use href="/icons.svg#spotify-icon" />
            </svg>
          </a>
        </div>
        {status === 'unavailable' && parsed && (
          <p className="song-note">No preview found — try Spotify instead.</p>
        )}
        <audio
          ref={audioRef}
          className="song-preview-audio"
          src={track?.previewUrl}
          preload="none"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      </div>
    </div>
  )
}

export default FavoriteSong
