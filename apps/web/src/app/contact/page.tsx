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
    <div className="min-h-screen bg-[var(--bg)] pt-24 pb-24 sm:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 border-b border-[var(--border)] pb-8">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
            <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
              CLIENT SERVICES & ATHLETE SUPPORT
            </span>
          </div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-[var(--text-primary)] uppercase sm:text-4xl md:text-5xl">
            ATHLETE SUPPORT DESK
          </h1>
          <p className="mt-2 max-w-2xl font-sans text-xs text-[var(--text-secondary)] sm:text-sm">
            Direct operational pipeline for sizing diagnostics, priority dispatch tracking, warranty
            assessments, and custom division inquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          {/* ========================================================= */}
          {/* LEFT: TICKET SUBMISSION FORM                              */}
          {/* ========================================================= */}
          <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8 lg:col-span-7">
            <h2 className="mb-6 border-b border-[var(--border)] pb-3 font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase">
              DISPATCH A SUPPORT TRANSMISSION
            </h2>

            {submittedTicket ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EMIL_EASE }}
                className="space-y-4 border border-emerald-500/30 bg-[var(--bg-elevated)] p-6"
              >
                <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle size={22} weight="bold" />
                  <span className="font-mono text-xs font-bold tracking-widest uppercase">
                    TICKET REGISTERED IN SECURE DISPATCH
                  </span>
                </div>
                <div className="space-y-1 font-mono text-xs">
                  <p className="text-[var(--text-muted)] uppercase">TICKET IDENTIFIER:</p>
                  <p className="text-base font-bold text-[var(--text-primary)]">
                    {submittedTicket.ticketId}
                  </p>
                </div>
                <p className="font-sans text-xs leading-relaxed text-[var(--text-secondary)]">
                  {submittedTicket.message} A copy of this ticket has been transmitted to{' '}
                  <strong className="font-mono text-[var(--text-primary)]">{formData.email}</strong>
                  .
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
                  className="mt-4 bg-[var(--text-primary)] px-4 py-2 font-mono text-xs font-bold tracking-wider text-[var(--bg)] uppercase active:scale-[0.97]"
                >
                  DISPATCH ANOTHER INQUIRY
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="border border-rose-500/30 bg-rose-500/10 p-3 font-mono text-xs text-rose-600 dark:text-rose-400">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-1.5 block font-mono text-[11px] text-[var(--text-muted)] uppercase"
                    >
                      ATHLETE NAME *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Marcus Vance"
                      className="h-11 w-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--text-primary)] focus:outline-none"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-1.5 block font-mono text-[11px] text-[var(--text-muted)] uppercase"
                    >
                      ENCRYPTED EMAIL *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@domain.com"
                      className="h-11 w-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Topic Dropdown */}
                  <div>
                    <label
                      htmlFor="contact-topic"
                      className="mb-1.5 block font-mono text-[11px] text-[var(--text-muted)] uppercase"
                    >
                      SUPPORT VECTOR / TOPIC
                    </label>
                    <select
                      id="contact-topic"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="h-11 w-full cursor-pointer border border-[var(--border)] bg-[var(--bg-elevated)] px-3 font-mono text-xs text-[var(--text-primary)] uppercase focus:border-[var(--text-primary)] focus:outline-none"
                    >
                      <option value="Order & Dispatch Tracking">Order & Dispatch Tracking</option>
                      <option value="Sizing & Fit Consultation">Sizing & Fit Consultation</option>
                      <option value="30-Day Return & Exchange">30-Day Return & Exchange</option>
                      <option value="Technical Fabric Specifications">
                        Technical Fabric Specifications
                      </option>
                      <option value="Corporate / Team Allocation">
                        Corporate / Team Allocation
                      </option>
                    </select>
                  </div>

                  {/* Order ID */}
                  <div>
                    <label
                      htmlFor="contact-order-id"
                      className="mb-1.5 block font-mono text-[11px] text-[var(--text-muted)] uppercase"
                    >
                      ORDER IDENTIFIER (IF APPLICABLE)
                    </label>
                    <input
                      id="contact-order-id"
                      type="text"
                      value={formData.orderId}
                      onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                      placeholder="e.g. XYDV-98214"
                      className="h-11 w-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-1.5 block font-mono text-[11px] text-[var(--text-muted)] uppercase"
                  >
                    DIAGNOSTIC MESSAGE / INQUIRY DETAILS *
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide detailed description of requirements or issue..."
                    className="w-full resize-none border border-[var(--border)] bg-[var(--bg-elevated)] p-3.5 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="touch-target flex h-12 w-full cursor-pointer items-center justify-center gap-2 bg-[var(--text-primary)] font-mono text-xs font-bold tracking-wider text-[var(--bg)] uppercase shadow-sm transition-[background-color,border-color,opacity,transform] duration-150 hover:opacity-95 active:scale-[0.97]"
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
          <div className="space-y-6 lg:col-span-5">
            {/* SLA Card */}
            <div className="space-y-4 border border-[var(--border)] bg-[var(--bg-surface)] p-6">
              <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                OPERATIONAL COMMITMENT
              </span>
              <h3 className="font-heading text-xl font-black text-[var(--text-primary)] uppercase">
                2-HOUR RESPONSE SLA
              </h3>
              <p className="font-sans text-xs leading-relaxed text-[var(--text-secondary)]">
                All athlete support communications are monitored by technical apparel specialists.
                Urgent order modifications receive immediate escalation.
              </p>

              <div className="space-y-3 border-t border-[var(--border)] pt-4 font-mono text-xs text-[var(--text-secondary)]">
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
            <div className="space-y-3 border border-[var(--border)] bg-[var(--bg-surface)] p-6">
              <h4 className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase">
                FREQUENT SELF-SERVICE PORTALS
              </h4>
              <div className="divide-y divide-[var(--border)] font-mono text-xs">
                <a
                  href="/shipping"
                  className="flex items-center justify-between py-3 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  <span>GLOBAL DISPATCH & LOGISTICS</span>
                  <span>↗</span>
                </a>
                <a
                  href="/returns"
                  className="flex items-center justify-between py-3 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  <span>30-DAY EXCHANGE INITIATION</span>
                  <span>↗</span>
                </a>
                <a
                  href="/sizing"
                  className="flex items-center justify-between py-3 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  <span>FIT & SIZE CALIBRATION</span>
                  <span>↗</span>
                </a>
                <a
                  href="/faq"
                  className="flex items-center justify-between py-3 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
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
