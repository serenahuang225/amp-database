import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  parseSongQuery,
  pickPreviewFromResults,
  searchDeezerTracks,
  searchItunesTracks,
} from '../src/utils/musicSearch.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const csvPath = join(__dirname, '../public/contacts.csv')
const outputPath = join(__dirname, '../src/data/songPreviews.json')

function parseCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

function getFavoriteSongs(csvText) {
  const lines = csvText.trim().split(/\r?\n/)
  const headers = parseCsvLine(lines[0])
  const favoriteSongIndex = headers.indexOf('Favorite song right now')

  return [
    ...new Set(
      lines
        .slice(1)
        .map((line) => parseCsvLine(line)[favoriteSongIndex]?.trim())
        .filter(Boolean),
    ),
  ]
}

async function resolvePreview(song) {
  const parsed = parseSongQuery(song)
  if (!parsed) return null

  for (const query of parsed.searchQueries) {
    const deezerResults = await searchDeezerTracks(query, 'https://api.deezer.com')
    const deezerMatch = pickPreviewFromResults(deezerResults, parsed)
    if (deezerMatch) return deezerMatch

    const itunesResults = await searchItunesTracks(query)
    const itunesMatch = pickPreviewFromResults(itunesResults, parsed)
    if (itunesMatch) return itunesMatch
  }

  return null
}

async function main() {
  const csvText = readFileSync(csvPath, 'utf8')
  const songs = getFavoriteSongs(csvText)
  const previews = {}

  for (const song of songs) {
    previews[song] = await resolvePreview(song)
    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, `${JSON.stringify(previews, null, 2)}\n`)
  const resolved = Object.values(previews).filter(Boolean).length
  const expectedPlayable = songs.filter(
    (song) => !/idk|none|nothing|rough|gracie/i.test(song),
  ).length
  const playableResolved = songs.filter(
    (song) => previews[song] && !/idk|none|nothing|rough|gracie/i.test(song),
  ).length

  console.log(`Resolved ${resolved}/${songs.length} song previews`)
  console.log(`Playable tracks resolved ${playableResolved}/${expectedPlayable}`)

  if (playableResolved < expectedPlayable) {
    const missing = songs.filter(
      (song) =>
        !previews[song] && !/idk|none|nothing|rough|gracie/i.test(song),
    )
    console.error('Missing playable previews:', missing.join(', '))
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
