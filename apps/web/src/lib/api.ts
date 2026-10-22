const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  token?: string;
}

let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

function getStoredToken(): string | null {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  if (typeof window === 'undefined') return null;
  try {
    return (
      localStorage.getItem('xydv_admin_token') ||
      localStorage.getItem('xydv_auth_token') ||
      localStorage.getItem('vertex_admin_token') ||
      localStorage.getItem('vertex_auth_token')
    );
  } catch {
    return null;
  }
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, token, headers, body, ...init } = options;

  let url = `${API_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(
      Object.entries(params).reduce(
        (acc, [k, v]) => {
          if (v !== undefined) {
            acc[k] = String(v);
          }
          return acc;
        },
        {} as Record<string, string>,
      ),
    );
    const qs = searchParams.toString();
    if (qs) {
      url += `?${qs}`;
    }
  }

  const resolvedHeaders: Record<string, string> = { ...(headers as Record<string, string>) };

  // Set Content-Type only if body is NOT FormData
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (!isFormData && !resolvedHeaders['Content-Type']) {
    resolvedHeaders['Content-Type'] = 'application/json';
  }

  // Attach auth token if available and not explicitly provided
  const authToken = token || getStoredToken();
  if (authToken && !resolvedHeaders['Authorization']) {
    resolvedHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(url, {
    credentials: 'include',
    signal: init?.signal ?? AbortSignal.timeout(10000),
    headers: resolvedHeaders,
    body: isFormData
      ? body
      : typeof body === 'object' && body !== null
        ? JSON.stringify(body)
        : (body as BodyInit),
    ...init,
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      try {
        setAccessToken(null);
        localStorage.removeItem('xydv_admin_token');
        localStorage.removeItem('xydv_admin_user');
        localStorage.removeItem('vertex_admin_token');
        localStorage.removeItem('vertex_admin_user');
        if (
          window.location.pathname.startsWith('/admin') &&
          window.location.pathname !== '/admin/login'
        ) {
          window.location.href = '/admin/login';
        }
      } catch {}
    }
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { method: 'POST', body: body as any, ...options }),
  patch: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { method: 'PATCH', body: body as any, ...options }),
  put: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { method: 'PUT', body: body as any, ...options }),
  delete: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { method: 'DELETE', ...options }),
};
