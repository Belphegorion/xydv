import { NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/server-api';
import { CATALOG_PRODUCTS } from '@/lib/catalog';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const apiUrl = getServerApiUrl();
  const targetUrl = `${apiUrl}/products/${encodeURIComponent(slug)}`;

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
      const product = data.data || data.product || data;
      return NextResponse.json({
        success: true,
        product,
        data: product,
      });
    }

    if (res.status === 404) {
      const fallbackProduct = CATALOG_PRODUCTS.find(
        (p) => p.slug === slug || p.id === slug,
      );
      if (fallbackProduct) {
        return NextResponse.json({
          success: true,
          product: fallbackProduct,
          data: fallbackProduct,
          _fallback: true,
        });
      }
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const fallbackProduct = CATALOG_PRODUCTS.find(
      (p) => p.slug === slug || p.id === slug,
    );
    if (fallbackProduct) {
      return NextResponse.json({
        success: true,
        product: fallbackProduct,
        data: fallbackProduct,
        _fallback: true,
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch product from backend' },
      { status: res.status },
    );
  } catch {
    const fallbackProduct = CATALOG_PRODUCTS.find(
      (p) => p.slug === slug || p.id === slug,
    );
    if (fallbackProduct) {
      return NextResponse.json({
        success: true,
        product: fallbackProduct,
        data: fallbackProduct,
        _fallback: true,
      });
    }
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
}
