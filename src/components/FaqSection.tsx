import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const faqs = [
  {
    question: 'Who is eligible for the $1,000 federal seed?',
    answer:
      'The current page assumptions are built around children who are U.S. citizens and born during the program window. Families should still verify final Treasury and IRS guidance before treating eligibility as settled.'
  },
  {
    question: 'Is the federal seed deposit automatic?',
    answer:
      "No. The current guidance modeled here assumes a parent or legal guardian still needs to complete the election, secure the child's Social Security Number, and open the account with an approved custodian."
  },
  {
    question: 'What does employer matching actually change?',
    answer:
      'Employer participation is the biggest upside lever in the calculator. Even modest recurring matches materially widen the ending balance distribution because the match compounds for the full 18-year window.'
  },
  {
    question: 'What happens to the account at age 18?',
    answer:
      'The model assumes the account transitions into an IRA structure when the child reaches adulthood. At that point the tax treatment changes, and higher-education withdrawals may qualify for penalty exceptions while investment earnings are generally no longer tax-free forever.'
  },
  {
    question: 'What policy details are still unresolved?',
    answer:
      'State tax conformity, employer adoption rates, FAFSA treatment, and rollover specifics are still moving parts. The calculator is useful for scenario planning, but it should not be treated as final tax or regulatory advice.'
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
