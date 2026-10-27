import { NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/server-api';

export async function POST(request: Request) {
  const apiUrl = getServerApiUrl();

  try {
    const body = await request.json();
    const res = await fetch(`${apiUrl}/admin/track-view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ success: true, queued: true, _fallback: true });
  } catch {
    return NextResponse.json({ success: true, queued: true, _fallback: true });
  }
}
