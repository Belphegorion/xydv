# Original User Request

## 2026-10-04T08:53:25Z

Build a high-performance, dark-aesthetic technical fashion e-commerce frontend inspired by ASRV (asrv.com) using the MERN stack with Razorpay integration and AWS cloud deployment readiness.

Working directory: c:\Users\atlas\OneDrive\ドキュメント\project-v1

## Requirements

### R1. Reference Analysis & Anti-Slop Visual Hierarchy
- Analyze ASRV (technical activewear/tactical luxury) and elevate its visual language: void obsidian background (#0A0A0A), modular technical borders (#1F1F1F), high-impact typographic hierarchy (sharp sans-serif display + technical mono metrics), and zero clichéd AI gradients.
- Utilize high-fidelity placeholder image pipelines (aspect ratio-locked, responsive srcset) avoiding broken image layouts or div-mocked screenshots.

### R2. Micro-Interaction & Motion Engineering (Emil / Animate Standards)
- Implement purposeful, physics-driven micro-interactions: responsive button tap feedback (scale(0.97) on :active), origin-aware popover/drawer scaling, and hardware-accelerated transforms (transform: translate3d/scale).
- Strict ban on scale(0) entrances, ease-in UI transitions, or unconstrained transition: all.
- Enforce full prefers-reduced-motion fallbacks across all motion layers.

### R3. Commerce Flow & Razorpay Checkout Integration
- Slide-out quick cart drawer with optimistic quantity updates, free-shipping delta progress indicators, and variant swatch live swaps.
- Native Razorpay SDK integration for modal checkout with webhook reconciliation and error resilience.

### R4. Accessibility & Structural Rigor (WCAG 2.1 AA)
- Semantic HTML landmarks (<header>, <nav>, <main>, <footer>), logical single-H1 heading hierarchy, accessible names for all icon buttons (aria-label).
- Focus rings (:focus-visible), trap focus inside modal/drawer overlays, and 48x48px minimum touch targets.

## Acceptance Criteria

### Visual & Layout Fidelity
- [ ] Hero section strictly fits within initial dynamic viewport (min-h-[100dvh]) without scroll overflow.
- [ ] Product cards feature responsive secondary-image crossfade on hover and real-time color swatch swaps.
- [ ] Category grid presents an asymmetric bento layout with diverse container proportions.

### Motion & Performance Guardrails
- [ ] All UI transition durations remain under 300ms using custom easing (cubic-bezier(0.23, 1, 0.32, 1)).
- [ ] No layout-thrashing properties animated (only transform and opacity).
- [ ] Zero animations triggered on keyboard-only navigation.

### Commerce & Payment Verification
- [ ] Cart drawer opens via spring physics, preserves state in local storage, and calculates subtotal/taxes correctly.
- [ ] Razorpay order creation and payment modal invoke cleanly with test credentials.
