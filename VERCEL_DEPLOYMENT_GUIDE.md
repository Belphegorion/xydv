# XYDV Performance Storefront — Vercel Client Deployment Guide

This package contains the complete, production-ready **XYDV Luxury Technical Performance Storefront** (Next.js 15, React 19, Tailwind CSS v4, Motion v12, Turborepo).

---

## Quick Deploy to Vercel (1-Click Setup)

### Option 1: Deploy via GitHub (Recommended)

1. **Initialize Git & Push to GitHub**:
   ```bash
   cd project-v1-client
   git init
   git add .
   git commit -m "feat: initial client release of XYDV storefront"
   git remote add origin https://github.com/<your-organization>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```

2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your GitHub repository.
   - Vercel will automatically read [`vercel.json`](./vercel.json) and configure the build settings:
     - **Framework Preset**: `Next.js`
     - **Root Directory**: `./` (leave default)
     - **Build Command**: `npx turbo run build --filter=@vertex/web...`
     - **Output Directory**: `apps/web/.next`
     - **Node.js Version**: In **Project Settings → General → Node.js Version**, select `22.x` (or `20.x`). Both root `package.json` and `apps/web/package.json` specify `"engines": { "node": ">=20.0.0" }`.

3. **Configure Environment Variables in Vercel**:
   Under **Project Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SITE_URL`: Your production domain (e.g., `https://xydv-performance.com` or `https://your-app.vercel.app`)
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Your Razorpay Key ID
   - `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret
   - `NEXTAUTH_SECRET`: Random 32-character string (generate via `openssl rand -base64 32`)

4. **Click "Deploy"**:
   - Vercel builds the Turborepo package and deploys the Next.js app in under 60 seconds.
   - **Troubleshooting Node.js / Next.js Version Warnings or Stale Cache**:
     - If Vercel warns about an outdated Node or Next.js version from previous deployments, go to **Deployments → [Latest Deployment] → Three dots (...) → Redeploy**.
     - **Uncheck** *"Use existing build cache"* (or select *Redeploy without cache*) to force a clean build with the updated Node runtime and dependencies.
     - Ensure `.vercelignore` is active in the repository root so that test fixtures (`tests/`), scripts (`scripts/`), and internal tools are omitted from the deployment bundle.

---

### Option 2: Deploy directly via Vercel CLI

If you prefer to deploy directly from your local terminal without Git:

```bash
npm install -g vercel
cd project-v1-client
vercel
```

Follow the prompts:
- **Set up and deploy?**: `y`
- **Which scope?**: Choose your personal account or team
- **Link to existing project?**: `n`
- **What's your project's name?**: `xydv-storefront`
- **In which directory is your code located?**: `./`

For production deployment:
```bash
vercel --prod
```

---

## Local Development & Testing

To test the project locally before deploying:

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
# http://localhost:3000
```

To run complete verification and production build locally:
```bash
# Run all 159 hermetic tests offline (<0.40s)
npm test

# Type check all packages across monorepo
npm run type-check

# Run production build
npm run build
```

---

## Architecture Overview

```
project-v1-client/
├── apps/
│   └── web/                     # Next.js 15 App Router Frontend
│       ├── src/
│       │   ├── app/             # App Router pages, layout, icons
│       │   ├── components/
│       │   │   ├── layout/      # Navbar, AnnouncementBar, Footer
│       │   │   ├── store/       # HeroSection, FeaturedCollection, etc.
│       │   │   └── ui/          # BrandLogo, ThemeToggle, Badge, Button
│       │   ├── store/           # Zustand cart & wishlist state stores
│       │   └── lib/             # Utilities, motion spring physics
│       └── public/
│           ├── animations/hero/ # 180-frame scroll-linked canvas sequence
│           └── brand/           # 3D rotating transparent WebP emblem, favicons
├── packages/
│   └── types/                   # Shared TypeScript models (Cart, Product, Razorpay)
├── turbo.json                   # Turborepo build pipeline
├── vercel.json                  # Vercel deployment configuration
└── package.json                 # Monorepo workspaces definition
```

---

## Features & Verification Checklist

- **Scroll-Linked Canvas Sequence**: 180-frame top-anchored video scrubbing in the hero section with zero black overlays.
- **Stepped Ladder Typography**: Technical Material Specs featured first on scroll, culminating in "ENGINEERED FOR THE RELENTLESS" at the sequence climax.
- **Synchronized Navbar**: Automatically hidden during hero scrubbing, smoothly drops in when animation completes.
- **3D Transparent Logo Emblem**: Authentic 8-bit alpha transparent WebP with unclipped 360° rotation.
- **Dual-Theme High Contrast**: WCAG AAA monochrome luxury palette across light and dark modes.
- **Cart & Commerce**: Full slide-out cart drawer, stock validation, and Razorpay checkout modal integration.
