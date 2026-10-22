# Analysis: Monorepo Workspace Dependencies, Turbo & Type System (M1)

**Date**: 2026-10-04  
**Author**: `m1_explorer_1` (teamwork_preview_explorer)  
**Target Milestone**: M1 (Foundation, Dependencies & Type System)  
**Project Root**: `c:\Users\atlas\OneDrive\ドキュメント\project-v1`

---

## 1. Executive Summary

A comprehensive, read-only investigation of the monorepo workspace dependencies, root `package.json`, `turbo.json`, and the three workspaces (`apps/api`, `apps/web`, `packages/types`) was conducted.

### Primary Discoveries
1. **Fatal Installation Blocker (`stripe@^18.7.0`)**:  
   Running `npm install --dry-run` failed immediately with:
   ```
   npm error code ETARGET
   npm error notarget No matching version found for stripe@^18.7.0.
   ```
   Furthermore, the project specification (`ORIGINAL_REQUEST.md §R3` and `PROJECT.md Feature 2, 4-6`) mandates native **Razorpay** integration, not Stripe. Stripe must be removed across both `apps/api` and `apps/web`.
2. **Missing `@types/razorpay` on npm Registry**:  
   Querying `npm view @types/razorpay` confirmed that DefinitelyTyped has no `@types/razorpay` package (returned HTTP 404). Installing `razorpay@^2.9.8` requires dedicated TypeScript declarations, which must be authored in `packages/types/src/razorpay.ts` and ambiently in `apps/api/src/types/razorpay.d.ts`.
3. **Obsolete Stripe Packages in Frontend (`apps/web`)**:  
   `apps/web/package.json` currently contains `"@stripe/stripe-js": "^5.8.0"` and `"@stripe/react-stripe-js": "^3.7.0"`. In addition to being obsolete, `@stripe/react-stripe-js@3.7.0` introduces peer dependency conflicts (`@stripe/stripe-js >= 10.0.0 < 11.0.0`). Both must be removed.
4. **Missing Workspace Dependency Links (`@vertex/types`)**:  
   Neither `apps/api` nor `apps/web` includes `"@vertex/types": "*"` in `package.json`.
5. **Missing `tsconfig.json` in `packages/types`**:  
   `packages/types` contains only `package.json` and `src/index.ts`. It lacks a `tsconfig.json`, which prevents `tsc --noEmit` and declaration compilation from working.
6. **ESLint 9 Script Incompatibility in `apps/api`**:  
   `apps/api/package.json` defines `"lint": "eslint src --ext .ts"`. ESLint v9 removes the `--ext` flag, which causes ESLint to abort.
7. **Turborepo UI Setting in `turbo.json`**:  
   `turbo.json` specifies `"ui": "tui"`. Interactive TUI mode causes terminal rendering glitches and can hang in headless CI or Windows agent subshells. It should be changed to `"ui": "stream"`.

---

## 2. Workspace Inventory & Current State

| Workspace | Directory | Current Dependencies | Key Issues |
|---|---|---|---|
| **Root** | `.` | `turbo: ^2.5.4`, `typescript: ^5.7.3`, `prettier: ^3.4.2` | Missing `clean` and `seed` convenience scripts; `turbo.json` uses `"ui": "tui"`. |
| **`@vertex/types`** | `packages/types` | `typescript: ^5.7.3` | Missing `tsconfig.json`; missing `build` script; missing shared Razorpay/Cart/Order interfaces from `PROJECT.md`. |
| **`@vertex/api`** | `apps/api` | `express: ^5.1.0`, `mongoose: ^8.15.0`, `stripe: ^18.7.0`, ... | Contains invalid `stripe@^18.7.0`; missing `razorpay: ^2.9.8`; missing `@vertex/types: *`; ESLint 9 `--ext` flag in `lint` script. |
| **`@vertex/web`** | `apps/web` | `next: 15.3.4`, `react: ^19.1.0`, `motion: ^12.23.6`, `@stripe/*` | Contains obsolete `@stripe/*` packages with peer dep issues; missing `@vertex/types: *`; needs `transpilePackages` in `next.config.ts`. |

---

## 3. Detailed Root Cause Analysis

### 3.1 Stripe Dependency Failure & Razorpay Replacement
- **Observation**:
  `apps/api/package.json` line 25: `"stripe": "^18.7.0"`.
  When executing `npm install`, npm registry returns `ETARGET No matching version found for stripe@^18.7.0`.
- **Architectural Requirement**:
  `PROJECT.md` Feature 2: *"Add `razorpay` to api, `@types/razorpay` or custom types in `packages/types`"*.
  `ORIGINAL_REQUEST.md §R3`: *"Native Razorpay SDK integration for modal checkout with webhook reconciliation and error resilience."*
- **Resolution**:
  - Replace `"stripe": "^18.7.0"` with `"razorpay": "^2.9.8"` in `apps/api/package.json`.
  - Remove `"@stripe/stripe-js"` and `"@stripe/react-stripe-js"` from `apps/web/package.json`.

### 3.2 The `@types/razorpay` 404 Issue
- **Observation**:
  `npm view @types/razorpay version` returned `404 Not Found`.
- **Architectural Requirement**:
  Types for Razorpay SDK must be supplied locally so backend code (`apps/api`) and frontend checkout invocation (`apps/web`) have strict, error-free TypeScript support.
- **Resolution**:
  - Create `packages/types/src/razorpay.ts` declaring types for:
    - Server-side: `RazorpayOrderPayload`, `RazorpayOrderResponse`, `RazorpayVerificationPayload`, `RazorpayWebhookPayload`
    - Client-side: `RazorpayCheckoutOptions`, `RazorpayInstance`, `Window.Razorpay`
  - Create ambient definition file `apps/api/src/types/razorpay.d.ts` declaring `module 'razorpay'` for the backend SDK.

### 3.3 Workspace Linking & TypeScript Compilation (`@vertex/types`)
- **Observation**:
  - `packages/types` has no `tsconfig.json`.
  - `packages/types/package.json` has `"main": "./src/index.ts"`, `"types": "./src/index.ts"`, and only script `"type-check": "tsc --noEmit"`.
  - In `apps/api/tsconfig.json`, `"rootDir": "src"` is configured. If `apps/api` imports uncompiled `.ts` files from `packages/types/src/` without pre-compiling them to `dist/`, `tsc` will report:
    `File '.../packages/types/src/index.ts' is not under 'rootDir' '.../apps/api/src'.`
- **Resolution**:
  - Add `packages/types/tsconfig.json` extending `../../tsconfig.base.json`:
    - `outDir: "./dist"`
    - `rootDir: "./src"`
    - `declaration: true`
    - `declarationMap: true`
  - Update `packages/types/package.json`:
    - `"main": "./dist/index.js"`
    - `"types": "./dist/index.d.ts"`
    - `"scripts": { "build": "tsc", "type-check": "tsc --noEmit" }`
  - In `apps/web/next.config.ts`, add `transpilePackages: ['@vertex/types']`.
  - Add `"@vertex/types": "*"` to `dependencies` of both `apps/api/package.json` and `apps/web/package.json`.

### 3.4 Turborepo & ESLint Configuration
- **Observation**:
  - `turbo.json`: `"ui": "tui"`. In automated environments or Windows terminals without a true TTY, Turbo 2 interactive TUI can freeze or swallow logs. Changing to `"ui": "stream"` is recommended.
  - `apps/api/package.json`: `"lint": "eslint src --ext .ts"`. ESLint 9 flat config deprecates and rejects `--ext`. Update to `"lint": "eslint src"`.
  - Add `clean` script (`"clean": "turbo clean"`) to root `package.json`.

---

## 4. Proposed File Changes (Exact Specifications)

### 4.1 `packages/types/tsconfig.json` (New File)
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "module": "CommonJS",
    "moduleResolution": "node",
    "target": "ES2022"
  },
  "include": ["src/**/*"]
}
```

### 4.2 `packages/types/package.json` (Update)
```json
{
  "name": "@vertex/types",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

### 4.3 `packages/types/src/index.ts` (Update)
Export complete data contracts according to `PROJECT.md §Interface Contracts`:
- `Product`, `ProductVariant`
- `CartItem`
- `Address`, `Order`, `OrderItem`, `OrderStatus`
- `User`, `Review`, `ApiResponse`, `PaginatedResponse`, `ProductFilters`
- `RazorpayOrderPayload`, `RazorpayOrderResponse`, `RazorpayVerificationPayload`, `RazorpayWebhookPayload`
- `RazorpayCheckoutOptions`, `RazorpayInstance`, `Window.Razorpay`

### 4.4 `apps/api/package.json` (Update)
- Remove `"stripe": "^18.7.0"`
- Add `"razorpay": "^2.9.8"`
- Add `"@vertex/types": "*"`
- Update `"lint": "eslint src"`
- Add `"seed": "tsx src/scripts/seed.ts"`

### 4.5 `apps/api/src/types/razorpay.d.ts` (New File)
Ambient type declarations for the `razorpay` Node SDK.

### 4.6 `apps/web/package.json` (Update)
- Remove `"@stripe/stripe-js": "^5.8.0"`
- Remove `"@stripe/react-stripe-js": "^3.7.0"`
- Add `"@vertex/types": "*"`

### 4.7 `apps/web/next.config.ts` (Update)
Add `transpilePackages: ['@vertex/types']`.

### 4.8 `turbo.json` (Update)
Update `"ui": "tui"` to `"ui": "stream"`.

### 4.9 Root `package.json` (Update)
Add `"clean": "turbo clean"` and `"seed": "npm run --workspace=@vertex/api seed"`.

---

## 5. Step-by-Step Implementation Strategy for Worker Agent

1. **Step 1: Setup `packages/types`**
   - Create `packages/types/tsconfig.json`.
   - Update `packages/types/package.json` with `build` script and `dist/` entrypoints.
   - Update `packages/types/src/index.ts` with all shared contracts and Razorpay type definitions.
2. **Step 2: Update `apps/api` Dependencies & Types**
   - In `apps/api/package.json`, replace `stripe` with `razorpay: ^2.9.8`, add `@vertex/types: *`, fix `lint` script, and add `seed` script.
   - Create `apps/api/src/types/razorpay.d.ts` declaring `module 'razorpay'`.
3. **Step 3: Update `apps/web` Dependencies & Config**
   - In `apps/web/package.json`, remove `@stripe/*` packages and add `@vertex/types: *`.
   - In `apps/web/next.config.ts`, add `transpilePackages: ['@vertex/types']`.
4. **Step 4: Update Root Turbo & Scripts**
   - In `turbo.json`, set `"ui": "stream"`.
   - In root `package.json`, add `"clean"` and `"seed"` scripts.
5. **Step 5: Execute Clean Install & Build Types**
   - Run `npm install` in the project root.
   - Run `npm run --workspace=@vertex/types build` to generate `packages/types/dist/`.
6. **Step 6: Verification**
   - Run `npx turbo --version` to confirm turbo availability.
   - Run `npm run --workspace=@vertex/types type-check`.
   - Run `npm run --workspace=@vertex/api type-check`.
   - Confirm `node_modules` exists at root and symlinks workspace packages.
