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

interface Props {
  historicalMeanReturn: number;
  historicalVolatility: number;
  dataRangeConfig: string;
}

interface WorkerResponse {
  requestId: number;
  result: SimulationOutput;
}

const MIN_CALCULATION_DISPLAY_MS = 1500;

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

export default function Calculator({ historicalMeanReturn, historicalVolatility, dataRangeConfig }: Props) {
  const [annualContribution, setAnnualContribution] = useState(5000);
  const [employerMatchAnnual, setEmployerMatchAnnual] = useState(0);
  const [universityType, setUniversityType] = useState<UniversityType>('public');
  const [showSuccess, setShowSuccess] = useState(true);
  const [showFailure, setShowFailure] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  const debouncedAnnual = useDebounce(annualContribution, 160);
  const debouncedMatch = useDebounce(employerMatchAnnual, 160);

  const [simulation, setSimulation] = useState<SimulationOutput>(() =>
    simulateCollegeSavings({
      annualContribution: 5000,
      employerMatchAnnual: 0,
      universityType: 'public',
      yearsToMatriculation: 18,
      historicalMeanReturn,
      historicalVolatility
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

    const nextInput: CalculatorInput = {
      annualContribution: debouncedAnnual,
      employerMatchAnnual: debouncedMatch,
      universityType,
      yearsToMatriculation: 18,
      historicalMeanReturn,
      historicalVolatility
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
  }, [debouncedAnnual, debouncedMatch, universityType, historicalMeanReturn, historicalVolatility]);

  const deferredPoints = useDeferredValue(simulation.scatterPoints);
  const isSettlingInput = annualContribution !== debouncedAnnual || employerMatchAnnual !== debouncedMatch;
  const showCalculatorState = isCalculating || isSettlingInput;

  const filteredPoints = useMemo(() => {
    const successPoints: SimulationPoint[] = [];
    const shortfallPoints: SimulationPoint[] = [];

    deferredPoints.forEach((point) => {
      if (point.isSuccess) {
        if (showSuccess) {
          successPoints.push(point);
        }
        return;
      }

      if (showFailure) {
        shortfallPoints.push(point);
      }
    });

    return { successPoints, shortfallPoints };
  }, [deferredPoints, showSuccess, showFailure]);

  const successCount = useMemo(
    () => simulation.scatterPoints.reduce((count, point) => count + (point.isSuccess ? 1 : 0), 0),
    [simulation.scatterPoints]
  );
  const totalPaths = simulation.scatterPoints.length;
  const shortfallCount = totalPaths - successCount;

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

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '8px' }}>
          Future College Savings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px', lineHeight: 1.5 }}>
          Monte-Carlo simulations generating 1,000 parallel 18-year realities based on real S&amp;P 500
          volatility ({dataRangeConfig}).
        </p>

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

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Family Annual Input
              </span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>${annualContribution.toLocaleString()}</span>
            </div>
            <input
              type="range"
              className="apple-slider"
              value={annualContribution}
              onChange={(event) => setAnnualContribution(Number(event.target.value))}
              min="0"
              max="20000"
              step="500"
              data-testid="annual-input"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Employer Match
              </span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-emerald)' }}>+ ${employerMatchAnnual.toLocaleString()}</span>
            </div>
            <input
              type="range"
              className="apple-slider"
              value={employerMatchAnnual}
              onChange={(event) => setEmployerMatchAnnual(Number(event.target.value))}
              min="0"
              max="10000"
              step="500"
              data-testid="match-input"
            />
          </div>
        </div>

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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Median End Balance:</span>
              <strong style={{ color: 'var(--text-main)' }}>{formatCurrency(simulation.medianSavings)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Est. 4-Year Tuition:</span>
              <strong style={{ color: 'var(--text-main)' }}>{formatCurrency(simulation.expectedTuition)}</strong>
            </div>
            <div style={{ height: '1px', background: 'var(--border-light)', margin: '16px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Success Rate:</span>
              <strong
                style={{
                  fontSize: '24px',
                  letterSpacing: '-0.02em',
                  color: simulation.successRate > 50 ? 'var(--accent-emerald)' : 'var(--accent-orange)'
                }}
              >
                {simulation.successRate.toFixed(1)}%
              </strong>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-chart-area">
        <div className="calculator-chart__header">
          <div>
            <span className="calculator-chart__eyebrow">Scenario field</span>
            <h2 className="calculator-chart__title">Where 1,000 college outcomes land</h2>
            <p className="calculator-chart__copy">
              Each point is one simulated 18-year path. Median savings and median tuition are marked so the cloud is easier to read.
            </p>
          </div>
          <div className="calculator-chart__header-side">
            <span className={`calculator-status-pill ${showCalculatorState ? 'is-busy' : ''}`}>
              {showCalculatorState ? 'Refreshing projections' : 'Updated'}
            </span>
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
          </div>
        </div>

        <div className={`calculator-chart-shell ${showCalculatorState ? 'is-busy' : ''}`}>
          <div className="calculator-chart-shell__glow calculator-chart-shell__glow--top" />
          <div className="calculator-chart-shell__glow calculator-chart-shell__glow--bottom" />

          <div className="calculator-chart-meta">
            <div className="calculator-chart-meta__item">
              <span>Median savings</span>
              <strong>{formatCompactCurrency(simulation.medianSavings)}</strong>
            </div>
            <div className="calculator-chart-meta__item">
              <span>Median tuition</span>
              <strong>{formatCompactCurrency(simulation.expectedTuition)}</strong>
            </div>
            <div className="calculator-chart-meta__item">
              <span>Paths funded</span>
              <strong>
                {successCount} / {totalPaths}
              </strong>
            </div>
          </div>

          <div className="calculator-chart-stage">
            <div className="calculator-chart-stage__wash calculator-chart-stage__wash--shortfall" />
            <div className="calculator-chart-stage__wash calculator-chart-stage__wash--success" />
            <span className="calculator-chart-stage__label calculator-chart-stage__label--top">Higher tuition pressure</span>
            <span className="calculator-chart-stage__label calculator-chart-stage__label--bottom">Stronger savings outcomes</span>

            <div className="calculator-chart-surface">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 54, right: 24, bottom: 56, left: 10 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 12" stroke="var(--chart-grid)" />
                  <ReferenceLine
                    x={simulation.medianSavings}
                    stroke="var(--chart-guide-blue)"
                    strokeDasharray="5 7"
                    ifOverflow="extendDomain"
                  />
                  <ReferenceLine
                    y={simulation.expectedTuition}
                    stroke="var(--chart-guide-orange)"
                    strokeDasharray="5 7"
                    ifOverflow="extendDomain"
                  />
                  <XAxis
                    dataKey="savingsBalance"
                    type="number"
                    name="Projected Savings"
                    tickFormatter={formatCompactCurrency}
                    stroke="var(--text-soft)"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={12}
                    fontSize={12}
                    domain={['auto', 'auto']}
                  />
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
                  <Tooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      const point = payload?.[0]?.payload as SimulationPoint | undefined;

                      if (active && point) {
                        return (
                          <div className="calculator-tooltip">
                            <span className={`calculator-tooltip__eyebrow ${point.isSuccess ? 'is-success' : 'is-shortfall'}`}>
                              {point.isSuccess ? 'Funded path' : 'Shortfall path'}
                            </span>
                            <div className="calculator-tooltip__row">
                              <span>Projected fund</span>
                              <strong>{formatCurrency(point.savingsBalance)}</strong>
                            </div>
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
      </main>
    </div>
  );
}
