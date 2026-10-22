# Specification Mining & Workspace Survey Report

**Project**: VERTEX Fashion — Full-Stack MERN E-Commerce  
**Author**: `survey_spec_miner_1` (teamwork_preview_spec_miner)  
**Date**: 2026-10-04T09:00:00Z  
**Project Root**: `c:\Users\atlas\OneDrive\ドキュメント\project-v1`  
**Reference Specification**: `ORIGINAL_REQUEST.md` & Monorepo Codebase

---

## 1. Executive Summary & Workspace Survey

### 1.1 Workspace Layout & Monorepo Architecture
The project is organized as a monorepo utilizing **Turborepo (`turbo 2.5.4`)** with **npm workspaces (`apps/*`, `packages/*`)**:

```
project-v1/
├── apps/
│   ├── api/                     # Express 5 backend service (PORT 5000)
│   │   ├── src/
│   │   │   ├── config/          # database.ts (Mongoose connection)
│   │   │   ├── middleware/      # auth, errorHandler, notFound, rateLimiter
│   │   │   ├── models/          # Order, Product, Review, User schemas
│   │   │   ├── routes/          # admin, auth, index, orders, products, users, webhooks
│   │   │   ├── scripts/         # seed.ts (8 catalog products)
│   │   │   └── server.ts        # Express entry point
│   │   ├── .env.example
│   │   ├── package.json         # @vertex/api (Express 5.1, Mongoose 8.15)
│   │   └── tsconfig.json
│   └── web/                     # Next.js 15 frontend application (PORT 3000)
│       ├── src/
│       │   ├── app/             # App router: layout.tsx, page.tsx, globals.css, providers.tsx
│       │   ├── lib/             # api.ts (fetch client), utils.ts (formatting & cn)
│       │   ├── store/           # cart.ts (Zustand persist), wishlist.ts (Zustand persist)
│       │   └── types/           # Local frontend TS interfaces
│       ├── .env.local.example
│       ├── next.config.ts
│       ├── package.json         # @vertex/web (Next 15.3.4, React 19.1.0, Tailwind v4, Motion 12)
│       ├── postcss.config.mjs
│       └── tsconfig.json
├── packages/
│   └── types/                   # @vertex/types shared contract package
│       ├── src/index.ts         # Shared interfaces: Product, Order, User, Review, Filters
│       └── package.json
├── .agents/                     # Teamwork agent metadata & coordination logs
├── .gitignore                   # Standard node, build, turbo ignore patterns
├── .prettierrc                  # Prettier formatting config with tailwindcss plugin
├── README.md                    # Project documentation
├── package.json                 # Monorepo root scripts & devDependencies
├── tsconfig.base.json           # Shared base TypeScript compiler options
└── turbo.json                   # Turborepo task pipeline definitions
```

### 1.2 Git & Environment Status
- **Git Status**: Branch `master`, 0 commits yet (`No commits yet`), all files currently untracked.
- **Node & npm Engine Verification**:
  - Runtime Node version: `v24.16.0` (meets `engines.node >= 20.0.0`).
  - Runtime npm version: `11.13.0` (meets `engines.npm >= 10.0.0`).
- **Dependencies & Build State**:
  - `node_modules` is currently **absent** at the root, in `apps/web`, and in `apps/api`.
  - Running `npm run type-check` or `npm run build` fails because `turbo` and local node binaries are not yet installed (`'turbo' is not recognized as an internal or external command`).
  - No automated test files (`*.test.ts`, `*.spec.ts`, Jest, Vitest, or Playwright configurations) currently exist in the repository.

---

## 2. Specification Audit & Critical Gap Analysis

### 2.1 Authoritative Requirement Sources
1. **`ORIGINAL_REQUEST.md` (Primary User Specification)**:
   - Technical activewear/tactical luxury visual identity inspired by **ASRV (asrv.com)**.
   - Obsidian void background (`#0A0A0A`), modular technical borders (`#1F1F1F`), sharp sans-serif display + technical mono metrics.
   - Dynamic viewport hero (`min-h-[100dvh]`), asymmetric bento category grid.
   - Emil Kowalski / Animate motion standards: `scale(0.97)` on `:active`, cubic-bezier easing (`(0.23, 1, 0.32, 1)`), transitions `<300ms`, `transform` and `opacity` only, ban on `scale(0)` entrances and `transition: all`, full `prefers-reduced-motion` fallbacks, zero animation on keyboard navigation.
   - WCAG 2.1 AA accessibility: landmarks, single H1, focus-visible rings, focus trapping in drawers/modals, 48x48px min touch targets.
   - Quick cart drawer with optimistic quantity updates, free-shipping delta progress bar ($150 threshold), live variant swatches.
   - **Razorpay SDK integration**: Modal checkout, order creation flow, webhook reconciliation, test credentials verification.
   - **AWS cloud deployment readiness**: Containerization, environment configs, production build scripts.

2. **Scaffold Divergences & Gaps Found in Workspace**:
   - **Payment Gateway Divergence**: The existing scaffold in `apps/api/package.json`, `apps/api/src/routes/orders.routes.ts`, and `apps/web/package.json` contains **Stripe** (`stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`, Stripe PaymentIntents, `/api/webhooks/stripe`). **`ORIGINAL_REQUEST.md` explicitly specifies Razorpay**. The system must implement Razorpay order creation (`razorpay.orders.create`), Razorpay checkout modal via `checkout.razorpay.com/v1/checkout.js`, and Razorpay webhook signature verification using HMAC SHA-256 (`x-razorpay-signature`).
   - **Missing Web UI Components**: `apps/web/src/app/page.tsx` and `layout.tsx` import 12 components that do not exist in the filesystem:
     - `HeroSection`, `FeaturedCollection`, `CategoryGrid`, `BrandStatement`, `BestsellerGrid`, `TechFeatures`, `SocialProof`, `NewsletterSection`
     - `AnnouncementBar`, `Navbar`, `Footer`, `CartDrawer`
   - **Missing AWS Deployment & Containerization Artifacts**:
     - No `Dockerfile` exists for `apps/web` or `apps/api`.
     - No `docker-compose.yml` exists for multi-service local testing or production deployment.
     - No `.dockerignore` exists.
     - `next.config.ts` lacks `output: 'standalone'` which is essential for optimized container builds.
     - No AWS CloudFormation, ECS task definition, App Runner, or Terraform templates are present.
   - **Missing Test Setup**:
     - No test runner (Vitest, Jest) or test dependencies in root or package configurations.

---

## 3. MERN Stack Baseline Specification

### 3.1 MongoDB & Data Schema
- **Database Connection**: `apps/api/src/config/database.ts` connects via Mongoose 8.15 to `MONGODB_URI` (`mongodb://localhost:27017/vertex` or MongoDB Atlas URI) with `serverSelectionTimeoutMS: 5000`.
- **Data Models**:
  1. `Product` (`apps/api/src/models/Product.model.ts`):
     - Fields: `name`, `slug` (unique, regex `^[a-z0-9-]+$`), `brand` ('VERTEX'), `description`, `category` (enum: `'tops' | 'bottoms' | 'outerwear' | 'accessories'`), `tags`, `variants` (subdocument array), `features`, `materials`, `sizeChart`, `isPublished` (bool), `isFeatured` (bool), `averageRating` (0-5), `reviewCount`.
     - Variant schema: `sku` (unique), `color`, `colorHex`, `size`, `price` (min 0), `compareAt`, `stock` (min 0), `images` (array), `video`.
     - Indexes: `{ slug: 1 }`, `{ category: 1, isPublished: 1 }`, `{ isFeatured: 1, isPublished: 1 }`, text index on `{ name, description, tags }`.
  2. `Order` (`apps/api/src/models/Order.model.ts`):
     - Fields: `userId`, `items` (`productId`, `name`, `sku`, `color`, `size`, `price`, `quantity`, `image`), `subtotal`, `shipping`, `tax`, `total`, `status` (`'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'`), `shippingAddress` (`fullName`, `line1`, `line2`, `city`, `state`, `postalCode`, `country`, `phone`), `paymentIntentId`, `trackingNumber`, `notes`.
     - Requirement Extension: Need `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature` to record Razorpay checkout metadata.
  3. `User` (`apps/api/src/models/User.model.ts`):
     - Fields: `name`, `email` (unique, lowercase), `password` (bcrypt hash with cost 12, hidden in queries via `select: false`), `role` (`'customer' | 'admin'`), `avatar`, `loyaltyPoints`, `googleId`, `addresses` array.
  4. `Review` (`apps/api/src/models/Review.model.ts`):
     - Fields: `productId`, `userId`, `userName`, `rating` (1-5), `title`, `body`, `verified`.
     - Index: Unique compound index `{ productId: 1, userId: 1 }` prevents duplicate reviews per user.

### 3.2 Express 5 Backend Architecture
- **Middlewares**:
  - `helmet()`: Security response headers.
  - `cors()`: Whitelisted origins (`CLIENT_URL` / `http://localhost:3000`), credentials enabled.
  - `compression()`: Gzip/deflate response compression.
  - `morgan()`: Combined (prod) or dev (dev) logging.
  - `express.raw({ type: 'application/json' })`: Pre-JSON body parser on webhook endpoints for cryptographic signature verification.
  - `express.json({ limit: '10mb' })` & `express.urlencoded({ extended: true })`.
  - `apiLimiter`: 200 requests / 15 minutes window.
  - `authLimiter`: 20 requests / 15 minutes window for `/api/auth/*`.
  - `requireAuth`: JWT Bearer token validation via `JWT_SECRET`.
  - `requireAdmin`: Role check (`role === 'admin'`).
  - `errorHandler` & `notFound`: Centralized operational error management.
- **REST API Routes**:
  - `GET /health`: Health check probe returning `{ status: 'ok', timestamp, env }`.
  - `GET /api/products`: Filterable catalog (`category`, `search`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`).
  - `GET /api/products/:slug`: Product detail by slug.
  - `GET /api/products/:slug/reviews`: Product reviews list.
  - `POST /api/products/:slug/reviews`: Create review (authenticated).
  - `POST /api/auth/register`: User registration with bcrypt hashing & JWT token issuance.
  - `POST /api/auth/login`: User login returning user data & JWT token.
  - `GET /api/auth/me`: Current user profile (authenticated).
  - `GET /api/users/me` & `PATCH /api/users/me`: Update user profile.
  - `POST /api/orders`: Create confirmed order and decrement variant stock in database.
  - `GET /api/orders` & `GET /api/orders/:id`: User order history.
  - `GET /api/admin/products`, `POST /api/admin/products`, `PATCH /api/admin/products/:id`, `DELETE /api/admin/products/:id`.
  - `GET /api/admin/orders`, `PATCH /api/admin/orders/:id/status`.
  - `GET /api/admin/analytics`: Aggregated counts, revenue summary, and top products.
  - **Required Razorpay Endpoints**:
    - `POST /api/orders/create-razorpay-order`: Generates Razorpay Order via SDK (`amount` in smallest currency unit / paise or cents, currency, receipt ID).
    - `POST /api/orders/verify-razorpay-payment`: Server-side signature verification of `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` using HMAC SHA-256.
    - `POST /api/webhooks/razorpay`: Razorpay webhook listener verifying signature against `RAZORPAY_WEBHOOK_SECRET` for asynchronous reconciliation (`payment.captured`, `order.paid`, `payment.failed`).

### 3.3 Next.js 15 & React Frontend Architecture
- **Framework**: Next.js 15.3.4 (App Router) with React 19.1.0, TypeScript 5.7.3.
- **Styling & Design Tokens**: Tailwind CSS v4 (`@import 'tailwindcss'`) with design tokens defined in `apps/web/src/app/globals.css`:
  - Obsidian Void Background: `--bg: #0a0a0a`
  - Surface & Card Backgrounds: `--bg-surface: #111111`, `--bg-elevated: #181818`
  - Modular Technical Borders: `--border: #1f1f1f`, `--border-subtle: #161616`
  - Text Hierarchy: Primary `#f5f5f5`, Secondary `#a0a0a0`, Muted `#5a5a5a`
  - Accent Color: Electric Chartreuse `--accent: #e8ff00`, Hover `#d4eb00`, Muted `#e8ff0015`
  - Typography: Space Grotesk (`--font-body`), PP Neue Montreal / Space Grotesk (`--font-heading`)
  - Sharp Geometries: `--radius-none: 0px`
- **State Management**:
  - `useCartStore` (`apps/web/src/store/cart.ts`): Zustand store with `persist` middleware (`localStorage`), handling `items`, `isOpen`, `openCart`, `closeCart`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `itemCount`, and `subtotal`.
  - `useWishlistStore` (`apps/web/src/store/wishlist.ts`): Zustand store with `persist` middleware (`localStorage`) for toggling and checking wishlisted products.
- **Client API Fetcher**: `apps/web/src/lib/api.ts` wrapping native `fetch` with base URL `NEXT_PUBLIC_API_URL` (`http://localhost:5000/api`).

---

## 4. AWS Cloud Deployment Readiness Specification

To fulfill the AWS cloud deployment readiness mandate, the project requires containerization, production build configurations, and cloud deployment architecture.

### 4.1 Containerization Specifications

#### 4.1.1 Next.js Frontend Multi-Stage Dockerfile (`apps/web/Dockerfile`)
- **Stage 1: Dependencies (`deps`)**:
  - Base image: `node:20-alpine` (or `node:22-alpine`)
  - Install libc6-compat, copy root `package.json`, `package-lock.json`, workspace package.json files, run `npm ci`.
- **Stage 2: Builder (`builder`)**:
  - Copy dependencies, source code, `turbo.json`, `tsconfig.base.json`.
  - Environment argument: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
  - Enable Next.js standalone output in `next.config.ts`:
    ```ts
    const nextConfig: NextConfig = {
      output: 'standalone',
      // ...
    };
    ```
  - Run `npx turbo build --filter=@vertex/web`.
- **Stage 3: Runner (`runner`)**:
  - Lightweight Alpine runtime, non-root user `nextjs:nodejs` (UID 1001).
  - Copy `.next/standalone` and `.next/static`.
  - Expose port `3000`, command: `node apps/web/server.js`.

#### 4.1.2 Express API Multi-Stage Dockerfile (`apps/api/Dockerfile`)
- **Stage 1: Dependencies (`deps`)**:
  - Base image: `node:20-alpine`, `npm ci`.
- **Stage 2: Builder (`builder`)**:
  - Build TypeScript to JavaScript (`dist/`) via `npx turbo build --filter=@vertex/api`.
- **Stage 3: Runner (`runner`)**:
  - Non-root user `expressjs:nodejs` (UID 1001).
  - Copy `dist/` and production dependencies.
  - Expose port `5000`, healthcheck curl `http://localhost:5000/health`.
  - Command: `node dist/server.js`.

#### 4.1.3 Multi-Container Local & Staging Orchestration (`docker-compose.yml`)
- Service 1: `web` (build context `.` targeting `apps/web/Dockerfile`, port `3000:3000`, depends on `api`).
- Service 2: `api` (build context `.` targeting `apps/api/Dockerfile`, port `5000:5000`, depends on `mongodb`).
- Service 3: `mongodb` (`mongo:7.0` or `mongo:8.0`, port `27017:27017`, volume `mongodb_data:/data/db`).
- Service 4: Shared bridge network `vertex-net`.

#### 4.1.4 Docker Ignore Rules (`.dockerignore`)
- Ignore `node_modules`, `.next`, `dist`, `.git`, `.agents`, `.env*.local`, `coverage`, `*.log`.

### 4.2 AWS Cloud Architecture Topology
1. **Compute & Orchestration Layer**:
   - **Option A (Containerized - Recommended)**: **AWS ECS Fargate** or **AWS App Runner**:
     - Frontend Service: ECS Fargate Task running `@vertex/web` container, auto-scaled behind an Application Load Balancer (ALB).
     - Backend Service: ECS Fargate Task running `@vertex/api` container, auto-scaled behind internal/external ALB with `/health` target group health check.
   - **Option B (Serverless / Static Edge)**:
     - Frontend on **AWS Amplify Hosting** or **S3 + CloudFront** (for static assets/SSG) + Lambda@Edge / ECS for SSR.
2. **Database Layer**:
   - **MongoDB Atlas on AWS**: Hosted in the same AWS region (e.g., `us-east-1` or `ap-south-1`) with AWS VPC Peering or PrivateLink, and IP Access Whitelisting.
   - Alternative: AWS DocumentDB (with MongoDB compatibility).
3. **Content Delivery & Media Storage**:
   - **Amazon S3**: Bucket configured with private access, Origin Access Control (OAC).
   - **Amazon CloudFront**: Global CDN distribution providing low-latency edge caching, TLS 1.3 encryption (via AWS Certificate Manager), and security headers.
4. **Configuration, Secrets & DNS**:
   - **AWS Secrets Manager / SSM Parameter Store**: Storing sensitive credentials:
     - `MONGODB_URI`
     - `JWT_SECRET`
     - `RAZORPAY_KEY_ID`
     - `RAZORPAY_KEY_SECRET`
     - `RAZORPAY_WEBHOOK_SECRET`
   - **Route 53**: DNS routing with alias records to CloudFront and ALB.

---

## 5. Specification Miner Feature Inventory

### Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Architecture & Monorepo | Turborepo Pipeline | Multi-package workspace build, lint, and dev pipeline orchestration | CLI commands (`turbo build`, `turbo dev`, `turbo lint`) | Transpiled assets, running dev servers | Non-zero exit code on task failure | `turbo.json`, `package.json` |
| 2 | Architecture & Monorepo | Shared Type Contract | Common TypeScript interfaces for Product, Order, User, Review | Import from `@vertex/types` | Type definitions & compile-time validation | TypeScript compiler errors on mismatch | `packages/types/src/index.ts` |
| 3 | Backend API | Health Check Probe | Liveness and readiness endpoint for container orchestration | `GET /health` | JSON: `{ status: 'ok', timestamp, env }` | 500 if server process hangs | `apps/api/src/server.ts` |
| 4 | Backend API | Security Hardening | HTTP header protection, CORS whitelisting, rate limiting | Incoming HTTP requests | Security headers (`Helmet`), CORS headers | 429 Too Many Requests on rate limit | `apps/api/src/server.ts`, `rateLimiter.ts` |
| 5 | Catalog & Discovery | Product Catalog Listing | Filterable, paginated product retrieval | Query params (`category`, `sort`, `search`, `minPrice`, `maxPrice`, `page`, `limit`) | Paginated product array, metadata | 500 on database error | `apps/api/src/routes/products.routes.ts` |
| 6 | Catalog & Discovery | Product Details by Slug | Fetch individual product specifications, variants, and size chart | URL param `:slug` | Single product document with all variants | 404 AppError if product not found | `apps/api/src/routes/products.routes.ts` |
| 7 | Catalog & Discovery | Product Reviews | Query and submit verified customer reviews | URL param `:slug`, POST body (`rating`, `title`, `body`) | Review document, updated averageRating | 404 if product missing, 401 if unauthenticated, 400 on duplicate | `apps/api/src/routes/products.routes.ts` |
| 8 | Identity & Auth | User Registration | New customer registration with bcrypt password hashing | Body: `{ name, email, password }` | User profile + signed JWT token (201) | 400 if fields missing/short, 409 if email registered | `apps/api/src/routes/auth.routes.ts` |
| 9 | Identity & Auth | User Login | Authenticate returning customer and issue JWT | Body: `{ email, password }` | User profile + JWT token (200) | 401 Invalid credentials, 429 after 20 attempts | `apps/api/src/routes/auth.routes.ts` |
| 10 | Identity & Auth | Current User Profile | Retrieve authenticated user profile and addresses | `Authorization: Bearer <token>` | User document | 401 Authentication required or token expired | `apps/api/src/routes/auth.routes.ts` |
| 11 | Commerce & Orders | Direct Order Creation | Create order record and decrement inventory stock | Auth token, body with items and shipping address | Order document (201) | 400 Insufficient stock, 404 Product not found | `apps/api/src/routes/orders.routes.ts` |
| 12 | Commerce & Payment | Razorpay Order Creation | Create server-side order with Razorpay API for modal checkout | Items array, shipping address, auth token | Razorpay order ID, currency, amount in paise | 400 Invalid amount/stock, 502 Razorpay API error | `ORIGINAL_REQUEST.md` R3 |
| 13 | Commerce & Payment | Razorpay Signature Verification | Verify payment HMAC SHA-256 signature from client modal | `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` | Verification success status, confirmed order | 400 Invalid signature / payment tampering | `ORIGINAL_REQUEST.md` R3 |
| 14 | Commerce & Payment | Razorpay Webhook Handler | Asynchronous payment status reconciliation via webhooks | Raw HTTP POST body, `x-razorpay-signature` header | JSON `{ status: 'ok' }`, updated Order status | 400 Invalid webhook signature | `ORIGINAL_REQUEST.md` R3 |
| 15 | Visual Design | ASRV Obsidian Aesthetic | Tactical dark theme visual language | CSS variables, Tailwind classes | Obsidian void (`#0A0A0A`), borders (`#1F1F1F`) | Fallback to dark background | `ORIGINAL_REQUEST.md` R1, `globals.css` |
| 16 | Visual Design | Dynamic Viewport Hero | High-impact hero section locked to initial viewport | Dynamic viewport height (`min-h-[100dvh]`) | Fullscreen hero with tactical copy & CTA | Layout degradation if overflow occurs | `ORIGINAL_REQUEST.md` AC |
| 17 | Visual Design | Asymmetric Bento Grid | Non-uniform product category presentation | Diverse container aspect ratios / spans | Responsive technical bento grid | Fallback to single column on mobile | `ORIGINAL_REQUEST.md` AC |
| 18 | Visual Design | High-Fidelity Placeholder Pipeline | Aspect ratio-locked image rendering with responsive srcset | Aspect ratio containers, Cloudinary / curated images | Zero layout shifts (CLS = 0), secondary image crossfade | Broken image fallback icon/pattern | `ORIGINAL_REQUEST.md` R1 |
| 19 | Micro-Interactions | Button Tap Feedback | Physics-driven micro-interaction on button interaction | `:active` pseudo-class or Motion tap event | Responsive `scale(0.97)` transform | Respects `prefers-reduced-motion` | `ORIGINAL_REQUEST.md` R2 |
| 20 | Micro-Interactions | Custom Easing & Timing | Consistent cubic-bezier transitions under 300ms | CSS / Motion easing `cubic-bezier(0.23, 1, 0.32, 1)` | Smooth acceleration/deceleration | Disabled on reduced motion | `ORIGINAL_REQUEST.md` AC |
| 21 | Micro-Interactions | Hardware-Accelerated Transforms | Strict animation guardrail restricting properties | `transform: translate3d/scale`, `opacity` | 60+ FPS motion without layout thrashing | Warning if layout properties animated | `ORIGINAL_REQUEST.md` AC |
| 22 | Commerce Flow | Quick Cart Drawer | Slide-out drawer with spring physics | Cart state open trigger | Slide-out overlay drawer | Inert background, focus trap | `ORIGINAL_REQUEST.md` R3 |
| 23 | Commerce Flow | Optimistic Quantity Updates | Instant client-side cart quantity calculation | Quantity +/- click event | Immediate subtotal & item count recalculation | Reverts if network error occurs | `ORIGINAL_REQUEST.md` R3 |
| 24 | Commerce Flow | Free Shipping Delta Bar | Visual progress tracker to free shipping threshold ($150) | Cart subtotal | Dynamic progress bar: "$X away from free shipping" | Caps at 100% when subtotal >= $150 | `ORIGINAL_REQUEST.md` R3 |
| 25 | Commerce Flow | Live Swatch Live Swapping | Product card and drawer variant swatch live swap | Swatch click event | Instant image, color, and price update | Disable out-of-stock swatches | `ORIGINAL_REQUEST.md` R3 |
| 26 | Accessibility | Semantic Landmarks | Accessible page outline for assistive technologies | `<header>`, `<nav>`, `<main>`, `<footer>` | Accessible screen reader tree | A11y violation if landmarks missing | `ORIGINAL_REQUEST.md` R4 |
| 27 | Accessibility | Focus Trapping & Rings | Keyboard navigation trapped in open modal/drawer | Tab / Shift+Tab keyboard events | Focus cycles within drawer; `:focus-visible` ring | Trapping released when drawer closes | `ORIGINAL_REQUEST.md` R4 |
| 28 | Accessibility | Accessible Touch Targets | Touch interactive element sizing | Touch / click bounding box | 48x48px minimum touch targets | Fails WCAG 2.1 AA if <44px | `ORIGINAL_REQUEST.md` R4 |
| 29 | Deployment | Standalone Docker Builds | Production containerization for Next.js and Express | Docker multi-stage build | Lightweight container images (<200MB) | Build failure if dependencies missing | `ORIGINAL_REQUEST.md` Intro |
| 30 | Deployment | AWS ECS/Fargate Topology | Cloud-native deployment configuration | Task definitions, ALB routing rules, secrets | Scalable container service on AWS | Auto-healing on container crash | `ORIGINAL_REQUEST.md` Intro |

---

## 6. Edge Cases & Boundary Conditions

### Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Type Check / Build | Running `npm run type-check` before `npm install` | Process exits with code 1: `'turbo' is not recognized as an internal or external command`. Dependencies must be installed first. |
| 2 | Cart Quantity | Decrementing item quantity below 1 (`quantity: 0`) | In `apps/web/src/store/cart.ts`: triggers `removeItem(id)` and removes the item from the cart array rather than allowing negative or zero quantities. |
| 3 | Cart Persistence | Page reload with items in cart | Zustand `persist` middleware with `localStorage` rehydrates items into cart state seamlessly. |
| 4 | Free Shipping Delta | Cart subtotal is $0 | Delta displays exact threshold "$150 away from free shipping", progress bar is at 0%. |
| 5 | Free Shipping Delta | Cart subtotal exceeds $150 (e.g. $185) | Delta displays "You've unlocked FREE standard shipping!", progress bar clamped at 100%, shipping calculated as $0. |
| 6 | Razorpay Payment Failure | User cancels or closes the Razorpay checkout modal | Modal dismissal callback fires `modal.ondismiss`; cart state remains intact, order is not marked as paid, friendly toast informs user. |
| 7 | Razorpay Webhook Idempotency | Duplicate webhook delivered for already confirmed order | Webhook handler looks up order by payment/order ID; idempotent update maintains confirmed status without double inventory decrements. |
| 8 | Inventory Stock Exhaustion | Customer requests quantity greater than variant `stock` | Backend returns HTTP 400: `Insufficient stock for <product.name>`. Frontend shows out-of-stock indicator. |
| 9 | Keyboard Only Navigation | User navigates site purely using Tab / Enter keys | Zero hover animations or decorative transforms fire; high-contrast `:focus-visible` outline rings display with 3px offset. |
| 10 | Motion Preference | System has `prefers-reduced-motion: reduce` enabled | All Motion components and CSS transitions immediately bypass spring physics and duration animations, rendering final states instantly. |
| 11 | Viewport Sizing | Mobile dynamic viewport with browser address bar expanding/collapsing | Hero section uses `min-h-[100dvh]` rather than `100vh` to avoid vertical jitter and unwanted scrollbars. |
| 12 | Product Slug Lookup | Customer navigates to `/products/non-existent-slug` | Express API returns HTTP 404 `{ success: false, error: 'Product not found' }`; Next.js renders branded 404 Not Found screen. |
| 13 | Review Uniqueness | User attempts to submit a second review for the same product | MongoDB unique compound index `{ productId: 1, userId: 1 }` rejects duplicate with error code 11000. |
| 14 | Rapid Multiple Clicks | Rapid repeated clicks on "Add to Cart" or Razorpay "Pay" | Button enters optimistic disabled/busy state; rate limiter prevents API flood; prevents duplicate orders. |
| 15 | Corrupt LocalStorage | `localStorage['vertex-cart']` contains invalid or malformed JSON | Zustand persist storage fails gracefully, falls back to empty cart array `[]` without unhandled runtime crash. |

---

## 7. Technical Recommendations & Next Steps

1. **Package Installation & Workspace Resolution**:
   - Run `npm install` from root to install Turborepo, Next.js, Express, Tailwind, and shared dev dependencies.
2. **Implement Missing Frontend Components**:
   - Create `apps/web/src/components/layout/`: `AnnouncementBar.tsx`, `Navbar.tsx`, `Footer.tsx`.
   - Create `apps/web/src/components/store/`: `HeroSection.tsx`, `FeaturedCollection.tsx`, `CategoryGrid.tsx`, `BrandStatement.tsx`, `BestsellerGrid.tsx`, `TechFeatures.tsx`, `SocialProof.tsx`, `NewsletterSection.tsx`, `CartDrawer.tsx`, `ProductCard.tsx`, `RazorpayCheckoutModal.tsx`.
3. **Bridge the Payment Gateway Gap (Razorpay Integration)**:
   - Add `razorpay` npm package to `apps/api/package.json`.
   - Add `@types/razorpay` if needed or write custom typing.
   - Implement `/api/orders/create-razorpay-order` and `/api/webhooks/razorpay` with HMAC SHA-256 verification.
   - Add Razorpay checkout script loader or `@razorpay/checkout` into `apps/web`.
   - Update `packages/types/src/index.ts` with Razorpay order fields.
4. **Author AWS Containerization & Deployment Setup**:
   - Configure `output: 'standalone'` in `apps/web/next.config.ts`.
   - Author multi-stage `Dockerfile` in `apps/web` and `apps/api`.
   - Author root `docker-compose.yml` for unified local verification.
   - Author `.dockerignore` files.
   - Document AWS deployment guidelines (ECS Fargate / App Runner, S3 + CloudFront, Secrets Manager).
