import { NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const targetUrl = `${API_BASE_URL}/products/${encodeURIComponent(slug)}/reviews`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 10 },
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

    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews from backend', reviews: [], data: [] },
      { status: res.status },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Backend reviews service unavailable', reviews: [], data: [] },
      { status: 502 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
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
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to submit review to backend' },
      { status: 502 },
    );
  }
}
