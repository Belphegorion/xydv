/**
 * Notification Storefront Integration & Filtering Test Suite
 * Validates:
 * - Decision A5: Popup Formats (Centered Modal with/without image, Bottom-Right Toast)
 * - Frequency capping evaluation (once_per_session, once_per_week, always)
 * - Trigger mechanisms (immediate, delay, scroll depth)
 * - Target audience filtering (all, guest, authenticated)
 * - Priority sorting (highest priority first)
 * - Telemetry contracts (impression, click, dismiss beacons)
 * - WCAG / A11y contracts (dialog roles, focus traps, 44px touch targets)
 * - Photographic Media Plinth .dark containment invariant
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'apps', 'web');

describe('Notification Storefront: Filtering, Priority & Frequency Capping Logic', () => {
  // Pure function representing NotificationManager filtering logic
  function filterEligibleNotifications(notifications, context) {
    const { pathname, customerUser, dismissedSession, dismissedWeek, currentTime } = context;
    const now = currentTime || Date.now();

    const eligible = notifications.filter((notif) => {
      if (!notif.isActive) return false;

      // Date range
      const start = new Date(notif.startDate).getTime();
      const end = new Date(notif.endDate).getTime();
      if (now < start || now > end) return false;

      // Audience
      if (notif.targetAudience === 'authenticated' && !customerUser) return false;
      if (notif.targetAudience === 'guest' && customerUser) return false;

      // Target Pages
      if (notif.targetPages && notif.targetPages.length > 0 && !notif.targetPages.includes('all')) {
        const matches = notif.targetPages.some((p) => {
          if (p === pathname) return true;
          if (p.endsWith('*') && pathname.startsWith(p.slice(0, -1))) return true;
          return false;
        });
        if (!matches) return false;
      }

      // Frequency cap
      if (notif.frequencyCap === 'once_per_session') {
        if (dismissedSession.has(notif._id)) return false;
      } else if (notif.frequencyCap === 'once_per_week') {
        const dismissedAt = dismissedWeek.get(notif._id);
        if (dismissedAt) {
          const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
          if (now - dismissedAt < ONE_WEEK_MS) return false;
        }
      }

      return true;
    });

    // Priority sort descending
    eligible.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    return eligible;
  }

  const sampleNotifications = [
    {
      _id: 'notif_low',
      title: 'Low Priority Announcement',
      isActive: true,
      priority: 10,
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-12-31T23:59:59Z',
      targetAudience: 'all',
      targetPages: ['all'],
      frequencyCap: 'always',
    },
    {
      _id: 'notif_high',
      title: 'High Priority Flash Drop',
      isActive: true,
      priority: 90,
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-12-31T23:59:59Z',
      targetAudience: 'all',
      targetPages: ['all'],
      frequencyCap: 'once_per_session',
    },
    {
      _id: 'notif_guest_only',
      title: 'Guest Welcome Offer',
      isActive: true,
      priority: 50,
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-12-31T23:59:59Z',
      targetAudience: 'guest',
      targetPages: ['/'],
      frequencyCap: 'once_per_week',
    },
  ];

  it('Selects the highest priority eligible notification', () => {
    const eligible = filterEligibleNotifications(sampleNotifications, {
      pathname: '/',
      customerUser: null,
      dismissedSession: new Set(),
      dismissedWeek: new Map(),
    });

    assert.equal(eligible.length, 3);
    assert.equal(eligible[0]._id, 'notif_high', 'First notification must be highest priority (90)');
  });

  it('Filters out once_per_session popup if dismissed in current session', () => {
    const dismissedSession = new Set(['notif_high']);
    const eligible = filterEligibleNotifications(sampleNotifications, {
      pathname: '/',
      customerUser: null,
      dismissedSession,
      dismissedWeek: new Map(),
    });

    assert.equal(eligible.length, 2);
    assert.equal(eligible[0]._id, 'notif_guest_only', 'Highest remaining is guest welcome offer (50)');
  });

  it('Filters out guest-only popup when user is authenticated', () => {
    const eligible = filterEligibleNotifications(sampleNotifications, {
      pathname: '/',
      customerUser: { id: 'user_1', name: 'John Doe' },
      dismissedSession: new Set(),
      dismissedWeek: new Map(),
    });

    const hasGuestOffer = eligible.some((n) => n._id === 'notif_guest_only');
    assert.equal(hasGuestOffer, false, 'Authenticated athlete must not receive guest offer');
  });

  it('Enforces 7-day cooldown on once_per_week frequency cap', () => {
    const now = Date.now();
    const SIX_DAYS_AGO = now - 6 * 24 * 60 * 60 * 1000;
    const EIGHT_DAYS_AGO = now - 8 * 24 * 60 * 60 * 1000;

    // Test 6 days ago -> still capped
    const eligibleWithinWeek = filterEligibleNotifications(sampleNotifications, {
      pathname: '/',
      customerUser: null,
      dismissedSession: new Set(),
      dismissedWeek: new Map([['notif_guest_only', SIX_DAYS_AGO]]),
      currentTime: now,
    });
    assert.equal(eligibleWithinWeek.some((n) => n._id === 'notif_guest_only'), false);

    // Test 8 days ago -> cooled down, eligible again
    const eligibleAfterWeek = filterEligibleNotifications(sampleNotifications, {
      pathname: '/',
      customerUser: null,
      dismissedSession: new Set(),
      dismissedWeek: new Map([['notif_guest_only', EIGHT_DAYS_AGO]]),
      currentTime: now,
    });
    assert.equal(eligibleAfterWeek.some((n) => n._id === 'notif_guest_only'), true);
  });
});

describe('Notification Component Storefront Code & A11y Contracts', () => {
  const componentSrc = fs.readFileSync(
    path.join(webDir, 'src', 'components', 'store', 'NotificationManager.tsx'),
    'utf-8',
  );

  it('Supports Decision A5: Centered Modal (modal) and Corner Toast (toast) formats', () => {
    assert.match(
      componentSrc,
      /displayFormat\s*===\s*'modal'/,
      'Must support modal display format',
    );
    assert.match(
      componentSrc,
      /FORMAT 2: Bottom-Right Corner Toast/,
      'Must support corner toast display format',
    );
  });

  it('Implements WAI-ARIA role="dialog", aria-modal="true", and focus management for Modal', () => {
    assert.match(componentSrc, /role="dialog"/, 'Modal must have role="dialog"');
    assert.match(componentSrc, /aria-modal="true"/, 'Modal must have aria-modal="true"');
    assert.match(componentSrc, /e\.key\s*===\s*'Escape'/, 'Must support Escape key dismissal');
    assert.match(componentSrc, /e\.key\s*===\s*'Tab'/, 'Must contain focus trap tab navigation');
  });

  it('Implements Photographic Media Plinth Scoping (.dark containment invariant)', () => {
    assert.match(
      componentSrc,
      /className="group dark relative aspect-\[16\/9\]/,
      'Image plinth must be scoped with .dark class to prevent light-theme token bleed',
    );
  });

  it('Enforces accessible minimum touch target of >= 44px on interactive controls including toast copy', () => {
    assert.match(
      componentSrc,
      /min-h-\[44px\]/,
      'Interactive controls must have minimum tap target size of 44px',
    );
    assert.match(
      componentSrc,
      /aria-label=\{`Copy code \$\{activeNotification\.couponCode\}`\}[\s\S]*?min-h-\[44px\]|min-h-\[44px\][\s\S]*?aria-label=\{`Copy code \$\{activeNotification\.couponCode\}`\}/,
      'Toast copy button must enforce min-h-[44px] for WCAG touch target compliance',
    );
  });

  it('Implements initial focus shift on open, focus restoration on close, and root AnimatePresence for exit animations', () => {
    assert.match(
      componentSrc,
      /previousActiveElement\s*=\s*document\.activeElement/,
      'Must record previous active element to restore focus on dismiss',
    );
    assert.match(
      componentSrc,
      /focusable\[0\]\.focus\(\)/,
      'Must focus first element upon opening modal dialog',
    );
    assert.match(
      componentSrc,
      /return\s*\(\s*<AnimatePresence>/,
      'NotificationManager must wrap conditional rendering in root AnimatePresence so exit animation executes',
    );
  });

  it('Fires telemetry beacons for impressions, clicks, and dismissals', () => {
    assert.match(
      componentSrc,
      /event:\s*'impression'/,
      'Must record impression telemetry',
    );
    assert.match(
      componentSrc,
      /event:\s*'click'/,
      'Must record click telemetry on CTA/copy',
    );
    assert.match(
      componentSrc,
      /event:\s*'(dismiss|dismissal)'/,
      'Must record dismiss/dismissal telemetry',
    );
  });

  it('Is mounted in root layout.tsx and exported from components/store/index.ts', () => {
    const layoutSrc = fs.readFileSync(path.join(webDir, 'src', 'app', 'layout.tsx'), 'utf-8');
    assert.match(layoutSrc, /<NotificationManager\s*\/>/, 'layout.tsx must render NotificationManager');

    const indexSrc = fs.readFileSync(
      path.join(webDir, 'src', 'components', 'store', 'index.ts'),
      'utf-8',
    );
    assert.match(
      indexSrc,
      /export \* from '\.\/NotificationManager';/,
      'index.ts must export NotificationManager',
    );
  });
});
