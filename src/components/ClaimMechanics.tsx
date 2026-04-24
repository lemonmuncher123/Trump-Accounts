import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Hash, FileText, ShieldCheck } from 'lucide-react';

const steps = [
  { icon: <UserCheck size={28} />, title: "Verify Pilot Seed Eligibility", desc: "The $1,000 pilot seed requires U.S. citizenship and a birth date between Jan 1, 2025 – Dec 31, 2028. General Trump Account eligibility is broader (any U.S. child under 18 with an SSN)." },
  { icon: <Hash size={28} />, title: "Secure an SSN", desc: "Ensure you have obtained the child's official Social Security Number." },
  { icon: <FileText size={28} />, title: "Make the Election", desc: "File the official election via IRS Form 4547 or official Treasury portal." },
  { icon: <ShieldCheck size={28} />, title: "Select a Custodian", desc: "Open the 530A account and select an approved low-cost U.S. index fund." }
];

export default function ClaimMechanics() {
  return (
    <section className="container section-spacing" style={{ paddingTop: 0 }}>
      <motion.div 
        className="glass-panel" 
        style={{ padding: '48px', position: 'relative', overflow: 'hidden' }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--accent-blue) 0%, transparent 70%)', opacity: 0.05, filter: 'blur(40px)' }} />
        
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            How to Claim the $1,000 Federal Seed
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
            <span style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>Activation Required:</span> The Federal Seed is not automatic. Parents or legal guardians must actively opt-in.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '24px', position: 'relative' }}>
          {steps.map((step, i) => (
            <motion.div 
              key={i}
              style={{ padding: '24px', background: 'var(--bg-glass-strong)', borderRadius: '16px', border: '1px solid var(--border-light)' }}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(79, 143, 247, 0.1)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                {step.icon}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 12px' }}>
                {i + 1}. {step.title}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
