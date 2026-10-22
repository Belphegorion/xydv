# VERTEX Backend Architecture & Implementation Directions

## 1. System Vision & Architecture Principles

The VERTEX Backend (`apps/api`) powers a high-performance technical activewear e-commerce platform. Built on Express 5, TypeScript 5.7, and MongoDB (via Mongoose 8), it is engineered for absolute financial correctness, concurrency safety, low-latency catalog exploration, and resilient payment gateway integration.

### Core Principles

1. **Clean Layered Architecture**:
   - Strict separation of concerns: `Routes` $\rightarrow$ `Middleware` $\rightarrow$ `Controllers` $\rightarrow$ `Services` $\rightarrow$ `Models`.
   - Routes define endpoints and apply authentication and validation middleware.
   - Controllers handle HTTP transport (request unpacking, status codes, response wrapping).
   - Services implement business logic, transactional workflows, and external gateway interactions without Express dependencies.
   - Models enforce Mongoose schemas, virtuals, and persistence invariants.

2. **Authoritative Server-Side Pricing & Cart Computation**:
   - Zero client trust on pricing, discounts, shipping fees, or tax rates.
   - Subtotals, sales tax (8%), shipping fees ($9.99 flat, free at $\ge \$150.00$), and Razorpay integer amounts in paise (`Math.round(total * 100)`) are strictly computed server-side against the canonical database.

3. **Zero-Overselling Concurrency & Dual-Tier Inventory Reservation**:
   - To eliminate double-spend and overselling during drops, inventory utilizes two counters per variant: `stock` (available for sale) and `reservedStock` (temporarily held in checkout).
   - Atomic MongoDB operators (`$inc`, `$elemMatch` with condition `{ stock: { $gte: quantity } }`) reserve inventory by decrementing `stock` and incrementing `reservedStock`.
   - On payment capture or webhook settlement, `reservedStock` is decremented (permanent capture). Only if no prior reservation was held is `stock` decremented directly, eliminating double stock reduction.
   - Time-to-Live (TTL) reservation tracking automatically releases held inventory back to available stock if payment is not completed within 15 minutes.

4. **Crash-Resilient Webhook Idempotency & Double-Capture Guards**:
   - Payment webhooks are verified via timing-safe HMAC-SHA256 with mandatory buffer length parity checks.
   - Event processing is guarded by persistent idempotency records (`ProcessedWebhookEvent` in MongoDB with 7-day TTL).
   - Atomic database status transitions ensure duplicate or out-of-order webhook events (`payment.captured`, `order.paid`, `payment.failed`) cannot duplicate inventory decrements or overwrite confirmed payments.

5. **Normalized Error Contracts**:
   - All errors are normalized by `errorHandler.ts` into a unified contract:
     `{ success: false, error: string, message: string }`.
   - Mongoose validation errors, duplicate key `11000` errors, Zod validation failures, and JWT expirations map cleanly to HTTP 400, 401, 404, or 409 responses, satisfying both storefront fetch clients and programmatic consumers.

---

## 2. Directory Layout & Module Structure

```
apps/api/src/
├── config/
│   ├── database.ts        # Mongoose connection pool, retry backoff & graceful shutdown
│   ├── env.ts             # Zod environment schema & runtime secrets validation
│   └── razorpay.ts        # Razorpay SDK singleton & key configurations
├── constants/
│   └── commerce.ts        # Business constants (tax rate, free shipping threshold, TTL)
├── controllers/
│   ├── admin.controller.ts     # Admin catalog management, order fulfillment & analytics
│   ├── auth.controller.ts      # Authentication, registration, token refresh & logout
│   ├── order.controller.ts     # Order creation, verification, and history
│   ├── product.controller.ts   # Catalog querying, slug resolution, category aggregation
│   ├── user.controller.ts      # Customer profile, saved addresses management
│   └── webhook.controller.ts   # Razorpay webhook HMAC verification & idempotent intake
├── middleware/
│   ├── auth.ts            # JWT authentication & admin authorization guards
│   ├── errorHandler.ts    # Centralized error normalizer & AppError definition
│   ├── notFound.ts        # 404 Route catcher
│   ├── rateLimiter.ts     # IP-based rate limiting (global, auth, and checkout limiters)
│   └── validateRequest.ts # Zod schema validation middleware for body/query/params
├── models/
│   ├── Idempotency.model.ts    # Webhook event deduplication collection with 7-day TTL
│   ├── Order.model.ts          # Order & order item persistence with payment tracking
│   ├── Product.model.ts        # Catalog products, specs, and multi-variant inventory
│   ├── RefreshToken.model.ts   # Token rotation tracking with family reuse revocation
│   ├── Reservation.model.ts    # Temporary inventory holds with 15-minute TTL
│   ├── Review.model.ts         # User verified product reviews
│   └── User.model.ts           # Customer & admin credentials, addresses, loyalty points
├── routes/
│   ├── admin.routes.ts    # /api/admin routing
│   ├── auth.routes.ts     # /api/auth routing
│   ├── index.ts           # Unified API router mounting all domain routers
│   ├── orders.routes.ts   # /api/orders routing
│   ├── products.routes.ts # /api/products routing
│   ├── users.routes.ts    # /api/users routing
│   └── webhooks.routes.ts # /api/webhooks routing
├── services/
│   ├── admin.service.ts        # Admin business operations & financial aggregations
│   ├── auth.service.ts         # Password hashing, JWT signing, token family rotation
│   ├── inventory.service.ts    # Atomic stock reservation, release, capture, & cleaner
│   ├── order.service.ts        # Price authority, Razorpay order creation & payment capture
│   ├── product.service.ts      # Product filtering, text search, pagination & reviews
│   └── user.service.ts         # Customer profile, address book & default flag resolution
├── validators/
│   ├── auth.schema.ts     # Zod schemas for register, login, refresh
│   ├── order.schema.ts    # Zod schemas for order creation, payment verification, status updates
│   ├── product.schema.ts  # Zod schemas for catalog queries & product mutations
│   └── user.schema.ts     # Zod schemas for profile updates & address management
├── scripts/
│   └── seed.ts            # High-fidelity 10-product Bento seed preserving milestone anchors
└── server.ts              # Express application bootstrap & lifecycle management
```

---

## 3. Data Flows & State Machines

### 3.1 Order Lifecycle State Machine

```
               [ Checkout Initiated ]
                         │
                         ▼
             [ status: 'pending' ]
             [ paymentStatus: 'pending' ]
             (Inventory held via Reservation)
                         │
          ┌──────────────┴──────────────┐
          │                             │
    Payment Succeeded             Payment Failed /
 (HMAC verified or Webhook)      Timeout Expired (>15m)
          │                             │
          ▼                             ▼
  [ status: 'confirmed' ]       [ status: 'cancelled' ]
  [ paymentStatus: 'captured' ] [ paymentStatus: 'failed' ]
  (Inventory permanently        (Inventory reservation
   deducted from stock)          released back to stock)
          │
   Admin Fulfilled
          │
          ▼
  [ status: 'shipped' ]
  (Tracking number added)
          │
   Carrier Delivered
          │
          ▼
  [ status: 'delivered' ]
```

### 3.2 Dual-Tier Inventory Reservation Flow

```
1. Customer initiates order (POST /api/orders/razorpay/create-order)
   ├── Validate line items against authoritative Product collection
   ├── Atomic check & hold:
   │     UPDATE Product
   │     WHERE variants.sku = sku AND variants.stock >= quantity
   │     SET variants.stock = stock - quantity,
   │         variants.reservedStock = reservedStock + quantity
   └── Create Reservation record (expiresAt: now + 15 min)

2. Customer verifies payment (POST /api/orders/razorpay/verify-payment) OR Webhook fires
   ├── Guard: paymentStatus must not already be 'captured'
   ├── Verify HMAC-SHA256 signature
   ├── Settle Reservation:
   │     UPDATE Product
   │     WHERE variants.sku = sku
   │     SET variants.reservedStock = reservedStock - quantity
   └── Mark Order: status = 'confirmed', paymentStatus = 'captured'

3. Abandonment / Expiration (Scheduled Worker every 60s)
   ├── Query expired unfulfilled Reservations (expiresAt <= now)
   ├── Release held inventory:
   │     UPDATE Product
   │     SET variants.stock = stock + reservedQuantity,
   │         variants.reservedStock = reservedStock - reservedQuantity
   └── Mark pending Order: status = 'cancelled', paymentStatus = 'failed'
```

---

## 4. Complete API Specification

### 4.1 Authentication & Profile (`/api/auth`)

- `POST /api/auth/register`: Create user account, returns JWT access token + user DTO. Sets HTTP-only refresh cookie.
- `POST /api/auth/login`: Authenticate email/password, returns JWT access token + user DTO. Sets HTTP-only refresh cookie.
- `POST /api/auth/refresh`: Rotate refresh token using secure cookie; detects reuse and revokes compromised token families.
- `POST /api/auth/logout`: Revoke active refresh token and clear cookies.
- `GET /api/auth/me`: Get authenticated user profile (requires `Bearer` token).

### 4.2 Customer Address Management (`/api/users`)

- `GET /api/users/me`: Return authenticated user document.
- `PATCH /api/users/me`: Update display name or avatar.
- `POST /api/users/me/addresses`: Add new shipping address to user's address book.
- `DELETE /api/users/me/addresses/:id`: Delete saved shipping address.

### 4.3 Catalog & Exploration (`/api/products`)

- `GET /api/products/categories`: Return category aggregations (tops, bottoms, outerwear, accessories) with product counts and hero image URLs. Declared before `/:slug` to prevent route shadowing.
- `GET /api/products`: 10-parameter filtering engine:
  - `category` (tops, bottoms, outerwear, accessories, or all)
  - `search` (full-text search over name, description, tags, brand, color)
  - `featured` (boolean filter)
  - `bestseller` (boolean filter)
  - `inStock` (boolean filter checking variant inventory)
  - `minPrice` & `maxPrice` (numeric price bounds)
  - `sort` (`newest`, `price-asc`, `price-desc`, `popular`, `bestseller`, `rating`)
  - `page` & `limit` (pagination)
- `GET /api/products/:slug`: Lookup product by unique slug or 24-character hexadecimal ObjectId with 404 fallback.
- `GET /api/products/:slug/reviews`: Fetch customer reviews for a product.
- `POST /api/products/:slug/reviews`: Authenticated endpoint to submit a verified product review.

### 4.4 Orders & Razorpay Checkout (`/api/orders`)

- `POST /api/orders/razorpay/create-order` (Aliases: `/create-order`, `/create-payment-intent`):
  - Validates positive integer quantities ($>0$).
  - Computes authoritative pricing ($150 threshold for free shipping, 8% tax).
  - Reserves variant inventory.
  - Generates Razorpay Order via official SDK.
  - Returns `orderId`, `razorpayOrderId`, `amount`, `currency`, `keyId`, and line-item breakdown.
- `POST /api/orders/razorpay/verify-payment`:
  - Validates `razorpayOrderId`, `razorpayPaymentId`, and `razorpaySignature`.
  - Performs length-guarded `crypto.timingSafeEqual` HMAC-SHA256 verification.
  - Resolves internal Order by MongoDB ID or `razorpayOrderId` (returns 404 if not found).
  - Transition order to `confirmed` and `captured` idempotently.
- `POST /api/orders`: Direct authenticated order placement with inventory rollback on creation failures.
- `GET /api/orders`: List authenticated user's order history (sorted descending by creation date).
- `GET /api/orders/:id`: Fetch specific order details (restricted to owning customer or admin).

### 4.5 Persistent Webhooks (`/api/webhooks`)

- `POST /api/webhooks/razorpay`:
  - Preserves raw request Buffer before JSON body parsing.
  - Timing-safe HMAC verification against `RAZORPAY_WEBHOOK_SECRET`.
  - Atomically writes event ID into `ProcessedWebhookEvent` collection with unique index. Duplicate events immediately return HTTP 200 with `{ status: 'ok', received: true, idempotent: true }`.
  - Handles `payment.captured`, `order.paid`, and `payment.failed` with atomic order status update guards.

### 4.6 Admin Operations (`/api/admin`)

- Requires `role: 'admin'`.
- `GET /api/admin/products`: List all products including drafts.
- `POST /api/admin/products`: Create new technical product with auto-slug generation.
- `PATCH /api/admin/products/:id`: Update product specifications, variants, or publication status.
- `DELETE /api/admin/products/:id`: Soft-delete or purge catalog item.
- `GET /api/admin/orders`: Paginated order query with status filters.
- `PATCH /api/admin/orders/:id/status`: Update fulfillment status (`pending` $\rightarrow$ `confirmed` $\rightarrow$ `shipped` $\rightarrow$ `delivered` $\rightarrow$ `cancelled`) and attach carrier tracking numbers.
- `GET /api/admin/analytics`: Aggregated platform metrics (gross revenue, order counts, customer counts, and top 5 volume products).

---

## 5. Security, Concurrency & Maintenance Invariants

1. **Length-Guarded Constant-Time Cryptography**:
   - `crypto.timingSafeEqual` throws a `RangeError` if compared buffers have differing byte lengths. All verification routines must enforce `expectedBuf.length === receivedBuf.length` before invoking timing-safe comparison, returning HTTP 400 Bad Request if length check fails.
2. **Double-Capture Race Prevention**:
   - When updating payment status to `captured`, the query must include `{ paymentStatus: { $ne: 'captured' } }` or verify current state before decrementing inventory, guaranteeing stock is never decremented twice.
3. **Graceful Server Lifecycle**:
   - Listeners on `SIGTERM` and `SIGINT` cleanly close the HTTP server, stop active background schedulers, and gracefully drain Mongoose database connection pools before exiting process.
4. **Environment Integrity & Secret Validation**:
   - Strict Zod schema validation runs on startup. In production, missing or malformed keys halt startup with descriptive diagnostics.
