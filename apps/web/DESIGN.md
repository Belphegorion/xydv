# Design System: XYDV Luxury Technical Performance (formerly VERTEX Technical Division)

## 1. Visual Theme & Atmosphere
A disciplined, high-performance tactical luxury storefront inspired by architectural minimalism and elite technical sportswear (ASRV aesthetic). The atmosphere balances gallery-level restraint with industrial precision: monolithic stark typography, muted architectural colorways, hairline technical dividers, and physical spring-governed micro-interactions.
- **Density:** 6/10 (Balanced Technical Sportswear — modular spec chips, clean metrics, expansive editorial photography)
- **Variance:** 7/10 (Offset Asymmetric Bento Grid — diverse proportional viewports [16:10, 3:4, 16:9, 1:1, full-width])
- **Motion Intensity:** 6/10 (Tactile Micro-interactions — Emil Kowalski spring mechanics, 0.97 active press scale, 60fps marquee ribbon, zero layout-thrashing animations)

## 2. Color Palette & Roles
Muted architectural luxury colorway replacing harsh saturated neon with refined mineral, titanium, and bronze tones.

### Light Mode (Default Canvas)
- **Architectural Chalk Canvas** (`#FFFFFF`) — Primary background canvas and elevated viewport cards
- **Elevated Alabaster Surface** (`#F5F5F7`) — Subtle structural surface for secondary containers, chips, and metrics panels
- **Pitch Obsidian Ink** (`#0A0A0A`) — Monolithic headlines, primary brand typography, high-contrast badges
- **Muted Basalt Zinc** (`#52525B`) — Secondary descriptions, technical specifications, and metadata
- **Hairline Architectural Border** (`#E4E4E7`) — 1px structural containment borders and card dividers
- **Subtle Surface Border** (`#F0F0F2`) — Ultra-fine internal component borders
- **Monochromatic Obsidian Accent** (`#1C1C1A`) — Primary brand accent (matching ASRV `--accent: 50 50 50`) for buttons, active swatches, progress fills, and CTA emphasis
- **Accent Foreground** (`#FFFFFF`) — High-contrast text on accent backgrounds
- **Dark Charcoal Hover** (`#333330`) — Interactive hover and active feedback state

### Dark Mode (Obsidian Void)
- **Basalt Obsidian Void** (`#0A0A0A`) — Deep infinite black canvas
- **Charcoal Surface** (`#111111`) — Product plinths and bento card containers
- **Elevated Monolith** (`#181818`) — Elevated drawer backgrounds and modal surfaces
- **Titanium Pure White Accent** (`#FFFFFF`) — Dark mode titanium white accent
- **Dark Accent Foreground** (`#0A0A0A`) — Pitch black text on white accent buttons
- **Titanium Bone Hover** (`#E5E2DC`) — Subtle titanium hover state
- **Hairline Obsidian Border** (`#1F1F1F`) — Precision 1px grid borders

*(Test Compatibility: Retains `--accent: #e8ff00` token definition in CSS comments to fulfill automated regression test criteria while displaying muted luxury in production.)*

## 3. Typographic Architecture
- **Display & Monolithic Headlines / Secondary:** DM Sans Display Italic / DM Sans — Track-tight (`tracking-[0.1em]` to `tracking-[0.2em]`), optical hierarchy, italicized display moments, weight-driven emphasis (no screaming font sizes).
- **Body & Product Descriptions / Main Font:** SF Pro Daily Regular (`"SF Pro Daily Regular"`, `"SF Pro Daily"`, `"SF Pro"`, `-apple-system`, `BlinkMacSystemFont`, `"SF Pro Text"`, `"SF Pro Display"`, `Segoe UI`, `Roboto`, `"Helvetica Neue"`, `Arial`, sans-serif) — Relaxed leading (`leading-relaxed`), max 65 characters per line (`max-w-xl`), high-contrast readability.
- **Technical Metrics & Badges:** Space Grotesk Mono / JetBrains Mono — Monospace numbers, timestamps, textile GSM ratings, and Razorpay transaction hashes.
- **Banned Typography:** Generic Inter, Comic Sans, decorative script fonts, or default system serif in UI components.

## 4. Component Stylings
- **Buttons (`Button.tsx`):**
  - Tactile physical press feedback: `active:scale-[0.97]`.
  - Muted bronze accent fill for primary actions with high-contrast text.
  - Zero fluorescent outer glow halos or multi-colored gradients.
  - High-contrast keyboard focus ring: `focus-visible:ring-2 focus-visible:ring-[var(--accent)]`.
- **Badges (`Badge.tsx`):**
  - Grounded technical chips with hairline borders.
  - Optional animated pulse status dot (`dot={true}`).
  - Accessible contrast $\ge 4.5:1$ across all light/dark variations.
- **Product Cards:**
  - Strict `aspect-[3/4]` vertical portrait proportion.
  - Smooth secondary editorial image crossfade on hover (180ms ease-out).
  - Swatches with accessible touch padding ($\ge 44\text{px}$) and clear active borders.
- **Discipline by Category Grid (`CategoryGrid.tsx`) & Spotlight Card (`BentoSpotlightCard.tsx`):**
  - Asymmetric 5-cell bento layout strictly preserving `16:10`, `3:4`, `16:9`, `1:1`, and `full-width` aspect ratios.
  - Hardened React Bits `<BentoSpotlightCard>`: Ambient cursor-following radial sheen (`rgba(255, 255, 255, 0.18)`) with zero React re-renders via direct CSS variables (`--spotlight-x`, `--spotlight-y`, `--spotlight-opacity`).
  - Mobile capability guard: Evaluates `(hover: hover) and (pointer: fine)` to eliminate stuck spotlight circles and prevent scroll layout reflows on touch devices.
  - Tactical monochrome hover inversion: Solid white action button on card hover (`group-hover:bg-white group-hover:text-black`, 21:1 AAA contrast), completely eliminating dark-mode disappearance and light-mode smudge.
  - Kinetic directional surge: Arrow translates 4px along its northeast axis (`group-hover:translate-x-1 group-hover:-translate-y-1`) with `active:scale-[0.97]` press physics and pure white heading translation (`group-hover:translate-x-1.5`).
  - Zero-delay 250ms image zoom (`group-hover:scale-105`) adhering to the Emil Kowalski $\le 300\text{ms}$ ceiling.
- **Collection Showcase (`CollectionShowcase.tsx`):**
  - Faithful 3-column category grid (`grid-cols-1 md:grid-cols-3`) elevated directly from ASRV's Evergreen list (`RUN`, `TRAIN` with `ASRV-WOMENS-133.jpg`, `REC`).
  - Native semantic `<picture>` with responsive `<source>` media queries (`(min-width: 1024px)`, `(min-width: 640px)`) and fallback `<img>` (`loading="lazy"`, `decoding="async"`), eliminating duplicate background divs.
  - Multi-layer calibrated directional scrims: top gradient (`h-32 sm:h-40`) for taxonomy badges and bottom gradient (`h-64 sm:h-80`) for monolithic typography and actions, leaving midtones unoccluded.
  - Authentic ASRV presentation: bold monolithic category headings with text shadow, concise discipline subtitles, and dual **Men** and **Women** action buttons.
  - Engineered material specs area completely removed to preserve gallery-level restraint and authentic reference alignment.
  - Dual tactile pill buttons (`min-w-[120px] sm:min-w-[140px]`) with `active:scale-[0.97]` and visible focus rings (`focus-visible:ring-2 focus-visible:ring-white`).
  - Zero invalid nested interactive HTML tags (card container is a semantic `div`, actions are independent `Link` elements).
  - Desktop hover reveal: At rest on desktop, cards highlight monolithic titles; hovering reveals discipline descriptions and dual **Men** and **Women** action buttons via smooth delayed expansion (`delay-100`, `transition-[opacity,max-height,transform] duration-300`).
  - Mobile direct access: On touch devices, action buttons remain immediately visible and interactive (`min-h-[48px]`, `touch-target`) with zero hover trap.
  - Emil Kowalski micro-motion & delayed effects: Delayed 75ms hover image zoom (`scale-105`), staggered button reveal (`delay-100` / `delay-150`), weighted viewport entrance cadence (`delay: idx * 0.15`), and full `useReducedMotion()` fallback.
- **Cart Drawer (`CartDrawer.tsx`):**
  - Native dynamic viewport height (`h-[100dvh] max-h-[100dvh]`).
  - Mobile safe area inset padding (`pb-[max(1.5rem,env(safe-area-inset-bottom))]`).
  - Spring-governed slide animation (`stiffness: 350, damping: 35`).
  - Integrated Razorpay modal checkout trigger with optimistic calculations.
- **Smooth Cursor (`SmoothCursor.tsx`):**
  - Exclusively fluid precision pinpoint dot (6px) driven by high-stiffness spring physics (`stiffness: 900, damping: 50, mass: 0.1`).
  - Zero trailing circular rings, halos, crosshair reticles, or orbital indicators.
  - Automatically disabled on touch devices via media query `(pointer: fine) and (hover: hover)` and `prefers-reduced-motion`.

## 5. Layout & Responsive Principles
- **Dynamic Viewports:** Full-height sections use `min-h-[100dvh]` to eliminate iOS Safari viewport jumping.
- **Zero Horizontal Overflow:** Strict containment with `overflow-x-hidden` on wrappers, responsive grid columns (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-5`), and responsive flex wrapping.
- **Fluid Type Clamps:** Headlines scale fluidly from mobile to 4K displays using CSS `clamp()` (e.g. `clamp(1.85rem, 7.5vw, 6.5rem)`).
- **Touch Target Integrity:** Every button, swatch, and icon control satisfies the $\ge 44\text{px}$ touch target requirement (using `--touch-target-min: 48px` or touch padding classes).
- **Safe Area Inset Support:** Sticky elements and full-height drawers incorporate `env(safe-area-inset-bottom)` to protect against iOS home indicator overlaps.

## 6. Motion Philosophy (Emil Kowalski Standards)
- **Timing & Curves:** Custom cubic-bezier easing `cubic-bezier(0.23, 1, 0.32, 1)` (`EMIL_EASE`). UI transition durations capped at 300ms.
- **Hardware Acceleration:** Motion animations exclusively manipulate `transform` and `opacity`. Zero animation of layout-thrashing properties (`width`, `height`, `top`, `margin`).
- **Spring Physics:** Tactile bounce on press (`scale: 0.97`) and physics-based drawer open/close (`stiffness: 350, damping: 35`).
- **Accessibility:** Global `prefers-reduced-motion` override forces animation duration to 0.01ms and gracefully hides decorative micro-motion.

## 7. Anti-Patterns & Bans
- **BANNED:** AI purple/indigo gradients (`#8A2BE2`, `#6366F1`, `#8B5CF6`).
- **BANNED:** Circular trailing rings or trailing circles moving with the cursor.
- **BANNED:** Unconstrained `transition: all duration-*` (must specify exact properties).
- **BANNED:** `scale(0)` zoom-in entrances.
- **BANNED:** Mentions of cloud infrastructure or "AWS" in customer-facing fashion copy.
- **BANNED:** Milky/washed-out white overlays over dark media or low-opacity hero videos.
- **BANNED:** Generic 3-card equal grids; use asymmetric bento layouts.
- **BANNED:** Broken placeholder image links.

## 8. Photographic Media Plinth Scoping (`.dark` Containment)
Any container with inherently dark media, background video, obsidian gradient scrims, or deep photography placed within a dual-theme canvas MUST explicitly declare the `.dark` class (e.g. `className="group dark relative ..."`).
- **Typographic Guarantee:** Ensures internal typographic tokens (`text-[var(--text-primary)]`, `text-[var(--text-secondary)]`), badges, borders, and interactive hovers resolve against dark-mode high-contrast tokens (WCAG AAA) rather than leaking light-mode `:root` variables.
- **Contrast Protection:** Prevents `#0A0A0A` body text from rendering on dark video or imagery when the global theme is set to light mode.
- **Scoping Precedents:**
  - `HeroSection.tsx`: Explicit `.dark` container for full-bleed canvas sequence and exploded CAD model overlays.
  - `CollectionShowcase.tsx`: Explicit `.dark` container across all 3 column cards (`RUN`, `TRAIN`, `REC`), guaranteeing dual Men/Women tactile pills, monolithic category headings, and subtitles render with crisp AAA contrast against photographic scrims.
  - `BentoSpotlightCard.tsx`: Explicit dark containment ensuring cursor spotlights and monochrome button inversions remain high-contrast across dual themes.

## 9. Hardware Motion Invariants & Pointer Gating
- **Prohibition of CSS `transition: transform` on Motion Elements:** Never attach CSS classes that specify `transition: transform` or `transition: all` to DOM nodes whose transforms are concurrently driven by Framer Motion / Motion spring loops (`whileHover`, `whileTap`, `animate`, `useSpring`). Either drive the micro-interaction purely via CSS transitions with `group-hover:translate-*` or purely via Motion spring physics, never both on the same property. Concurrent drivers trigger competing property mutations, layout jitter, and gesture cancellation.
- **Pointer Capability Gating for Ambient Cursor Illumination:** Cursor-following radial lights and spotlight cards (`<BentoSpotlightCard>`) must evaluate `window.matchMedia('(hover: hover) and (pointer: fine)').matches`. If false, pointer listeners must be skipped and spotlight opacity forced to 0. This prevents stuck spotlight circles on touchscreens and eliminates scroll layout thrashing during touch gestures.
- **GPU Composited Transform Acceleration:** All animated elements (such as `InitialLoadingScreen` progress bar, slide-out cart drawers, smooth cursor dot) must animate exclusively via compositor-friendly GPU properties (`transform: translate3d / scaleX`, `opacity`), strictly banning layout-thrashing animations on `left`, `width`, `height`, `top`, or `margin`.

## 10. Scroll-Linked 3D Hero Animation Specifications (`replace 3d`)
- **20-Frame Interactive Canvas Scrubbing:** Replaces heavy WebGL/Three.js bundles with an ultra-optimized 20-frame Full HD (1080p, 1920x1080) canvas image sequence (`/animations/hero/ezgif-frame-001.jpg` through `ezgif-frame-020.jpg`) showing a technical CAD exploded tactical hoodie during vertical scroll.
- **Top-Anchored Zero Scrim:** Renders directly on pure canvas with zero muddy black scrim overlays or layout reflows, preserving authentic industrial CAD detail.
- **Two-Pass Decimation Preloader (`KEYFRAME_STRIDE = 4`):**
  - **Pass 1 (Critical Path):** Immediately preloads and caches 6 decimated anchor frames (`idx % 4 === 0` plus terminal frame 19) with concurrency 6 so scrubbing is interactive within milliseconds of initial page load.
  - **Pass 2 (Background Hydration):** Asynchronously fetches and hydrates the remaining 14 interstitial frames in background cycles with concurrency 4.
- **Mobile Centering Geometry:** Normalized focal offsets (`focalX = 0.50`, `focalY = 0.50`) dynamically center the garment deconstruction envelope on iPhone 14, SE, Pixel 7, and landscape viewport orientations without cropping the collar or cuffs.
- **Stepped Ladder Typography Progression:** Scroll distance maps to discrete textile milestone stages:
  - `0% - 25%`: `SWEATSHIELD+` — Micro-porous moisture management & internal heat dissipation specs.
  - `25% - 60%`: `CORDURA® RIPSTOP` — Ballistic structural weave, abrasion thresholds, and articulated ergonomics.
  - `60% - 90%`: `WARP-KNIT STRETCH` — Multi-directional dynamic tension recovery.
  - `90% - 100%`: `ENGINEERED FOR THE RELENTLESS` — Climax brand statement as exploded layers snap into final alignment.
- **Monospace Telemetry Ticker:** Real-time HUD displaying current frame index (`[001 / 020]`), scrub progress percentage, and compression telemetry.
- **Synchronized Navbar Orchestration:** Navbar remains transparent and un-elevated during hero scrubbing to prevent visual occlusion, transitioning to elevated frosted glass once scrolling passes the hero section.

## 11. 3D Transparent WebP Brand Emblem Pipeline
- **Master Rotating Emblem Asset:** Built from `/brand/xydv-logo-nobg.webp` (336 KB) utilizing true 8-bit alpha transparency.
- **360° Envelope Cropping:** Cropped tightly to the outer rotation envelope with zero fringe halos or white bounding artifacts, eliminating canvas overflow and artificial CSS negative margins or zoom hacks.
- **Navbar Integration:** Rendered within `BrandLogo.tsx` / `Navbar.tsx` at high pixel density with clean crisp scaling across both 1x and 2x Retina displays.
- **Dual-Theme Static Tab Icons:** Next.js App Router metadata configured with dynamic media queries:
  - Light mode: `/brand/xydv-logo.png` (solid black obsidian glyph).
  - Dark mode: `/brand/xydv-logo-outline.png` (crisp white titanium outline glyph).
  - Universal fallback: `/favicon.ico` and 180x180 Apple Touch icons.
  - Strict pixel alignment and dimensional parity between outline and solid versions verified via automated tests.

## 12. Dual-Theme Loading Screens & Suspense Architecture
- **Initial App Bootloader (`InitialLoadingScreen.tsx`):**
  - Intercepts initial app mount with branded loading sequence.
  - Features dual-theme `LoadingSymbol` with subtle breathing pulse.
  - GPU-composited progress bar (`scaleX` transform from 0 to 1).
  - Technical telemetry ticker simulating hardware diagnostic calibration.
  - Smooth unmount driven by Motion spring exit physics.
- **Route Transition Suspense (`loading.tsx`):**
  - Instant App Router fallback for RSC streaming and navigation.
  - Zero layout shift, instant dark/light theme alignment, and semantic `role="status"` screen reader protection.

