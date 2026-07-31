const UNPLAYABLE_PATTERNS = [
  /^idk$/i,
  /^none$/i,
  /^nothing comes to mind$/i,
  /can't think of one/i,
  /that's rough/i,
  /no idea/i,
  /gracie abram/i,
]

const SONG_OVERRIDES = {
  'Rather Be (Giveon), Frank Ocean': {
    title: 'RATHER BE',
    artists: ['Giveon', 'GIVĒON'],
    searchQueries: ['Giveon RATHER BE', 'RATHER BE Giveon'],
  },
  'For the First Time in Forever': {
    title: 'For the First Time in Forever',
    artists: ['Kristen Bell', 'Idina Menzel'],
    searchQueries: ['For the First Time in Forever Frozen'],
  },
  'Midnight City (M83)': {
    title: 'Midnight City',
    artists: ['M83'],
    searchQueries: ['M83 Midnight City'],
  },
  'Never Gonna Give You Up': {
    title: 'Never Gonna Give You Up',
    artists: ['Rick Astley'],
    searchQueries: ['Rick Astley Never Gonna Give You Up'],
  },
  'Soda Pop (Kpop Demon Hunters)': {
    title: 'Soda Pop',
    artists: ['Saja Boys', 'KPop Demon Hunters Cast'],
    searchQueries: ['Soda Pop Saja Boys', 'Soda Pop KPop Demon Hunters'],
  },
  'Stateside + Kylie Minogue': {
    title: 'Stateside',
    artists: ['PinkPantheress', 'Kylie Minogue'],
    searchQueries: ['Stateside PinkPantheress Kylie Minogue'],
  },
}

const ARTIST_ALIASES = {
  jb: 'Justin Bieber',
  'a$ap rocky': 'A$AP Rocky',
  'asap rocky': 'A$AP Rocky',
  'ynw melly': 'YNW Melly',
  grentperez: 'grentperez',
  'kpop demon hunters': 'KPop Demon Hunters Cast',
}

export function normalize(value) {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function expandArtist(artist) {
  const key = artist?.toLowerCase().trim()
  return ARTIST_ALIASES[key] || artist
}

export function parseSongQuery(favoriteSong) {
  if (!favoriteSong?.trim()) return null

  const normalized = favoriteSong.trim()
  if (UNPLAYABLE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return null
  }

  if (SONG_OVERRIDES[normalized]) {
    return { ...SONG_OVERRIDES[normalized] }
  }

  const commaArtist = normalized.match(/^(.+?)\s*\(([^)]+)\)\s*,\s*(.+)$/)
  if (commaArtist) {
    const title = commaArtist[1].trim()
    const primaryArtist = expandArtist(commaArtist[2].trim())
    const secondaryArtist = commaArtist[3].trim()

    return {
      title,
      artists: [primaryArtist, secondaryArtist],
      searchQueries: [
        `${primaryArtist} ${title}`,
        `${title} ${primaryArtist}`,
        `${secondaryArtist} ${title}`,
        `${title} ${secondaryArtist}`,
        normalized,
      ],
    }
  }

  const parenMatch = normalized.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
  if (parenMatch) {
    const title = parenMatch[1].trim()
    const artist = expandArtist(parenMatch[2].trim())

    return {
      title,
      artists: [artist],
      searchQueries: [
        `${artist} ${title}`,
        `${title} ${artist}`,
        `${title.replace(/\s+/g, '')} ${artist}`,
        normalized,
      ],
    }
  }

  if (/^Peso\s+A\$?AP\s+Rocky$/i.test(normalized)) {
    return {
      title: 'Peso',
      artists: ['A$AP Rocky', 'ASAP Rocky'],
      searchQueries: ['A$AP Rocky Peso', 'Peso A$AP Rocky', 'Peso ASAP Rocky'],
    }
  }

  if (normalized.includes(' + ')) {
    const [title, artist] = normalized.split(' + ').map((part) => part.trim())

    return {
      title,
      artists: [artist, 'PinkPantheress'],
      searchQueries: [`${title} ${artist}`, `${artist} ${title}`, normalized],
    }
  }

  return {
    title: normalized,
    artists: [],
    searchQueries: [normalized],
  }
}

function artistMatches(resultArtist, artists, trackName = '') {
  const resultNorm = normalize(resultArtist)
  const trackNorm = normalize(trackName)

  if (!artists.length) return true

  return artists.some((artist) => {
    const expanded = expandArtist(artist)
    const artistNorm = normalize(expanded)

    if (!artistNorm) return false
    if (resultNorm.includes(artistNorm) || artistNorm.includes(resultNorm)) {
      return true
    }

    const words = expanded
      .toLowerCase()
      .split(/[\s&+,/]+/)
      .map(normalize)
      .filter((word) => word.length > 2)

    if (words.length === 0) return true

    const matchedInArtist = words.filter((word) => resultNorm.includes(word))
    if (words.length === 1 && matchedInArtist.length === 1) return true
    if (matchedInArtist.length >= Math.min(words.length, 2)) return true

    return words.some((word) => word.length > 3 && trackNorm.includes(word))
  })
}

function scoreTrack(result, title, artists) {
  if (!artistMatches(result.artistName, artists, result.trackName)) return -1

  const trackNorm = normalize(result.trackName)
  const titleNorm = normalize(title)
  let score = 0

  if (!titleNorm) return 0

  if (trackNorm === titleNorm) score += 24
  else if (trackNorm.includes(titleNorm) || titleNorm.includes(trackNorm)) {
    score += 16
    if (trackNorm !== titleNorm && trackNorm.length > titleNorm.length + 2) {
      const extra = trackNorm.replace(titleNorm, '')
      const extraFromArtists = artists.some((artist) =>
        extra.includes(normalize(expandArtist(artist))),
      )
      if (!extraFromArtists) score -= 10
    }
  } else {
    const titleWords = title
      .split(/\s+/)
      .map(normalize)
      .filter((word) => word.length > 2)
    score += titleWords.filter((word) => trackNorm.includes(word)).length * 5
  }

  const trackName = result.trackName.toLowerCase()
  if (trackName.includes('acoustic') && !title.toLowerCase().includes('acoustic')) {
    score -= 15
  }
  if (trackName.includes('cover') && !title.toLowerCase().includes('cover')) {
    score -= 10
  }
  if (trackName.includes('piano') && !title.toLowerCase().includes('piano')) {
    score -= 10
  }
  if (trackName.includes('remix') && !title.toLowerCase().includes('remix')) {
    score -= 12
  }
  if (trackName.includes('mix') && !title.toLowerCase().includes('mix')) {
    score -= 12
  }
  if (trackName.includes('instrumental')) score -= 12
  if (trackName.includes('karaoke')) score -= 12
  if (trackName.includes('parody')) score -= 12
  if (trackName.includes('8-bit') || trackName.includes('8 bit')) score -= 12
  if (trackName.includes('originally performed')) score -= 12
  if (trackName.includes('live') && !title.toLowerCase().includes('live')) {
    score -= 6
  }

  return score
}

export function pickPreviewFromResults(results, parsed) {
  const match = results
    .map((result) => ({
      result,
      score: scoreTrack(result, parsed.title, parsed.artists),
    }))
    .filter((entry) => entry.score >= 12)
    .sort((a, b) => b.score - a.score)[0]?.result

  if (!match) return null

  return {
    title: match.trackName,
    artist: match.artistName,
    previewUrl: match.previewUrl,
    sourceUrl: match.sourceUrl,
  }
}

export async function searchItunesTracks(query) {
  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=25`,
  )

  if (!response.ok) return []

  const data = await response.json()

  return (data.results || [])
    .filter((result) => result.previewUrl)
    .map((result) => ({
      trackName: result.trackName,
      artistName: result.artistName,
      previewUrl: result.previewUrl,
      sourceUrl: result.trackViewUrl,
    }))
}

export async function searchDeezerTracks(query, baseUrl = '/api/deezer') {
  const response = await fetch(
    `${baseUrl}/search?q=${encodeURIComponent(query)}&limit=25`,
  )

  if (!response.ok) return []

  const data = await response.json()

  return (data.data || [])
    .filter((track) => track.preview)
    .map((track) => ({
      trackName: track.title,
      artistName: track.artist.name,
      previewUrl: track.preview,
      sourceUrl: track.link,
    }))
}
