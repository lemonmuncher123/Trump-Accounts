/**
 * 2025 Federal + California tax constants — single source of truth.
 *
 * Both Calculator.tsx and caTaxCalculator.ts import from here so that
 * any year-over-year update only requires a change in one place.
 *
 * Sources:
 *   IRS Rev. Proc. 2024-40  — 2025 inflation adjustments
 *   IRC §530A / §128        — Trump Account statutory caps
 *   CA FTB 2025 rate tables — California brackets
 */

// ---------------------------------------------------------------------------
// Kiddie-tax thresholds (IRS Rev. Proc. 2024-40, 2025 amounts)
// $1,300 was the 2024 figure; 2025 is $1,350 each band.
// ---------------------------------------------------------------------------
export const KIDDIE_TAX_EXEMPT     = 1_350; // unearned income below this: no kiddie tax
export const KIDDIE_TAX_CHILD_BAND = 1_350; // next band: taxed at child's own rate
export const KIDDIE_TAX_CHILD_RATE = 0.01;  // CA lowest bracket (used for child band)

// ---------------------------------------------------------------------------
// Realization rate — passive buy-and-hold S&P 500 index fund (~2–5%)
// ---------------------------------------------------------------------------
export const REALIZATION_RATE = 0.05;

// ---------------------------------------------------------------------------
// Trump Account statutory limits (IRC §530A / §128)
// ---------------------------------------------------------------------------
export const FEDERAL_EMPLOYER_EXCLUSION_CAP = 2_500; // §128 annual exclusion cap
export const TRUMP_ACCOUNT_ANNUAL_CAP       = 5_000; // total annual contribution cap

// ---------------------------------------------------------------------------
// California high-income surtax
// ---------------------------------------------------------------------------
export const CA_BHST_THRESHOLD = 1_000_000;
export const CA_BHST_RATE      = 0.01;
