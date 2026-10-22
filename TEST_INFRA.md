# XYDV E2E & Hermetic Testing Infrastructure & Methodology

## Overview

This document specifies the automated End-to-End (E2E), Design System, and Adversarial testing infrastructure for the **XYDV Luxury Technical Performance** e-commerce platform. The test harness implements a comprehensive **159-Test Hermetic Verification Engine** combining a **4-Tier Requirement-Driven Opaque-Box Methodology** with empirical design token, visual contract, and boundary arithmetic stress suites.

---

## Architecture & Runner Specification

### 1. Test Harness Engine

- **Engine**: Native Node.js Test Runner (`node:test`, `node:assert/strict`).
- **Dependency Footprint**: Zero external npm test runner dependencies required at runtime (no Jest, Vitest, or Playwright setup lag), eliminating version drift, supply chain risk, or CI bootstrap failures.
- **Speed & Isolation**: The entire 159-test suite executes in **<400ms** total runtime with complete test isolation.
- **Deterministic Offline Evaluation**: Cryptographic signatures (HMAC-SHA256 with `crypto.timingSafeEqual`), floating-point currency conversions, WCAG relative luminance calculations, and layout aspect ratios are validated hermetically with zero database or network dependencies.

### 2. Directory Layout

```
tests/
├── runner.mjs                                     # Master 4-tier E2E automated test runner (exit code 0 on pass)
├── harness/
│   ├── contracts.mjs                              # Authoritative tokens, formulas, HMAC crypto, aspect ratios
│   ├── client-runtime.mjs                         # Simulated DOM events, Zustand cart/wishlist store, localStorage, FocusTrap
│   ├── server-runtime.mjs                         # Authoritative order engine, price check, stock mutations, webhooks
│   └── seed-data.mjs                              # Catalog fixtures, variant schemas, swatches, bento ratios
├── e2e/
│   ├── tier1-feature-coverage.test.mjs            # Tier 1: Feature coverage (45 tests)
│   ├── tier2-boundary-corner-cases.test.mjs       # Tier 2: Boundary & corner cases (35 tests)
│   ├── tier3-cross-feature-combinations.test.mjs # Tier 3: Pairwise cross-feature interactions (14 tests)
│   └── tier4-application-scenarios.test.mjs       # Tier 4: Real-world user journeys (5 tests)
├── m3-empirical-design-system-challenge.test.mjs  # M3 Design system & token challenge (23 tests)
├── collection-showcase.test.mjs                   # Collection showcase architecture & motion (12 tests)
├── loading-screens.test.mjs                       # Dual-theme brand assets & loading screens (9 tests)
├── boundary-stress.test.mjs                       # Free shipping threshold & arithmetic stress (16 tests)
├── TEST_INFRA.md                                  # This specification document
└── TEST_READY.md                                  # Test readiness verification record
```

---

## 159-Test Complete Verification Breakdown

### Part 1: 4-Tier Opaque-Box E2E Suite (`tests/runner.mjs`) — 99 Tests

| Tier                                   | Focus                                                                                 | Test Count      | Key Coverage Areas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tier 1: Feature Coverage**           | Core functionality across all primary storefront requirements (>=5 tests per feature) | **45 Tests**    | 1. Obsidian (`#0A0A0A`) & Volt (`#E8FF00`) Tokens<br>2. Aspect-Locked Media & 5-Cell Bento Proportions<br>3. Micro-Interactions & Tap Feedback (`active:scale-[0.97]`)<br>4. Motion Timing Guardrails (<300ms) & Reduced-Motion<br>5. Quick Cart Drawer & LocalStorage (`vertex-cart`)<br>6. Free Shipping Delta Engine ($150 threshold)<br>7. Variant Swatch Live Swaps & Image Updates<br>8. Razorpay Order Creation & Webhook Lifecycle<br>9. WCAG 2.1 AA Landmarks, Headings & Focus Trapping                                         |
| **Tier 2: Boundary & Corner Cases**    | Edge cases, limit values, zero values, stock limits, and threshold boundaries         | **35 Tests**    | 1. Viewport extremes (320px mobile to 3840px 4K)<br>2. Motion timing boundaries (0ms to 300ms ceiling, NaN sanitization)<br>3. Cart quantity limits (0, negative, fractional, stock ceiling clamping)<br>4. Free shipping delta dollar boundaries ($0, $149.99, $150.00, $150.01, $10,000)<br>5. Variant stock limits (0 stock rejection, single unit, rapid swatch clicks)<br>6. Razorpay edge cases (paise rounding, empty cart 400, forged signatures)<br>7. WCAG boundaries (single element focus trap, 48px touch targets, contrast) |
| **Tier 3: Cross-Feature Combinations** | Pairwise interactions between distinct storefront subsystems                          | **14 Tests**    | 1. Cart mutations + Variant swatches (in-cart swatch swap, line item merge)<br>2. Cart mutations + Free shipping delta ($150 unlock & re-lock)<br>3. Variant swatches + Product card secondary image crossfade<br>4. Cart state + Razorpay order creation (authoritative price verification)<br>5. Cart drawer focus trap + Cart state mutations<br>6. Prefers-reduced-motion + Spring physics cart opening<br>7. Razorpay order creation + Payment HMAC verification + Webhooks                                                          |
| **Tier 4: Real-World Scenarios**       | Complete end-to-end user journeys simulating real shopping behavior                   | **5 Scenarios** | 1. Complete Happy Path (Browse -> Swatch -> Add -> $150 Delta -> Razorpay Modal -> Webhook -> Confirmation)<br>2. Out-of-Stock Swatch Selection & In-Drawer Live Correction<br>3. Payment Abandonment via Modal Dismiss & LocalStorage Recovery<br>4. Client Price Tampering Neutralization via Server Catalog Authority<br>5. Concurrent Webhook Network Retry & Idempotency Guarantee                                                                                                                                                   |
| **Subtotal (Part 1)**                  | **Core E2E Harness**                                                                  | **99 Tests**    | **100% Passing (Exit Code 0)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

---

### Part 2: Design System, Brand Asset & Adversarial Suites — 60 Tests

| Suite                          | File                                                  | Test Count    | Key Coverage Areas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------ | ----------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **M3 Design System Challenge** | `tests/m3-empirical-design-system-challenge.test.mjs` | **23 Tests**  | **Suite 1: Design Tokens & Anti-Slop Palette (4 tests)**: Obsidian void (`#0A0A0A`) & Volt (`#E8FF00`) tokens, WCAG AAA Volt contrast (>= 7:1), Emil Kowalski easing tokens, ban on AI purple gradients.<br>**Suite 2: Emil Kowalski Motion Physics (4 tests)**: Prohibition of unconstrained `transition: all`, ban on `scale(0)`, `active:scale-[0.97]` on Button primitive, type-safe `EMIL_EASE` constant.<br>**Suite 3: Primitives Contracts (4 tests)**: Button props (`variant`, `size`, `isLoading`), Badge brutalist chip, MetricTicker spring & reduced motion, primitives index export.<br>**Suite 4: Textile Science Inspector (4 tests)**: 4 proprietary textile categories, accessible ARIA tablist/tabs, MetricTicker integration, accredited lab benchmark standards.<br>**Suite 5: Storefront Visual & Commerce Contracts (4 tests)**: HeroSection `min-h-[100dvh]`, CategoryGrid 5-cell diverse proportions, Product card 3:4 ratio with image crossfade, CartDrawer spring physics & Razorpay integration.<br>**Suite 6: Accessibility Compliance (3 tests)**: High-contrast `:focus-visible` ring, global `prefers-reduced-motion` override, minimum touch target (>= 48px). |
| **Collection Showcase Suite**  | `tests/collection-showcase.test.mjs`                  | **12 Tests**  | 1. Semantic `<picture>`, responsive `<source>`, fallback `<img>`<br>2. Calibrated directional scrims leaving midtones unoccluded<br>3. Authentic ASRV disciplines (`RUN`, `TRAIN` with `ASRV-WOMENS-133.jpg`, `REC`)<br>4. Dual Men and Women navigation actions without invalid nested buttons<br>5. Accessible tactile pills with `active:scale-[0.97]`<br>6. Explicit high-contrast focus rings for dark card surfaces<br>7. Emil Kowalski motion physics: transitions <= 300ms, no `transition: all`, no `scale(0)`<br>8. Zero banned AI purple/indigo colors<br>9. Integration in `page.tsx`<br>10. Clean export in `components/store/index.ts`<br>11. Desktop hover reveal with mobile immediate accessibility<br>12. Delayed luxury effects on image zoom & staggered entrance cadence                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Loading Screens Suite**      | `tests/loading-screens.test.mjs`                      | **9 Tests**   | 1. All 4 static brand symbol assets exist and are valid PNG images<br>2. `LoadingSymbol` cleanly implements dual-theme static image switching<br>3. `InitialLoadingScreen` progress bar, telemetry ticker, smooth unmount<br>4. `InitialLoadingScreen` integrated in App Router `layout.tsx`<br>5. Route loading screen (`loading.tsx`) implements Suspense contract<br>6. Compliance with motion physics and prohibition of anti-patterns<br>7. Dimensional and canvas alignment parity across outline and solid symbols<br>8. WCAG 2.1 AA screen reader protection & progressbar semantic contracts<br>9. GPU composited transform performance (no layout-thrashing animations)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Boundary Stress Suite**      | `tests/boundary-stress.test.mjs`                      | **16 Tests**  | 1. Boundary threshold equality (`FREE_SHIPPING_THRESHOLD` == $150)<br>2. Zero State: empty items list ($0 subtotal, $0 shipping, $150 delta)<br>3. Zero-price item does not unlock free shipping<br>4. The 1-Penny Cliff: $149.99 locked (delta $0.01)<br>5. Sub-penny rounding boundary ($149.999)<br>6. $150.00 exact unlock with 0 delta and $0 shipping<br>7. $150.01 maintain unlock<br>8. Floating-point multi-item decimal accumulation avoidance<br>9. Three items summing exactly to $150.00 (50 * 3)<br>10. Negative item quantity safely clamped/rejected<br>11. 1 -> 0 decrement cleanly removes line item<br>12. Request for 1,000,000 items clamped to stock ceiling<br>13. Incremental overflow beyond maxStock clamped<br>14. Extreme cart value ($1,000,000.00) safe integer preservation<br>15. Deterministic unique itemId (`productId::variantId`)<br>16. Swapping to existing variant merges quantities under stock ceiling                                                                                                                                                                                                                                                 |
| **Subtotal (Part 2)**          | **Design & Adversarial Suites**                       | **60 Tests**  | **100% Passing (Exit Code 0)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **TOTAL**                      | **Grand Complete Verification Suite**                 | **159 Tests** | **100% Passing (Exit Code 0)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

---

## Quality Thresholds & Gates

1. **Zero Failure Policy**: 100% pass rate required (159/159 tests must pass). Any single failure triggers exit code 1.
2. **Sub-400ms Latency**: The complete 159-test suite executes in ~0.35s across modern Node.js runtimes.
3. **Cryptographic Rigor**: All Razorpay payment and webhook signatures must use HMAC-SHA256 with constant-time equality checks (`crypto.timingSafeEqual`).
4. **Authoritative Price Validation**: Server checkout calculation must never trust client-provided item prices.
5. **Accessibility Rigor**: Contrast ratios must meet WCAG 2.1 AA (>=4.5:1 text, >=3:1 UI) and AAA where specified (Volt yellow on obsidian void: 17.66:1). Interactive controls must enforce a 48x48px minimum touch target. Focus rings must outline with `#E8FF00` or `#FFFFFF`.

---

## Execution Commands

### Complete 159-Test Suite (Root Script)

```bash
npm test
```

### Direct Invocation via Node.js

```bash
node tests/runner.mjs && node --test tests/m3-empirical-design-system-challenge.test.mjs tests/collection-showcase.test.mjs tests/loading-screens.test.mjs tests/boundary-stress.test.mjs
```

_(Windows PowerShell 5.1 users: Use `npm test` which invokes via `cmd.exe`, or chain with `; if ($?) { ... }`)_

### Running Individual Suites

```bash
# 1. Master 4-tier E2E harness (99 tests)
node tests/runner.mjs

# 2. M3 Empirical Design System suite (23 tests)
node --test tests/m3-empirical-design-system-challenge.test.mjs

# 3. Collection Showcase suite (12 tests)
node --test tests/collection-showcase.test.mjs

# 4. Loading Screens brand assets suite (9 tests)
node --test tests/loading-screens.test.mjs

# 5. Boundary Stress arithmetic suite (16 tests)
node --test tests/boundary-stress.test.mjs
```
