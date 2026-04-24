import { describe, it, expect } from 'vitest';
import { computeBirthYearEligibility } from './taxConstants';

describe('computeBirthYearEligibility', () => {
  it('2024: no seed, 16 contribution years', () => {
    const e = computeBirthYearEligibility(2024);
    expect(e.pilotSeedEligible).toBe(false);
    expect(e.initialSeed).toBe(0);
    expect(e.firstContributionYear).toBe(2026);
    expect(e.lastGrowthYear).toBe(2041);
    expect(e.distributionYear).toBe(2042);
    expect(e.contributionYears).toBe(16);
    expect(e.eligibleForNewContributions).toBe(true);
  });

  it('2025: has seed, 17 contribution years (first contribution year is 2026, not 2025)', () => {
    const e = computeBirthYearEligibility(2025);
    expect(e.pilotSeedEligible).toBe(true);
    expect(e.initialSeed).toBe(1000);
    expect(e.firstContributionYear).toBe(2026);
    expect(e.lastGrowthYear).toBe(2042);
    expect(e.distributionYear).toBe(2043);
    expect(e.contributionYears).toBe(17);
    expect(e.eligibleForNewContributions).toBe(true);
  });

  it('2026: has seed, full 18 contribution years', () => {
    const e = computeBirthYearEligibility(2026);
    expect(e.pilotSeedEligible).toBe(true);
    expect(e.initialSeed).toBe(1000);
    expect(e.firstContributionYear).toBe(2026);
    expect(e.lastGrowthYear).toBe(2043);
    expect(e.distributionYear).toBe(2044);
    expect(e.contributionYears).toBe(18);
    expect(e.eligibleForNewContributions).toBe(true);
  });

  it('2027: has seed, full 18 contribution years', () => {
    const e = computeBirthYearEligibility(2027);
    expect(e.pilotSeedEligible).toBe(true);
    expect(e.initialSeed).toBe(1000);
    expect(e.firstContributionYear).toBe(2027);
    expect(e.lastGrowthYear).toBe(2044);
    expect(e.distributionYear).toBe(2045);
    expect(e.contributionYears).toBe(18);
    expect(e.eligibleForNewContributions).toBe(true);
  });

  it('2028: has seed, full 18 contribution years (last pilot year)', () => {
    const e = computeBirthYearEligibility(2028);
    expect(e.pilotSeedEligible).toBe(true);
    expect(e.initialSeed).toBe(1000);
    expect(e.firstContributionYear).toBe(2028);
    expect(e.lastGrowthYear).toBe(2045);
    expect(e.distributionYear).toBe(2046);
    expect(e.contributionYears).toBe(18);
    expect(e.eligibleForNewContributions).toBe(true);
  });

  it('2029: no seed (outside pilot window), full 18 contribution years', () => {
    const e = computeBirthYearEligibility(2029);
    expect(e.pilotSeedEligible).toBe(false);
    expect(e.initialSeed).toBe(0);
    expect(e.firstContributionYear).toBe(2029);
    expect(e.lastGrowthYear).toBe(2046);
    expect(e.distributionYear).toBe(2047);
    expect(e.contributionYears).toBe(18);
    expect(e.eligibleForNewContributions).toBe(true);
  });

  it('2009: no seed, 1 contribution year (barely eligible)', () => {
    const e = computeBirthYearEligibility(2009);
    expect(e.pilotSeedEligible).toBe(false);
    expect(e.initialSeed).toBe(0);
    expect(e.firstContributionYear).toBe(2026);
    expect(e.lastGrowthYear).toBe(2026);
    expect(e.distributionYear).toBe(2027);
    expect(e.contributionYears).toBe(1);
    expect(e.eligibleForNewContributions).toBe(true);
  });

  it('2008: no seed, 0 contribution years — child ages out before launch', () => {
    const e = computeBirthYearEligibility(2008);
    expect(e.pilotSeedEligible).toBe(false);
    expect(e.initialSeed).toBe(0);
    expect(e.lastGrowthYear).toBe(2025);
    expect(e.distributionYear).toBe(2026);
    expect(e.contributionYears).toBe(0);
    expect(e.eligibleForNewContributions).toBe(false);
  });

  it('2005: no seed, 0 contribution years — well past eligibility', () => {
    const e = computeBirthYearEligibility(2005);
    expect(e.contributionYears).toBe(0);
    expect(e.eligibleForNewContributions).toBe(false);
  });

  it('2020: no seed, 12 contribution years', () => {
    const e = computeBirthYearEligibility(2020);
    expect(e.pilotSeedEligible).toBe(false);
    expect(e.initialSeed).toBe(0);
    expect(e.firstContributionYear).toBe(2026);
    expect(e.lastGrowthYear).toBe(2037);
    expect(e.distributionYear).toBe(2038);
    expect(e.contributionYears).toBe(12);
    expect(e.eligibleForNewContributions).toBe(true);
  });
});
