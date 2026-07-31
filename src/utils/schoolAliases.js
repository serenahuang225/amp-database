const SCHOOL_ALIAS_GROUPS = [
  {
    patterns: ['massachusetts institute of technology'],
    aliases: ['mit'],
    shortName: 'MIT',
  },
  {
    patterns: ['washington university in st. louis', 'washington university in st louis'],
    aliases: ['washu', 'wustl'],
    shortName: 'WashU',
  },
  {
    patterns: ['carnegie mellon university', 'carnegie mellon'],
    aliases: ['cmu'],
    shortName: 'CMU',
  },
  {
    patterns: ['stanford university'],
    aliases: ['stanford'],
    shortName: 'Stanford',
  },
  {
    patterns: ['university of california berkeley', 'university of california in berkeley'],
    aliases: ['uc berkeley', 'berkeley', 'cal'],
    shortName: 'Berkeley',
  },
  {
    patterns: ['university of california in los angeles', 'university of california los angeles'],
    aliases: ['ucla'],
    shortName: 'UCLA',
  },
  {
    patterns: ['university of california davis'],
    aliases: ['uc davis', 'ucd'],
    shortName: 'UC Davis',
  },
  {
    patterns: ['university of pennsylvania'],
    aliases: ['upenn', 'penn'],
    shortName: 'UPenn',
  },
  {
    patterns: ['university of texas at austin'],
    aliases: ['ut austin', 'utaustin'],
    shortName: 'UT Austin',
  },
  {
    patterns: ['university of virginia'],
    aliases: ['uva'],
    shortName: 'UVA',
  },
  {
    patterns: ['university of wisconsin in madison', 'university of wisconsin-madison'],
    aliases: ['uw madison', 'wisconsin', 'uw'],
    shortName: 'UW–Madison',
  },
  {
    patterns: ['university of pittsburgh'],
    aliases: ['pitt'],
    shortName: 'Pitt',
  },
  {
    patterns: ['university of florida'],
    aliases: ['uf'],
    shortName: 'UF',
  },
  {
    patterns: ['university of georgia'],
    aliases: ['uga'],
    shortName: 'UGA',
  },
  {
    patterns: ['stony brook university'],
    aliases: ['stony brook', 'sbu'],
    shortName: 'Stony Brook',
  },
  {
    patterns: ['brown university'],
    aliases: ['brown'],
    shortName: 'Brown',
  },
  {
    patterns: ['cornell university'],
    aliases: ['cornell'],
    shortName: 'Cornell',
  },
  {
    patterns: ['georgetown university'],
    aliases: ['georgetown', 'gtown'],
    shortName: 'Georgetown',
  },
  {
    patterns: ['rice university'],
    aliases: ['rice'],
    shortName: 'Rice',
  },
  {
    patterns: ['princeton university'],
    aliases: ['princeton'],
    shortName: 'Princeton',
  },
  {
    patterns: ['columbia university'],
    aliases: ['columbia'],
    shortName: 'Columbia',
  },
  {
    patterns: ['duke university'],
    aliases: ['duke'],
    shortName: 'Duke',
  },
]

export function getSchoolSearchTerms(college) {
  if (!college) return []

  const normalized = college.toLowerCase().trim()

  for (const group of SCHOOL_ALIAS_GROUPS) {
    if (group.patterns.some((pattern) => normalized.includes(pattern))) {
      return group.aliases
    }
  }

  return []
}

export function getShortSchoolName(college) {
  if (!college?.trim()) return 'Unknown'

  const normalized = college.toLowerCase().trim()

  for (const group of SCHOOL_ALIAS_GROUPS) {
    if (group.patterns.some((pattern) => normalized.includes(pattern))) {
      return group.shortName
    }
  }

  return college.trim()
}
