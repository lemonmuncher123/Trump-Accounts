import React, { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import {
  simulateCollegeSavings,
  type CalculatorInput,
  type SimulationOutput,
  type SimulationPoint,
  type UniversityType
} from '../lib/calculator';
import { capContributions, californiaIncrementalTax, pathwiseCaKiddieTax, type FilingStatus } from '../lib/caTaxCalculator';
import { computeBirthYearEligibility } from '../lib/taxConstants';
import TaxSavings from './TaxSavings';

/** SimulationPoint extended with after-tax Trump Account balance. */
interface AfterTaxPoint extends SimulationPoint {
  afterTaxBalance: number;
  afterTaxIsSuccess: boolean;
  pathIndex: number;
}


interface Props {
  /** Mean of monthly returns (e.g. ≈0.0099 for ~12.5% annualized). */
  monthlyMean: number;
  /** Standard deviation of monthly returns (e.g. ≈0.0488 for ~16.9% annualized). */
  monthlyVol: number;
  dataRangeConfig: string;
}

interface WorkerResponse {
  requestId: number;
  result: SimulationOutput;
}

const MIN_CALCULATION_DISPLAY_MS = 1500;

const FILING_OPTIONS: { value: FilingStatus; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'mfj',    label: 'Married' },
  { value: 'hoh',    label: 'Head of HH' },
];
const FEDERAL_RATE_OPTIONS = [
  { value: 0.22, label: '22%' },
  { value: 0.24, label: '24%' },
  { value: 0.32, label: '32%' },
  { value: 0.37, label: '37%' },
];
const CHILD_RATE_OPTIONS = [
  { value: 0.10, label: '10%' },
  { value: 0.12, label: '12%' },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function Calculator({ monthlyMean, monthlyVol, dataRangeConfig }: Props) {
  const [annualContribution, setAnnualContribution] = useState(5000);
  const [employerMatchAnnual, setEmployerMatchAnnual] = useState(0);
  const [universityType, setUniversityType] = useState<UniversityType>('public');
  const [showSuccess, setShowSuccess] = useState(true);
  const [showFailure, setShowFailure] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [childFutureRate, setChildFutureRate]       = useState(0.10);
  const [filingStatus, setFilingStatus]             = useState<FilingStatus>('mfj');
  const [baseCaIncome, setBaseCaIncome]             = useState(150_000);
  const [parentFederalRate, setParentFederalRate]   = useState(0.24);
  const [activeTab, setActiveTab]                   = useState<'simulation' | 'tax'>('simulation');
  const [includeTax, setIncludeTax]                 = useState(true);
  const [includeAnnualCaKiddieTax, setIncludeAnnualCaKiddieTax] = useState(true);
  const [includeTuition, setIncludeTuition] = useState(false);
  const [childBirthYear, setChildBirthYear] = useState(2026);

  const birthYearInfo = computeBirthYearEligibility(childBirthYear);
  const { pilotSeedEligible, initialSeed, firstContributionYear, lastGrowthYear, distributionYear, eligibleForNewContributions } = birthYearInfo;
  const yearsToMatriculation = birthYearInfo.contributionYears;

  const debouncedAnnual = useDebounce(annualContribution, 160);
  const debouncedMatch = useDebounce(employerMatchAnnual, 160);
  const debouncedBaseCaIncome = useDebounce(baseCaIncome, 160);

  const [simulation, setSimulation] = useState<SimulationOutput>(() =>
    simulateCollegeSavings({
      annualContribution: 5000,
      employerMatchAnnual: 0,
      universityType: 'public',
      yearsToMatriculation,
      initialSeed,
      monthlyMean,
      monthlyVol
    })
  );

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const hasInitializedEffect = useRef(false);
  const busyTimeoutRef = useRef<number | null>(null);
  const fallbackTimeoutRef = useRef<number | null>(null);
  const requestStartedAtRef = useRef(0);

  function clearBusyTimeout() {
    if (busyTimeoutRef.current) {
      window.clearTimeout(busyTimeoutRef.current);
      busyTimeoutRef.current = null;
    }
  }

  function clearFallbackTimeout() {
    if (fallbackTimeoutRef.current) {
      window.clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
  }

  function terminateWorker() {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }

  function cancelInFlightCalculation(resetBusyState = true) {
    clearBusyTimeout();
    clearFallbackTimeout();
    terminateWorker();

    if (resetBusyState) {
      setIsCalculating(false);
    }
  }

  function scheduleResultCommit(requestId: number, result: SimulationOutput) {
    const elapsed = Date.now() - requestStartedAtRef.current;
    const remaining = Math.max(0, MIN_CALCULATION_DISPLAY_MS - elapsed);

    clearBusyTimeout();
    busyTimeoutRef.current = window.setTimeout(() => {
      if (requestId !== requestIdRef.current) {
        return;
      }

      startTransition(() => {
        setSimulation(result);
      });
      setIsCalculating(false);
      busyTimeoutRef.current = null;
    }, remaining);
  }

  function startWorkerCalculation(requestId: number, input: CalculatorInput) {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      return false;
    }

    const worker = new Worker(new URL('../workers/calculator.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { requestId: completedRequestId, result } = event.data;

      if (workerRef.current === worker) {
        workerRef.current = null;
      }
      worker.terminate();

      if (completedRequestId !== requestIdRef.current) {
        return;
      }

      scheduleResultCommit(completedRequestId, result);
    };

    worker.postMessage({ requestId, input });
    return true;
  }

  useEffect(() => {
    return () => {
      cancelInFlightCalculation(false);
    };
  }, []);

  useEffect(() => {
    if (!hasInitializedEffect.current) {
      return;
    }

    if (annualContribution === debouncedAnnual && employerMatchAnnual === debouncedMatch) {
      return;
    }

    cancelInFlightCalculation();
  }, [annualContribution, employerMatchAnnual, debouncedAnnual, debouncedMatch]);

  useEffect(() => {
    if (!hasInitializedEffect.current) {
      hasInitializedEffect.current = true;
      return;
    }

    const { employerC: cappedMatch, otherC: cappedAnnual } = capContributions(debouncedMatch, debouncedAnnual);
    const nextInput: CalculatorInput = {
      annualContribution: cappedAnnual,
      employerMatchAnnual: cappedMatch,
      universityType,
      yearsToMatriculation,
      initialSeed,
      monthlyMean,
      monthlyVol
    };

    const nextRequestId = requestIdRef.current + 1;
    requestIdRef.current = nextRequestId;
    cancelInFlightCalculation(false);
    requestStartedAtRef.current = Date.now();
    setIsCalculating(true);

    if (startWorkerCalculation(nextRequestId, nextInput)) {
      return;
    }

    fallbackTimeoutRef.current = window.setTimeout(() => {
      fallbackTimeoutRef.current = null;
      const result = simulateCollegeSavings(nextInput);

      if (nextRequestId !== requestIdRef.current) {
        return;
      }

      scheduleResultCommit(nextRequestId, result);
    }, 0);

    return () => {
      cancelInFlightCalculation(false);
    };
  }, [debouncedAnnual, debouncedMatch, universityType, yearsToMatriculation, initialSeed, monthlyMean, monthlyVol]);

  const deferredPoints = useDeferredValue(simulation.scatterPoints);
  const isSettlingInput = annualContribution !== debouncedAnnual || employerMatchAnnual !== debouncedMatch || baseCaIncome !== debouncedBaseCaIncome;
  const showCalculatorState = isCalculating || isSettlingInput;

  // ── After-tax conversion ─────────────────────────────────────────────────
  // Pre-tax algorithm in calculator.ts is kept fully intact.
  // Post-hoc tax adjustment per scatter point using the shared tax profile:
  //
  //   basis = 18 × otherC  (only individual contributions create federal basis;
  //                          employer §128 contributions have none)
  //
  //   When includeAnnualCaKiddieTax = true (conservative):
  //     CA tax = pathwise sum of annual kiddie-tax computed from each path's
  //     own year-by-year balance trajectory (via pathwiseCaKiddieTax).
  //   When includeAnnualCaKiddieTax = false (optimistic / deferral):
  //     CA tax = terminal CA tax at distribution on accumulated gains per path
  //
  // Shared tax profile (filingStatus, baseCaIncome, parentFederalRate, childFutureRate)
  // is lifted to this component so both sections always use identical inputs.
  const afterTaxPoints = useMemo<AfterTaxPoint[]>(() => {
    const { employerC, otherC } = capContributions(debouncedMatch, debouncedAnnual);
    const totalC   = employerC + otherC;
    const basis    = yearsToMatriculation * otherC;
    const caBasis  = yearsToMatriculation * totalC + initialSeed;

    return deferredPoints.map((pt, i) => {
      const federalDistTax = Math.max(0, pt.savingsBalance - basis) * childFutureRate;
      const caTax = includeAnnualCaKiddieTax
        ? pathwiseCaKiddieTax(pt.balanceByYear, initialSeed, totalC, filingStatus, baseCaIncome)
        : californiaIncrementalTax(baseCaIncome + totalC, Math.max(0, pt.savingsBalance - caBasis), filingStatus);
      const afterTaxBalance = Math.max(0, pt.savingsBalance - federalDistTax - caTax);
      return { ...pt, afterTaxBalance, afterTaxIsSuccess: afterTaxBalance >= pt.tuitionCost, pathIndex: i };
    });
  }, [deferredPoints, debouncedAnnual, debouncedMatch, childFutureRate, filingStatus, baseCaIncome, includeAnnualCaKiddieTax, yearsToMatriculation, initialSeed]);

  // Non-deferred stats for the results panel (updates when simulation settles)
  const afterTaxStats = useMemo(() => {
    const { employerC, otherC } = capContributions(debouncedMatch, debouncedAnnual);
    const totalC   = employerC + otherC;
    const basis    = yearsToMatriculation * otherC;
    const caBasis  = yearsToMatriculation * totalC + initialSeed;
    const balances: number[] = [];
    let successCt = 0;
    for (const pt of simulation.scatterPoints) {
      const federalDistTax = Math.max(0, pt.savingsBalance - basis) * childFutureRate;
      const caTax = includeAnnualCaKiddieTax
        ? pathwiseCaKiddieTax(pt.balanceByYear, initialSeed, totalC, filingStatus, baseCaIncome)
        : californiaIncrementalTax(baseCaIncome + totalC, Math.max(0, pt.savingsBalance - caBasis), filingStatus);
      const afterTaxBalance = Math.max(0, pt.savingsBalance - federalDistTax - caTax);
      balances.push(afterTaxBalance);
      if (afterTaxBalance >= pt.tuitionCost) successCt++;
    }
    balances.sort((a, b) => a - b);
    return {
      median:       balances[Math.floor(balances.length * 0.5)] ?? 0,
      successCount: successCt,
      successRate:  (successCt / (simulation.scatterPoints.length || 1)) * 100,
    };
  }, [simulation.scatterPoints, debouncedAnnual, debouncedMatch, childFutureRate, filingStatus, baseCaIncome, includeAnnualCaKiddieTax, yearsToMatriculation, initialSeed]);
  // ────────────────────────────────────────────────────────────────────────

  const filteredPoints = useMemo(() => {
    if (!includeTuition) {
      return { successPoints: afterTaxPoints, shortfallPoints: [] as AfterTaxPoint[] };
    }
    const successPoints: AfterTaxPoint[] = [];
    const shortfallPoints: AfterTaxPoint[] = [];

    afterTaxPoints.forEach((point) => {
      const success = includeTax ? point.afterTaxIsSuccess : point.isSuccess;
      if (success) {
        if (showSuccess) successPoints.push(point);
        return;
      }
      if (showFailure) shortfallPoints.push(point);
    });

    return { successPoints, shortfallPoints };
  }, [afterTaxPoints, showSuccess, showFailure, includeTax, includeTuition]);

  const successCount = includeTax ? afterTaxStats.successCount : simulation.scatterPoints.filter(p => p.isSuccess).length;
  const totalPaths = simulation.scatterPoints.length;
  const shortfallCount = totalPaths - successCount;

  // Compute wasCapped for the cap warning
  const { wasCapped: inputsExceedCap } = useMemo(
    () => capContributions(debouncedMatch, debouncedAnnual),
    [debouncedMatch, debouncedAnnual],
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);

  const formatCompactCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: value >= 1000000 ? 1 : 0
    }).format(value);

  const effectiveTab = includeTax ? activeTab : 'simulation';

  return (
    <>
    {/* ── Mode toggles ── above the whole card ──────────────────── */}
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      gap: '20px', marginBottom: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>
          {includeTuition ? 'Tuition simulation on' : 'Balance only'}
        </span>
        <div
          className={`apple-toggle ${includeTuition ? 'active' : ''}`}
          onClick={() => setIncludeTuition(v => !v)}
        >
          <div className="toggle-thumb" />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>
          {includeTax ? 'Tax analysis on' : 'Pre-tax only'}
        </span>
        <div
          className={`apple-toggle ${includeTax ? 'active' : ''}`}
          onClick={() => {
            setIncludeTax(v => !v);
            if (activeTab === 'tax') setActiveTab('simulation');
          }}
        >
          <div className="toggle-thumb" />
        </div>
      </div>
    </div>

    <div className="app-layout">
      <aside className="sidebar">
        <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '8px' }}>
          530A Trump Account Calculator
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px', lineHeight: 1.5 }}>
          Monte-Carlo simulations generating 1,000 parallel {yearsToMatriculation}-year realities based on real S&amp;P 500
          volatility ({dataRangeConfig}).
        </p>

        {includeTuition && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>Show Successful</span>
            <div className={`apple-toggle ${showSuccess ? 'active' : ''}`} onClick={() => setShowSuccess(!showSuccess)}>
              <div className="toggle-thumb" />
            </div>
          </div>
          <div style={{ height: '1px', background: 'var(--border-light)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>Show Shortfalls</span>
            <div className={`apple-toggle ${showFailure ? 'active' : ''}`} onClick={() => setShowFailure(!showFailure)}>
              <div className="toggle-thumb" />
            </div>
          </div>
        </div>
        )}

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Child Birth Year
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>{childBirthYear}</span>
            </div>
            <select
              className="apple-select"
              value={childBirthYear}
              onChange={(e) => setChildBirthYear(Number(e.target.value))}
              data-testid="birth-year-select"
            >
              {Array.from({ length: 20 }, (_, i) => 2028 - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            {eligibleForNewContributions ? (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {`Contribution years ${firstContributionYear}–${lastGrowthYear} (${birthYearInfo.contributionYears} yr${birthYearInfo.contributionYears !== 1 ? 's' : ''}); transition ${distributionYear}`}
                {pilotSeedEligible ? ' · $1,000 federal seed' : ' · no federal seed'}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: 'var(--accent-orange)', lineHeight: 1.5 }}>
                Child turns 18 before account launch ({distributionYear} ≤ {firstContributionYear}). No new contributions possible under §530A.
              </div>
            )}
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '4px', opacity: 0.7 }}>
              Birth year estimates the contribution window and possible $1,000 pilot seed. Account eligibility requires a valid SSN and a federal election; the $1,000 pilot seed also requires U.S. citizenship, a 2025–2028 birth year, no prior pilot election, and successful account setup.
            </div>
          </div>

          {includeTuition && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                University Target
              </span>
            </div>
            <div className="apple-segmented-control" data-testid="uni-select">
              <button
                type="button"
                className={`apple-segmented-item ${universityType === 'public' ? 'active' : ''}`}
                onClick={() => setUniversityType('public')}
                aria-pressed={universityType === 'public'}
              >
                Top Public
              </button>
              <button
                type="button"
                className={`apple-segmented-item ${universityType === 'private' ? 'active' : ''}`}
                onClick={() => setUniversityType('private')}
                aria-pressed={universityType === 'private'}
              >
                Top Private
              </button>
            </div>
          </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Annual Savings Budget
              </span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>${annualContribution.toLocaleString()}</span>
            </div>
            <input
              type="range"
              className="apple-slider"
              value={annualContribution}
              onChange={(event) => setAnnualContribution(Number(event.target.value))}
              min="0"
              max="5000"
              step="250"
              data-testid="annual-input"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Employer Contribution
              </span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-emerald)', whiteSpace: 'nowrap' }}>+${employerMatchAnnual.toLocaleString()}</span>
            </div>
            <input
              type="range"
              className="apple-slider"
              value={employerMatchAnnual}
              onChange={(event) => setEmployerMatchAnnual(Number(event.target.value))}
              min="0"
              max="2500"
              step="250"
              data-testid="match-input"
            />
          </div>
        </div>

        <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.4, opacity: 0.7, marginTop: '-4px' }}>
          Caps shown are static 2025 current-dollar values ($5,000 total / $2,500 employer). Statutory indexing for inflation is not modeled.
        </div>

        {inputsExceedCap && (
          <div style={{
            background:   'rgba(249, 115, 22, 0.08)',
            border:       '1px solid rgba(249, 115, 22, 0.25)',
            borderRadius: '12px',
            padding:      '10px 14px',
            fontSize:     '12px',
            color:        'var(--accent-orange)',
            lineHeight:   1.5,
          }}>
            Inputs exceed the $5,000/yr statutory cap ($2,500 employer limit). Simulation and tax figures use capped amounts.
          </div>
        )}

        {/* ── Tax profile (only when tax mode is on) ───────────── */}
        {includeTax && <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '0' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
            Tax Profile · CA 2025
          </p>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Filing Status</div>
            <div className="apple-segmented-control">
              {FILING_OPTIONS.map(opt => (
                <button key={opt.value} type="button"
                  className={`apple-segmented-item ${filingStatus === opt.value ? 'active' : ''}`}
                  onClick={() => setFilingStatus(opt.value)} aria-pressed={filingStatus === opt.value}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>CA Taxable Income</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(baseCaIncome)}
              </span>
            </div>
            <input type="range" className="apple-slider" value={baseCaIncome}
              onChange={e => setBaseCaIncome(Number(e.target.value))}
              min={40_000} max={600_000} step={10_000} />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>After deductions &amp; adjustments</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Your Federal Marginal Rate</div>
            <div className="apple-segmented-control">
              {FEDERAL_RATE_OPTIONS.map(opt => (
                <button key={opt.value} type="button"
                  className={`apple-segmented-item ${parentFederalRate === opt.value ? 'active' : ''}`}
                  onClick={() => setParentFederalRate(opt.value)} aria-pressed={parentFederalRate === opt.value}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Child's Future Federal Rate</div>
            <div className="apple-segmented-control">
              {CHILD_RATE_OPTIONS.map(opt => (
                <button key={opt.value} type="button"
                  className={`apple-segmented-item ${childFutureRate === opt.value ? 'active' : ''}`}
                  onClick={() => setChildFutureRate(opt.value)} aria-pressed={childFutureRate === opt.value}>
                  {opt.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Applied at distribution (age 18)</div>
          </div>
        </div>}

        <div className="projection-box" style={{ background: 'transparent', padding: 0, marginTop: '16px', border: 'none' }}>
          <div className="glass-panel" style={{ background: 'rgba(79, 143, 247, 0.05)', borderColor: 'rgba(79, 143, 247, 0.2)', marginBottom: 0 }}>
            <div className="calculator-summary__header">
              <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-blue)' }}>
                Simulation Results
              </h3>
              <span className={`calculator-status-pill ${showCalculatorState ? 'is-busy' : ''}`}>
                {showCalculatorState ? 'Calculating' : 'Live'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                Median Balance{includeTax && <span style={{ fontSize: '11px', opacity: 0.6 }}> (gross)</span>}:
              </span>
              <strong style={{ color: includeTax ? 'var(--text-muted)' : 'var(--accent-emerald)' }}>
                {formatCurrency(simulation.medianSavings)}
              </strong>
            </div>
            {includeTax && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Median Balance <span style={{ fontSize: '11px', opacity: 0.6 }}>(after-tax)</span>:</span>
                <strong style={{ color: 'var(--accent-emerald)' }}>{formatCurrency(afterTaxStats.median)}</strong>
              </div>
            )}
            {includeTuition && (<>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Est. 4-Year Tuition:</span>
              <strong style={{ color: 'var(--text-main)' }}>{formatCurrency(simulation.expectedTuition)}</strong>
            </div>
            <div style={{ height: '1px', background: 'var(--border-light)', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Success Rate</span>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {includeTax ? 'based on after-tax balance' : 'based on gross balance'}
                </div>
              </div>
              <strong
                style={{
                  fontSize: '24px',
                  letterSpacing: '-0.02em',
                  color: (includeTax ? afterTaxStats.successRate : simulation.successRate) > 50
                    ? 'var(--accent-emerald)' : 'var(--accent-orange)'
                }}
              >
                {(includeTax ? afterTaxStats.successRate : simulation.successRate).toFixed(1)}%
              </strong>
            </div>
            </>)}
          </div>
        </div>
      </aside>

      <main className="main-chart-area">
        {/* ── Tab bar ──────────────────────────────────────────────── */}
        {includeTax && (
          <div className="apple-segmented-control" style={{ marginBottom: '24px', width: 'fit-content' }}>
            <button
              type="button"
              className={`apple-segmented-item ${effectiveTab === 'simulation' ? 'active' : ''}`}
              onClick={() => setActiveTab('simulation')}
              aria-pressed={effectiveTab === 'simulation'}
            >
              Simulation
            </button>
            <button
              type="button"
              className={`apple-segmented-item ${effectiveTab === 'tax' ? 'active' : ''}`}
              onClick={() => setActiveTab('tax')}
              aria-pressed={effectiveTab === 'tax'}
            >
              Tax Analysis
            </button>
          </div>
        )}

        {effectiveTab === 'simulation' && (<>
        <div className="calculator-chart__header">
          <div>
            <span className="calculator-chart__eyebrow">{includeTuition ? 'Scenario field' : 'Balance distribution'}</span>
            <h2 className="calculator-chart__title">{includeTuition ? 'Where 1,000 college outcomes land' : 'Where 1,000 savings paths land'}</h2>
            <p className="calculator-chart__copy">
              {includeTuition
                ? `Each point is one simulated ${yearsToMatriculation}-year path. Median savings and median tuition are marked so the cloud is easier to read.`
                : `Each point is one simulated ${yearsToMatriculation}-year path. The vertical spread separates the dots so the balance distribution is easier to read.`}
            </p>
          </div>
          <div className="calculator-chart__header-side">
            <span className={`calculator-status-pill ${showCalculatorState ? 'is-busy' : ''}`}>
              {showCalculatorState ? 'Refreshing projections' : 'Updated'}
            </span>
            {includeTuition && (
            <div className="calculator-chart__legend">
              <span className={`calculator-chart__legend-item ${showSuccess ? '' : 'is-muted'}`}>
                <i className="calculator-chart__legend-swatch calculator-chart__legend-swatch--success" />
                Funded paths
                <strong>{successCount}</strong>
              </span>
              <span className={`calculator-chart__legend-item ${showFailure ? '' : 'is-muted'}`}>
                <i className="calculator-chart__legend-swatch calculator-chart__legend-swatch--shortfall" />
                Shortfall paths
                <strong>{shortfallCount}</strong>
              </span>
            </div>
            )}
          </div>
        </div>

        <div className={`calculator-chart-shell ${showCalculatorState ? 'is-busy' : ''}`}>
          <div className="calculator-chart-shell__glow calculator-chart-shell__glow--top" />
          <div className="calculator-chart-shell__glow calculator-chart-shell__glow--bottom" />

          <div className="calculator-chart-meta">
            {includeTax && (
              <div className="calculator-chart-meta__item">
                <span>After-tax median</span>
                <strong>{formatCompactCurrency(afterTaxStats.median)}</strong>
              </div>
            )}
            <div className="calculator-chart-meta__item">
              <span>{includeTax ? 'Pre-tax median' : 'Median savings'}</span>
              <strong style={includeTax ? { opacity: 0.6 } : undefined}>{formatCompactCurrency(simulation.medianSavings)}</strong>
            </div>
            {includeTuition && (
            <div className="calculator-chart-meta__item">
              <span>Median tuition</span>
              <strong>{formatCompactCurrency(simulation.expectedTuition)}</strong>
            </div>
            )}
            <div className="calculator-chart-meta__item">
              <span>{includeTuition ? 'Paths funded' : 'Total paths'}</span>
              <strong>
                {includeTuition ? `${successCount} / ${totalPaths}` : totalPaths.toLocaleString()}
              </strong>
            </div>
          </div>

          <div className="calculator-chart-stage">
            {includeTuition && <div className="calculator-chart-stage__wash calculator-chart-stage__wash--shortfall" />}
            <div className="calculator-chart-stage__wash calculator-chart-stage__wash--success" />
            {includeTuition ? (
              <>
              <span className="calculator-chart-stage__label calculator-chart-stage__label--top">Higher tuition pressure</span>
              <span className="calculator-chart-stage__label calculator-chart-stage__label--bottom">Stronger savings outcomes</span>
              </>
            ) : (
              <span className="calculator-chart-stage__label calculator-chart-stage__label--bottom">Higher balance outcomes</span>
            )}

            <div className="calculator-chart-surface">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 54, right: 24, bottom: 56, left: 10 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 12" stroke="var(--chart-grid)" />
                  {includeTax && (
                    <>
                    <ReferenceLine
                      x={simulation.medianSavings}
                      stroke="var(--chart-guide-blue)"
                      strokeDasharray="3 10"
                      strokeOpacity={0.35}
                      ifOverflow="extendDomain"
                    />
                    <ReferenceLine
                      x={afterTaxStats.median}
                      stroke="var(--chart-guide-blue)"
                      strokeDasharray="5 7"
                      ifOverflow="extendDomain"
                    />
                    </>
                  )}
                  {!includeTax && (
                    <ReferenceLine
                      x={simulation.medianSavings}
                      stroke="var(--chart-guide-blue)"
                      strokeDasharray="5 7"
                      ifOverflow="extendDomain"
                    />
                  )}
                  {includeTuition && (
                    <ReferenceLine
                      y={simulation.expectedTuition}
                      stroke="var(--chart-guide-orange)"
                      strokeDasharray="5 7"
                      ifOverflow="extendDomain"
                    />
                  )}
                  <XAxis
                    dataKey={includeTax ? "afterTaxBalance" : "savingsBalance"}
                    type="number"
                    name={includeTax ? "After-Tax Savings" : "Gross Savings"}
                    tickFormatter={formatCompactCurrency}
                    stroke="var(--text-soft)"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={12}
                    fontSize={12}
                    domain={['auto', 'auto']}
                  />
                  {includeTuition ? (
                    <YAxis
                      dataKey="tuitionCost"
                      type="number"
                      name="Projected Tuition"
                      tickFormatter={formatCompactCurrency}
                      stroke="var(--text-soft)"
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      fontSize={12}
                      domain={['auto', 'auto']}
                    />
                  ) : (
                    <YAxis
                      dataKey="pathIndex"
                      type="number"
                      name="Path"
                      hide
                      domain={[0, 'auto']}
                    />
                  )}
                  <Tooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      const point = payload?.[0]?.payload as AfterTaxPoint | undefined;

                      if (active && point) {
                        if (!includeTuition) {
                          return (
                            <div className="calculator-tooltip">
                              <span className="calculator-tooltip__eyebrow is-success">Simulation path</span>
                              {includeTax ? (
                                <>
                                  <div className="calculator-tooltip__row">
                                    <span>After-tax savings</span>
                                    <strong>{formatCurrency(point.afterTaxBalance)}</strong>
                                  </div>
                                  <div className="calculator-tooltip__row" style={{ opacity: 0.65 }}>
                                    <span>Pre-tax (gross)</span>
                                    <strong>{formatCurrency(point.savingsBalance)}</strong>
                                  </div>
                                </>
                              ) : (
                                <div className="calculator-tooltip__row">
                                  <span>Gross savings</span>
                                  <strong>{formatCurrency(point.savingsBalance)}</strong>
                                </div>
                              )}
                            </div>
                          );
                        }
                        const isFunded = includeTax ? point.afterTaxIsSuccess : point.isSuccess;
                        return (
                          <div className="calculator-tooltip">
                            <span className={`calculator-tooltip__eyebrow ${isFunded ? 'is-success' : 'is-shortfall'}`}>
                              {isFunded ? 'Funded path' : 'Shortfall path'}
                            </span>
                            {includeTax ? (
                              <>
                                <div className="calculator-tooltip__row">
                                  <span>After-tax savings</span>
                                  <strong>{formatCurrency(point.afterTaxBalance)}</strong>
                                </div>
                                <div className="calculator-tooltip__row" style={{ opacity: 0.65 }}>
                                  <span>Pre-tax (gross)</span>
                                  <strong>{formatCurrency(point.savingsBalance)}</strong>
                                </div>
                              </>
                            ) : (
                              <div className="calculator-tooltip__row">
                                <span>Gross savings</span>
                                <strong>{formatCurrency(point.savingsBalance)}</strong>
                              </div>
                            )}
                            <div className="calculator-tooltip__row">
                              <span>Projected tuition</span>
                              <strong>{formatCurrency(point.tuitionCost)}</strong>
                            </div>
                          </div>
                        );
                      }

                      return null;
                    }}
                  />

                  {includeTuition ? (
                    <>
                    <Scatter
                      name="Successful"
                      data={filteredPoints.successPoints}
                      fill="var(--chart-success-dot)"
                      stroke="rgba(16, 185, 129, 0.2)"
                      strokeWidth={0.6}
                      shape="circle"
                      isAnimationActive={false}
                    />
                    <Scatter
                      name="Falling Short"
                      data={filteredPoints.shortfallPoints}
                      fill="var(--chart-shortfall-dot)"
                      stroke="rgba(138, 147, 166, 0.16)"
                      strokeWidth={0.5}
                      shape="circle"
                      isAnimationActive={false}
                    />
                    </>
                  ) : (
                    <Scatter
                      name="All Paths"
                      data={filteredPoints.successPoints}
                      fill="rgba(79, 143, 247, 0.6)"
                      stroke="rgba(79, 143, 247, 0.2)"
                      strokeWidth={0.6}
                      shape="circle"
                      isAnimationActive={false}
                    />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <AnimatePresence>
            {showCalculatorState ? (
              <motion.div
                className="calculator-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <div className="calculator-overlay__panel">
                  <span className="calculator-overlay__eyebrow">Calculating</span>
                  <strong>Repricing 1,000 market paths</strong>
                  <p>Keeping the current chart visible while the next scenario set finishes in the background.</p>
                  <div className="calculator-overlay__progress">
                    <span />
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        </>)}

        {effectiveTab === 'tax' && (
          <TaxSavings
            annualContribution={debouncedAnnual}
            employerMatchAnnual={debouncedMatch}
            monthlyMean={monthlyMean}
            mcMedianSavings={simulation.medianSavings}
            expectedTuition={simulation.expectedTuition}
            filingStatus={filingStatus}
            baseCaIncome={baseCaIncome}
            parentFederalRate={parentFederalRate}
            childFutureRate={childFutureRate}
            includeAnnualCaKiddieTax={includeAnnualCaKiddieTax}
            onToggleCaKiddieTax={() => setIncludeAnnualCaKiddieTax(v => !v)}
            includeTuition={includeTuition}
            years={yearsToMatriculation}
            initialSeed={initialSeed}
          />
        )}
      </main>
    </div>
    </>
  );
}
