import {
  parseSongQuery,
  pickPreviewFromResults,
  searchDeezerTracks,
  searchItunesTracks,
} from './musicSearch.js'

const previewCache = new Map()

export { parseSongQuery }

export function getSpotifySearchUrl(searchQuery) {
  return `https://open.spotify.com/search/${encodeURIComponent(searchQuery)}`
}

export async function searchTrackPreview(parsed) {
  const cacheKey = parsed.searchQueries.join('|')
  if (previewCache.has(cacheKey)) {
    return previewCache.get(cacheKey)
  }

  const queries = [...new Set(parsed.searchQueries)]

  for (const query of queries) {
    const deezerResults = await searchDeezerTracks(query)
    const deezerMatch = pickPreviewFromResults(deezerResults, parsed)
    if (deezerMatch) {
      previewCache.set(cacheKey, deezerMatch)
      return deezerMatch
    }

    const itunesResults = await searchItunesTracks(query)
    const itunesMatch = pickPreviewFromResults(itunesResults, parsed)
    if (itunesMatch) {
      previewCache.set(cacheKey, itunesMatch)
      return itunesMatch
    }
  }

  previewCache.set(cacheKey, null)
  return null
}

export async function searchPreviewForSong(song) {
  const parsed = parseSongQuery(song)
  if (!parsed) return null

  return searchTrackPreview(parsed)
}

export const searchDeezerTrack = searchPreviewForSong
