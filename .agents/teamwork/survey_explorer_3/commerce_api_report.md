# VERTEX Commerce Flow, Razorpay Integration & API Architecture Report

> **Author**: `survey_explorer_3` (Teamwork Preview Explorer)  
> **Date**: 2026-10-04  
> **Target System**: VERTEX Technical Fashion E-Commerce (ASRV-inspired Tactical Luxury)  
> **Scope**: Slide-out Quick Cart Drawer, Cart State Mechanics, Native Razorpay Payment Gateway, Backend REST API & MongoDB Schemas, E2E Acceptance Verification

---

## 1. Executive Summary & Codebase Audit Findings

A forensic review of the repository (`c:\Users\atlas\OneDrive\ドキュメント\project-v1`) was conducted against the prompt requirements in `ORIGINAL_REQUEST.md`.

### 1.1 Baseline Codebase Gaps & Discrepancies Identified

1. **Payment Gateway Mismatch (Stripe vs. Razorpay)**:
   - **Existing Code**: `apps/api/package.json` (line 25: `"stripe": "^18.7.0"`), `apps/api/src/routes/orders.routes.ts` (lines 10–55: Stripe PaymentIntents), `apps/api/src/routes/webhooks.routes.ts` (lines 6–47: Stripe webhook handler), `apps/web/package.json` (lines 22–23: `@stripe/stripe-js`, `@stripe/react-stripe-js`), and `apps/web/.env.local.example` (line 10: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).
   - **Requirement**: `ORIGINAL_REQUEST.md` (R3, Acceptance Criteria) mandates **Native Razorpay SDK integration** with order creation, modal checkout with test credentials, webhook signature verification/reconciliation, and error resilience.
   - **Action Required**: Transition backend order processing and webhooks from Stripe to Razorpay (`razorpay` npm package), add Razorpay credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`), and integrate Razorpay Checkout (`checkout.js`) on the frontend.

2. **Cart Drawer & Frontend Component Missing Directory**:
   - `apps/web/src/app/layout.tsx` (line 7) and `apps/web/src/app/page.tsx` import store components including `@/components/store/CartDrawer`.
   - The directory `apps/web/src/components` does not exist yet.
   - The quick cart drawer component must be authored to implement spring physics opening, local storage persistence, optimistic quantity updates, free-shipping delta progress indicator, and variant swatch live swaps.

3. **Cart Store Functional Deficits (`apps/web/src/store/cart.ts`)**:
   - The existing Zustand cart store (`cart.ts`, lines 1–84) provides basic `addItem`, `removeItem`, and `updateQuantity`, but lacks:
     - Free-shipping threshold logic and delta calculations.
     - Live variant swatch swapping (`updateVariant`).
     - Available variant reference propagation for instant in-cart swatch selection.
     - Tax and shipping calculation accessors.
     - Optimistic mutation rollback on stock exhaustion.

4. **Database & Type Models Lack Razorpay Schema**:
   - `packages/types/src/index.ts` (lines 69–83) and `apps/api/src/models/Order.model.ts` (lines 16–39) contain only `paymentIntentId?: string`.
   - Razorpay requires tracking `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`, `paymentStatus` ('unpaid' | 'paid' | 'failed' | 'refunded'), and `paymentProvider` ('razorpay').

---

## 2. Slide-Out Quick Cart Drawer & State Management

The quick cart drawer serves as the primary commerce conversion focal point, adhering to Emil Kowalski design engineering principles and anti-slop guidelines.

### 2.1 Physics-Driven Motion Profile (Emil / Animate Standards)

- **Entry Transition**:
  - Transform: `transform: translate3d(0, 0, 0)` from initial `translate3d(100%, 0, 0)` (hardware-accelerated GPU layer).
  - Physics Model: Spring curve via `motion` (Framer Motion v12):
    ```ts
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 35,
      mass: 0.8,
      restDelta: 0.5,
    }
    ```
  - Duration constraint: under 300ms perceptual settling time.
  - Ban violations: Strict ban on `scale(0)` entrances, unconstrained `transition: all`, or CSS `ease-in` animations.
- **Backdrop Overlay**:
  - Dark obsidian veil: `rgba(10, 10, 10, 0.75)` with `backdrop-filter: blur(8px)`.
  - Opacity transition: `opacity: 0` to `opacity: 1`, duration 250ms, easing `cubic-bezier(0.23, 1, 0.32, 1)`.
- **Exit Transition**:
  - `transform: translate3d(100%, 0, 0)` with high-momentum spring/easeOut (200ms duration).
- **Reduced Motion Fallback**:
  - When `prefers-reduced-motion: reduce` is active: disable translateX slide; use instant opacity fade (0ms to 100ms fade).

### 2.2 Cart State Architecture (`useCartStore`)

The Zustand store combines local storage persistence, hydration safety, and multi-variant manipulation:

```ts
export interface CartVariant {
  sku: string;
  color: string;
  colorHex: string;
  size: string;
  price: number;
  compareAt?: number;
  stock: number;
  image: string;
}

export interface CartItem {
  id: string; // Unique composite key: `${productId}-${sku}`
  productId: string;
  slug: string;
  name: string;
  sku: string;
  color: string;
  colorHex: string;
  size: string;
  price: number;
  compareAt?: number;
  image: string;
  quantity: number;
  stock: number;
  availableVariants: CartVariant[];
}

export interface CartStoreState {
  items: CartItem[];
  isOpen: boolean;
  freeShippingThreshold: number; // $150.00 standard
  taxRate: number; // 0.08 (8%)
  flatShippingRate: number; // $9.99

  // Drawer controls
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Mutation actions
  addItem: (item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  swapVariant: (id: string, targetSku: string) => void;
  clearCart: () => void;

  // Financial Computeds
  itemCount: () => number;
  subtotal: () => number;
  freeShippingDelta: () => number;
  freeShippingProgress: () => number; // 0 to 100%
  shippingFee: () => number;
  estimatedTax: () => number;
  total: () => number;
}
```

### 2.3 Optimistic UI & Stock Guardrails

1. **Instant Feedback**: Quantity increments (`+`) and decrements (`-`) update the UI instantaneously within the store before network calls.
2. **Stock Ceiling Clamping**:
   - `quantity` cannot exceed `item.stock`.
   - If user clicks `+` at max stock, UI prevents increment and triggers a subtle haptic/visual shake (`translateX(-2px)` to `translateX(2px)`) with toast: *"Maximum available units in stock reached."*
3. **Optimistic Rollback on Server Sync**:
   - If checkout or stock validation returns 400 (`Insufficient stock for SKU ...`), the client updates the item's `stock` ceiling and clamps quantity to the newly verified quantity with an alert badge.

### 2.4 Free-Shipping Delta Progress Indicator

- **Threshold**: `$150.00`
- **Calculation Formula**:
  - `subtotal = sum(item.price * item.quantity)`
  - `delta = max(0, 150 - subtotal)`
  - `progress = min(100, (subtotal / 150) * 100)`
- **Visual Presentation**:
  - **Incomplete (`subtotal < 150`)**:
    - Header text: `ADD $${delta.toFixed(2)} MORE FOR COMPLIMENTARY EXPEDITED SHIPPING`
    - Progress Track: `#1F1F1F` modular border/track, 4px height.
    - Progress Fill: `#E8FF00` (electric chartreuse), animated width transition `width: ${progress}%`.
  - **Qualified (`subtotal >= 150`)**:
    - Header text: `✓ COMPLIMENTARY EXPEDITED SHIPPING UNLOCKED`
    - Progress Fill: 100% width `#22C55E` or `#E8FF00` with subtle glow.

### 2.5 In-Cart Variant Swatch Live Swaps

Users can switch colors and sizes directly within the cart drawer:
- **Interaction**:
  1. Each `CartItem` row renders miniature circular color swatches (18px diameter, border `#1F1F1F`, active ring `#E8FF00`) and size chips.
  2. Clicking an alternate swatch executes `swapVariant(currentId, targetSku)`.
  3. The store looks up `targetSku` in `item.availableVariants`.
  4. If an existing cart item already possesses `targetSku`, the store merges the quantities (`Math.min(existing.quantity + current.quantity, targetVariant.stock)`) and removes the old entry.
  5. Otherwise, the item's `sku`, `color`, `colorHex`, `price`, `image`, and `id` (`${productId}-${targetSku}`) are updated in-place with a 150ms opacity crossfade on the thumbnail image.

### 2.6 Accessibility & Ergonomics (WCAG 2.1 AA)

- **Landmark & Semantics**: Cart drawer enclosed in `<aside role="dialog" aria-modal="true" aria-labelledby="cart-heading">`.
- **Focus Management**:
  - On open: Focus automatically moves to the close button or first actionable element (`Close Cart`).
  - Focus trap: Tab cycles through items inside the drawer, preventing focus escaping to body background elements (`inert` attribute applied to `#main-content`).
  - Escape key listener: Pressing `Esc` immediately invokes `closeCart()` and returns focus to the cart trigger button in the navbar.
- **Live Regions**: `aria-live="polite"` on the subtotal and item count announcements for screen readers.
- **Touch Targets**: All quantity buttons (`+`, `-`), swatch selectors, and remove buttons meet the **48x48px** minimum interactive touch target area.

---

## 3. Native Razorpay Payment Gateway Integration

### 3.1 Architecture Overview & Security Model

Razorpay operates on a two-step cryptographic handshake:
1. **Order Creation (Server-to-Server)**: Backend securely requests an `order_id` from Razorpay using `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
2. **Modal Checkout (Client SDK)**: Frontend opens Razorpay Checkout modal passing `order_id` and public `key_id`.
3. **Verification (Dual-Channel)**:
   - **Synchronous Channel**: Client sends payment response (`razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`) to backend for HMAC-SHA256 signature validation.
   - **Asynchronous Channel (Webhook)**: Razorpay servers fire `payment.captured` / `order.paid` webhooks with HMAC signature in `x-razorpay-signature` to reconcile network failures.

```
+---------------------------------------------------------------------------------------------------+
|                                 RAZORPAY COMMERCE HANDSHAKE                                       |
+---------------------------------------------------------------------------------------------------+
  [ Client (Next.js) ]           [ Backend (Express) ]                 [ Razorpay Gateway ]
          |                               |                                      |
   1. Click Checkout                      |                                      |
          | ---- POST /razorpay/create -> |                                      |
          |      { items, address }       | 2. Validate DB prices & inventory    |
          |                               |    Create pending Order (Mongo)      |
          |                               | ---- POST /v1/orders --------------> |
          |                               | <--- { id: 'order_xxx', ... } -------|
          | <--- { orderId, rzpOrder } -- |                                      |
          |                               |                                      |
   3. Open Razorpay Modal (checkout.js)   |                                      |
      User enters test card/UPI           |                                      |
          | ------------------------------------ Payment Authorization --------> |
          | <----------------------------------- Success: { pay_id, sig } ------ |
          |                               |                                      |
   4. Sync Verification                   |                                      |
          | ---- POST /verify-payment --> |                                      |
          |      { pay_id, ord_id, sig }  | 5. HMAC-SHA256(ord_id|pay_id, secret)|
          |                               |    Match? Confirm Order & Deduct Qty |
          | <--- { success: true } ------ |                                      |
          |                               |                                      |
          |                               | <--- 6. Asynchronous Webhook --------|
          |                               |      POST /api/webhooks/razorpay     |
          |                               |      Validate x-razorpay-signature   |
          |                               |      Idempotent reconciliation       |
```

### 3.2 Environment Variables Configuration

#### Backend (`apps/api/.env`):
```env
# Razorpay Credentials
RAZORPAY_KEY_ID=rzp_test_1234567890abcdef
RAZORPAY_KEY_SECRET=your_super_secret_razorpay_key
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_hmac
```

#### Frontend (`apps/web/.env.local`):
```env
# Public Razorpay Key for Frontend Modal
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_1234567890abcdef
```

### 3.3 Backend Razorpay Order Creation API

- **Endpoint**: `POST /api/orders/razorpay/create-order`
- **Authentication**: Optional for guest checkout, attached to `req.user` if `Authorization: Bearer <token>` present.
- **Request Payload**:
  ```json
  {
    "items": [
      {
        "productId": "65b21f9c8d10b7a9412f8e11",
        "sku": "VPT-BLK-M",
        "quantity": 2
      }
    ],
    "shippingAddress": {
      "fullName": "Marcus Vance",
      "line1": "742 Evergreen Terrace",
      "city": "Neo Tokyo",
      "state": "Kanto",
      "postalCode": "100-0001",
      "country": "US",
      "phone": "+14155552671"
    },
    "customerEmail": "marcus@asrv-tactical.com",
    "currency": "USD"
  }
  ```
- **Backend Validation & Processing Logic**:
  1. Look up each product and variant directly in MongoDB (`Product.findById`).
  2. Tamper Protection: Do NOT trust frontend prices. Calculate `subtotal = sum(variant.price * item.quantity)` from verified database records.
  3. Validate Inventory: Check `variant.stock >= item.quantity`. If any item fails, return HTTP 400 with details.
  4. Calculate Shipping: `shipping = subtotal >= 150 ? 0 : 9.99`.
  5. Calculate Tax: `tax = Number((subtotal * 0.08).toFixed(2))`.
  6. Calculate Total: `total = Number((subtotal + shipping + tax).toFixed(2))`.
  7. Amount Subunit Conversion: Convert to integer subunits (`amountInSubunits = Math.round(total * 100)`).
  8. Create Pending MongoDB `Order` document with status `'pending'` and paymentStatus `'unpaid'`.
  9. Invoke Razorpay Node SDK:
     ```ts
     import Razorpay from 'razorpay';

     const razorpay = new Razorpay({
       key_id: process.env.RAZORPAY_KEY_ID!,
       key_secret: process.env.RAZORPAY_KEY_SECRET!,
     });

     const rzpOrder = await razorpay.orders.create({
       amount: amountInSubunits,
       currency: 'USD',
       receipt: String(order._id),
       notes: {
         orderId: String(order._id),
         customerEmail,
         userId: req.user?._id?.toString() || 'guest',
       },
     });

     order.razorpayOrderId = rzpOrder.id;
     await order.save();
     ```
- **Response Payload**:
  ```json
  {
    "data": {
      "orderId": "65b223408d10b7a9412f8e99",
      "razorpayOrderId": "order_EKwxwAgItmmXdp",
      "amount": 12528,
      "currency": "USD",
      "keyId": "rzp_test_1234567890abcdef",
      "subtotal": 116.00,
      "shipping": 0.00,
      "tax": 9.28,
      "total": 125.28,
      "customer": {
        "name": "Marcus Vance",
        "email": "marcus@asrv-tactical.com",
        "phone": "+14155552671"
      }
    }
  }
  ```

### 3.4 Frontend Razorpay Modal Invocation (`checkout.js`)

- **Script Loading**:
  A dynamic loader utility injects `https://checkout.razorpay.com/v1/checkout.js` once:
  ```ts
  export function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }
  ```
- **Modal Configuration**:
  ```ts
  const options = {
    key: data.keyId,
    amount: data.amount,
    currency: data.currency,
    name: 'VERTEX TACTICAL',
    description: `Order #${data.orderId.slice(-6).toUpperCase()}`,
    order_id: data.razorpayOrderId,
    image: '/brand-mark.png',
    prefill: {
      name: data.customer.name,
      email: data.customer.email,
      contact: data.customer.phone,
    },
    theme: {
      color: '#0A0A0A', // Void Black
      backdrop_color: 'rgba(10, 10, 10, 0.85)',
    },
    modal: {
      ondismiss: () => {
        // User closed modal without payment
        toast.info('Payment aborted. Your cart has been saved.');
        setIsCheckingOut(false);
      },
      escape: true,
      animation: true,
    },
    handler: async (response: RazorpaySuccessResponse) => {
      // response: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
      await handlePaymentSuccess(response, data.orderId);
    },
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.on('payment.failed', (failResponse: any) => {
    toast.error(`Payment failed: ${failResponse.error.description}`);
    setIsCheckingOut(false);
  });
  rzp.open();
  ```

### 3.5 Payment Signature Verification API

- **Endpoint**: `POST /api/orders/razorpay/verify-payment`
- **Request Payload**:
  ```json
  {
    "orderId": "65b223408d10b7a9412f8e99",
    "razorpayOrderId": "order_EKwxwAgItmmXdp",
    "razorpayPaymentId": "pay_29Mo3CsAGEtxik",
    "razorpaySignature": "2b3a887fe29b69b6f8490a187654..."
  }
  ```
- **Backend Cryptographic HMAC-SHA256 Verification**:
  ```ts
  import crypto from 'crypto';

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');

  const isAuthentic = crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf-8'),
    Buffer.from(razorpaySignature, 'utf-8')
  );

  if (!isAuthentic) {
    throw new AppError('Payment signature verification failed. Tampering detected.', 400);
  }
  ```
- **Order Confirmation & Inventory Decrement**:
  1. Retrieve order: ensure status is not already `'confirmed'`.
  2. Atomic inventory deduction:
     ```ts
     for (const item of order.items) {
       await Product.updateOne(
         { _id: item.productId, 'variants.sku': item.sku },
         { $inc: { 'variants.$.stock': -item.quantity } }
       );
     }
     ```
  3. Update order record:
     ```ts
     order.status = 'confirmed';
     order.paymentStatus = 'paid';
     order.razorpayPaymentId = razorpayPaymentId;
     order.razorpaySignature = razorpaySignature;
     await order.save();
     ```
  4. Return confirmed order response; client navigates to `/order-confirmation/${order._id}` and calls `clearCart()`.

### 3.6 Webhook Signature Verification & Reconciliation

Webhooks provide guaranteed eventual consistency when user connectivity drops before the frontend verification request executes.

- **Endpoint**: `POST /api/webhooks/razorpay`
- **Middleware Requirement**: Express raw body parser to access unaltered raw buffer for signature calculation:
  ```ts
  app.use('/api/webhooks/razorpay', express.raw({ type: 'application/json' }));
  ```
- **HMAC Verification**:
  ```ts
  const signature = req.headers['x-razorpay-signature'] as string;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.body) // raw Buffer
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }
  ```
- **Event Handling**:
  - `payment.captured` / `order.paid`:
    - Lookup Order by `razorpayOrderId: event.payload.payment.entity.order_id`.
    - **Idempotency Guard**: If `order.status === 'confirmed'`, return 200 immediately (prevents duplicate inventory deductions).
    - If `order.status === 'pending'`: mark `'confirmed'`, update `paymentStatus = 'paid'`, decrement inventory atomically.
  - `payment.failed`:
    - Update `paymentStatus = 'failed'`.
  - `refund.created`:
    - Update `paymentStatus = 'refunded'`.

---

## 4. Backend API Endpoints & Data Model Schemas

### 4.1 Product Catalog Data Model (`Product.model.ts`)

```ts
export interface IProductVariant {
  sku: string;               // e.g. "VPT-BLK-M" (Unique)
  color: string;             // e.g. "Void Black"
  colorHex: string;          // e.g. "#0A0A0A"
  size: string;              // "XS" | "S" | "M" | "L" | "XL" | "XXL" | "One Size"
  price: number;             // USD (e.g. 58)
  compareAt?: number;        // e.g. 78
  stock: number;             // Available inventory
  images: string[];          // [front, back, model, detail]
  video?: string;            // Looping technical video (WebM/MP4)
}

export interface IProduct extends Document {
  name: string;              // e.g. "Volt Performance Tee"
  slug: string;              // e.g. "volt-performance-tee" (Unique, Indexed)
  brand: string;             // "VERTEX"
  description: string;       // Technical narrative
  category: 'tops' | 'bottoms' | 'outerwear' | 'accessories';
  tags: string[];            // ["training", "bestseller", "aero-flex"]
  variants: IProductVariant[];
  features: string[];        // ["SweatShield+ fabric", "Flatlock chafe-free seams"]
  materials: string[];       // ["87% Polyester", "13% Elastane"]
  sizeChart?: Record<string, Record<string, string>>;
  isPublished: boolean;
  isFeatured: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 Upgraded Order Data Model (`Order.model.ts`)

```ts
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
  userId?: mongoose.Types.ObjectId; // Optional for guest checkout
  items: IOrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;                 // "USD"
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'failed' | 'refunded';
  paymentProvider: 'razorpay';
  razorpayOrderId?: string;         // Indexed (sparse)
  razorpayPaymentId?: string;       // Indexed (sparse)
  razorpaySignature?: string;
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
  customerEmail: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.3 Complete API Endpoint Catalog

| Method | Endpoint | Auth | Purpose | Payload Summary |
|---|---|---|---|---|
| `GET` | `/api/products` | Public | List products with filters & pagination | Query: `category, sort, minPrice, maxPrice, search, page, limit` |
| `GET` | `/api/products/:slug` | Public | Get single product & full variants | Returns product document |
| `POST` | `/api/orders/validate-cart` | Public | Check live stock & price integrity | Body: `{ items: [{ sku, quantity }] }` |
| `POST` | `/api/orders/razorpay/create-order` | Optional | Create DB order + Razorpay order | Body: `{ items, shippingAddress, customerEmail, currency }` |
| `POST` | `/api/orders/razorpay/verify-payment`| Optional | HMAC verification & stock decrement | Body: `{ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }` |
| `POST` | `/api/webhooks/razorpay` | Public (HMAC Header)| Webhook reconciliation | Raw body with `x-razorpay-signature` |
| `GET` | `/api/orders` | Customer | List customer order history | Header: `Authorization: Bearer <token>` |
| `GET` | `/api/orders/:id` | Customer / Guest | View specific order status | Returns populated order document |
| `GET` | `/api/admin/orders` | Admin | Manage all orders | Query: `status, page, limit` |
| `PATCH`| `/api/admin/orders/:id/status`| Admin | Update shipment tracking/status | Body: `{ status, trackingNumber }` |

---

## 5. Error Resilience, Fallback States & Edge Cases

| Scenario | Trigger / Root Cause | System Response | User Experience |
|---|---|---|---|
| **Modal Dismissed** | User closes modal via `Esc` or `X` button | Client `modal.ondismiss` fires; Order remains `pending` | Cart preserved; toast notification: *"Checkout paused. Items retained in your bag."* |
| **Insufficient Inventory** | Stock depleted while user had item in cart | API returns 400 `{ error: "Insufficient stock for SKU VPT-BLK-M" }` | Cart drawer updates stock indicator; highlights depleted item; disables checkout button |
| **Tampered Amount** | Client manipulates price in request payload | Backend recomputes prices directly from MongoDB `Product` records | Tampering eliminated; order created strictly with DB price |
| **Signature Mismatch** | Malicious payload or corrupted transmission | HMAC-SHA256 comparison fails; throws 400 AppError | Order remains unpaid; error logged; UI prompts user to retry |
| **Dropped Connection** | User closes tab after OTP approval before sync verify API call | Razorpay fires asynchronous `payment.captured` webhook | Webhook validates signature, confirms order, and decrements stock |
| **Duplicate Webhook** | Network retries from Razorpay | Webhook handler checks `order.status === 'confirmed'` | Immediately returns HTTP 200; avoids duplicate stock deduction |
| **Price Tier Delta Boundary** | Cart value precisely $149.99 vs $150.00 | Math: $149.99 triggers $9.99 shipping; $150.00 triggers $0.00 | Free shipping delta banner displays `$0.01 away from free shipping` |

---

## 6. E2E Acceptance Criteria & Test Verification Suite

### 6.1 Cart Drawer Verification Matrix

- [ ] **Spring Physics Smoothness**: Drawer slides smoothly from `translate3d(100%, 0, 0)` to `translate3d(0, 0, 0)` with Framer Motion spring (`stiffness: 350`, `damping: 35`). No layout shift or unconstrained `transition: all`.
- [ ] **Local Storage Hydration**: Add 3 items -> refresh browser -> drawer persists all 3 items with exact SKUs, quantities, and selected variants. No React hydration mismatch warning in console.
- [ ] **Optimistic Quantity Adjustments**:
  - Click `+` -> immediate number update and subtotal recalc without spinners.
  - Click `-` on quantity 1 -> triggers removal confirmation or instant item drop.
  - Attempt increment beyond available stock -> button disabled and warning displayed.
- [ ] **Free Shipping Delta**:
  - Subtotal = $100 -> Banner shows: `ADD $50.00 MORE FOR COMPLIMENTARY EXPEDITED SHIPPING`, bar at 66.6%.
  - Add $60 item (subtotal = $160) -> Banner updates to: `✓ COMPLIMENTARY EXPEDITED SHIPPING UNLOCKED`, bar at 100%, shipping fee changes from $9.99 to $0.00.
- [ ] **Variant Swatch Live Swap**:
  - Click 'Ash Grey' swatch on 'Void Black' tee -> thumbnail changes to grey image, SKU switches to `VPT-GRY-*`, price persists, drawer does not unmount.
- [ ] **Accessibility Verification**:
  - Trigger drawer -> focus locks to Close button.
  - Press `Tab` -> stays within drawer.
  - Press `Esc` -> drawer closes and focus returns to Navbar cart trigger.

### 6.2 Razorpay Checkout Verification Matrix

- [ ] **Order Creation API Verification**:
  - Send POST request to `/api/orders/razorpay/create-order` with valid items.
  - Verify HTTP 200 with `razorpayOrderId` starting with `order_` and exact integer subunit `amount`.
- [ ] **Modal Invocation with Test Credentials**:
  - Click "CHECKOUT" in cart drawer.
  - Razorpay Modal opens over dark `#0A0A0A` theme with custom title `VERTEX TACTICAL`.
  - Enter test card `4111 1111 1111 1111` (or test Netbanking/UPI simulator).
- [ ] **Signature Verification & Stock Deduction**:
  - Complete test payment -> frontend sends payment ID, order ID, and signature to `/api/orders/razorpay/verify-payment`.
  - Backend verifies HMAC-SHA256 signature -> MongoDB order marked `confirmed`.
  - Check MongoDB product inventory -> variant stock decremented by exact purchased quantity.
  - Frontend cart store automatically cleared (`useCartStore.getState().items.length === 0`).
  - Browser navigated to `/order-confirmation/[id]`.
- [ ] **Webhook Simulation**:
  - Send mock `POST /api/webhooks/razorpay` payload with valid `x-razorpay-signature` for an unconfirmed order.
  - Verify order is automatically reconciled to `confirmed` and inventory decremented.
  - Re-send identical webhook -> returns HTTP 200 without double stock decrement.

---

## 7. Migration & Implementation Blueprint for Subsequent Agents

To enable immediate implementation by coding agents, the tasks are sequenced as follows:

1. **Backend Package & Env Update**:
   - Install `razorpay` in `apps/api`: `npm install razorpay --workspace=@vertex/api`
   - Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` to `apps/api/.env` and `.env.example`.
2. **Backend Models & Routes Update**:
   - Update `packages/types/src/index.ts` and `apps/api/src/models/Order.model.ts` with Razorpay fields.
   - Replace Stripe logic in `apps/api/src/routes/orders.routes.ts` with Razorpay order creation and payment verification.
   - Replace Stripe logic in `apps/api/src/routes/webhooks.routes.ts` with Razorpay HMAC verification.
   - Update `apps/api/src/server.ts` to attach raw body parser to `/api/webhooks/razorpay`.
3. **Frontend Cart Store Enhancement**:
   - Update `apps/web/src/store/cart.ts` to include `availableVariants`, `swapVariant`, `freeShippingDelta`, and tax/shipping computeds.
4. **Frontend Component Creation**:
   - Implement `CartDrawer.tsx` in `apps/web/src/components/store/CartDrawer.tsx` with Framer Motion spring physics, accessibility focus trap, free-shipping bar, and swatch selectors.
   - Implement `checkout.ts` utility in `apps/web/src/lib/razorpay.ts` for dynamic script loading and modal lifecycle management.
