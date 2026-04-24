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
// 530A account eligibility & pilot seed
// ---------------------------------------------------------------------------
export const ACCOUNT_LAUNCH_YEAR     = 2026; // first year contributions can be made
export const PILOT_SEED_AMOUNT       = 1_000;
export const PILOT_SEED_START_YEAR   = 2025; // first birth year eligible for pilot seed
export const PILOT_SEED_END_YEAR     = 2028; // last birth year eligible for pilot seed

export interface BirthYearEligibility {
  pilotSeedEligible: boolean;
  initialSeed: number;
  /** First calendar year in which contributions can be made. */
  firstContributionYear: number;
  /** Last calendar year of the growth window (child is 17). */
  lastGrowthYear: number;
  /** Calendar year the child turns 18 (account transitions). */
  distributionYear: number;
  /** Number of full calendar years of contributions. 0 if child ages out before launch. */
  contributionYears: number;
  /** false when the child turns 18 before or during the account launch year. */
  eligibleForNewContributions: boolean;
}

export function computeBirthYearEligibility(birthYear: number): BirthYearEligibility {
  const pilotSeedEligible = birthYear >= PILOT_SEED_START_YEAR && birthYear <= PILOT_SEED_END_YEAR;
  const firstContributionYear = Math.max(ACCOUNT_LAUNCH_YEAR, birthYear);
  const lastGrowthYear = birthYear + 17;
  const distributionYear = birthYear + 18;
  const contributionYears = Math.max(0, lastGrowthYear - firstContributionYear + 1);
  const eligibleForNewContributions = contributionYears > 0;
  return {
    pilotSeedEligible,
    initialSeed: pilotSeedEligible ? PILOT_SEED_AMOUNT : 0,
    firstContributionYear,
    lastGrowthYear,
    distributionYear,
    contributionYears,
    eligibleForNewContributions,
  };
}

// ---------------------------------------------------------------------------
// California high-income surtax
// ---------------------------------------------------------------------------
export const CA_BHST_THRESHOLD = 1_000_000;
export const CA_BHST_RATE      = 0.01;
