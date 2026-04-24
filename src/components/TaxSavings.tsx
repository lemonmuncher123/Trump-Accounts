import React, { useMemo } from 'react';
import {
  californiaIncrementalTax,
  capContributions,
  runTaxModel,
  type FilingStatus,
} from '../lib/caTaxCalculator';

interface Props {
  /** Debounced family annual contribution from the main calculator */
  annualContribution: number;
  /** Debounced employer match from the main calculator */
  employerMatchAnnual: number;
  /**
   * S&P 500 monthly mean return passed down from index.astro. The deterministic
   * tax model compounds this 12 times per year so the implied annual factor is
   * (1 + monthlyMean)^12, matching the Monte Carlo simulator's monthly inner loop.
   */
  monthlyMean: number;
  /** Median gross savings from the Monte Carlo simulation (pre-tax, capped) */
  mcMedianSavings: number;
  /** Median expected 4-year tuition cost at age 18 from the Monte Carlo simulation */
  expectedTuition: number;
  // ── Tax profile — all 4 lifted to Calculator so both sections share one set of inputs ──
  filingStatus: FilingStatus;
  baseCaIncome: number;
  parentFederalRate: number;
  childFutureRate: number;
  /**
   * Layer 2 CA toggle.
   * ON: annual CA kiddie-tax on Trump Account growth (conservative).
   * OFF: terminal CA tax at distribution (optimistic deferral).
   * Layer 1 (CA nonconformity) is always on.
   */
  includeAnnualCaKiddieTax: boolean;
  onToggleCaKiddieTax: () => void;
}


function fmt(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function fmtSigned(value: number): string {
  const abs = fmt(Math.abs(value));
  return value >= 0 ? `+${abs}` : `−${abs.slice(1)}`;
}

export default function TaxSavings({
  annualContribution,
  employerMatchAnnual,
  monthlyMean,
  mcMedianSavings,
  expectedTuition,
  filingStatus,
  baseCaIncome,
  parentFederalRate,
  childFutureRate,
  includeAnnualCaKiddieTax,
  onToggleCaKiddieTax,
}: Props) {

  const { employerC, otherC, wasCapped } = useMemo(
    () => capContributions(employerMatchAnnual, annualContribution),
    [employerMatchAnnual, annualContribution],
  );

  // Annualized return for display purposes only — derived from the monthly mean
  // so the headline rate matches what the deterministic model actually compounds.
  const annualizedReturn = useMemo(() => Math.pow(1 + monthlyMean, 12) - 1, [monthlyMean]);

  const result = useMemo(
    () =>
      runTaxModel({
        years: 18,
        annualEmployerContribution: employerC,
        annualOtherContribution:    otherC,
        monthlyReturnRate:          monthlyMean,
        filingStatus,
        baseCaTaxableIncome:        baseCaIncome,
        parentFederalMarginalRate:  parentFederalRate,
        childFutureFederalRate:     childFutureRate,
        includeAnnualCaKiddieTax,
      }),
    [employerC, otherC, monthlyMean, filingStatus, baseCaIncome, parentFederalRate, childFutureRate, includeAnnualCaKiddieTax],
  );

  // Tuition gross-up: from a taxable account you must earn more before taxes
  // in order to net the tuition amount. Combined marginal rate = federal + CA.
  const effectiveCaRate = useMemo(() => {
    if (baseCaIncome <= 0) return 0;
    // Marginal rate: tax on $1 of additional income
    return californiaIncrementalTax(baseCaIncome, 1, filingStatus);
  }, [baseCaIncome, filingStatus]);

  const combinedMarginalRate = parentFederalRate + effectiveCaRate;
  // Pre-tax dollars needed in a taxable account to net the same tuition payment
  const taxableGrossUp = combinedMarginalRate < 1
    ? expectedTuition / (1 - combinedMarginalRate)
    : expectedTuition;
  const taxPremium = taxableGrossUp - expectedTuition;

  // Use runTaxModel's deterministic Trump final balance as the single source of truth
  // for the tax analysis tab. This ensures the CA toggle directly affects the displayed value.
  const wealthDifference = result.trumpFinalBalance - result.baselineFinalBalance;
  const wealthPositive   = wealthDifference >= 0;

  return (
    <section style={{ padding: 0 }}>

      {/* ── Section header ───────────────────────────────────────── */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--accent-purple)',
          display: 'block',
          marginBottom: '6px',
        }}>
          Tax analysis · California 2025
        </span>
        <h2 style={{
          fontSize: 'clamp(22px, 3vw, 28px)',
          fontWeight: 700,
          letterSpacing: '-0.5px',
          margin: '0 0 8px',
          color: 'var(--text-main)',
        }}>
          Federal &amp; State Tax Advantage
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, maxWidth: '600px', margin: 0 }}>
          The Simulation tab plots stochastic 18-year paths — <strong style={{ color: 'var(--text-main)' }}>gross by default</strong>, or <strong style={{ color: 'var(--text-main)' }}>after federal &amp; CA tax</strong> when the <em>Include taxes</em> toggle is on (median, success rate, and scatter X-axis all switch).
          This tab applies taxes to both vehicles using a deterministic {(annualizedReturn * 100).toFixed(1)}% annual return: the <strong style={{ color: 'var(--text-main)' }}>Trump Account</strong> includes federal distribution tax and CA tax (annual kiddie-tax or terminal, depending on the toggle below);
          the <strong style={{ color: 'var(--text-main)' }}>Taxable Account</strong> includes annual LTCG drag and a terminal liquidation tax at year 18.
          The gap between the two accounts is your real after-tax advantage.
        </p>
      </div>

      {/* ── CA scenario toggle ───────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        marginBottom: '20px',
        gap: '16px',
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '3px' }}>
            Annual CA Kiddie-Tax on Trump Account Growth
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: '520px' }}>
            <strong style={{ color: 'var(--accent-purple)' }}>Layer 1 (always on):</strong> CA nonconformity — employer contributions are CA-taxable (confirmed).
            <br />
            <strong style={{ color: includeAnnualCaKiddieTax ? 'var(--accent-orange)' : 'var(--text-muted)' }}>Layer 2 (toggle):</strong>{' '}
            {includeAnnualCaKiddieTax
              ? 'Conservative — annual CA tax on 5% of Trump Account gains at kiddie-tax rates.'
              : 'Optimistic — no annual kiddie-tax drag; CA taxes deferred gains at distribution.'}
          </div>
        </div>
        <div
          className={`apple-toggle ${includeAnnualCaKiddieTax ? 'active' : ''}`}
          onClick={onToggleCaKiddieTax}
          style={{ flexShrink: 0 }}
        >
          <div className="toggle-thumb" />
        </div>
      </div>

      {/* ── Contribution cap notice ──────────────────────────────── */}
      {wasCapped && (
        <div style={{
          background:   'rgba(249, 115, 22, 0.08)',
          border:       '1px solid rgba(249, 115, 22, 0.25)',
          borderRadius: '12px',
          padding:      '12px 16px',
          marginBottom: '20px',
          fontSize:     '13px',
          color:        'var(--accent-orange)',
          display:      'flex',
          gap:          '10px',
          alignItems:   'flex-start',
        }}>
          <span style={{ flexShrink: 0 }}>⚠</span>
          <span>
            Your inputs exceed the Trump Account statutory limits ($2,500 employer / $5,000 total per year).
            All figures use capped amounts:{' '}
            <strong>employer ${employerC.toLocaleString()} + individual ${otherC.toLocaleString()}</strong>.
          </span>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Wealth comparison */}
          <div
            className="glass-panel"
            style={{
              marginBottom: 0,
              background:   wealthPositive ? 'rgba(16, 185, 129, 0.04)' : 'rgba(249, 115, 22, 0.04)',
              borderColor:  wealthPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.15)',
            }}
          >
            {/* Monte Carlo bridge row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '12px', padding: '8px 12px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
            fontSize: '12px', color: 'var(--text-muted)',
          }}>
            <span>Monte Carlo median <span style={{ opacity: 0.6 }}>(gross, pre-tax)</span></span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{fmt(mcMedianSavings)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                After-Tax Wealth at Year 18
              </span>
              <span style={{
                fontSize:     'clamp(20px, 2.5vw, 28px)',
                fontWeight:   700,
                letterSpacing:'-0.03em',
                color:         wealthPositive ? 'var(--accent-emerald)' : 'var(--accent-orange)',
              }}>
                {fmtSigned(wealthDifference)}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Trump Account', value: result.trumpFinalBalance, accent: 'var(--accent-emerald)' },
                { label: 'Taxable Account', value: result.baselineFinalBalance, accent: 'var(--text-muted)' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: row.accent }}>
                    {fmt(row.value)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ height: '1px', background: 'var(--border-light)', margin: '16px 0' }} />

            {/* Simple bar comparison */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Trump Account', value: result.trumpFinalBalance, color: 'var(--accent-emerald)' },
                { label: 'Taxable',       value: result.baselineFinalBalance, color: 'rgba(143,152,171,0.5)' },
              ].map(bar => {
                const maxVal = Math.max(result.trumpFinalBalance, result.baselineFinalBalance);
                const pct    = maxVal > 0 ? (bar.value / maxVal) * 100 : 0;
                return (
                  <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '110px', flexShrink: 0 }}>
                      {bar.label}
                    </span>
                    <div style={{ flex: 1, height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: bar.color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 600, width: '90px', textAlign: 'right', flexShrink: 0 }}>
                      {fmt(bar.value)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Assumes qualified education use (no early withdrawal penalty).
              Both accounts compared on fully-liquidated after-tax cash at year 18.
              Taxable baseline includes terminal LTCG + CA tax on unrealized gains; federal growth deferred until distribution.
              {includeAnnualCaKiddieTax
                ? ' Trump Account CA tax: annual kiddie-tax on 5% of gains (conservative).'
                : ' Trump Account CA tax: deferred gains taxed at distribution (optimistic deferral).'}
            </div>
          </div>
        </div>

      {/* ── Tuition gross-up panel ───────────────────────────────── */}
      <div
        className="glass-panel"
        style={{ marginTop: '20px', marginBottom: 0 }}
      >
        <p style={{
          fontSize:      '11px',
          fontWeight:    600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color:         'var(--text-muted)',
          marginBottom:  '16px',
        }}>
          Salary Gross-Up Illustration
        </p>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px', maxWidth: '700px' }}>
          Your Monte Carlo projects a median tuition bill of{' '}
          <strong style={{ color: 'var(--text-main)' }}>{fmt(expectedTuition)}</strong> at year 18.
          A Trump Account used for qualified education avoids the{' '}
          <strong style={{ color: 'var(--accent-emerald)' }}>10% early withdrawal penalty</strong>; however, earnings above basis are still taxed as ordinary income at the child's rate.
          By comparison, a taxable account must be fully liquidated and taxed at your marginal rate, requiring{' '}
          <strong style={{ color: 'var(--accent-orange)' }}>{fmt(taxableGrossUp)}</strong> of pre-tax savings to net the same amount after your{' '}
          {(combinedMarginalRate * 100).toFixed(1)}% combined marginal rate ({(parentFederalRate * 100).toFixed(0)}% federal + {(effectiveCaRate * 100).toFixed(1)}% CA).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          {[
            {
              label:   'Nominal Tuition',
              value:   expectedTuition,
              accent:  'var(--text-main)',
              bg:      'rgba(255,255,255,0.02)',
              border:  'var(--border-light)',
              note:    'What you actually owe',
            },
            {
              label:   'Trump Account Needed',
              value:   expectedTuition,
              accent:  'var(--accent-emerald)',
              bg:      'rgba(16, 185, 129, 0.05)',
              border:  'rgba(16, 185, 129, 0.18)',
              note:    'Penalty-free; earnings taxed at child rate',
            },
            {
              label:   'Taxable Account Needed',
              value:   taxableGrossUp,
              accent:  'var(--accent-orange)',
              bg:      'rgba(249, 115, 22, 0.05)',
              border:  'rgba(249, 115, 22, 0.18)',
              note:    `+${fmt(taxPremium)} tax premium`,
            },
          ].map(card => (
            <div
              key={card.label}
              className="glass-panel"
              style={{
                marginBottom: 0,
                background:   card.bg,
                borderColor:  card.border,
                textAlign:    'center',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
                {card.label}
              </div>
              <div style={{ fontSize: 'clamp(18px, 2.2vw, 24px)', fontWeight: 700, letterSpacing: '-0.03em', color: card.accent }}>
                {fmt(card.value)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                {card.note}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Gross-up formula: tuition ÷ (1 − combined marginal rate). This illustrates how much additional salary you would need to earn to net the tuition amount after ordinary income taxes. If paying from a taxable brokerage (LTCG rates), the premium would be smaller. Trump Account qualified education withdrawals avoid the 10% penalty; the taxable portion (earnings above basis) is still subject to ordinary income tax at the child's future rate.
        </div>
      </div>
    </section>
  );
}
