import React from 'react';
import { motion } from 'framer-motion';
import { Building2, ShieldCheck, Handshake } from 'lucide-react';

const cards = [
  {
    icon: <Building2 size={36} strokeWidth={1.5} className="text-blue" />,
    title: "Federal Seed Deposit",
    tag: "Pilot Program",
    desc: "$1,000 federal deposit for U.S.-citizen children born 2025–2028, subject to SSN verification, custodial setup, and an explicit federal election. No family contribution is required for the pilot seed itself, but an election and account setup are still required."
  },
  {
    icon: <ShieldCheck size={36} strokeWidth={1.5} className="text-purple" />,
    title: "Tax-Deferred Growth",
    tag: "Confirmed",
    desc: "Up to 18 years of compounding without modeled annual federal capital-gains realization drag during the growth period. Growth is tax-deferred, not permanently tax-free — earnings are taxed at distribution."
  },
  {
    icon: <Handshake size={36} strokeWidth={1.5} className="text-emerald" />,
    title: "Employer Match",
    tag: "Pending Details",
    desc: "Employer contributions, if offered, may be excluded federally up to $2,500 per employee per year (§128) and count toward the $5,000 aggregate annual cap. Actual employer participation is voluntary and adoption rates remain unknown."
  }
];

export default function PolicyCards() {
  return (
    <section className="container section-spacing">
      <div className="policy-grid">
        {cards.map((c, i) => (
          <motion.div 
            key={i}
            className="glass-card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: i * 0.15, ease: "easeOut" }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <div className="card-icon">{c.icon}</div>
            <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px'}}>
              <h3 className="card-title">{c.title}</h3>
              <span className={`status-tag ${c.tag === 'Confirmed' ? 'tag-green' : 'tag-orange'}`}>{c.tag}</span>
            </div>
            <p className="card-desc">{c.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
