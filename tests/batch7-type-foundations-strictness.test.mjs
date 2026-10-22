/**
 * Batch 7 Verification Test Suite: Type Foundations & Compiler Strictness
 * Findings Verified:
 * - MED-02: Enable strict compiler flags (strict: true, noImplicitAny: true, strictNullChecks: true, etc.)
 * - MED-03: Refactor remaining any, as any, and as unknown as in core files to explicit domain types
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'apps', 'api');
const webDir = path.join(rootDir, 'apps', 'web');

describe('Batch 7: MED-02 - Strict Compiler Flags Configuration', () => {
  it('apps/web/tsconfig.json enables strict compiler flags', () => {
    const tsconfigPath = path.join(webDir, 'tsconfig.json');
    assert.ok(fs.existsSync(tsconfigPath), 'apps/web/tsconfig.json must exist');
    const content = fs.readFileSync(tsconfigPath, 'utf-8');
    const config = JSON.parse(content);
    const opts = config.compilerOptions;

    assert.equal(opts.strict, true, 'apps/web/tsconfig.json must have strict: true');
    assert.equal(opts.noImplicitAny, true, 'apps/web/tsconfig.json must have noImplicitAny: true');
    assert.equal(
      opts.strictNullChecks,
      true,
      'apps/web/tsconfig.json must have strictNullChecks: true',
    );
    assert.equal(
      opts.noImplicitReturns,
      true,
      'apps/web/tsconfig.json must have noImplicitReturns: true',
    );
    assert.equal(
      opts.noFallthroughCasesInSwitch,
      true,
      'apps/web/tsconfig.json must have noFallthroughCasesInSwitch: true',
    );
  });

  it('apps/api/tsconfig.json enables strict compiler flags', () => {
    const tsconfigPath = path.join(apiDir, 'tsconfig.json');
    assert.ok(fs.existsSync(tsconfigPath), 'apps/api/tsconfig.json must exist');
    const content = fs.readFileSync(tsconfigPath, 'utf-8');
    const config = JSON.parse(content);
    const opts = config.compilerOptions;

    assert.equal(opts.strict, true, 'apps/api/tsconfig.json must have strict: true');
    assert.equal(opts.noImplicitAny, true, 'apps/api/tsconfig.json must have noImplicitAny: true');
    assert.equal(
      opts.strictNullChecks,
      true,
      'apps/api/tsconfig.json must have strictNullChecks: true',
    );
    assert.equal(
      opts.noImplicitReturns,
      true,
      'apps/api/tsconfig.json must have noImplicitReturns: true',
    );
    assert.equal(
      opts.noFallthroughCasesInSwitch,
      true,
      'apps/api/tsconfig.json must have noFallthroughCasesInSwitch: true',
    );
  });
});

describe('Batch 7: MED-03 - Purge of any and as any Types in Core Code', () => {
  function getTsFiles(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.next') {
          results.push(...getTsFiles(fullPath));
        }
      } else if (
        (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
        !entry.name.endsWith('.d.ts')
      ) {
        results.push(fullPath);
      }
    }
    return results;
  }

  it('apps/api/src contains zero any type assertions, as any, or as unknown as', () => {
    const files = getTsFiles(path.join(apiDir, 'src'));
    const anyMatches = [];
    for (const f of files) {
      const content = fs.readFileSync(f, 'utf-8');
      if (
        /\bas\s+any\b/.test(content) ||
        /\bas\s+unknown\s+as\b/.test(content) ||
        /@ts-ignore/.test(content)
      ) {
        anyMatches.push(f);
      }
    }
    assert.deepEqual(
      anyMatches,
      [],
      `Found forbidden type assertions in apps/api/src: ${anyMatches.join(', ')}`,
    );
  });

  it('apps/web/src contains zero any type assertions, as any, or as unknown as', () => {
    const files = getTsFiles(path.join(webDir, 'src'));
    const anyMatches = [];
    for (const f of files) {
      const content = fs.readFileSync(f, 'utf-8');
      if (
        /\bas\s+any\b/.test(content) ||
        /\bas\s+unknown\s+as\b/.test(content) ||
        /@ts-ignore/.test(content)
      ) {
        anyMatches.push(f);
      }
    }
    assert.deepEqual(
      anyMatches,
      [],
      `Found forbidden type assertions in apps/web/src: ${anyMatches.join(', ')}`,
    );
  });
});
