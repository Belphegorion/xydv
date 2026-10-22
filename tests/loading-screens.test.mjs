/**
 * Loading Screens Architectural & Visual Verification Suite
 * Verifies:
 * 1. Presence and integrity of the 4 uploaded static brand symbols in apps/web/public/brand/
 * 2. LoadingSymbol primitive contract & dual-theme image support
 * 3. InitialLoadingScreen features: progress bar, outline-to-solid transition, Emil Kowalski unmount
 * 4. Page loading screen (apps/web/src/app/loading.tsx) Suspense contract
 * 5. Anti-slop palette, motion physics, and accessibility compliance
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'apps', 'web');
const brandDir = path.join(webDir, 'public', 'brand');
const webSrcDir = path.join(webDir, 'src');

describe('Loading Screens Brand Assets & Architectural Contracts', () => {
  it('1. All 4 static brand symbol assets exist and are valid PNG images', () => {
    const requiredImages = [
      'xydv-symbol-outline.png',
      'xydv-symbol-outline-white.png',
      'xydv-symbol-solid.png',
      'xydv-symbol-solid-white.png',
    ];

    for (const imgName of requiredImages) {
      const fullPath = path.join(brandDir, imgName);
      assert.ok(fs.existsSync(fullPath), `Asset ${imgName} must exist in public/brand/`);
      const stat = fs.statSync(fullPath);
      assert.ok(stat.size > 1000, `Asset ${imgName} must have non-zero content (>1KB)`);
      const buf = fs.readFileSync(fullPath);
      assert.equal(buf.readUInt32BE(0), 0x89504E47, `Asset ${imgName} must be a valid PNG`);
    }
  });

  it('2. LoadingSymbol cleanly implements dual-theme static image switching', () => {
    const symbolSrc = fs.readFileSync(
      path.join(webSrcDir, 'components', 'ui', 'LoadingSymbol.tsx'),
      'utf-8'
    );

    // Light Mode references
    assert.match(symbolSrc, /\/brand\/xydv-symbol-outline\.png/);
    assert.match(symbolSrc, /\/brand\/xydv-symbol-solid\.png/);

    // Dark Mode references
    assert.match(symbolSrc, /\/brand\/xydv-symbol-outline-white\.png/);
    assert.match(symbolSrc, /\/brand\/xydv-symbol-solid-white\.png/);

    // Tailwind dual-theme switching classes
    assert.match(symbolSrc, /block\s+dark:hidden/);
    assert.match(symbolSrc, /hidden\s+dark:block/);

    // Clip-path / fill progress reveal
    assert.match(symbolSrc, /clipPath/);
  });

  it('3. InitialLoadingScreen implements progress bar, telemetry, and smooth unmount', () => {
    const initialSrc = fs.readFileSync(
      path.join(webSrcDir, 'components', 'ui', 'InitialLoadingScreen.tsx'),
      'utf-8'
    );

    assert.match(initialSrc, /<LoadingSymbol/);
    assert.match(initialSrc, /AnimatePresence/);
    assert.match(initialSrc, /role="status"/);
    assert.match(initialSrc, /aria-live="polite"/);
    assert.match(initialSrc, /aria-label=/);
    assert.match(initialSrc, /fixed\s+inset-0/);
    assert.match(initialSrc, /EMIL_EASE/);
    assert.match(initialSrc, /useReducedMotion/);
  });

  it('4. InitialLoadingScreen is integrated in app layout.tsx', () => {
    const layoutSrc = fs.readFileSync(path.join(webSrcDir, 'app', 'layout.tsx'), 'utf-8');
    assert.match(layoutSrc, /InitialLoadingScreen/);
    assert.match(layoutSrc, /<InitialLoadingScreen\s*\/>/);
  });

  it('5. Page loading screen (loading.tsx) exists and implements Suspense contract', () => {
    const loadingSrc = fs.readFileSync(path.join(webSrcDir, 'app', 'loading.tsx'), 'utf-8');
    assert.match(loadingSrc, /export\s+default\s+function\s+Loading/);
    assert.match(loadingSrc, /<LoadingSymbol/);
    assert.match(loadingSrc, /role="status"/);
    assert.match(loadingSrc, /aria-live="polite"/);
    assert.match(loadingSrc, /aria-label=/);
    assert.match(loadingSrc, /variant="pulse"/);
  });

  it('6. Strict compliance with motion physics and prohibition of anti-patterns', () => {
    const files = [
      path.join(webSrcDir, 'components', 'ui', 'LoadingSymbol.tsx'),
      path.join(webSrcDir, 'components', 'ui', 'InitialLoadingScreen.tsx'),
      path.join(webSrcDir, 'app', 'loading.tsx'),
    ];

    const bannedColors = ['#8A2BE2', '#6366F1', '#8B5CF6', '#7C3AED', '#A855F7'];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      assert.ok(!content.includes('scale: 0,') && !content.includes('scale(0)'), `${file} must not contain scale(0)`);
      assert.ok(!content.includes('transition-all duration-'), `${file} must not contain transition-all duration-`);

      for (const banned of bannedColors) {
        assert.ok(!content.toUpperCase().includes(banned), `${file} must not contain banned AI color ${banned}`);
      }
    }
  });

  it('7. Dimensional and pixel canvas alignment parity across outline and solid symbols', () => {
    const files = [
      'xydv-symbol-outline.png',
      'xydv-symbol-outline-white.png',
      'xydv-symbol-solid.png',
      'xydv-symbol-solid-white.png',
    ];

    for (const file of files) {
      const buf = fs.readFileSync(path.join(brandDir, file));
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      assert.equal(width, 1024, `${file} width must be 1024px`);
      assert.equal(height, 1024, `${file} height must be 1024px`);
    }
  });

  it('8. WCAG 2.1 AA screen reader protection and progressbar semantic contracts', () => {
    const initialSrc = fs.readFileSync(
      path.join(webSrcDir, 'components', 'ui', 'InitialLoadingScreen.tsx'),
      'utf-8'
    );
    const loadingSrc = fs.readFileSync(path.join(webSrcDir, 'app', 'loading.tsx'), 'utf-8');

    // Progressbar semantics
    assert.match(initialSrc, /role="progressbar"/);
    assert.match(initialSrc, /aria-valuenow=\{progress\}/);
    assert.match(initialSrc, /aria-valuemin=\{0\}/);
    assert.match(initialSrc, /aria-valuemax=\{100\}/);

    // Numeric counter must be hidden from screen readers to prevent 60fps announcement storms
    assert.match(initialSrc, /aria-hidden="true"[^>]*>\{progress\}%/);

    // Page loading screen progressbar
    assert.match(loadingSrc, /role="progressbar"/);
  });

  it('9. GPU composited transform performance (no layout-thrashing left animations)', () => {
    const loadingSrc = fs.readFileSync(path.join(webSrcDir, 'app', 'loading.tsx'), 'utf-8');
    assert.ok(!loadingSrc.includes("left: ['-35%', '100%']"), 'loading.tsx must not animate left property to avoid reflows');
    assert.match(loadingSrc, /x:\s*\['-100%',\s*'300%'\]/, 'loading.tsx must use GPU-composited x transform');
  });
});
