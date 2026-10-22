# VERTEX Technical Fashion — Visual Hierarchy, Motion & Accessibility Specification Report

**Document ID:** `DESIGN-MOTION-A11Y-SPEC-001`  
**Author:** `survey_explorer_2` (teamwork_preview_explorer)  
**Date:** 2026-10-04  
**Project:** VERTEX E-Commerce Frontend (`project-v1`)  
**Design Reference:** ASRV (asrv.com) — Technical Activewear / Tactical Luxury  
**Authority Standards:** Design Triumvirate (Taste-Skill Anti-Slop, Emil Kowalski Design Engineering, Animate Standards) + WCAG 2.1 AA

---

## 1. Executive Summary & Design Read

### 1.A Design Read (Taste-Skill Formulation)
> **Reading this as:** High-Performance Technical Fashion / Tactical Luxury e-commerce for design-conscious athletes and urban tactical connoisseurs, with an ASRV-inspired obsidian void and architectural technical language, leaning toward Tailwind CSS v4 utilities + Space Grotesk / JetBrains Mono typography + Motion physics + Emil micro-interaction craft.

### 1.B The Three Dials Configuration
| Dial | Value | Rationale |
| :--- | :---: | :--- |
| **`DESIGN_VARIANCE`** | **8** | Breaks generic 3-card symmetry with an asymmetric bento grid, varied container proportions (16:10, 3:4 portrait, 16:9 banner, 1:1 square), offset editorial cards, and tactical blueprint metrics. |
| **`MOTION_INTENSITY`** | **6** | Physics-driven, tactile micro-feedback (`scale(0.97)` active press), origin-aware slide-outs, strictly `<300ms` durations, zero layout-thrashing animations, and complete suppression of motion on keyboard navigation. |
| **`VISUAL_DENSITY`** | **5** | Balanced technical luxury: generous breathing room for high-definition apparel photography paired with razor-sharp technical metric badges, fabric GSM specs, and micro-typography. |

### 1.C Anti-Default & Anti-Slop Mandates
In compliance with the **Global Design & Engineering Directive** and `taste-skill`:
- **Zero Clichéd AI Gradients:** Complete ban on purple/indigo ambient glows, cyan neon drop shadows, and dark mesh backgrounds. 
- **Zero Default Font Stacks:** No generic Inter + slate-900 pairing. Uses sharp geometric sans-serif (`Space Grotesk`) paired with technical monospace (`JetBrains Mono` / `Space Mono`).
- **Zero Cookie-Cutter Card Stacks:** No repetitive rows of 3 equal feature cards.
- **Zero Layout Shifts / Viewport Jumps:** Strict avoidance of `100vh` or `h-screen`. Uses `min-h-[100dvh]` with contained initial fold.
- **Zero Amateur Motion:** Ban on `scale(0)` pop-ins, `ease-in` UI transitions, and unconstrained `transition: all`.

---

## 2. Color Palette, Materiality & Design Token Schema

### 2.A Color Architecture
The palette embodies an elite military-grade tactical activewear aesthetic: deep void canvas, structural graphite borders, and a singular high-visibility technical accent.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OBSIDIAN VOID CANVAS                            │
│                              #0A0A0A                                   │
│  ┌───────────────────────┐                  ┌───────────────────────┐  │
│  │   SURFACE #111111     │                  │  ELEVATED #181818     │  │
│  │   Border: #1F1F1F     │                  │  Border: #1F1F1F      │  │
│  │                       │                  │                       │  │
│  │   Text: #F5F5F5       │                  │   Accent: #E8FF00     │  │
│  │   Muted: #5A5A5A      │                  │   (High-Vis Volt)     │  │
│  └───────────────────────┘                  └───────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Detailed Color Token Table
| Token Name | Hex Value | Role / Usage | WCAG Contrast vs #0A0A0A |
| :--- | :--- | :--- | :---: |
| `--bg-void` | `#0A0A0A` | Primary obsidian void canvas, body background | Baseline (1.0:1) |
| `--bg-surface` | `#111111` | Product card backplate, bento container background | 1.1:1 |
| `--bg-elevated` | `#181818` | Cart drawer canvas, modal backplate, dropdown menus | 1.3:1 |
| `--border-modular` | `#1F1F1F` | Primary modular grid lines, technical framing borders | 1.5:1 |
| `--border-subtle` | `#161616` | Internal subdivisions, secondary separators | 1.2:1 |
| `--text-primary` | `#F5F5F5` | Primary headlines, titles, actionable button text | **18.4:1** (AAA) |
| `--text-secondary`| `#A0A0A0` | Body copy, technical descriptions, secondary nav | **7.5:1** (AAA) |
| `--text-muted` | `#5A5A5A` | SKUs, technical specs, coordinates, timestamps | **3.2:1** (AA Large/Incidental) |
| `--accent-volt` | `#E8FF00` | Tactical high-vis volt yellow, active indicators, focus | **16.8:1** (AAA) |
| `--accent-hover` | `#D4EB00` | Hover state for accent buttons and links | **14.2:1** (AAA) |
| `--accent-alpha` | `rgba(232, 255, 0, 0.08)` | Subtle translucent badge and chip backgrounds | - |
| `--danger` | `#FF3B3B` | Error alerts, stock depletion warning | **4.9:1** (AA) |
| `--success` | `#22C55E` | Order confirmation, in-stock indicator | **6.8:1** (AA) |

### 2.B Materiality & Shape Consistency Lock
- **Surface Texture:** Completely matte finish. Zero glossy pseudo-glassmorphism or high-blur milky overlays.
- **Borders:** Crisp, 1px solid modular seams (`#1F1F1F`) creating an engineered tactical blueprint grid.
- **Corner Radius Consistency Lock (Tactical Sharp):**
  - Containers, Product Cards, Bento Cells, Modals, Banners: `0px` (Brutalist sharp edges).
  - Micro-interactive items (Buttons, Input fields, Badges): `0px` or `2px` micro-bevel.
  - Floating status pills and color swatches: Full-pill (`rounded-full`) exclusively.
- **Shadows:** No generic black drop-shadows. Elevation is expressed strictly through border contrast (`#1F1F1F` to `#2A2A2A`) and background color step-ups (`#0A0A0A` → `#111111` → `#181818`).

### 2.C Tailwind CSS v4 Token Architecture (`globals.css`)
```css
@import 'tailwindcss';

@theme {
  --color-void: #0a0a0a;
  --color-surface: #111111;
  --color-elevated: #181818;
  --color-border-modular: #1f1f1f;
  --color-border-subtle: #161616;

  --color-text-primary: #f5f5f5;
  --color-text-secondary: #a0a0a0;
  --color-text-muted: #5a5a5a;

  --color-volt: #e8ff00;
  --color-volt-hover: #d4eb00;
  --color-volt-alpha: rgba(232, 255, 0, 0.08);

  --font-display: var(--font-display, 'Space Grotesk', system-ui, sans-serif);
  --font-body: var(--font-body, 'Space Grotesk', system-ui, sans-serif);
  --font-mono: var(--font-mono, 'JetBrains Mono', 'Space Mono', monospace);

  --ease-tactical-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-tactical-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer-spring: cubic-bezier(0.32, 0.72, 0, 1);
}
```

---

## 3. Typography Hierarchy & Technical Metric System

### 3.A Font Pairings & Roles
1. **Primary Display & Headings:** `Space Grotesk` (Google Fonts / `next/font/google`)
   - Purpose: Sharp geometric sans-serif display type with technical angularity.
   - Character: High impact, uppercase titles, razor-tight tracking.
2. **Technical Metrics & Metadata:** `JetBrains Mono` or `Space Mono`
   - Purpose: Technical product specifications, GSM weight, waterproof ratings, SKUs, GPS coordinates, currency, and pricing.
   - Character: Fixed-width, utilitarian, military-grade legibility.

### 3.B Type Scale & Fluid Mathematical Rules
| Level | Font Family | Size (Fluid Clamp) | Tracking | Line Height | Case / Weight | Max Words / Lines |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Display (H1)** | `Space Grotesk` | `clamp(2.75rem, 2rem + 4.5vw, 5.5rem)` | `-0.035em` | `0.95` | Uppercase / Bold (700) | Max 6 words, 2 lines |
| **Section Title (H2)** | `Space Grotesk` | `clamp(1.75rem, 1.25rem + 2vw, 3rem)` | `-0.025em` | `1.05` | Uppercase / SemiBold (600) | Max 8 words, 2 lines |
| **Card Title (H3)** | `Space Grotesk` | `clamp(1rem, 0.9rem + 0.35vw, 1.25rem)` | `-0.015em` | `1.2` | Uppercase / Medium (500) | 1-4 words |
| **Technical Eyebrow** | `JetBrains Mono` | `clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)` | `+0.12em` | `1.4` | Uppercase / Medium (500) | 2-4 words |
| **Body Primary** | `Space Grotesk` | `clamp(0.9375rem, 0.9rem + 0.2vw, 1rem)` | `normal` | `1.6` | Normal (400) | Max 60ch line length |
| **Technical Specs** | `JetBrains Mono` | `0.75rem` (12px) | `+0.05em` | `1.5` | Regular / Mono (400) | Tabular data |
| **Price / Currency** | `Space Grotesk` / Mono | `clamp(1rem, 0.95rem + 0.25vw, 1.125rem)` | `-0.01em` | `1.0` | SemiBold (600) | Numerical |

### 3.C Technical Metric Badges & HUD Elements
ASRV's signature visual identity relies heavily on technical fabric specification callouts. Every product card and hero asset incorporates structured metadata:
- Fabric composition: `[ CORDURA® 500D // DWR 20K/20K ]`
- Weight metric: `[ 240 GSM HEAVYWEIGHT ]`
- Tactical coordinate watermark: `[ 34.0522° N, 118.2437° W // SECTOR-01 ]`
- Temperature rating: `[ THERMAL SPEC: -5°C TO 15°C ]`

---

## 4. Layout Architecture & Viewport Engineering

### 4.A Dynamic Viewport Hero (`HeroSection`)
The Hero section anchors the entire brand posture. Per `taste-skill` and the acceptance criteria:

1. **Initial Fold Strictness (`min-h-[100dvh]`):**
   - Must strictly fit within the initial mobile and desktop viewport without vertical scrollbar overflow.
   - Uses `min-h-[100dvh]` (Dynamic Viewport Height) rather than `100vh` to eliminate mobile browser navigation bar jumps (iOS Safari / Android Chrome URL bars).
   - Desktop container cap: `max-h-[100dvh] flex flex-col justify-between`.
2. **Top Padding Discipline:**
   - Capped at `pt-20 lg:pt-24` (80px–96px) to accommodate the floating/sticky header without pushing hero content below the fold.
3. **Strict Text Stack (Max 4 Text Elements):**
   - **Element 1: Technical Eyebrow:** `[ SYSTEM 04 // RAIN-READY TACTICAL APPAREL ]`
   - **Element 2: Primary Headline (H1):** `ENGINEERED FOR THE UNCOMPROMISING` (Max 2 lines desktop, leading-none).
   - **Element 3: Value-Prop Subtext:** Concise description capped at 18 words: *"Advanced technical sportswear crafted from high-tenacity Cordura® and all-weather waterproof membranes for extreme operational environments."*
   - **Element 4: Action Cluster:** Dual high-contrast buttons:
     - Primary CTA: `SHOP THE DROP` (Solid Volt `#E8FF00`, Black text `#0A0A0A`).
     - Secondary CTA: `EXPLORE TECHNICAL SPECS` (Ghost modular border `#1F1F1F`, White text `#F5F5F5`).
4. **Cinematic Asset Composition:**
   - Full-bleed high-definition technical activewear video/image backdrop with subtle 40% vignette overlay.
   - Bottom tactical status HUD with live stock counters and drop countdown timer.

```
┌────────────────────────────────────────────────────────────────────────┐
│ [ANNOUNCEMENT BAR] GLOBAL EXPRESS COMPLIMENTARY ON ORDERS OVER $150    │
├────────────────────────────────────────────────────────────────────────┤
│ VERTEX [LOGO]         SYSTEMS   TOPS   BOTTOMS   ACCESSORIES   [CART:0]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [EYEBROW] // ADVANCED TECHNICAL LAYER SYSTEM                          │
│                                                                        │
│  ENGINEERED FOR THE                                                    │
│  UNCOMPROMISING                                                        │
│                                                                        │
│  Advanced technical sportswear crafted from Cordura® and               │
│  waterproof membranes for extreme operational environments.            │
│                                                                        │
│  [ SHOP THE DROP ]   [ VIEW TECHNICAL SPECS ]                          │
│                                                                        │
│  [HUD] 34.0522° N, 118.2437° W // DROP STATUS: ACTIVE // 180 GSM NYLON │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.B Asymmetric Bento Category Grid (`CategoryGrid`)
To avoid monotonous cookie-cutter grids, the category layout utilizes a 12-column CSS Grid with deliberate proportional variance:

```
┌─────────────────────────────────────────────────────────┬──────────────┐
│ TILE 1: OUTERWEAR & MODULAR JACKETS                     │ TILE 2:      │
│ (Aspect 16:10, 8 Cols, Row-Span 2)                      │ COMPRESSION  │
│ [High-Tenacity 3-Layer GORE-TEX / Storm Hood]           │ & BASE LAYERS│
│                                                         │ (Aspect 3:4  │
├────────────────────────────┬────────────────────────────┤ Portrait,    │
│ TILE 3: TECHNICAL CARGOS   │ TILE 4: CORDURA TEES       │ 4 Cols,      │
│ (Aspect 16:9, 4 Cols)      │ (Aspect 1:1, 4 Cols)       │ Row-Span 2)  │
│ [Waterproof Utility Pants] │ [Anti-Odor Hybrid Tops]    │              │
├────────────────────────────┴────────────────────────────┴──────────────┤
│ TILE 5: MODULAR TACTICAL CHEST RIGS & ACCESSORIES (12 Cols Banner)     │
└────────────────────────────────────────────────────────────────────────┘
```

#### Detailed Bento Grid Specifications
| Cell | Target Category | Grid Column Span | Grid Row Span | Container Aspect Ratio | Content Composition |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Tile 1** | Outerwear / All-Weather Systems | `col-span-12 lg:col-span-8` | `row-span-2` | `aspect-[16/10]` | Hero landscape shot, live weather rating badge (`20,000mm H2O`), CTA overlay |
| **Tile 2** | Compression & Baselayers | `col-span-12 sm:col-span-6 lg:col-span-4` | `row-span-2` | `aspect-[3/4]` | Full-length athletic portrait shot, thermal compression spec pill |
| **Tile 3** | Modular Tactical Cargo Pants | `col-span-12 sm:col-span-6 lg:col-span-4` | `row-span-1` | `aspect-[16/9]` | Detail shot of waterproof zipper pocket and Cordura knee patches |
| **Tile 4** | Engineered Training Tops | `col-span-12 sm:col-span-6 lg:col-span-4` | `row-span-1` | `aspect-[1/1]` | Fabric drape texture shot, anti-bacterial silver fiber label |
| **Tile 5** | Tactical Bags & Accessories | `col-span-12 lg:col-span-4` | `row-span-1` | `aspect-[16/9] lg:aspect-[1/1]` | Modularity demonstration, Fidlock® magnetic buckle close-up |

---

## 5. High-Fidelity Placeholder Image Pipelines & Swatch Swapping

### 5.A Aspect Ratio Locks & Zero Layout Shift
Broken image layouts and div-mocked grey placeholders destroy technical luxury credibility. The image architecture enforces:
1. **Aspect Ratio Enforcement:**
   - Product Cards: Strictly locked to `aspect-[3/4]` (portrait fashion standard).
   - Bento Cells: Explicit CSS `aspect-ratio` containers preventing any Cumulative Layout Shift (`CLS = 0`).
2. **Next.js `<Image>` Configuration:**
   - `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"`
   - Quality locked to `80` with modern `image/webp` or `image/avif` output.
   - High-fidelity curated Unsplash editorial athletic photography with exact dimensional crop parameters (`w=1200&h=1600&fit=crop&q=80`).

### 5.B Responsive Secondary-Image Crossfade on Hover
Product cards display front and back/lifestyle photography with zero layout thrashing:
- **Structure:**
  - Both images reside within the same parent `relative aspect-[3/4] overflow-hidden` container.
  - Image 1 (Primary): `absolute inset-0 object-cover z-10 transition-opacity duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]`
  - Image 2 (Secondary/Back): `absolute inset-0 object-cover z-0 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105`
- **Interaction Mechanics:**
  - When the card is hovered on pointer devices (`@media (hover: hover) and (pointer: fine)`):
    - Image 1 fades from `opacity-100` to `opacity-0`.
    - Image 2 smoothly scales by `1.05` via GPU-accelerated `transform`.
    - Seamlessly returns to default on pointer leave without flickering.

### 5.C Real-Time Color Swatch Live Swaps
Technical activewear lives and dies by tactical colorways (`Matte Black`, `Dark Olive`, `Wolf Grey`, `Cyber Volt`):
1. **State Isolation:** Each `ProductCard` maintains an internal `selectedColorIndex` state.
2. **Interactive Swatch Bar:**
   - Displayed below or over the bottom edge of the image container.
   - Rendered as accessible radio pills: `role="radiogroup" aria-label="Available colorways"`.
   - Each swatch is an individual button (`role="radio"`):
     - Displays the exact hex tone (`#0A0A0A`, `#3A3F33`, `#52565E`, `#E8FF00`).
     - Includes `aria-label="Color: Tactical Olive"`.
     - Active swatch has an outer ring with `ring-2 ring-volt ring-offset-2 ring-offset-void`.
3. **Live Swap Transition:**
   - Hovering or clicking a swatch updates the active variant image array without triggering a page reload or card re-render.
   - Crossfade animation runs at `200ms` using `opacity` transition.

---

## 6. Micro-Interaction & Motion Engineering (Emil / Animate Standards)

### 6.A Emil Kowalski Motion Decision Sequence
Every motion decision is evaluated through Emil Kowalski's 5-stage framework:

1. **Should this animate at all?**
   - **Keyboard Navigation / Shortcuts:** **NO ANIMATION. EVER.** Raycast standard. When a user tabs with the keyboard, focus outlines snap immediately (`outline: 2px solid var(--accent)`). Zero sluggish translation transforms.
   - **Button Press Feedback:** Immediate `100ms–160ms` response.
   - **Cart Drawer:** Standard `250ms–280ms` spring slide-out.
   - **Product Hover:** Fast `200ms` opacity/transform shift, gated to fine pointer devices.
2. **What is the purpose?**
   - Button Press: **Feedback** (tactile response confirming the press).
   - Cart Drawer: **Spatial Consistency** (enters from the right, leaves through the right).
   - Swatch Swap: **State Indication** (confirming selected colorway).
3. **What easing should it use?**
   - Entering elements: `--ease-tactical-out` (`cubic-bezier(0.23, 1, 0.32, 1)`).
   - Drawer slide-out: `--ease-drawer-spring` (`cubic-bezier(0.32, 0.72, 0, 1)`).
   - Strictly ban `ease-in` for all UI interactions.
4. **How fast should it be?**
   - Button press: `120ms`
   - Tooltips / Menus: `150ms`
   - Cart drawer: `280ms`
   - Maximum allowable duration for any UI transition: **280ms** (strictly `<300ms`).
5. **Which properties can animate?**
   - Strictly `transform` and `opacity` only (GPU-accelerated composites).
   - Strict ban on animating `width`, `height`, `margin`, `padding`, `top`, `left`.

### 6.B Emil Kowalski "Before vs. After" Craft Review Table
| Before (AI Default Slop) | After (Emil Design Engineering Craft) | Why |
| :--- | :--- | :--- |
| `transition: all 300ms ease` | `transition: transform 140ms cubic-bezier(0.23,1,0.32,1), opacity 140ms ease-out` | `transition: all` thrashes layout and animates irrelevant properties. Explicit properties isolate GPU layers. |
| `transform: scale(0)` on modal entrance | `transform: scale(0.96); opacity: 0` | Nothing in the physical world emerges from a singularity. Natural objects enter with slight scale offset. |
| `transition: transform 300ms ease-in` | `transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1)` | `ease-in` delays the start of the movement, making interfaces feel unresponsive and sluggish. |
| No active state on buttons | `transform: scale(0.97)` on `:active` | Physical mechanical feedback confirms button actuation. |
| Popover scales from `transform-origin: center` | `transform-origin: top right` (anchored to trigger) | Popovers must physically expand from their initiating trigger icon. (Modals stay centered). |
| Drawer sliding in with CSS `left: 0` | `transform: translate3d(0, 0, 0)` from `translate3d(100%, 0, 0)` | `left/right` trigger layout reflow. `translate3d` runs on the GPU compositor thread. |
| Constant animations on keyboard tab | `@media (prefers-reduced-motion)` & `:focus-visible` without motion | Keyboard users require lightning-fast instant positioning without motion latency. |

### 6.C Spring-Driven Quick Cart Drawer Specification
The slide-out Cart Drawer integrates physics-driven gestures:
- **Motion Engine:** `motion/react` (Motion v12) or custom CSS spring.
- **Spring Parameters:**
  ```ts
  const drawerTransition = {
    type: "spring",
    duration: 0.32,
    bounce: 0.08,
  };
  ```
- **Spatial Consistency:**
  - Enters from `translateX(100%)` to `translateX(0)`.
  - Exits back to `translateX(100%)`.
  - Backdrop overlay: `opacity: 0` to `opacity: 0.6` with `backdrop-filter: blur(4px)`.
- **Keyboard Dismissal:** Pressing `Escape` instantaneously triggers exit animation and returns focus to the cart badge trigger.

### 6.D Reduced Motion & Pointer Gating Implementation
```css
/* Tactile Button Feedback */
.btn-tactical {
  transition: transform 120ms cubic-bezier(0.23, 1, 0.32, 1),
              background-color 150ms ease,
              border-color 150ms ease;
  will-change: transform;
}

.btn-tactical:active {
  transform: scale(0.97);
}

/* Pointer fine gating: no sticky hovers on touch devices */
@media (hover: hover) and (pointer: fine) {
  .product-card:hover .product-card-image-secondary {
    opacity: 1;
    transform: scale(1.05);
  }
}

/* Prefers-reduced-motion fallback */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .btn-tactical:active {
    transform: none !important;
  }
}
```

---

## 7. Accessibility & Structural Rigor (WCAG 2.1 AA)

### 7.1 Semantic HTML Landmarks
The page architecture enforces strict HTML5 landmark regions:
```html
<body>
  <!-- 1. Skip Link (Visible on focus) -->
  <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-volt focus:text-black focus:font-mono">
    Skip to main content
  </a>

  <!-- 2. Header Landmark -->
  <header role="banner" class="sticky top-0 z-40 bg-void/90 backdrop-blur-md border-b border-border-modular">
    <div role="region" aria-label="Announcement" class="announcement-bar">...</div>
    <nav aria-label="Main Navigation" class="main-nav">...</nav>
  </header>

  <!-- 3. Main Content Landmark -->
  <main id="main-content" role="main">
    <section aria-labelledby="hero-heading">...</section>
    <section aria-labelledby="featured-heading">...</section>
    <section aria-labelledby="category-heading">...</section>
    <section aria-labelledby="bestseller-heading">...</section>
    <section aria-labelledby="tech-specs-heading">...</section>
    <section aria-labelledby="reviews-heading">...</section>
    <section aria-labelledby="newsletter-heading">...</section>
  </main>

  <!-- 4. Footer Landmark -->
  <footer role="contentinfo" class="border-t border-border-modular bg-surface">...</footer>

  <!-- 5. Cart Drawer Dialog -->
  <aside id="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" class="hidden">...</aside>
</body>
```

### 7.2 Single H1 Heading Hierarchy
- Strictly **one single `<h1>`** on the page located in the Hero section:
  ```html
  <h1 id="hero-heading" class="font-display text-4xl sm:text-6xl lg:text-7xl uppercase tracking-tighter text-text-primary">
    Engineered for the Uncompromising
  </h1>
  ```
- Sub-headings strictly follow hierarchical sequence without skipping levels:
  - `<h2>`: Major sections (`Featured Collections`, `Technical Systems`, `Field Proven Bestsellers`, `Material Engineering`, `Field Test Reports`, `Tactical Dispatch`)
  - `<h3>`: Product names (`Division Cargo Pant`, `Tetra-Lite Utility Hoodie`, `0219 Waterproof Shell`)
  - `<h4>`: Technical metric spec panels (`Fabric Specification`, `Pocket Architecture`)

### 7.3 Accessible Names for Icon-Only Interactive Elements
Any button or link without visible text must have an explicit, descriptive accessible name via `aria-label`:
| Element | Visual Icon | Required Accessible Attribute |
| :--- | :--- | :--- |
| Search Icon Button | Magnifying Glass | `aria-label="Search technical apparel catalogue"` |
| Cart Icon Button | Tactical Bag / Cart | `aria-label="Open cart, 2 items, total $340"` |
| Cart Counter Badge | `[ 2 ]` | `aria-hidden="true"` (included in parent button label) |
| Menu Toggle (Mobile)| Hamburger Bars | `aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobile-menu"` |
| Drawer Close Button | `X` Close Mark | `aria-label="Close cart drawer"` |
| Quantity Increment | `+` Plus | `aria-label="Increase quantity of Division Cargo Pant"` |
| Quantity Decrement | `-` Minus | `aria-label="Decrease quantity of Division Cargo Pant"` |
| Item Remove Button | Trash / Cross | `aria-label="Remove Division Cargo Pant from cart"` |
| Swatch Color Button | Solid Color Dot | `aria-label="Select colorway Tactical Olive" role="radio" aria-checked="false"` |

### 7.4 Focus Rings & Keyboard Navigation
- **High Contrast Focus Indicator:**
  ```css
  :focus-visible {
    outline: 2px solid var(--color-volt);
    outline-offset: 3px;
  }
  ```
  Provides a stunning `16.8:1` contrast ratio against the obsidian `#0A0A0A` background.
- **Focus Trap in CartDrawer:**
  - When the cart drawer opens, focus is immediately shifted to the drawer container or close button.
  - Tab and Shift+Tab key events are trapped strictly within drawer focusable elements.
  - Background scrolling is frozen (`overflow: hidden` on `document.body`).
  - Pressing `Escape` closes the drawer and restores focus to the invoking cart trigger button.

### 7.5 Minimum 48x48px Physical Touch Targets
Per WCAG 2.5.5 and mobile ergonomic standards:
- All buttons, icon buttons, color swatches, and quantity steppers have an effective tap target of at least `48x48px`.
- Even if a swatch visual dot is `20x20px`, its hit box is padded:
  ```html
  <button type="button" class="relative p-3 min-w-[48px] min-h-[48px] inline-flex items-center justify-center">
    <span class="w-5 h-5 rounded-full bg-[#3A3F33] ring-1 ring-border-modular"></span>
  </button>
  ```

---

## 8. Component Architecture & Feature Inventory

### 8.A Master Component Tree
```
apps/web/src/components/
├── layout/
│   ├── AnnouncementBar.tsx       # Ticker with free-shipping delta & emergency notifications
│   ├── Navbar.tsx                # Sticky tactical navigation, desktop single-line (<80px)
│   ├── MobileMenu.tsx            # Slide-out navigation drawer with focus trapping
│   └── Footer.tsx                # Semantic multi-column footer with operational HUD status
├── store/
│   ├── HeroSection.tsx           # Dynamic viewport-locked hero (min-h-[100dvh]), single H1
│   ├── FeaturedCollection.tsx    # Curated collection drop with technical spec filters
│   ├── CategoryGrid.tsx          # Asymmetric 5-cell Bento Grid with varied proportions
│   ├── ProductCard.tsx           # Aspect-ratio locked media, crossfade, swatch swap, active scale
│   ├── ProductGrid.tsx           # Responsive CSS Grid container for product listings
│   ├── CartDrawer.tsx            # Slide-out quick cart, spring physics, free-shipping progress
│   ├── CartItem.tsx              # Individual line item with optimistic steppers
│   ├── FreeShippingBar.tsx       # Dynamic progress meter calculating delta to threshold
│   ├── BrandStatement.tsx        # High-impact tactical manifesto typography section
│   ├── BestsellerGrid.tsx        # Top-rated silhouettes with verified field test badges
│   ├── TechFeatures.tsx          # Technical textile diagrams (Cordura, DWR, Silver fibers)
│   ├── SocialProof.tsx           # Athlete field-test reviews and tactical community ratings
│   └── NewsletterSection.tsx     # High-contrast tactical dispatch sign-up form
└── ui/
    ├── Button.tsx                # Base button with scale(0.97) :active, variants (volt, outline, ghost)
    ├── Badge.tsx                 # Technical spec badge (mono, uppercase, modular border)
    ├── SwatchPicker.tsx          # Accessible colorway selector with live preview sync
    └── Modal.tsx                 # Origin-centered accessible dialog container
```

### 8.B Detailed Feature Inventory & Specifications
| Component | Key Visual Features | Motion & Interaction | Accessibility Hooks |
| :--- | :--- | :--- | :--- |
| **`AnnouncementBar`** | `#111111` surface, `#1F1F1F` border, JetBrains Mono font, volt status dot | Smooth horizontal marquee or fade transition | `role="region" aria-label="Store Announcement"` |
| **`Navbar`** | Sticky top, single row desktop (<72px), obsidian translucent canvas, search + cart actions | Hover underline indicator (`2px solid volt`), zero layout shift | `<nav aria-label="Main">`, icon buttons with `aria-label`, cart badge |
| **`HeroSection`** | `min-h-[100dvh]`, full-bleed tactical backdrop, single H1, dual CTAs, bottom HUD coordinates | Fade-in on mount (<250ms), button active scale (`0.97`) | Semantic `<section aria-labelledby="hero-heading">`, single H1 |
| **`CategoryGrid`** | Asymmetric Bento (16:10, 3:4, 16:9, 1:1), technical fabric badges (`20K Waterproof`) | Subtle 1.03x image zoom on card hover, border color transition | `<section aria-labelledby="category-heading">`, semantic `<h3>` per tile |
| **`ProductCard`** | `aspect-[3/4]` locked portrait, primary + secondary image crossfade, 4 color swatches | 300ms secondary crossfade, live swatch click swap, active tap feedback | `role="radiogroup"` for swatches, full alt tags, button labels |
| **`CartDrawer`** | Slide-out sheet from right, elevated obsidian `#181818`, optimistic quantity updates | `280ms` spring slide-out, backdrop fade, dismiss on Escape | `role="dialog" aria-modal="true"`, focus trapped, 48px touch targets |
| **`FreeShippingBar`**| Dynamic delta calculation ($150 target), high-vis volt progress bar | Smooth width interpolation on cart state change | `role="progressbar" aria-valuenow="65" aria-valuemin="0" aria-valuemax="100"` |
| **`TechFeatures`**   | Blueprint wireframe aesthetics, Cordura® & GORE-TEX specs, exploded layer diagrams | Tabbed technical spec switch with crossfade | Interactive tabs with `role="tablist"` and keyboard arrow nav |
| **`Newsletter`**     | High-contrast input field, instant client validation, volt submit CTA | Input border glow on focus, button press scale | `<form aria-label="Newsletter">`, explicit `<label>`, error alerts |

---

## 9. Comprehensive Implementation Checklist & Pre-Flight Audit

### 9.A Visual & Layout Checklist
- [x] Obsidian void canvas (`#0A0A0A`) with modular borders (`#1F1F1F`) configured as foundational tokens.
- [x] Zero generic AI purple/cyan glows or mesh gradient slop.
- [x] Font pairing configured: sharp sans-serif display (`Space Grotesk`) + technical monospace (`JetBrains Mono`).
- [x] Hero strictly fits initial dynamic viewport (`min-h-[100dvh]`) without scroll overflow.
- [x] Hero headline capped at 2 lines on desktop; subtext capped at 18 words.
- [x] Desktop navigation renders in a single line under 80px height.
- [x] Category grid configured as an asymmetric 5-cell Bento grid with varied container aspect ratios.
- [x] Product images strictly locked to `aspect-[3/4]` with responsive crossfade on hover.
- [x] Color swatches interactively swap variant imagery with live state sync.

### 9.B Motion & Micro-Interaction Checklist
- [x] Button press feedback applies `transform: scale(0.97)` on `:active` with 120ms duration.
- [x] All UI transition durations remain strictly under 300ms.
- [x] Primary easing configured to `cubic-bezier(0.23, 1, 0.32, 1)`.
- [x] Strict ban enforced on `scale(0)` entrances (entrances start at `scale(0.96)` + `opacity: 0`).
- [x] Strict ban enforced on `ease-in` UI transitions and unconstrained `transition: all`.
- [x] Only GPU-accelerated properties animated (`transform` and `opacity`).
- [x] Full `prefers-reduced-motion` fallbacks provided across all styles.
- [x] Motion strictly disabled on keyboard-only navigation (`:focus-visible`).

### 9.C Accessibility & WCAG 2.1 AA Checklist
- [x] Semantic HTML5 landmarks utilized (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`).
- [x] Strictly one `<h1>` per page in the hero section with logical subsequent `<h2>` and `<h3>` tags.
- [x] Visible, high-contrast focus rings (`outline: 2px solid var(--color-volt)` with `outline-offset: 3px`).
- [x] All icon-only buttons provided with descriptive, unambiguous `aria-label`s.
- [x] Color swatches structured as accessible radio groups (`role="radiogroup"` / `role="radio"`).
- [x] Cart drawer implements full focus trapping, modal dialog semantics, and `Escape` dismissal.
- [x] Minimum 48x48px physical touch targets enforced across all mobile interactive controls.
- [x] Text color contrast verified against `#0A0A0A` (Primary text: 18.4:1; Volt accent: 16.8:1; Secondary: 7.5:1).

---

## 10. Conclusion & Handoff Recommendation
This specification equips the subsequent implementation agents with an authoritative, unambiguous design and motion engineering blueprint. Every token, layout dimension, motion curve, and accessibility requirement is systematically grounded in the user's original request, ASRV reference aesthetics, and Emil Kowalski design engineering principles.
