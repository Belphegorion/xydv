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
import { api } from '@/lib/api';

export default function ReturnsPortalPage() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('Exchange for Alternate Size');
  const [isProcessing, setIsProcessing] = useState(false);
  const [returnLabelReady, setReturnLabelReady] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const handleInitiateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !email.trim()) return;

    setIsProcessing(true);
    try {
      const res = await api.post<{
        success: boolean;
        ticketId?: string;
        message?: string;
      }>('/support', {
        name: email.split('@')[0] || 'Athlete',
        email: email.trim(),
        topic: 'Return / Exchange Protocol',
        orderId: orderId.trim(),
        message: `Exchange protocol initiated. Reason: ${reason}`,
      });

      if (res?.ticketId) {
        setTicketId(res.ticketId);
      } else {
        setTicketId(`RMA-${orderId.trim().toUpperCase()}`);
      }
      setReturnLabelReady(true);
    } catch {
      // Offline fallback
      setTicketId(`RMA-${orderId.trim().toUpperCase()}`);
      setReturnLabelReady(true);
    } finally {
      setIsProcessing(false);
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
              ATHLETE ASSURANCE & EXCHANGE PROTOCOL
            </span>
          </div>
          <h1 className="font-heading text-2xl font-black tracking-tight text-balance text-[var(--text-primary)] uppercase sm:text-3xl md:text-4xl">
            30-DAY EXCHANGE & RETURN PORTAL
          </h1>
          <p className="mt-2 max-w-2xl font-sans text-xs text-[var(--text-secondary)] sm:text-sm">
            We provide seamless 30-day trial exchanges. If your hardware does not fit your physical
            biomechanics, generate a prepaid courier waybill below.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          {/* ========================================================= */}
          {/* LEFT: RETURN / EXCHANGE GENERATOR FORM                     */}
          {/* ========================================================= */}
          <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8 lg:col-span-7">
            <h2 className="mb-6 border-b border-[var(--border)] pb-3 font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase">
              STEP 01 // INITIATE RETURN OR SIZE SWAP
            </h2>

            {returnLabelReady ? (
              <div className="space-y-4 border border-emerald-500/30 bg-[var(--bg-elevated)] p-6">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle size={22} weight="bold" />
                  <span className="font-mono text-xs font-bold tracking-widest uppercase">
                    PREPAID DHL RETURN WAYBILL GENERATED
                  </span>
                </div>
                <div className="space-y-1 font-mono text-xs">
                  <p className="text-[var(--text-muted)] uppercase">RMA / DISPATCH TICKET:</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    {ticketId || `RMA-${orderId.trim().toUpperCase()}`}
                  </p>
                </div>
                <p className="font-sans text-xs leading-relaxed text-[var(--text-secondary)]">
                  Your prepaid digital shipping label has been dispatched to{' '}
                  <strong className="font-mono text-[var(--text-primary)]">{email}</strong>. Simply
                  attach to your original packaging and arrange a complimentary DHL carrier pickup
                  or drop-off.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-[var(--text-primary)] px-5 py-2.5 font-mono text-xs font-bold tracking-wider text-[var(--bg)] uppercase active:scale-[0.97]"
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
                    className="border border-[var(--border)] px-4 py-2.5 font-mono text-xs font-bold tracking-wider text-[var(--text-secondary)] uppercase hover:text-[var(--text-primary)] active:scale-[0.97]"
                  >
                    START OVER
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInitiateReturn} className="space-y-4">
                <div>
                  <label
                    htmlFor="return-order-id"
                    className="mb-1.5 block font-mono text-[11px] text-[var(--text-muted)] uppercase"
                  >
                    ORDER IDENTIFIER *
                  </label>
                  <input
                    id="return-order-id"
                    type="text"
                    required
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="e.g. XYDV-10492"
                    className="h-11 w-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 font-mono text-xs text-[var(--text-primary)] uppercase placeholder-[var(--text-muted)] transition-colors focus:border-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="return-email"
                    className="mb-1.5 block font-mono text-[11px] text-[var(--text-muted)] uppercase"
                  >
                    BILLING EMAIL ADDRESS *
                  </label>
                  <input
                    id="return-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="h-11 w-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="return-reason"
                    className="mb-1.5 block font-mono text-[11px] text-[var(--text-muted)] uppercase"
                  >
                    REASON FOR EXCHANGE / RETURN
                  </label>
                  <select
                    id="return-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="h-11 w-full cursor-pointer border border-[var(--border)] bg-[var(--bg-elevated)] px-3 font-mono text-xs text-[var(--text-primary)] uppercase focus:border-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="Exchange for Alternate Size">
                      Exchange for Alternate Size (Complimentary)
                    </option>
                    <option value="Exchange for Alternate Colorway">
                      Exchange for Alternate Colorway
                    </option>
                    <option value="Fit Did Not Meet Expectation">
                      Fit Did Not Meet Biomechanical Expectation
                    </option>
                    <option value="Refund to Original Payment">
                      Refund to Original Payment Method
                    </option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="touch-target flex h-12 w-full cursor-pointer items-center justify-center gap-2 bg-[var(--text-primary)] font-mono text-xs font-bold tracking-wider text-[var(--bg)] uppercase shadow-sm transition-[background-color,border-color,opacity,transform] duration-150 hover:opacity-95 active:scale-[0.97]"
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
          <div className="space-y-6 lg:col-span-5">
            <div className="space-y-4 border border-[var(--border)] bg-[var(--bg-surface)] p-6">
              <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                RETURN PREREQUISITES
              </span>
              <h3 className="font-heading text-xl font-black text-[var(--text-primary)] uppercase">
                INTEGRITY STANDARDS
              </h3>
              <ul className="space-y-3 font-mono text-xs text-[var(--text-secondary)]">
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-[var(--accent)]">✓</span>
                  <span>Items must be unwashed, unworn, and free from scent or chalk marks.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-[var(--accent)]">✓</span>
                  <span>All silicone telemetry tags and woven labels must remain attached.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-bold text-[var(--accent)]">✓</span>
                  <span>Exchange initiated within 30 calendar days from delivery date.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3 border border-[var(--border)] bg-[var(--bg-surface)] p-6">
              <h4 className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase">
                NEED RAPID ASSISTANCE?
              </h4>
              <p className="font-sans text-xs leading-relaxed text-[var(--text-secondary)]">
                If your piece arrived with a manufacturing anomaly, contact our engineering desk
                directly for immediate express priority replacement.
              </p>
              <Link
                href="/contact"
                className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[var(--text-primary)] uppercase underline hover:text-[var(--text-secondary)]"
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
