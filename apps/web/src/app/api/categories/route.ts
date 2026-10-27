import { NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/server-api';
import { CATALOG_PRODUCTS } from '@/lib/catalog';

const FALLBACK_CATEGORIES = Array.from(
  new Set(CATALOG_PRODUCTS.map((p) => p.category).filter(Boolean)),
);

export async function GET() {
  const apiUrl = getServerApiUrl();

  try {
    const res = await fetch(`${apiUrl}/categories`, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const json = await res.json();
      const categories = json.data || json.categories || (Array.isArray(json) ? json : []);
      if (Array.isArray(categories) && categories.length > 0) {
        return NextResponse.json({
          success: true,
          categories,
          data: categories,
        });
      }
    }

    // Secondary fallback attempt to /products/categories
    const fallbackRes = await fetch(`${apiUrl}/products/categories`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(4000),
    });

    if (fallbackRes.ok) {
      const json = await fallbackRes.json();
      const categories = json.data || json.categories || (Array.isArray(json) ? json : []);
      if (Array.isArray(categories) && categories.length > 0) {
        return NextResponse.json({
          success: true,
          categories,
          data: categories,
        });
      }
    }

    return NextResponse.json({
      success: true,
      categories: FALLBACK_CATEGORIES,
      data: FALLBACK_CATEGORIES,
      _fallback: true,
    });
  } catch {
    return NextResponse.json({
      success: true,
      categories: FALLBACK_CATEGORIES,
      data: FALLBACK_CATEGORIES,
      _fallback: true,
    });
  }
}
