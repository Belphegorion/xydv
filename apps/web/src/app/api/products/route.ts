import { NextResponse } from 'next/server';
import { getFilteredProducts, CatalogFilterParams } from '@/lib/catalog';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get('category') || undefined;
  const discipline = searchParams.get('discipline') || undefined;
  const gender = searchParams.get('gender') || undefined;
  const search = searchParams.get('search') || undefined;
  const sort = (searchParams.get('sort') as CatalogFilterParams['sort']) || 'featured';
  const inStockOnly = searchParams.get('inStock') === 'true';

  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');
  const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined;
  const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined;

  const products = getFilteredProducts({
    category,
    discipline,
    gender,
    search,
    sort,
    inStockOnly,
    minPrice,
    maxPrice,
  });

  return NextResponse.json({
    total: products.length,
    products,
  });
}
