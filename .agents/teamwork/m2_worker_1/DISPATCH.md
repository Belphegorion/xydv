## 2026-10-04T09:51:07Z
You are m2_worker_1, a teamwork_preview_worker subagent for Milestone 2: Backend API & Razorpay Payment Engine.

Your working directory is:
c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\m2_worker_1

The project root is:
c:\Users\atlas\OneDrive\ドキュメント\project-v1

The user's original request is recorded verbatim at:
c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\ORIGINAL_REQUEST.md

The master project specification is at:
c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\orchestrator_1\PROJECT.md

Explorer handoffs and resources:
- m2_explorer_1: c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\m2_explorer_1\handoff.md
- m2_explorer_2: c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\m2_explorer_2\handoff.md
  (turnkey seed script: c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\m2_explorer_2\proposed_seed.ts)
- m2_explorer_3: c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\m2_explorer_3\handoff.md

You MUST read ORIGINAL_REQUEST.md, PROJECT.md, and all three Explorer handoffs before implementing.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope & File Ownership:
You own and have exclusive write permission to:
- `apps/api/src/models/Product.model.ts`
- `apps/api/src/routes/products.routes.ts`
- `apps/api/src/scripts/seed.ts`
- `apps/api/src/routes/orders.routes.ts`
- `apps/api/src/routes/webhooks.routes.ts`
- `tests/harness/contracts.mjs`

Concrete Implementation Tasks:
1. Product Model & API:
   - In `apps/api/src/models/Product.model.ts`: align schema with `@vertex/types` Product definition (add root `price`, `originalPrice`, `specs`, `images`, `inStock`, `bestseller`, and variant `colorName`, `imageUrl`, `secondaryImageUrl`).
   - In `apps/api/src/routes/products.routes.ts`: implement 10 query filters (`category`, `search`, `featured`, `bestseller`, `inStock`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`), place `GET /categories` aggregation route BEFORE `/:slug`, support both slug and ObjectId lookups in `GET /:slug`.
2. High-Fidelity Catalog Seed:
   - Apply `proposed_seed.ts` from `m2_explorer_2` to `apps/api/src/scripts/seed.ts`, populating 10 technical athletic fashion items with all 4 swatches (#0A0A0A, #1F1F1F, #2A2F2B, #E8FF00), dual aspect-locked WebP images for 300ms hover crossfades, technical fabric specs (Cordura, Gore-Tex, YKK, DWR), and 5-cell Bento grid category mappings.
3. Razorpay Route Hardening (Per M1 & M2 Explorer 3 specifications):
   - In `apps/api/src/routes/orders.routes.ts`:
     - Replace string `===` signature comparison with length-guarded `crypto.timingSafeEqual`.
     - Add strict validation for `item.quantity`: reject non-integers, negative numbers, or zero (`Number.isInteger(q) && q > 0`).
     - In `/razorpay/verify-payment`: return 404 if order does not exist in database.
     - Check order status before decrementing stock to prevent duplicate decrements.
   - In `apps/api/src/routes/webhooks.routes.ts`:
     - Use length-guarded `crypto.timingSafeEqual` for webhook signature verification.
     - Add raw body buffer validation.
     - Implement webhook idempotency handling (check order status and event deduplication).
   - In `tests/harness/contracts.mjs`:
     - Add buffer length guard before `crypto.timingSafeEqual` to prevent `RangeError`.
4. Verification & Build:
   - Run `npm run --workspace=@vertex/api build` and `npm run --workspace=@vertex/api type-check`.
   - Run `npx turbo run build --filter=@vertex/types --filter=@vertex/api`.
   - Run E2E test runner: `node tests/runner.mjs`.
   - Ensure all builds, type checks, and tests pass with 0 errors and exit code 0.
5. Report:
   - Write comprehensive handoff report to `c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\m2_worker_1\handoff.md`.
   - Send completion message to orchestrator.
