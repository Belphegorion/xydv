import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + '…';
}

export interface SizeOption {
  size: string;
  inStock: boolean;
}

export function getAvailableSizes(
  category: string,
  sku?: string,
  variants?: Array<{ size?: string; stock?: number; inStock?: boolean }>,
): SizeOption[] {
  if (variants && Array.isArray(variants) && variants.length > 0) {
    const sizeMap = new Map<string, boolean>();
    for (const v of variants) {
      const s = v.size || (category === 'accessories' ? 'OS' : 'M');
      const inStock =
        typeof v.stock === 'number'
          ? v.stock > 0
          : typeof v.inStock === 'boolean'
          ? v.inStock
          : true;
      const current = sizeMap.get(s);
      sizeMap.set(s, current !== undefined ? current || inStock : inStock);
    }
    if (sizeMap.size > 0) {
      return Array.from(sizeMap.entries()).map(([size, inStock]) => ({ size, inStock }));
    }
  }

  if (category === 'accessories') {
    return [{ size: 'OS', inStock: true }];
  }
  return [
    { size: 'XS', inStock: true },
    { size: 'S', inStock: true },
    { size: 'M', inStock: true },
    { size: 'L', inStock: true },
    { size: 'XL', inStock: true },
    { size: 'XXL', inStock: true },
  ];
}
