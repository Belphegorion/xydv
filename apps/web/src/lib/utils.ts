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
  _sku?: string,
  variants?: Array<{ size?: string; stock?: number; inStock?: boolean }>,
): SizeOption[] {
  if (category === 'accessories') {
    return [{ size: 'OS', inStock: true }];
  }

  if (variants && Array.isArray(variants) && variants.length > 0) {
    const sizeMap = new Map<string, boolean>();
    for (const v of variants) {
      if (!v.size) continue;
      const inStock =
        typeof v.stock === 'number'
          ? v.stock > 0
          : typeof v.inStock === 'boolean'
            ? v.inStock
            : true;
      const current = sizeMap.get(v.size);
      sizeMap.set(v.size, current !== undefined ? current || inStock : inStock);
    }
    if (sizeMap.size > 0) {
      return Array.from(sizeMap.entries()).map(([size, inStock]) => ({ size, inStock }));
    }
  }

  return [{ size: 'OS', inStock: true }];
}

export function formatCardTitle(name: string): string {
  if (!name) return '';
  const formatted = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  return formatted.replace(/\bxydv\b/gi, 'XYDV');
}
