/**
 * Batch 6 Verification Test Suite: Telemetry, Observability & Analytics Truth
 * Findings Verified:
 * - HIGH-05: Orphaned Backend Telemetry & Missing Storefront Route Tracking
 * - HIGH-07: Decoupled Storefront PDP Reviews & Non-Functional Feedback Pipeline
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
const apiDir = path.join(rootDir, 'apps', 'api');

describe('Batch 6: HIGH-05 - Route Telemetry & Analytics Pipeline', () => {
  const telemetryComponentPath = path.join(webDir, 'src', 'components', 'telemetry', 'RouteTelemetry.tsx');
  const analyticsRoutePath = path.join(webDir, 'src', 'app', 'api', 'analytics', 'track', 'route.ts');
  const layoutPath = path.join(webDir, 'src', 'app', 'layout.tsx');
  const apiRoutesPath = path.join(apiDir, 'src', 'routes', 'index.ts');

  it('RouteTelemetry.tsx exists and observes pathname navigation changes', () => {
    assert.ok(
      fs.existsSync(telemetryComponentPath),
      'apps/web/src/components/telemetry/RouteTelemetry.tsx must exist',
    );
    const telemetrySrc = fs.readFileSync(telemetryComponentPath, 'utf-8');
    assert.match(
      telemetrySrc,
      /usePathname/,
      'RouteTelemetry must use usePathname to observe route transitions',
    );
    assert.match(
      telemetrySrc,
      /\/api\/analytics\/track|\/api\/admin\/pageviews/,
      'RouteTelemetry must dispatch pageview events to telemetry endpoint',
    );
  });

  it('apps/web/src/app/api/analytics/track/route.ts exists and forwards telemetry to backend API', () => {
    assert.ok(
      fs.existsSync(analyticsRoutePath),
      'apps/web/src/app/api/analytics/track/route.ts must exist',
    );
    const routeSrc = fs.readFileSync(analyticsRoutePath, 'utf-8');
    assert.match(
      routeSrc,
      /export\s+async\s+function\s+POST/,
      'analytics tracking route must export POST handler',
    );
    assert.match(
      routeSrc,
      /API_BASE_URL/,
      'analytics tracking route must proxy to Express backend API_BASE_URL',
    );
  });

  it('layout.tsx mounts RouteTelemetry component inside application tree', () => {
    const layoutSrc = fs.readFileSync(layoutPath, 'utf-8');
    assert.match(
      layoutSrc,
      /RouteTelemetry/,
      'layout.tsx must import and mount RouteTelemetry',
    );
  });

  it('apps/api/src/routes/index.ts provides public analytics tracking route', () => {
    const apiRoutesSrc = fs.readFileSync(apiRoutesPath, 'utf-8');
    assert.match(
      apiRoutesSrc,
      /\/analytics\/track|\/admin\/pageviews/,
      'Express routes must expose analytics tracking endpoint',
    );
  });
});

describe('Batch 6: HIGH-07 - Storefront PDP Reviews Pipeline & Live Feedback', () => {
  const reviewsProxyPath = path.join(webDir, 'src', 'app', 'api', 'products', '[slug]', 'reviews', 'route.ts');
  const pdpPagePath = path.join(webDir, 'src', 'app', 'products', '[slug]', 'page.tsx');

  it('apps/web/src/app/api/products/[slug]/reviews/route.ts exists and supports GET and POST', () => {
    assert.ok(
      fs.existsSync(reviewsProxyPath),
      'apps/web/src/app/api/products/[slug]/reviews/route.ts must exist',
    );
    const reviewsProxySrc = fs.readFileSync(reviewsProxyPath, 'utf-8');
    assert.match(
      reviewsProxySrc,
      /export\s+async\s+function\s+GET/,
      'reviews route handler must export GET method',
    );
    assert.match(
      reviewsProxySrc,
      /export\s+async\s+function\s+POST/,
      'reviews route handler must export POST method',
    );
    assert.match(
      reviewsProxySrc,
      /API_BASE_URL/,
      'reviews route handler must proxy to Express backend API_BASE_URL',
    );
  });

  it('PDP page.tsx fetches dynamic product reviews from reviews endpoint', () => {
    const pdpSrc = fs.readFileSync(pdpPagePath, 'utf-8');
    assert.match(
      pdpSrc,
      /\/reviews/,
      'PDP page.tsx must query product reviews endpoint',
    );
    assert.match(
      pdpSrc,
      /setReviews|reviews/,
      'PDP page.tsx must manage reviews state',
    );
  });

  it('PDP page.tsx includes interactive review submission form with ratings', () => {
    const pdpSrc = fs.readFileSync(pdpPagePath, 'utf-8');
    assert.match(
      pdpSrc,
      /submitReview|handleSubmitReview|onSubmit/i,
      'PDP page.tsx must include review submission handler',
    );
    assert.match(
      pdpSrc,
      /rating|ratingValue|newRating/i,
      'PDP page.tsx must collect star ratings for reviews',
    );
    assert.match(
      pdpSrc,
      /comment|reviewComment|reviewText|reviewBody|content/i,
      'PDP page.tsx must collect user review comment',
    );
  });

  it('PDP page.tsx review star buttons enforce >= 44px touch target constraint', () => {
    const pdpSrc = fs.readFileSync(pdpPagePath, 'utf-8');
    assert.match(
      pdpSrc,
      /min-w-\[44px\]\s+min-h-\[44px\]/,
      'Review star rating buttons must satisfy >= 44px accessible touch targets',
    );
  });

  it('PDP page.tsx review form inputs provide accessible label associations (htmlFor / id)', () => {
    const pdpSrc = fs.readFileSync(pdpPagePath, 'utf-8');
    assert.match(
      pdpSrc,
      /htmlFor=["']review-author["']/,
      'Review author input must have matching htmlFor',
    );
    assert.match(
      pdpSrc,
      /htmlFor=["']review-title["']/,
      'Review title input must have matching htmlFor',
    );
    assert.match(
      pdpSrc,
      /htmlFor=["']review-body["']/,
      'Review body textarea must have matching htmlFor',
    );
  });
});
