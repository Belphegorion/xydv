/**
 * Batch 8 Verification Test Suite: Accessibility & Performance Polish
 * Findings Verified:
 * - HIGH-09: Sub-44px Tap Targets on Carousel Dots & Chevrons
 * - MED-04: Non-Hierarchical Headings / Skipped <h2> in Product Catalog
 * - MED-05: Subtle Text Contrast Below 4.5:1 on Badges & Muted Tokens
 * - MED-12: Lack of LCP Fetch Priority on Hero & First Catalog Images
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

describe('Batch 8: HIGH-09 - Carousel Navigation Min 44x44px Tap Targets', () => {
  it('BestsellerGrid enforces min 44x44px tap targets on dots and chevrons', () => {
    const filePath = path.join(webDir, 'src', 'components', 'store', 'BestsellerGrid.tsx');
    assert.ok(fs.existsSync(filePath), 'BestsellerGrid.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert.match(content, /min-w-\[44px\]/);
    assert.match(content, /min-h-\[44px\]/);
  });

  it('FeaturedCollection enforces min 44x44px tap targets on dots and chevrons', () => {
    const filePath = path.join(webDir, 'src', 'components', 'store', 'FeaturedCollection.tsx');
    assert.ok(fs.existsSync(filePath), 'FeaturedCollection.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert.match(content, /min-w-\[44px\]/);
    assert.match(content, /min-h-\[44px\]/);
  });

  it('Catalog page enforces min 44x44px tap targets on card chevrons and dots', () => {
    const filePath = path.join(webDir, 'src', 'app', 'products', 'page.tsx');
    assert.ok(fs.existsSync(filePath), 'products/page.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert.match(content, /min-w-\[44px\]/);
    assert.match(content, /min-h-\[44px\]/);
  });
});

describe('Batch 8: MED-04 - Heading Hierarchy Compliance', () => {
  it('products/page.tsx maintains h1 -> h2 -> h3 hierarchy without skipping', () => {
    const filePath = path.join(webDir, 'src', 'app', 'products', 'page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Page has <h1>
    assert.match(content, /<h1[^>]*>[\s\S]*?TECHNICAL DIVISION[\s\S]*?<\/h1>/);
    // Grid has <h2> section heading
    assert.match(
      content,
      /<h2[^>]*class(?:Name)?="[^"]*sr-only[^"]*"[^>]*>Catalog Inventory<\/h2>/,
    );
    // Product cards use <h3>
    assert.match(content, /<h3[^>]*font-heading[^>]*>[\s\S]*?\{product\.name\}[\s\S]*?<\/h3>/);
  });
});

describe('Batch 8: MED-05 - Color Contrast & Subtle Badge Tokens', () => {
  it('globals.css ensures dark mode text-muted contrast exceeds 4.5:1', () => {
    const filePath = path.join(webDir, 'src', 'app', 'globals.css');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert.match(
      content,
      /--text-muted:\s*#(?:8e8e93|a1a1aa|a0a0a0|d4d4d8)/,
      'Dark mode --text-muted must have >= 4.5:1 contrast against obsidian void',
    );
  });

  it('Badge.tsx subtle variant guarantees high-contrast text in dark mode', () => {
    const filePath = path.join(webDir, 'src', 'components', 'ui', 'Badge.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert.match(
      content,
      /dark:text-zinc-200/,
      'Badge subtle variant must specify high-contrast dark text',
    );
  });
});

describe('Batch 8: MED-12 - LCP Optimization & Fetch Priority', () => {
  it('HeroSection sets fetchPriority on initial frame image preloading', () => {
    const filePath = path.join(webDir, 'src', 'components', 'store', 'HeroSection.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert.match(
      content,
      /img\.fetchPriority\s*=\s*index\s*===\s*0\s*\?\s*['"]high['"]\s*:\s*['"]auto['"]/,
      'HeroSection must set fetchPriority high on first frame',
    );
  });

  it('Catalog page supplies priority loading to first above-the-fold cards', () => {
    const filePath = path.join(webDir, 'src', 'app', 'products', 'page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert.match(
      content,
      /priority=\{pIdx\s*<\s*4\}/,
      'First row of catalog cards must be passed priority={pIdx < 4}',
    );
    assert.match(
      content,
      /priority=\{iIdx === 0 && \(priority \|\| product\.isFeatured\)\}/,
      'CatalogCard must honor priority prop on primary image',
    );
  });
});
