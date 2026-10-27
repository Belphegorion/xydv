import { NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/server-api';

// Default schema contract for store settings fallback
const DEFAULT_SETTINGS = {
  freeShippingThreshold: 150,
  currencySymbol: '₹',
};

export async function GET() {
  const apiUrl = getServerApiUrl();

  try {
    const res = await fetch(`${apiUrl}/settings`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json);
    }

    return NextResponse.json({
      success: true,
      settings: DEFAULT_SETTINGS,
      data: DEFAULT_SETTINGS,
      _fallback: true,
    });
  } catch {
    return NextResponse.json({
      success: true,
      settings: DEFAULT_SETTINGS,
      data: DEFAULT_SETTINGS,
      _fallback: true,
    });
  }
}
