# Build notes

Kept phase-by-phase for the AI build log. Each entry says what was built and any decision or trade-off worth knowing about.

## Phase 1 — Setup, Blade, PhoneFrame, data

**Scaffold.** `npm create vite@latest . -- --template react-ts`. Removed the template's default assets/styles since Blade owns the visual system.

**Blade installation — two real peer-dependency issues, both resolved, neither a reason to abandon Blade:**

1. **React version ceiling.** Blade's own `peerDependencies` say `react: ">=18"`, but its transitive dependency `@razorpay/i18nify-react@4.0.12` peer-requires `react: "^18.2.0"` — no release of it supports React 19 yet. Vite's react-ts template installs React 19 by default. Fix: pinned `react`/`react-dom`/`@types/react`/`@types/react-dom` to `^18.2.0` before installing Blade. This is the standard fix (match the library's supported range), not a workaround of Blade itself.
2. **React Native peer chain leaking into a web-only install.** `@razorpay/blade` depends on `@floating-ui/react-native` (used internally for cross-platform floating elements), which peer-requires `react-native`, which in turn wants a React 19-range React — a conflict that has nothing to do with how we're using Blade (web only, no RN code path touched). `npm install ... --legacy-peer-deps` is the standard, expected resolution for exactly this situation (a cross-platform library's native peer graph vs. a web-only consumer) and is well short of "Blade can't be set up."

Confirmed installed package: `@razorpay/blade@12.127.0`. Peer deps actually installed: `styled-components@5.3.11`, `@razorpay/i18nify-js@^1.12.3`, `@razorpay/i18nify-react@^4.0.12`, `framer-motion@11.13.3` (per the installed version's real `peerDependencies`, not the doc page's stale pinned versions — Blade's docs page pins `@razorpay/i18nify-js@1.9.3`/`i18nify-react@4.0.8`, which are no longer what the current Blade release actually requires).

**Deploy fix: `.npmrc`.** The `--legacy-peer-deps` flag above was only ever passed on the command line during local setup, so it got baked into `package-lock.json` but not into anything a fresh clone would honor — Netlify's `npm ci` hit the exact same `@floating-ui/react-native` → `react-native@^0.72` → `react@18.2.0` conflict (against the resolved `react@18.3.1`) and failed the build. Fixed by committing `.npmrc` with `legacy-peer-deps=true`, so every install — Netlify's, a fresh clone, CI — picks it up automatically instead of relying on a one-off local flag. Verified by deleting `node_modules` and running `npm ci` (no explicit flag) followed by `npm run build`, both clean.

**Verified working**, not just "installed": wrapped a minimal `App.tsx` (`Box`, `Heading`, `Text`, `Amount`, `Button`) in `BladeProvider` with `bladeTheme`, ran it in a real headless browser, confirmed zero console/page errors and that it rendered with real Blade styling (Razorpay blue button, proper `₹14,600.00` currency formatting via the `Amount` component) — screenshotted at both desktop and 390px-mobile viewport sizes.

**Entry points.** Blade's package exports `@razorpay/blade/components` (all components, `BladeProvider`, `Theme` type) and `@razorpay/blade/tokens` (`bladeTheme`, `bladeNeutralTheme`). Fonts via a single `import '@razorpay/blade/fonts.css'` in `main.tsx` — no Google Fonts or other network dependency, the font files ship in the npm package.

**TypeScript.** Added `resolveJsonModule: true` (needed for the data loader) and a `styled.d.ts` extending styled-components' `DefaultTheme` with Blade's `Theme` type, per Blade's own installation docs.

**PhoneFrame.** A styled-components wrapper, not a Blade component (Blade doesn't have one — it's product UI, not device chrome). Desktop: centered 390×844 frame with a notch, dark backdrop, rounded + shadowed like a phone — built for screen recording the demo. At `max-width: 480px` (an actual phone) all of that chrome disables itself via a media query, so the app is just the page, edge to edge. No JS viewport detection needed.

**Synthetic data.** Seven JSON files in `src/data/`, typed via `src/types/index.ts`. Decisions:

- **Dates are real dates**, not relative offsets — the PRD's own story and "today" both land on 4 Oct 2026, so bill dates (Sep 2026) and the Mehta bill (19 Aug 2026 → 46 days old, PRD says "~45") work out correctly without any fake-clock logic.
- **2 extra open bills** (`V-120`, `K-315`) beyond the 10 implied by the five required scenarios, specifically to hit the spec's exact "12 open bills from 5 customers loaded; 3 already-paid bills skipped" summary text. They're untouched by any event — they exist so the customer dues view has something beyond just the matched bills, and so the 12/3 split is real rather than coincidental.
- **`ai_outputs.json` is keyed by event ID**, not an array, and an event's `eventId` is literally the same ID used in its source record (the Razorpay payment's `id`, the bank statement line's `id`, or the voice note's `id`). One lookup, no secondary join table.
- **Overdue bills (Mehta) are *not* in `ai_outputs.json`.** Unlike payer identification or deduction flagging, "this bill is 45 days old" isn't an AI judgment — it's arithmetic on `bill.date` vs. today. It'll be computed directly by a selector in Phase 2, off the bill data alone, rather than faked as a pre-computed "AI output" it never needed to be.
- **Confidence vs. status are separate axes**, deliberately. Verma's cash entry is `confidence: "high"` (the transcript clearly says "Verma") but `status: "needs_confirmation"` anyway — cash always needs a human nod, regardless of how confident the extraction is. RAJESH K is `confidence: "medium"` and `needs_confirmation` for a different reason — genuine identity uncertainty. Both land in "Needs you" in Phase 2's decision list, but the copy/reasoning shown should read differently, which the data already supports.

**Validation.** `scripts/validate-data.mjs` — a plain Node script (no test framework needed for one-off data validation) that checks cross-references (bills → real customers, allocations → real bills), allocation arithmetic (`amountApplied + remainingOnBill === bill.amount`, `sum(amountApplied) === event.amount`), and the specific numbers the PRD calls out by name (Sharma's split, Kapoor's exact match, Verma's remaining ₹2,000, Gupta's ₹400 short flag, Mehta's day count). Caught one real bug in the script's own check logic during authoring (conflating "short by" with "unapplied") — left as a reminder to re-run this after any data edit, since hand-authoring JSON is exactly where this kind of arithmetic slip happens.

**Not yet built** (Phase 2+): `state/AppStateContext.tsx`, any of the 8 screens, the "agent thinking" delay component, navigation.

**Known trade-off:** `npm run build` warns about an ~880 KB JS bundle — Blade's component barrel is large and nothing is code-split yet. Not a concern for a prototype served locally/from a single page, but worth a per-screen `React.lazy()` pass in Phase 5 polish if bundle size matters for the final submission.
