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
    <div className="min-h-screen bg-[var(--bg)] pt-24 sm:pt-32 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="border-b border-[var(--border)] pb-8 mb-10 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
              TECHNICAL KNOWLEDGE BASE
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight font-heading text-[var(--text-primary)]">
            FREQUENTLY ASKED QUESTIONS
          </h1>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-sans mt-2 max-w-xl">
            In-depth documentation covering our proprietary textile membranes, athletic sizing calibration, secure checkout, and global express air dispatch.
          </p>

          {/* Search Input */}
          <div className="relative max-w-lg mt-6">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              id="faq-search-input"
              aria-label="Search knowledge base by keyword"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH KNOWLEDGE BASE BY KEYWORD..."
              className="w-full h-11 pl-10 pr-9 text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-primary)] uppercase transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search input"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
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
              className={`touch-target px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-colors active:scale-[0.97] ${
                activeCategory === cat.id
                  ? 'bg-[var(--text-primary)] text-[var(--bg)] border border-[var(--text-primary)]'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--text-primary)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="border border-[var(--border)] bg-[var(--bg-surface)] divide-y divide-[var(--border)]">
          {filteredFAQs.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest">
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
                    className="touch-target w-full p-5 sm:p-6 flex items-center justify-between text-left focus:outline-none"
                    aria-expanded={isOpen}
                    aria-controls={`accordion-content-${faq.id}`}
                  >
                    <div className="pr-4">
                      <span className="text-[10px] font-mono font-bold text-[var(--accent)] tracking-widest uppercase block mb-1">
                        {faq.categoryLabel}
                      </span>
                      <h3 className="text-xs sm:text-sm font-heading font-bold uppercase text-[var(--text-primary)]">
                        {faq.question}
                      </h3>
                    </div>
                    <CaretDown
                      size={16}
                      weight="bold"
                      className={`text-[var(--text-secondary)] transition-transform duration-200 shrink-0 ${
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
                        className="overflow-hidden px-5 sm:px-6 pb-6 text-xs text-[var(--text-secondary)] font-sans leading-relaxed border-t border-[var(--border)]/40 pt-4"
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
        <div className="mt-12 p-6 bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="text-xs font-mono font-bold uppercase text-[var(--text-primary)]">
              STILL HAVE AN UNANSWERED INQUIRY?
            </h4>
            <p className="text-xs text-[var(--text-secondary)] font-sans mt-1">
              Our technical apparel specialists are available to review specifications or advise on sizing.
            </p>
          </div>
          <Link
            href="/contact"
            className="touch-target px-5 py-2.5 bg-[var(--text-primary)] text-[var(--bg)] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 active:scale-[0.97]"
          >
            <span>CLIENT DESK</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  );
}
