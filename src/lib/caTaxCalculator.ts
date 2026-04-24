/**
 * California + Trump Account tax comparison model (2025 assumptions)
 *
 * TypeScript port of trump_account_ca_model_v4.py
 *
 * Compares two 18-year paths for the same contribution amount:
 *   1. Baseline taxable account — contributions taxed as ordinary income,
 *      gains taxed annually at LTCG rates (5% realization), and a terminal
 *      LTCG + CA tax applied at year-18 liquidation on unrealized gains.
 *   2. Trump Account (IRC §530A) — employer contributions excluded from
 *      federal income (§128, up to $2,500/yr); CA does NOT conform, so the
 *      full contribution is CA-taxable; growth deferred federally, optionally
 *      taxed annually by CA via kiddie-tax rules; distributions taxed federally
 *      on the non-basis portion at the child's future rate.
 *
 * CA scenario layers (two-tier model):
 *   Layer 1 — Confirmed CA nonconformity (always on):
 *     Employer contributions are CA-taxable (CA ≠ §128).
 *   Layer 2 — CA kiddie-tax scenario (toggle via includeAnnualCaKiddieTax):
 *     ON (conservative): annual CA tax on 5% of Trump Account gains at kiddie-tax rates.
 *     OFF (optimistic): no annual CA kiddie-tax; instead, a terminal CA tax on
 *     accumulated gains is applied at distribution (true deferral model).
 *
 * Contribution semantics:
 *   Inputs represent gross annual compensation earmarked for savings (pre-tax).
 *   - Baseline: pays income tax on contributions, deposits the after-tax remainder.
 *   - Trump Account: deposits the full gross amount (growth is tax-deferred).
 *   The Monte Carlo simulator in calculator.ts also uses the gross amount.
 *   The tax advantage of the Trump Account comes from deferred federal growth and
 *   the §128 employer exclusion; the baseline pays annual LTCG drag and terminal
 *   liquidation taxes.
 *
 * Other fixed assumptions:
 *   - Realization rate 5% (passive buy-and-hold S&P 500 index fund)
 *   - No early withdrawal penalty (education / qualified use)
 *   - No annual CA tax on baseline realized gains beyond LTCG (federal only on 5%)
 *   - CA nonconformity on employer contribution: modeled as always true (pending FTB guidance)
 *   - 2025 CA kiddie tax: $1,350 exempt → $1,350 at 1% child rate → parent rate
 *
 * NOTE on kiddie tax at 5% realization:
 *   Annual realized gain stays well below the $1,350 CA exemption throughout
 *   all 18 years for typical contribution amounts, so effective CA gain tax
 *   during growth is ~$0. This is mathematically correct for a passive
 *   strategy; toggle includeAnnualCaKiddieTax to observe the sensitivity.
 */

import {
  REALIZATION_RATE,
  KIDDIE_TAX_EXEMPT,
  KIDDIE_TAX_CHILD_BAND,
  KIDDIE_TAX_CHILD_RATE,
  FEDERAL_EMPLOYER_EXCLUSION_CAP,
  TRUMP_ACCOUNT_ANNUAL_CAP,
  CA_BHST_THRESHOLD,
  CA_BHST_RATE,
} from './taxConstants';

export type FilingStatus = 'single' | 'mfj' | 'hoh';

// ---------------------------------------------------------------------------
// 2025 California rate schedules — [lower, upper, rate]
// ---------------------------------------------------------------------------
type Bracket = readonly [number, number, number];

const CA_2025_BRACKETS: Readonly<Record<FilingStatus, readonly Bracket[]>> = {
  single: [
    [0,       11079,    0.01],
    [11079,   26264,    0.02],
    [26264,   41452,    0.04],
    [41452,   57542,    0.06],
    [57542,   72724,    0.08],
    [72724,   371479,   0.093],
    [371479,  445771,   0.103],
    [445771,  742953,   0.113],
    [742953,  Infinity, 0.123],
  ],
  mfj: [
    [0,        22158,    0.01],
    [22158,    52528,    0.02],
    [52528,    82904,    0.04],
    [82904,    115084,   0.06],
    [115084,   145448,   0.08],
    [145448,   742958,   0.093],
    [742958,   891542,   0.103],
    [891542,   1485906,  0.113],
    [1485906,  Infinity, 0.123],
  ],
  hoh: [
    [0,        22173,    0.01],
    [22173,    52530,    0.02],
    [52530,    67716,    0.04],
    [67716,    83805,    0.06],
    [83805,    98990,    0.08],
    [98990,    505208,   0.093],
    [505208,   606251,   0.103],
    [606251,   1010417,  0.113],
    [1010417,  Infinity, 0.123],
  ],
} as const;

// All numeric constants are imported from taxConstants.ts above.

// ---------------------------------------------------------------------------
// CA tax engine
// ---------------------------------------------------------------------------

function californiaTax(taxableIncome: number, filingStatus: FilingStatus): number {
  if (taxableIncome <= 0) return 0;
  const brackets = CA_2025_BRACKETS[filingStatus];
  let tax = 0;
  for (const [lower, upper, rate] of brackets) {
    if (taxableIncome <= lower) break;
    tax += (Math.min(taxableIncome, upper) - lower) * rate;
  }
  if (taxableIncome > CA_BHST_THRESHOLD) {
    tax += (taxableIncome - CA_BHST_THRESHOLD) * CA_BHST_RATE;
  }
  return tax;
}

export function californiaIncrementalTax(
  baseTaxableIncome: number,
  additionalIncome: number,
  filingStatus: FilingStatus,
): number {
  if (additionalIncome <= 0) return 0;
  return (
    californiaTax(baseTaxableIncome + additionalIncome, filingStatus) -
    californiaTax(baseTaxableIncome, filingStatus)
  );
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface TaxModelInput {
  /** Simulation years, default 18 */
  years: number;
  /** Employer contribution, already capped to min(raw, 2500) */
  annualEmployerContribution: number;
  /** Individual contribution, already capped to min(raw, 5000 - employer) */
  annualOtherContribution: number;
  /**
   * Mean monthly investment return. Compounded 12 times per simulated year
   * to match the Monte Carlo simulator's monthly stepping; the implied annual
   * factor is (1 + monthlyReturnRate)^12.
   */
  monthlyReturnRate: number;
  filingStatus: FilingStatus;
  /**
   * CA taxable income AFTER standard deduction and above-the-line deductions.
   * Do NOT pass gross income — the rate schedule is applied directly to this value.
   */
  baseCaTaxableIncome: number;
  parentFederalMarginalRate: number;
  childFutureFederalRate: number;
  /**
   * Layer 2 CA scenario toggle.
   * true (conservative): annual CA tax on 5% of Trump Account gains at kiddie-tax rates.
   * false (optimistic): no annual CA tax; terminal CA tax applied at distribution.
   * Layer 1 (CA nonconformity on employer contribution) is always applied.
   */
  includeAnnualCaKiddieTax?: boolean;
  /** Federal $1,000 seed deposit. Only children born 2025-2028 qualify; default 0. */
  initialSeed?: number;
}

export interface TaxYearRow {
  year: number;
  baselineEndBalance: number;
  trumpEndBalance: number;
  baselineTaxThisYear: number;
  trumpTaxThisYear: number;
}

export interface TaxModelOutput {
  /** Taxable account final balance after annual tax drag AND terminal LTCG liquidation */
  baselineFinalBalance: number;
  /** Trump Account final balance after federal distribution tax (+ CA kiddie tax if enabled) */
  trumpFinalBalance: number;
  federalTaxSavings: number;
  californiaTaxSavings: number;
  combinedTaxSavings: number;
  /** Positive = Trump Account ends with more after-tax wealth */
  wealthDifference: number;
  yearRows: TaxYearRow[];
  /** CA annual kiddie tax toggle state echoed back for UI display */
  annualCaKiddieTaxEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Contribution cap helper (call before runTaxModel)
// ---------------------------------------------------------------------------

export interface CappedContributions {
  employerC: number;
  otherC: number;
  wasCapped: boolean;
}

export function capContributions(
  rawEmployer: number,
  rawOther: number,
): CappedContributions {
  const employerC = Math.min(rawEmployer, FEDERAL_EMPLOYER_EXCLUSION_CAP);
  const remaining = Math.max(0, TRUMP_ACCOUNT_ANNUAL_CAP - employerC);
  const otherC    = Math.min(rawOther, remaining);
  const wasCapped =
    rawEmployer > FEDERAL_EMPLOYER_EXCLUSION_CAP || rawOther > remaining;
  return { employerC, otherC, wasCapped };
}

// ---------------------------------------------------------------------------
// LTCG rate derivation (IRS 2025 thresholds)
// ---------------------------------------------------------------------------

function deriveLtcgRate(federalMarginalRate: number): number {
  if (federalMarginalRate <= 0.12) return 0;
  if (federalMarginalRate <= 0.35) return 0.15;
  return 0.20;
}

// ---------------------------------------------------------------------------
// CA kiddie-tax: per-year and pathwise helpers
// ---------------------------------------------------------------------------

/**
 * One-year CA kiddie tax on a given (gross) Trump Account gain.
 * 5% of the gross gain is treated as realized; if that is above the
 * $1,350 exempt amount, the next $1,350 is taxed at the child rate (1%)
 * and the remainder at the parent's CA marginal rate.
 */
function caKiddieTaxOnYearGain(
  yearGain:     number,
  totalC:       number,
  filingStatus: FilingStatus,
  baseCaIncome: number,
): number {
  const effectiveGainForCa = Math.max(0, yearGain) * REALIZATION_RATE;
  if (effectiveGainForCa <= 0) return 0;
  const exempt     = Math.min(effectiveGainForCa, KIDDIE_TAX_EXEMPT);
  const childBand  = Math.min(Math.max(effectiveGainForCa - exempt, 0), KIDDIE_TAX_CHILD_BAND);
  const parentBand = Math.max(effectiveGainForCa - exempt - childBand, 0);
  return (
    childBand * KIDDIE_TAX_CHILD_RATE +
    californiaIncrementalTax(baseCaIncome + totalC, parentBand, filingStatus)
  );
}

/**
 * Pathwise CA kiddie tax over an 18-year (or N-year) Trump Account balance trajectory.
 *
 * Inputs are the *gross* (pre-tax) end-of-year balances produced by the Monte
 * Carlo simulator: `balanceByYear[y]` is the balance at the end of year y+1
 * after that year's contribution and growth have been applied. Each year's
 * realized gain is `balance[y] - balance[y-1] - totalAnnualContribution`.
 *
 * This is genuinely path-dependent: the kiddie-tax exemption and child-rate
 * band are applied each year independently, so two paths with the same
 * terminal balance but different year-by-year gain profiles correctly
 * produce different totals. (The previous implementation scaled a single
 * deterministic total by terminal-balance ratio, which is wrong for any
 * non-linear bracketed tax.)
 */
export function pathwiseCaKiddieTax(
  balanceByYear:           ArrayLike<number>,
  initialBalance:          number,
  totalAnnualContribution: number,
  filingStatus:            FilingStatus,
  baseCaIncome:            number,
): number {
  let prev  = initialBalance;
  let total = 0;
  for (let y = 0; y < balanceByYear.length; y++) {
    const gain = balanceByYear[y] - prev - totalAnnualContribution;
    total += caKiddieTaxOnYearGain(gain, totalAnnualContribution, filingStatus, baseCaIncome);
    prev = balanceByYear[y];
  }
  return total;
}

// ---------------------------------------------------------------------------
// Core 18-year deterministic model
// ---------------------------------------------------------------------------

export function runTaxModel(input: TaxModelInput): TaxModelOutput {
  const {
    years,
    annualEmployerContribution: employerC,
    annualOtherContribution:    otherC,
    monthlyReturnRate:          monthlyR,
    filingStatus,
    baseCaTaxableIncome:         baseCaIncome,
    parentFederalMarginalRate,
    childFutureFederalRate,
    includeAnnualCaKiddieTax    = true,
  } = input;

  const totalC        = employerC + otherC;
  const ltcgRate      = deriveLtcgRate(parentFederalMarginalRate);
  // Effective annual factor from monthly compounding — matches the Monte Carlo
  // simulator's monthly inner loop (12 multiplicative steps per year).
  const annualFactor  = Math.pow(1 + monthlyR, 12);

  let baselineBalance = 0;
  // The federal government deposits a $1,000 seed for children born 2025-2028.
  // Children born before 2025 do not receive the seed (initialSeed = 0).
  // The seed does NOT create basis and does NOT count toward the $5,000 annual cap.
  let trumpBalance    = input.initialSeed ?? 0;

  let baselineTotalFederal           = 0;
  let baselineTotalCa                = 0;
  let trumpTotalFederalBeforeFinal   = 0;
  let trumpTotalCa                   = 0;

  // Track baseline cost basis for terminal liquidation calculation.
  // Basis grows with after-tax deposits and realized gain (recognized income).
  let baselineBasis = 0;

  const yearRows: TaxYearRow[] = [];

  for (let year = 1; year <= years; year++) {

    // ── Baseline taxable account ──────────────────────────────────────────
    // Contribution: treated as ordinary compensation, taxed at marginal rates.
    const baseFedContrib = totalC * parentFederalMarginalRate;
    const baseCaContrib  = californiaIncrementalTax(baseCaIncome, totalC, filingStatus);
    baselineTotalFederal += baseFedContrib;
    baselineTotalCa      += baseCaContrib;

    // Monthly compounding with end-of-year after-tax contribution
    // (matches Monte Carlo engine's 12-step inner loop).
    const afterTaxAnnualC  = totalC - baseFedContrib - baseCaContrib;
    baselineBasis         += afterTaxAnnualC; // deposits increase cost basis
    const baselineStart    = baselineBalance;
    baselineBalance = baselineBalance * annualFactor + afterTaxAnnualC;
    // Growth: 5% of gains realized & taxed annually at LTCG rates.
    const baselineGain       = baselineBalance - baselineStart - afterTaxAnnualC;
    const realizedGainAmount = Math.max(0, baselineGain) * REALIZATION_RATE;
    const baseFedGain        = realizedGainAmount * ltcgRate;
    const baseCaGain         = californiaIncrementalTax(
      baseCaIncome + totalC,
      realizedGainAmount,
      filingStatus,
    );
    baselineTotalFederal += baseFedGain;
    baselineTotalCa      += baseCaGain;
    baselineBalance      -= baseFedGain + baseCaGain;
    // Recognized (realized) gain increases cost basis; taxes paid reduce balance above.
    baselineBasis        += realizedGainAmount;

    // ── Trump Account (IRC §530A) ─────────────────────────────────────────
    // Federal: employer portion (up to $2,500) excluded via §128.
    const excluded             = Math.min(employerC, FEDERAL_EMPLOYER_EXCLUSION_CAP);
    const federallyTaxableNow  = (employerC - excluded) + otherC;

    const trumpFedContrib = federallyTaxableNow * parentFederalMarginalRate;
    trumpTotalFederalBeforeFinal += trumpFedContrib;

    // Layer 1 (nonconformity scenario): full contribution is CA-taxable (CA ≠ §128).
    const trumpCaContrib = californiaIncrementalTax(baseCaIncome, totalC, filingStatus);
    trumpTotalCa        += trumpCaContrib;

    // Monthly compounding with end-of-year contribution (matches MC engine).
    // CA tax paid from account; federal growth deferred until distribution.
    const trumpStart = trumpBalance;
    trumpBalance = trumpBalance * annualFactor + totalC;

    // Layer 2 (toggle): annual CA kiddie-tax on 5% of Trump Account gains.
    const trumpCaGain = includeAnnualCaKiddieTax
      ? caKiddieTaxOnYearGain(trumpBalance - trumpStart - totalC, totalC, filingStatus, baseCaIncome)
      : 0;
    trumpTotalCa  += trumpCaGain;
    trumpBalance  -= trumpCaGain;

    yearRows.push({
      year,
      baselineEndBalance:    baselineBalance,
      trumpEndBalance:       trumpBalance,
      baselineTaxThisYear:   baseFedContrib + baseCaContrib + baseFedGain + baseCaGain,
      trumpTaxThisYear:      trumpFedContrib + trumpCaContrib + trumpCaGain,
    });
  }

  // ── Final distribution ────────────────────────────────────────────────────

  // Baseline: terminal liquidation — sell remaining unrealized position at year 18.
  // The 5% annual realization left ~95% of each year's gains unrealized.
  // At liquidation the unrealized gain = balance − cost basis (after-tax deposits
  // + recognized gains). Apply federal LTCG + CA income tax on that gain.
  const baselineUnrealizedGain    = Math.max(0, baselineBalance - baselineBasis);
  const baselineTerminalFedTax    = baselineUnrealizedGain * ltcgRate;
  const baselineTerminalCaTax     = californiaIncrementalTax(
    baseCaIncome + totalC,
    baselineUnrealizedGain,
    filingStatus,
  );
  baselineTotalFederal += baselineTerminalFedTax;
  baselineTotalCa      += baselineTerminalCaTax;
  baselineBalance      -= baselineTerminalFedTax + baselineTerminalCaTax;

  // Trump Account: basis = individual (non-employer) contributions only.
  // Employer §128 contributions created no basis; fully taxable at distribution.
  const totalBasis                   = years * otherC;
  const trumpFederalTaxableAtDist    = Math.max(trumpBalance - totalBasis, 0);
  const trumpFinalFedTax             = trumpFederalTaxableAtDist * childFutureFederalRate;
  // No early withdrawal penalty (qualified education use assumed).

  // Terminal CA tax on deferred Trump Account gains (when annual kiddie tax is off).
  // CA basis = totalC × years + seed (both employer and individual contributions are
  // CA-taxed via Layer 1; the seed is not CA income per FTB, so it is also basis).
  let trumpTerminalCaTax = 0;
  if (!includeAnnualCaKiddieTax) {
    const seed           = input.initialSeed ?? 0;
    const caBasis        = totalC * years + seed;
    const trumpGainForCa = Math.max(0, trumpBalance - caBasis);
    trumpTerminalCaTax   = californiaIncrementalTax(baseCaIncome + totalC, trumpGainForCa, filingStatus);
    trumpTotalCa        += trumpTerminalCaTax;
  }

  const baselineTotalTax   = baselineTotalFederal + baselineTotalCa;
  const trumpTotalFederal  = trumpTotalFederalBeforeFinal + trumpFinalFedTax;
  const trumpTotalTax      = trumpTotalFederal + trumpTotalCa;

  const baselineFinalBalance = baselineBalance;
  const trumpFinalBalance    = trumpBalance - trumpFinalFedTax - trumpTerminalCaTax;

  return {
    baselineFinalBalance,
    trumpFinalBalance,
    federalTaxSavings:         baselineTotalFederal - trumpTotalFederal,
    californiaTaxSavings:      baselineTotalCa      - trumpTotalCa,
    combinedTaxSavings:        baselineTotalTax     - trumpTotalTax,
    wealthDifference:          trumpFinalBalance    - baselineFinalBalance,
    yearRows,
    annualCaKiddieTaxEnabled:  includeAnnualCaKiddieTax,
  };
}
