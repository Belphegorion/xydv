import { NextResponse } from 'next/server';
import { getProductBySlug, getRelatedProducts } from '@/lib/catalog';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const related = getRelatedProducts(product.id, 4);

  return NextResponse.json({
    product,
    related,
  });
}
