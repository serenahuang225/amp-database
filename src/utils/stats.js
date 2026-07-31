import { getShortSchoolName } from './schoolAliases.js'

export function parseLatestAwake(value) {
  if (!value?.trim()) return -1

  const normalized = value.toLowerCase()
  if (normalized.includes('all night')) return 10_000

  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return -1

  let hours = Number.parseInt(match[1], 10)
  const minutes = Number.parseInt(match[2], 10)
  const period = match[3].toUpperCase()

  if (period === 'AM') {
    if (hours === 12) hours = 0
  } else if (hours !== 12) {
    hours += 12
  }

  return hours * 60 + minutes
}

export function parseMissedClass(value) {
  if (!value?.trim()) return 0

  const numbers = value.match(/[\d.]+/g)?.map(Number) ?? []
  if (numbers.length === 0) return 0

  if (value.includes('/') && !value.toLowerCase().includes('morning')) {
    const [numerator, denominator] = numbers
    if (denominator) return numerator / denominator
  }

  if (
    value.toLowerCase().includes('morning') &&
    value.toLowerCase().includes('afternoon')
  ) {
    return numbers.reduce((total, number) => total + number, 0)
  }

  return numbers[0]
}

export function formatMinutesAsTime(minutes) {
  if (!Number.isFinite(minutes)) return '—'

  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440
  const hours24 = Math.floor(normalized / 60) % 24
  const mins = normalized % 60
  const period = hours24 >= 12 ? 'PM' : 'AM'
  let hours12 = hours24 % 12
  if (hours12 === 0) hours12 = 12

  return `${hours12}:${mins.toString().padStart(2, '0')} ${period}`
}

/** Axis-friendly label without minutes (avoids overlapping :30 ticks). */
export function formatMinutesAsHourLabel(minutes) {
  if (!Number.isFinite(minutes)) return '—'

  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440
  const hours24 = Math.floor(normalized / 60) % 24
  const period = hours24 >= 12 ? 'PM' : 'AM'
  let hours12 = hours24 % 12
  if (hours12 === 0) hours12 = 12

  return `${hours12} ${period}`
}

/**
 * Map clock minutes onto an overnight continuum so 9 PM comes before 12 AM
 * (instead of stretching the axis through empty afternoon hours).
 */
export function toOvernightMinutes(clockMinutes) {
  if (!Number.isFinite(clockMinutes) || clockMinutes < 0) return clockMinutes
  if (clockMinutes >= 12 * 60) return clockMinutes - 24 * 60
  return clockMinutes
}


function mean(values) {
  if (values.length === 0) return 0
  return values.reduce((total, value) => total + value, 0) / values.length
}

function standardDeviation(values) {
  if (values.length === 0) return 1
  const avg = mean(values)
  const variance =
    values.reduce((total, value) => total + (value - avg) ** 2, 0) /
    values.length
  return Math.sqrt(variance) || 1
}

function normalPdf(x, mu, sigma) {
  return (
    (1 / (sigma * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * ((x - mu) / sigma) ** 2)
  )
}

function countBy(items, getKey) {
  const counts = new Map()

  for (const item of items) {
    const key = getKey(item)
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export function buildLatenessDistribution(contacts) {
  const allNighters = contacts.filter((contact) =>
    contact.latestAwake?.toLowerCase().includes('all night'),
  ).length

  const minutes = contacts
    .map((contact) => parseLatestAwake(contact.latestAwake))
    .filter((value) => value > 0 && value < 10_000)
    .map(toOvernightMinutes)

  if (minutes.length === 0) {
    return {
      bins: [],
      curvePoints: [],
      maxHistogram: 1,
      maxCurve: 1,
      meanMinutes: 0,
      sigmaMinutes: 0,
      allNighters,
      sampleSize: 0,
      binWidth: 30,
    }
  }

  const min = Math.min(...minutes)
  const max = Math.max(...minutes)
  const binWidth = 60
  const binStart = Math.floor(min / binWidth) * binWidth
  const binEnd = Math.ceil(max / binWidth) * binWidth + binWidth
  const binCount = Math.max(1, Math.round((binEnd - binStart) / binWidth))

  const bins = Array.from({ length: binCount }, (_, index) => {
    const start = binStart + index * binWidth
    const end = start + binWidth
    const count = minutes.filter(
      (value) => value >= start && value < end,
    ).length

    return {
      start,
      end,
      center: start + binWidth / 2,
      label: formatMinutesAsHourLabel(start),
      preciseLabel: formatMinutesAsTime(start),
      count,
    }
  })

  const mu = mean(minutes)
  const sigma = standardDeviation(minutes)
  const n = minutes.length
  const curvePoints = []
  const step = binWidth / 4

  for (let x = binStart; x <= binEnd; x += step) {
    // Scale PDF to expected histogram counts so the curve sits on the bars.
    curvePoints.push({
      x,
      y: normalPdf(x, mu, sigma) * n * binWidth,
    })
  }

  const maxHistogram = Math.max(...bins.map((bin) => bin.count), 1)
  const maxCurve = Math.max(...curvePoints.map((point) => point.y), maxHistogram)

  return {
    bins,
    curvePoints,
    maxHistogram,
    maxCurve,
    meanMinutes: mu,
    sigmaMinutes: sigma,
    allNighters,
    sampleSize: minutes.length,
    binWidth,
  }
}

export function buildMissedClassBars(contacts) {
  const buckets = new Map()

  for (const contact of contacts) {
    const days = parseMissedClass(contact.missedClass)
    const bucketDays = Math.round(days * 2) / 2
    const existing = buckets.get(bucketDays) ?? {
      days: bucketDays,
      count: 0,
      names: [],
    }
    existing.count += 1
    if (contact.name) existing.names.push(contact.name)
    buckets.set(bucketDays, existing)
  }

  return [...buckets.values()]
    .map((bucket) => ({
      ...bucket,
      label: formatAttendanceBucketLabel(bucket.days),
    }))
    .sort((a, b) => a.days - b.days)
}

function formatAttendanceBucketLabel(days) {
  if (days === 0) return '0 days'
  if (days === 0.5) return '½ day'
  if (days === 1) return '1 day'
  return `${days} days`
}

export function findTopClassMisser(contacts) {
  return contacts
    .map((contact) => ({
      name: contact.name || 'Unknown',
      days: parseMissedClass(contact.missedClass),
      label: contact.missedClass?.trim() || '0',
    }))
    .sort((a, b) => b.days - a.days || a.name.localeCompare(b.name))[0]
}


export function buildCollegeBars(contacts) {
  return countBy(contacts, (contact) => getShortSchoolName(contact.college))
}

const MAJOR_BUCKETS = [
  { label: 'CS / AI / ML', test: /\b(cs|computer|ai|ml|software)\b/i },
  { label: 'Math / Stats', test: /\b(math|statistics|stat|data science)\b/i },
  { label: 'Physics', test: /\bphysics\b/i },
  { label: 'Engineering', test: /\b(engineering|ee|mechanical|biomed|cam)\b/i },
  { label: 'Finance / Econ / Biz', test: /\b(finance|econ|business|management|applied economics)\b/i },
  { label: 'Bio / Pre-Med', test: /\b(bio|pre-?med|biology)\b/i },
  { label: 'Undecided', test: /\bundecided\b/i },
]

export function categorizeMajor(major) {
  if (!major?.trim()) return 'Mystery major'
  for (const bucket of MAJOR_BUCKETS) {
    if (bucket.test.test(major)) return bucket.label
  }
  return 'Other chaos'
}

export function buildMajorBars(contacts) {
  return countBy(contacts, (contact) => categorizeMajor(contact.major))
}

const DREAM_JOB_BUCKETS = [
  {
    id: 'quant',
    label: 'Quant',
    emoji: '📈',
    test: /\bquant\b/i,
  },
  {
    id: 'swe',
    label: 'SWE / Eng',
    emoji: '💻',
    test: /\b(swe|software|engineer|engineering|ml)\b/i,
  },
  {
    id: 'founder',
    label: 'Founder',
    emoji: '🚀',
    test: /\b(founder|startup|entrepren|yc|anthropic)\b/i,
  },
  {
    id: 'finance',
    label: 'IB / Consulting',
    emoji: '💼',
    test: /\b(ib\b|consult|jp morgan|finance|nepotism)\b/i,
  },
  {
    id: 'doctor',
    label: 'Doctor',
    emoji: '🩺',
    test: /\b(doctor|med|pre-?med)\b/i,
  },
  {
    id: 'academia',
    label: 'Academia',
    emoji: '🎓',
    test: /\b(professor|academia|research|teaching)\b/i,
  },
  {
    id: 'pm',
    label: 'PM / Product',
    emoji: '🧩',
    test: /\b(product|pm)\b/i,
  },
  {
    id: 'creative',
    label: 'Creative',
    emoji: '🎨',
    test: /\b(author|fashion|tiktok|design|shakespeare)\b/i,
  },
  {
    id: 'vibes',
    label: 'Vibes only',
    emoji: '😴',
    test: /\b(sleep|comfortably|chicken farmer|work life)\b/i,
  },
  {
    id: 'unclear',
    label: 'Still figuring it out',
    emoji: '🤷',
    test: /\b(idk|no idea|none|anything|money)\b/i,
  },
]

export function categorizeDreamJob(dreamJob) {
  if (!dreamJob?.trim()) {
    return DREAM_JOB_BUCKETS.find((bucket) => bucket.id === 'unclear')
  }

  for (const bucket of DREAM_JOB_BUCKETS) {
    if (bucket.test.test(dreamJob)) return bucket
  }

  return {
    id: 'other',
    label: 'Wildcard',
    emoji: '✨',
  }
}

export function buildDreamJobHeatmap(contacts) {
  const buckets = [
    ...DREAM_JOB_BUCKETS,
    { id: 'other', label: 'Wildcard', emoji: '✨' },
  ]

  const counts = Object.fromEntries(buckets.map((bucket) => [bucket.id, 0]))
  const examples = Object.fromEntries(buckets.map((bucket) => [bucket.id, []]))

  for (const contact of contacts) {
    const bucket = categorizeDreamJob(contact.dreamJob)
    counts[bucket.id] = (counts[bucket.id] ?? 0) + 1
    if (examples[bucket.id]?.length < 3 && contact.name) {
      examples[bucket.id].push(contact.name.split(/\s+/)[0])
    }
  }

  const max = Math.max(...Object.values(counts), 1)

  return buckets
    .map((bucket) => ({
      ...bucket,
      count: counts[bucket.id] ?? 0,
      intensity: (counts[bucket.id] ?? 0) / max,
      examples: examples[bucket.id] ?? [],
    }))
    .filter((bucket) => bucket.count > 0 || ['unclear', 'quant', 'founder'].includes(bucket.id))
    .sort((a, b) => b.count - a.count)
}

export function buildFruitBars(contacts) {
  return countBy(contacts, (contact) => {
    const fruit = contact.fruit?.trim()
    if (!fruit) return null
    return fruit.replace(/^serena says\s+/i, '')
  })
}

export function buildFunnyHighlights(contacts) {
  if (contacts.length === 0) {
    return []
  }

  const lateness = buildLatenessDistribution(contacts)
  const topMisser = findTopClassMisser(contacts)
  const fruits = buildFruitBars(contacts)
  const colleges = buildCollegeBars(contacts)
  const topFruit = fruits[0]
  const topCollege = colleges[0]
  const allNighterRate = Math.round(
    (lateness.allNighters / contacts.length) * 100,
  )

  return [
    {
      label: 'Night owl mean bedtime',
      value: formatMinutesAsTime(Math.round(lateness.meanMinutes)),
      detail: `${lateness.allNighters} certified all-nighter${lateness.allNighters === 1 ? '' : 's'}`,
    },
    {
      label: 'Class skip champion',
      value: topMisser?.name?.split(/\s+/)[0] || '—',
      detail: topMisser ? `${topMisser.label} day(s) missed` : 'Everyone showed up?!',
    },
    {
      label: 'Campus hive',
      value: topCollege?.label || '—',
      detail: topCollege ? `${topCollege.count} AMP member${topCollege.count === 1 ? '' : 's'}` : '',
    },
    {
      label: 'Spirit fruit',
      value: topFruit?.label || '—',
      detail: topFruit ? `${topFruit.count} people claim this` : '',
    },
    {
      label: 'All-nighter rate',
      value: `${allNighterRate}%`,
      detail: 'of the cohort has seen sunrise from the wrong side',
    },
  ]
}
