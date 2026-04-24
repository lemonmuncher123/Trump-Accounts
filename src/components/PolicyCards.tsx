import React from 'react';
import { motion } from 'framer-motion';
import { Building2, ShieldCheck, Handshake } from 'lucide-react';

const cards = [
  {
    icon: <Building2 size={36} strokeWidth={1.5} className="text-blue" />,
    title: "Federal Seed Deposit",
    tag: "Pilot Program",
    desc: "$1,000 federal deposit for U.S.-citizen children born 2025–2028, subject to SSN verification, custodial setup, and an explicit federal election. Zero out-of-pocket required to start if eligible."
  },
  {
    icon: <ShieldCheck size={36} strokeWidth={1.5} className="text-purple" />,
    title: "Tax-Deferred Growth",
    tag: "Confirmed",
    desc: "18 years of compounding without the 15% annual federal capital gains drag. Growth is tax-deferred, not permanently tax-free — earnings are taxed at distribution."
  },
  {
    icon: <Handshake size={36} strokeWidth={1.5} className="text-emerald" />,
    title: "Employer Match",
    tag: "Pending Details",
    desc: "Up to $2,500/yr matched by participating employers with the employer portion excluded from federal income via §128, turbocharging middle-class savings."
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
