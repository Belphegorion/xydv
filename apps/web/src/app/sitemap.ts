import type { MetadataRoute } from 'next';
import { CATALOG_PRODUCTS } from '@/lib/catalog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://xydv-performance.com';

  const staticRoutes = [
    '',
    '/products',
    '/sizing',
    '/wishlist',
    '/contact',
    '/faq',
    '/shipping',
    '/returns',
    '/privacy',
    '/terms',
    '/security',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : route === '/products' ? 0.9 : 0.8,
  }));

  let productSlugs = CATALOG_PRODUCTS.map((product) => product.slug);
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const res = await fetch(`${apiUrl}/products?limit=100`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      const liveProducts = data.data || data.products;
      if (Array.isArray(liveProducts) && liveProducts.length > 0) {
        const slugSet = new Set(productSlugs);
        liveProducts.forEach((p: { slug?: string }) => {
          if (p.slug) slugSet.add(p.slug);
        });
        productSlugs = Array.from(slugSet);
      }
    }
  } catch {
    // Fall back cleanly to static catalog products if backend is offline
  }

  const productRoutes = productSlugs.map((slug) => ({
    url: `${baseUrl}/products/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...productRoutes];
}
