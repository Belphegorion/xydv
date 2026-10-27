import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const res = await fetch(`${apiUrl}/products/stats`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch product stats from upstream service' },
      { status: res.status },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Upstream product stats service unreachable' },
      { status: 502 },
    );
  }
}
