# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:4321/Trump-Accounts/)
npm run build        # Production build (fetches live Yahoo Finance data)
npm run preview      # Preview production build locally
npx vitest           # Run all tests
npx vitest run src/lib/calculator.test.ts   # Run a single test file
```

Node >= 22.12.0 required.

## Deploy

GitHub Pages via `.github/workflows/deploy.yml` — triggers on push to `master`. Base URL is `/Trump-Accounts` (configured in `astro.config.mjs`). All local dev URLs must include this base path.

## Architecture

### Build-time data pipeline

`pages/index.astro` frontmatter fetches S&P 500 monthly data (1950–present) from Yahoo Finance at build time using `yahoo-finance2`. It computes `monthlyMean` and `monthlyVol`, then passes them as props to the client-side Calculator. Hardcoded fallbacks exist if the fetch fails.

### Monte Carlo engine + web worker

`lib/calculator.ts` runs 1,000 simulated paths × birth-year-derived years × 12 monthly compounds using Box-Muller normal draws. The Calculator component offloads this to `workers/calculator.worker.ts` via a Web Worker with request-ID deduplication — if new inputs arrive before the previous run finishes, the old worker is terminated.

### Two-layer CA tax overlay

Tax analysis is a post-hoc transformation applied per scatter point, not part of the core simulation:
- **Layer 1** (always on): CA nonconformity tax on employer contributions (`caTaxCalculator.ts` → `californiaIncrementalTax`)
- **Layer 2** (toggleable): annual kiddie-tax vs. terminal lump-sum distribution tax. Pathwise CA kiddie-tax (`pathwiseCaKiddieTax`) uses the full year-by-year balance trajectory from `Float64Array` for non-linear bracket computation.

All 2025 tax parameters live in `lib/taxConstants.ts`.

### Contribution cap enforcement

`capContributions()` in `caTaxCalculator.ts` enforces the $5K total / $2.5K employer caps. Every code path that processes contribution amounts must go through this function.

### Tuition toggle

Calculator has an `includeTuition` toggle (default OFF). When OFF, all tuition-dependent UI is hidden (university selector, success rate, tuition reference lines, success/shortfall coloring). The toggle is purely presentational — it does not change the simulation.

### Rendering strategies

- Calculator: `client:only="react"` — fully client-side, no SSR
- BeyondTrumpAccounts: `client:visible` — lazy-loads on scroll
- Hero: `client:load` — hydrates immediately; preview numbers are computed at build time via `simulateCollegeSavings()`

## Key constraints

- **Never modify the calculator algorithm** (`lib/calculator.ts`) without explicit user request.
- **Tax constants are centralized** in `lib/taxConstants.ts` — don't scatter magic numbers.
- The dev server base path is `/Trump-Accounts/` — bare `localhost:4321/` returns 404.
