# Handoff Report: Payment Dependencies & Stripe-to-Razorpay Migration Analysis

**Agent**: `m1_explorer_3` (teamwork_preview_explorer)  
**Milestone**: Milestone 1: Foundation, Dependencies & Type System  
**Working Directory**: `c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\m1_explorer_3`  
**Target Recipient**: Project Orchestrator (`2c34d5ea-c6d7-4741-b739-ae9001345df0`)  
**Associated Analysis**: `c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\m1_explorer_3\analysis.md`

---

## 1. Observation

Direct observations from inspecting the codebase:

1. **Obsolete Stripe Dependencies in Manifests**:
   - `apps/api/package.json`: Line 25 states `"stripe": "^18.7.0"`.
   - `apps/web/package.json`: Line 22 states `"@stripe/stripe-js": "^5.8.0"` and Line 23 states `"@stripe/react-stripe-js": "^3.7.0"`.
   - Neither manifest declares `"@vertex/types": "*"` in `"dependencies"`.

2. **Backend Stripe Usage in Source Files**:
   - `apps/api/src/server.ts`:
     - Line 27: `// Stripe webhook needs raw body — must be before express.json()`
     - Line 28: `app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));`
   - `apps/api/src/routes/orders.routes.ts`:
     - Line 2: `import Stripe from 'stripe';`
     - Line 10: `const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2025-05-28.basil' });`
     - Line 13: `router.post('/create-payment-intent', requireAuth, ...)`
     - Line 36: `const paymentIntent = await stripe.paymentIntents.create({`
     - Line 60: `const { items, shippingAddress, paymentIntentId, subtotal, shipping, tax, total } = req.body;`
     - Line 66: `paymentIntentId,`
   - `apps/api/src/routes/webhooks.routes.ts`:
     - Line 2: `import Stripe from 'stripe';`
     - Line 6: `const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2025-05-28.basil' });`
     - Line 8: `// POST /api/webhooks/stripe — raw body (set in server.ts)`
     - Line 9: `router.post('/stripe', async (req: Request, res: Response) => {`
     - Line 10: `const sig = req.headers['stripe-signature'];`
     - Line 20: `event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);`
     - Lines 28-44: Handles `payment_intent.succeeded` and `payment_intent.payment_failed` updating `Order.findOneAndUpdate({ paymentIntentId: pi.id }, ...)`.
   - `apps/api/src/models/Order.model.ts`:
     - Line 34: `paymentIntentId?: string;`
     - Line 75: `paymentIntentId: String,`
     - Line 84: `orderSchema.index({ paymentIntentId: 1 }, { sparse: true });`

3. **Frontend Zero-Import Finding**:
   - `grep_search` across `apps/web/src` returned **zero** imports of `@stripe/stripe-js` or `@stripe/react-stripe-js`.
   - Only `apps/web/src/types/index.ts` contains `paymentIntentId?: string;` on Line 44.
   - The web source code contains no Stripe components, hooks, or API calls.

4. **Razorpay Node SDK Ecosystem**:
   - The official package `razorpay` (latest `^2.9.8`) provides bundled first-party TypeScript type declarations in its npm distribution.
   - Separate DefinitelyTyped `@types/razorpay` is unmaintained/unnecessary and causes duplicate declaration errors when installed alongside modern `razorpay`.
   - Razorpay provides no official npm package for browser modal checkout; the official integration injects `https://checkout.razorpay.com/v1/checkout.js` and creates `new window.Razorpay(options)`.

5. **Type System and Compilation Boundaries**:
   - `packages/types/package.json` specifies `"main": "./src/index.ts"` without `"build": "tsc"`, `"exports"`, or a `dist/` directory.
   - `packages/types/tsconfig.json` does not exist.
   - `apps/api/tsconfig.json` specifies `"moduleResolution": "node"`, `"module": "CommonJS"`, and `"rootDir": "src"`. Compiling `apps/api` with an uncompiled `.ts` package outside `rootDir` triggers `TS6059: File is not under 'rootDir' 'src'`.

---

## 2. Logic Chain

1. **Premise 1 (From Observation 1 & 3)**:
   The user specification requires Razorpay and bans Stripe. While `apps/api` actively imports `stripe`, `apps/web` contains zero imports of `@stripe/stripe-js` or `@stripe/react-stripe-js`.
   - *Inference*: Removing `@stripe/stripe-js` and `@stripe/react-stripe-js` from `apps/web/package.json` is a safe, immediate, non-breaking operation.

2. **Premise 2 (From Observation 1 & 2)**:
   Removing `stripe` from `apps/api/package.json` without modifying `apps/api/src/routes/orders.routes.ts` and `apps/api/src/routes/webhooks.routes.ts` will immediately break TypeScript compilation (`TS2307: Cannot find module 'stripe'`).
   - *Inference*: Milestone 1 cannot merely delete `"stripe"` from `apps/api/package.json`. The Worker must simultaneously introduce `razorpay` to `apps/api/package.json`, create `apps/api/src/config/razorpay.ts`, and adapt `orders.routes.ts`, `webhooks.routes.ts`, `server.ts`, and `Order.model.ts` to use Razorpay types and imports.

3. **Premise 3 (From Observation 4)**:
   The official `razorpay` Node.js SDK bundles complete TypeScript definitions. Browser checkout relies on `https://checkout.razorpay.com/v1/checkout.js`.
   - *Inference*: The project should install only `razorpay` (version `^2.9.8`) in `apps/api`, omit `@types/razorpay`, and provide `RazorpayCheckoutOptions` + `Window.Razorpay` in `@vertex/types/src/razorpay.ts` and `apps/web/src/types/razorpay.d.ts`.

4. **Premise 4 (From Observation 5)**:
   Turborepo uses `dependsOn: ["^build"]`. If `packages/types` emits compiled declaration files to `dist/`, both `apps/web` (bundler mode) and `apps/api` (CommonJS node mode) can consume `@vertex/types` without TS6059 `rootDir` conflicts.
   - *Inference*: `packages/types` must have its own `tsconfig.json`, run `tsc` to produce `dist/index.d.ts` and `dist/index.js`, and be referenced as `"@vertex/types": "*"` in both apps.

---

## 3. Caveats

1. **Milestone Boundary Coordination**: Full implementation of order creation business logic, webhooks, and live checkout testing is scheduled for Milestone 2 (Backend API) and Milestone 5 (Checkout Drawer). For Milestone 1, the primary requirement is dependency correctness and clean, zero-error type compilation across all workspaces.
2. **Raw Body Middleware**: Razorpay webhooks require raw JSON bodies to verify HMAC-SHA256 signatures (`x-razorpay-signature`). If `apps/api/src/server.ts` parses JSON before the webhook route, signature verification will fail in M2. `app.use('/api/webhooks/razorpay', express.raw({ type: 'application/json' }))` must precede `express.json()`.
3. **Currency Units**: Stripe uses cents for USD; Razorpay typically uses paise for INR (or cents for international USD accounts). Milestone 2 must ensure the backend passes integer amounts (`Math.round(total * 100)`).

---

## 4. Conclusion

1. **Package Modifications**:
   - `apps/api/package.json`: Remove `"stripe": "^18.7.0"`, add `"razorpay": "^2.9.8"`, add `"@vertex/types": "*"`. Do NOT add `@types/razorpay`.
   - `apps/web/package.json`: Remove `"@stripe/stripe-js": "^5.8.0"` and `"@stripe/react-stripe-js": "^3.7.0"`, add `"@vertex/types": "*"`.
   - `packages/types/package.json`: Add `"build": "tsc"`, entry points `"main": "./dist/index.js"`, `"types": "./dist/index.d.ts"`, and package exports map.
2. **Source Code Modifications for Milestone 1 Compilation**:
   - `apps/api/src/config/razorpay.ts`: Initialize singleton Razorpay client.
   - `apps/api/src/models/Order.model.ts`: Add `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`, and `paymentStatus`.
   - `apps/api/src/routes/orders.routes.ts` & `webhooks.routes.ts`: Replace Stripe imports with Razorpay and Node `crypto`.
   - `apps/api/src/server.ts`: Update webhook raw body middleware route to `/api/webhooks/razorpay`.
   - `apps/web/src/types/razorpay.d.ts`: Declare `window.Razorpay`.
   - `apps/web/src/lib/razorpay.ts`: Create script loader for `checkout.js`.
   - `apps/web/src/types/index.ts`: Re-export from `@vertex/types`.

---

## 5. Verification Method

Once the Worker applies the changes:

1. **Dependency Installation Check**:
   ```powershell
   npm install
   ```
   *Expected Result*: Exits with code 0; workspace packages `@vertex/types` are symlinked into `apps/api/node_modules` and `apps/web/node_modules`.

2. **Types Package Build Check**:
   ```powershell
   npm --prefix packages/types run build
   ```
   *Expected Result*: Creates `packages/types/dist/index.d.ts` and `packages/types/dist/index.js`.

3. **Type-Check Across All Workspaces**:
   ```powershell
   npx turbo type-check
   ```
   *Expected Result*: All 3 packages (`@vertex/types`, `@vertex/api`, `@vertex/web`) compile with zero errors.

4. **Verify Zero Stripe References**:
   ```powershell
   git grep -i "stripe" -- apps/ packages/
   ```
   *Expected Result*: Zero matches in `apps/` and `packages/` source files and package manifests.
