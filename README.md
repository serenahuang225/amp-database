# AMP Contact Database

Cohort directory + stats. Soft-locked with a shared passphrase.

Accepted passphrases: `iguessbro`, `i guess bro`, or `igb`  
(or set `VITE_PASSPHRASE` in a `.env` file to use a custom one)

## Run

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173) and unlock with the passphrase.

## Notes

This is a **UI gate only** — `public/contacts.csv` is still fetchable if someone knows the URL. It keeps casual visitors out; it is not real auth.
