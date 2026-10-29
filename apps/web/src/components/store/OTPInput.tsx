'use client';

import React, { useRef, useEffect } from 'react';

interface OTPInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  hasError?: boolean;
  statusAnnouncement?: string;
}

export function OTPInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  hasError = false,
  statusAnnouncement,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;

    const newOtp = [...value];
    newOtp[index] = val.slice(-1);
    onChange(newOtp);

    // Auto-advance to next input
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check completion
    if (newOtp.every((digit) => digit !== '') && val && onComplete) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      onChange(digits);
      inputRefs.current[5]?.focus();
      if (onComplete) {
        onComplete(pasteData);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Accessible aria-live region */}
      <div aria-live="polite" className="sr-only">
        {statusAnnouncement || `Verification code entry. ${value.filter(Boolean).length} of 6 digits entered.`}
      </div>

      <div
        className="flex justify-between gap-1.5 sm:gap-2"
        onPaste={handlePaste}
        role="group"
        aria-label="One-Time Verification Code"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            disabled={disabled}
            value={value[i] || ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-lg font-mono font-bold bg-[#111111] border transition-colors ${
              hasError
                ? 'border-red-600 text-red-400'
                : 'border-[#1F1F1F] text-[#E8FF00] focus:border-[#E8FF00]'
            } focus:outline-none disabled:opacity-40`}
            aria-label={`Digit ${i + 1} of verification code`}
          />
        ))}
      </div>
    </div>
  );
}
