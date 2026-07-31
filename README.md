# AMP Contact Database

Cohort directory + stats. Soft-locked with a shared passphrase (default: `iguessbro`).

## Run

```bash
npm install
npm run dev
```

Optional: set `VITE_PASSPHRASE` in a `.env` file to override the default passphrase.

## Notes

This is a **UI gate only** — `public/contacts.csv` is still fetchable if someone knows the URL. It keeps casual visitors out; it is not real auth.
