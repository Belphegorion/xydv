# Handoff Report — Commerce Flow, Cart State & Razorpay API Architecture

> **Agent**: `survey_explorer_3`  
> **Working Directory**: `c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\survey_explorer_3`  
> **Report Target**: `c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\survey_explorer_3\commerce_api_report.md`  
> **Date**: 2026-10-04  

---

## 1. Observation

1. **Existing Payment Implementation Uses Stripe**:
   - `apps/api/package.json` line 25: `"stripe": "^18.7.0"`
   - `apps/api/src/routes/orders.routes.ts` line 2: `import Stripe from 'stripe';` and line 10: `const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', ...);`
   - `apps/api/src/routes/orders.routes.ts` lines 12–55: defines `POST /create-payment-intent` creating a Stripe PaymentIntent.
   - `apps/api/src/routes/webhooks.routes.ts` lines 8–47: handles Stripe webhook `POST /stripe` checking `stripe-signature`.
   - `apps/api/src/server.ts` line 28: `app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));`
   - `apps/web/package.json` lines 22–23: `"@stripe/stripe-js": "^5.8.0"`, `"@stripe/react-stripe-js": "^3.7.0"`
   - `apps/web/.env.local.example` line 10: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_`
   - In contrast, `ORIGINAL_REQUEST.md` (lines 20–23, 40–43) explicitly mandates:
     > "R3. Commerce Flow & Razorpay Checkout Integration: Slide-out quick cart drawer with optimistic quantity updates, free-shipping delta progress indicators, and variant swatch live swaps. Native Razorpay SDK integration for modal checkout with webhook reconciliation and error resilience."
     > "Razorpay order creation and payment modal invoke cleanly with test credentials."

2. **Frontend Component Directory Missing**:
   - `apps/web/src/app/layout.tsx` line 7: `import { CartDrawer } from '@/components/store/CartDrawer';`
   - `apps/web/src/app/page.tsx` lines 1–8: imports `HeroSection`, `FeaturedCollection`, `CategoryGrid`, etc. from `@/components/store/...`
   - File listing of `apps/web/src` reveals only `app/`, `lib/`, `store/`, and `types/`. The directory `apps/web/src/components` does not exist.

3. **Cart Store Gaps**:
   - `apps/web/src/store/cart.ts` lines 19–32: `CartStore` contains `items: CartItem[]`, `isOpen: boolean`, `openCart`, `closeCart`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `itemCount()`, `subtotal()`.
   - Missing: free shipping threshold computation (delta to $150, percentage progress), variant live swapping (`swapVariant`), tax and shipping computeds, and stock limit clamping.

4. **Data Models Missing Razorpay Attributes**:
   - `packages/types/src/index.ts` lines 69–83 and `apps/api/src/models/Order.model.ts` lines 16–39: `Order` schema contains only `paymentIntentId?: string`.
   - Fields for `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`, and `paymentStatus` are absent.

5. **Test Setup Status**:
   - File search across the entire project for `*test*` and `*spec*` returned 0 results. No automated test files currently exist in the repository.

---

## 2. Logic Chain

1. **Step 1 (Payment Gateway Reconciliation)**:
   - Observation 1 shows that the repository currently implements Stripe PaymentIntents and webhooks.
   - Requirement R3 in `ORIGINAL_REQUEST.md` specifies Native Razorpay SDK integration.
   - Therefore, the commerce flow must be migrated from Stripe to Razorpay: replacing `stripe` with `razorpay` in `apps/api`, replacing `create-payment-intent` with `POST /api/orders/razorpay/create-order` and `POST /api/orders/razorpay/verify-payment`, implementing HMAC-SHA256 signature verification, and updating webhooks to `POST /api/webhooks/razorpay` validating `x-razorpay-signature`.

2. **Step 2 (Cart State & Quick Drawer Engineering)**:
   - Observation 2 shows that `CartDrawer` is imported in `layout.tsx` but uncreated.
   - Observation 3 shows that `cart.ts` only handles basic quantities without the required business logic.
   - Therefore, `cart.ts` must be extended with:
     - Free-shipping threshold ($150.00 standard), delta calculator (`max(0, 150 - subtotal)`), and progress percentage (`min(100, (subtotal / 150) * 100)`).
     - Live swatch swapping (`swapVariant(id, newSku)`) allowing customers to change color and size directly within the drawer.
     - Tax (8% estimate) and shipping ($9.99 or $0 if subtotal >= 150) calculative properties.
     - `CartDrawer.tsx` must be authored with Framer Motion spring physics (`stiffness: 350`, `damping: 35`), focus trapping, ESC key listener, and 48x48px touch targets adhering to Emil / Animate standards and WCAG 2.1 AA.

3. **Step 3 (Schema & API Contract Alignment)**:
   - Observation 4 shows that `Order` in `packages/types` and `apps/api/src/models/Order.model.ts` lacks Razorpay identifiers.
   - Therefore, the Order model must be upgraded to store `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`, and `paymentStatus` ('unpaid' | 'paid' | 'failed' | 'refunded') to support idempotent order reconciliation and dual-channel verification (client sync verify + backend async webhook).

---

## 3. Caveats

1. **Razorpay Multi-Currency Support**:
   - Razorpay natively supports international currencies (USD, EUR, GBP) if international payments are enabled on the Razorpay merchant dashboard. Amounts in Razorpay are always in the smallest currency subunit (cents for USD, paise for INR). The report models currency in USD with cent conversions (`Math.round(total * 100)`).
2. **Guest vs. Authenticated Checkout**:
   - The existing `orders.routes.ts` enforced `requireAuth` on all orders. In real e-commerce, guest checkout is frequently required. The new API specification supports optional authentication where guest orders capture `customerEmail` and `shippingAddress` without requiring prior login.
3. **No Existing Test Harness**:
   - Because no tests exist in the monorepo, tests for the commerce and Razorpay flow will require setting up a test runner (e.g. Vitest / Jest for unit tests, Playwright for E2E).

---

## 4. Conclusion

The commerce subsystem requires four synchronized modifications:
1. **Cart Store & Drawer**: Upgrade `apps/web/src/store/cart.ts` with variant swapping, $150 free-shipping delta progress, and tax/shipping computeds; create `apps/web/src/components/store/CartDrawer.tsx` using Framer Motion spring physics and WCAG 2.1 AA focus trapping.
2. **Razorpay SDK Integration**: Install `razorpay` in `apps/api`; add Razorpay test keys; implement `POST /api/orders/razorpay/create-order` and `POST /api/orders/razorpay/verify-payment` with HMAC-SHA256 signature verification.
3. **Webhook Reconciliation**: Update `apps/api/src/server.ts` and `apps/api/src/routes/webhooks.routes.ts` to parse raw JSON and verify Razorpay webhook signatures via `x-razorpay-signature` for `payment.captured`, `order.paid`, and `payment.failed`.
4. **Data Models**: Add `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`, and `paymentStatus` to `packages/types/src/index.ts` and `apps/api/src/models/Order.model.ts`.

All specifications, code contracts, schemas, and test scenarios are comprehensively articulated in `c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\survey_explorer_3\commerce_api_report.md`.

---

## 5. Verification Method

To independently verify the observations and conclusions:

1. **Verify Existing Stripe Dependencies & Code**:
   ```powershell
   Select-String -Path "apps/api/package.json" -Pattern "stripe"
   Select-String -Path "apps/api/src/routes/orders.routes.ts" -Pattern "stripe"
   Select-String -Path "apps/web/package.json" -Pattern "stripe"
   ```
2. **Verify Missing Components Directory**:
   ```powershell
   Test-Path "apps/web/src/components"
   # Returns: False
   ```
3. **Verify Cart Store Content**:
   Inspect `apps/web/src/store/cart.ts` lines 19–84 to confirm absence of `swapVariant`, `freeShippingDelta`, and tax calculations.
4. **Invalidation Condition**:
   If the user intends to use Stripe rather than Razorpay, or if Razorpay order creation does not require webhook reconciliation, these findings would be partially invalidated. However, per `ORIGINAL_REQUEST.md` R3, Razorpay integration is explicitly mandated.
