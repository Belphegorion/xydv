# XYDV Technical Activewear — Master Design Specification
**Source of Truth**: XYDV Customer Storefront (`apps/web/src/app/(store)`, `components/store`, `components/layout`, `components/ui`, `globals.css`)  
**Target Application**: XYDV Admin Panel (`apps/web/src/app/admin`, `components/admin`)  
**Version**: 1.0.0 (Unified Cohesion Specification)

---

## 1. Executive Summary & Design Tone
The XYDV design language fuses high-performance technical apparel engineering (inspired by brutalist technical minimalism, ASRV, and military-grade avionics) with luxury typography and Swiss grid discipline. 

- **Aesthetic Tone**: Brutalist Noir, Utilitarian Precision, Monochromatic Obsidian void with electric Volt yellow telemetry accents.
- **Form Factor Principle**: Sharp 0px border radius (`rounded-none`) across all structural containers, cards, data tables, modals, and buttons. Rounded shapes are strictly reserved for circular indicator dots (`rounded-full`) and avatar badges.
- **Motion Principle**: Emil Kowalski spring physics (`EMIL_EASE = [0.23, 1, 0.32, 1]`, duration <= 300ms, `active:scale-[0.97]` tactile press feedback, zero `scale(0)` entrances, zero unconstrained `transition: all`).
- **Chromatic Rigor**: Zero clichéd AI gradients (purples `#8A2BE2`, `#6366F1`, `#8B5CF6`, `#7C3AED`, `#A855F7` strictly forbidden). Pure obsidian, titanium whites, zinc grays, and tactical high-visibility accents.

---

## 2. Color Palette & Token System

### 2.1 Core Palette Tokens

| Token Name | Light Mode Value | Dark Mode Value | Usage / Semantic Role | Definition Location |
| :--- | :--- | :--- | :--- | :--- |
| `--bg` | `#FFFFFF` | `#0A0A0A` | Primary canvas & viewport background | `globals.css` `:root` / `.dark` |
| `--bg-surface` | `#FFFFFF` | `#111111` | Card backgrounds, table bodies, modal surfaces | `globals.css` `:root` / `.dark` |
| `--bg-elevated` | `#F5F5F7` | `#181818` | Input backgrounds, dropdowns, table headers | `globals.css` `:root` / `.dark` |
| `--border` | `#E4E4E7` (zinc-200) | `#1F1F1F` (zinc-850) | Structural card borders, dividers, outlines | `globals.css` `:root` / `.dark` |
| `--border-subtle` | `#F0F0F2` (zinc-100) | `#161616` (zinc-900) | Table row dividers, subtle internal separators | `globals.css` `:root` / `.dark` |
| `--text-primary` | `#0A0A0A` | `#F5F5F5` | Primary headings, table data, active values | `globals.css` `:root` / `.dark` |
| `--text-secondary`| `#52525B` (zinc-600) | `#A0A0A0` (zinc-400) | Secondary labels, descriptions, inactive nav | `globals.css` `:root` / `.dark` |
| `--text-muted` | `#71717A` (zinc-500) | `#A1A1AA` (zinc-400) | Table column headers, timestamps, metadata | `globals.css` `:root` / `.dark` |
| `--accent` | `#0A0A0A` / `#E8FF00`| `#E8FF00` (Volt) | Active highlights, brand primary actions, focus | `globals.css` & `contracts.mjs` |
| `--accent-hover` | `#333330` | `#D4EB00` | Accent hover state | `globals.css` & `contracts.mjs` |
| `--accent-foreground`| `#FFFFFF` | `#0A0A0A` | High-contrast text on accent backgrounds | `globals.css` & `Button.tsx` |
| `--success` | `#15803d` (green-700) | `#22C55E` (green-500) | Delivered status, active sync, in-stock badges | `globals.css` `:root` / `.dark` |
| `--warning` | `#B45309` (amber-700) | `#F59E0B` (amber-500) | Low-stock warnings, pending approval | `globals.css` `:root` / `.dark` |
| `--danger` | `#B91C1C` (red-700) | `#FF3B3B` (red-500) | Critical low stock, cancellations, deletions | `globals.css` `:root` / `.dark` |
| `--info` | `#0284C7` (sky-600) | `#38BDF8` (sky-400) | Shipped orders, analytics metrics | `AdminCharts.tsx` & Storefront |

### 2.2 Semantic Status Opacities
- **Badge/Chip Backgrounds**: 10% opacity (`bg-[color]/10`)
- **Badge/Chip Borders**: 30% to 40% opacity (`border-[color]/30` or `/40`)
- **Badge Text**: 100% full opacity (`text-[color]`)
- **Modal Backdrops**: `bg-black/80 backdrop-blur-sm`

---

## 3. Typography Hierarchy & Text Transform Rules

### 3.1 Font Families
- **Monospace (`font-mono`)**: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`. Used for all technical data, table numbers, timestamps, SKUs, currency amounts, labels, navigation links, and buttons.
- **Headings (`font-heading`)**: `DM Sans, -apple-system, sans-serif` (with optional tracking/uppercase styling). Used for primary page titles and drawer/modal titles.
- **Body (`font-sans`)**: `SF Pro Daily Regular, SF Pro, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`. Used for descriptions, prose, and form explanatory text.

### 3.2 Type Scale & Spacing
- **Display / Page Title**: `font-mono text-xl sm:text-2xl font-bold uppercase tracking-wider`
- **Section Heading**: `font-mono text-sm sm:text-base font-bold uppercase tracking-wider text-[var(--text-primary)]`
- **Table Headers (`th`)**: `font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]`
- **Table Body (`td`)**: `font-mono text-xs text-[var(--text-primary)]` (or `font-sans text-xs` for long names)
- **Labels (`label`)**: `font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block`
- **Inputs & Selects**: `font-mono text-xs text-[var(--text-primary)]`
- **Buttons**: `font-mono text-xs font-bold uppercase tracking-widest`
- **Badges & Tags**: `font-mono text-[9px] or text-[10px] font-bold uppercase tracking-[0.2em]`
- **Micro Metadata**: `font-mono text-[9px] or text-[10px] uppercase tracking-widest text-[var(--text-muted)]`

---

## 4. Spacing, Layout & Grid Conventions

### 4.1 Spacing Rhythm
- **Page Container**: `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8`
- **Vertical Spacing Rhythm**: `space-y-6 sm:space-y-8`
- **Card Padding**: `p-4 sm:p-5 lg:p-6`
- **Input Dimensions**: `h-10 sm:h-11 px-3.5`
- **Touch Target Minimum**: `min-w-[44px] min-h-[44px]` (WCAG AA compliant)

### 4.2 Responsive Breakpoints
- **Mobile**: `< 640px` (single-column cards, full-width inputs, slide-over drawer sidebar)
- **Tablet**: `640px - 1024px` (2-column grids, horizontal table scrolling with pinned headers)
- **Desktop**: `>= 1024px` (sticky sidebar `w-64`, multi-column metric grids, full desktop data tables)

---

## 5. Shape, Borders & Elevation (Depth)

- **Border Radius**: Sharp `0px` (`rounded-none`). No generic rounded rectangles.
- **Borders**: Crisp 1px hairline `border border-[var(--border)]`.
- **Dividers**: `border-b border-[var(--border)]` or `divide-y divide-[var(--border)]`.
- **Shadows**: Minimal elevation (`shadow-sm` on buttons, `shadow-2xl` on modals with dark overlays). No diffuse colorful drop-shadows.
- **Glassmorphism**: `backdrop-blur-md` on sticky header bars with 90-95% opacity background.

---

## 6. Shared Component Specifications

### 6.1 Buttons
- **Primary / Volt (`variant="volt"`)**:
  - Light mode: `bg-[var(--text-primary)] text-[var(--bg)] border border-[var(--text-primary)] hover:opacity-90`
  - Dark mode: `bg-[#e8ff00] text-[#0a0a0a] border border-[#e8ff00] hover:bg-[#d4eb00]`
  - Physics: `active:scale-[0.97] transition-[transform,background-color,border-color,color] duration-120`
  - Typography: `font-mono text-xs font-bold uppercase tracking-widest`
- **Outline (`variant="outline"`)**:
  - `border border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:border-[var(--text-primary)] hover:bg-[var(--bg-elevated)]`
- **Ghost (`variant="ghost"`)**:
  - `bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]`
- **Danger (`variant="danger"`)**:
  - `border border-[#ff3b3b]/40 bg-[#ff3b3b]/10 text-[#ff3b3b] hover:bg-[#ff3b3b] hover:text-white`
- **Icon Buttons**:
  - `h-9 w-9 touch-target flex items-center justify-center border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)]`

### 6.2 Form Inputs & Controls
- **Text Inputs & Textareas**:
  - `h-11 w-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--text-primary)] dark:focus:border-[var(--accent)] focus:outline-none rounded-none`
- **Selects**:
  - `h-11 w-full cursor-pointer border border-[var(--border)] bg-[var(--bg-elevated)] px-3 font-mono text-xs text-[var(--text-primary)] uppercase focus:border-[var(--text-primary)] dark:focus:border-[var(--accent)] focus:outline-none rounded-none`
- **Checkboxes**:
  - `h-4 w-4 cursor-pointer rounded-none border-[var(--border)] bg-[var(--bg-elevated)] accent-[var(--accent)] text-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]`

### 6.3 Badges & Chips
- **Subtle / Neutral**: `border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-mono text-[10px] uppercase tracking-wider px-2 py-0.5`
- **Success (`delivered`, `in-stock`, `active`)**: `border border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e] dark:text-[#22c55e] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider`
- **Warning (`processing`, `low-stock`)**: `border border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider`
- **Danger (`cancelled`, `out-of-stock`, `blocked`)**: `border border-[#ff3b3b]/30 bg-[#ff3b3b]/10 text-[#ff3b3b] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider`
- **Info (`shipped`)**: `border border-[#38bdf8]/30 bg-[#38bdf8]/10 text-[#38bdf8] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider`
- **Status Dot**: Optional pulsing dot `h-1.5 w-1.5 rounded-full animate-pulse mr-1.5`

### 6.4 Data Tables
- **Container**: `border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden rounded-none`
- **Header (`thead`)**: `border-b border-[var(--border)] bg-[var(--bg-elevated)] font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]`
- **Row Divider**: `divide-y divide-[var(--border)]`
- **Row Hover**: `transition-colors hover:bg-[var(--bg-elevated)]`
- **Cell Padding**: `px-4 py-3.5 sm:px-6 sm:py-4`
- **Empty State**: `border border-dashed border-[var(--border)] py-16 text-center font-mono text-xs uppercase tracking-widest text-[var(--text-muted)]`

### 6.5 Modals & Dialogs
- **Overlay**: `fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm`
- **Panel**: `w-full max-w-lg border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8 text-[var(--text-primary)] shadow-2xl rounded-none`
- **Header**: `flex items-center justify-between border-b border-[var(--border)] pb-4 mb-6 font-mono text-sm font-bold uppercase tracking-wider`
- **Footer**: `flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4 mt-6`

### 6.6 Feedback & Alerts
- **Success Banner**: `border border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e] px-4 py-3 font-mono text-xs`
- **Error / Danger Banner**: `border border-[#ff3b3b]/30 bg-[#ff3b3b]/10 text-[#ff3b3b] px-4 py-3 font-mono text-xs`
- **Warning Banner**: `border border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b] px-4 py-3 font-mono text-xs`

---

## 7. Motion & Interaction Standards

- **Easing Curves**:
  - `EMIL_EASE = cubic-bezier(0.23, 1, 0.32, 1)`
  - `DRAWER_EASE = cubic-bezier(0.32, 0.72, 0, 1)`
- **Duration Constraints**: All micro-interactions <= 300ms. Button press = 120ms. Popover/modal = 180ms.
- **Prohibitions**:
  - Zero unconstrained `transition: all` or `transition-all`.
  - Zero `scale(0)` or `scale: 0` entrances (use opacity + translation or scale 0.95 -> 1.0).
  - No simultaneous CSS transform transitions with Motion spring physics.
- **Accessibility**: `@media (prefers-reduced-motion: reduce)` resets duration to 0.01ms.

---

## 8. Storefront Inconsistencies & Canonical Decisions

1. **Accent Color Divergence**:
   - *Inconsistency*: In `globals.css`, `--accent` in `:root` was `#1c1c1a` while in dark mode was `#ffffff`, but components referenced `#e8ff00` (Volt yellow) directly.
   - *Canonical Resolution*: Treat `--accent` as `#e8ff00` (Volt yellow) in dark mode, and `#0a0a0a` in light mode for primary actions with high contrast. Use `#e8ff00` as the signature technical brand indicator across all themes.
2. **Border Radius Tokens vs Hardcoded Values**:
   - *Inconsistency*: A few admin elements had `rounded` (4px) or `rounded-lg` (8px) while storefront primitives enforce `rounded-none` (0px brutalist).
   - *Canonical Resolution*: Standardize 100% of admin cards, tables, inputs, buttons, and modals to `rounded-none` (`border-radius: 0px`). Circular indicators remain `rounded-full`.
3. **Hardcoded Hex Colors in Admin**:
   - *Inconsistency*: The admin panel hardcoded dark-mode-only hex colors (`bg-[#0a0a0a]`, `bg-[#111111]`, `border-[#1f1f1f]`, `text-[#f5f5f5]`), breaking cohesion when the user toggles ThemeToggle.
   - *Canonical Resolution*: Replace all hardcoded surface, border, and text colors with CSS variable tokens (`var(--bg)`, `var(--bg-surface)`, `var(--bg-elevated)`, `var(--border)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`), guaranteeing seamless dual-theme parity with the storefront.
4. **Heading Typographic Weights**:
   - *Inconsistency*: Some admin headings used default sans-serif font weights without uppercase tracking, whereas the storefront uses `font-mono tracking-wider uppercase` or `font-heading tracking-[0.2em]`.
   - *Canonical Resolution*: Unify all page headers, card headers, and table titles to `font-mono font-bold tracking-wider uppercase`.
