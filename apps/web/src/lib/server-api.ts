/**
 * Authoritative Server-Side API URL Resolver for Next.js App Router Route Handlers & Server Components
 *
 * Prevents "Failed to parse URL from /api/..." errors when NEXT_PUBLIC_API_URL is configured
 * as a relative path (e.g. "/api") for browser clients.
 */
export function getServerApiUrl(): string {
  // 1. Explicit internal Docker/VPC/EC2 URL
  if (process.env.INTERNAL_API_URL && process.env.INTERNAL_API_URL.startsWith('http')) {
    return process.env.INTERNAL_API_URL.replace(/\/+$/, '');
  }

  // 2. If NEXT_PUBLIC_API_URL is an absolute HTTP(S) URL
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith('http')) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  // 3. Fallback: Local loopback Express backend on Port 5000
  const port = process.env.PORT || '5000';
  return `http://127.0.0.1:${port}/api`;
}
