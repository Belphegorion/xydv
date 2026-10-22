'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowsClockwise,
  ShieldCheck,
  CheckCircle,
  Package,
  Receipt,
  ArrowRight,
} from '@phosphor-icons/react';

export default function ReturnsPortalPage() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('Exchange for Alternate Size');
  const [isProcessing, setIsProcessing] = useState(false);
  const [returnLabelReady, setReturnLabelReady] = useState(false);

  const handleInitiateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !email.trim()) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setReturnLabelReady(true);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pt-24 sm:pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="border-b border-[var(--border)] pb-8 mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
              ATHLETE ASSURANCE & EXCHANGE PROTOCOL
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight font-heading text-[var(--text-primary)]">
            30-DAY EXCHANGE & RETURN PORTAL
          </h1>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-sans mt-2 max-w-2xl">
            We provide seamless 30-day trial exchanges. If your hardware does not fit your physical biomechanics, generate a prepaid courier waybill below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* ========================================================= */}
          {/* LEFT: RETURN / EXCHANGE GENERATOR FORM                     */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border)] p-6 sm:p-8">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--text-primary)] border-b border-[var(--border)] pb-3 mb-6">
              STEP 01 // INITIATE RETURN OR SIZE SWAP
            </h2>

            {returnLabelReady ? (
              <div className="p-6 bg-[var(--bg-elevated)] border border-emerald-500/30 space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle size={22} weight="bold" />
                  <span className="text-xs font-mono font-bold uppercase tracking-widest">
                    PREPAID DHL RETURN WAYBILL GENERATED
                  </span>
                </div>
                <div className="space-y-1 text-xs font-mono">
                  <p className="text-[var(--text-muted)] uppercase">RMA NUMBER:</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    RMA-XYDV-{Math.floor(100000 + Math.random() * 900000)}
                  </p>
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                  Your prepaid digital shipping label has been dispatched to{' '}
                  <strong className="text-[var(--text-primary)] font-mono">{email}</strong>. Simply attach to your original packaging and arrange a complimentary DHL carrier pickup or drop-off.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-[var(--text-primary)] text-[var(--bg)] font-mono text-xs font-bold uppercase tracking-wider active:scale-[0.97]"
                  >
                    PRINT RETURN WAYBILL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnLabelReady(false);
                      setOrderId('');
                      setEmail('');
                    }}
                    className="px-4 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] font-mono text-xs font-bold uppercase tracking-wider hover:text-[var(--text-primary)] active:scale-[0.97]"
                  >
                    START OVER
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInitiateReturn} className="space-y-4">
                <div>
                  <label htmlFor="return-order-id" className="text-[11px] font-mono text-[var(--text-muted)] uppercase block mb-1.5">
                    ORDER IDENTIFIER *
                  </label>
                  <input
                    id="return-order-id"
                    type="text"
                    required
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="e.g. XYDV-10492"
                    className="w-full h-11 px-3.5 text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-primary)] uppercase transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="return-email" className="text-[11px] font-mono text-[var(--text-muted)] uppercase block mb-1.5">
                    BILLING EMAIL ADDRESS *
                  </label>
                  <input
                    id="return-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full h-11 px-3.5 text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-primary)] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="return-reason" className="text-[11px] font-mono text-[var(--text-muted)] uppercase block mb-1.5">
                    REASON FOR EXCHANGE / RETURN
                  </label>
                  <select
                    id="return-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full h-11 px-3 text-xs font-mono uppercase bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] cursor-pointer"
                  >
                    <option value="Exchange for Alternate Size">Exchange for Alternate Size (Complimentary)</option>
                    <option value="Exchange for Alternate Colorway">Exchange for Alternate Colorway</option>
                    <option value="Fit Did Not Meet Expectation">Fit Did Not Meet Biomechanical Expectation</option>
                    <option value="Refund to Original Payment">Refund to Original Payment Method</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="touch-target w-full h-12 bg-[var(--text-primary)] text-[var(--bg)] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.97] transition-[background-color,border-color,opacity,transform] duration-150 cursor-pointer shadow-sm"
                >
                  {isProcessing ? (
                    <>
                      <ArrowsClockwise size={16} className="animate-spin" />
                      <span>VALIDATING ORDER & INVENTORY...</span>
                    </>
                  ) : (
                    <>
                      <span>RETRIEVE ORDER & GENERATE WAYBILL</span>
                      <ArrowRight size={14} weight="bold" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* ========================================================= */}
          {/* RIGHT: RETURN GUIDELINES & PROTOCOL                       */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-6 space-y-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
                RETURN PREREQUISITES
              </span>
              <h3 className="text-xl font-heading font-black uppercase text-[var(--text-primary)]">
                INTEGRITY STANDARDS
              </h3>
              <ul className="space-y-3 text-xs font-mono text-[var(--text-secondary)]">
                <li className="flex items-start gap-2.5">
                  <span className="text-[var(--accent)] font-bold">✓</span>
                  <span>Items must be unwashed, unworn, and free from scent or chalk marks.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[var(--accent)] font-bold">✓</span>
                  <span>All silicone telemetry tags and woven labels must remain attached.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[var(--accent)] font-bold">✓</span>
                  <span>Exchange initiated within 30 calendar days from delivery date.</span>
                </li>
              </ul>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-6 space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase text-[var(--text-primary)]">
                NEED RAPID ASSISTANCE?
              </h4>
              <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                If your piece arrived with a manufacturing anomaly, contact our engineering desk directly for immediate express priority replacement.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[var(--text-primary)] underline hover:text-[var(--text-secondary)] mt-2"
              >
                <span>CONTACT ATHLETE SUPPORT DESK</span>
                <span>↗</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
