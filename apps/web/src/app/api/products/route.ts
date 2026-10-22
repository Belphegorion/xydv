import { NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = `${API_BASE_URL}/products?${searchParams.toString()}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (res.ok) {
      const data = await res.json();
      const products = data.data || data.products || [];
      return NextResponse.json({
        success: true,
        total: data.total ?? products.length,
        products,
        data: products,
        page: data.page ?? 1,
        totalPages: data.totalPages ?? 1,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch products from backend' },
      { status: res.status },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Backend API unavailable',
        total: 0,
        products: [],
      },
      { status: 502 },
    );
  }
}
