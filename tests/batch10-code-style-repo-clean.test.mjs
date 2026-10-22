/**
 * Batch 10 Verification Test Suite: Code Style & Repository Clean
 * Findings Verified:
 * - MED-10: Prettier configuration, .prettierignore, and repository code style formatting
 * - MED-11: Structured production logging across API config, controllers, and services
 * - LOW-01 to LOW-06: Comprehensive environment variable documentation, password masking, and artifact clean
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

describe('Batch 10: MED-10 - Repository Prettier Formatting & Configuration', () => {
  it('.prettierignore exists and excludes build artifacts and mirrored files', () => {
    const prettierIgnorePath = path.join(rootDir, '.prettierignore');
    assert.ok(fs.existsSync(prettierIgnorePath), '.prettierignore must exist in repository root');
    const content = fs.readFileSync(prettierIgnorePath, 'utf-8');

    assert.match(content, /node_modules/);
    assert.match(content, /\.next/);
    assert.match(content, /Navbar\.tsx/);
  });

  it('Root package.json exposes format command using Prettier', () => {
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    assert.ok(pkg.scripts?.format, 'package.json must define format script');
    assert.match(pkg.scripts.format, /prettier\s+--write/);
  });
});

describe('Batch 10: MED-11 - Structured Logging Migration in API', () => {
  it('database.ts utilizes structured logger instead of console statements', () => {
    const dbPath = path.join(apiDir, 'src', 'config', 'database.ts');
    const content = fs.readFileSync(dbPath, 'utf-8');

    assert.match(content, /import\s+.*logger.*from\s+['"]\.\/logger['"]/);
    assert.match(content, /logger\.info\(/);
    assert.match(content, /logger\.error\(/);
    assert.match(content, /logger\.warn\(/);
    assert.doesNotMatch(content, /console\.log\(/);
  });

  it('webhook.controller.ts uses structured logger for events and errors', () => {
    const webhookPath = path.join(apiDir, 'src', 'controllers', 'webhook.controller.ts');
    const content = fs.readFileSync(webhookPath, 'utf-8');

    assert.match(content, /logger\.info\(/);
    assert.match(content, /logger\.error\(/);
    assert.doesNotMatch(content, /console\.log\(/);
    assert.doesNotMatch(content, /console\.error\(/);
  });

  it('inventory.service.ts uses structured logger for reconciliation cleaner', () => {
    const invPath = path.join(apiDir, 'src', 'services', 'inventory.service.ts');
    const content = fs.readFileSync(invPath, 'utf-8');

    assert.match(content, /logger\.info\(/);
    assert.match(content, /logger\.error\(/);
    assert.doesNotMatch(content, /console\.log\(/);
  });

  it('server.ts uses structured logger for operational events', () => {
    const serverPath = path.join(apiDir, 'src', 'server.ts');
    const content = fs.readFileSync(serverPath, 'utf-8');

    assert.match(content, /logger\.info\(/);
    assert.match(content, /logger\.error\(/);
  });
});

describe('Batch 10: LOW-01 to LOW-06 - Environment Documentation & Secret Sanitization', () => {
  it('apps/web/.env.local.example documents INTERNAL_API_URL and client env vars', () => {
    const envExamplePath = path.join(webDir, '.env.local.example');
    assert.ok(fs.existsSync(envExamplePath), '.env.local.example must exist in apps/web');
    const content = fs.readFileSync(envExamplePath, 'utf-8');

    assert.match(content, /NEXT_PUBLIC_API_URL=/);
    assert.match(content, /INTERNAL_API_URL=/);
    assert.match(content, /NEXT_PUBLIC_RAZORPAY_KEY_ID=/);
  });

  it('apps/api/.env.example documents all core backend environment variables', () => {
    const envExamplePath = path.join(apiDir, '.env.example');
    assert.ok(fs.existsSync(envExamplePath), '.env.example must exist in apps/api');
    const content = fs.readFileSync(envExamplePath, 'utf-8');

    assert.match(content, /MONGODB_URI=/);
    assert.match(content, /JWT_SECRET=/);
    assert.match(content, /JWT_REFRESH_SECRET=/);
    assert.match(content, /RAZORPAY_KEY_ID=/);
    assert.match(content, /RAZORPAY_KEY_SECRET=/);
    assert.match(content, /RAZORPAY_WEBHOOK_SECRET=/);
  });

  it('seed-admin.ts masks plaintext passwords during initialization', () => {
    const seedPath = path.join(apiDir, 'src', 'scripts', 'seed-admin.ts');
    const content = fs.readFileSync(seedPath, 'utf-8');

    assert.match(content, /Password:\s*\*\*\*\*\*\*\*\*/);
    assert.doesNotMatch(content, /Password:\s*\$\{password\}/);
  });
});
