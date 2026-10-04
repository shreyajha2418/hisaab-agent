# Hisaab Agent — prototype

A clickable prototype of **Hisaab Agent**, built for the Razorpay AI PM Build Challenge (Track 2). It's an AI agent that works out who paid, which bills a payment clears, and flags short payments for a small B2B merchant who sells on credit — built around one persona (Aman, a pharma distributor in Lucknow) and one day of his business.

See `Hisaab_Agent___PRD.md` (or your own copy of the PRD) for the full product story. This repo is the prototype only.

## Running it

```bash
npm install
npm run dev
```

Open the printed `localhost` URL. On a desktop browser the app renders centered in a phone frame (for screen recording); on an actual phone it's full-width with no chrome.

```bash
npm run build     # type-check + production build
npm run lint       # oxlint
npm run preview    # preview the production build locally
```

## What this is (and isn't)

- **No real AI calls, no API keys.** Every "agent" output — who paid, which bills, the reasoning text, the confidence level, the short-payment flag — is pre-computed in `src/data/ai_outputs.json` and played back with a short delay so it feels live. The shapes are realistic (see `src/types/`) so the pre-computed lookup could be swapped for a real model call later without changing any screen.
- **No backend, no database.** Everything lives in synthetic JSON (`src/data/`) and in-memory React state (`src/state/`). A "Reset demo" control restores the starting state.
- **One fictional merchant, five fictional customers.** None of the names, numbers or bank/UPI details are real.

## Stack

React + Vite + TypeScript + [Blade](https://blade.razorpay.com) (`@razorpay/blade`), Razorpay's own design system, so the prototype actually looks like a Razorpay product rather than a generic mockup.

### A note on the React version

Blade's `@razorpay/i18nify-react` peer dependency currently caps at React 18 (`^18.2.0`), so this project pins React to 18 rather than Vite's React 19 default. Installing Blade itself also needs `--legacy-peer-deps` once, because its React Native peer chain (`@floating-ui/react-native` → `react-native`) conflicts with a web-only install even though none of that code is used here. Both are documented in `BUILD_NOTES.md`.

## Project structure

```
src/
  data/        synthetic JSON (customers, bills, payments, bank statement,
               voice note, pre-computed AI outputs) + a typed loader
  types/       TypeScript interfaces for all of the above
  state/       in-memory app state (React context), Reset demo
  components/  PhoneFrame and other shared UI pieces
  screens/     the 8 MVP screens
scripts/
  validate-data.mjs   one-off consistency check for the synthetic data
                       (cross-references, allocation math) — not part of
                       the build; run with `node scripts/validate-data.mjs`
```

## Prototype disclosure

The app itself includes a small note (in a settings/about sheet) saying: *"Prototype: AI outputs are pre-computed from synthetic data."*

## Demo script (90 seconds)

Maps the PRD's own demo-moments table to actual taps in this build. Reset demo (Settings → Demo) before each recording take.

| Time | Beat | What to do |
| --- | --- | --- |
| 0–15s | The problem | Open on Home — "Today", 3 decisions waiting, money in from three channels, nothing recorded by hand |
| 15–30s | Cash voice note | Home → **Add cash** → Record voice note → transcript "Verma ne 8000 cash diye" appears → Match it → Review match → shows ₹2,000 left pending on V-108 |
| 30–45s | Payer identification, learning | Decisions → tap **RAJESH K** → "Yes, this is Gupta Pharmacy" → toast "Remembered…" fires, title updates |
| 45–65s | Recovery (deduction) | Same screen, now confirmed → the ₹400 short-payment flag is live → **Question it** → drafted message appears |
| 65–80s | Morning decision list, two minutes | Back to Decisions — Sharma, Kapoor, Verma and Gupta Pharmacy all sit under "Done automatically"; Mehta Medicos shows 46 days overdue under "Needs you" |
| 80–90s | Close | Decisions → tap **Mehta Medicos** → dues view: ₹18,500, 46 days, Overdue badge — the number Aman now has going into collections |

## Status

All 8 MVP screens are built: Home, Add cash, Upload bills, Decision list, Match detail, Customer dues, Settings (Memory + Reset demo), and the payer-confirmation + deduction-flag flow inside Match detail. See `BUILD_NOTES.md` for what was built each phase and the trade-offs behind it.
