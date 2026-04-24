import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Shield, PiggyBank, BookOpen, BarChart3, Clock } from 'lucide-react';

const vehicles = [
  {
    icon: <BarChart3 size={24} strokeWidth={1.8} />,
    title: 'S&P 500 Index Funds',
    tagline: 'The backbone of long-term wealth',
    color: 'var(--accent-blue)',
    bgColor: 'rgba(79, 143, 247, 0.08)',
    borderColor: 'rgba(79, 143, 247, 0.2)',
    stats: [
      { label: 'Annualized return (1957–2024)', value: '~10.3%' },
      { label: 'Real return after inflation', value: '~7%' },
      { label: 'Expense ratio (Vanguard VOO)', value: '0.03%' },
    ],
    body: 'A single S&P 500 index fund gives you ownership of 500 of America\'s largest companies. Over every rolling 20-year period since 1926, the S&P 500 has never produced a negative real return. For an 18-year college savings horizon, the historical odds are overwhelmingly in your favor.',
    citation: 'Siegel, J. (2014). Stocks for the Long Run. McGraw-Hill. — Documents that U.S. equities have outperformed bonds, bills, gold, and inflation over every two-decade window since 1802.',
  },
  {
    icon: <Shield size={24} strokeWidth={1.8} />,
    title: 'U.S. Treasury Securities',
    tagline: 'The risk-free anchor',
    color: 'var(--accent-emerald)',
    bgColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    stats: [
      { label: 'I-Bond composite rate (2025)', value: '3.11%' },
      { label: 'Default risk', value: 'Zero' },
      { label: 'Inflation protection (I-Bonds)', value: 'Built-in' },
    ],
    body: 'Treasury bonds are backed by the full faith and credit of the U.S. government — the closest thing to a risk-free investment. Series I Savings Bonds automatically adjust for inflation, preserving your purchasing power over time. They\'re ideal for the conservative portion of any college savings portfolio.',
    citation: 'Damodaran, A. (2023). Equity Risk Premiums. NYU Stern Working Paper. — U.S. Treasuries serve as the global benchmark for the risk-free rate; I-Bonds add CPI adjustment for real-return preservation.',
  },
  {
    icon: <PiggyBank size={24} strokeWidth={1.8} />,
    title: '529 College Savings Plans',
    tagline: 'Tax-advantaged education accounts',
    color: 'var(--accent-purple)',
    bgColor: 'rgba(168, 85, 247, 0.08)',
    borderColor: 'rgba(168, 85, 247, 0.2)',
    stats: [
      { label: 'Federal tax on growth', value: '$0' },
      { label: 'State tax deduction', value: '30+ states' },
      { label: 'Max lifetime contribution', value: '$235k–$550k' },
    ],
    body: 'Unlike Trump Accounts (Section 530A) which tax earnings at distribution, 529 plans offer completely tax-free growth when used for qualified education expenses. Many states add a state income tax deduction for contributions. These plans have a decades-long track record and require no new legislation to use.',
    citation: 'Dynarski, S. (2004). "Who Benefits from the Education Saving Incentives?" National Tax Journal, 57(2). — Analyzes the distributional impact of tax-advantaged education savings vehicles.',
  },
];

const principles = [
  {
    icon: <Clock size={20} strokeWidth={1.8} />,
    title: 'Start early, stay invested',
    copy: 'A dollar invested at birth has 18 years to compound. At 7% real return, $1 becomes $3.38. At 10%, it becomes $5.56. The single most powerful variable in investing is time — not stock picking, not timing the market.',
  },
  {
    icon: <TrendingUp size={20} strokeWidth={1.8} />,
    title: 'Keep costs near zero',
    copy: 'The average actively managed fund charges 0.66% annually; a Vanguard Total Market index fund charges 0.03%. Over 18 years, that gap compounds into tens of thousands of dollars in lost returns. Low-cost index investing consistently outperforms 90% of active managers.',
  },
  {
    icon: <BookOpen size={20} strokeWidth={1.8} />,
    title: 'Diversify and automate',
    copy: 'A simple three-fund portfolio (U.S. stocks, international stocks, bonds) with automatic monthly contributions removes emotion from investing. Dollar-cost averaging smooths out volatility and requires zero market timing skill.',
  },
];

const researchSources = [
  {
    authors: 'Malkiel, B.',
    year: '1973, updated 2023',
    title: 'A Random Walk Down Wall Street',
    detail: 'Princeton economist\'s seminal work demonstrating that a blindfolded monkey throwing darts at a stock listing could match actively managed portfolios. Passive index investing remains the single most evidence-backed strategy for individual investors.',
  },
  {
    authors: 'Vanguard Research',
    year: '2019',
    title: 'The Case for Low-Cost Index-Fund Investing',
    detail: 'Over 15-year periods, 85–90% of actively managed large-cap U.S. funds underperform their benchmark index. The longer the time horizon, the worse active management fares — making index funds the clear choice for college savings.',
  },
  {
    authors: 'DALBAR Inc.',
    year: '2024',
    title: 'Quantitative Analysis of Investor Behavior (QAIB)',
    detail: 'The average equity fund investor earned 6.81% annually over 30 years versus 10.15% for the S&P 500. The gap — nearly $300,000 on a $100,000 investment — is driven almost entirely by emotional decision-making: panic selling and performance chasing.',
  },
  {
    authors: 'Dimson, E., Marsh, P., Staunton, M.',
    year: '2002–2024',
    title: 'Credit Suisse Global Investment Returns Yearbook',
    detail: 'The longest continuous dataset on global asset returns (125 years, 35 countries) confirms that equities have produced positive real returns over every 20-year window in every major market studied. Diversified equity exposure is the most reliable path to long-term wealth creation.',
  },
  {
    authors: 'Fama, E. & French, K.',
    year: '2010',
    title: '"Luck versus Skill in the Cross-Section of Mutual Fund Returns"',
    detail: 'Published in the Journal of Finance, this study demonstrates that the number of fund managers who outperform the market is statistically indistinguishable from what you\'d expect by pure luck alone. The implication: buy the market, not a manager.',
  },
];

export default function BeyondTrumpAccounts() {
  return (
    <section className="container section-spacing beyond-section">
      <div className="section-frame">
        <motion.div
          className="section-intro"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-kicker">Beyond Trump Accounts</span>
          <h2 className="section-title">
            The policy is new. The math behind building wealth isn't.
          </h2>
          <p className="section-copy">
            Whether or not Section 530A survives its next legislative cycle, the core principle
            holds: consistent, low-cost investing over an 18-year horizon is the most
            evidence-backed way to fund a child's education. Here's what decades of
            financial research actually tells us.
          </p>
        </motion.div>

        {/* Comparison highlight */}
        <motion.div
          className="beyond-comparison"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="beyond-comparison__header">
            <span className="beyond-comparison__eyebrow">18-Year Projection</span>
            <strong>$250/month invested consistently from birth</strong>
          </div>
          <div className="beyond-comparison__grid">
            <div className="beyond-comparison__item">
              <span>Savings account (0.5% APY)</span>
              <strong style={{ color: 'var(--text-muted)' }}>$55,800</strong>
            </div>
            <div className="beyond-comparison__item">
              <span>Treasury I-Bonds (~3% real)</span>
              <strong style={{ color: 'var(--accent-emerald)' }}>$68,400</strong>
            </div>
            <div className="beyond-comparison__item">
              <span>S&P 500 Index Fund (~10% nominal)</span>
              <strong style={{ color: 'var(--accent-blue)' }}>$136,800</strong>
            </div>
            <div className="beyond-comparison__item beyond-comparison__item--highlight">
              <span>Difference: index vs. savings</span>
              <strong className="text-gradient">+$81,000</strong>
            </div>
          </div>
          <p className="beyond-comparison__footnote">
            Based on historical averages. Past performance does not guarantee future results, but 18-year rolling
            windows have never produced negative real returns for diversified U.S. equities since 1926.
          </p>
        </motion.div>

        {/* Investment vehicles */}
        <div className="beyond-vehicles">
          {vehicles.map((v, i) => (
            <motion.article
              key={v.title}
              className="beyond-vehicle"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <div className="beyond-vehicle__head" style={{ borderColor: v.borderColor }}>
                <div className="beyond-vehicle__icon" style={{ background: v.bgColor, color: v.color }}>
                  {v.icon}
                </div>
                <div>
                  <h3 className="beyond-vehicle__title">{v.title}</h3>
                  <span className="beyond-vehicle__tagline">{v.tagline}</span>
                </div>
              </div>

              <div className="beyond-vehicle__stats">
                {v.stats.map((s) => (
                  <div key={s.label} className="beyond-vehicle__stat">
                    <span>{s.label}</span>
                    <strong style={{ color: v.color }}>{s.value}</strong>
                  </div>
                ))}
              </div>

              <p className="beyond-vehicle__body">{v.body}</p>

              <div className="beyond-vehicle__cite">
                <BookOpen size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{v.citation}</span>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Core principles */}
        <motion.div
          className="beyond-principles-wrap"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
        >
          <div className="beyond-principles-header">
            <span className="section-kicker">Evidence-Based Principles</span>
            <h3 className="beyond-principles-title">Three rules that beat every market-timing guru</h3>
          </div>
          <div className="beyond-principles">
            {principles.map((p, i) => (
              <motion.div
                key={p.title}
                className="beyond-principle"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div className="beyond-principle__icon">{p.icon}</div>
                <h4>{p.title}</h4>
                <p>{p.copy}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Research sources */}
        <motion.div
          className="beyond-research"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
        >
          <div className="beyond-research__header">
            <span className="section-kicker">Research & Sources</span>
            <h3 className="beyond-research__title">
              The academic consensus is clear: buy the market, keep costs low, and stay invested.
            </h3>
          </div>

          <div className="beyond-research__list">
            {researchSources.map((src, i) => (
              <motion.div
                key={src.title}
                className="beyond-research__item"
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
              >
                <div className="beyond-research__meta">
                  <strong>{src.authors}</strong>
                  <span>{src.year}</span>
                </div>
                <h4>{src.title}</h4>
                <p>{src.detail}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="beyond-cta"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <h3>You don't need a new government program to start building wealth.</h3>
          <p>
            Open a brokerage account, buy a total-market index fund, set up automatic contributions,
            and let 18 years of compounding do the rest. The research says this beats 90% of
            professional money managers — and it takes about 15 minutes to set up.
          </p>
          <div className="beyond-cta__steps">
            <div className="beyond-cta__step">
              <span>1</span>
              <div>
                <strong>Open a 529 or brokerage account</strong>
                <p>Vanguard, Fidelity, and Schwab all offer zero-minimum accounts with index fund options under 0.05% expense ratio.</p>
              </div>
            </div>
            <div className="beyond-cta__step">
              <span>2</span>
              <div>
                <strong>Choose a low-cost index fund</strong>
                <p>A total U.S. stock market fund (VTI/VTSAX) or S&P 500 fund (VOO/VFIAX) is all most people need to start.</p>
              </div>
            </div>
            <div className="beyond-cta__step">
              <span>3</span>
              <div>
                <strong>Automate and forget</strong>
                <p>Set up automatic monthly contributions. The DALBAR data is unambiguous: the less you touch your investments, the more money you make.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
