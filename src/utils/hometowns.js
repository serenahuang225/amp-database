/** Approximate lat/lng for AMP hometown strings (primary place when dual). */
const PLACE_COORDS = [
  { match: /lagos|nigeria/i, label: 'Lagos, Nigeria', lat: 6.5244, lng: 3.3792 },
  { match: /houston/i, label: 'Houston, TX', lat: 29.7604, lng: -95.3698 },
  { match: /hubei|china/i, label: 'Hubei, China', lat: 30.5928, lng: 114.3055 },
  { match: /charlotte/i, label: 'Charlotte, NC', lat: 35.2271, lng: -80.8431 },
  { match: /irvine/i, label: 'Irvine, CA', lat: 33.6846, lng: -117.8265 },
  { match: /tehran/i, label: 'Tehran, Iran', lat: 35.6892, lng: 51.389 },
  { match: /lewisville|dallas/i, label: 'Dallas, TX', lat: 32.7767, lng: -96.797 },
  { match: /pittsburgh/i, label: 'Pittsburgh, PA', lat: 40.4406, lng: -79.9959 },
  { match: /round rock|austin/i, label: 'Austin, TX', lat: 30.2672, lng: -97.7431 },
  { match: /castro valley|bay area|the bay|\(sf\)|san francisco/i, label: 'Bay Area, CA', lat: 37.7749, lng: -122.4194 },
  { match: /las vegas/i, label: 'Las Vegas, NV', lat: 36.1699, lng: -115.1398 },
  { match: /alpharetta/i, label: 'Alpharetta, GA', lat: 34.0754, lng: -84.2941 },
  { match: /green bay/i, label: 'Green Bay, WI', lat: 44.5133, lng: -88.0133 },
  { match: /\bdmv\b/i, label: 'DMV', lat: 38.9072, lng: -77.0369 },
  { match: /marietta|atlanta/i, label: 'Atlanta, GA', lat: 33.749, lng: -84.388 },
  { match: /saipan/i, label: 'Saipan', lat: 15.1778, lng: 145.7508 },
  { match: /ellicott city/i, label: 'Ellicott City, MD', lat: 39.2673, lng: -76.7983 },
  { match: /khartoum|khartoun|sudan/i, label: 'Khartoum, Sudan', lat: 15.5007, lng: 32.5599 },
  { match: /cypress/i, label: 'Cypress, CA', lat: 33.8169, lng: -118.0373 },
  { match: /st\.?\s*louis/i, label: 'St. Louis, MO', lat: 38.627, lng: -90.1994 },
  { match: /sacremento|sacramento/i, label: 'Sacramento, CA', lat: 38.5816, lng: -121.4944 },
  { match: /morgantown|west virginia/i, label: 'Morgantown, WV', lat: 39.6295, lng: -79.9559 },
  { match: /hong kong/i, label: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  { match: /isfahan/i, label: 'Isfahan, Iran', lat: 32.6539, lng: 51.666 },
  { match: /oviedo/i, label: 'Oviedo, FL', lat: 28.67, lng: -81.2081 },
  { match: /los angeles|\bla\b/i, label: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
  { match: /flushing|new york|\bny\b/i, label: 'New York, NY', lat: 40.7128, lng: -74.006 },
  { match: /\bga\b(?!,?\s*hong)/i, label: 'Georgia, USA', lat: 33.749, lng: -84.388 },
]

function firstName(fullName) {
  return fullName?.trim().split(/\s+/)[0] || 'Someone'
}

/**
 * Map each contact to one primary map pin (first matching place in hometown).
 */
export function buildHometownPins(contacts) {
  const byPlace = new Map()

  for (const contact of contacts) {
    const hometown = contact.hometown?.trim()
    if (!hometown) continue

    const place = PLACE_COORDS.find((entry) => entry.match.test(hometown))
    if (!place) continue

    const key = `${place.lat},${place.lng}`
    if (!byPlace.has(key)) {
      byPlace.set(key, {
        label: place.label,
        lat: place.lat,
        lng: place.lng,
        people: [],
      })
    }

    byPlace.get(key).people.push({
      name: contact.name,
      shortName: firstName(contact.name),
      hometown,
    })
  }

  return [...byPlace.values()].sort((a, b) => b.people.length - a.people.length)
}
