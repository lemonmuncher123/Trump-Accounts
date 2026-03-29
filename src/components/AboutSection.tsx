import React from 'react';
import { motion } from 'framer-motion';
import { DatabaseZap, ShieldCheck, ScanSearch } from 'lucide-react';

const principles = [
  {
    icon: <DatabaseZap size={22} strokeWidth={1.8} />,
    title: 'Grounded in market history',
    copy: 'The simulation uses historical S&P 500 data as its volatility anchor so users are exploring distributions instead of static guesses.'
  },
  {
    icon: <ScanSearch size={22} strokeWidth={1.8} />,
    title: 'Built for clarity',
    copy: 'The page translates policy language into a simpler planning flow: first test the numbers, then review how the account mechanics and open questions affect the outcome.'
  },
  {
    icon: <ShieldCheck size={22} strokeWidth={1.8} />,
    title: 'Not a substitute for advice',
    copy: 'This is a decision-support tool, not tax, legal, or fiduciary guidance. Families should still validate the final rules that apply to their state and custodian.'
  }
];

export default function AboutSection() {
  return (
    <section className="container section-spacing" style={{ paddingBottom: '24px' }}>
      <div className="section-frame section-frame--split">
        <motion.div
          className="section-intro"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.55 }}
        >
          <span className="section-kicker">About Us</span>
          <h2 className="section-title">A cleaner planning surface for a complicated policy.</h2>
          <p className="section-copy">
            We built this calculator to make the proposed college-savings account easier to understand at a
            glance. The goal is simple: let families move from policy headlines to realistic scenarios without
            getting lost in one uninterrupted scroll.
          </p>
        </motion.div>

        <div className="about-grid">
          {principles.map((item, index) => (
            <motion.div
              key={item.title}
              className="about-panel"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <div className="about-panel__icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
