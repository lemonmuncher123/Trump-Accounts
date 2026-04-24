import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, Scale, GraduationCap } from 'lucide-react';

export default function Age18Transition() {
  const cards = [
    {
      icon: <ArrowRightLeft size={32} />,
      title: "Traditional IRA-Style Treatment",
      desc: "After the growth period, proposed regulations indicate that traditional IRA rules generally apply to the account. The transition is not described as an automatic conversion into a separate IRA product.",
      color: "var(--accent-purple)"
    },
    {
      icon: <Scale size={32} />,
      title: "Tax-Deferred, Not Free",
      desc: "Unlike a Roth IRA, withdrawals of the investment earnings are generally taxed as ordinary income at the child's future tax rate.",
      color: "var(--accent-orange)"
    },
    {
      icon: <GraduationCap size={32} />,
      title: "Penalty Exceptions",
      desc: "Avoid the 10% early withdrawal penalty by using funds for higher education, a first-time home purchase ($10k limit), or medical emergencies.",
      color: "var(--accent-emerald)"
    }
  ];

  return (
    <section className="container section-spacing" style={{ borderTop: '1px solid var(--border-light)' }}>
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          The Age 18 Transition: <span className="text-gradient" style={{ backgroundImage: 'linear-gradient(90deg, var(--accent-orange), var(--accent-purple))' }}>Tax Rules</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '18px', maxWidth: '680px', margin: '0 auto' }}>
          The Trump Account provides up to 18 years of tax-deferred compounding. After the growth period, proposed regulations describe IRA-like treatment — understanding these rules helps families plan for the transition.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '32px' }}>
        {cards.map((card, i) => (
          <motion.div
            key={i}
            className="glass-card"
            style={{ padding: '40px 32px', position: 'relative', overflow: 'hidden' }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: card.color }} />
            <div style={{ color: card.color, marginBottom: '24px' }}>
              {card.icon}
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px', letterSpacing: '-0.01em' }}>
              {card.title}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
              {card.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
