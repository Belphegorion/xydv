import { NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/server-api';
import { CATALOG_PRODUCTS } from '@/lib/catalog';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const apiUrl = getServerApiUrl();
  const targetUrl = `${apiUrl}/products?${searchParams.toString()}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(4000),
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

    return NextResponse.json({
      success: true,
      total: CATALOG_PRODUCTS.length,
      products: CATALOG_PRODUCTS,
      data: CATALOG_PRODUCTS,
      page: 1,
      totalPages: 1,
      _fallback: true,
    });
  } catch {
    return NextResponse.json({
      success: true,
      total: CATALOG_PRODUCTS.length,
      products: CATALOG_PRODUCTS,
      data: CATALOG_PRODUCTS,
      page: 1,
      totalPages: 1,
      _fallback: true,
    });
  }
}
