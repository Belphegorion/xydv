# Project: VERTEX Technical Fashion (ASRV-Inspired MERN E-Commerce)

## Architecture
- **Monorepo Architecture**: Turborepo workspace managing:
  - `apps/web`: Next.js 15.3 (App Router), React 19, Tailwind CSS v4, Motion v12, Zustand 5, Phosphor Icons.
  - `apps/api`: Express 5, Node.js, Mongoose 8 / MongoDB, Razorpay Node SDK, crypto HMAC-SHA256.
  - `packages/types`: Shared TypeScript schemas and contracts (`@vertex/types`).
- **Design Triumvirate Standards**:
  - Impeccable + Taste-Skill: `#0A0A0A` obsidian void, `#111111` surface, `#181818` elevated, `#1F1F1F` modular borders, `#E8FF00` volt yellow accent (18.4:1 contrast), sharp brutalist corner-radius (0px), technical typography.
  - Emil Design Engineering / Animate: `scale(0.97)` :active push feedback, `cubic-bezier(0.23, 1, 0.32, 1)` easing strictly <300ms, `transform` and `opacity` compositor-only animations, no `scale(0)` entrances, prefers-reduced-motion fallback, zero animations on keyboard-only navigation.
  - WCAG 2.1 AA Accessibility: Semantic landmarks, single H1, `:focus-visible` volt rings, focus trap in drawer/modals, 48x48px min touch targets.
- **Commerce & Payment Architecture**:
  - Zustand cart store with `'vertex-cart'` localStorage persistence, optimistic updates, $150 free-shipping delta progress, in-drawer live color/size swatch swaps.
  - Native Razorpay SDK integration: backend order creation (`POST /api/orders/razorpay/create-order`), checkout modal invocation via `checkout.js` with test credentials, payment verification (`POST /api/orders/razorpay/verify-payment`) with HMAC-SHA256, and webhook reconciliation (`POST /api/webhooks/razorpay`).
- **Cloud & Deployment Architecture**:
  - Multi-stage containerization for Next.js standalone and Express API.
  - Docker Compose for unified local and staging orchestration.
  - AWS cloud readiness: ECS Fargate task definitions, CloudFront/S3 CDN distribution, Secrets Manager integration.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Monorepo Setup & Package Resolution | Install dependencies across workspaces, configure Turborepo pipelines | M1 | Workspace Survey |
| 2 | Razorpay Dependency & Type Definitions | Add `razorpay` to api, `@types/razorpay` or custom types in `packages/types` | M1 | ORIGINAL_REQUEST §R3 |
| 3 | Core Data Contracts & Schemas | Shared types for Product, Order, Razorpay, Cart, User in `packages/types` | M1 | Survey Spec |
| 4 | Razorpay Order Creation API | `POST /api/orders/razorpay/create-order` with server-side price validation | M2 | ORIGINAL_REQUEST §R3 |
| 5 | Razorpay Payment Verification API | `POST /api/orders/razorpay/verify-payment` using crypto HMAC-SHA256 | M2 | ORIGINAL_REQUEST §R3 |
| 6 | Razorpay Webhook Reconciliation API | `POST /api/webhooks/razorpay` with raw body parsing and idempotency | M2 | ORIGINAL_REQUEST §R3 |
| 7 | Product Catalog API & Seed Script | Express routes for products/categories and seed data with technical assets | M2 | Workspace Survey |
| 8 | Order Model & Database Persistence | Mongoose schemas with `razorpayOrderId`, `razorpayPaymentId`, `paymentStatus` | M2 | Survey Explorer 3 |
| 9 | Tactical Design Tokens & Global CSS | `#0A0A0A` void, `#1F1F1F` borders, `#E8FF00` volt, typography, focus rings | M3 | ORIGINAL_REQUEST §R1 |
| 10 | Header & Announcement Bar | `<header>`, `<nav>`, tactical announcement banner with free shipping ticker | M3 | Survey Explorer 2 |
| 11 | Tactical Navbar & Accessible Navigation | Semantic navbar, search/cart trigger buttons with 48px targets & aria-labels | M3 | ORIGINAL_REQUEST §R4 |
| 12 | Dynamic Viewport Hero Section | Strictly `min-h-[100dvh]` fit without initial fold scroll overflow | M3 | ORIGINAL_REQUEST §AC |
| 13 | Asymmetric Bento Category Grid | 5-cell diverse container proportions (16:10, 3:4, 16:9, 1:1, full-width) | M3 | ORIGINAL_REQUEST §AC |
| 14 | Technical Brand Statement & Tech Features | Tactical narrative component, fabric engineering specs (Cordura, Gore-Tex) | M3 | Survey Explorer 2 |
| 15 | Semantic Footer & Newsletter | `<footer>` landmark, newsletter subscription, tactical status badge | M3 | ORIGINAL_REQUEST §R4 |
| 16 | Tactical Button & Micro-Interactions | `scale(0.97)` :active push feedback, `cubic-bezier(0.23, 1, 0.32, 1)`, <300ms | M3 | ORIGINAL_REQUEST §R2 |
| 17 | Aspect-Locked Product Card | `aspect-[3/4]` container, tactical badge, pricing, stock indicators | M4 | ORIGINAL_REQUEST §R1 |
| 18 | Secondary-Image Crossfade on Hover | 300ms hardware-accelerated image crossfade running on GPU compositor | M4 | ORIGINAL_REQUEST §AC |
| 19 | Real-Time Color Swatch Live Swap | Instant product card image and colorway updates on swatch hover/click | M4 | ORIGINAL_REQUEST §AC |
| 20 | Featured Collection & Bestseller Grids | Dynamic product grid with filtering, tactical sorting, and quick add | M4 | Survey Explorer 2 |
| 21 | Social Proof & Community Testimonials | Tactical athlete reviews, modular grid cards, verified tags | M4 | Survey Explorer 2 |
| 22 | Slide-Out Quick Cart Drawer | Spring physics opening (`stiffness: 350, damping: 35`), backdrop blur | M5 | ORIGINAL_REQUEST §R3 |
| 23 | Free-Shipping Delta Indicator | Visual progress bar calculating `$150 - subtotal` with motivational copy | M5 | ORIGINAL_REQUEST §R3 |
| 24 | Optimistic Cart Quantity Updates | Instant quantity +/- and item removal with local bounds clamping | M5 | ORIGINAL_REQUEST §R3 |
| 25 | In-Drawer Variant Swatch Swaps | Live size and colorway swapping directly inside the cart drawer | M5 | ORIGINAL_REQUEST §R3 |
| 26 | Cart Local Storage Persistence | Robust hydration from `'vertex-cart'`, subtotal, tax, and discount engine | M5 | ORIGINAL_REQUEST §AC |
| 27 | Focus Trap & WCAG Modal Semantics | `role="dialog"`, `aria-modal="true"`, Tab/Shift+Tab trapping, Escape to close | M5 | ORIGINAL_REQUEST §R4 |
| 28 | Native Razorpay Modal Checkout Invocation | Load `checkout.js`, launch dark-void modal with test credentials, handle auth | M5 | ORIGINAL_REQUEST §R3, AC |
| 29 | Multi-Stage Dockerization | Production Dockerfiles for Next.js standalone and Express API | M6 | ORIGINAL_REQUEST §Mission |
| 30 | Docker Compose Orchestration | `docker-compose.yml` networking MongoDB, API, and Web with health checks | M6 | ORIGINAL_REQUEST §Mission |
| 31 | AWS Cloud Deployment Architecture | ECS Fargate task definitions, CloudFront distribution configs, build scripts | M6 | ORIGINAL_REQUEST §Mission |
| 32 | E2E Test Suite Pass (Tiers 1-4) | Pass 100% of requirement-driven opaque-box tests from E2E Testing Track | M7 | Project Orchestrator |
| 33 | Adversarial Coverage Hardening (Tier 5) | White-box stress testing, edge-case generation, zero-gap verification | M7 | Project Orchestrator |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Foundation, Dependencies & Type System | Monorepo package resolution, Razorpay migration in types/packages, shared data contracts | none | DONE |
| M2 | Backend API & Razorpay Payment Engine | Product endpoints, Razorpay create-order, verify-payment, webhooks, Mongoose models, catalog seed | M1 | PLANNED |
| M3 | Design System, Layout & ASRV Visual Foundation | Tokens (#0A0A0A, #1F1F1F, #E8FF00), 100dvh Hero, Bento Grid, Header/Navbar/Footer, Button micro-interactions | M1 | PLANNED |
| M4 | Catalog Components, Motion Crossfades & Swatches | ProductCard with secondary-image crossfade, real-time swatch swaps, Featured & Bestseller grids | M3 | PLANNED |
| M5 | Slide-Out Quick Cart Drawer & Razorpay Checkout | Spring drawer, free shipping delta, optimistic updates, swatch swaps, Razorpay modal checkout | M2, M4 | PLANNED |
| M6 | AWS Cloud Deployment Readiness | Multi-stage Dockerfiles, Next standalone, docker-compose, AWS ECS/CloudFront configs | M2, M5 | PLANNED |
| M7 | Final Milestone: E2E Verification & Adversarial Hardening | Pass 100% E2E tests (Tiers 1-4) published by E2E Testing Track, then Tier 5 adversarial hardening | M6, TEST_READY.md | PLANNED |

---

## Interface Contracts

### 1. `packages/types` ↔ `apps/api` & `apps/web`
```typescript
export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  tags: string[];
  specs: { label: string; value: string }[];
  variants: ProductVariant[];
  images: { url: string; alt: string; isPrimary: boolean; isSecondary: boolean }[];
  inStock: boolean;
  featured?: boolean;
  bestseller?: boolean;
}

export interface ProductVariant {
  id: string;
  colorName: string;
  colorHex: string;
  size: string;
  sku: string;
  stock: number;
  imageUrl: string;
  secondaryImageUrl?: string;
}

export interface CartItem {
  id: string; // unique item id (productId + variantId)
  productId: string;
  name: string;
  price: number;
  image: string;
  secondaryImage?: string;
  variant: ProductVariant;
  quantity: number;
  maxStock: number;
}

export interface RazorpayOrderPayload {
  items: { productId: string; variantId: string; quantity: number }[];
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export interface RazorpayOrderResponse {
  success: boolean;
  orderId: string; // Internal order id
  razorpayOrderId: string; // Razorpay order id (order_...)
  amount: number; // in paise (INR) or cents
  currency: string;
  keyId: string;
}

export interface RazorpayVerificationPayload {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}
```

### 2. Frontend ↔ Razorpay SDK (`checkout.js`)
```javascript
const options = {
  key: razorpayKeyId,
  amount: orderAmount,
  currency: 'INR',
  name: 'VERTEX TECHNICAL',
  description: 'Technical Activewear Order',
  image: '/logo.svg',
  order_id: razorpayOrderId,
  handler: function (response) {
    // response.razorpay_payment_id
    // response.razorpay_order_id
    // response.razorpay_signature
  },
  prefill: { name: user.name, email: user.email, contact: user.phone },
  theme: { color: '#0A0A0A' },
  modal: { ondismiss: function() { ... } }
};
```

---

## Code Layout
```
project-v1/
├── apps/
│   ├── api/
│   │   ├── Dockerfile
│   │   ├── src/
│   │   │   ├── config/ (database, env, razorpay)
│   │   │   ├── models/ (Product, Order, User)
│   │   │   ├── routes/ (products, orders, webhooks)
│   │   │   ├── controllers/ (products, razorpay)
│   │   │   └── scripts/ (seed)
│   │   └── package.json
│   └── web/
│       ├── Dockerfile
│       ├── next.config.ts (output: 'standalone')
│       ├── src/
│       │   ├── app/ (globals.css, layout.tsx, page.tsx, providers.tsx)
│       │   ├── components/
│       │   │   ├── layout/ (AnnouncementBar, Navbar, Footer)
│       │   │   ├── store/ (HeroSection, CategoryGrid, ProductCard, CartDrawer, etc.)
│       │   │   └── ui/ (Button, Badge, Swatch)
│       │   ├── lib/ (razorpay, utils)
│       │   └── store/ (cart.ts)
│       └── package.json
├── packages/
│   └── types/
│       ├── src/ (index.ts, product.ts, order.ts, cart.ts, razorpay.ts)
│       └── package.json
├── docker-compose.yml
├── .dockerignore
├── turbo.json
└── package.json
```
