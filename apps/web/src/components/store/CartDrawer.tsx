'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import { calculateCartMetrics } from '@vertex/types';
import { X, Minus, Plus, Trash, ShieldCheck, ArrowRight, CheckCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EMIL_EASE } from '@/lib/motion';
import { api } from '@/lib/api';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Compute live metrics
  const metrics = calculateCartMetrics(items);

  // Keyboard accessibility: Close on Escape key & Modal Focus Trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        closeCart();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null || el.offsetWidth > 0);

        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !drawerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeCart]);

  // Dynamically load Razorpay SDK script
  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Razorpay Checkout Trigger
  const handleRazorpayCheckout = useCallback(async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    setPaymentError(null);

    try {
      let razorpayOrderId = `order_sim_${Date.now()}`;
      let backendOrderId: string | undefined;
      let orderAmount: number | undefined;
      let rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_vertex2026';

      try {
        const orderRes = await api.post<{
          success: boolean;
          data: {
            orderId: string;
            razorpayOrderId: string;
            amount: number;
            keyId?: string;
          };
        }>('/orders/razorpay/create-order', {
          items: items.map((item) => ({
            productId: item.productId,
            slug: item.slug,
            variantId: item.id.includes('::') ? item.id.split('::')[1] : item.id,
            sku: item.sku,
            quantity: item.quantity,
          })),
        });

        const orderData = (orderRes as any)?.data ?? orderRes;
        if (orderData?.razorpayOrderId) {
          razorpayOrderId = orderData.razorpayOrderId;
          backendOrderId = orderData.orderId;
          orderAmount = orderData.amount;
          if (orderData.keyId) {
            rzpKey = orderData.keyId;
          }
        }
      } catch (orderApiErr) {
        console.warn('Backend order creation offline/fallback:', orderApiErr);
      }

      // Setup Razorpay checkout options
      const options = {
        key: rzpKey,
        amount: orderAmount ?? metrics.amountPaise,
        currency: 'INR',
        name: 'XYDV TECHNICAL DIVISION',
        description: `Order Checkout — ${items.length} items`,
        image: '/brand/xydv-logo.png',
        order_id: razorpayOrderId,
        prefill: {
          name: 'Athlete Customer',
          email: 'customer@xydv-performance.com',
          contact: '+919876543210',
        },
        theme: {
          color: '#0A0A0A',
          backdrop_color: '#0A0A0A',
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id?: string; razorpay_signature?: string }) => {
          try {
            await api.post('/orders/razorpay/verify-payment', {
              razorpayOrderId: response.razorpay_order_id || razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature || 'sim_sig',
              orderId: backendOrderId,
            });
            setPaymentSuccess(response.razorpay_payment_id);
            clearCart();
            setTimeout(() => {
              setPaymentSuccess(null);
              closeCart();
            }, 4000);
          } catch (verifyErr: any) {
            console.error('Payment verification failed:', verifyErr);
            setPaymentError(verifyErr?.message || 'Payment verification failed. Your bag has been preserved.');
          } finally {
            setIsProcessing(false);
          }
        },
      };

      if (typeof window !== 'undefined' && window.Razorpay && backendOrderId) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback simulation for headless / test environments
        setTimeout(async () => {
          const simPaymentId = `pay_sim_${Date.now()}`;
          try {
            await api.post('/orders/razorpay/verify-payment', {
              razorpayOrderId,
              razorpayPaymentId: simPaymentId,
              razorpaySignature: 'simulated_offline_signature',
              orderId: backendOrderId,
            });
            setPaymentSuccess(simPaymentId);
            clearCart();
            setTimeout(() => {
              setPaymentSuccess(null);
              closeCart();
            }, 3500);
          } catch (verifyErr: any) {
            console.error('Offline payment verification failed:', verifyErr);
            setPaymentError(verifyErr?.message || 'Payment verification failed. Your bag has been preserved.');
          } finally {
            setIsProcessing(false);
          }
        }, 1200);
      }
    } catch (err: any) {
      console.error('Razorpay initialization failure:', err);
      setPaymentError(err?.message || 'Failed to initialize checkout. Please try again.');
      setIsProcessing(false);
    }
  }, [items, metrics, clearCart, closeCart]);

  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Shopping Cart Drawer"
          className="fixed inset-0 z-50 overflow-hidden"
        >
          {/* Backdrop with fade transition */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EMIL_EASE }}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            ref={drawerRef}
            initial={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
            animate={shouldReduceMotion ? { opacity: 1 } : { x: '0%' }}
            exit={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
            transition={
              shouldReduceMotion
                ? { duration: 0.01 }
                : { type: 'spring', stiffness: 350, damping: 35 }
            }
            className="fixed right-0 top-0 h-[100dvh] max-h-[100dvh] w-full max-w-md bg-[var(--bg)] border-l border-[var(--border)] shadow-2xl flex flex-col z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] bg-[var(--bg)]">
              <div className="flex items-center gap-2">
                <h2 className="text-[var(--text-primary)] font-bold text-sm uppercase tracking-[0.2em] font-heading">
                  BAG ({items.reduce((s, i) => s + i.quantity, 0)})
                </h2>
                <Badge variant="volt" size="sm">
                  RAZORPAY VERIFIED
                </Badge>
              </div>
              <button
                onClick={closeCart}
                aria-label="Close cart drawer"
                className="touch-target btn-tactile text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Payment Error Alert */}
            {paymentError && (
              <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/30 text-red-500 text-xs font-mono flex items-center justify-between">
                <span>{paymentError}</span>
                <button
                  type="button"
                  onClick={() => setPaymentError(null)}
                  className="text-red-500 hover:text-red-400 p-1"
                  aria-label="Dismiss payment error"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Free Shipping Progress Engine */}
            <div className="px-6 py-3.5 bg-[var(--bg-surface)] border-b border-[var(--border)]">
              <div className="flex justify-between items-center text-xs font-mono mb-2">
                <span className="text-[var(--text-secondary)] uppercase tracking-wider">
                  {metrics.isFreeShipping ? 'FREE SHIPPING UNLOCKED' : `ADD ${formatPrice(metrics.freeShippingDelta)} FOR FREE SHIPPING`}
                </span>
                <span className="text-[var(--text-primary)] dark:text-[var(--accent)] font-bold">{metrics.freeShippingProgress}%</span>
              </div>
              <div className="w-full h-1 bg-[var(--border)] overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                  style={{ width: `${metrics.freeShippingProgress}%` }}
                  role="progressbar"
                  aria-valuenow={metrics.freeShippingProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>

            {/* Payment Confirmation Overlay */}
            {paymentSuccess && (
              <div className="p-6 bg-[var(--bg-surface)] border-b border-[#22c55e]/30 flex items-center gap-3">
                <CheckCircle size={28} className="text-[#22c55e] flex-shrink-0" weight="fill" />
                <div>
                  <p className="text-[var(--text-primary)] text-xs font-bold uppercase tracking-wider font-heading">Payment Verified</p>
                  <p className="text-[var(--text-secondary)] text-xs font-mono mt-0.5">ID: {paymentSuccess}</p>
                </div>
              </div>
            )}

            {/* Cart Item Stream */}
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[var(--border)]">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <p className="text-[var(--text-primary)] text-base font-bold uppercase tracking-widest font-heading">
                    YOUR ARCHIVE IS EMPTY
                  </p>
                  <p className="text-[var(--text-muted)] text-xs max-w-xs leading-relaxed">
                    Explore our tactical sportswear drop and add high-performance gear to your collection.
                  </p>
                  <Button variant="outline" size="md" onClick={closeCart}>
                    CONTINUE BROWSING
                  </Button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
                      transition={{ duration: 0.18, ease: EMIL_EASE }}
                      className="py-4 flex gap-4 items-start"
                    >
                      {/* Product Thumbnail */}
                      <div className="w-20 h-24 bg-[var(--bg-surface)] border border-[var(--border)] flex-shrink-0 overflow-hidden relative">
                        <Image
                          src={item.image || '/products/image-4-1.jpg'}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover object-center"
                        />
                      </div>

                      {/* Meta & Controls */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                        <div>
                          <h3 className="text-[var(--text-primary)] text-xs font-bold uppercase tracking-wider font-heading truncate">
                            {item.name}
                          </h3>
                          <p className="text-[var(--text-secondary)] text-[11px] font-mono mt-0.5 uppercase tracking-wide">
                            {item.color} / {item.size}
                          </p>
                          <p className="text-[var(--text-primary)] dark:text-[var(--accent)] text-xs font-mono font-bold mt-1">
                            {formatPrice(item.price)}
                          </p>
                        </div>

                        {/* Quantity Stepper & Remove Action */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="inline-flex items-center border border-[var(--border)] bg-[var(--bg-surface)]">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              aria-label={`Decrease quantity for ${item.name}`}
                              className="touch-target min-w-[44px] min-h-[44px] sm:min-w-[48px] sm:min-h-[48px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] btn-tactile active:scale-[0.97]"
                            >
                              <Minus size={12} weight="bold" />
                            </button>
                            <span className="w-8 text-center text-xs font-mono text-[var(--text-primary)] font-bold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= (item.maxStock ?? 99)}
                              aria-label={`Increase quantity for ${item.name}`}
                              className="touch-target min-w-[44px] min-h-[44px] sm:min-w-[48px] sm:min-h-[48px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] btn-tactile active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Plus size={12} weight="bold" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove ${item.name} from bag`}
                            className="text-[var(--text-muted)] hover:text-[#ff3b3b] transition-colors p-2.5 touch-target min-w-[48px] min-h-[48px] flex items-center justify-center btn-tactile active:scale-[0.97]"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer Order Summary & Razorpay Trigger */}
            {items.length > 0 && (
              <div className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] border-t border-[var(--border)] bg-[var(--bg-surface)] space-y-4">
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>SUBTOTAL</span>
                    <span className="text-[var(--text-primary)] font-bold">{formatPrice(metrics.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>ESTIMATED TAX (8%)</span>
                    <span>{formatPrice(metrics.tax)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>SHIPPING</span>
                    <span>{metrics.shipping === 0 ? 'FREE' : formatPrice(metrics.shipping)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-primary)] font-bold pt-2 border-t border-[var(--border)] text-sm">
                    <span>ESTIMATED TOTAL</span>
                    <span className="text-[var(--text-primary)] dark:text-[var(--accent)]">{formatPrice(metrics.total)}</span>
                  </div>
                </div>

                {/* Payment Button */}
                <Button
                  onClick={handleRazorpayCheckout}
                  disabled={isProcessing}
                  isLoading={isProcessing}
                  variant="volt"
                  size="lg"
                  className="w-full"
                  icon={<ArrowRight size={16} weight="bold" />}
                >
                  {isProcessing ? 'INITIALIZING RAZORPAY...' : 'PAY WITH RAZORPAY'}
                </Button>

                {/* Security Guarantees */}
                <div className="flex items-center justify-center gap-2 text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider">
                  <ShieldCheck size={14} className="text-[#22c55e]" />
                  <span>256-BIT ENCRYPTED / BANK-GRADE SECURITY</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
