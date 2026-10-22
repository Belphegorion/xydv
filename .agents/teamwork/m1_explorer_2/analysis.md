# Milestone 1: packages/types Investigation & Type System Architecture Analysis

**Agent**: `m1_explorer_2` (teamwork_preview_explorer)  
**Date**: 2026-10-04  
**Target Package**: `packages/types` (`@vertex/types`)  
**Project Root**: `c:\Users\atlas\OneDrive\ドキュメント\project-v1`  
**Reference Specs**: `ORIGINAL_REQUEST.md`, `orchestrator_1/PROJECT.md`

---

## 1. Executive Summary

This investigation audits the current state of `packages/types`, examines the cross-package type synchronization across `apps/api` and `apps/web`, designs the exact TypeScript contracts required for the VERTEX technical fashion e-commerce platform, and verifies TypeScript compilation requirements under Turborepo and npm workspaces.

### Key Discoveries:
1. **Missing `tsconfig.json`**: `packages/types` currently has no `tsconfig.json` file. Executing `tsc` or `npm run type-check` fails immediately.
2. **Monolithic & Outdated File**: `packages/types` contains only a single monolithic `src/index.ts` (137 lines). It lacks the modular architecture outlined in `PROJECT.md` (`src/product.ts`, `src/order.ts`, `src/cart.ts`, `src/razorpay.ts`, `src/index.ts`).
3. **No Razorpay Types in Shared Package**: `packages/types` currently contains zero Razorpay types, and instead retains legacy Stripe identifiers (`paymentIntentId`).
4. **Missing Workspace Linkage**: Neither `apps/api/package.json` nor `apps/web/package.json` includes `"@vertex/types": "*"` in their dependencies. Both applications currently duplicate partial types locally (`apps/web/src/types/index.ts`, `apps/api/src/models/*`).
5. **Missing Build Script & Outputs**: `packages/types/package.json` points to `"main": "./src/index.ts"` without a build script, declaration output (`dist/`), or package `exports` map. This causes CommonJS resolution issues when `apps/api` compiles with `tsc` in Node resolution mode.

---

## 2. Current State Audit: `packages/types`

### 2.1 File System Structure
```
packages/types/
├── package.json          # 14 lines, missing build script & exports
└── src/
    └── index.ts          # 137 lines, monolithic, outdated Stripe-era types
```

### 2.2 `packages/types/package.json` Analysis
```json
{
  "name": "@vertex/types",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

#### Deficiencies Identified:
- **No `build` script**: `turbo.json` configures `"build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**", "dist/**"] }`. Because `@vertex/types` does not define a `"build"` script or emit to `dist/**`, dependent packages cannot consume compiled `.d.ts` / `.js`.
- **Legacy Module Fields**: Only `"main"` and `"types"` pointing to raw `.ts` files. Modern Node.js and bundlers require standard `"exports"` map.
- **Node Module Resolution Incompatibility**: `apps/api/tsconfig.json` specifies:
  ```json
  "module": "CommonJS",
  "moduleResolution": "node"
  ```
  In standard TypeScript CommonJS compilation, referencing a package whose `main` points directly to an uncompiled `.ts` file inside `node_modules` causes `tsc` resolution failure unless compiled outputs (`dist/index.js`, `dist/index.d.ts`) exist or path aliases are configured.

### 2.3 `tsconfig.json` Gap & Verification Test
- `packages/types/tsconfig.json` does **NOT exist**.
- Direct verification with `tsc --noEmit` inside `packages/types`:
  ```
  Command: tsc --noEmit
  Output: Exits with code 1 (prints usage instructions because no tsconfig.json is present).
  ```
- Root configuration `tsconfig.base.json` exists at workspace root:
  ```json
  {
    "$schema": "https://json.schemastore.org/tsconfig",
    "display": "Default",
    "compilerOptions": {
      "strict": true,
      "strictNullChecks": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true,
      "moduleDetection": "force",
      "lib": ["ES2022"],
      "target": "ES2022",
      "module": "ESNext",
      "moduleResolution": "bundler"
    }
  }
  ```
- **Resolution**: `packages/types/tsconfig.json` must be created, extending `../../tsconfig.base.json`, with `"composite": true`, `"declaration": true`, `"outDir": "./dist"`, and `"rootDir": "./src"`.

---

## 3. Discrepancy & Gap Analysis Across Repositories

| Entity / Property | `packages/types/src/index.ts` | `apps/web/src/types/index.ts` | `apps/web/src/store/cart.ts` | `apps/api/src/models/` & `seed.ts` | `PROJECT.md` §Interface Contracts | Target Resolution |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ProductVariant ID** | `_id: string` | `_id: string` | `id: string` | `sku` (no explicit id) | `id: string` | Support both `id: string` and optional `_id?: string` |
| **Variant Color Label** | `color: string` | `color: string` | `color: string` | `color: string` | `colorName: string` | `color: string; colorName?: string` |
| **Variant Images** | `images: string[]` | `images: string[]` | `image: string` | `images: string[]` | `imageUrl: string; secondaryImageUrl?: string` | Provide `images: string[]`, `imageUrl?: string`, `secondaryImageUrl?: string` |
| **Product Specs** | Not present | Not present | Not present | Not present | `specs: { label: string; value: string }[]` | Add `ProductSpec[]` |
| **Product Images** | Not present (only in variant) | Not present | Not present | Not present | `images: { url: string; alt: string; isPrimary: boolean; isSecondary: boolean }[]` | Add `ProductImage[]` |
| **CartItem** | Not defined | Not defined | Custom store interface | N/A | Dedicated interface with `maxStock`, `variant` | Unify with `maxStock`, `variant`, `sku`, `color`, `size` |
| **ShippingDelta** | Missing | Missing | Missing | Missing | Mentioned in §R3 / §AC ($150 threshold) | Define dedicated `ShippingDelta` interface |
| **Razorpay Payloads** | Completely missing | Missing | Missing | Missing (Stripe only) | Defined in §Interface Contracts | Add complete Razorpay client & server payloads |
| **Razorpay Webhooks** | Missing | Missing | Missing | Stripe webhook only | Defined in Feature 6 | Define `RazorpayWebhookEvent` & entities |
| **PaymentStatus** | Missing | Missing | Missing | Missing | Defined in Feature 8 | Add `'pending' \| 'authorized' \| 'captured' \| 'paid' \| 'failed' \| 'refunded'` |
| **ShippingAddress** | Named `Address` with `line1` | Named `Address` with `line1` | N/A | Nested object with `line1` | Has `street` in Razorpay payload | Unify `ShippingAddress` with `line1` and `street?: string` alias |

---

## 4. Exact TypeScript Definitions Specification

To align with `PROJECT.md` line 198, the package should be organized into modular domain files:
```
packages/types/src/
├── product.ts
├── cart.ts
├── razorpay.ts
├── order.ts
└── index.ts
```

### 4.1 Domain 1: Products, Variants, Categories & Inventory Specs (`src/product.ts`)

```typescript
/**
 * Product, Variant, Category, and Inventory Specifications
 */

export const PRODUCT_CATEGORIES = ['tops', 'bottoms', 'outerwear', 'accessories'] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'] as const;
export type Size = (typeof SIZES)[number] | string;

export interface ProductSpec {
  label: string; // e.g., "Fabric", "Waterproof Rating", "Weight", "Technology"
  value: string; // e.g., "Cordura® 500D Ripstop", "20,000mm DWR", "280 GSM", "AeroFlex"
}

export interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
  isSecondary: boolean; // Used for secondary-image hover crossfade
}

export interface ProductVariant {
  id: string;
  _id?: string;
  sku: string;
  color: string;
  colorName?: string; // Descriptive colorway (e.g., "Void Black", "Ash Grey")
  colorHex: string;
  size: string;
  price: number;
  compareAt?: number;
  stock: number;
  images: string[];
  imageUrl: string;
  secondaryImageUrl?: string;
  video?: string;
}

export interface InventorySpec {
  sku: string;
  stock: number;
  inStock: boolean;
  lowStockThreshold?: number;
  isLowStock?: boolean;
  reservedStock?: number;
  availableStock?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image: string;
  itemCount?: number;
  featured?: boolean;
  aspectRatio?: '16:10' | '3:4' | '16:9' | '1:1' | 'full'; // Asymmetric bento grid proportions
}

export interface Product {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: ProductCategory | string;
  tags: string[];
  specs: ProductSpec[];
  variants: ProductVariant[];
  images: ProductImage[];
  features?: string[];
  materials?: string[];
  sizeChart?: Record<string, Record<string, string>>;
  inStock: boolean;
  featured?: boolean;
  isFeatured?: boolean;
  bestseller?: boolean;
  isPublished?: boolean;
  averageRating?: number;
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFilters {
  category?: string;
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'popular';
  page?: number;
  limit?: number;
  search?: string;
}
```

---

### 4.2 Domain 2: Cart, Cart Items, Cart State & Shipping Delta (`src/cart.ts`)

```typescript
/**
 * Shopping Cart, Cart Items, Cart State, and Free Shipping Delta Progress
 */
import type { ProductVariant } from './product';

export interface CartItem {
  id: string; // Unique item identifier: `${productId}-${variantId}` or `${productId}-${sku}`
  productId: string;
  slug?: string;
  name: string;
  price: number;
  compareAt?: number;
  image: string;
  secondaryImage?: string;
  sku: string;
  color: string;
  colorHex: string;
  size: string;
  quantity: number;
  maxStock: number; // Stock ceiling for optimistic bounds clamping
  variant?: ProductVariant; // Full variant reference for live drawer swatch swapping
}

export interface ShippingDelta {
  threshold: number; // Free shipping threshold in currency units (default: 150 USD)
  currentSubtotal: number;
  amountRemaining: number; // Math.max(0, threshold - currentSubtotal)
  progressPercentage: number; // 0 to 100 clamped progress
  isEligibleForFreeShipping: boolean;
  message: string; // e.g. "Add $42.00 more for FREE express shipping" or "FREE EXPRESS SHIPPING UNLOCKED"
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
  shippingDelta: ShippingDelta;
}
```

---

### 4.3 Domain 3: Razorpay Payment Contracts (`src/razorpay.ts`)

```typescript
/**
 * Razorpay Payment Gateway Contracts: Orders, Verification, Webhooks & Checkout Modal
 */
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
  orderId: string; // Internal Order ID (MongoDB ObjectId)
  razorpayOrderId: string; // Razorpay order identifier (`order_...`)
  amount: number; // Amount in smallest currency units (paise for INR, cents for USD)
  currency: string; // 'INR' or 'USD'
  keyId: string; // Razorpay Publishable Key ID for client checkout.js
}

export interface RazorpayVerificationPayload {
  orderId: string; // Internal Order ID
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

export type RazorpayWebhookEventType =
  | 'payment.authorized'
  | 'payment.captured'
  | 'payment.failed'
  | 'order.paid'
  | 'refund.processed'
  | 'refund.failed';

export interface RazorpayPaymentEntity {
  id: string; // `pay_...`
  entity: 'payment';
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  order_id: string; // `order_...`
  invoice_id?: string | null;
  international: boolean;
  method: 'card' | 'netbanking' | 'wallet' | 'emi' | 'upi';
  amount_refunded: number;
  refund_status?: string | null;
  captured: boolean;
  description?: string;
  card_id?: string | null;
  bank?: string | null;
  wallet?: string | null;
  vpa?: string | null;
  email: string;
  contact: string;
  fee?: number;
  tax?: number;
  error_code?: string | null;
  error_description?: string | null;
  error_source?: string | null;
  error_step?: string | null;
  error_reason?: string | null;
  created_at: number; // Unix timestamp
}

export interface RazorpayOrderEntity {
  id: string; // `order_...`
  entity: 'order';
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt?: string;
  status: 'created' | 'attempted' | 'paid';
  attempts: number;
  notes: Record<string, string | number>;
  created_at: number;
}

export interface RazorpayWebhookEvent {
  entity: 'event';
  account_id: string;
  event: RazorpayWebhookEventType;
  contains: string[];
  payload: {
    payment?: {
      entity: RazorpayPaymentEntity;
    };
    order?: {
      entity: RazorpayOrderEntity;
    };
    [key: string]: unknown;
  };
  created_at: number;
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

### 4.4 Domain 4: Orders, Status, Shipping Address (`src/order.ts`)

```typescript
/**
 * Order Management, Fulfillment Status, and Shipping Details
 */

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'paid'
  | 'failed'
  | 'refunded';

export interface ShippingAddress {
  fullName: string;
  email?: string;
  phone: string;
  line1: string;
  street?: string; // Optional alias for line1 for payload compatibility
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export type Address = ShippingAddress; // Backward-compatibility alias

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  _id: string;
  id?: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: ShippingAddress;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentIntentId?: string; // Retained for backward compatibility
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### 4.5 Common API & User Contracts (`src/common.ts` / `src/index.ts`)

```typescript
/**
 * Common API Response, User, and Review Contracts
 */

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  avatar?: string;
  loyaltyPoints: number;
  createdAt: string;
}

export interface Review {
  _id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}
```

### 4.6 Unified Package Entrypoint (`src/index.ts`)

```typescript
/**
 * VERTEX Shared Type System (@vertex/types)
 */

export * from './product';
export * from './cart';
export * from './razorpay';
export * from './order';
export * from './common';
```

---

## 5. Compilation & Build Configuration Requirements

### 5.1 Proposed `packages/types/tsconfig.json`
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 5.2 Proposed `packages/types/package.json`
```json
{
  "name": "@vertex/types",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit",
    "clean": "node -e \"require('fs').rmSync('dist', { recursive: true, force: true })\""
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

### 5.3 Turborepo Pipeline Integration (`turbo.json`)
In `turbo.json`:
```json
"tasks": {
  "build": {
    "dependsOn": ["^build"],
    "inputs": ["$TURBO_DEFAULT$", ".env*"],
    "outputs": [".next/**", "!.next/cache/**", "dist/**"]
  },
  "type-check": {
    "dependsOn": ["^type-check"]
  }
}
```
When `apps/web` or `apps/api` builds:
1. Turborepo evaluates `"dependsOn": ["^build"]`.
2. It detects `@vertex/types` as an upstream dependency.
3. Turborepo runs `npm run build` in `packages/types`, which runs `tsc` and populates `packages/types/dist/`.
4. Downstream `apps/api` (`tsc --project tsconfig.json`) and `apps/web` (`next build`) immediately receive valid `.d.ts` declaration files.

### 5.4 Cross-Workspace Linkage Update Needed
In `apps/api/package.json`:
```json
"dependencies": {
  "@vertex/types": "*",
  ...
}
```
In `apps/web/package.json`:
```json
"dependencies": {
  "@vertex/types": "*",
  ...
}
```

---

## 6. Implementation Action Plan for Milestone 1 Implementer

1. **Create `packages/types/tsconfig.json`**:
   - Extend `../../tsconfig.base.json`.
   - Set `rootDir: "./src"`, `outDir: "./dist"`, `declaration: true`, `composite: true`.
2. **Refactor `packages/types/src` into Modular Files**:
   - `packages/types/src/product.ts`
   - `packages/types/src/cart.ts`
   - `packages/types/src/razorpay.ts`
   - `packages/types/src/order.ts`
   - `packages/types/src/common.ts`
   - `packages/types/src/index.ts` (barrel re-export)
3. **Update `packages/types/package.json`**:
   - Add `"build": "tsc"` script.
   - Configure `"main"`, `"types"`, and `"exports"` targeting `./dist/`.
4. **Link `@vertex/types` in Workspaces**:
   - Add `"@vertex/types": "*"` to `apps/api/package.json` and `apps/web/package.json`.
5. **Compile & Verify**:
   - Run `npm run build` inside `packages/types`.
   - Run `npm run type-check` across the monorepo via `turbo type-check`.
