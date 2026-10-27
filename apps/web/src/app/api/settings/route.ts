import { NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Default schema contract for store settings fallback
const DEFAULT_SETTINGS = {
  freeShippingThreshold: 150,
  currencySymbol: '₹',
};

export async function GET() {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 30 },
    });

    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json);
    }

    return NextResponse.json(
      { success: false, error: 'Backend API unavailable' },
      { status: 502 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Backend API unavailable' },
      { status: 502 },
    );
  }
}
