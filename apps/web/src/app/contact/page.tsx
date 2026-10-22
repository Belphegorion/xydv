'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChatTeardropText,
  EnvelopeSimple,
  Clock,
  ShieldCheck,
  CheckCircle,
  ArrowsClockwise,
  ArrowRight,
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { EMIL_EASE } from '@/lib/motion';

export default function ContactSupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'Order & Dispatch Tracking',
    orderId: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    ticketId: string;
    message: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch support request.');
      }

      setSubmittedTicket({
        ticketId: data.ticketId,
        message: data.message,
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pt-24 sm:pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="border-b border-[var(--border)] pb-8 mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
              CLIENT SERVICES & ATHLETE SUPPORT
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight font-heading text-[var(--text-primary)]">
            ATHLETE SUPPORT DESK
          </h1>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-sans mt-2 max-w-2xl">
            Direct operational pipeline for sizing diagnostics, priority dispatch tracking, warranty assessments, and custom division inquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* ========================================================= */}
          {/* LEFT: TICKET SUBMISSION FORM                              */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border)] p-6 sm:p-8">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--text-primary)] border-b border-[var(--border)] pb-3 mb-6">
              DISPATCH A SUPPORT TRANSMISSION
            </h2>

            {submittedTicket ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EMIL_EASE }}
                className="p-6 bg-[var(--bg-elevated)] border border-emerald-500/30 space-y-4"
              >
                <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle size={22} weight="bold" />
                  <span className="text-xs font-mono font-bold uppercase tracking-widest">
                    TICKET REGISTERED IN SECURE DISPATCH
                  </span>
                </div>
                <div className="space-y-1 text-xs font-mono">
                  <p className="text-[var(--text-muted)] uppercase">TICKET IDENTIFIER:</p>
                  <p className="text-base font-bold text-[var(--text-primary)]">{submittedTicket.ticketId}</p>
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                  {submittedTicket.message} A copy of this ticket has been transmitted to{' '}
                  <strong className="text-[var(--text-primary)] font-mono">{formData.email}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedTicket(null);
                    setFormData({
                      name: '',
                      email: '',
                      topic: 'Order & Dispatch Tracking',
                      orderId: '',
                      message: '',
                    });
                  }}
                  className="mt-4 px-4 py-2 bg-[var(--text-primary)] text-[var(--bg)] text-xs font-mono font-bold uppercase tracking-wider active:scale-[0.97]"
                >
                  DISPATCH ANOTHER INQUIRY
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="contact-name" className="text-[11px] font-mono text-[var(--text-muted)] uppercase block mb-1.5">
                      ATHLETE NAME *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Marcus Vance"
                      className="w-full h-11 px-3.5 text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-primary)] transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="contact-email" className="text-[11px] font-mono text-[var(--text-muted)] uppercase block mb-1.5">
                      ENCRYPTED EMAIL *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@domain.com"
                      className="w-full h-11 px-3.5 text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-primary)] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Topic Dropdown */}
                  <div>
                    <label htmlFor="contact-topic" className="text-[11px] font-mono text-[var(--text-muted)] uppercase block mb-1.5">
                      SUPPORT VECTOR / TOPIC
                    </label>
                    <select
                      id="contact-topic"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full h-11 px-3 text-xs font-mono uppercase bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] cursor-pointer"
                    >
                      <option value="Order & Dispatch Tracking">Order & Dispatch Tracking</option>
                      <option value="Sizing & Fit Consultation">Sizing & Fit Consultation</option>
                      <option value="30-Day Return & Exchange">30-Day Return & Exchange</option>
                      <option value="Technical Fabric Specifications">Technical Fabric Specifications</option>
                      <option value="Corporate / Team Allocation">Corporate / Team Allocation</option>
                    </select>
                  </div>

                  {/* Order ID */}
                  <div>
                    <label htmlFor="contact-order-id" className="text-[11px] font-mono text-[var(--text-muted)] uppercase block mb-1.5">
                      ORDER IDENTIFIER (IF APPLICABLE)
                    </label>
                    <input
                      id="contact-order-id"
                      type="text"
                      value={formData.orderId}
                      onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                      placeholder="e.g. XYDV-98214"
                      className="w-full h-11 px-3.5 text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-primary)] transition-colors"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="contact-message" className="text-[11px] font-mono text-[var(--text-muted)] uppercase block mb-1.5">
                    DIAGNOSTIC MESSAGE / INQUIRY DETAILS *
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide detailed description of requirements or issue..."
                    className="w-full p-3.5 text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-primary)] transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="touch-target w-full h-12 bg-[var(--text-primary)] text-[var(--bg)] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.97] transition-[background-color,border-color,opacity,transform] duration-150 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <ArrowsClockwise size={16} className="animate-spin" />
                      <span>DISPATCHING TRANSMISSION...</span>
                    </>
                  ) : (
                    <>
                      <span>TRANSMIT TICKET TO CLIENT DESK</span>
                      <ArrowRight size={14} weight="bold" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* ========================================================= */}
          {/* RIGHT: OPERATIONAL CHANNELS & SLA                         */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 space-y-6">
            {/* SLA Card */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-6 space-y-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
                OPERATIONAL COMMITMENT
              </span>
              <h3 className="text-xl font-heading font-black uppercase text-[var(--text-primary)]">
                2-HOUR RESPONSE SLA
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                All athlete support communications are monitored by technical apparel specialists. Urgent order modifications receive immediate escalation.
              </p>

              <div className="pt-4 border-t border-[var(--border)] space-y-3 text-xs font-mono text-[var(--text-secondary)]">
                <div className="flex items-center gap-2.5">
                  <Clock size={16} className="text-[var(--text-primary)]" weight="bold" />
                  <span>HOURS: MON-SAT 06:00 - 22:00 EST</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <EnvelopeSimple size={16} className="text-[var(--text-primary)]" weight="bold" />
                  <span>DIRECT DISPATCH: SUPPORT@XYDV.COM</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={16} className="text-emerald-500" weight="bold" />
                  <span>256-BIT ENCRYPTED CHANNEL</span>
                </div>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-6 space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase text-[var(--text-primary)]">
                FREQUENT SELF-SERVICE PORTALS
              </h4>
              <div className="divide-y divide-[var(--border)] text-xs font-mono">
                <a
                  href="/shipping"
                  className="py-3 flex items-center justify-between text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <span>GLOBAL DISPATCH & LOGISTICS</span>
                  <span>↗</span>
                </a>
                <a
                  href="/returns"
                  className="py-3 flex items-center justify-between text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <span>30-DAY EXCHANGE INITIATION</span>
                  <span>↗</span>
                </a>
                <a
                  href="/sizing"
                  className="py-3 flex items-center justify-between text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <span>FIT & SIZE CALIBRATION</span>
                  <span>↗</span>
                </a>
                <a
                  href="/faq"
                  className="py-3 flex items-center justify-between text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <span>TECHNICAL KNOWLEDGE BASE</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
