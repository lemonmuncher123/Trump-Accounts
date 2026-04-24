import { describe, it, expect } from 'vitest';
import { simulateCollegeSavings } from './calculator';

describe('Calculator Core Logic', () => {
  it('should generate accurate realistic probabilities based on exact parameters', () => {
    const output = simulateCollegeSavings({
      annualContribution: 5000,
      employerMatchAnnual: 1000,
      universityType: 'public',
      initialSeed: 1000,
      // ≈12.5% annualized mean, ≈16.9% annualized vol — same defaults the page falls back to.
      monthlyMean: 0.0099,
      monthlyVol: 0.0488,
    });

    // 1000 scatter points
    expect(output.scatterPoints).toHaveLength(1000);
    // Median savings roughly above $100k for 18 years at $500/mo @ ~12.5% annualized
    expect(output.medianSavings).toBeGreaterThan(100000);
    expect(output.successRate).toBeGreaterThanOrEqual(0);
    expect(output.successRate).toBeLessThanOrEqual(100);
  });

  it('zero-volatility produces deterministic result matching closed-form (monthly compounding)', () => {
    // Pick a monthly rate that compounds to ~12% annualized. Closed-form below
    // assumes contributions are deposited at the end of each year.
    const annualTarget = 0.12;
    const monthlyMean  = Math.pow(1 + annualTarget, 1 / 12) - 1;
    const annualC      = 6_000;
    const seed         = 1_000;
    const years        = 18;

    const output = simulateCollegeSavings({
      annualContribution: annualC,
      employerMatchAnnual: 0,
      universityType: 'public',
      initialSeed: seed,
      monthlyMean,
      monthlyVol: 0,
    });

    // With zero monthly vol, every path is identical and equals the deterministic
    // monthly-compounded annuity:
    //   annual factor f = (1 + monthlyMean)^12
    //   balance_n = seed * f^n + C * (f^n - 1) / (f - 1)
    const f = Math.pow(1 + monthlyMean, 12);
    const fN = Math.pow(f, years);
    const expected = seed * fN + annualC * (fN - 1) / (f - 1);

    const balances = output.scatterPoints.map(p => p.savingsBalance);
    const allSame = balances.every(b => Math.abs(b - balances[0]) < 0.01);
    expect(allSame).toBe(true);
    expect(balances[0]).toBeCloseTo(expected, 0);
    expect(output.medianSavings).toBeCloseTo(expected, 0);
  });

  it('monthly compounding compounds 12 times per year (vs naive single-step annual)', () => {
    // Sanity check that the inner loop actually multiplies 12 times. With
    // monthlyMean = 1% per month, the annualized factor is (1.01)^12 ≈ 1.1268,
    // not 1 + (0.01 * 12) = 1.12. Run the simulator with vol=0 and compare to
    // the smaller naive value to confirm monthly compounding is in effect.
    const monthlyMean  = 0.01;
    const seed         = 1_000;
    const years        = 18;

    const output = simulateCollegeSavings({
      annualContribution: 0,
      employerMatchAnnual: 0,
      universityType: 'public',
      initialSeed: seed,
      monthlyMean,
      monthlyVol: 0,
    });

    const naiveAnnualOnlyTerminal = seed * Math.pow(1 + monthlyMean * 12, years);
    const monthlyCompoundedTerminal = seed * Math.pow(Math.pow(1 + monthlyMean, 12), years);
    expect(monthlyCompoundedTerminal).toBeGreaterThan(naiveAnnualOnlyTerminal);
    expect(output.scatterPoints[0].savingsBalance).toBeCloseTo(monthlyCompoundedTerminal, 0);
  });

  it('populates balanceByYear with one entry per simulated year', () => {
    const years = 18;
    const output = simulateCollegeSavings({
      annualContribution: 5_000,
      employerMatchAnnual: 0,
      universityType: 'public',
      yearsToMatriculation: years,
      monthlyMean: 0.005,
      monthlyVol: 0,
    });
    for (const pt of output.scatterPoints) {
      expect(pt.balanceByYear).toBeInstanceOf(Float64Array);
      expect(pt.balanceByYear.length).toBe(years);
      // Final entry should match the reported terminal savings balance.
      expect(pt.balanceByYear[years - 1]).toBeCloseTo(pt.savingsBalance, 6);
    }
  });
});
