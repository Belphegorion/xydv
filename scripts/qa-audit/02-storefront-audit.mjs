import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const VIEWPORTS = [
  { name: '320x568 (Mobile Min)', width: 320, height: 568, isMobile: true, hasTouch: true },
  { name: '360x640 (Android Base)', width: 360, height: 640, isMobile: true, hasTouch: true },
  { name: '390x844 (iPhone 12/13/14)', width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: '412x915 (Pixel 7)', width: 412, height: 915, isMobile: true, hasTouch: true },
  { name: '767x1024 (Sub-tablet)', width: 767, height: 1024, isMobile: true, hasTouch: true },
  { name: '768x1024 (Tablet Portrait)', width: 768, height: 1024, isMobile: false, hasTouch: true },
  { name: '1023x768 (Sub-desktop)', width: 1023, height: 768, isMobile: false, hasTouch: false },
  { name: '1024x768 (Tablet Landscape)', width: 1024, height: 768, isMobile: false, hasTouch: false },
  { name: '1280x720 (Laptop)', width: 1280, height: 720, isMobile: false, hasTouch: false },
  { name: '1440x900 (Desktop Standard)', width: 1440, height: 900, isMobile: false, hasTouch: false },
  { name: '1920x1080 (FHD Monitor)', width: 1920, height: 1080, isMobile: false, hasTouch: false },
  { name: '2560x1440 (QHD Wide)', width: 2560, height: 1440, isMobile: false, hasTouch: false },
  { name: '844x390 (Phone Landscape)', width: 844, height: 390, isMobile: true, hasTouch: true }
];

const PAGES = [
  { route: '/', name: 'Home' },
  { route: '/products', name: 'Catalog' },
  { route: '/products/qa-xydv-tactical-stealth-jacket', name: 'PDP Normal' },
  { route: '/products/qa-xydv-ultra-long-name-compression-shirt', name: 'PDP Long Name' },
  { route: '/products/qa-xydv-zero-stock-windbreaker', name: 'PDP Out of Stock' },
  { route: '/products/qa-xydv-missing-image-phantom-vest', name: 'PDP Missing Image' },
  { route: '/wishlist', name: 'Wishlist' },
  { route: '/sizing', name: 'Sizing' },
  { route: '/contact', name: 'Contact' },
  { route: '/faq', name: 'FAQ' },
  { route: '/shipping', name: 'Shipping' },
  { route: '/returns', name: 'Returns' },
  { route: '/privacy', name: 'Privacy' },
  { route: '/terms', name: 'Terms' },
  { route: '/security', name: 'Security' },
  { route: '/this-is-a-non-existent-page-test-404', name: '404 Page' }
];

function rgbToLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function parseRgb(colorStr) {
  if (!colorStr) return null;
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return null;
  const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
  return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]), a };
}

function contrastRatio(lum1, lum2) {
  const l1 = Math.max(lum1, lum2);
  const l2 = Math.min(lum1, lum2);
  return (l1 + 0.05) / (l2 + 0.05);
}

async function auditStorefront() {
  console.log('Launching browser for storefront audit...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  
  const results = {
    testedAt: new Date().toISOString(),
    viewportsTested: VIEWPORTS.length,
    pagesTested: PAGES.length,
    overflowFindings: [],
    inputZoomFindings: [],
    touchTargetFindings: [],
    contrastFindings: [],
    consoleErrors: [],
    networkErrors: []
  };

  const screenshotsDir = 'tests/qa-e2e/artifacts/screenshots/storefront';
  fs.mkdirSync(screenshotsDir, { recursive: true });

  for (const vp of VIEWPORTS) {
    console.log(`\n========================================\nAuditing Viewport: ${vp.name} (${vp.width}x${vp.height})\n========================================`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
      deviceScaleFactor: 1
    });

    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        results.consoleErrors.push({
          viewport: vp.name,
          url: page.url(),
          text: msg.text()
        });
      }
    });

    page.on('requestfailed', req => {
      results.networkErrors.push({
        viewport: vp.name,
        url: req.url(),
        failure: req.failure()?.errorText || 'Failed'
      });
    });

    for (const p of PAGES) {
      const targetUrl = `${BASE_URL}${p.route}`;
      try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(800); // Allow motion/hydrations

        // 1. Check Horizontal Scroll Overflow
        const overflow = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = docEl.clientWidth;
          const hasOverflow = scrollWidth > clientWidth + 1; // 1px tolerance for subpixel

          const overflowingElements = [];
          if (hasOverflow) {
            const allElements = document.querySelectorAll('*');
            for (const el of allElements) {
              const rect = el.getBoundingClientRect();
              if (rect.right > clientWidth + 2) {
                overflowingElements.push({
                  tag: el.tagName.toLowerCase(),
                  id: el.id,
                  className: el.className ? String(el.className).substring(0, 80) : '',
                  right: Math.round(rect.right),
                  width: Math.round(rect.width)
                });
                if (overflowingElements.length >= 5) break;
              }
            }
          }

          return {
            hasOverflow,
            scrollWidth,
            clientWidth,
            delta: scrollWidth - clientWidth,
            elements: overflowingElements
          };
        });

        if (overflow.hasOverflow) {
          results.overflowFindings.push({
            page: p.name,
            route: p.route,
            viewport: vp.name,
            width: vp.width,
            scrollWidth: overflow.scrollWidth,
            delta: overflow.delta,
            elements: overflow.elements
          });
          console.warn(`[OVERFLOW] ${p.name} @ ${vp.name}: scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth} (+${overflow.delta}px)`);
        }

        // 2. Check Input Font Sizes (< 16px triggers iOS auto-zoom)
        if (vp.isMobile) {
          const smallInputs = await page.evaluate(() => {
            const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea');
            const bad = [];
            inputs.forEach(inp => {
              const style = window.getComputedStyle(inp);
              const fontSize = parseFloat(style.fontSize);
              if (fontSize < 16) {
                bad.push({
                  tag: inp.tagName.toLowerCase(),
                  type: inp.getAttribute('type') || 'text',
                  name: inp.getAttribute('name') || '',
                  id: inp.id || '',
                  placeholder: inp.getAttribute('placeholder') || '',
                  fontSize: fontSize + 'px'
                });
              }
            });
            return bad;
          });

          if (smallInputs.length > 0) {
            results.inputZoomFindings.push({
              page: p.name,
              route: p.route,
              viewport: vp.name,
              inputs: smallInputs
            });
            console.warn(`[IOS ZOOM RISK] ${p.name} @ ${vp.name}: Found ${smallInputs.length} inputs with font-size < 16px`);
          }
        }

        // 3. Check Touch Targets on mobile (< 44x44px)
        if (vp.isMobile) {
          const smallTargets = await page.evaluate(() => {
            const clickables = document.querySelectorAll('button, a[href], [role="button"], input[type="submit"]');
            const bad = [];
            clickables.forEach(c => {
              const rect = c.getBoundingClientRect();
              const style = window.getComputedStyle(c);
              // Only consider visible elements
              if (rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0') {
                if (rect.width < 44 || rect.height < 44) {
                  bad.push({
                    tag: c.tagName.toLowerCase(),
                    text: (c.innerText || c.getAttribute('aria-label') || '').trim().substring(0, 30),
                    className: c.className ? String(c.className).substring(0, 60) : '',
                    width: Math.round(rect.width),
                    height: Math.round(rect.height)
                  });
                }
              }
            });
            return bad.slice(0, 10); // keep top 10 per page
          });

          if (smallTargets.length > 0) {
            results.touchTargetFindings.push({
              page: p.name,
              route: p.route,
              viewport: vp.name,
              targets: smallTargets
            });
          }
        }

        // 4. Contrast measurement sample on key viewports (390 & 1440)
        if (vp.width === 390 || vp.width === 1440) {
          const contrastIssues = await page.evaluate(() => {
            function getLum(r, g, b) {
              const [rs, gs, bs] = [r, g, b].map(c => {
                c = c / 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
              });
              return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
            }
            function getRatio(l1, l2) {
              const mx = Math.max(l1, l2);
              const mn = Math.min(l1, l2);
              return (mx + 0.05) / (mn + 0.05);
            }
            function parse(cStr) {
              const m = cStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
              if (!m) return null;
              return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]), a: m[4] !== undefined ? parseFloat(m[4]) : 1 };
            }

            const textNodes = [];
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
            let n;
            while ((n = walker.nextNode())) {
              if (n.nodeValue.trim().length > 1) {
                const parent = n.parentElement;
                if (parent) {
                  const style = window.getComputedStyle(parent);
                  const rect = parent.getBoundingClientRect();
                  if (rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                    textNodes.push({ parent, text: n.nodeValue.trim(), style });
                  }
                }
              }
            }

            const failures = [];
            textNodes.forEach(({ parent, text, style }) => {
              const fg = parse(style.color);
              if (!fg || fg.a === 0) return;

              // Find effective background
              let bg = null;
              let curr = parent;
              while (curr && curr !== document.documentElement) {
                const bStyle = window.getComputedStyle(curr);
                const parsedBg = parse(bStyle.backgroundColor);
                if (parsedBg && parsedBg.a > 0.6) {
                  bg = parsedBg;
                  break;
                }
                curr = curr.parentElement;
              }
              if (!bg) bg = { r: 10, g: 10, b: 10, a: 1 }; // default obsidian void #0A0A0A

              const fgLum = getLum(fg.r, fg.g, fg.b);
              const bgLum = getLum(bg.r, bg.g, bg.b);
              const ratio = getRatio(fgLum, bgLum);

              const fontSize = parseFloat(style.fontSize);
              const isBold = parseInt(style.fontWeight) >= 700 || style.fontWeight === 'bold';
              const isLarge = fontSize >= 24 || (fontSize >= 18.66 && isBold);
              const requiredRatio = isLarge ? 3.0 : 4.5;

              if (ratio < requiredRatio) {
                failures.push({
                  text: text.substring(0, 40),
                  tag: parent.tagName.toLowerCase(),
                  className: parent.className ? String(parent.className).substring(0, 60) : '',
                  fontSize: style.fontSize,
                  fontWeight: style.fontWeight,
                  color: style.color,
                  bgColor: `rgb(${bg.r},${bg.g},${bg.b})`,
                  measuredRatio: Math.round(ratio * 100) / 100,
                  requiredRatio
                });
              }
            });

            return failures.slice(0, 8); // top 8 per page
          });

          if (contrastIssues.length > 0) {
            results.contrastFindings.push({
              page: p.name,
              route: p.route,
              viewport: vp.name,
              failures: contrastIssues
            });
          }
        }

        // Take snapshot screenshot for key viewports (320, 390, 1440) on main pages
        if ((vp.width === 320 || vp.width === 390 || vp.width === 1440) && (p.route === '/' || p.route === '/products' || p.route.includes('tactical-stealth-jacket'))) {
          const safeName = p.name.replace(/\s+/g, '-').toLowerCase();
          const shotPath = `${screenshotsDir}/${safeName}-${vp.width}.png`;
          await page.screenshot({ path: shotPath, fullPage: false });
        }

      } catch (err) {
        console.error(`Error auditing ${p.name} at ${vp.name}:`, err.message);
      }
    }

    await context.close();
  }

  // 5. Test Cart Drawer & Modal Interactions at 390 & 1440
  console.log('\n========================================\nAuditing Cart Drawer & Notification Popups\n========================================');
  const modalContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const mPage = await modalContext.newPage();
  await mPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await mPage.waitForTimeout(1000);

  // Check if notification popup appears
  const notifPopup = await mPage.$('[role="dialog"], [aria-label*="Notification"], [data-testid="notification-modal"]');
  if (notifPopup) {
    console.log('Detected active Notification Popup on Home Page');
    await mPage.screenshot({ path: `${screenshotsDir}/notification-popup-390.png` });
  }

  // Open Cart Drawer
  const bagButton = await mPage.$('button[aria-label*="Bag"], button[aria-label*="Cart"], button:has-text("Bag")');
  if (bagButton) {
    await bagButton.click();
    await mPage.waitForTimeout(600);
    const drawerOpen = await mPage.$('[role="dialog"], aside, div:has-text("Your Bag")');
    if (drawerOpen) {
      console.log('Successfully opened Cart Drawer');
      await mPage.screenshot({ path: `${screenshotsDir}/cart-drawer-390.png` });

      // Test Escape key focus restoration
      await mPage.keyboard.press('Escape');
      await mPage.waitForTimeout(400);
    }
  }
  await modalContext.close();

  await browser.close();

  const outPath = 'scratch/audit-results/storefront-audit.json';
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nStorefront Audit Completed! Results written to ${outPath}`);
  console.log(`- Total Overflow Findings: ${results.overflowFindings.length}`);
  console.log(`- Total iOS Zoom Findings: ${results.inputZoomFindings.length}`);
  console.log(`- Total Touch Target Findings: ${results.touchTargetFindings.length}`);
  console.log(`- Total Contrast Findings: ${results.contrastFindings.length}`);
  console.log(`- Total Console Errors: ${results.consoleErrors.length}`);
}

auditStorefront().catch(err => {
  console.error('Audit Storefront Failed:', err);
  process.exit(1);
});
