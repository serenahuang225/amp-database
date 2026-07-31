import { getSchoolSearchTerms } from './schoolAliases.js'
import { formatEnglishBirthdate, parseSpanishBirthdate } from './dates.js'

function parseCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
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

export function parseContactsCsv(text) {
  const lines = text.trim().split(/\r?\n/)
  const headers = parseCsvLine(lines[0])

  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const values = parseCsvLine(line)
      const row = {}

      headers.forEach((header, index) => {
        row[header] = values[index] ?? ''
      })

      return row
    })
}

function field(row, ...keys) {
  for (const key of keys) {
    const value = row[key]?.trim()
    if (value) return value
  }

  return ''
}

export function normalizeContact(row) {
  const rawBirthdate = field(row, 'Birthdate')
  const parsedBirthdate = parseSpanishBirthdate(rawBirthdate)

  return {
    name: field(row, 'Name (first and last name)', 'Name'),
    birthdate: formatEnglishBirthdate(rawBirthdate),
    // MAX_SAFE_INTEGER (not Infinity) so contacts round-trip through Firestore
    birthdateSort: parsedBirthdate?.getTime() ?? Number.MAX_SAFE_INTEGER,
    hometown: field(row, 'Hometown'),
    college: field(row, 'College'),
    major: field(row, 'Intended Major', 'Major'),
    dreamJob: field(row, 'Dream Job (anything)', 'Dream Job'),
    favoriteSong: field(row, 'Favorite song right now'),
    ethnicity: field(row, 'Ethnicity'),
    latestAwake: field(
      row,
      "Latest you've stayed awake at AMP (format HH:MM AM)",
      "Latest you've stayed awake at AMP",
    ),
    missedClass: field(row, "Days you've missed class at AMP"),
    bio: field(
      row,
      'Miscelllaneous things you want other people to know about you',
    ),
    fruit: field(row, 'If you were any fruit, what fruit would you be?'),
    instagram: field(
      row,
      'Instagram (username), if applicable',
      'Instagram (username)',
    ),
    github: field(row, 'Github (username)'),
    linkedin: field(
      row,
      'Linkedin (username), if applicable',
      'Linkedin (username)',
    ),
    phone: field(row, 'Phone Number'),
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function keywordMatchesText(keyword, text) {
  if (keyword.length <= 3) {
    return new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i').test(text)
  }

  return text.toLowerCase().includes(keyword)
}

export function matchesContactSearch(contact, query) {
  const keywords = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (keywords.length === 0) return true

  const haystack = Object.values(contact).join(' ')
  const schoolAliases = getSchoolSearchTerms(contact.college)

  return keywords.every((keyword) => {
    if (schoolAliases.includes(keyword)) return true

    if (
      schoolAliases.some(
        (alias) => alias.includes(keyword) && keyword.length > 3,
      )
    ) {
      return true
    }

    return keywordMatchesText(keyword, haystack)
  })
}
