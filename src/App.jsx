import { useEffect, useMemo, useState } from 'react'
import Card from './Card.jsx'
import PassphraseGate from './auth/PassphraseGate.jsx'
import StatsPage from './pages/StatsPage.jsx'
import {
  matchesContactSearch,
  normalizeContact,
  parseContactsCsv,
} from './utils/csv.js'
import { SORT_OPTIONS, sortContacts } from './utils/sort.js'
import './App.css'

function DirectoryApp({ lock }) {
  const [contacts, setContacts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name-asc')
  const [view, setView] = useState('directory')

  useEffect(() => {
    fetch('/contacts.csv')
      .then((response) => response.text())
      .then((text) => {
        const rows = parseContactsCsv(text)
        setContacts(rows.map(normalizeContact))
      })
  }, [])

  const displayedContacts = useMemo(() => {
    const filtered = contacts.filter((contact) =>
      matchesContactSearch(contact, searchQuery),
    )
    return sortContacts(filtered, sortBy)
  }, [contacts, searchQuery, sortBy])

  const trimmedQuery = searchQuery.trim()

  return (
    <>
      <section id="center">
        <h1>AMP Contact Database</h1>
        <p>Get to know everyone at AMP</p>
        <div className="session-bar">
          <button type="button" className="session-sign-out" onClick={lock}>
            Lock
          </button>
        </div>
        <nav className="app-nav" aria-label="Main">
          <button
            type="button"
            className={`app-nav-button${view === 'directory' ? ' active' : ''}`}
            onClick={() => setView('directory')}
          >
            Directory
          </button>
          <button
            type="button"
            className={`app-nav-button${view === 'stats' ? ' active' : ''}`}
            onClick={() => setView('stats')}
          >
            Stats
          </button>
        </nav>
        {view === 'directory' && (
          <div className="toolbar">
            <div className="search-bar">
              <input
                type="search"
                className="search-input"
                placeholder="Search by name, school, major..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Search contacts"
              />
              {trimmedQuery && (
                <p className="search-results">
                  {displayedContacts.length} result
                  {displayedContacts.length === 1 ? '' : 's'}
                </p>
              )}
            </div>
            <div className="sort-control">
              <label className="sort-label" htmlFor="sort-select">
                Sort by
              </label>
              <select
                id="sort-select"
                className="sort-select"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </section>

      <div className="ticks"></div>

      {view === 'directory' ? (
        <section className="card-grid">
          {displayedContacts.length > 0 ? (
            displayedContacts.map((contact, index) => (
              <Card key={contact.name || index} data={contact} />
            ))
          ) : (
            <p className="search-empty">
              No contacts match &ldquo;{trimmedQuery}&rdquo;
            </p>
          )}
        </section>
      ) : (
        <StatsPage contacts={contacts} />
      )}

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

function App() {
  return (
    <PassphraseGate>
      {({ lock }) => <DirectoryApp lock={lock} />}
    </PassphraseGate>
  )
}

export default App
