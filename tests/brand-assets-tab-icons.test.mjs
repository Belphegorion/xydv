/**
 * Brand Assets, Transparent Logo & Tab Icons Verification Suite
 * Verifies:
 * 1. Animated transparent WebP generated from nobg V1.mov
 * 2. Static logo tab icons (favicon.ico, icon.png, apple-icon.png)
 * 3. Next.js metadata icons in layout.tsx
 * 4. BrandLogo & BrandEmblem components utilizing xydv-logo-nobg.webp without circular clipping
 * 5. CartDrawer using static xydv-logo.png for Razorpay modal
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

describe('Brand Assets, Transparent Logo & Tab Icons Verification', () => {
  it('1. Animated xydv-logo-nobg.webp exists, is valid animated WebP with alpha transparency', () => {
    const webpPath = path.join(brandDir, 'xydv-logo-nobg.webp');
    assert.ok(fs.existsSync(webpPath), 'xydv-logo-nobg.webp must exist in public/brand/');

    const stat = fs.statSync(webpPath);
    assert.ok(stat.size > 50000, 'WebP file size must be > 50KB');
    assert.ok(stat.size < 1000000, 'WebP file size must be < 1MB (optimized)');

    const buf = fs.readFileSync(webpPath);
    // WebP header: 'RIFF' at 0, 'WEBP' at 8, 'VP8X' at 12
    assert.equal(buf.toString('ascii', 0, 4), 'RIFF', 'Header must start with RIFF');
    assert.equal(buf.toString('ascii', 8, 12), 'WEBP', 'Header must contain WEBP');
    assert.equal(buf.toString('ascii', 12, 16), 'VP8X', 'Extended WebP must have VP8X chunk');

    // VP8X flags: byte 20 has flags. Bit 1 (0x02) = Animation, Bit 4 (0x10) = Alpha
    const flags = buf.readUInt8(20);
    const hasAlpha = (flags & 0x10) !== 0;
    const hasAnimation = (flags & 0x02) !== 0;
    assert.ok(hasAlpha, 'WebP must declare Alpha channel flag in VP8X');
    assert.ok(hasAnimation, 'WebP must declare Animation flag in VP8X');
  });

  it('2. Multi-resolution favicon.ico file exists in App Router metadata directory', () => {
    const appFavicon = path.join(webSrcDir, 'app', 'favicon.ico');

    assert.ok(fs.existsSync(appFavicon), `${appFavicon} must exist in src/app`);
    const buf = fs.readFileSync(appFavicon);
    // ICO magic bytes: 0x00, 0x00, 0x01, 0x00
    assert.equal(buf.readUInt16LE(0), 0, 'ICO reserved word must be 0');
    assert.equal(buf.readUInt16LE(2), 1, 'ICO type must be 1 (icon)');
    const imageCount = buf.readUInt16LE(4);
    assert.ok(imageCount >= 1, 'ICO must contain at least 1 image resolution');
  });

  it('3. Tab icon PNGs (icon.png and apple-icon.png) exist in app directory and are valid PNGs', () => {
    const iconPath = path.join(webSrcDir, 'app', 'icon.png');
    const appleIconPath = path.join(webSrcDir, 'app', 'apple-icon.png');

    assert.ok(fs.existsSync(iconPath), 'icon.png must exist in src/app');
    assert.ok(fs.existsSync(appleIconPath), 'apple-icon.png must exist in src/app');

    const iconBuf = fs.readFileSync(iconPath);
    assert.equal(iconBuf.readUInt32BE(0), 0x89504e47, 'icon.png must have PNG magic header');
    const appleBuf = fs.readFileSync(appleIconPath);
    assert.equal(appleBuf.readUInt32BE(0), 0x89504e47, 'apple-icon.png must have PNG magic header');
  });

  it('4. layout.tsx configures Next.js metadata icons with light, dark, and apple icons', () => {
    const layoutContent = fs.readFileSync(path.join(webSrcDir, 'app', 'layout.tsx'), 'utf-8');
    assert.match(layoutContent, /icons:\s*{/);
    assert.match(layoutContent, /\/brand\/xydv-logo\.png/);
    assert.match(layoutContent, /\/brand\/xydv-logo-outline\.png/);
    assert.match(layoutContent, /\/favicon\.ico/);
    assert.match(layoutContent, /prefers-color-scheme:\s*light/);
    assert.match(layoutContent, /prefers-color-scheme:\s*dark/);
    assert.match(layoutContent, /apple:\s*\[/);
  });

  it('5. BrandLogo and BrandEmblem components use xydv-logo-nobg.webp without circular clipping', () => {
    const logoContent = fs.readFileSync(
      path.join(webSrcDir, 'components', 'ui', 'BrandLogo.tsx'),
      'utf-8',
    );
    assert.match(logoContent, /\/brand\/xydv-logo-nobg\.webp/);
    assert.doesNotMatch(logoContent, /\/brand\/xydv-logo-dark\.gif/);
    assert.doesNotMatch(logoContent, /\/brand\/xydv-logo-light\.gif/);

    // Check that circular clipping hacks are removed
    assert.doesNotMatch(logoContent, /scale-\[1\.72\]/);
    assert.match(logoContent, /object-contain/);
  });

  it('6. CartDrawer Razorpay checkout uses static xydv-logo.png', () => {
    const cartContent = fs.readFileSync(
      path.join(webSrcDir, 'components', 'store', 'CartDrawer.tsx'),
      'utf-8',
    );
    assert.match(cartContent, /image:\s*['"]\/brand\/xydv-logo\.png['"]/);
    assert.doesNotMatch(cartContent, /image:\s*['"]\/brand\/xydv-logo-dark\.gif['"]/);
  });
});
