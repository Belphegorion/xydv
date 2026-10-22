'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function RouteTelemetry() {
  const pathname = usePathname();
  const lastTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastTrackedRef.current) return;
    lastTrackedRef.current = pathname;

    const payload = JSON.stringify({
      path: pathname,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    });

    try {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Silently tolerate backend unavailability
      });
    } catch {
      // Non-blocking telemetry
    }
  }, [pathname]);

  return null;
}
export default RouteTelemetry;
