import { NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/server-api';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const API_BASE_URL = getServerApiUrl();
  const targetUrl = `${API_BASE_URL}/products/${encodeURIComponent(slug)}/reviews`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      const reviews = data.data || data.reviews || (Array.isArray(data) ? data : []);
      return NextResponse.json({
        success: true,
        reviews,
        data: reviews,
      });
    }

    return NextResponse.json({
      success: true,
      reviews: [],
      data: [],
      _fallback: true,
    });
  } catch {
    return NextResponse.json({
      success: true,
      reviews: [],
      data: [],
      _fallback: true,
    });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const API_BASE_URL = getServerApiUrl();
  const targetUrl = `${API_BASE_URL}/products/${encodeURIComponent(slug)}/reviews`;

  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (authHeader) {
      headers['authorization'] = authHeader;
    }

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Review submission temporarily unavailable. Please try again shortly.' },
      { status: 503 },
    );
  }
}
