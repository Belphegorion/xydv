import { NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/server-api';
import { CATALOG_PRODUCTS } from '@/lib/catalog';

export async function GET() {
  const apiUrl = getServerApiUrl();

  try {
    const res = await fetch(`${apiUrl}/products/stats`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({
      success: true,
      totalProducts: CATALOG_PRODUCTS.length,
      categoriesCount: 4,
      inStockCount: CATALOG_PRODUCTS.length,
      _fallback: true,
    });
  } catch {
    return NextResponse.json({
      success: true,
      totalProducts: CATALOG_PRODUCTS.length,
      categoriesCount: 4,
      inStockCount: CATALOG_PRODUCTS.length,
      _fallback: true,
    });
  }
}
