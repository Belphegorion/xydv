'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, DeviceMobile, Envelope, ArrowRight, SpinnerGap, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { useCustomerAuthStore } from '@/store/customerAuth';
import { api } from '@/lib/api';
import { EMIL_EASE, SPRING_TACTILE } from '@/lib/motion';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialChannel?: 'email' | 'sms';
  initialTarget?: string;
  onVerified?: () => void;
}

export function VerificationModal({
  isOpen,
  onClose,
  initialChannel = 'sms',
  initialTarget = '',
  onVerified,
}: VerificationModalProps) {
  const { user, checkAuth, refreshUser, updateUser } = useCustomerAuthStore();
  const shouldReduceMotion = useReducedMotion();

  const [channel, setChannel] = useState<'email' | 'sms'>(initialChannel);
  const [target, setTarget] = useState(initialTarget);
  const [step, setStep] = useState<'request' | 'verify' | 'success'>('request');
  const [challengeId, setChallengeId] = useState('');
  const [targetMasked, setTargetMasked] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);

  // Sync initial state when modal opens (without resetting when user store updates)
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setChannel(initialChannel);
      const defaultTarget =
        initialTarget ||
        (initialChannel === 'email' ? user?.email || '' : user?.phone || '');
      setTarget(defaultTarget);
      setStep('request');
      setOtp(['', '', '', '', '', '']);
      setErrorMessage('');
      setStatusMessage('');
      document.body.style.overflow = 'hidden';
      setTimeout(() => firstInputRef.current?.focus(), 50);
    } else if (!isOpen && wasOpenRef.current) {
      wasOpenRef.current = false;
      document.body.style.overflow = '';
    }
  }, [isOpen, initialChannel, initialTarget, user]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Cooldown timer countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Trap Escape key & Focus Trap without leaking to parent overlay drawers
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const focusable = Array.from(focusableElements).filter(
          (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
        );

        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!target.trim()) {
      setErrorMessage(`Please enter a valid ${channel === 'sms' ? 'mobile number' : 'email address'}.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const json = await api.post<{
        success: boolean;
        challengeId?: string;
        targetMasked?: string;
        cooldownSeconds?: number;
        data?: {
          challengeId: string;
          targetMasked: string;
          cooldownSeconds: number;
        };
      }>('/verification/send', {
        channel,
        target: target.trim(),
        purpose: 'checkout',
      });

      const cid = json.data?.challengeId || json.challengeId || '';
      const masked = json.data?.targetMasked || json.targetMasked || target;
      const cd = json.data?.cooldownSeconds || json.cooldownSeconds || 60;

      setChallengeId(cid);
      setTargetMasked(masked);
      setCooldown(cd);
      setStep('verify');
      setStatusMessage(`Verification code sent to ${masked}. Valid for 10 minutes.`);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error while requesting code.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!val) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    // Handle SMS autofill / paste of multiple digits into input
    if (val.length > 1) {
      const digits = val.replace(/\D/g, '').slice(0, 6).split('');
      if (digits.length > 0) {
        const newOtp = [...otp];
        digits.forEach((d, i) => {
          if (index + i < 6) newOtp[index + i] = d;
        });
        setOtp(newOtp);
        const nextIdx = Math.min(index + digits.length, 5);
        inputRefs.current[nextIdx]?.focus();
        if (newOtp.every((d) => d !== '')) {
          submitVerification(newOtp.join(''));
        }
      }
      return;
    }

    if (!/^\d*$/.test(val)) return;

    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits entered
    if (newOtp.every((digit) => digit !== '') && val) {
      submitVerification(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
      submitVerification(pasteData);
    }
  };

  const submitVerification = async (codeString?: string) => {
    const code = codeString || otp.join('');
    if (code.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      await api.post<{
        success: boolean;
        message?: string;
      }>('/verification/verify', {
        challengeId,
        code,
      });

      setStep('success');
      setStatusMessage('Verification successful. Account status updated.');

      const channelUpdate =
        channel === 'sms'
          ? { isPhoneVerified: true, phone: target.trim() }
          : { isEmailVerified: true, email: target.trim() };
      updateUser(channelUpdate);
      try {
        await refreshUser();
      } catch {}
      await checkAuth(true);

      if (onVerified) onVerified();

      // Check if second channel also needs verification
      const otherChannel = channel === 'sms' ? 'email' : 'sms';
      const currentUser = useCustomerAuthStore.getState().user;
      const otherVerified =
        otherChannel === 'email'
          ? currentUser?.isEmailVerified
          : currentUser?.isPhoneVerified;

      if (!otherVerified) {
        setTimeout(() => {
          setChannel(otherChannel);
          const nextTarget =
            otherChannel === 'email'
              ? currentUser?.email || ''
              : currentUser?.phone || '';
          setTarget(nextTarget);
          setStep('request');
          setOtp(['', '', '', '', '', '']);
          setErrorMessage('');
          setStatusMessage(
            `${channel === 'sms' ? 'Mobile' : 'Email'} verified. Please complete ${
              otherChannel === 'email' ? 'email' : 'mobile'
            } verification before checkout.`,
          );
        }, 1600);
      } else {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed. Please check the code and try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.stopPropagation();
            onClose();
          }
        }}
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: EMIL_EASE }}
          className="relative w-full max-w-md max-h-[min(90dvh,640px)] overflow-y-auto overscroll-contain bg-[#0A0A0A] border border-[#1F1F1F] p-4 sm:p-7 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="verification-modal-title"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-400 hover:text-white transition-colors focus-visible:ring-1 focus-visible:ring-[#E8FF00] focus-visible:outline-none"
            aria-label="Close verification modal"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="mb-6 pr-10">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#E8FF00] block mb-1">
              XYDV SECURITY
            </span>
            <h2 id="verification-modal-title" className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              {step === 'success' ? 'Verified' : 'Verify Account'}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {step === 'verify' ? (
                <>
                  Enter the 6-digit code dispatched to{' '}
                  <span className="break-all font-mono font-bold text-zinc-200">{targetMasked}</span>
                </>
              ) : (
                'Confirm your credentials for order tracking and priority dispatch.'
              )}
            </p>
          </div>

          {/* Live announcer for screen readers */}
          <div aria-live="polite" className="sr-only">
            {statusMessage || errorMessage}
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <WarningCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {statusMessage && step !== 'success' && (
            <div className="mb-4 p-3 bg-zinc-900 border border-zinc-800 text-[#E8FF00] text-xs font-mono">
              {statusMessage}
            </div>
          )}

          {/* STEP 1: Request OTP */}
          {step === 'request' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="flex gap-2 p-1 bg-zinc-900/60 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setChannel('sms');
                    setTarget(user?.phone || '');
                  }}
                  className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-colors min-h-[44px] flex items-center justify-center gap-1.5 ${
                    channel === 'sms' ? 'bg-[#E8FF00] text-black font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <DeviceMobile size={16} />
                  <span>SMS Mobile</span>
                  {user?.isPhoneVerified && (
                    <CheckCircle size={14} weight="fill" className={channel === 'sms' ? 'text-black' : 'text-[#22c55e]'} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChannel('email');
                    setTarget(user?.email || '');
                  }}
                  className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-colors min-h-[44px] flex items-center justify-center gap-1.5 ${
                    channel === 'email' ? 'bg-[#E8FF00] text-black font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Envelope size={16} />
                  <span>Email</span>
                  {user?.isEmailVerified && (
                    <CheckCircle size={14} weight="fill" className={channel === 'email' ? 'text-black' : 'text-[#22c55e]'} />
                  )}
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                  {channel === 'sms' ? 'Mobile Number (+91)' : 'Email Address'}
                </label>
                <input
                  ref={firstInputRef}
                  type={channel === 'sms' ? 'tel' : 'email'}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder={channel === 'sms' ? '+91 98765 43210' : 'athlete@xydv.com'}
                  className="min-h-[44px] w-full px-3.5 py-2.5 bg-[#111111] border border-[#1F1F1F] text-white text-base sm:text-sm focus:outline-none focus:border-[#E8FF00] focus-visible:ring-1 focus-visible:ring-[#E8FF00] transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#E8FF00] hover:bg-[#d4e600] text-black font-black uppercase text-xs tracking-wider transition-colors min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerGap size={16} className="animate-spin" />
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Enter 6-digit OTP */}
          {step === 'verify' && (
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-300 mb-2">
                  6-Digit One-Time Code
                </label>
                <div className="flex justify-between gap-1 sm:gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="flex-1 min-w-0 max-w-[48px] h-12 sm:h-14 text-center text-base sm:text-lg font-mono font-bold bg-[#111111] border border-[#1F1F1F] text-[#E8FF00] focus:outline-none focus:border-[#E8FF00] focus-visible:ring-1 focus-visible:ring-[#E8FF00] transition-colors"
                      aria-label={`Digit ${i + 1} of verification code`}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => submitVerification()}
                disabled={isSubmitting || otp.some((d) => !d)}
                className="w-full py-3 bg-[#E8FF00] hover:bg-[#d4e600] text-black font-black uppercase text-xs tracking-wider transition-colors min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerGap size={16} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify Code</span>
                )}
              </button>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-900 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-zinc-400 hover:text-white transition-colors underline min-h-[44px] flex items-center py-2 px-1"
                >
                  Change {channel === 'sms' ? 'Number' : 'Email'}
                </button>

                <button
                  type="button"
                  disabled={cooldown > 0 || isSubmitting}
                  onClick={() => handleSendCode()}
                  className="text-zinc-400 hover:text-[#E8FF00] disabled:opacity-40 transition-colors min-h-[44px] flex items-center py-2 px-1"
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === 'success' && (
            <div className="py-6 text-center space-y-3">
              <CheckCircle size={48} className="text-[#22c55e] mx-auto animate-pulse" weight="fill" />
              <p className="text-white font-bold text-sm">Account Verified</p>
              <p className="text-xs text-zinc-400">
                Your credentials have been securely verified against XYDV protocols.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
