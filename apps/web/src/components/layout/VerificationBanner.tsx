'use client';

import React, { useState } from 'react';
import { DeviceMobile, Envelope, WarningCircle, X } from '@phosphor-icons/react';
import { useCustomerAuthStore } from '@/store/customerAuth';
import { VerificationModal } from '@/components/store/VerificationModal';

export function VerificationBanner() {
  const { user, isAuthenticated } = useCustomerAuthStore();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channel, setChannel] = useState<'email' | 'sms'>('sms');

  if (!isAuthenticated || !user || isDismissed) {
    return null;
  }

  const needsPhone = !user.isPhoneVerified;
  const needsEmail = !user.isEmailVerified;

  if (!needsPhone && !needsEmail) {
    return null;
  }

  const handleOpen = (targetChannel: 'email' | 'sms') => {
    setChannel(targetChannel);
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        role="region"
        aria-label="Account verification notice"
        className="bg-zinc-950 border-b border-[#1F1F1F] text-zinc-300 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2 font-mono">
          <WarningCircle size={16} className="text-[#E8FF00] shrink-0" />
          <span>
            {needsPhone && needsEmail
              ? 'Account security: Mobile and email verification pending.'
              : needsPhone
              ? 'Dispatch notification pending: Verify your mobile number.'
              : 'Order confirmation pending: Verify your email address.'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {needsPhone && (
            <button
              onClick={() => handleOpen('sms')}
              className="text-[#E8FF00] hover:underline font-mono uppercase text-[11px] font-bold min-h-[44px] min-w-[44px] flex items-center gap-1 focus-visible:ring-1 focus-visible:ring-[#E8FF00] focus-visible:outline-none"
            >
              <DeviceMobile size={14} />
              <span>Verify Mobile</span>
            </button>
          )}

          {needsEmail && (
            <button
              onClick={() => handleOpen('email')}
              className="text-[#E8FF00] hover:underline font-mono uppercase text-[11px] font-bold min-h-[44px] min-w-[44px] flex items-center gap-1 focus-visible:ring-1 focus-visible:ring-[#E8FF00] focus-visible:outline-none"
            >
              <Envelope size={14} />
              <span>Verify Email</span>
            </button>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            className="text-zinc-500 hover:text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-1 focus-visible:ring-[#E8FF00] focus-visible:outline-none"
            aria-label="Dismiss verification banner"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <VerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialChannel={channel}
      />
    </>
  );
}
