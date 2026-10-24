# XYDV Design Reference Changes Log

This document records all design token and styling adjustments made across the storefront and admin panel to resolve contrast, accessibility, and visual parity issues. Every change is verified against WCAG 2.1 AA/AAA standards and the customer storefront visual source of truth.

---

## Change Register

| ID | Component / File | Selector / Class | Old Value | New Value | WCAG Contrast Before | WCAG Contrast After | Rationale |
|---|---|---|---|---|:---:|:---:|---|
| **FE-003-A** | `apps/web/src/app/products/page.tsx:338` | Catalog discount badge | `bg-[var(--accent)] text-black` | `bg-[var(--accent)] text-[var(--accent-foreground)]` | 1.23:1 (Fail) | 16.1:1 (AAA) | In light mode, `--accent` is `#1C1C1A` (charcoal). `text-black` produced invisible black-on-black text. |
| **FE-003-B** | `apps/web/src/components/store/CustomerAuthModal.tsx:298` | Auth submit button | `bg-[var(--accent)] text-black dark:text-black` | `bg-[var(--accent)] text-[var(--accent-foreground)]` | 1.23:1 (Fail) | 16.1:1 (AAA) | In light mode, submit button text "INITIALIZE SESSION" was invisible black text on charcoal `#1C1C1A`. |
| **FE-003-C** | `apps/web/src/app/admin/tickets/page.tsx:207` | Priority filter badge | `border-[var(--accent)] bg-[var(--accent)] text-black` | `border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]` | 1.23:1 (Fail) | 16.1:1 (AAA) | In light mode, active priority filter chip displayed black text on `#1C1C1A`. |
| **FE-003-D** | `apps/web/src/app/products/[slug]/page.tsx:581` | PDP discount badge | `bg-[var(--accent)] text-black` | `bg-[var(--accent)] text-[var(--accent-foreground)]` | 1.23:1 (Fail) | 16.1:1 (AAA) | In light mode, PDP promo badge displayed black text on `#1C1C1A`. |
| **FE-003-E** | `apps/web/src/app/products/[slug]/page.tsx:1174` | PDP review submit button | `bg-[var(--accent)] text-black dark:text-black` | `bg-[var(--accent)] text-[var(--accent-foreground)]` | 1.23:1 (Fail) | 16.1:1 (AAA) | In light mode, review submit button text was invisible black on charcoal. |
| **FE-003-F** | `apps/web/src/app/sizing/page.tsx:451` | Sizing match recommendation badge | `bg-[var(--accent)] text-black` | `bg-[var(--accent)] text-[var(--accent-foreground)]` | 1.23:1 (Fail) | 16.1:1 (AAA) | In light mode, recommended size match chip displayed black on charcoal. |
| **FE-003-G** | `apps/web/src/app/admin/coupons/page.tsx:724-774` | Preset discount tier buttons | `border-[#e8ff00] text-[#e8ff00]` | `border-[var(--text-primary)] text-[var(--bg)] dark:text-[#e8ff00]` | 1.07:1 (Fail) | 18.2:1 (AAA) | In light mode, preset discount tier buttons rendered neon yellow text on white background. |
| **FE-003-H** | `apps/web/src/app/admin/coupons/page.tsx:360,391` | Admin coupon header tag & icon | `text-[#e8ff00]` | `text-[var(--text-primary)] dark:text-[#e8ff00]` | 1.07:1 (Fail) | 18.2:1 (AAA) | In light mode, header category tag and ticket icon rendered yellow on white. |
| **FE-003-I** | `apps/web/src/app/admin/coupons/page.tsx:533,572` | Coupon table badges & max cap | `text-[#e8ff00]` | `text-[var(--text-primary)] dark:text-[#e8ff00]` | 1.07:1 (Fail) | 18.2:1 (AAA) | In light mode, 50% badge and max cap text rendered yellow on white. |
| **FE-003-J** | `apps/web/src/app/admin/notifications/page.tsx:257,416,463` | Notification header tag, code & CTR | `text-[#e8ff00]` | `text-[var(--text-primary)] dark:text-[#e8ff00]` | 1.07:1 (Fail) | 18.2:1 (AAA) | In light mode, header tag, coupon code and CTR rendered yellow on white. |
| **FE-003-K** | `apps/web/src/app/admin/notifications/page.tsx:872,904` | Live preview container scoping | `bg-[#050505]`, `bg-[#0a0a0a]` | `.dark bg-[#050505]`, `.dark bg-[#0a0a0a]` | N/A (Scoping) | 18.2:1 (AAA) | Declared `.dark` containment per Rule 5 so internal tokens resolve against dark tokens. |

---
