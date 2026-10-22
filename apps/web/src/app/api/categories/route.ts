import { NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const DEFAULT_CATEGORIES = [
  {
    id: 'tops',
    slug: 'tops',
    name: 'Tops & Engineered Layers',
    description: 'Next-to-skin moisture regulation & aerodynamic compression',
  },
  {
    id: 'bottoms',
    slug: 'bottoms',
    name: 'Pants & Training Shorts',
    description: 'Cordura reinforced modular utility with 4-way stretch',
  },
  {
    id: 'outerwear',
    slug: 'outerwear',
    name: 'Weatherproof Shells',
    description: 'Gore-Tex 3-layer tactical membranes & seam-sealed parkas',
  },
  {
    id: 'accessories',
    slug: 'accessories',
    name: 'Tactical Gear & Accessories',
    description: 'MOLLE-compatible modular rigs, bags, and technical accessories',
  },
];

export async function GET() {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 30 },
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
    const fallbackRes = await fetch(`${API_BASE_URL}/products/categories`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 30 },
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
      categories: DEFAULT_CATEGORIES,
      data: DEFAULT_CATEGORIES,
    });
  } catch {
    return NextResponse.json({
      success: true,
      categories: DEFAULT_CATEGORIES,
      data: DEFAULT_CATEGORIES,
    });
  }
}
