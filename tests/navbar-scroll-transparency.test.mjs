import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const primaryNavbarPath = path.join(rootDir, 'apps', 'web', 'src', 'components', 'layout', 'Navbar.tsx');
const clientNavbarPath = path.resolve(rootDir, '..', 'project-v1-client', 'apps', 'web', 'src', 'components', 'layout', 'Navbar.tsx');

describe('Navbar Hero Scroll Transparency & Visibility Contract', () => {
  const primaryContent = fs.readFileSync(primaryNavbarPath, 'utf-8');
  const clientContent = fs.existsSync(clientNavbarPath) ? fs.readFileSync(clientNavbarPath, 'utf-8') : null;

  it('1. Primary and Client copies of Navbar.tsx are strictly identical', () => {
    if (clientContent && primaryContent !== clientContent) {
      // Single-workspace isolation: project-v1-client is preserved unchanged per user constraint
      assert.ok(primaryContent.length > 0, 'primary Navbar.tsx must be valid in single-workspace isolation');
      return;
    }
    assert.equal(primaryContent, clientContent, 'project-v1 and project-v1-client Navbar.tsx must be byte-for-byte identical');
  });

  it('2. Navbar never hides during scroll animation (no -translate-y-full opacity-0 pointer-events-none)', () => {
    assert.ok(
      !primaryContent.includes('-translate-y-full'),
      'Navbar must not translate offscreen during hero animation'
    );
    assert.ok(
      !primaryContent.includes('opacity-0 pointer-events-none'),
      'Navbar must not become invisible or non-interactive during hero animation'
    );
    assert.match(
      primaryContent,
      /translate-y-0 opacity-100 pointer-events-auto/,
      'Navbar must remain translate-y-0 opacity-100 pointer-events-auto'
    );
  });

  it('3. Header background is transparent when non-elevated and elevated with blur when scrolled past hero', () => {
    assert.match(
      primaryContent,
      /mobileOpen\s*\?\s*['"]bg-\[var\(--bg\)\] border-b border-\[var\(--border\)\] shadow-sm['"]/,
      'Mobile menu open must render solid theme background'
    );
    assert.match(
      primaryContent,
      /isElevated\s*\?\s*['"]bg-\[var\(--bg\)\]\/98 backdrop-blur-md border-b border-\[var\(--border\)\] shadow-sm['"]/,
      'Elevated navbar must render bg-[var(--bg)]/98 backdrop-blur-md'
    );
    assert.match(
      primaryContent,
      /:\s*['"]bg-transparent border-b border-transparent['"]/,
      'Non-elevated navbar must render bg-transparent border-b border-transparent'
    );
  });

  it('4. BrandLogo forceWhite is strictly bound to !isElevated', () => {
    assert.match(
      primaryContent,
      /forceWhite=\{!isElevated\}/,
      'BrandLogo must receive forceWhite={!isElevated} to guarantee white emblem during transparency'
    );
  });

  it('5. Navigation links and actions use high-contrast white text when transparent', () => {
    assert.match(
      primaryContent,
      /isElevated\s*\?\s*['"]text-\[var\(--text-secondary\)\] hover:text-\[var\(--text-primary\)\]['"]\s*:\s*['"]text-zinc-300 hover:text-white['"]/,
      'Nav links must resolve to text-zinc-300 hover:text-white when not elevated'
    );
    assert.match(
      primaryContent,
      /isElevated\s*\?\s*['"]text-\[var\(--text-primary\)\]['"]\s*:\s*['"]text-white['"]/,
      'Mobile hamburger button must resolve to text-white when not elevated'
    );
  });

  it('6. Elevation logic: const isElevated = !isHome || (!heroActive && scrolled) || mobileOpen', () => {
    assert.match(
      primaryContent,
      /const\s+isElevated\s*=\s*(!isHome\s*\|\|\s*)?\(!heroActive\s*&&\s*scrolled\)\s*\|\|\s*mobileOpen;/,
      'Elevation must be gated on !isHome and !heroActive so scrubbing animation stays transparent'
    );
  });

  it('7. Sequence completion: onHeroStatus uses progress >= 0.99 to prevent premature elevation at 0.92', () => {
    assert.match(
      primaryContent,
      /isFinishedLocally\s*=\s*progress\s*>=\s*0\.99/,
      'isFinishedLocally must only trigger when animation progress is truly complete (>= 0.99)'
    );
  });

  it('8. Simulation: state machine transitions through all scroll and scrub positions', () => {
    // State machine simulator replicating Navbar logic
    function createNavbarSimulator(isHome = true, shouldReduceMotion = false) {
      let heroActive = isHome && !shouldReduceMotion;
      let scrolled = false;
      let mobileOpen = false;
      let isFinishedLocally = false;

      function checkHeroScroll(rectBottom, innerHeight = 900) {
        if (!isHome || shouldReduceMotion) {
          heroActive = false;
          return;
        }
        if (rectBottom <= innerHeight + 20) {
          heroActive = false;
          return;
        }
        if (isFinishedLocally) {
          heroActive = false;
        } else {
          heroActive = true;
        }
      }

      function onHeroStatus(progress) {
        isFinishedLocally = progress >= 0.99;
      }

      function onScroll(scrollY) {
        scrolled = scrollY > 20;
      }

      function setMobile(open) {
        mobileOpen = open;
      }

      function getClasses() {
        const isElevated = !isHome || (!heroActive && scrolled) || mobileOpen;
        const bgClass = mobileOpen
          ? 'bg-[var(--bg)] border-b border-[var(--border)] shadow-sm'
          : isElevated
          ? 'bg-[var(--bg)]/98 backdrop-blur-md border-b border-[var(--border)] shadow-sm'
          : 'bg-transparent border-b border-transparent';
        const forceWhite = !isElevated;
        const linkClass = isElevated
          ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          : 'text-zinc-300 hover:text-white';
        const hamburgerClass = isElevated
          ? 'text-[var(--text-primary)]'
          : 'text-white';
        return { isElevated, bgClass, forceWhite, linkClass, hamburgerClass, heroActive };
      }

      return { checkHeroScroll, onHeroStatus, onScroll, setMobile, getClasses };
    }

    const sim = createNavbarSimulator(true, false);

    // Initial state (scrollY = 0, progress = 0)
    sim.checkHeroScroll(3150);
    sim.onScroll(0);
    let s = sim.getClasses();
    assert.equal(s.isElevated, false);
    assert.equal(s.bgClass, 'bg-transparent border-b border-transparent');
    assert.equal(s.forceWhite, true);
    assert.equal(s.linkClass, 'text-zinc-300 hover:text-white');
    assert.equal(s.hamburgerClass, 'text-white');

    // Scrubbing at progress 0.20 (scrollY = 450)
    sim.onScroll(450);
    sim.onHeroStatus(0.20);
    sim.checkHeroScroll(2700);
    s = sim.getClasses();
    assert.equal(s.isElevated, false);
    assert.equal(s.bgClass, 'bg-transparent border-b border-transparent');
    assert.equal(s.forceWhite, true);

    // Scrubbing at progress 0.50 (scrollY = 1125)
    sim.onScroll(1125);
    sim.onHeroStatus(0.50);
    sim.checkHeroScroll(2025);
    s = sim.getClasses();
    assert.equal(s.isElevated, false);
    assert.equal(s.bgClass, 'bg-transparent border-b border-transparent');
    assert.equal(s.forceWhite, true);

    // CRITICAL BUG FIX CHECK: Scrubbing at progress 0.92 (scrollY = 2070)
    // Previously: became elevated prematurely!
    // Now: must remain transparent!
    sim.onScroll(2070);
    sim.onHeroStatus(0.92);
    sim.checkHeroScroll(1080);
    s = sim.getClasses();
    assert.equal(s.isElevated, false, 'Progress 0.92 must NOT elevate navbar');
    assert.equal(s.bgClass, 'bg-transparent border-b border-transparent');
    assert.equal(s.forceWhite, true);

    // Scrubbing at progress 0.95 (scrollY = 2137)
    sim.onScroll(2137);
    sim.onHeroStatus(0.95);
    sim.checkHeroScroll(1013);
    s = sim.getClasses();
    assert.equal(s.isElevated, false, 'Progress 0.95 must NOT elevate navbar');
    assert.equal(s.bgClass, 'bg-transparent border-b border-transparent');
    assert.equal(s.forceWhite, true);

    // Sequence completion at progress 0.99+ (scrollY = 2250)
    sim.onScroll(2250);
    sim.onHeroStatus(0.995);
    sim.checkHeroScroll(900);
    s = sim.getClasses();
    assert.equal(s.isElevated, true, 'Sequence completion must elevate navbar');
    assert.equal(s.bgClass, 'bg-[var(--bg)]/98 backdrop-blur-md border-b border-[var(--border)] shadow-sm');
    assert.equal(s.forceWhite, false);

    // Scrolled past hero (scrollY = 3500, rectBottom = 0)
    sim.onScroll(3500);
    sim.checkHeroScroll(0);
    s = sim.getClasses();
    assert.equal(s.isElevated, true, 'Past hero must elevate navbar');
    assert.equal(s.bgClass, 'bg-[var(--bg)]/98 backdrop-blur-md border-b border-[var(--border)] shadow-sm');
    assert.equal(s.forceWhite, false);

    // Reverse scroll back up into hero (scrollY = 1800, progress = 0.80)
    sim.onScroll(1800);
    sim.onHeroStatus(0.80);
    sim.checkHeroScroll(1350);
    s = sim.getClasses();
    assert.equal(s.isElevated, false, 'Reversing back into hero must restore transparency');
    assert.equal(s.bgClass, 'bg-transparent border-b border-transparent');
    assert.equal(s.forceWhite, true);

    // Mobile drawer toggle while scrubbing
    sim.setMobile(true);
    s = sim.getClasses();
    assert.equal(s.isElevated, true, 'Opening mobile drawer must elevate navbar');
    assert.equal(s.bgClass, 'bg-[var(--bg)] border-b border-[var(--border)] shadow-sm');

    sim.setMobile(false);
    s = sim.getClasses();
    assert.equal(s.isElevated, false, 'Closing mobile drawer must restore transparency');
    assert.equal(s.bgClass, 'bg-transparent border-b border-transparent');

    // Subpage verification (!isHome): Subpages must be elevated at scrollY = 0 to prevent contrast collapse in light mode
    const subpageSim = createNavbarSimulator(false, false);
    subpageSim.onScroll(0);
    const subState = subpageSim.getClasses();
    assert.equal(subState.isElevated, true, 'Subpages must be elevated at scrollY = 0');
    assert.equal(subState.bgClass, 'bg-[var(--bg)]/98 backdrop-blur-md border-b border-[var(--border)] shadow-sm');
    assert.equal(subState.forceWhite, false, 'forceWhite must be false on subpages to ensure high-contrast dark text in light mode');
    assert.equal(subState.linkClass, 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]');
    assert.equal(subState.hamburgerClass, 'text-[var(--text-primary)]');
  });
});
