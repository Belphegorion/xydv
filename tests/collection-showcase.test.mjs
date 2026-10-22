/**
 * CollectionShowcase Unit & Contract Verification Suite
 * Verifies the elevated ASRV reference implementation:
 * 1. Semantic <picture> element with responsive <source> and <img> (alt, lazy, async)
 * 2. Multi-layer directional scrims (top and bottom) with unoccluded midtones
 * 3. Authentic 3-discipline ASRV showcase grid (RUN, TRAIN with ASRV-WOMENS-133.jpg, REC)
 * 4. Dual Men and Women navigation actions without invalid nested <button> tags
 * 5. Tactile actions with accessible links, duration-300, active:scale-[0.97]
 * 6. High-contrast focus rings: focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black
 * 7. Emil Kowalski motion physics: transition duration <= 300ms, no transition-all, no scale(0)
 * 8. Zero banned AI colors (#8A2BE2, #6366F1, #8B5CF6, #7C3AED, #A855F7)
 * 9. Integration into page.tsx between BrandStatement and BestsellerGrid
 * 10. Clean export from components/store/index.ts
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

describe('CollectionShowcase Architectural & Design Verification', () => {
  const showcasePath = path.join(webSrcDir, 'components', 'store', 'CollectionShowcase.tsx');
  const showcaseContent = fs.readFileSync(showcasePath, 'utf-8');

  it('1. Replaces non-semantic divs with semantic <picture>, responsive <source>, and fallback <img>', () => {
    assert.match(showcaseContent, /<picture[\s\S]*?>[\s\S]*?<source[\s\S]*?\/>[\s\S]*?<img[\s\S]*?\/>[\s\S]*?<\/picture>/);
    assert.match(showcaseContent, /media="\(min-width:\s*1024px\)"/);
    assert.match(showcaseContent, /media="\(min-width:\s*640px\)"/);
    assert.match(showcaseContent, /loading="lazy"/);
    assert.match(showcaseContent, /decoding="async"/);
    assert.match(showcaseContent, /alt=\{item\.images\.alt\}/);
  });

  it('2. Calibrated multi-layer directional scrims leave midtones unoccluded', () => {
    assert.match(showcaseContent, /bg-gradient-to-b\s+from-black/);
    assert.match(showcaseContent, /bg-gradient-to-t\s+from-black/);
    assert.match(showcaseContent, /pointer-events-none/);
    assert.match(showcaseContent, /aria-hidden="true"/);
  });

  it('3. Features authentic ASRV disciplines (RUN, TRAIN with ASRV-WOMENS-133, REC) and zero engineered material specs', () => {
    assert.match(showcaseContent, /grid-cols-1\s+md:grid-cols-3/);
    assert.match(showcaseContent, /title:\s*'RUN'/);
    assert.match(showcaseContent, /title:\s*'TRAIN'/);
    assert.match(showcaseContent, /title:\s*'REC'/);
    assert.match(showcaseContent, /ASRV-WOMENS-133\.jpg/);
    assert.match(showcaseContent, /DIV\.01/);
    assert.match(showcaseContent, /SWEATSHIELD\+/);
    assert.match(showcaseContent, /DIV\.02/);
    assert.match(showcaseContent, /CORDURA®\s+RIPSTOP/);
    // Explicitly verify removal of fabricated material specs
    assert.ok(!showcaseContent.includes('180 GSM KNIT'), 'Fabricated 180 GSM KNIT must be removed');
    assert.ok(!showcaseContent.includes('4-WAY REBOUND (94%)'), 'Fabricated rebound spec must be removed');
    assert.ok(!showcaseContent.includes('ZERO ODOR BARRIER'), 'Fabricated odor barrier spec must be removed');
  });

  it('4. Dual Men and Women navigation actions without invalid nested <button> tags', () => {
    assert.match(showcaseContent, /<Link[\s\S]*?href=\{item\.actions\.men\.href\}/);
    assert.match(showcaseContent, /<Link[\s\S]*?href=\{item\.actions\.women\.href\}/);
    assert.ok(!showcaseContent.includes('<button'), 'Card must not contain invalid nested <button> tags');
  });

  it('5. Dual action buttons are styled as accessible tactile pills with active:scale-[0.97]', () => {
    assert.match(showcaseContent, /btn-tactile/);
    assert.match(showcaseContent, /touch-target/);
    assert.match(showcaseContent, /active:scale-\[0\.97\]/);
  });

  it('6. Explicit high-contrast focus rings for dark card surfaces are configured', () => {
    assert.match(showcaseContent, /focus-visible:ring-2/);
    assert.match(showcaseContent, /focus-visible:ring-white/);
    assert.match(showcaseContent, /focus-visible:ring-offset-2/);
    assert.match(showcaseContent, /focus-visible:ring-offset-black/);
  });

  it('7. Emil Kowalski motion physics: all transition durations <= 300ms, no transition-all, no scale(0)', () => {
    assert.ok(!showcaseContent.includes('transition-all'), 'No unconstrained transition-all');
    assert.ok(!showcaseContent.includes('scale(0)'), 'No scale(0) entrances');
    assert.ok(!showcaseContent.includes('scale: 0'), 'No scale: 0 entrances');
    const durationMatches = showcaseContent.match(/duration-(\d+)/g) || [];
    for (const d of durationMatches) {
      const ms = parseInt(d.replace('duration-', ''), 10);
      assert.ok(ms <= 300, `Transition duration ${d} must be <= 300ms`);
    }
  });

  it('8. Zero banned AI purple/indigo colors present', () => {
    const bannedColors = ['#8A2BE2', '#6366F1', '#8B5CF6', '#7C3AED', '#A855F7'];
    const upper = showcaseContent.toUpperCase();
    for (const banned of bannedColors) {
      assert.ok(!upper.includes(banned), `Must not contain banned AI color ${banned}`);
    }
  });

  it('9. Integrated in page.tsx between BrandStatement and BestsellerGrid', () => {
    const pagePath = path.join(webSrcDir, 'app', 'page.tsx');
    const pageContent = fs.readFileSync(pagePath, 'utf-8');
    assert.match(pageContent, /import\s*\{\s*CollectionShowcase\s*\}\s*from/);
    const brandIdx = pageContent.indexOf('<BrandStatement');
    const showcaseIdx = pageContent.indexOf('<CollectionShowcase');
    const bestsellerIdx = pageContent.indexOf('<BestsellerGrid');
    assert.ok(brandIdx !== -1, 'BrandStatement must exist');
    assert.ok(showcaseIdx !== -1, 'CollectionShowcase must exist');
    assert.ok(bestsellerIdx !== -1, 'BestsellerGrid must exist');
    assert.ok(brandIdx < showcaseIdx, 'CollectionShowcase must follow BrandStatement');
    assert.ok(showcaseIdx < bestsellerIdx, 'CollectionShowcase must precede BestsellerGrid');
  });

  it('10. Clean export in components/store/index.ts', () => {
    const indexPath = path.join(webSrcDir, 'components', 'store', 'index.ts');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    assert.match(indexContent, /export\s*\*\s*from\s*'\.\/CollectionShowcase'/);
  });

  it('11. Desktop hover reveal for Men and Women action buttons with mobile immediate accessibility', () => {
    // Hidden on desktop at rest, revealed on desktop group-hover
    assert.match(showcaseContent, /sm:opacity-0/);
    assert.match(showcaseContent, /sm:group-hover:opacity-100/);
    assert.match(showcaseContent, /sm:group-hover:max-h-56/);
    assert.match(showcaseContent, /sm:group-hover:translate-y-0/);
    // Directly accessible without hover trap on mobile
    assert.match(showcaseContent, /opacity-100\s+max-h-none\s+translate-y-0/);
  });

  it('12. Delayed luxury effects on image zoom and staggered viewport entry cadence', () => {
    // Delayed image zoom on hover
    assert.match(showcaseContent, /group-hover:scale-105[\s\S]*?delay-75/);
    // Delayed hover container expansion
    assert.match(showcaseContent, /transition-\[opacity,max-height,transform\][\s\S]*?delay-100/);
    // Staggered actions reveal
    assert.match(showcaseContent, /delay-100[\s\S]*?delay-150/);
    // Viewport entrance stagger delay
    assert.match(showcaseContent, /delay:\s*shouldReduceMotion\s*\?\s*0\s*:\s*idx\s*\*\s*0\.15/);
  });
});

