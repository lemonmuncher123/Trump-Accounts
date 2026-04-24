import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, HeartHandshake, MapPin, Landmark } from 'lucide-react';

const risks = [
  {
    icon: <MapPin size={24} className="text-orange" />,
    title: "State Tax Conformity",
    pill: "Pending Decision",
    desc: "Federal growth is tax-deferred (not permanently tax-free). California does not automatically conform to Section 530A, so CA results are modeled as a separate scenario rather than confirmed federal treatment. State-level capital gains taxes could apply during the accumulation period or at distribution."
  },
  {
    icon: <HeartHandshake size={24} className="text-blue" />,
    title: "Employer Match Rates",
    pill: "Unknown Variable",
    desc: "The law permits a $2,500/yr employer match excluded from federal income via §128, but actual corporate participation and adoption curves are completely unknown at this stage."
  },
  {
    icon: <Landmark size={24} className="text-emerald" />,
    title: "IRA-Style Treatment & ABLE Rollover",
    pill: "Awaiting Guidance",
    desc: "After the growth period, proposed regulations describe traditional IRA-style treatment: contributions are basis, earnings are tax-deferred and taxed at distribution. Post-growth-period distribution, rollover, and IRA-style treatment details remain implementation-sensitive and subject to final guidance."
  },
  {
    icon: <ShieldAlert size={24} className="text-purple" />,
    title: "Financial Aid (SAI) Impact",
    pill: "Pending Regulation",
    desc: "It is currently unresolved whether Trump Account assets will be heavily weighed in the Student Aid Index (SAI, formerly EFC) formula, potentially offsetting need-based aid."
  }
];

export default function PolicyUncertainty() {
  return (
    <section className="container section-spacing">
      <div className="glass-panel" style={{ padding: '48px 40px', background: 'rgba(255,255,255,0.015)' }}>
        <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 700, margin: '0 0 16px', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
          Policy <span style={{ color: 'var(--accent-orange)' }}>Uncertainty</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '800px', margin: '0 0 40px', lineHeight: 1.6 }}>
          While the core mechanics of the Trump Account have been drafted, §§ 1.530A-2 through 1.530A-6 of the Proposed Regulations remain "reserved for future guidance." Our models assume frictionless execution, but families should be aware of these four pending variables as the 2026 rollout and reserved guidance continue.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          {risks.map((r, i) => (
             <motion.div 
               key={i}
               style={{ background: 'var(--bg-deep)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-light)' }}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-50px" }}
               transition={{ duration: 0.5, delay: i * 0.1 }}
             >
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                 {r.icon}
                 <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', background: 'rgba(249, 115, 22, 0.1)', color: 'var(--accent-orange)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                   {r.pill}
                 </span>
               </div>
               <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 12px' }}>{r.title}</h3>
               <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{r.desc}</p>
             </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
