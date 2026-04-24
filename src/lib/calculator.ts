export type UniversityType = 'public' | 'private';

export interface CalculatorInput {
  annualContribution: number;
  employerMatchAnnual: number;
  universityType: UniversityType;
  yearsToMatriculation?: number; // default 18
  /** Federal $1,000 seed deposit. Only children born 2025-2028 qualify; default 1000. */
  initialSeed?: number;
  /** Mean of monthly returns (e.g. ≈0.0099 for ~12.5% annualized). */
  monthlyMean: number;
  /** Standard deviation of monthly returns (e.g. ≈0.0488 for ~16.9% annualized). */
  monthlyVol: number;
}

export interface SimulationPoint {
  id: number;
  savingsBalance: number; // For X axis
  tuitionCost: number;    // For Y axis
  isSuccess: boolean;
  /** End-of-year (post-contribution, pre-tax) Trump Account balance for years 1..years.
   *  Length = yearsToMatriculation. Used by pathwise CA kiddie-tax computation. */
  balanceByYear: Float64Array;
}

export interface SimulationOutput {
  scatterPoints: SimulationPoint[];
  expectedTuition: number; // Median
  medianSavings: number;
  successRate: number;
}

// Current average 4-year tuition
const CURRENT_TUITION_COSTS = {
  public: 48000, 
  private: 180000, 
};

const TUITION_INFLATION = 0.05;
const TUITION_VOLATILITY = 0.02;

export function simulateCollegeSavings(input: CalculatorInput): SimulationOutput {
  const years = input.yearsToMatriculation ?? 18;
  const numSimulations = 1000;
  
  const startTuition = CURRENT_TUITION_COSTS[input.universityType];
  const initialSeed = input.initialSeed ?? 1000;
  
  const points: SimulationPoint[] = [];
  let successCount = 0;
  
  const totalAnnualInput = input.annualContribution + input.employerMatchAnnual;

  const savingsResults = new Float64Array(numSimulations);
  const tuitionResults = new Float64Array(numSimulations);

  for (let i = 0; i < numSimulations; i++) {
    let balance = initialSeed;
    let cost = startTuition;
    const balanceByYear = new Float64Array(years);

    for (let y = 0; y < years; y++) {
      // 12 monthly normal draws, compounded multiplicatively. Matches the
      // monthly-return statistics (mean, std) we extract from market data,
      // so the annual-horizon distribution is the true compounded distribution
      // — not a single normal sample at the annual horizon (which would have
      // the same first two moments but lose right-skew from compounding).
      let yearGrowth = 1;
      for (let m = 0; m < 12; m++) {
        yearGrowth *= 1 + randomNormal(input.monthlyMean, input.monthlyVol);
      }
      // Contribution still annual (deposit timing assumption: end of year).
      balance = balance * yearGrowth + totalAnnualInput;
      balanceByYear[y] = balance;

      // Tuition also inflates stochastically (annual draw).
      const tuitionInc = Math.max(randomNormal(TUITION_INFLATION, TUITION_VOLATILITY), -0.05);
      cost *= (1 + tuitionInc);
    }

    savingsResults[i] = balance;
    tuitionResults[i] = cost;

    const isSuccess = balance >= cost;
    if (isSuccess) successCount++;

    points.push({
      id: i,
      savingsBalance: balance,
      tuitionCost: cost,
      isSuccess,
      balanceByYear,
    });
  }
  
  savingsResults.sort();
  tuitionResults.sort();

  return {
    scatterPoints: points,
    expectedTuition: tuitionResults[Math.floor(numSimulations * 0.5)],
    medianSavings: savingsResults[Math.floor(numSimulations * 0.5)],
    successRate: (successCount / numSimulations) * 100
  };
}

function randomNormal(mean: number, stdDev: number): number {
  let u1 = Math.random();
  let u2 = Math.random();
  if (u1 === 0) u1 = Number.EPSILON;
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}
