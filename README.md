# XYDV Luxury Performance Storefront — Monorepo Architecture

> **Engineering for the Relentless.** A tactical luxury performance e-commerce platform blending architectural minimalism, physical spring mechanics, and high-performance engineering.

[![Next.js 15.3](https://img.shields.io/badge/Next.js-15.3-black?logo=nextdotjs)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-black?logo=react)](https://react.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Motion v12](https://img.shields.io/badge/Motion-v12-black?logo=framer)](https://motion.dev)
[![Express 5](https://img.shields.io/badge/Express-5-black?logo=express)](https://expressjs.com)
[![TypeScript 5.7](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://typescriptlang.org)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.5-EF4444?logo=turborepo)](https://turbo.build)
[![Tests Passing](https://img.shields.io/badge/Tests-159%2F159%20Passing-brightgreen)](./TEST_READY.md)

---

## Executive Summary

**XYDV** (formerly codenamed VERTEX Technical Division) is an elite high-performance technical apparel storefront engineered to deliver gallery-grade editorial aesthetics with sub-second execution speeds. Designed according to strict anti-slop frontend discipline, Emil Kowalski micro-interaction physics, and WCAG AAA accessibility standards, the storefront combines stepped-ladder scroll animations, 3D alpha brand emblems, and hermetic full-stack commerce workflows.

---

## Architecture Overview

The repository is organized as an enterprise-grade Turborepo monorepo:

```
project-v1/
├── apps/
│   ├── web/                           # Next.js 15.3 App Router frontend (→ Vercel)
│   │   ├── src/
│   │   │   ├── app/                   # App Router pages, layout, icons, loading states
│   │   │   ├── components/
│   │   │   │   ├── layout/            # Navbar (3D WebP emblem), AnnouncementBar, Footer
│   │   │   │   ├── store/             # HeroSection, CollectionShowcase, BentoGrid, CartDrawer
│   │   │   │   └── ui/                # Button, Badge, MetricTicker, SmoothCursor, LoadingSymbol
│   │   │   ├── store/                 # Zustand persistent cart & wishlist state stores
│   │   │   └── lib/                   # Emil Kowalski motion physics (EMIL_EASE), telemetry, sound
│   │   ├── public/
│   │   │   ├── animations/hero/       # 20-frame Full HD (1080p) CAD exploded hoodie canvas sequence
│   │   │   ├── brand/                 # 3D rotating transparent WebP emblem, dual-theme tab icons
│   │   │   └── lookbook/              # 78 high-resolution authentic photography assets
│   │   └── DESIGN.md                  # Comprehensive Design System & Motion Specification
│   └── api/                           # Express 5 backend microservice (→ Railway / Container)
│       └── src/                       # Catalog authority, Razorpay order engine, HMAC verification
├── packages/
│   └── types/                         # Shared TypeScript schemas (Cart, Product, Razorpay, Auth)
├── tests/                             # 159-test hermetic offline verification suite
│   ├── runner.mjs                     # 99-test 4-Tier E2E automated test runner
│   ├── harness/                       # Contract validators, DOM/Zustand simulator, order engine
│   ├── e2e/                           # Tier 1-4 comprehensive integration suites
│   ├── m3-empirical-design-system-challenge.test.mjs  # 23 design system & token tests
│   ├── collection-showcase.test.mjs   # 12 ASRV evergreen showcase tests
│   ├── loading-screens.test.mjs       # 9 brand asset & loading screen tests
│   └── boundary-stress.test.mjs       # 16 boundary condition & arithmetic stress tests
├── TEST_INFRA.md                      # Complete testing methodology & infrastructure spec
├── TEST_READY.md                      # Test suite status & verification execution log
├── VERCEL_DEPLOYMENT_GUIDE.md         # Dedicated Vercel deployment guide
├── turbo.json                         # Turborepo task orchestration pipeline
└── package.json                       # Root workspace definitions & unified scripts
```

---

## Core Feature Specifications

### 1. 20-Frame Scroll-Linked Hero Canvas (`replace 3d`)
- **Interactive Sequence**: 20 high-fidelity Full HD (1080p, 1920x1080) top-anchored frames (`ezgif-frame-001.jpg` through `ezgif-frame-020.jpg`) illustrating a CAD exploded tactical hoodie during vertical scroll.
- **Two-Pass Decimation Preloader**: Employs `KEYFRAME_STRIDE = 4` to immediately download and cache 6 keyframes for instant smooth scrubbing, followed by seamless background hydration of intermediate frames.
- **Top-Anchored Zero Scrim**: Renders directly on pure canvas with zero muddy black scrim overlays or layout reflows.
- **Stepped Ladder Typography**: Technical textile specifications (`SWEATSHIELD+`, `CORDURA® RIPSTOP`, `WARP-KNIT STRETCH`) appear sequentially as the garment deconstructs, culminating in the brand thesis (`ENGINEERED FOR THE RELENTLESS`) at the scrub climax.
- **Mobile Centering Geometry**: Responsive focal scaling calculation (`focalX = 0.50`, `focalY = 0.50`) dynamically anchors the garment center across iPhone 14, SE, Pixel 7, and landscape viewport orientations.
- **Synchronized Navbar Orchestration**: Navbar remains transparent during hero scrubbing to showcase the garment deconstruction, transitioning to elevated frosted glass once scrolling passes the hero section.
- **Monospace Telemetry Ticker**: Real-time heads-up display showcasing frame index (`[001 / 020]`), scrub progress percentage, and compression telemetry.

### 2. 3D Transparent WebP Brand Emblem & Identity
- **Transparent Rotating WebP**: Built from `xydv-logo-nobg.webp` (336 KB) utilizing true 8-bit alpha transparency and a cropped 360° rotation envelope, eliminating zoom hacks or canvas clipping.
- **Dual-Theme Tab Icons**: Next.js App Router metadata configured with dynamic media queries:
  - Light mode: `xydv-logo.png` (high-contrast obsidian glyph)
  - Dark mode: `xydv-logo-outline.png` (luminescent titanium outline glyph)
  - Universal fallback: `favicon.ico` and 180x180 Apple Touch icons.

### 3. Commercial Grids & ASRV Evergreen Showcase
- **3-Column Category Showcase (`CollectionShowcase.tsx`)**:
  - Faithful 3-column layout (`RUN`, `TRAIN` featuring `ASRV-WOMENS-133.jpg`, `REC`).
  - Semantic `<picture>` elements with responsive `<source>` queries and unoccluded midtone directional scrims.
  - Dual tactile pill action buttons (**Men** and **Women**) with `active:scale-[0.97]` press physics and high-contrast focus rings.
  - Desktop hover reveal with delayed 75ms image zoom and mobile tap-to-reveal direct access.
- **Asymmetric 5-Cell Bento Grid (`CategoryGrid.tsx`)**:
  - Enforces aspect ratios: `16:10`, `3:4`, `16:9`, `1:1`, and `full-width`.
  - Ambient cursor-following `<BentoSpotlightCard>` using direct CSS variables (`--spotlight-x`, `--spotlight-y`) for zero React re-renders.
  - Pointer capability gating: skips listeners and forces 0 opacity on non-fine pointer devices.
  - Monochrome hover inversion with 21:1 AAA contrast and 4px northeast arrow surge.
- **Product Cards**: Strict 3:4 portrait ratios, multi-image gallery tracks with touch swipe and trackpad support, 180ms secondary image crossfade, and quick-size selector HUD.
- **Lookbook Gallery**: 78 authentic high-resolution photography assets extracted directly from `XYDV_Apparel_Lookbook.pptx`.

### 4. Dual-Theme Loading Screens & Suspense Architecture
- **Initial App Bootloader (`InitialLoadingScreen.tsx`)**: Displays dual-theme brand emblem, GPU-accelerated progress bar, telemetry metrics ticker, and seamless spring unmount.
- **Route Transition Suspense (`loading.tsx`)**: Dedicated App Router loading state integrating `LoadingSymbol` with instant theme synchronization.

### 5. Commerce Engine & Cart Drawer
- **Quick Cart Drawer**: Slide-out drawer with dynamic viewport height (`100dvh`), iOS safe area inset support (`pb-[max(1.5rem,env(safe-area-inset-bottom))]`), and Emil Kowalski spring mechanics.
- **Free Shipping Delta**: Dynamic $150 threshold engine with real-time remaining delta calculation and progress bar.
- **Authoritative Server Pricing**: Client price tampering neutralized via server-side catalog price lookup.
- **Razorpay Integration**: Server order generation in paise, HMAC-SHA256 signature validation with `crypto.timingSafeEqual`, and idempotent webhook handling.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | Next.js 15.3 (App Router, React Server Components, Server Actions) |
| **UI Library & Motion** | React 19, Motion v12, Lucide React, Phosphor Icons |
| **Styling & Design System** | Tailwind CSS v4, Custom CSS Variables, Emil Kowalski Physics |
| **State Management** | Zustand (persistent `vertex-cart`, `vertex-wishlist`), React Context |
| **Backend API** | Express 5, Node.js 20+, RESTful API |
| **Payments** | Razorpay (Orders API, Webhooks, HMAC-SHA256 Signatures) |
| **Monorepo Tooling** | Turborepo 2.5+, npm workspaces, TypeScript 5.7 |
| **Verification & Testing** | Native Node.js Test Runner (`node:test`, `node:assert/strict`) |

---

## Design System Tokens

| Token | Light Mode Value | Dark Mode Value | Role |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#0A0A0A` | Canvas background |
| `--surface` | `#F5F5F7` | `#111111` | Secondary containers & bento cells |
| `--surface-elevated` | `#FFFFFF` | `#181818` | Elevated modals & cart drawer |
| `--text-primary` | `#0A0A0A` | `#FFFFFF` | Monolithic headlines & high-contrast ink |
| `--text-secondary` | `#52525B` | `#A1A1AA` | Technical specifications & metadata |
| `--border` | `#E4E4E7` | `#1F1F1F` | 1px precision hairline borders |
| `--accent` | `#1C1C1A` | `#FFFFFF` | Primary brand action & CTA emphasis |
| `--volt` | `#E8FF00` | `#E8FF00` | High-contrast telemetry accent (17.66:1 contrast) |
| `border-radius` | `0px` | `0px` | All-sharp architectural brutalist corners |

---

## Hermetic Verification Suite (159 Tests)

The repository features a zero-dependency, 100% offline hermetic test suite executing in under 400ms:

```bash
# Execute the complete 159-test suite
npm test
```

### Breakdown of Tests:
1. **Master Test Harness (`tests/runner.mjs`) — 99 Tests**:
   - **Tier 1: Feature Coverage (45 tests)**: Visual tokens, bento proportions, micro-interactions, motion timing, cart drawer, $150 free shipping delta, swatches, Razorpay lifecycle, WCAG 2.1 AA.
   - **Tier 2: Boundary & Corner Cases (35 tests)**: Viewport extremes (320px to 4K), 0ms reduced motion, quantity clamping, penny cliff ($149.99 vs $150.00), zero stock, signature buffer safety.
   - **Tier 3: Cross-Feature Combinations (14 tests)**: Cart mutations + swatches, cart + free shipping delta, swatches + image crossfade, tampered prices + order creation, focus trap + mutations.
   - **Tier 4: Real-World Application Scenarios (5 tests)**: Full happy path checkout, out-of-stock live correction, payment abandonment recovery, client price injection neutralization, webhook idempotency.
2. **Design System & M3 Empirical Suite (`tests/m3-*.test.mjs`) — 23 Tests**:
   - Design tokens, WCAG AAA Volt contrast, Emil Kowalski easing tokens, ban on AI purple gradients, `active:scale-[0.97]` press physics, primitive contracts, textile inspector, storefront contracts.
3. **Collection Showcase Suite (`tests/collection-showcase.test.mjs`) — 12 Tests**:
   - Semantic `<picture>` validation, directional scrims, authentic ASRV disciplines (`RUN`, `TRAIN`, `REC`), dual Men/Women actions, tactile pills, focus rings, hover reveal mechanics.
4. **Loading Screens Suite (`tests/loading-screens.test.mjs`) — 9 Tests**:
   - Brand symbol validation, dual-theme `LoadingSymbol` switching, `InitialLoadingScreen` progress & telemetry, `loading.tsx` Suspense contract, GPU compositing.
5. **Boundary Stress Suite (`tests/boundary-stress.test.mjs`) — 16 Tests**:
   - Free shipping arithmetic, zero state, 1-penny cliff, decimal floating-point safety, negative quantity clamping, stock overflow limits, variant key determinism.

---

## Development Scripts

From repository root:

```bash
# Start development servers (Frontend :3000, Backend :5000)
npm run dev

# Run all 159 hermetic tests
npm test

# Type-check all packages across the monorepo
npm run type-check

# Production build across all packages
npm run build

# Code linting
npm run lint

# Format codebase with Prettier
npm run format
```

---

## Client Deployment Guide

A standalone, client-ready distribution exists at `project-v1-client/` pre-configured for instant 1-click deployment on Vercel:

1. **Deploy to Vercel**: Refer to [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for detailed GitHub import, environment variable setup, and Vercel CLI instructions.
2. **Environment Variables**:
   - `NEXT_PUBLIC_SITE_URL`: Production domain URL.
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Razorpay public Key ID.
   - `RAZORPAY_KEY_SECRET`: Razorpay secret Key for webhook verification.
   - `NEXTAUTH_SECRET`: Authentication signing secret.

---

## License

Private — © 2026 XYDV Technical Performance. All rights reserved.
