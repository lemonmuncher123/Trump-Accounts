import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const faqs = [
  {
    question: 'Who is eligible to open a Trump Account, and who receives the $1,000 federal contribution?',
    answer:
      'Two different rules are at work. Under current federal guidance, any U.S. child under age 18 with a Social Security Number can have a Trump Account once an approved custodian offers one. The one-time $1,000 federal contribution, however, is part of a limited pilot program for U.S.-citizen children born between January 1, 2025 and December 31, 2028. The calculator models the deposit only when the selected birth year falls in 2025–2028, while actual receipt still depends on election and IRS requirements.'
  },
  {
    question: 'Does this calculator assume every child receives the $1,000 federal contribution?',
    answer:
      'No. The simulator now uses the selected birth year to determine pilot seed eligibility. Children born 2025–2028 receive the $1,000 federal seed in the model; children born outside that window start with $0. Families should also be aware that actual receipt of the seed requires a valid SSN, U.S. citizenship, custodial setup, and a federal election — none of which the calculator verifies.'
  },
  {
    question: 'Is the $1,000 federal contribution automatic?',
    answer:
      'The seed is not automatic. Form 4547 or the official online process must be used, and Treasury deposits only after account confirmation. The contribution is a one-time deposit linked to the pilot window and is distinct from family or employer contributions. The calculator treats the deposit as received for eligible birth years; families should verify the live election process before relying on it.'
  },
  {
    question: 'What does employer matching actually change in the model?',
    answer:
      'Employers can contribute to a Trump Account on behalf of an employee\'s child. The employer exclusion is capped at $2,500 per year (§128, indexed for inflation), and employer contributions count toward the $5,000 aggregate annual cap — they do not stack on top of it. For example, a $2,500 employer contribution leaves $2,500 of remaining family contribution room. In the simulator they show up as a recurring deposit that compounds for the full growth window, which is why even small recurring matches noticeably widen the ending-balance distribution.'
  },
  {
    question: 'What happens to the account when the child turns 18?',
    answer:
      'Proposed federal regulations describe the account as functioning much like a Traditional IRA once the beneficiary reaches adulthood. Contributions can generally be withdrawn tax-free (they are basis), but earnings withdrawn before retirement age are typically subject to ordinary income tax at the beneficiary\'s rate, with higher-education and certain other uses qualifying for an exception to the 10% early-withdrawal penalty. Growth is tax-deferred, not permanently tax-free, so the at-18 balance shown here is a pre-decision number, not an after-tax distribution.'
  },
  {
    question: 'Are the tax results on this site state-specific?',
    answer:
      'Federal tax treatment is modeled directly. State tax conformity is not yet settled across all states, but California-specific behavior — including the kiddie-tax rules that can apply to a minor beneficiary\'s realized gains — is available as an optional layer on the Tax Analysis tab. Other states may treat earnings, withdrawals, and rollovers differently and are not modeled here.'
  },
  {
    question: 'What policy details are still unresolved?',
    answer:
      'Several pieces remain proposed rather than final: the exact election workflow for the $1,000 pilot deposit, employer adoption rates, treatment under the new SAI (Student Aid Index) financial-aid formula that has replaced EFC, and the precise rollover rules at age 18. The calculator is useful for scenario planning under the current federal guidance, but it should not be treated as final tax, financial-aid, or regulatory advice.'
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="container section-spacing">
      <div className="section-frame">
        <div className="section-intro">
          <span className="section-kicker">FAQ</span>
          <h2 className="section-title">Short answers before the long paperwork.</h2>
          <p className="section-copy">
            The page now keeps the most common questions in one place so families can clarify the basics
            before moving deeper into the mechanics and projections.
          </p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <motion.div
                key={faq.question}
                className={`faq-item ${isOpen ? 'is-open' : ''}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
              >
                <button
                  type="button"
                  className="faq-trigger"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <span className="faq-trigger__icon" aria-hidden="true">
                    {isOpen ? '-' : '+'}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      className="faq-answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      <p>{faq.answer}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
