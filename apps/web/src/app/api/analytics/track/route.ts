import { NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/server-api';

export async function POST(request: Request) {
  const API_BASE_URL = getServerApiUrl();

  try {
    const body = await request.json();
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // Primary route: /analytics/track
    const res = await fetch(`${API_BASE_URL}/analytics/track`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    // Secondary fallback: /admin/track-view
    const fallbackRes = await fetch(`${API_BASE_URL}/admin/track-view`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });

    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ success: true, queued: true, _fallback: true });
  } catch {
    return NextResponse.json({ success: true, queued: true, _fallback: true });
  }
}
