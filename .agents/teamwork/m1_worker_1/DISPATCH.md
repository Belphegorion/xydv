## 2026-10-04T09:14:15Z
You are m1_worker_1, a teamwork_preview_worker subagent for Milestone 1: Foundation, Dependencies & Type System.

Your working directory is:
c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\m1_worker_1

The project root is:
c:\Users\atlas\OneDrive\ドキュメント\project-v1

The user's original request is recorded verbatim at:
c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\ORIGINAL_REQUEST.md

The master project specification is at:
c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\orchestrator_1\PROJECT.md

Explorer handoffs and analyses:
- m1_explorer_1: c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\m1_explorer_1\handoff.md
- m1_explorer_2: c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\m1_explorer_2\handoff.md
- m1_explorer_3: c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\m1_explorer_3\handoff.md

You MUST read ORIGINAL_REQUEST.md, PROJECT.md, and the three Explorer handoffs before implementing.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope & File Ownership:
You own and have exclusive write permission to:
- Root: `package.json`, `turbo.json`
- `packages/types/`: `package.json`, `tsconfig.json`, `src/*`
- `apps/api/`: `package.json`, `src/config/razorpay.ts`, `src/models/Order.model.ts`, `src/routes/orders.routes.ts`, `src/routes/webhooks.routes.ts`, `src/server.ts`, `src/types/razorpay.d.ts`
- `apps/web/`: `package.json`, `next.config.ts`, `src/types/razorpay.d.ts`

Concrete Implementation Tasks:
1. Monorepo & Dependencies:
   - In `apps/api/package.json`: Remove `"stripe": "^18.7.0"`, add `"razorpay": "^2.9.8"`, add `"@vertex/types": "*"`, and fix lint script to `"eslint src"`.
   - In `apps/web/package.json`: Remove `"@stripe/stripe-js"` and `"@stripe/react-stripe-js"`, add `"@vertex/types": "*"`.
   - In `turbo.json`: Change `"ui": "tui"` to `"ui": "stream"`.
   - In `apps/web/next.config.ts`: Ensure `transpilePackages: ['@vertex/types']` is configured.
2. `packages/types`:
   - Create `packages/types/tsconfig.json` extending `../../tsconfig.base.json` with `"composite": true`, `"declaration": true`, `"outDir": "./dist"`, `"rootDir": "./src"`.
   - Update `packages/types/package.json`: `"main": "./dist/index.js"`, `"types": "./dist/index.d.ts"`, `"exports"`, and scripts (`"build": "tsc"`, `"type-check": "tsc --noEmit"`).
   - Implement modular types in `packages/types/src/`:
     - `product.ts` (Product, ProductVariant with sku, colorHex, size, images, ProductSpec, Category, InventorySpec)
     - `cart.ts` (CartItem with maxStock, variant, CartState, ShippingDelta with $150 threshold)
     - `razorpay.ts` (RazorpayOrderPayload, RazorpayOrderResponse, RazorpayVerificationPayload, RazorpayWebhookEvent, RazorpayCheckoutOptions)
     - `order.ts` (Order, OrderItem, PaymentStatus, ShippingAddress, OrderStatus)
     - `common.ts` (User, Review, ApiResponse, PaginatedResponse)
     - `index.ts` (clean re-export barrel)
3. Backend Adaptation for Razorpay:
   - Update `apps/api/src/models/Order.model.ts` to include `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`, and `paymentStatus` ('pending' | 'captured' | 'failed' | 'refunded').
   - Create `apps/api/src/config/razorpay.ts` instantiating Razorpay SDK with fallback environment variables.
   - Author `apps/api/src/types/razorpay.d.ts` with necessary typings.
   - Update `apps/api/src/routes/orders.routes.ts` and `apps/api/src/routes/webhooks.routes.ts` to replace Stripe with Razorpay order creation and HMAC-SHA256 signature verification.
   - In `apps/api/src/server.ts`: Ensure raw body buffer is preserved for `/api/webhooks/razorpay` HMAC verification.
4. Build & Verification:
   - Run `npm install` from root.
   - Build `@vertex/types` (`cd packages/types && npm run build` or `npx tsc`).
   - Run type-check across monorepo (`npm run type-check`).
   - Ensure all build and type-check steps pass cleanly.
5. Report:
   - Write comprehensive handoff report to `c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\m1_worker_1\handoff.md` detailing all changes, commands run, and build/test outputs.
   - Send completion message to orchestrator.
