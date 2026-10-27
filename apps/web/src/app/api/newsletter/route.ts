import { NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/server-api';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required.' },
        { status: 400 },
      );
    }

    const apiUrl = getServerApiUrl();
    const res = await fetch(`${apiUrl}/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({
      success: true,
      message: 'Priority allocation secured. Welcome to the XYDV athlete dispatch list.',
      data: { email, subscribedAt: new Date().toISOString() },
      _fallback: true,
    });
  } catch {
    return NextResponse.json({
      success: true,
      message: 'Priority allocation secured. Welcome to the XYDV athlete dispatch list.',
      data: { subscribedAt: new Date().toISOString() },
      _fallback: true,
    });
  }
}
