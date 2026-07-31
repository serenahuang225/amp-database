export function parseSpanishBirthdate(value) {
  if (!value?.trim()) return null

  const parts = value.split('/').map((part) => Number.parseInt(part.trim(), 10))
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null

  const [day, month, year] = parts
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

export function formatEnglishBirthdate(value) {
  const date = parseSpanishBirthdate(value)
  if (!date) return value?.trim() ?? ''

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
