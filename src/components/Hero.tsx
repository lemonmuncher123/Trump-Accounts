import React from 'react';
import { motion } from 'framer-motion';

const previewBars = [38, 46, 52, 44, 58, 64, 57, 73, 68, 84, 79, 92];

interface HeroProps {
  dataRangeConfig: string;
}

export default function Hero({ dataRangeConfig }: HeroProps) {
  return (
    <section className="hero-section container">
      <motion.div
        className="hero-shell"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="hero-copy">
          <div className="badge">Stable Investing / Up to 18-Year Horizon</div>
          <h1 className="hero-title">
            Your child's future
            <br />
            <span className="text-gradient">starts with one decision.</span>
          </h1>
          <p className="hero-subtitle">
            Model a Trump Account, then scroll down to see why decades of research say the same thing:
            low-cost index funds and consistent contributions beat everything else over a long horizon.
          </p>
          <div className="hero-inline-meta">
            <span>1,000 market paths</span>
            <span>Up to 18-year horizon</span>
            <span>{dataRangeConfig} data window</span>
          </div>
          <p className="hero-meta">Historical S&amp;P 500 behavior powers the baseline return and volatility assumptions.</p>
        </div>

        <motion.div
          className="hero-preview"
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, delay: 0.12, ease: 'easeOut' }}
          aria-hidden="true"
        >
          <div className="hero-preview__glow hero-preview__glow--top" />
          <div className="hero-preview__glow hero-preview__glow--bottom" />

          <div className="hero-preview__header">
            <div>
              <span className="hero-preview__eyebrow">Calculator Preview</span>
              <strong className="hero-preview__title">Live inputs below</strong>
            </div>
            <span className="hero-preview__status">Ready</span>
          </div>

          <div className="hero-preview__controls">
            <div className="hero-preview__control">
              <div className="hero-preview__label-row">
                <span>Family annual input</span>
                <strong>$5,000</strong>
              </div>
              <div className="hero-preview__track">
                <span style={{ width: '25%' }} />
              </div>
            </div>

            <div className="hero-preview__control">
              <div className="hero-preview__label-row">
                <span>Employer match</span>
                <strong>$0</strong>
              </div>
              <div className="hero-preview__track">
                <span style={{ width: '0%' }} />
              </div>
            </div>
          </div>

          <div className="hero-preview__metrics" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <div>
              <span>Growth window</span>
              <strong>Up to 18 yrs</strong>
            </div>
            <div>
              <span>Simulated paths</span>
              <strong>1,000</strong>
            </div>
          </div>

          <div className="hero-preview__chart">
            {previewBars.map((height, index) => (
              <span
                key={index}
                className="hero-preview__bar"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
