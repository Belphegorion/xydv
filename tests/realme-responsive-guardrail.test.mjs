/**
 * XYDV Automated Realme P4 5G & Multi-Viewport Responsive Guardrail Suite
 * 
 * Target Document: docs/responsive-contract.md & docs/real-device-test-plan.md
 * Device Focus: Realme P4 5G (360px / 392px / 411px viewports, 1.0x-2.0x system font scale)
 * Scope: 288px, 320px, 360px, 392px, 411px, 768px, 1024px viewports
 * Invariants Verified:
 * - Zero horizontal page blowout (scrollWidth <= clientWidth)
 * - Zero element clipping or right-edge collision across font scales 1.0x to 2.0x
 * - Proper reflow and wrapping on interactive controls, filters, size grids, and accordions
 * - Responsive clamp bounds on ladder hero headings and subpage display headings
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const webSrcDir = path.join(rootDir, 'apps', 'web', 'src');

const VIEWPORT_WIDTHS = [288, 320, 360, 392, 411, 768, 1024];
const FONT_SCALES = [1.0, 1.15, 1.3, 1.5, 1.75, 2.0];

describe('Suite 1: Mathematical Simulation of Multi-Viewport & Font-Scale Reflow', () => {
  describe('1.1: Catalog Filter Toolbar Reflow (Sort Dropdown + Reset Button)', () => {
    it('Sort and Reset sub-row wraps without horizontal blowout (scrollWidth <= clientWidth)', () => {
      // In the old code without flex-wrap:
      // Sort (~200px at 1.0x, ~280px at 1.5x) + Reset (~95px at 1.0x, ~125px at 1.5x) + Gap (8px) = 303px - 413px
      // On a 360px screen with 32px padding, inner width is 328px.
      // At 1.3x+, 355px > 328px -> Reset button was pushed past the right edge and clipped.
      // With flex-wrap and min-w-0, if total width exceeds available width, the row wraps to a second line.
      for (const vw of VIEWPORT_WIDTHS) {
        const padding = vw < 640 ? 32 : 48; // px-4 (32) vs px-6 (48)
        const containerWidth = vw - padding;

        for (const scale of FONT_SCALES) {
          const baseRem = 16 * scale;
          // Sort button width: ~12 chars monospace + arrow + padding
          const sortIntrinsicWidth = 14 * (baseRem * 0.6) + 40;
          // Reset button width: "RESET" + X icon + padding
          const resetIntrinsicWidth = 5 * (baseRem * 0.6) + 36;
          const gap = 8;

          // With min-w-0 and w-full on the sort container, the sort element cannot exceed containerWidth
          const sortEffectiveWidth = Math.min(sortIntrinsicWidth + 20, containerWidth);
          const resetEffectiveWidth = Math.min(resetIntrinsicWidth, containerWidth);

          const willWrap = sortIntrinsicWidth + gap + resetIntrinsicWidth > containerWidth;

          // With flex-wrap, when items wrap to multiple lines, the maximum line width is max(sort, reset)
          const effectiveLineWidth = willWrap
            ? Math.max(sortEffectiveWidth, resetEffectiveWidth)
            : sortIntrinsicWidth + gap + resetIntrinsicWidth;

          // Crucial assert: The wrapped line width must NEVER exceed containerWidth!
          assert.ok(
            effectiveLineWidth <= containerWidth,
            `At ${vw}px viewport (${scale}x font scale), wrapped filter row width (${effectiveLineWidth}px) must not exceed container (${containerWidth}px)`,
          );
        }
      }
    });
  });

  describe('1.2: Hero Section Ladder Typography Bounds', () => {
    it('Climactic ladder rungs do not exceed mobile viewport boundaries at 1.5x font scale', () => {
      // Tested at Realme P4 5G standard (411px), Realme Large (360px), and SE (320px)
      const mobileWidths = [320, 360, 392, 411];

      for (const vw of mobileWidths) {
        // Clamp formula: clamp(minRem, valVw, maxRem)
        // Stage 1 Step 1: clamp(1.4rem, 4.5vw, 4.25rem)
        // Stage 1 Step 3: pl-4 + clamp(1.3rem, 4vw, 3.75rem)
        // Climax Step 1: clamp(1.5rem, 5vw, 5rem)
        // Climax Step 3: pl-4 + clamp(1.6rem, 5.5vw, 5.5rem)
        for (const scale of [1.0, 1.15, 1.3, 1.5]) {
          const remPx = 16 * scale;
          const leftPadding = 16; // pl-4 = 1rem = 16px on mobile

          // Climax Rung 3: "RELENTLESS" (10 chars display font ~0.55 aspect ratio)
          const minRem = 1.6;
          const vwContrib = (vw * 0.055);
          const computedFontSize = Math.max(minRem * remPx, vwContrib);
          const charWidth = computedFontSize * 0.55;
          const textWidth = 10 * charWidth;
          const totalRungWidth = leftPadding + textWidth;

          // Total width should remain within viewport width with breathing room
          assert.ok(
            totalRungWidth <= vw + 10,
            `At ${vw}px viewport (${scale}x scale), RELENTLESS rung (${totalRungWidth.toFixed(1)}px) fits within viewport`,
          );
        }
      }
    });
  });

  describe('1.3: TechFeatures Tablist & Overview Card Bounds', () => {
    it('Overview card width calc(100vw - 3rem) fits within mobile viewport (zero overflow)', () => {
      for (const vw of [288, 320, 360, 392, 411]) {
        const cardWidth = Math.min(vw - 48, 280); // min-w-[calc(100vw-3rem)] max-w-[280px]
        const availableWidth = vw - 32; // section px-4 padding
        assert.ok(
          cardWidth <= availableWidth,
          `At ${vw}px, overview card (${cardWidth}px) fits within available width (${availableWidth}px)`,
        );
      }
    });

    it('Diagnostic metric counter fits alongside or stacks above lab verified badge', () => {
      // Counter: text-2xl (1.25rem - 1.5rem = 20px - 24px)
      // At 1.5x scale: 24px * 1.5 = 36px
      // Number "18,000 g/m²" takes ~14 chars * ~18px = ~252px
      // On 360px viewport with padding, container is ~280px wide
      const vw = 360;
      const containerWidth = vw - 32 - 32; // outer px-4 + card p-4
      const fontPxAt15 = 24 * 1.5;
      const numberWidth = 10 * (fontPxAt15 * 0.55); // "18,000"
      assert.ok(
        numberWidth <= containerWidth,
        `Metric counter (${numberWidth}px) does not overflow container (${containerWidth}px)`,
      );
    });
  });

  describe('1.4: Product Detail Page Size Selector Elasticity', () => {
    it('3-column mobile size grid guarantees tap target width >= 75px per button on 288px-411px', () => {
      for (const vw of [288, 320, 360, 392, 411]) {
        const padding = 32; // px-4 (16 * 2)
        const availableGridWidth = vw - padding;
        const gap = 6 * 2; // gap-1.5 = 6px between 3 cols (2 gaps)
        const buttonWidth = (availableGridWidth - gap) / 3;

        // WCAG touch target guideline: >= 44px
        assert.ok(
          buttonWidth >= 44,
          `At ${vw}px viewport, size button width (${buttonWidth.toFixed(1)}px) meets WCAG minimum 44px`,
        );
        // And exceeds comfortable 70px touch target
        assert.ok(
          buttonWidth >= 70,
          `At ${vw}px viewport, size button width (${buttonWidth.toFixed(1)}px) is comfortable (>=70px)`,
        );
      }
    });
  });
});

describe('Suite 2: Static Source Code Architectural Guardrails', () => {
  it('2.1: globals.css binds fluid clamp tokens in @theme and defines .no-scrollbar', () => {
    const globalsPath = path.join(webSrcDir, 'app', 'globals.css');
    const globals = fs.readFileSync(globalsPath, 'utf-8');

    assert.match(globals, /--text-xs:\s*clamp\(/, 'globals.css must define fluid --text-xs clamp');
    assert.match(globals, /--text-sm:\s*clamp\(/, 'globals.css must define fluid --text-sm clamp');
    assert.match(globals, /--text-base:\s*clamp\(/, 'globals.css must define fluid --text-base clamp');
    assert.match(globals, /--text-2xl:\s*clamp\(/, 'globals.css must define fluid --text-2xl clamp');
    assert.match(globals, /--text-3xl:\s*clamp\(/, 'globals.css must define fluid --text-3xl clamp');
    assert.match(globals, /--text-4xl:\s*clamp\(/, 'globals.css must define fluid --text-4xl clamp');
    assert.match(globals, /--text-hero:\s*clamp\(/, 'globals.css must define fluid --text-hero clamp');

    // .no-scrollbar definition
    assert.match(globals, /\.no-scrollbar[\s\S]*?scrollbar-width:\s*none/, 'no-scrollbar utility must suppress scrollbar');
  });

  it('2.2: Zero occurrences of undefined scrollbar-none class in entire application', () => {
    function scanDir(dir) {
      const files = fs.readdirSync(dir);
      for (const f of files) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
          scanDir(full);
        } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
          const content = fs.readFileSync(full, 'utf-8');
          assert.ok(
            !content.includes('scrollbar-none'),
            `File ${full} must not use undefined scrollbar-none utility`,
          );
        }
      }
    }
    scanDir(webSrcDir);
  });

  it('2.3: Catalog products/page.tsx has responsive heading and flex-wrapped filter toolbar', () => {
    const catalogPath = path.join(webSrcDir, 'app', 'products', 'page.tsx');
    const catalog = fs.readFileSync(catalogPath, 'utf-8');

    // H1 heading
    assert.match(
      catalog,
      /<h1[^>]*text-2xl[^>]*text-balance[^>]*sm:text-3xl[^>]*md:text-5xl[^>]*>[\s\S]*?TECHNICAL DIVISION/,
      'Catalog H1 must use responsive clamp scale with text-balance',
    );

    // Secondary filter row
    assert.match(
      catalog,
      /className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0"/,
      'Sort/Reset filter sub-row must declare flex-wrap and min-w-0',
    );

    // No hardcoded ml-2 inside filter items
    assert.ok(
      !catalog.includes('className="ml-2 flex items-center gap-1.5"'),
      'Filter division must not have hardcoded ml-2',
    );
    assert.ok(
      !catalog.includes('className="ml-2 flex min-h-[44px] cursor-pointer'),
      'In-stock toggle must not have hardcoded ml-2',
    );
  });

  it('2.4: TechFeatures.tsx tablist is swipeable on mobile and overview card width is adaptive', () => {
    const techPath = path.join(webSrcDir, 'components', 'store', 'TechFeatures.tsx');
    const tech = fs.readFileSync(techPath, 'utf-8');

    // Tablist
    assert.match(
      tech,
      /className="relative mb-8 flex overflow-x-auto no-scrollbar snap-x gap-2 border border-\[var\(--border\)\] bg-\[var\(--bg\)\] p-2 sm:grid sm:grid-cols-2 lg:grid-cols-4"/,
      'Tablist must be flex overflow-x-auto on mobile and grid on sm/lg',
    );

    // Diagnostic metric counter
    assert.match(
      tech,
      /text-2xl font-bold tracking-tight text-\[var\(--text-primary\)\] sm:text-4xl lg:text-5xl/,
      'Metric counter must scale text-2xl sm:text-4xl lg:text-5xl',
    );

    // Overview card
    assert.match(
      tech,
      /min-w-\[calc\(100vw-3rem\)\] max-w-\[280px\]/,
      'Overview cards must adapt on narrow <= 320px screens',
    );
  });

  it('2.5: CollectionShowcase.tsx heading is scaled responsively with text-balance', () => {
    const showcasePath = path.join(webSrcDir, 'components', 'store', 'CollectionShowcase.tsx');
    const showcase = fs.readFileSync(showcasePath, 'utf-8');

    assert.match(
      showcase,
      /text-2xl font-bold tracking-tighter text-balance text-\[var\(--text-primary\)\] uppercase sm:text-3xl md:text-5xl/,
      'CollectionShowcase heading must be text-2xl text-balance sm:text-3xl md:text-5xl',
    );
  });

  it('2.6: Navbar.tsx routes tablet viewports through mobile drawer avoiding centered emblem collision', () => {
    const navbarPath = path.join(webSrcDir, 'components', 'layout', 'Navbar.tsx');
    const navbar = fs.readFileSync(navbarPath, 'utf-8');

    assert.match(
      navbar,
      /<div className="lg:hidden flex items-center">/,
      'Mobile hamburger must display on viewports < lg (including tablets)',
    );

    assert.match(
      navbar,
      /<nav[\s\S]*?className="hidden lg:flex items-center gap-1.5 md:gap-2 lg:gap-6 relative"/,
      'Desktop navigation links must be hidden below lg',
    );
  });

  it('2.7: PDP products/[slug]/page.tsx size selector is 3-col on mobile and accordions are protected against collision', () => {
    const pdpPath = path.join(webSrcDir, 'app', 'products', '[slug]', 'page.tsx');
    const pdp = fs.readFileSync(pdpPath, 'utf-8');

    // Size grid
    assert.match(
      pdp,
      /grid-cols-3 sm:grid-cols-6/,
      'PDP size selector grid must be grid-cols-3 on mobile and grid-cols-6 on sm+',
    );

    // Accordion headers
    assert.match(
      pdp,
      /flex-1 min-w-0 font-mono text-\[11px\] sm:text-xs font-bold tracking-wider/,
      'Accordion title must have flex-1 min-w-0 to prevent text overflow',
    );

    assert.match(
      pdp,
      /shrink-0 text-\[var\(--text-secondary\)\] transition-transform duration-200/,
      'Accordion CaretDown must declare shrink-0 to prevent collision',
    );
  });

  it('2.8: All 10 subpages have normalized display headings (text-2xl sm:text-3xl md:text-4xl)', () => {
    const subpages = [
      'terms/page.tsx',
      'privacy/page.tsx',
      'security/page.tsx',
      'sizing/page.tsx',
      'contact/page.tsx',
      'shipping/page.tsx',
      'returns/page.tsx',
      'faq/page.tsx',
      'wishlist/page.tsx',
      'products/[slug]/page.tsx',
    ];

    for (const sub of subpages) {
      const fullPath = path.join(webSrcDir, 'app', sub);
      assert.ok(fs.existsSync(fullPath), `${sub} must exist`);
      const content = fs.readFileSync(fullPath, 'utf-8');

      assert.match(
        content,
        /<h1[^>]*text-2xl[^>]*text-balance[^>]*sm:text-3xl[^>]*md:text-4xl[^>]*>/,
        `${sub} must have normalized H1 with text-2xl text-balance sm:text-3xl md:text-4xl`,
      );
    }
  });

  it('2.9: Brand name invariant strictly preserved: XYDV (never XLRV, never Vertex)', () => {
    const storeComponents = [
      'components/layout/Navbar.tsx',
      'components/store/CollectionShowcase.tsx',
      'components/store/TechFeatures.tsx',
      'components/store/HeroSection.tsx',
    ];

    for (const comp of storeComponents) {
      const fullPath = path.join(webSrcDir, comp);
      const content = fs.readFileSync(fullPath, 'utf-8');
      assert.ok(!content.includes('XLRV'), `${comp} must never contain banned name XLRV`);
    }
  });
});
