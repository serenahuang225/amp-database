/**
 * Resolve a LinkedIn field that may be a username or a full profile URL.
 * Returns { href, label } or null when unusable.
 */
export function resolveLinkedIn(raw) {
  const value = raw?.trim()
  if (!value) return null

  const normalized = value.toLowerCase()
  if (
    normalized === 'none' ||
    normalized === 'n/a' ||
    normalized === 'na' ||
    normalized.includes('none as of')
  ) {
    return null
  }

  const fromUrl = value.match(
    /(?:https?:\/\/)?(?:(?:www|[\w-]+)\.)?linkedin\.com\/(?:in|pub)\/([^/?#\s]+)/i,
  )
  if (fromUrl) {
    const slug = decodeURIComponent(fromUrl[1]).replace(/\/+$/, '')
    if (!slug) return null
    return {
      href: `https://www.linkedin.com/in/${slug}`,
      label: slug,
    }
  }

  // Bare path like "linkedin.com/in/foo" without scheme already handled above;
  // reject other http(s) links that aren't LinkedIn profiles.
  if (/^https?:\/\//i.test(value)) return null

  let slug = value
    .replace(/^@/, '')
    .replace(/^\/?(in|pub)\//i, '')
    .replace(/\/+$/, '')
    .trim()

  // Display names / sentences aren't usable profile slugs
  if (!slug || /\s/.test(slug) || slug.length > 100) return null

  return {
    href: `https://www.linkedin.com/in/${encodeURIComponent(slug)}`,
    label: slug,
  }
}
