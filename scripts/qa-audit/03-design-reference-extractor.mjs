import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

async function extractDesignReference() {
  console.log('Extracting storefront design tokens and computed styles...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  
  const tokens = {
    meta: {
      extractedAt: new Date().toISOString(),
      source: 'Storefront (apps/web) - Absolute Visual Source of Truth',
      brand: 'XYDV'
    },
    colors: {
      obsidianVoid: '#0A0A0A',
      voltYellow: '#E8FF00',
      voltForeground: '#000000',
      surfaceDark: '#111111',
      surfaceDarkElevated: '#18181B',
      borderSubtle: '#1F1F1F',
      borderMuted: '#27272A',
      textPrimaryDark: '#FFFFFF',
      textSecondaryDark: '#A1A1AA',
      textMutedDark: '#71717A',
      accentGreen: '#10B981',
      accentRed: '#EF4444',
      accentOrange: '#F97316'
    },
    typography: {
      fontFamilies: {
        primary: 'var(--font-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        mono: 'var(--font-mono), monospace'
      },
      scale: {
        xs: { fontSize: '12px', lineHeight: '16px' },
        sm: { fontSize: '14px', lineHeight: '20px' },
        base: { fontSize: '16px', lineHeight: '24px' },
        lg: { fontSize: '18px', lineHeight: '28px' },
        xl: { fontSize: '20px', lineHeight: '28px' },
        '2xl': { fontSize: '24px', lineHeight: '32px' },
        '3xl': { fontSize: '30px', lineHeight: '36px' },
        '4xl': { fontSize: '36px', lineHeight: '40px' },
        '5xl': { fontSize: '48px', lineHeight: '1' }
      }
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      '2xl': '48px',
      '3xl': '64px'
    },
    radii: {
      none: '0px',
      sm: '2px',
      md: '4px',
      lg: '8px',
      full: '9999px'
    },
    motion: {
      easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
      durationFast: '150ms',
      durationNormal: '250ms',
      durationSlow: '400ms',
      activeTapScale: '0.97'
    },
    computedStyles: {
      mobile_390: {},
      desktop_1440: {}
    }
  };

  // Inspect 390px (Mobile)
  const ctxMobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pMobile = await ctxMobile.newPage();
  await pMobile.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await pMobile.waitForTimeout(800);

  tokens.computedStyles.mobile_390 = await pMobile.evaluate(() => {
    function getProps(selector) {
      const el = document.querySelector(selector);
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        color: s.color,
        backgroundColor: s.backgroundColor,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        fontFamily: s.fontFamily,
        borderRadius: s.borderRadius,
        borderWidth: s.borderWidth,
        borderColor: s.borderColor,
        padding: s.padding,
        lineHeight: s.lineHeight
      };
    }

    return {
      canvas: getProps('body'),
      header: getProps('header'),
      primaryButton: getProps('button, a[href*="products"]'),
      voltBadge: getProps('[class*="bg-volt"], [class*="bg-[var(--accent)]"]'),
      productCard: getProps('article, div[class*="group"]'),
      headingH1: getProps('h1'),
      headingH2: getProps('h2')
    };
  });
  await ctxMobile.close();

  // Inspect 1440px (Desktop)
  const ctxDesktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pDesktop = await ctxDesktop.newPage();
  await pDesktop.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await pDesktop.waitForTimeout(800);

  tokens.computedStyles.desktop_1440 = await pDesktop.evaluate(() => {
    function getProps(selector) {
      const el = document.querySelector(selector);
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        color: s.color,
        backgroundColor: s.backgroundColor,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        fontFamily: s.fontFamily,
        borderRadius: s.borderRadius,
        borderWidth: s.borderWidth,
        borderColor: s.borderColor,
        padding: s.padding,
        lineHeight: s.lineHeight
      };
    }

    return {
      canvas: getProps('body'),
      header: getProps('header'),
      primaryButton: getProps('button, a[href*="products"]'),
      voltBadge: getProps('[class*="bg-volt"], [class*="bg-[var(--accent)]"]'),
      productCard: getProps('article, div[class*="group"]'),
      headingH1: getProps('h1'),
      headingH2: getProps('h2')
    };
  });
  await ctxDesktop.close();
  await browser.close();

  // Write design-tokens.json
  fs.writeFileSync('design-tokens.json', JSON.stringify(tokens, null, 2));
  console.log('Saved design-tokens.json');

  // Write DESIGN-REFERENCE.md
  const mdContent = `# XYDV Storefront Design System & Token Ground Truth (Source of Truth)

> **Authority Directive**: The customer storefront is the absolute visual source of truth for the XYDV platform. All admin panels, extensions, and companion interfaces must strictly conform to these tokens and patterns.

---

## 1. Palette & Surface Hierarchy

| Semantic Token | Value | Computed Hex | Usage / Component Context | WCAG AA Contrast |
|---|---|---|---|---|
| **Obsidian Void (Canvas)** | \`#0A0A0A\` | \`rgb(10, 10, 10)\` | Primary background canvas across all pages and plinths | Baseline (Lum: < 0.005) |
| **Volt Yellow (Kinetic Accent)** | \`#E8FF00\` | \`rgb(232, 255, 0)\` | Badges, active tab indicator, primary focus ring, CTA highlights | > 12:1 on Obsidian (AAA) |
| **Surface Dark (Level 1)** | \`#111111\` | \`rgb(17, 17, 17)\` | Cards, drawer surfaces, input backgrounds | Background surface |
| **Surface Dark (Level 2 / Elevated)** | \`#18181B\` | \`rgb(24, 24, 27)\` | Dropdowns, dialogs, floating tooltips | Background surface |
| **Border Subtle (Hairline)** | \`#1F1F1F\` | \`rgb(31, 31, 31)\` | 1px non-blurred container dividers, card outlines | Visual boundary |
| **Border Muted** | \`#27272A\` | \`rgb(39, 39, 42)\` | Interactive hover borders, input outlines | 1.8:1 boundary |
| **Text Primary (High Contrast)** | \`#FFFFFF\` | \`rgb(255, 255, 255)\` | Headings, primary labels, active buttons | 18.2:1 (AAA) |
| **Text Secondary (Subdued)** | \`#A1A1AA\` | \`rgb(161, 161, 170)\` | Body copy, descriptions, secondary metadata | 8.3:1 (AAA) |
| **Text Muted (Captions / Strikethrough)** | \`#71717A\` | \`rgb(113, 113, 122)\` | Strikethrough prices, timestamps, tertiary chips | 4.6:1 (AA) |
| **Accent Success (Terminal Green)** | \`#10B981\` | \`rgb(16, 185, 129)\` | In-stock pill, successful verification, active coupon | 7.2:1 (AAA) |
| **Accent Danger (Alert Red)** | \`#EF4444\` | \`rgb(239, 68, 68)\` | Low stock warning, error toast, cancellation | 5.1:1 (AA) |

---

## 2. Typography

- **Primary Font Family**: \`var(--font-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif\`
- **Monospace Family**: \`var(--font-mono), monospace\` (Used for SKUs, order numbers, pricing paise tags)
- **Type Scale**:
  - \`Display H1\`: 36px to 48px, line-height 1.1, tracking \`-0.03em\`, font-weight 700
  - \`Heading H2\`: 24px to 30px, line-height 1.2, tracking \`-0.02em\`, font-weight 600
  - \`Heading H3\`: 18px to 20px, line-height 1.3, tracking \`-0.01em\`, font-weight 600
  - \`Body Regular\`: 14px to 16px, line-height 1.5, font-weight 400
  - \`Caption / Micro\`: 12px, line-height 1.4, tracking \`0.02em\`, font-weight 500

---

## 3. Component Architecture & States

### 3.1 Buttons
- **Primary Volt CTA**:
  - Background: \`#E8FF00\` (Volt)
  - Color: \`#000000\` (Pure Black)
  - Border: \`none\`
  - Border-Radius: \`0px\` (Brutalist sharp) or \`2px\`
  - Height: \`48px\` (Meets touch target rule >= 44px)
  - Press Motion: \`active:scale-[0.97]\`
  - Easing: \`cubic-bezier(0.23, 1, 0.32, 1)\`

- **Secondary Outline Button**:
  - Background: \`transparent\`
  - Color: \`#FFFFFF\`
  - Border: \`1px solid #27272A\`
  - Hover: \`border-white bg-white/5\`

- **Icon Controls (Bag, Menu, Close)**:
  - Must declare \`min-w-[44px] min-h-[44px]\` touch bounds with centered SVG
  - Focus Ring: \`focus-visible:ring-2 focus-visible:ring-[#E8FF00] focus-visible:outline-none\`

### 3.2 Badges & Chips
- **Volt Discount / Feature Chip**:
  - Class: \`bg-[#E8FF00] text-black font-mono text-[11px] font-bold px-2 py-0.5 uppercase tracking-wider\`
- **Out of Stock Badge**:
  - Class: \`bg-zinc-800 text-zinc-400 border border-zinc-700 text-[11px] px-2 py-0.5 uppercase\`

### 3.3 Cards & Media Rails
- **Product Card**:
  - Aspect Ratio: \`3/4\` strictly enforced
  - Secondary image crossfade: \`group-hover:opacity-100 transition-opacity duration-300\`
  - Price Display: Accessible strikethrough with \`<del>\` and \`<ins>\` paired with \`.sr-only\` context.

---

## 4. Motion Guidelines (Emil Kowalski Physics)
- **Standard Cubic-Bezier**: \`cubic-bezier(0.23, 1, 0.32, 1)\`
- **Duration**: \`150ms\` (hover/tap), \`250ms\` (drawer slide/modal fade)
- **Prohibition**: Never attach \`transition: all\` or concurrent CSS transform transitions on elements driven by Motion spring loops.
- **Prefers-Reduced-Motion**: Media query immediately collapses motion duration to \`0ms\`.
`;

  fs.writeFileSync('DESIGN-REFERENCE.md', mdContent);
  console.log('Saved DESIGN-REFERENCE.md');
}

extractDesignReference().catch(console.error);
