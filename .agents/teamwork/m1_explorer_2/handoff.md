# Milestone 1 Handoff Report: Type System & packages/types Architecture

**Agent**: `m1_explorer_2` (teamwork_preview_explorer)  
**Recipient**: `orchestrator_1` / Milestone 1 Implementers  
**Date**: 2026-10-04  
**Working Directory**: `c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\m1_explorer_2`  
**Associated Analysis**: `c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\m1_explorer_2\analysis.md`

---

## 1. Observation

1. **`packages/types` File Layout**:
   - `packages/types` contains only `package.json` (14 lines) and `src/index.ts` (137 lines).
   - No `tsconfig.json` exists in `packages/types`.
   - No modular domain files (`product.ts`, `cart.ts`, `razorpay.ts`, `order.ts`) exist in `packages/types/src/`.
2. **`packages/types/package.json`**:
   - Line 5-6: `"main": "./src/index.ts"`, `"types": "./src/index.ts"`.
   - Line 7-9: `"scripts": { "type-check": "tsc --noEmit" }`.
   - Line 10-12: `"devDependencies": { "typescript": "^5.7.3" }`.
   - Missing `"build"` script.
   - Missing modern `"exports"` map.
3. **Compilation Command Test in `packages/types`**:
   - Running `tsc --noEmit` in `packages/types` via command `npx -p typescript tsc --noEmit` fails:
     ```
     tsc: The TypeScript Compiler - Version 7.0.2
     COMMON COMMANDS
       tsc
       Compiles the current project (tsconfig.json in the working directory.)
     ```
     Exited with code 1 because no `tsconfig.json` was located in `packages/types`.
4. **Missing Razorpay Types in `@vertex/types`**:
   - `packages/types/src/index.ts` line 79 has only `paymentIntentId?: string;` (legacy Stripe).
   - Contains zero Razorpay types (`RazorpayOrderPayload`, `RazorpayOrderResponse`, `RazorpayVerificationPayload`, `RazorpayWebhookEvent`, `PaymentStatus`).
5. **Monorepo Dependency Disconnect**:
   - `apps/api/package.json`: Lines 13-31 (`dependencies`) and lines 32-47 (`devDependencies`) contain no reference to `@vertex/types`.
   - `apps/web/package.json`: Lines 12-25 (`dependencies`) and lines 26-37 (`devDependencies`) contain no reference to `@vertex/types`.
   - `apps/web/src/types/index.ts` duplicates a divergent copy of `Product`, `Order`, `ProductVariant`.
   - `apps/web/src/store/cart.ts` (lines 4-17) defines a local `CartItem` interface lacking `maxStock` and `variant`.
6. **Seed Script & DB Model Contracts**:
   - `apps/api/src/scripts/seed.ts` (lines 46-236) seeds 8 products with `features`, `materials`, `category`, and variants with `sku`, `color`, `colorHex`, `size`, `price`, `stock`, `images`.
   - `apps/api/src/models/Product.model.ts` uses `IProductVariant` with `sku`, `color`, `colorHex`, `size`, `price`, `stock`, `images`.
   - `apps/api/src/models/Order.model.ts` uses `paymentIntentId`, with no `razorpayOrderId`, `razorpayPaymentId`, or `paymentStatus`.

---

## 2. Logic Chain

1. **Premise 1 (From Obs 1 & 3)**: Running `tsc` or `npm run type-check` in `packages/types` fails because `packages/types/tsconfig.json` does not exist.
2. **Premise 2 (From Obs 2)**: In Turborepo, `turbo.json` defines `"build": { "dependsOn": ["^build"], ... }`. When downstream workspaces build, `@vertex/types` is an upstream dependency. Without a `"build"` script (`"build": "tsc"`), Turborepo cannot build package artifacts, and downstream `apps/api` (which compiles CommonJS with Node module resolution) cannot resolve `.d.ts` declarations from `node_modules/@vertex/types`.
3. **Premise 3 (From Obs 5)**: Neither `apps/api` nor `apps/web` lists `"@vertex/types": "*"` in their `package.json` dependencies, leading to divergent type declarations (`apps/web/src/types/index.ts`, `apps/web/src/store/cart.ts`).
4. **Premise 4 (From Obs 4 & 6)**: The application currently lacks Razorpay domain contracts (`RazorpayOrderPayload`, `RazorpayOrderResponse`, `RazorpayVerificationPayload`, `RazorpayWebhookEvent`, `PaymentStatus`) in both `@vertex/types` and `apps/api`, which blocks Milestones M2 (Payment API) and M5 (Modal Checkout).
5. **Inference**: Establishing a compliant `tsconfig.json`, updating `packages/types/package.json` with `"build": "tsc"` and an exports map targeting `dist/`, linking `"@vertex/types": "*"` across `apps/api` and `apps/web`, and implementing the modular TypeScript definitions in `packages/types/src/` will resolve all type resolution and compilation issues across the monorepo.

---

## 3. Caveats

- **Active `node_modules` Absence**: `npm install` has not yet been executed in the root workspace. Direct `tsc` runs currently require `npx -p typescript tsc`. Once Milestone 1 Explorer 1 finishes package resolution and `npm install` is executed, local `node_modules/.bin/tsc` will be accessible.
- **Transpilation vs Pre-compilation**: Next.js 15 (`apps/web`) supports direct TypeScript importing via `transpilePackages`, but `apps/api` runs `tsc` targeting CommonJS `dist/server.js`. Emitting `.d.ts` and `.js` into `packages/types/dist/` is required for seamless compatibility with `apps/api`.
- **Address vs ShippingAddress**: `Address` was previously used in `apps/api` and `apps/web`. The new spec defines `ShippingAddress` with `line1` and an optional `street?: string` alias, plus `type Address = ShippingAddress;` to prevent breaking existing code.

---

## 4. Conclusion

1. **`packages/types` Architecture Blueprint**:
   - Provide `packages/types/tsconfig.json` extending `../../tsconfig.base.json` with `"composite": true`, `"declaration": true`, `"rootDir": "./src"`, and `"outDir": "./dist"`.
   - Provide `packages/types/package.json` with `"main": "./dist/index.js"`, `"types": "./dist/index.d.ts"`, `"exports"`, and `"scripts": { "build": "tsc", "type-check": "tsc --noEmit" }`.
2. **Modular Type Schemas Required**:
   - `packages/types/src/product.ts`: `Product`, `ProductVariant`, `ProductSpec`, `ProductImage`, `Category`, `InventorySpec`, `ProductCategory`.
   - `packages/types/src/cart.ts`: `CartItem` (with `maxStock`, `variant`), `CartState`, `ShippingDelta` ($150 threshold).
   - `packages/types/src/razorpay.ts`: `RazorpayOrderPayload`, `RazorpayOrderResponse`, `RazorpayVerificationPayload`, `RazorpayVerificationResponse`, `RazorpayWebhookEvent`, `RazorpayCheckoutOptions`, `RazorpayPaymentSuccessResponse`.
   - `packages/types/src/order.ts`: `Order`, `OrderItem`, `PaymentStatus`, `ShippingAddress`, `OrderStatus`.
   - `packages/types/src/common.ts`: `User`, `Review`, `ApiResponse`, `PaginatedResponse`.
   - `packages/types/src/index.ts`: Unified re-export barrel.
3. **Monorepo Linkage**:
   - Add `"@vertex/types": "*"` to `dependencies` of both `apps/api/package.json` and `apps/web/package.json`.

---

## 5. Verification Method

To independently verify the recommendations once implemented:

1. **Verify TypeScript Compilation in `packages/types`**:
   ```powershell
   cd c:\Users\atlas\OneDrive\ドキュメント\project-v1\packages\types
   npx -p typescript tsc --build
   ```
   *Expected Result*: Exits with code 0. Generates `dist/index.d.ts`, `dist/index.js`, and submodule declaration maps without errors.

2. **Verify Type Checking in `packages/types`**:
   ```powershell
   cd c:\Users\atlas\OneDrive\ドキュメント\project-v1\packages\types
   npx -p typescript tsc --noEmit
   ```
   *Expected Result*: Exits with code 0 and zero type diagnostics.

3. **Verify Turborepo Type Check**:
   ```powershell
   cd c:\Users\atlas\OneDrive\ドキュメント\project-v1
   npx turbo run type-check
   ```
   *Expected Result*: `@vertex/types#type-check` succeeds.

4. **Invalidation Conditions**:
   - Missing `dist/index.d.ts` after build.
   - Any compiler error resolving `@vertex/types` in `apps/api` or `apps/web`.
   - Unresolved types for Razorpay webhook payloads or cart items.
