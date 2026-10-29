'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, WarningCircle, SpinnerGap, ArrowRight } from '@phosphor-icons/react';
import { useCustomerAuthStore } from '@/store/customerAuth';
import { api } from '@/lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { checkAuth } = useCustomerAuthStore();

  const token = searchParams.get('token');
  const challengeId = searchParams.get('challengeId');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    if (!token || !challengeId) {
      setStatus('error');
      setMessage('Invalid or missing email verification link parameters.');
      return;
    }

    const verify = async () => {
      try {
        const json = await api.post<{
          success: boolean;
          message?: string;
        }>('/verification/verify', { challengeId, token });

        setStatus('success');
        setMessage(json.message || 'Your email has been successfully verified.');
        await checkAuth();
      } catch (err: unknown) {
        setStatus('error');
        const msg = err instanceof Error ? err.message : 'Failed to verify email address.';
        setMessage(msg);
      }
    };

    verify();
  }, [token, challengeId, checkAuth]);

  return (
    <div className="w-full max-w-md p-8 bg-[#0A0A0A] border border-[#1F1F1F] text-center shadow-2xl">
      <span className="text-[10px] uppercase font-mono tracking-widest text-[#E8FF00] block mb-2">
        XYDV PROTOCOL
      </span>

      {status === 'verifying' && (
        <div className="py-8 space-y-4">
          <SpinnerGap size={40} className="animate-spin text-[#E8FF00] mx-auto" />
          <h1 className="text-xl font-black uppercase tracking-tight text-white">Verifying Email</h1>
          <p className="text-xs text-zinc-400 font-mono">{message}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="py-8 space-y-4">
          <CheckCircle size={48} className="text-[#E8FF00] mx-auto" />
          <h1 className="text-xl font-black uppercase tracking-tight text-white">Email Verified</h1>
          <p className="text-xs text-zinc-400 font-mono">{message}</p>
          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#E8FF00] hover:bg-[#d4e600] text-black font-black uppercase text-xs tracking-wider transition-colors min-h-[44px]"
            >
              <span>Continue Shopping</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="py-8 space-y-4">
          <WarningCircle size={48} className="text-red-500 mx-auto" />
          <h1 className="text-xl font-black uppercase tracking-tight text-white">Verification Failed</h1>
          <p className="text-xs text-zinc-400 font-mono">{message}</p>
          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#1F1F1F] hover:border-zinc-500 text-white font-mono text-xs uppercase tracking-wider transition-colors min-h-[44px]"
            >
              <span>Return Home</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-zinc-500 font-mono text-xs">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
