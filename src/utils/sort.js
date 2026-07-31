import { parseLatestAwake, parseMissedClass } from './stats.js'

export const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'latest-awake-desc', label: 'Latest stayed up (latest first)' },
  { value: 'latest-awake-asc', label: 'Latest stayed up (earliest first)' },
  { value: 'missed-class-desc', label: 'Most missed class' },
  { value: 'missed-class-asc', label: 'Least missed class' },
  { value: 'birthdate-asc', label: 'Birthdate (oldest first)' },
  { value: 'birthdate-desc', label: 'Birthdate (youngest first)' },
  { value: 'college-asc', label: 'School (A–Z)' },
  { value: 'major-asc', label: 'Intended major (A–Z)' },
  { value: 'hometown-asc', label: 'Hometown (A–Z)' },
]

function compareStrings(a, b) {
  return a.localeCompare(b, undefined, { sensitivity: 'base' })
}

function compareNumbers(a, b) {
  return a - b
}

const SORT_COMPARATORS = {
  'name-asc': (a, b) => compareStrings(a.name, b.name),
  'name-desc': (a, b) => compareStrings(b.name, a.name),
  'latest-awake-desc': (a, b) =>
    compareNumbers(parseLatestAwake(b.latestAwake), parseLatestAwake(a.latestAwake)),
  'latest-awake-asc': (a, b) =>
    compareNumbers(parseLatestAwake(a.latestAwake), parseLatestAwake(b.latestAwake)),
  'missed-class-desc': (a, b) =>
    compareNumbers(parseMissedClass(b.missedClass), parseMissedClass(a.missedClass)),
  'missed-class-asc': (a, b) =>
    compareNumbers(parseMissedClass(a.missedClass), parseMissedClass(b.missedClass)),
  'birthdate-asc': (a, b) => compareNumbers(a.birthdateSort, b.birthdateSort),
  'birthdate-desc': (a, b) => compareNumbers(b.birthdateSort, a.birthdateSort),
  'college-asc': (a, b) => compareStrings(a.college, b.college),
  'major-asc': (a, b) => compareStrings(a.major, b.major),
  'hometown-asc': (a, b) => compareStrings(a.hometown, b.hometown),
}

export function sortContacts(contacts, sortKey) {
  const compare = SORT_COMPARATORS[sortKey] ?? SORT_COMPARATORS['name-asc']
  return [...contacts].sort(compare)
}
