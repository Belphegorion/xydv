# XYDV Admin Panel — Visual Audit & Prioritised Remediation Plan
**Audit Date**: 2026-10-23  
**Target Goal**: Achieve 100% visual cohesion between XYDV Admin Panel and XYDV Customer Storefront.

---

## 1. Inventory of Admin Surfaces & Current Visual Deviations

### 1.1 Layout Shell (`AdminLayout`, `AdminSidebar`, `AdminTopBar`, `AdminGuard`)
- **Current Deficiencies**:
  - Hardcoded dark mode hex colors (`#0a0a0a`, `#111111`, `#1f1f1f`, `#333333`, `#f5f5f5`, `#a0a0a0`) prevent proper light mode and dark mode theme switching.
  - Sidebar header uses raw text instead of official `BrandLogo` / emblem asset.
  - Non-standard rounded corners (`rounded`, `rounded-lg`) on profile card and action buttons violate the 0px brutalist standard.
  - Active navigation item indicator uses simple border-left instead of the storefront's refined typographic and accent treatment.
- **Remediation**:
  - Rebind canvas, surfaces, and borders to `--bg`, `--bg-surface`, `--bg-elevated`, and `--border`.
  - Embed `BrandLogo` (with size="sm" and official `/brand/xydv-logo-nobg.webp` emblem) in the sidebar header.
  - Enforce `rounded-none` across all containers and buttons.
  - Unify top bar styling with `backdrop-blur-md bg-[var(--bg)]/90 border-b border-[var(--border)]`.

### 1.2 Shared Primitives & Dialogs (`ConfirmDialog`, `AdminCharts`)
- **Current Deficiencies**:
  - `ConfirmDialog` uses hardcoded `#111111` surface and `#1f1f1f` border.
  - Action buttons in dialogs do not use `btn-tactile active:scale-[0.97]` or the canonical button variants (`volt`, `outline`, `danger`).
  - `AdminCharts` uses hardcoded SVG line strokes (`#1f1f1f`), text fills (`#52525b`, `#71717a`), and card surfaces (`#111111`).
- **Remediation**:
  - Retokenize dialog surface to `border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-none`.
  - Rebind chart gridlines to `var(--border)` and text labels to `var(--text-muted)` / `var(--text-secondary)`.
  - Rebind chart card containers to `border border-[var(--border)] bg-[var(--bg-surface)] rounded-none`.

### 1.3 Admin Pages

#### A. Login Page (`admin/login/page.tsx`)
- Card surface: Replace `#111111` with `bg-[var(--bg-surface)] border border-[var(--border)] rounded-none shadow-2xl`.
- Brand header: Integrate `BrandLogo` with emblem.
- Form inputs: Align with storefront contact form inputs (`bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)]`).
- Primary button: Styled with tactile press physics (`active:scale-[0.97]`).

#### B. Dashboard Overview (`admin/page.tsx`)
- Stat Cards: Remove `rounded`, apply `border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5 rounded-none`.
- Period Tabs: `border border-[var(--border)] bg-[var(--bg-elevated)] rounded-none`.
- Critical alert banner: Standardize to `border border-[#ff3b3b]/30 bg-[#ff3b3b]/10 text-[#ff3b3b] rounded-none`.
- Quick operations card: Match storefront technical panel style.

#### C. Products Management (`admin/products/page.tsx`)
- Product catalog data table: `thead` with `bg-[var(--bg-elevated)] text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-wider`, rows with `divide-y divide-[var(--border)] hover:bg-[var(--bg-elevated)]`.
- Search & filter inputs: Replace hardcoded dark colors with `bg-[var(--bg-elevated)] border border-[var(--border)]`.
- Modal forms: Restyle create/edit modal to sharp brutalist surface with `bg-[var(--bg-surface)] border-[var(--border)] rounded-none`.
- Image dropzone plinth: `border border-dashed border-[var(--border)] bg-[var(--bg-elevated)]`.

#### D. Category Management (`admin/categories/page.tsx`)
- Categories table: Uniform table styling, slug identifiers in `text-[#e8ff00]` dark / high-contrast light.
- Action buttons: Tactile button hover states.
- Modal: Identical modal styling to products modal.

#### E. Orders & Fulfillment (`admin/orders/page.tsx`)
- Order list table: Clean typography, status chips with semantic tokens (`delivered`: green, `shipped`: sky, `processing`: yellow, `confirmed`: amber, `cancelled`: red).
- Order details modal: Clean metadata rails, items list, financial summary.
- Printable invoice preview: Crisp high-contrast monochrome invoice formatting matching technical activewear brand standards.

#### F. Inventory Control (`admin/inventory/page.tsx`)
- Stock status badges: Semantic coloring (`> 5`: subtle/green, `<= 5`: danger/amber).
- Stock update modal: Input styling and button alignment.

#### G. Customers Directory (`admin/customers/page.tsx`)
- Customer table: Role badges, blocked account indicators.
- Customer detail drawer: Clean technical profile view.

#### H. Settings Management (`admin/settings/page.tsx`)
- Setting category cards: Grouped configuration cards with uniform spacing rhythm.
- Inputs & save button: Full tokenization.

---

## 2. Hardcoded Values to be Tokenized

1. **Backgrounds**:
   - `#0a0a0a` -> `var(--bg)`
   - `#111111` -> `var(--bg-surface)`
   - `#141414`, `#161616`, `#181818` -> `var(--bg-elevated)`
2. **Borders**:
   - `#1f1f1f` -> `var(--border)`
   - `#262626`, `#333333` -> `var(--border-subtle)` / `var(--border)`
3. **Typography Colors**:
   - `#f5f5f5` -> `var(--text-primary)`
   - `#a0a0a0` -> `var(--text-secondary)`
   - `#71717a`, `#52525b` -> `var(--text-muted)`
4. **Border Radius**:
   - `rounded`, `rounded-md`, `rounded-lg` -> `rounded-none` (except indicator dots / user avatars: `rounded-full`)
5. **Interactive Accents**:
   - `#e8ff00` -> `var(--accent)` (Volt yellow / high contrast dark mode accent)

---

## 3. Prioritised Execution Sequence

- **Stage 3: Foundation**: Ensure token definitions in `globals.css` are comprehensive and support admin seamlessly in both light & dark modes.
- **Stage 4: Shared Components**: Polish `ConfirmDialog`, `AdminCharts`, form inputs, and status badges.
- **Stage 5: Layout Shell**: Restyle `AdminLayout`, `AdminSidebar`, `AdminTopBar`, `AdminGuard`.
- **Stage 6: Page-by-Page Polish**:
  1. `admin/login`
  2. `admin` (dashboard)
  3. `admin/products`
  4. `admin/categories`
  5. `admin/orders` (including invoice view)
  6. `admin/inventory`
  7. `admin/customers`
  8. `admin/settings`
- **Stage 7 & 8: Verification & Proof**: Run all 332 tests, lint, type-check, Prettier, build, after-screenshots, and compile final report.
