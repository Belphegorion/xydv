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
  const targetUrl = `${API_BASE_URL}/products/${encodeURIComponent(slug)}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (res.ok) {
      const data = await res.json();
      const product = data.data || data.product || data;
      return NextResponse.json({
        success: true,
        product,
        data: product,
      });
    }

    if (res.status === 404) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch product from backend' },
      { status: res.status },
    );
  } catch {
    return NextResponse.json(
      { error: 'Backend API unavailable' },
      { status: 502 },
    );
  }
}
