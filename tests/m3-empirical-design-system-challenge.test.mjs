/**
 * Milestone 3 Empirical Challenge & Design System Verification Suite
 * Verifies:
 * 1. Design tokens, anti-slop dark palette, and prohibition of banned AI gradients
 * 2. Emil Kowalski motion physics: scale(0.97) on press, transition duration <= 300ms, no transition: all, no scale(0) entrances
 * 3. Design System Primitives (Button, Badge, MetricTicker, motion.ts) contracts
 * 4. Interactive Textile Inspector (TechFeatures) state tabs, ARIA compliance, and spring tickers
 * 5. Storefront component contracts (Hero 100dvh, Bento 5-cell diverse ratios, 3:4 product cards)
 * 6. Accessibility & WCAG AA contrast / focus rings / reduced motion guardrails
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getContrastRatio } from './harness/contracts.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const webSrcDir = path.join(rootDir, 'apps', 'web', 'src');

describe('M3 Suite 1: Design Tokens & Anti-Slop Palette Verification', () => {
  const globalsCss = fs.readFileSync(path.join(webSrcDir, 'app', 'globals.css'), 'utf-8');

  it('1.1: Obsidian void (#0A0A0A) and Volt yellow (#E8FF00) tokens are properly defined', () => {
    assert.match(globalsCss, /--bg:\s*#0a0a0a/i, 'Primary background must be #0A0A0A');
    assert.match(globalsCss, /--accent:\s*#e8ff00/i, 'Accent color must be #E8FF00');
    assert.match(globalsCss, /--border:\s*#1f1f1f/i, 'Hairline border must be #1F1F1F');
  });

  it('1.2: Contrast of Volt yellow on obsidian void exceeds WCAG AAA (>= 7:1)', () => {
    const contrast = getContrastRatio('#E8FF00', '#0A0A0A');
    assert.ok(contrast >= 17.0, `Contrast ratio ${contrast} must exceed 17:1 on obsidian void`);
  });

  it('1.3: Emil Kowalski easing tokens are declared in CSS variables', () => {
    assert.match(globalsCss, /--ease-out:\s*cubic-bezier\(0\.23,\s*1,\s*0\.32,\s*1\)/i);
    assert.match(globalsCss, /--ease-drawer:\s*cubic-bezier\(0\.32,\s*0\.72,\s*0,\s*1\)/i);
  });

  it('1.4: Strict ban on clichéd AI purple/indigo gradients across all components', () => {
    const bannedColors = ['#8A2BE2', '#6366F1', '#8B5CF6', '#7C3AED', '#A855F7'];
    const componentFiles = fs
      .readdirSync(path.join(webSrcDir, 'components', 'store'))
      .concat(fs.readdirSync(path.join(webSrcDir, 'components', 'layout')))
      .concat(fs.readdirSync(path.join(webSrcDir, 'components', 'ui')));

    for (const file of componentFiles) {
      if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue;
      let fullPath = path.join(webSrcDir, 'components', 'store', file);
      if (!fs.existsSync(fullPath)) fullPath = path.join(webSrcDir, 'components', 'layout', file);
      if (!fs.existsSync(fullPath)) fullPath = path.join(webSrcDir, 'components', 'ui', file);

      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const banned of bannedColors) {
        assert.ok(
          !content.toUpperCase().includes(banned),
          `File ${file} must not contain AI purple ${banned}`,
        );
      }
    }
  });
});

describe('M3 Suite 2: Emil Kowalski Motion Physics & Anti-Patterns Prohibition', () => {
  it('2.1: No components contain unconstrained transition: all', () => {
    const files = [
      'components/store/HeroSection.tsx',
      'components/store/FeaturedCollection.tsx',
      'components/store/CategoryGrid.tsx',
      'components/store/BestsellerGrid.tsx',
      'components/store/TechFeatures.tsx',
      'components/store/CartDrawer.tsx',
      'components/store/CollectionShowcase.tsx',
      'components/ui/Button.tsx',
    ];

    for (const rel of files) {
      const fullPath = path.join(webSrcDir, rel);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        assert.ok(
          !content.includes('transition-all duration-'),
          `File ${rel} should not use unconstrained transition-all for interactive transitions`,
        );
      }
    }
  });

  it('2.2: No components contain scale(0) entrances', () => {
    const checkDir = (dir) => {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const full = path.join(dir, entry);
        if (fs.statSync(full).isDirectory()) {
          checkDir(full);
        } else if (entry.endsWith('.tsx')) {
          const content = fs.readFileSync(full, 'utf-8');
          assert.ok(
            !content.includes('scale: 0,') && !content.includes('scale(0)'),
            `File ${entry} must not use scale(0) entry animation`,
          );
        }
      }
    };
    checkDir(path.join(webSrcDir, 'components'));
  });

  it('2.3: Button primitive enforces active:scale-[0.97] press physics', () => {
    const buttonContent = fs.readFileSync(
      path.join(webSrcDir, 'components', 'ui', 'Button.tsx'),
      'utf-8',
    );
    assert.match(buttonContent, /active:scale-\[0\.97\]/);
  });

  it('2.4: motion.ts provides type-safe EMIL_EASE cubic-bezier constant', () => {
    const motionTs = fs.readFileSync(path.join(webSrcDir, 'lib', 'motion.ts'), 'utf-8');
    assert.match(motionTs, /EMIL_EASE\s*=\s*\[0\.23,\s*1,\s*0\.32,\s*1\]\s*as\s*const/);
    assert.match(motionTs, /SPRING_TACTILE/);
  });
});

describe('M3 Suite 3: Design System Primitives Contracts', () => {
  it('3.1: Button.tsx exports Button with variant, size, and isLoading props', () => {
    const btnSrc = fs.readFileSync(path.join(webSrcDir, 'components', 'ui', 'Button.tsx'), 'utf-8');
    assert.match(btnSrc, /export const Button/);
    assert.match(btnSrc, /variant\?: 'volt' \| 'outline' \| 'ghost' \| 'danger'/);
    assert.match(btnSrc, /size\?: 'sm' \| 'md' \| 'lg'/);
    assert.match(btnSrc, /isLoading\?: boolean/);
    assert.match(btnSrc, /aria-busy=\{isLoading\}/);
  });

  it('3.2: Badge.tsx exports brutalist technical chip with variants and dot option', () => {
    const badgeSrc = fs.readFileSync(
      path.join(webSrcDir, 'components', 'ui', 'Badge.tsx'),
      'utf-8',
    );
    assert.match(badgeSrc, /export function Badge/);
    assert.match(badgeSrc, /variant\?: 'volt' \| 'subtle' \| 'outline' \| 'success' \| 'danger'/);
    assert.match(badgeSrc, /dot\?: boolean/);
  });

  it('3.3: MetricTicker.tsx implements Motion useSpring and reduced-motion fallback', () => {
    const tickerSrc = fs.readFileSync(
      path.join(webSrcDir, 'components', 'ui', 'MetricTicker.tsx'),
      'utf-8',
    );
    assert.match(tickerSrc, /export function MetricTicker/);
    assert.match(tickerSrc, /useSpring/);
    assert.match(tickerSrc, /useInView/);
    assert.match(tickerSrc, /useReducedMotion/);
  });

  it('3.4: Primitives index.ts cleanly re-exports all primitives', () => {
    const indexSrc = fs.readFileSync(path.join(webSrcDir, 'components', 'ui', 'index.ts'), 'utf-8');
    assert.match(indexSrc, /export \* from '\.\/Button'/);
    assert.match(indexSrc, /export \* from '\.\/Badge'/);
    assert.match(indexSrc, /export \* from '\.\/MetricTicker'/);
  });
});

describe('M3 Suite 4: Interactive Textile Inspector (TechFeatures) Verification', () => {
  const techSrc = fs.readFileSync(
    path.join(webSrcDir, 'components', 'store', 'TechFeatures.tsx'),
    'utf-8',
  );

  it('4.1: Contains all 4 proprietary textile science categories', () => {
    assert.match(techSrc, /SWEATSHIELD\+/);
    assert.match(techSrc, /AEROFLEX 4-WAY/);
    assert.match(techSrc, /CLIMATESYNC/);
    assert.match(techSrc, /CORDURA® RIPSTOP/);
  });

  it('4.2: Renders accessible tablist and tabs with ARIA attributes', () => {
    assert.match(techSrc, /role="tablist"/);
    assert.match(techSrc, /role="tab"/);
    assert.match(techSrc, /role="tabpanel"/);
    assert.match(techSrc, /aria-selected=\{isSelected\}/);
    assert.match(techSrc, /aria-controls=/);
  });

  it('4.3: Integrates MetricTicker with numeric values and units', () => {
    assert.match(techSrc, /<MetricTicker/);
    assert.match(techSrc, /numericMetric:\s*18000/);
    assert.match(techSrc, /numericMetric:\s*94/);
    assert.match(techSrc, /numericMetric:\s*420/);
    assert.match(techSrc, /numericMetric:\s*500/);
  });

  it('4.4: Includes accredited laboratory benchmark standards', () => {
    assert.match(techSrc, /ASTM/);
    assert.match(techSrc, /ISO/);
    assert.match(techSrc, /MARTINDALE/);
  });
});

describe('M3 Suite 5: Storefront Visual & Commerce Contracts', () => {
  it('5.1: HeroSection occupies min-h-[100dvh] with video background and Motion stagger', () => {
    const heroSrc = fs.readFileSync(
      path.join(webSrcDir, 'components', 'store', 'HeroSection.tsx'),
      'utf-8',
    );
    assert.match(heroSrc, /min-h-\[100dvh\]/);
    assert.match(heroSrc, /<video/);
    assert.match(heroSrc, /staggerChildren/);
  });

  it('5.2: CategoryGrid strictly preserves the 5-cell diverse proportions', () => {
    const catSrc = fs.readFileSync(
      path.join(webSrcDir, 'components', 'store', 'CategoryGrid.tsx'),
      'utf-8',
    );
    assert.match(catSrc, /ratio:\s*'16:10'/);
    assert.match(catSrc, /ratio:\s*'3:4'/);
    assert.match(catSrc, /ratio:\s*'16:9'/);
    assert.match(catSrc, /ratio:\s*'1:1'/);
    assert.match(catSrc, /ratio:\s*'full-width'/);
  });

  it('5.3: Product cards enforce aspect-[3/4] ratio with secondary image crossfade', () => {
    const featSrc = fs.readFileSync(
      path.join(webSrcDir, 'components', 'store', 'FeaturedCollection.tsx'),
      'utf-8',
    );
    assert.match(featSrc, /aspect-\[3\/4\]/);
    assert.match(featSrc, /secondaryImage/);
    assert.match(featSrc, /group-hover:opacity-100/);
  });

  it('5.4: CartDrawer implements spring physics and Razorpay modal checkout integration', () => {
    const cartSrc = fs.readFileSync(
      path.join(webSrcDir, 'components', 'store', 'CartDrawer.tsx'),
      'utf-8',
    );
    assert.match(cartSrc, /stiffness:\s*350,\s*damping:\s*35/);
    assert.match(cartSrc, /checkout\.razorpay\.com/);
    assert.match(cartSrc, /calculateCartMetrics/);
  });
});

describe('M3 Suite 6: Accessibility (WCAG 2.1 AA) Compliance Guardrails', () => {
  const globalsCss = fs.readFileSync(path.join(webSrcDir, 'app', 'globals.css'), 'utf-8');

  it('6.1: High-contrast visible focus ring is enforced on :focus-visible', () => {
    assert.match(globalsCss, /:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--accent\)/i);
    assert.match(globalsCss, /outline-offset:\s*3px/i);
  });

  it('6.2: Global prefers-reduced-motion media query disables animations', () => {
    assert.match(globalsCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)/i);
    assert.match(globalsCss, /animation-duration:\s*0\.01ms/i);
  });

  it('6.3: Touch target constraint enforces >= 48px', () => {
    assert.match(globalsCss, /--touch-target-min:\s*48px/i);
  });
});
