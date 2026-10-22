import { NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api';

const DEFAULT_SETTINGS = {
  freeShippingThreshold: 150,
  standardShippingFee: 15,
  taxRate: 0.18,
  currency: 'INR',
  currencySymbol: '₹',
  storeName: 'XYDV',
  supportEmail: 'support@xydv.com',
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

    return NextResponse.json({
      success: true,
      data: DEFAULT_SETTINGS,
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: DEFAULT_SETTINGS,
    });
  }
}
