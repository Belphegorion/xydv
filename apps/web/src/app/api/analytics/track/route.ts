import { NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function POST(request: Request) {
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
    });

    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ success: false }, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Telemetry endpoint unavailable' },
      { status: 502 },
    );
  }
}
