# Milestone 1: Payment Dependencies & Stripe-to-Razorpay Migration Analysis

**Agent**: `m1_explorer_3` (teamwork_preview_explorer)  
**Date**: 2026-10-04  
**Milestone**: Milestone 1: Foundation, Dependencies & Type System  
**Working Directory**: `c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\m1_explorer_3`  
**Project Root**: `c:\Users\atlas\OneDrive\ドキュメント\project-v1`  
**Reference Specs**: `ORIGINAL_REQUEST.md`, `orchestrator_1/PROJECT.md`, `m1_explorer_2/analysis.md`

---

## 1. Executive Summary

This investigation provides a comprehensive audit of payment dependencies across `apps/api`, `apps/web`, and `packages/types`, evaluates the structural impact of transitioning from Stripe to Razorpay, and defines the exact migration roadmap for Milestone 1.

### Key Discoveries:
1. **Obsolete Stripe Dependencies**:
   - `apps/api/package.json`: Contains `"stripe": "^18.7.0"`.
   - `apps/web/package.json`: Contains `"@stripe/stripe-js": "^5.8.0"` and `"@stripe/react-stripe-js": "^3.7.0"`.
   - **Crucial Frontend Finding**: There are **zero** active imports of `@stripe/stripe-js` or `@stripe/react-stripe-js` anywhere inside `apps/web/src`. Removing these packages from `apps/web/package.json` is completely non-breaking for existing web code.
2. **Razorpay Node SDK & Type Ecosystem**:
   - The official Node.js SDK is `razorpay` (recommended version: `^2.9.8`).
   - `razorpay` includes **bundled, first-party TypeScript type declarations** (`dist/razorpay.d.ts`).
   - The separate DefinitelyTyped package `@types/razorpay` is **unnecessary and should NOT be installed** (it is outdated and can create identifier conflicts with bundled types).
   - For client-side checkout (`checkout.js`), Razorpay provides no official npm package; browser types (`Window.Razorpay`, `RazorpayCheckoutOptions`) must be declared in shared types (`@vertex/types/src/razorpay.ts`) and global definitions (`apps/web/src/types/razorpay.d.ts`).
3. **Backend Compilation Blocker in Milestone 1**:
   - If `stripe` is removed from `apps/api/package.json` without updating the imports in `apps/api/src/routes/orders.routes.ts` and `apps/api/src/routes/webhooks.routes.ts`, `tsc` and `turbo type-check` will fail with `TS2307: Cannot find module 'stripe'`.
   - Therefore, Milestone 1 must introduce the Razorpay SDK configuration (`config/razorpay.ts`), update `Order.model.ts`, and adapt the route signatures in `orders.routes.ts` and `webhooks.routes.ts` so `apps/api` compiles cleanly.
4. **Shared Type System Boundaries**:
   - Neither `apps/api/package.json` nor `apps/web/package.json` currently references `"@vertex/types": "*"`.
   - Both applications duplicate data structures locally. Milestone 1 must wire `"@vertex/types": "*"` into both packages and synchronize all payment and order contracts.

---

## 2. Complete Inventory of Obsolete Stripe References

A full codebase search revealed 18 occurrences of Stripe references across 7 files:

| File Path | Line(s) | Verbatim Code / Context | Required Action in M1/M2 |
| :--- | :--- | :--- | :--- |
| `apps/api/package.json` | 25 | `"stripe": "^18.7.0"` | Remove from dependencies; replace with `"razorpay": "^2.9.8"` |
| `apps/web/package.json` | 22 | `"@stripe/stripe-js": "^5.8.0"` | Remove from dependencies |
| `apps/web/package.json` | 23 | `"@stripe/react-stripe-js": "^3.7.0"` | Remove from dependencies |
| `apps/api/src/server.ts` | 27-28 | `// Stripe webhook needs raw body — must be before express.json()`<br>`app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));` | Change to `/api/webhooks/razorpay` (or retain alias during transition) |
| `apps/api/src/routes/orders.routes.ts` | 2, 10, 36 | `import Stripe from 'stripe';`<br>`const stripe = new Stripe(...);`<br>`const paymentIntent = await stripe.paymentIntents.create(...)` | Remove Stripe; replace with Razorpay order creation and HMAC verification |
| `apps/api/src/routes/webhooks.routes.ts` | 2, 6, 8-47 | `import Stripe from 'stripe';`<br>`const stripe = new Stripe(...);`<br>`router.post('/stripe', ...)` | Replace with `POST /razorpay` using `x-razorpay-signature` and HMAC-SHA256 |
| `apps/api/src/models/Order.model.ts` | 34, 75, 84 | `paymentIntentId?: string;`<br>`paymentIntentId: String`<br>`orderSchema.index({ paymentIntentId: 1 }, { sparse: true });` | Add `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`, `paymentStatus` |
| `packages/types/src/index.ts` | 79 | `paymentIntentId?: string;` | Replace with Razorpay order fields and `PaymentStatus` |
| `apps/web/src/types/index.ts` | 44 | `paymentIntentId?: string;` | Replace with `@vertex/types` re-export |
| `README.md` | 78, 115, 118 | Documentation references to Stripe | Update documentation in later milestone |

---

## 3. Razorpay Package & Version Specifications

### 3.1 Backend: `razorpay` Node.js SDK
- **Package**: `razorpay`
- **Recommended Version**: `^2.9.8`
- **Target Location**: `apps/api/package.json` -> `"dependencies"`
- **Type Declaration Strategy**:
  - `razorpay` version >= 2.9.2 includes first-party TypeScript typings bundled directly in `node_modules/razorpay/dist/`.
  - **Do NOT install `@types/razorpay`**: Installing `@types/razorpay` is redundant and can cause declaration conflicts (duplicate identifier errors).
- **Initialization Pattern**:
  Create a single, centralized client at `apps/api/src/config/razorpay.ts`:
  ```typescript
  import Razorpay from 'razorpay';

  export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID ?? '',
    key_secret: process.env.RAZORPAY_KEY_SECRET ?? '',
  });
  ```

### 3.2 Frontend: Browser Checkout Script & Typings
- **Package Selection**:
  - Do NOT install any third-party React wrappers (e.g. `react-razorpay` or unofficial wrappers), as they introduce unnecessary dependencies, lack React 19 compatibility, and can fail under Next.js 15 App Router SSR.
  - Razorpay standard integration uses the official browser script:
    `https://checkout.razorpay.com/v1/checkout.js`
- **Script Loading Utility** (`apps/web/src/lib/razorpay.ts`):
  ```typescript
  export function loadRazorpayCheckoutScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if (window.Razorpay) return resolve(true);

      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) return resolve(true);

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error('Failed to load Razorpay checkout script');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }
  ```
- **Global TypeScript Window Declaration** (`apps/web/src/types/razorpay.d.ts`):
  ```typescript
  import type { RazorpayCheckoutOptions } from '@vertex/types';

  declare global {
    interface Window {
      Razorpay: new (options: RazorpayCheckoutOptions) => {
        open: () => void;
        close: () => void;
        on: (event: string, callback: (...args: unknown[]) => void) => void;
      };
    }
  }

  export {};
  ```

---

## 4. Deep Impact Analysis: Backend API (`apps/api`)

### 4.1 `apps/api/package.json`
Remove obsolete Stripe dependency and inject Razorpay + `@vertex/types`:
```json
{
  "dependencies": {
    "@vertex/types": "*",
    "razorpay": "^2.9.8",
    ...
  }
}
```
*(Removed: `"stripe": "^18.7.0"`)*

### 4.2 `apps/api/src/server.ts`
Stripe webhooks and Razorpay webhooks both require access to the raw payload body for cryptographic signature verification.
- **Before**:
  ```typescript
  // Stripe webhook needs raw body — must be before express.json()
  app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
  ```
- **After**:
  ```typescript
  // Razorpay webhook needs raw body for HMAC-SHA256 signature verification — must be before express.json()
  app.use('/api/webhooks/razorpay', express.raw({ type: 'application/json' }));
  ```

### 4.3 `apps/api/src/models/Order.model.ts`
The database model must store Razorpay identifiers and order statuses:
```typescript
import mongoose, { type Document, type Model } from 'mongoose';
import type { OrderStatus, PaymentStatus } from '@vertex/types';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new mongoose.Schema<IOrder>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        sku: { type: String, required: true },
        color: { type: String, required: true },
        size: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        image: { type: String, required: true },
      },
    ],
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, default: 0, min: 0 },
    tax: { type: Number, required: true, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'authorized', 'captured', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, default: 'US' },
      phone: { type: String, required: true },
    },
    razorpayOrderId: { type: String, sparse: true, index: true },
    razorpayPaymentId: { type: String, sparse: true, index: true },
    razorpaySignature: String,
    trackingNumber: String,
    notes: String,
  },
  { timestamps: true },
);

orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

export const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);
```

### 4.4 `apps/api/src/routes/orders.routes.ts`
The route handlers transition from Stripe PaymentIntents to native Razorpay order generation and verification:

1. **Order Creation (`POST /api/orders/razorpay/create-order`)**:
   - Performs server-side inventory and price lookup against MongoDB `Product` collection.
   - Computes:
     - `subtotal` from actual database prices
     - `shipping`: `$0` if `subtotal >= 150`, else `$9.99`
     - `tax`: `subtotal * 0.08`
     - `total = subtotal + shipping + tax`
   - Creates internal `Order` in DB with `status: 'pending'`, `paymentStatus: 'pending'`.
   - Calls `razorpay.orders.create({ amount: Math.round(total * 100), currency: 'INR', receipt: order._id.toString() })`.
   - Saves `order.razorpayOrderId = rzpOrder.id`.
   - Returns:
     ```json
     {
       "success": true,
       "data": {
         "orderId": "<MongoDB_ObjectId>",
         "razorpayOrderId": "<order_...>",
         "amount": 25000,
         "currency": "INR",
         "keyId": "<RAZORPAY_KEY_ID>"
       }
     }
     ```

2. **Payment Verification (`POST /api/orders/razorpay/verify-payment`)**:
   - Receives: `{ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }`.
   - Computes expected HMAC-SHA256 signature using Node's standard `crypto` module:
     ```typescript
     import crypto from 'crypto';

     const body = `${razorpayOrderId}|${razorpayPaymentId}`;
     const expectedSignature = crypto
       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET ?? '')
       .update(body)
       .digest('hex');

     if (expectedSignature !== razorpaySignature) {
       await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });
       return next(new AppError('Payment signature verification failed', 400));
     }
     ```
   - On success:
     - Updates order: `status = 'confirmed'`, `paymentStatus = 'captured'`, `razorpayPaymentId`, `razorpaySignature`.
     - Atomically decrements product stock via `$inc: { 'variants.$.stock': -quantity }`.
     - Returns `{ success: true, message: 'Payment verified successfully', data: order }`.

### 4.5 `apps/api/src/routes/webhooks.routes.ts`
Replaces the Stripe webhook constructor with Razorpay HMAC verification and event handling:
- **Header**: `req.headers['x-razorpay-signature']`
- **Secret**: `process.env.RAZORPAY_WEBHOOK_SECRET`
- **Verification**:
  ```typescript
  import crypto from 'crypto';
  import type { RazorpayWebhookEvent } from '@vertex/types';

  const signature = req.headers['x-razorpay-signature'] as string;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return res.status(400).json({ error: 'Missing webhook signature or secret' });
  }

  const rawBody = typeof req.body === 'string' ? req.body : (req.body as Buffer).toString('utf8');
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('Razorpay webhook signature mismatch');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(rawBody) as RazorpayWebhookEvent;
  ```
- **Events Handled**:
  - `payment.captured` / `order.paid`: Finds order by `razorpayOrderId`, ensures `status = 'confirmed'` and `paymentStatus = 'captured'`.
  - `payment.failed`: Finds order by `razorpayOrderId`, marks `status = 'cancelled'`, `paymentStatus = 'failed'`.

---

## 5. Deep Impact Analysis: Frontend Web (`apps/web`)

### 5.1 `apps/web/package.json`
- Remove:
  - `"@stripe/stripe-js": "^5.8.0"`
  - `"@stripe/react-stripe-js": "^3.7.0"`
- Add:
  - `"@vertex/types": "*"`

### 5.2 Verification of Non-Breaking Change in Frontend Source
An exhaustive search of `apps/web/src` confirmed:
- Zero imports of `@stripe/stripe-js`
- Zero imports of `@stripe/react-stripe-js`
- Zero Stripe components (`<Elements>`, `<CardElement>`, `<PaymentElement>`)
Removing these two packages from `apps/web/package.json` introduces zero regression to existing web source code.

### 5.3 Unified Shared Type Exports (`apps/web/src/types/index.ts`)
Rather than maintaining an out-of-sync duplicate file, `apps/web/src/types/index.ts` should re-export types from `@vertex/types`:
```typescript
/**
 * VERTEX Web Types
 * Re-exports shared contracts from @vertex/types
 */
export * from '@vertex/types';
```

### 5.4 Cart Store Alignment (`apps/web/src/store/cart.ts`)
The cart store currently defines `CartItem` locally. To support optimistic quantity clamping and in-drawer swatch swapping, `CartItem` should align with `@vertex/types`:
- Include `maxStock: number` (for bounds clamping)
- Include `secondaryImage?: string`
- Include `variant?: ProductVariant` (for in-drawer swatch swapping)

---

## 6. Shared Contracts in `packages/types`

In alignment with `m1_explorer_2`'s specification, `packages/types/src/razorpay.ts` defines all contracts consumed by frontend and backend:

```typescript
import type { ShippingAddress } from './order';

export interface RazorpayOrderItemInput {
  productId: string;
  variantId?: string;
  sku: string;
  quantity: number;
}

export interface RazorpayOrderPayload {
  items: RazorpayOrderItemInput[];
  shippingAddress: ShippingAddress;
}

export interface RazorpayOrderResponse {
  success: boolean;
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface RazorpayVerificationPayload {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface RazorpayVerificationResponse {
  success: boolean;
  message: string;
  orderId: string;
  paymentId: string;
  status: 'paid' | 'failed';
}

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayPaymentSuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
    backdrop_color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}
```

---

## 7. Compilation & Package Boundary Strategy (Avoiding TS6059)

### 7.1 The Monorepo Compilation Challenge
In `apps/api/tsconfig.json`:
- `"module": "CommonJS"`
- `"moduleResolution": "node"`
- `"rootDir": "src"`

If `apps/api/src` references `@vertex/types` and `@vertex/types` only exposes raw source code at `./src/index.ts`, `tsc` during `npm run build` will pull files outside `apps/api/src`, causing:
`error TS6059: File '.../packages/types/src/index.ts' is not under 'rootDir' 'src'.`

### 7.2 Solution: Pre-Compiled Declaration Files
To guarantee clean package boundaries:
1. `packages/types/package.json` must include a `"build": "tsc"` script and emit to `dist/`:
   ```json
   "main": "./dist/index.js",
   "types": "./dist/index.d.ts",
   "exports": {
     ".": {
       "types": "./dist/index.d.ts",
       "import": "./dist/index.js",
       "default": "./dist/index.js"
     }
   }
   ```
2. `packages/types/tsconfig.json` specifies:
   ```json
   {
     "extends": "../../tsconfig.base.json",
     "compilerOptions": {
       "outDir": "./dist",
       "rootDir": "./src",
       "declaration": true,
       "declarationMap": true,
       "composite": true,
       "module": "ESNext",
       "moduleResolution": "bundler",
       "target": "ES2022"
     },
     "include": ["src/**/*"]
   }
   ```
3. Because `turbo.json` configures `"build": { "dependsOn": ["^build"] }`, Turborepo automatically builds `@vertex/types` before `apps/api` or `apps/web`.
4. When `apps/api` compiles, it resolves types from `@vertex/types/dist/index.d.ts` as an external package declaration, completely eliminating TS6059 errors.

---

## 8. Concrete Step-by-Step Migration Roadmap for Worker (Milestone 1)

Follow this precise sequence to achieve clean dependency resolution and zero-error compilation:

### Step 1: Initialize and Build `packages/types`
1. Create `packages/types/tsconfig.json`.
2. Populate `packages/types/src/` with modular files: `product.ts`, `cart.ts`, `razorpay.ts`, `order.ts`, and `index.ts`.
3. Update `packages/types/package.json` with `"build": "tsc"`, exports map, and `dist/` entry points.
4. Execute `npm run build` inside `packages/types` to generate `dist/index.d.ts` and `dist/index.js`.

### Step 2: Clean and Realign `package.json` Dependencies
1. In `apps/api/package.json`:
   - Remove `"stripe": "^18.7.0"`.
   - Add `"razorpay": "^2.9.8"`.
   - Add `"@vertex/types": "*"`.
2. In `apps/web/package.json`:
   - Remove `"@stripe/stripe-js": "^5.8.0"`.
   - Remove `"@stripe/react-stripe-js": "^3.7.0"`.
   - Add `"@vertex/types": "*"`.

### Step 3: Align `apps/api` with Razorpay & Clean Compilation
1. Create `apps/api/src/config/razorpay.ts` (Razorpay client initialization).
2. Update `apps/api/src/models/Order.model.ts` (add `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`, and `paymentStatus`).
3. Update `apps/api/src/routes/orders.routes.ts`:
   - Remove `import Stripe from 'stripe'`.
   - Implement Razorpay route handlers or typed stubs for `/razorpay/create-order` and `/razorpay/verify-payment`.
4. Update `apps/api/src/routes/webhooks.routes.ts`:
   - Remove `import Stripe from 'stripe'`.
   - Implement Razorpay webhook handler for `/razorpay`.
5. Update `apps/api/src/server.ts`:
   - Mount `/api/webhooks/razorpay` with `express.raw({ type: 'application/json' })`.

### Step 4: Align `apps/web` Types and Utilities
1. Re-export `@vertex/types` in `apps/web/src/types/index.ts`.
2. Create `apps/web/src/types/razorpay.d.ts` declaring `window.Razorpay`.
3. Create `apps/web/src/lib/razorpay.ts` with `loadRazorpayCheckoutScript()`.

### Step 5: Install and Verify Entire Monorepo
1. From project root: run `npm install` to link workspaces and resolve `razorpay`.
2. Run `npx turbo type-check` (or `npm run type-check`) to confirm all packages pass type checking.
