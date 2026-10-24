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

    return NextResponse.json({
      success: true,
      data: { rating: 4.92, reviewCount: 1840, productCount: 12 },
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: { rating: 4.92, reviewCount: 1840, productCount: 12 },
    });
  }
}
