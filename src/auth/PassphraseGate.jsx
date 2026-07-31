import { useState } from 'react'
import './PassphraseGate.css'

const STORAGE_KEY = 'amp-directory-unlocked'
const PASSPHRASE =
  (import.meta.env.VITE_PASSPHRASE || 'iguessbro').trim().toLowerCase()

function readUnlocked() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function clearUnlock() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

function persistUnlock() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // ignore
  }
}

export default function PassphraseGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => readUnlocked())
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    if (value.trim().toLowerCase() === PASSPHRASE) {
      persistUnlock()
      setUnlocked(true)
      setError('')
      return
    }
    setError('Wrong passphrase. Try again.')
  }

  function lock() {
    clearUnlock()
    setUnlocked(false)
    setValue('')
    setError('')
  }

  if (!unlocked) {
    return (
      <section className="passphrase-gate" aria-labelledby="passphrase-title">
        <h1 id="passphrase-title">AMP Contact Database</h1>
        <p className="passphrase-lead">Enter the cohort passphrase to continue.</p>
        <form className="passphrase-form" onSubmit={handleSubmit}>
          <label className="passphrase-label" htmlFor="passphrase-input">
            Passphrase
          </label>
          <input
            id="passphrase-input"
            className="passphrase-input"
            type="password"
            autoComplete="current-password"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            required
          />
          <button className="passphrase-button" type="submit">
            Unlock
          </button>
        </form>
        {error && (
          <p className="passphrase-error" role="alert">
            {error}
          </p>
        )}
      </section>
    )
  }

  return children({ lock })
}
