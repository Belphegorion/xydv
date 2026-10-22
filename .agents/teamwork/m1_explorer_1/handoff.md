# Handoff Report: Milestone 1 — Foundation, Dependencies & Type System

**Agent**: `m1_explorer_1`  
**Date**: 2026-10-04  
**Target Recipient**: Orchestrator / Milestone 1 Worker  
**Working Directory**: `c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\m1_explorer_1`  
**Detailed Analysis**: [analysis.md](./analysis.md)

---

## 1. Observation

1. **Dry-Run npm Install Failure**:
   - Command: `npm install --dry-run` in `c:\Users\atlas\OneDrive\ドキュメント\project-v1`
   - Verbatim output:
     ```
     npm error code ETARGET
     npm error notarget No matching version found for stripe@^18.7.0.
     npm error notarget In most cases you or one of your dependencies are requesting a package version that doesn't exist.
     ```
   - Target file: `c:\Users\atlas\OneDrive\ドキュメント\project-v1\apps\api\package.json`, line 25: `"stripe": "^18.7.0"`.

2. **Registry Check for Razorpay & Types**:
   - Command: `npm view razorpay version; npm view @types/razorpay version`
   - Verbatim output:
     ```
     2.9.8
     npm error code E404
     npm error 404 Not Found - GET https://registry.npmjs.org/@types%2frazorpay - Not found
     ```
   - Proves `razorpay@2.9.8` is valid on npm, while `@types/razorpay` does not exist on npm.

3. **Frontend Stripe Dependency & Peer Dep Conflict**:
   - Target file: `c:\Users\atlas\OneDrive\ドキュメント\project-v1\apps\web\package.json`, lines 22-23:
     ```json
     "@stripe/stripe-js": "^5.8.0",
     "@stripe/react-stripe-js": "^3.7.0",
     ```
   - Command: `npm view @stripe/react-stripe-js peerDependencies` returned:
     `{ react: '>=16.8.0 <20.0.0', 'react-dom': '>=16.8.0 <20.0.0', '@stripe/stripe-js': '>=10.0.0 <11.0.0' }`
   - Version mismatch: `@stripe/stripe-js@^5.8.0` violates the required `>=10.0.0` peer dependency.

4. **Missing Workspace Dependency in Apps**:
   - Grep search for `@vertex/types` across the repository matched only line 2 of `c:\Users\atlas\OneDrive\ドキュメント\project-v1\packages\types\package.json`.
   - Neither `apps/api/package.json` nor `apps/web/package.json` contains `"@vertex/types": "*"`.

5. **Missing `tsconfig.json` in `packages/types`**:
   - Directory listing of `c:\Users\atlas\OneDrive\ドキュメント\project-v1\packages\types` revealed only `package.json` and `src`.
   - File `c:\Users\atlas\OneDrive\ドキュメント\project-v1\packages\types\tsconfig.json` does not exist.
   - Script in `packages/types/package.json` line 8: `"type-check": "tsc --noEmit"` lacks a local tsconfig extending `tsconfig.base.json`.

6. **ESLint 9 Deprecation in `apps/api`**:
   - File: `c:\Users\atlas\OneDrive\ドキュメント\project-v1\apps\api\package.json`, line 10: `"lint": "eslint src --ext .ts"`.
   - In ESLint 9 (`"eslint": "^9.30.0"` in devDependencies), the `--ext` flag is removed in flat config mode and throws an execution error.

7. **Turbo UI Mode**:
   - File: `c:\Users\atlas\OneDrive\ドキュメント\project-v1\turbo.json`, line 3: `"ui": "tui"`.
   - Turbo 2 interactive TUI can freeze or fail in headless CI or Windows non-interactive agent execution.

---

## 2. Logic Chain

1. **Step 1 (Dependency Conflict Resolution)**:
   - Observation 1 demonstrates that `npm install` aborts due to `stripe@^18.7.0`.
   - `ORIGINAL_REQUEST.md §R3` and `PROJECT.md Feature 2` establish that VERTEX is a Razorpay-backed application, not Stripe.
   - Observation 3 shows that `apps/web` also contains obsolete Stripe dependencies with an unresolvable peer dependency mismatch (`@stripe/stripe-js@^5.8.0` vs `>=10.0.0`).
   - *Therefore*: Removing Stripe from both `apps/api` and `apps/web` and adding `razorpay@^2.9.8` to `apps/api` unblocks npm dependency resolution and aligns directly with the project specification.

2. **Step 2 (Type System Resolution for Razorpay)**:
   - Observation 2 proves `@types/razorpay` is not available on npm (404 error).
   - In order for TypeScript compilation (`tsc`) to succeed in `apps/api` and `apps/web`, type definitions must be provided locally.
   - *Therefore*: Defining Razorpay order/payment interfaces in `packages/types/src/razorpay.ts` and declaring `module 'razorpay'` in `apps/api/src/types/razorpay.d.ts` guarantees end-to-end type safety without external dependency failures.

3. **Step 3 (Monorepo Workspace Linking & Compilation)**:
   - Observation 4 shows `@vertex/types` is not linked in either consumer application (`apps/api` and `apps/web`).
   - Observation 5 shows `packages/types` lacks a `tsconfig.json` and build output (`dist/`).
   - In `apps/api/tsconfig.json`, `rootDir: "src"` restricts compilation to files inside `src/`. If uncompiled TypeScript from `packages/types` is imported without compilation, `tsc` will report that the files are outside `rootDir`.
   - *Therefore*: Adding `packages/types/tsconfig.json`, adding `"build": "tsc"` with `dist/` output, adding `transpilePackages: ['@vertex/types']` to `apps/web/next.config.ts`, and adding `"@vertex/types": "*"` to both apps' `package.json` ensures clean type resolution and build orchestration across Turborepo.

4. **Step 4 (Turborepo & Tooling Stability)**:
   - Observation 6 highlights that `apps/api`'s lint script uses `--ext .ts`, which fails under ESLint 9.
   - Observation 7 highlights that `"ui": "tui"` in `turbo.json` poses runtime risks in agent shells.
   - *Therefore*: Modifying `turbo.json` to `"ui": "stream"` and updating `apps/api`'s lint script to `"eslint src"` ensures headless scripts and Turborepo commands run reliably.

---

## 3. Caveats

1. **Database Runtime**: MongoDB is not required for `npm install` or type checking, but backend seed and server startup (`apps/api`) will require MongoDB connection in Milestone 2.
2. **Next.js Page Imports**: `apps/web/src/app/page.tsx` imports store components (`HeroSection`, `CategoryGrid`, etc.) that are slated for creation in Milestones 3 and 4. `npm run type-check` on `apps/api` and `packages/types` will pass, but full `next build` on `apps/web` will naturally depend on M3/M4 UI component scaffolding.

---

## 4. Conclusion

The monorepo dependency and type system blockers are precisely identified and completely actionable:
1. Eliminate all Stripe dependencies and replace `apps/api`'s payment dependency with `razorpay@^2.9.8`.
2. Supply custom Razorpay type definitions in `packages/types` and ambient declaration in `apps/api`.
3. Provide `tsconfig.json` and build scripts for `packages/types`, linking `@vertex/types: *` into `apps/api` and `apps/web`.
4. Switch `turbo.json` UI to `"stream"` and fix the ESLint 9 script syntax.
5. Execute a clean `npm install` and verify Turbo runner availability.

---

## 5. Verification Method

Once the Worker executes the implementation plan, independent verification can be achieved via:

1. **Dependency Resolution**:
   ```powershell
   npm install
   ```
   *Expected outcome*: Exits with code 0; generates root `package-lock.json` and `node_modules`.

2. **Turbo Availability**:
   ```powershell
   npx turbo --version
   ```
   *Expected outcome*: Prints Turborepo version `2.5.4` or higher.

3. **Workspace Build & Type Check**:
   ```powershell
   npm run --workspace=@vertex/types build
   npm run --workspace=@vertex/types type-check
   npm run --workspace=@vertex/api type-check
   ```
   *Expected outcome*: `packages/types/dist` is generated with `.d.ts` and `.js` files; TypeScript compiler exits with 0 errors across `@vertex/types` and `@vertex/api`.

4. **Invalidation Conditions**:
   - Any `npm error ETARGET` or `E404` during `npm install`.
   - Failure of `npx turbo` to execute from the root directory.
   - TypeScript errors regarding missing module `'@vertex/types'` or `'razorpay'`.
