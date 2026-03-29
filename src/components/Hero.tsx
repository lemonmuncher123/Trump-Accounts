import React from 'react';
import { motion } from 'framer-motion';

const previewBars = [38, 46, 52, 44, 58, 64, 57, 73, 68, 84, 79, 92];

export default function Hero({ dataRangeConfig }: { dataRangeConfig: string }) {
  return (
    <section className="hero-section container">
      <motion.div
        className="hero-shell"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="hero-copy">
          <div className="badge">Section 530A / OBBBA 2025</div>
          <h1 className="hero-title">
            Model the account
            <br />
            <span className="text-gradient">before you debate it.</span>
          </h1>
          <p className="hero-subtitle">
            Adjust annual savings, employer match, and school target to reprice 1,000 projected 18-year
            outcomes without leaving this route.
          </p>
          <div className="hero-inline-meta">
            <span>1,000 market paths</span>
            <span>18-year horizon</span>
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
                <span style={{ width: '42%' }} />
              </div>
            </div>

            <div className="hero-preview__control">
              <div className="hero-preview__label-row">
                <span>Employer match</span>
                <strong>$2,500</strong>
              </div>
              <div className="hero-preview__track">
                <span style={{ width: '28%' }} />
              </div>
            </div>
          </div>

          <div className="hero-preview__metrics">
            <div>
              <span>Median balance</span>
              <strong>$184k</strong>
            </div>
            <div>
              <span>Target tuition</span>
              <strong>$115k</strong>
            </div>
            <div>
              <span>Success rate</span>
              <strong>82.4%</strong>
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
