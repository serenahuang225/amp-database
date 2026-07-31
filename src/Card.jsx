import './Card.css'
import FavoriteSong from './components/FavoriteSong.jsx'
import { resolveLinkedIn } from './utils/social.js'

const FRUIT_EMOJI = {
  mango: '🥭',
  mangosteen: '🫐',
  kiwi: '🥝',
  pomegranate: '🍎',
  blueberry: '🫐',
  'dragon fruit': '🍈',
  dragonfruit: '🍈',
  orange: '🍊',
  strawberry: '🍓',
  peach: '🍑',
  banana: '🍌',
  pineapple: '🍍',
  durian: '🥭',
  passionfruit: '🍇',
  pear: '🍐',
  tomato: '🍅',
  apple: '🍎',
  lychee: '🍒',
  fig: '🫒',
  chikoo: '🍈',
  'lime/grapefruit': '🍋',
  bearberry: '🫐',
  'serena says strawberry mango': '🥭',
}

function getFruitEmoji(fruit) {
  if (!fruit) return '🍎'
  const key = fruit.toLowerCase().trim()
  return FRUIT_EMOJI[key] || '🍎'
}

function hasSocialValue(value) {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return false
  if (normalized === 'none') return false
  if (normalized.includes('none as of')) return false
  return true
}

function InfoRow({ label, value }) {
  if (!value?.trim()) return null

  return (
    <div className="card-row">
      <span className="card-label">{label}</span>
      <span className="card-value">{value}</span>
    </div>
  )
}

function SocialIcon({ href, icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="card-social-icon"
      aria-label={label}
      title={label}
    >
      <svg className="card-social-svg" role="presentation" aria-hidden="true">
        <use href={`/icons.svg#${icon}`} />
      </svg>
    </a>
  )
}

const Card = ({ data }) => {
  const instagram = data.instagram?.trim().replace(/^@/, '')
  const github = data.github?.trim()
  const linkedin = resolveLinkedIn(data.linkedin)
  const phone = data.phone?.trim()

  const subtitle = [data.college, data.major].filter(Boolean).join(' · ')

  return (
    <article className="card">
      <header className="card-header">
        <div className="card-header-text">
          <h2 className="card-name">{data.name}</h2>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
        {data.fruit && (
          <div className="card-fruit">
            <span className="card-fruit-emoji" aria-hidden="true">
              {getFruitEmoji(data.fruit)}
            </span>
            <span className="card-fruit-name">{data.fruit}</span>
          </div>
        )}
      </header>

      <div className="card-body">
        <InfoRow label="Hometown" value={data.hometown} />
        <InfoRow label="Birthdate" value={data.birthdate} />
        <InfoRow label="Ethnicity" value={data.ethnicity} />
        <InfoRow label="Dream job" value={data.dreamJob} />
        <FavoriteSong song={data.favoriteSong} />
        <InfoRow label="Latest at AMP" value={data.latestAwake} />
        <InfoRow label="Missed class" value={data.missedClass} />
      </div>

      {data.bio && <blockquote className="card-bio">{data.bio}</blockquote>}

      {(hasSocialValue(instagram) ||
        hasSocialValue(github) ||
        linkedin ||
        phone) && (
        <footer className="card-footer">
          {hasSocialValue(instagram) && (
            <SocialIcon
              href={`https://instagram.com/${instagram}`}
              icon="instagram-icon"
              label={`Instagram: @${instagram}`}
            />
          )}
          {hasSocialValue(github) && (
            <a
              href={`https://github.com/${github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card-social-link"
            >
              GitHub
            </a>
          )}
          {linkedin && (
            <SocialIcon
              href={linkedin.href}
              icon="linkedin-icon"
              label={`LinkedIn: ${linkedin.label}`}
            />
          )}
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, '')}`} className="card-social-link">
              {phone}
            </a>
          )}
        </footer>
      )}
    </article>
  )
}

export default Card
