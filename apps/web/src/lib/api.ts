const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  token?: string;
  _isRetry?: boolean;
}

let inMemoryAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

type AuthTokenObserver = (token: string | null) => void;
const tokenObservers: AuthTokenObserver[] = [];

export function onAccessTokenChange(observer: AuthTokenObserver): () => void {
  tokenObservers.push(observer);
  return () => {
    const idx = tokenObservers.indexOf(observer);
    if (idx !== -1) tokenObservers.splice(idx, 1);
  };
}

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
  tokenObservers.forEach((fn) => {
    try {
      fn(token);
    } catch {}
  });
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

function clearAllAuthTokens(): void {
  setAccessToken(null);
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('xydv_admin_token');
      localStorage.removeItem('xydv_admin_user');
      localStorage.removeItem('xydv_auth_token');
      localStorage.removeItem('xydv_customer_user');
      localStorage.removeItem('vertex_admin_token');
      localStorage.removeItem('vertex_admin_user');
    } catch {}
  }
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

async function requestTokenRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        clearAllAuthTokens();
        return null;
      }

      const data = await res.json().catch(() => null);
      const newToken = data?.token;
      if (typeof newToken === 'string' && newToken.length > 0) {
        setAccessToken(newToken);
        return newToken;
      }

      clearAllAuthTokens();
      return null;
    } catch {
      clearAllAuthTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, token, headers, body, _isRetry, ...init } = options;

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
    const isAuthEndpoint = endpoint.includes('/auth/refresh') || endpoint.includes('/auth/login');

    if (res.status === 401) {
      // If this was NOT a retry and NOT already an auth endpoint, attempt silent token refresh and retry
      if (!_isRetry && !isAuthEndpoint) {
        const refreshedToken = await requestTokenRefresh();
        if (refreshedToken) {
          return apiFetch<T>(endpoint, {
            ...options,
            token: refreshedToken,
            _isRetry: true,
          });
        }
      }

      // If refresh failed or was not applicable, clear auth tokens
      clearAllAuthTokens();

      // Only redirect on /admin if this wasn't an auth probe or login attempt
      if (
        typeof window !== 'undefined' &&
        !isAuthEndpoint &&
        window.location.pathname.startsWith('/admin') &&
        window.location.pathname !== '/admin/login'
      ) {
        window.location.href = '/admin/login';
      }
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
    apiFetch<T>(endpoint, { method: 'POST', body, ...options }),
  patch: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { method: 'PATCH', body, ...options }),
  put: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { method: 'PUT', body, ...options }),
  delete: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { method: 'DELETE', ...options }),
};
