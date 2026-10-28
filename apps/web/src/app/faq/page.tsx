'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { CaretDown, MagnifyingGlass, X, ArrowRight } from '@phosphor-icons/react';
import { EMIL_EASE } from '@/lib/motion';

interface FAQItem {
  id: string;
  category: 'materials' | 'sizing' | 'orders' | 'dispatch' | 'warranty';
  categoryLabel: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: 'faq-01',
    category: 'materials',
    categoryLabel: 'TEXTILE SCIENCE',
    question: 'How does the SweatShield+ phase-change technology prevent clinging?',
    answer:
      'SweatShield+ utilizes a bi-component capillary knit architecture. The hydrophobic inner face draws liquid sweat instantly off skin pores and propels it to the micro-perforated outer face, spreading moisture across a 3.4x larger surface area for ultra-rapid evaporation without garment saturation.',
  },
  {
    id: 'faq-02',
    category: 'materials',
    categoryLabel: 'TEXTILE SCIENCE',
    question: 'What is the benefit of Cordura® 500D friction reinforcement on training shorts?',
    answer:
      'Standard synthetic activewear frays and pills rapidly when coming into repetitive contact with barbell knurling, gravel, or turf. Cordura® ballistic nylon fibers possess high tensile strength and abrasion resistance, ensuring your shorts maintain zero fuzzing across thousands of heavy deadlifts and burpees.',
  },
  {
    id: 'faq-03',
    category: 'sizing',
    categoryLabel: 'SIZING & FIT',
    question: 'How do I choose between Compression, Athletic Slim, and Relaxed fit?',
    answer:
      'Compression fit hugs the muscle bellies directly to maximize blood circulation and minimize vibration during explosive movements. Athletic Slim contours the chest, shoulders, and arms while leaving comfortable breathing room around the torso. Relaxed fits provide an architectural drape with dropped shoulders for mobility and post-session recovery.',
  },
  {
    id: 'faq-04',
    category: 'sizing',
    categoryLabel: 'SIZING & FIT',
    question: 'Are XYDV garments true to size or should I size up for heavy lifting?',
    answer:
      'All garments are engineered true to size based on athletic biomechanics. If you are between two sizes and possess a muscular chest or broad shoulders, we recommend selecting the larger size for training comfort, or use our interactive Sizing & Fit Calculator.',
  },
  {
    id: 'faq-05',
    category: 'orders',
    categoryLabel: 'PAYMENTS & SECURITY',
    question: 'Which payment methods and currencies are supported via Razorpay?',
    answer:
      'We accept all major global credit cards (Visa, Mastercard, American Express), Apple Pay, Google Pay, UPI, NetBanking, and international multi-currency transactions via our bank-grade 256-bit SSL encrypted Razorpay payment gateway.',
  },
  {
    id: 'faq-06',
    category: 'dispatch',
    categoryLabel: 'GLOBAL DISPATCH',
    question: 'Will I have to pay import duties or customs on international shipments?',
    answer:
      'No. All international shipments are fulfilled on a DDP (Delivered Duty Paid) basis. All import customs, duties, tariffs, and regional taxes are pre-cleared by XYDV so your package arrives directly at your door with zero surprise fees.',
  },
  {
    id: 'faq-07',
    category: 'dispatch',
    categoryLabel: 'GLOBAL DISPATCH',
    question: 'How fast will my order depart after placing it online?',
    answer:
      'Orders finalized before 14:00 EST Monday through Friday are processed and handed to DHL Express or FedEx Air Cargo on the same calendar business day. Tracking telemetry activates within 4 hours of courier scan.',
  },
  {
    id: 'faq-08',
    category: 'warranty',
    categoryLabel: 'WARRANTY & TRIAL',
    question: 'What is covered under the 30-Day Athlete Trial Guarantee?',
    answer:
      'We guarantee complete satisfaction with our fabric performance and fit. You may exchange for an alternate size or colorway within 30 calendar days from delivery, provided the piece has not been laundered and original tags remain intact.',
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>('faq-01');

  const filteredFAQs = useMemo(() => {
    return FAQS.filter((item) => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeCategory, search]);

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pt-24 pb-24 sm:pt-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 border-b border-[var(--border)] pb-8 text-center sm:text-left">
          <div className="mb-2 flex items-center justify-center gap-2 sm:justify-start">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
            <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
              TECHNICAL KNOWLEDGE BASE
            </span>
          </div>
          <h1 className="font-heading text-2xl font-black tracking-tight text-balance text-[var(--text-primary)] uppercase sm:text-3xl md:text-4xl">
            FREQUENTLY ASKED QUESTIONS
          </h1>
          <p className="mt-2 max-w-xl font-sans text-xs text-[var(--text-secondary)] sm:text-sm">
            In-depth documentation covering our proprietary textile membranes, athletic sizing
            calibration, secure checkout, and global express air dispatch.
          </p>

          {/* Search Input */}
          <div className="relative mt-6 max-w-lg">
            <MagnifyingGlass
              size={16}
              className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              id="faq-search-input"
              aria-label="Search knowledge base by keyword"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH KNOWLEDGE BASE BY KEYWORD..."
              className="h-11 w-full border border-[var(--border)] bg-[var(--bg-elevated)] pr-9 pl-10 font-mono text-xs text-[var(--text-primary)] uppercase placeholder-[var(--text-muted)] transition-colors focus:border-[var(--text-primary)] focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search input"
                className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mb-8 flex no-scrollbar items-center gap-2 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'ALL INQUIRIES' },
            { id: 'materials', label: 'TEXTILE SCIENCE' },
            { id: 'sizing', label: 'SIZING & FIT' },
            { id: 'orders', label: 'PAYMENTS' },
            { id: 'dispatch', label: 'GLOBAL DISPATCH' },
            { id: 'warranty', label: 'WARRANTY' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`touch-target px-3.5 py-2 font-mono text-xs font-bold tracking-wider whitespace-nowrap uppercase transition-colors active:scale-[0.97] ${
                activeCategory === cat.id
                  ? 'border border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg)]'
                  : 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="divide-y divide-[var(--border)] border border-[var(--border)] bg-[var(--bg-surface)]">
          {filteredFAQs.length === 0 ? (
            <div className="p-12 text-center font-mono text-xs tracking-widest text-[var(--text-muted)] uppercase">
              [ NO MATCHING DOCUMENTATION FOUND FOR QUERY ]
            </div>
          ) : (
            filteredFAQs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div key={faq.id} className="transition-colors">
                  <button
                    type="button"
                    id={`accordion-trigger-${faq.id}`}
                    onClick={() => toggleFAQ(faq.id)}
                    className="touch-target flex w-full items-center justify-between p-5 text-left focus:outline-none sm:p-6"
                    aria-expanded={isOpen}
                    aria-controls={`accordion-content-${faq.id}`}
                  >
                    <div className="pr-4">
                      <span className="mb-1 block font-mono text-[10px] font-bold tracking-widest text-[var(--accent)] uppercase">
                        {faq.categoryLabel}
                      </span>
                      <h3 className="font-heading text-xs font-bold text-[var(--text-primary)] uppercase sm:text-sm">
                        {faq.question}
                      </h3>
                    </div>
                    <CaretDown
                      size={16}
                      weight="bold"
                      className={`shrink-0 text-[var(--text-secondary)] transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        id={`accordion-content-${faq.id}`}
                        role="region"
                        aria-labelledby={`accordion-trigger-${faq.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: EMIL_EASE }}
                        className="overflow-hidden border-t border-[var(--border)]/40 px-5 pt-4 pb-6 font-sans text-xs leading-relaxed text-[var(--text-secondary)] sm:px-6"
                      >
                        {faq.answer}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Support Prompt */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border border-[var(--border)] bg-[var(--bg-elevated)] p-6 text-center sm:flex-row sm:text-left">
          <div>
            <h4 className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase">
              STILL HAVE AN UNANSWERED INQUIRY?
            </h4>
            <p className="mt-1 font-sans text-xs text-[var(--text-secondary)]">
              Our technical apparel specialists are available to review specifications or advise on
              sizing.
            </p>
          </div>
          <Link
            href="/contact"
            className="touch-target flex items-center gap-1.5 bg-[var(--text-primary)] px-5 py-2.5 font-mono text-xs font-bold tracking-wider text-[var(--bg)] uppercase active:scale-[0.97]"
          >
            <span>CLIENT DESK</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  );
}
