import { NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${API_BASE_URL}/admin/track-view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ success: false }, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: 'Telemetry unavailable' }, { status: 502 });
  }
}
