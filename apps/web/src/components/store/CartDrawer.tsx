'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import { calculateCartMetrics } from '@vertex/types';
import {
  X,
  Minus,
  Plus,
  Trash,
  ShieldCheck,
  ArrowRight,
  CheckCircle,
  MapPin,
  Tag,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EMIL_EASE } from '@/lib/motion';
import { api } from '@/lib/api';
import { useCustomerAuthStore } from '@/store/customerAuth';
import type { ICouponValidationResult } from '@vertex/types';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const customerUser = useCustomerAuthStore((s) => s.user);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN',
    phone: '',
    email: '',
  });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  useEffect(() => {
    if (customerUser) {
      setShippingAddress((prev) => ({
        ...prev,
        fullName: prev.fullName || customerUser.name || '',
        email: prev.email || customerUser.email || '',
        phone: prev.phone || customerUser.phone || '',
      }));
    }
  }, [customerUser]);

  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [storeSettings, setStoreSettings] = useState<{
    freeShippingThreshold: number;
    standardShippingFee: number;
    taxRate: number;
    currency: string;
  }>({
    freeShippingThreshold: 150,
    standardShippingFee: 15,
    taxRate: 0.18,
    currency: 'INR',
  });

  useEffect(() => {
    let isMounted = true;
    /* prettier-ignore */
    api.get<{
        success: boolean;
        data: {
          freeShippingThreshold: number;
          standardShippingFee: number;
          taxRate: number;
          currency: string;
        };
      }>('/settings')
      .then((res) => {
        const data = res?.data;
        if (isMounted && data?.freeShippingThreshold !== undefined) {
          setStoreSettings({
            freeShippingThreshold: Number(data.freeShippingThreshold),
            standardShippingFee: Number(data.standardShippingFee ?? 15),
            taxRate: Number(data.taxRate ?? 0.18),
            currency: data.currency ?? 'INR',
          });
          setIsSettingsLoaded(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsSettingsLoaded(true);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Coupon State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<ICouponValidationResult | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showPromoAccordion, setShowPromoAccordion] = useState(false);
  const lastValidatedKeyRef = useRef<string>('');

  const couponValidationKey = appliedCoupon
    ? `${appliedCoupon.code}:${items.map((i) => `${i.productId}-${i.sku}-${i.quantity}-${i.price}`).join('|')}:${shippingAddress.email || customerUser?.email || ''}`
    : '';

  // Apply coupon handler
  const handleApplyCoupon = useCallback(async () => {
    if (!promoCodeInput.trim() || items.length === 0) return;
    setIsValidatingCoupon(true);
    setCouponError(null);

    try {
      const res = await api.post<{
        success: boolean;
        data: ICouponValidationResult;
      }>('/coupons/validate', {
        code: promoCodeInput.trim().toUpperCase(),
        items: items.map((i) => ({
          productId: i.productId,
          sku: i.sku,
          quantity: i.quantity,
          price: i.price,
        })),
        guestEmail: (shippingAddress.email || customerUser?.email || '').trim() || undefined,
      });

      if (res?.data && res.data.valid) {
        lastValidatedKeyRef.current = `${res.data.code}:${items.map((i) => `${i.productId}-${i.sku}-${i.quantity}-${i.price}`).join('|')}:${shippingAddress.email || customerUser?.email || ''}`;
        setAppliedCoupon(res.data);
        setPromoCodeInput('');
      } else {
        setCouponError('Invalid coupon code.');
      }
    } catch (err: unknown) {
      setCouponError(err instanceof Error ? err.message : 'Failed to apply coupon.');
    } finally {
      setIsValidatingCoupon(false);
    }
  }, [promoCodeInput, items, shippingAddress.email, customerUser?.email]);

  const handleRemoveCoupon = useCallback(() => {
    lastValidatedKeyRef.current = '';
    setAppliedCoupon(null);
    setCouponError(null);
  }, []);

  // Silently revalidate applied coupon when items change
  useEffect(() => {
    if (!appliedCoupon) {
      lastValidatedKeyRef.current = '';
      return;
    }

    if (items.length === 0) {
      setAppliedCoupon(null);
      lastValidatedKeyRef.current = '';
      return;
    }

    if (lastValidatedKeyRef.current === couponValidationKey) {
      return;
    }

    let isMounted = true;
    api
      .post<{ success: boolean; data: ICouponValidationResult }>('/coupons/validate', {
        code: appliedCoupon.code,
        items: items.map((i) => ({
          productId: i.productId,
          sku: i.sku,
          quantity: i.quantity,
          price: i.price,
        })),
        guestEmail: (shippingAddress.email || customerUser?.email || '').trim() || undefined,
      })
      .then((res) => {
        if (!isMounted) return;
        if (res?.data && res.data.valid) {
          lastValidatedKeyRef.current = couponValidationKey;
          setAppliedCoupon(res.data);
        } else {
          setAppliedCoupon(null);
          lastValidatedKeyRef.current = '';
          setCouponError('Coupon was removed due to cart changes.');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setAppliedCoupon(null);
        lastValidatedKeyRef.current = '';
        setCouponError('Coupon conditions no longer met.');
      });

    return () => {
      isMounted = false;
    };
  }, [items, appliedCoupon, couponValidationKey, customerUser?.email, shippingAddress.email]);

  // Compute live metrics with applied coupon discount and GST on net taxable subtotal
  const metrics = useMemo(() => {
    const rawMetrics = calculateCartMetrics(items, storeSettings);
    const couponDiscountRupees = appliedCoupon ? appliedCoupon.discountAmountRupees : 0;
    const netTaxableSubtotal = Math.max(
      0,
      Math.round((rawMetrics.subtotal - couponDiscountRupees) * 100) / 100,
    );
    const effectiveTax = Math.round(netTaxableSubtotal * storeSettings.taxRate * 100) / 100;
    const effectiveShipping = rawMetrics.shipping;
    const effectiveTotal = Math.round(
      (netTaxableSubtotal + effectiveTax + effectiveShipping) * 100,
    ) / 100;
    const effectiveAmountPaise = Math.round(effectiveTotal * 100);

    return {
      ...rawMetrics,
      discount: couponDiscountRupees,
      tax: effectiveTax,
      total: effectiveTotal,
      amountPaise: effectiveAmountPaise,
    };
  }, [items, storeSettings, appliedCoupon]);

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
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => el.offsetParent !== null || el.offsetWidth > 0);

        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === first ||
            !drawerRef.current.contains(document.activeElement)
          ) {
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
    setPaymentError(null);
    setAddressError(null);

    // Validate real customer shipping address
    if (
      !shippingAddress.fullName.trim() ||
      !shippingAddress.line1.trim() ||
      !shippingAddress.city.trim() ||
      !shippingAddress.postalCode.trim() ||
      !shippingAddress.phone.trim()
    ) {
      setShowAddressForm(true);
      setAddressError('Please provide complete delivery address and phone number.');
      return;
    }

    setIsProcessing(true);

    try {
      let razorpayOrderId: string | undefined;
      let backendOrderId: string | undefined;
      let orderAmount: number | undefined;
      let rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_xydv2026';

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
          shippingAddress: {
            fullName: shippingAddress.fullName.trim(),
            line1: shippingAddress.line1.trim(),
            line2: shippingAddress.line2.trim(),
            city: shippingAddress.city.trim(),
            state: shippingAddress.state.trim() || 'IN',
            postalCode: shippingAddress.postalCode.trim(),
            country: shippingAddress.country || 'IN',
            phone: shippingAddress.phone.trim(),
            email: (shippingAddress.email || customerUser?.email || '').trim(),
          },
          email: (shippingAddress.email || customerUser?.email || '').trim(),
          couponCode: appliedCoupon?.code || undefined,
        });

        const orderData = orderRes?.data;
        if (orderData?.razorpayOrderId) {
          razorpayOrderId = orderData.razorpayOrderId;
          backendOrderId = orderData.orderId;
          orderAmount = orderData.amount;
          if (orderData.keyId) {
            rzpKey = orderData.keyId;
          }
        } else {
          throw new Error('Order creation did not return order details.');
        }
      } catch (orderApiErr: unknown) {
        console.error('Backend order creation failed:', orderApiErr);
        const errMsg =
          orderApiErr instanceof Error
            ? orderApiErr.message
            : 'Failed to initialize order with server. Please try again.';
        setPaymentError(errMsg);
        setIsProcessing(false);
        return;
      }

      if (!razorpayOrderId || !backendOrderId) {
        setPaymentError('Failed to initialize checkout session. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Setup Razorpay checkout options
      const options = {
        key: rzpKey,
        amount: orderAmount ?? metrics.amountPaise,
        currency: storeSettings?.currency || 'INR',
        name: 'XYDV TECHNICAL DIVISION',
        description: `Order Checkout — ${items.length} items`,
        image: '/brand/xydv-logo.png',
        order_id: razorpayOrderId,
        prefill: {
          name: shippingAddress.fullName.trim(),
          email: (shippingAddress.email || customerUser?.email || 'customer@xydv.com').trim(),
          contact: shippingAddress.phone.trim(),
        },
        theme: {
          color: '#0A0A0A',
          backdrop_color: '#0A0A0A',
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setPaymentError('Payment window was closed. Your bag has been preserved.');
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id?: string;
          razorpay_signature?: string;
        }) => {
          if (!response.razorpay_payment_id || !response.razorpay_signature) {
            setPaymentError('Payment failed: missing verification signature.');
            setIsProcessing(false);
            return;
          }
          try {
            await api.post('/orders/razorpay/verify-payment', {
              razorpayOrderId: response.razorpay_order_id || razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId: backendOrderId,
            });
            setPaymentSuccess(response.razorpay_payment_id);
            setAppliedCoupon(null);
            clearCart();
            setTimeout(() => {
              setPaymentSuccess(null);
              closeCart();
            }, 4000);
          } catch (verifyErr: unknown) {
            console.error('Payment verification failed:', verifyErr);
            const errMsg =
              verifyErr instanceof Error
                ? verifyErr.message
                : 'Payment verification failed. Your bag has been preserved.';
            setPaymentError(errMsg);
          } finally {
            setIsProcessing(false);
          }
        },
      };

      if (typeof window !== 'undefined' && window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp: unknown) => {
          setIsProcessing(false);
          let failureDesc: string | undefined;
          if (typeof resp === 'object' && resp !== null && 'error' in resp) {
            const maybeError = Reflect.get(resp, 'error');
            if (
              typeof maybeError === 'object' &&
              maybeError !== null &&
              'description' in maybeError
            ) {
              const maybeDesc = Reflect.get(maybeError, 'description');
              if (typeof maybeDesc === 'string') {
                failureDesc = maybeDesc;
              }
            }
          }
          setPaymentError(
            failureDesc ||
              'Payment was declined or failed at gateway. Your bag has been preserved.',
          );
        });
        rzp.open();
      } else {
        setPaymentError(
          'Payment gateway could not be loaded. Please disable ad-blockers or check your connection.',
        );
        setIsProcessing(false);
      }
    } catch (err: unknown) {
      console.error('Razorpay initialization failure:', err);
      const errMsg =
        err instanceof Error ? err.message : 'Failed to initialize checkout. Please try again.';
      setPaymentError(errMsg);
      setIsProcessing(false);
    }
  }, [items, metrics, storeSettings, clearCart, closeCart, shippingAddress, customerUser, appliedCoupon?.code]);

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm dark:bg-black/80"
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
            className="fixed top-0 right-0 z-50 flex h-[100dvh] max-h-[100dvh] w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--bg)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)] px-6 py-5">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-sm font-bold tracking-[0.2em] text-[var(--text-primary)] uppercase">
                  BAG ({items.reduce((s, i) => s + i.quantity, 0)})
                </h2>
                <Badge variant="volt" size="sm">
                  RAZORPAY VERIFIED
                </Badge>
              </div>
              <button
                onClick={closeCart}
                aria-label="Close cart drawer"
                className="touch-target btn-tactile text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Payment Error Alert */}
            {paymentError && (
              <div className="flex items-center justify-between border-b border-red-500/30 bg-red-500/10 px-6 py-3 font-mono text-xs text-red-500">
                <span>{paymentError}</span>
                <button
                  type="button"
                  onClick={() => setPaymentError(null)}
                  className="p-1 text-red-500 hover:text-red-400"
                  aria-label="Dismiss payment error"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Free Shipping Progress Engine */}
            <div className="border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-3.5">
              <div className="mb-2 flex items-center justify-between font-mono text-xs">
                <span className="tracking-wider text-[var(--text-secondary)] uppercase">
                  {!isSettingsLoaded ? (
                    'CALCULATING SHIPPING...'
                  ) : metrics.isFreeShipping ? (
                    'FREE SHIPPING UNLOCKED'
                  ) : (
                    `ADD ${formatPrice(metrics.freeShippingDelta)} FOR FREE SHIPPING`
                  )}
                </span>
                <span className="font-bold text-[var(--text-primary)] dark:text-[var(--accent)]">
                  {isSettingsLoaded ? `${metrics.freeShippingProgress}%` : '...'}
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden bg-[var(--border)]">
                <div
                  className="h-full bg-[var(--accent)] transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                  style={{ width: `${isSettingsLoaded ? metrics.freeShippingProgress : 0}%` }}
                  role="progressbar"
                  aria-valuenow={isSettingsLoaded ? metrics.freeShippingProgress : 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>

            {/* Payment Confirmation Overlay */}
            {paymentSuccess && (
              <div className="flex items-center gap-3 border-b border-[#22c55e]/30 bg-[var(--bg-surface)] p-6">
                <CheckCircle size={28} className="flex-shrink-0 text-[#22c55e]" weight="fill" />
                <div>
                  <p className="font-heading text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
                    Payment Verified
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-[var(--text-secondary)]">
                    ID: {paymentSuccess}
                  </p>
                </div>
              </div>
            )}

            {/* Cart Item Stream */}
            <div className="flex-1 divide-y divide-[var(--border)] overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center space-y-4 p-6 text-center">
                  <p className="font-heading text-base font-bold tracking-widest text-[var(--text-primary)] uppercase">
                    YOUR ARCHIVE IS EMPTY
                  </p>
                  <p className="max-w-xs text-xs leading-relaxed text-[var(--text-muted)]">
                    Explore our tactical sportswear drop and add high-performance gear to your
                    collection.
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
                      className="flex items-start gap-4 py-4"
                    >
                      {/* Product Thumbnail */}
                      <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden border border-[var(--border)] bg-[var(--bg-surface)]">
                        <Image
                          src={item.image || '/products/image-4-1.jpg'}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover object-center"
                        />
                      </div>

                      {/* Meta & Controls */}
                      <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
                        <div>
                          <h3 className="font-heading truncate text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
                            {item.name}
                          </h3>
                          <p className="mt-0.5 font-mono text-[11px] tracking-wide text-[var(--text-secondary)] uppercase">
                            {item.color} / {item.size}
                          </p>
                          <p className="mt-1 font-mono text-xs font-bold text-[var(--text-primary)] dark:text-[var(--accent)]">
                            {formatPrice(item.price)}
                          </p>
                        </div>

                        {/* Quantity Stepper & Remove Action */}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="inline-flex items-center border border-[var(--border)] bg-[var(--bg-surface)]">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              aria-label={`Decrease quantity for ${item.name}`}
                              data-testid="cart-qty-decrease"
                              className="touch-target btn-tactile flex min-h-[44px] min-w-[44px] items-center justify-center p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-[0.97] sm:min-h-[48px] sm:min-w-[48px]"
                            >
                              <Minus size={12} weight="bold" />
                            </button>
                            <span
                              className="w-8 text-center font-mono text-xs font-bold text-[var(--text-primary)]"
                              data-testid="cart-item-quantity"
                            >
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= (item.maxStock ?? 99)}
                              aria-label={`Increase quantity for ${item.name}`}
                              data-testid="cart-qty-increase"
                              className="touch-target btn-tactile flex min-h-[44px] min-w-[44px] items-center justify-center p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30 sm:min-h-[48px] sm:min-w-[48px]"
                            >
                              <Plus size={12} weight="bold" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove ${item.name} from bag`}
                            data-testid="cart-item-remove"
                            className="touch-target btn-tactile flex min-h-[44px] min-w-[44px] items-center justify-center p-2.5 text-[var(--text-muted)] transition-colors hover:text-[#ff3b3b] active:scale-[0.97] sm:min-h-[48px] sm:min-w-[48px]"
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
              <div className="space-y-4 border-t border-[var(--border)] bg-[var(--bg-surface)] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                {/* Shipping Address Form Section */}
                <div className="space-y-3 border border-[var(--border)] bg-[var(--bg-elevated)] p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                        <MapPin size={12} weight="bold" />
                        <span>DISPATCH DESTINATION</span>
                      </span>
                      <h4 className="font-heading mt-0.5 text-xs font-bold text-[var(--text-primary)] uppercase">
                        SHIPPING ADDRESS
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(!showAddressForm)}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center px-1 font-mono text-[11px] font-bold text-[var(--text-primary)] underline hover:text-[var(--accent)] focus-visible:ring-1 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
                    >
                      {showAddressForm ? 'CLOSE' : shippingAddress.line1 ? 'EDIT' : '+ ADD ADDRESS'}
                    </button>
                  </div>

                  {!showAddressForm && shippingAddress.line1 ? (
                    <div className="space-y-0.5 border border-[var(--border)] bg-[var(--bg)] p-2.5 font-mono text-xs text-[var(--text-secondary)]">
                      <p className="font-bold text-[var(--text-primary)]">
                        {shippingAddress.fullName}
                      </p>
                      <p>
                        {shippingAddress.line1}
                        {shippingAddress.line2 ? `, ${shippingAddress.line2}` : ''}
                      </p>
                      <p>
                        {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        PHONE: {shippingAddress.phone}
                      </p>
                    </div>
                  ) : null}

                  {showAddressForm && (
                    <div className="space-y-2.5 border-t border-[var(--border)] pt-1">
                      {addressError && (
                        <div
                          role="alert"
                          className="border border-red-500/30 bg-red-500/10 p-2 font-mono text-[11px] text-red-500"
                        >
                          {addressError}
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="shipping-fullName"
                            className="mb-1 block font-mono text-[10px] text-[var(--text-muted)] uppercase"
                          >
                            FULL NAME *
                          </label>
                          <input
                            id="shipping-fullName"
                            type="text"
                            required
                            placeholder="Recipient name"
                            value={shippingAddress.fullName}
                            onChange={(e) => {
                              setAddressError(null);
                              setShippingAddress({ ...shippingAddress, fullName: e.target.value });
                            }}
                            className="min-h-[44px] w-full border border-[var(--border)] bg-[var(--bg)] p-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="shipping-phone"
                            className="mb-1 block font-mono text-[10px] text-[var(--text-muted)] uppercase"
                          >
                            PHONE NUMBER *
                          </label>
                          <input
                            id="shipping-phone"
                            type="tel"
                            required
                            placeholder="+91 98765 43210"
                            value={shippingAddress.phone}
                            onChange={(e) => {
                              setAddressError(null);
                              setShippingAddress({ ...shippingAddress, phone: e.target.value });
                            }}
                            className="min-h-[44px] w-full border border-[var(--border)] bg-[var(--bg)] p-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="shipping-line1"
                          className="mb-1 block font-mono text-[10px] text-[var(--text-muted)] uppercase"
                        >
                          STREET ADDRESS *
                        </label>
                        <input
                          id="shipping-line1"
                          type="text"
                          required
                          placeholder="House, building, street"
                          value={shippingAddress.line1}
                          onChange={(e) => {
                            setAddressError(null);
                            setShippingAddress({ ...shippingAddress, line1: e.target.value });
                          }}
                          className="min-h-[44px] w-full border border-[var(--border)] bg-[var(--bg)] p-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="shipping-line2"
                          className="mb-1 block font-mono text-[10px] text-[var(--text-muted)] uppercase"
                        >
                          APARTMENT, SUITE, ETC. (OPTIONAL)
                        </label>
                        <input
                          id="shipping-line2"
                          type="text"
                          placeholder="Apartment, unit, floor"
                          value={shippingAddress.line2}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, line2: e.target.value })
                          }
                          className="min-h-[44px] w-full border border-[var(--border)] bg-[var(--bg)] p-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                          <label
                            htmlFor="shipping-city"
                            className="mb-1 block font-mono text-[10px] text-[var(--text-muted)] uppercase"
                          >
                            CITY *
                          </label>
                          <input
                            id="shipping-city"
                            type="text"
                            required
                            placeholder="City"
                            value={shippingAddress.city}
                            onChange={(e) => {
                              setAddressError(null);
                              setShippingAddress({ ...shippingAddress, city: e.target.value });
                            }}
                            className="min-h-[44px] w-full border border-[var(--border)] bg-[var(--bg)] p-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                          />
                        </div>
                        <div className="col-span-1">
                          <label
                            htmlFor="shipping-state"
                            className="mb-1 block font-mono text-[10px] text-[var(--text-muted)] uppercase"
                          >
                            STATE
                          </label>
                          <input
                            id="shipping-state"
                            type="text"
                            placeholder="State"
                            value={shippingAddress.state}
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, state: e.target.value })
                            }
                            className="min-h-[44px] w-full border border-[var(--border)] bg-[var(--bg)] p-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                          />
                        </div>
                        <div className="col-span-1">
                          <label
                            htmlFor="shipping-postalCode"
                            className="mb-1 block font-mono text-[10px] text-[var(--text-muted)] uppercase"
                          >
                            PIN CODE *
                          </label>
                          <input
                            id="shipping-postalCode"
                            type="text"
                            required
                            placeholder="PIN code"
                            value={shippingAddress.postalCode}
                            onChange={(e) => {
                              setAddressError(null);
                              setShippingAddress({
                                ...shippingAddress,
                                postalCode: e.target.value,
                              });
                            }}
                            className="min-h-[44px] w-full border border-[var(--border)] bg-[var(--bg)] p-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Promo Code Section */}
                <div className="border border-[var(--border)] bg-[var(--bg)] p-3">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)] dark:border-[#E8FF00]/40 dark:bg-[#E8FF00]/10 dark:text-[#E8FF00]">
                          <Tag size={14} weight="bold" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold tracking-wider text-[var(--text-primary)] dark:text-[#E8FF00]">
                              {appliedCoupon.code}
                            </span>
                            <Badge variant="success" size="sm">
                              {appliedCoupon.discountType === 'percentage'
                                ? `${appliedCoupon.discountValue}% OFF`
                                : `₹${appliedCoupon.discountAmountRupees} OFF`}
                            </Badge>
                          </div>
                          <p className="font-sans text-[10px] text-[var(--text-secondary)]">
                            Saved ₹{appliedCoupon.discountAmountRupees.toLocaleString('en-IN')}
                            {appliedCoupon.maxDiscountCap && (
                              <span className="text-[var(--text-muted)]">
                                {' '}(capped at ₹{(appliedCoupon.maxDiscountCap / 100).toLocaleString('en-IN')})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="min-h-[44px] min-w-[44px] px-2.5 inline-flex items-center justify-center font-mono text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase hover:text-[#b91c1c] active:scale-[0.97]"
                        aria-label="Remove coupon"
                      >
                        REMOVE
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowPromoAccordion((v) => !v)}
                        className="flex w-full items-center justify-between font-mono text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase hover:text-[var(--text-primary)]"
                        aria-expanded={showPromoAccordion}
                      >
                        <span className="flex items-center gap-1.5">
                          <Tag size={14} />
                          <span>HAVE A PROMO CODE?</span>
                        </span>
                        <span className="font-mono text-xs">{showPromoAccordion ? '—' : '+'}</span>
                      </button>

                      {showPromoAccordion && (
                        <div className="mt-3 space-y-2">
                          <div className="flex gap-2">
                            <input
                              id="cart-coupon-input"
                              name="couponCode"
                              type="text"
                              aria-label="Promotional coupon code"
                              placeholder="ENTER CODE"
                              value={promoCodeInput}
                              onChange={(e) => {
                                setPromoCodeInput(e.target.value.toUpperCase());
                                setCouponError(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleApplyCoupon();
                                }
                              }}
                              className="min-h-[44px] flex-1 border border-[var(--border)] bg-[var(--bg-surface)] px-3 font-mono text-xs text-[var(--text-primary)] uppercase placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                            />
                            <button
                              type="button"
                              onClick={handleApplyCoupon}
                              disabled={isValidatingCoupon || !promoCodeInput.trim()}
                              className="btn-tactile min-h-[44px] border border-[var(--text-primary)] bg-[var(--text-primary)] px-4 font-mono text-xs font-bold tracking-wider text-[var(--bg)] uppercase transition-colors hover:opacity-90 disabled:opacity-40 active:scale-[0.97] dark:border-[#E8FF00] dark:bg-[#E8FF00] dark:text-[#0A0A0A]"
                            >
                              {isValidatingCoupon ? 'APPLYING...' : 'APPLY'}
                            </button>
                          </div>
                          {couponError && (
                            <p className="font-sans text-[11px] text-[#b91c1c] dark:text-[#ff6b6b]">
                              {couponError}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>SUBTOTAL</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {formatPrice(metrics.subtotal)}
                    </span>
                  </div>
                  {metrics.discount > 0 && (
                    <div className="flex justify-between text-[#15803d] dark:text-[#E8FF00]">
                      <span className="flex items-center gap-1">
                        <Tag size={12} weight="bold" />
                        <span>PROMO DISCOUNT ({appliedCoupon?.code})</span>
                      </span>
                      <span className="font-bold">-{formatPrice(metrics.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>ESTIMATED TAX ({Math.round(storeSettings.taxRate * 100)}%)</span>
                    <span>{formatPrice(metrics.tax)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>SHIPPING</span>
                    <span>{metrics.shipping === 0 ? 'FREE' : formatPrice(metrics.shipping)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--border)] pt-2 text-sm font-bold text-[var(--text-primary)]">
                    <span>ESTIMATED TOTAL</span>
                    <span className="text-[var(--text-primary)] dark:text-[var(--accent)]">
                      {formatPrice(metrics.total)}
                    </span>
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
                <div className="flex items-center justify-center gap-2 font-mono text-[10px] tracking-wider text-[var(--text-muted)] uppercase">
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
