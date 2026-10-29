/**
 * Production Readiness & Deployment Verification Test Suite
 * Validates:
 * 1. Environment Configurations (.env.example in root, apps/api, apps/web)
 *    - Presence of Workstream A/B/C variables (OTP_PEPPER, IP_SALT, AWS_REGION, SES_FROM_EMAIL, DLT_ENTITY_ID, DLT_TEMPLATE_ID)
 *    - Safe placeholders and absence of hardcoded secrets
 *    - Client environment cleanliness (no server secrets in client templates)
 * 2. Production Deployment & Server Configs:
 *    - deploy/nginx/nginx.conf defines dedicated /api/orders/ and /api/tracking/ locations for SSE with proxy_buffering off,
 *      X-Accel-Buffering no, proxy_read_timeout 1h, and gzip exclusion
 *    - PM2 ecosystem configs (ecosystem.config.cjs and ecosystem.config.js) start compiled artifacts (dist/server.js)
 *      and functionally resolve existing Next.js binaries across monorepo hoisting
 * 3. Repository Cleanliness:
 *    - .gitignore excludes agent artifacts (skills-lock.json), build outputs (.next, dist), and secrets
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'apps', 'api');
const webDir = path.join(rootDir, 'apps', 'web');
const require = createRequire(import.meta.url);

describe('Production Readiness: Environment Configurations', () => {
  it('Root .env.example contains master configuration documenting storefront and api without secret leaks', () => {
    const rootEnvPath = path.join(rootDir, '.env.example');
    assert.ok(fs.existsSync(rootEnvPath), 'Root .env.example must exist');
    const content = fs.readFileSync(rootEnvPath, 'utf-8');

    assert.match(content, /NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xydv_key/);
    assert.match(content, /MONGODB_URI=/);
    assert.match(content, /JWT_SECRET=/);
    assert.match(content, /OTP_PEPPER=/);
    assert.match(content, /IP_SALT=/);
    assert.match(content, /AWS_REGION=/);
    assert.match(content, /SES_FROM_EMAIL=/);
    assert.match(content, /DLT_ENTITY_ID=/);
    assert.match(content, /DLT_TEMPLATE_ID=/);
    assert.doesNotMatch(content, /mongodb\+srv:\/\/[^<]+:[^<]+@/);

    // Section 1 (Storefront client) must NOT contain server-side secrets
    const [clientSection] = content.split(/# 2\. SERVER \/ REST API/);
    assert.ok(clientSection, 'Client section must be delimited');
    assert.doesNotMatch(clientSection, /RAZORPAY_KEY_SECRET/);
    assert.doesNotMatch(clientSection, /CLOUDINARY_API_SECRET/);
  });

  it('apps/api/.env.example documents all Workstream A/B/C variables with safe placeholders', () => {
    const apiEnvPath = path.join(apiDir, '.env.example');
    assert.ok(fs.existsSync(apiEnvPath), 'apps/api/.env.example must exist');
    const content = fs.readFileSync(apiEnvPath, 'utf-8');

    assert.match(content, /PORT=5000/);
    assert.match(content, /NODE_ENV=development/);
    assert.match(content, /MONGODB_URI=mongodb:\/\/localhost:27017\/xydv/);
    assert.match(content, /JWT_SECRET=/);
    assert.match(content, /JWT_REFRESH_SECRET=/);
    assert.match(content, /OTP_PEPPER=/);
    assert.match(content, /IP_SALT=/);
    assert.match(content, /RAZORPAY_KEY_ID=rzp_test_xydv_key/);
    assert.match(content, /RAZORPAY_KEY_SECRET=xydv_test_secret/);
    assert.match(content, /RAZORPAY_WEBHOOK_SECRET=xydv_webhook_secret/);
    assert.match(content, /AWS_REGION=ap-south-1/);
    assert.match(content, /SES_FROM_EMAIL=/);
    assert.match(content, /DLT_ENTITY_ID=/);
    assert.match(content, /DLT_TEMPLATE_ID=/);
    assert.doesNotMatch(content, /mongodb\+srv:\/\/[^<]+:[^<]+@/);
    assert.doesNotMatch(content, /RAZORPAY_KEY_ID=rzp_live_[A-Za-z0-9]+/);
  });

  it('apps/web/.env.example and apps/web/.env.local.example exist and are harmonized with rzp_test_xydv_key', () => {
    const webEnvLocalPath = path.join(webDir, '.env.local.example');
    const webEnvPath = path.join(webDir, '.env.example');

    assert.ok(fs.existsSync(webEnvLocalPath), 'apps/web/.env.local.example must exist');
    assert.ok(fs.existsSync(webEnvPath), 'apps/web/.env.example must exist');

    const contentLocal = fs.readFileSync(webEnvLocalPath, 'utf-8');
    const content = fs.readFileSync(webEnvPath, 'utf-8');

    for (const text of [contentLocal, content]) {
      assert.match(text, /NEXT_PUBLIC_API_URL=/);
      assert.match(text, /INTERNAL_API_URL=/);
      assert.match(text, /AUTH_SECRET=/);
      assert.match(text, /NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xydv_key/);
      assert.doesNotMatch(text, /NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_[A-Za-z0-9]+/);
      assert.doesNotMatch(text, /RAZORPAY_KEY_SECRET/);
    }
  });

  it('apps/api/src/config/env.ts validates and exposes OTP_PEPPER, IP_SALT, and AWS/DLT fields with placeholder guard', () => {
    const envTsPath = path.join(apiDir, 'src', 'config', 'env.ts');
    assert.ok(fs.existsSync(envTsPath), 'apps/api/src/config/env.ts must exist');
    const content = fs.readFileSync(envTsPath, 'utf-8');

    assert.match(content, /OTP_PEPPER:\s*z\.string\(\)/);
    assert.match(content, /IP_SALT:\s*z\.string\(\)/);
    assert.match(content, /AWS_REGION:\s*z\.string\(\)/);
    assert.match(content, /SES_FROM_EMAIL:\s*z\.string\(\)\.optional\(\)/);
    assert.match(content, /DLT_ENTITY_ID:\s*z\.string\(\)\.optional\(\)/);
    assert.match(content, /DLT_TEMPLATE_ID:\s*z\.string\(\)\.optional\(\)/);

    // Production check includes OTP_PEPPER and IP_SALT placeholder detection
    assert.match(content, /isTemplatePlaceholder\(process\.env\.OTP_PEPPER\)/);
    assert.match(content, /isTemplatePlaceholder\(process\.env\.IP_SALT\)/);
  });
});

describe('Production Readiness: Server & Reverse Proxy Configuration', () => {
  it('deploy/nginx/nginx.conf defines dedicated /api/orders/ and /api/tracking/ locations with SSE streaming directives', () => {
    const nginxConfPath = path.join(rootDir, 'deploy', 'nginx', 'nginx.conf');
    assert.ok(fs.existsSync(nginxConfPath), 'deploy/nginx/nginx.conf must exist');
    const content = fs.readFileSync(nginxConfPath, 'utf-8');

    // Both SSE endpoints must have dedicated location blocks
    assert.match(content, /location\s+\/api\/orders\/\s*\{/);
    assert.match(content, /location\s+\/api\/tracking\/\s*\{/);

    // Buffering disabled
    assert.match(content, /proxy_buffering\s+off;/);

    // Acceleration buffering disabled header
    assert.match(content, /X-Accel-Buffering\s+["']no["']/);

    // 1-hour read timeout for long-lived SSE connections
    assert.match(content, /proxy_read_timeout\s+1h;/);

    // Gzip explicitly disabled for SSE
    const ordersBlock = content.split(/location\s+\/api\/orders\/\s*\{/)[1]?.split(/location/)[0] || '';
    assert.match(ordersBlock, /gzip\s+off;/);

    const trackingBlock = content.split(/location\s+\/api\/tracking\/\s*\{/)[1]?.split(/location/)[0] || '';
    assert.match(trackingBlock, /gzip\s+off;/);

    // Global gzip_types must not include text/event-stream
    const gzipTypesMatch = content.match(/gzip_types[\s\S]*?;/);
    assert.ok(gzipTypesMatch, 'gzip_types must be configured');
    assert.doesNotMatch(gzipTypesMatch[0], /text\/event-stream/);
  });

  it('PM2 ecosystem configuration runs compiled artifacts and resolves real binaries on disk', () => {
    const cjsPath = path.join(rootDir, 'ecosystem.config.cjs');
    assert.ok(fs.existsSync(cjsPath), 'ecosystem.config.cjs must exist');
    const cjsContent = fs.readFileSync(cjsPath, 'utf-8');

    assert.match(cjsContent, /name:\s*['"]xydv-api['"]/);
    assert.match(cjsContent, /script:\s*['"]dist\/server\.js['"]/);
    assert.match(cjsContent, /name:\s*['"]xydv-web['"]/);
    assert.match(cjsContent, /args:\s*['"]start -p 3000['"]/);
    assert.doesNotMatch(cjsContent, /ts-node/);
    assert.doesNotMatch(cjsContent, /tsx/);

    const jsPath = path.join(rootDir, 'ecosystem.config.js');
    assert.ok(fs.existsSync(jsPath), 'ecosystem.config.js must exist');
    const jsContent = fs.readFileSync(jsPath, 'utf-8');
    assert.match(jsContent, /require\(['"]\.\/ecosystem\.config\.cjs['"]\)/);

    // Functional verification: PM2 target binaries must actually exist on disk
    const pm2Config = require(cjsPath);
    assert.ok(Array.isArray(pm2Config.apps), 'pm2Config.apps must be an array');

    const apiApp = pm2Config.apps.find((a) => a.name === 'xydv-api');
    assert.ok(apiApp, 'xydv-api must be defined');
    const resolvedApiScript = path.resolve(rootDir, apiApp.cwd, apiApp.script);
    assert.ok(fs.existsSync(resolvedApiScript), `API entrypoint must exist: ${resolvedApiScript}`);

    const webApp = pm2Config.apps.find((a) => a.name === 'xydv-web');
    assert.ok(webApp, 'xydv-web must be defined');
    const resolvedWebScript = path.resolve(rootDir, webApp.cwd, webApp.script);
    assert.ok(fs.existsSync(resolvedWebScript), `Next.js binary must exist: ${resolvedWebScript}`);
  });
});

describe('Production Readiness: Repository Cleanliness & Build Hygiene', () => {
  it('.gitignore excludes agent metadata, temporary lockfiles, and secrets', () => {
    const gitignorePath = path.join(rootDir, '.gitignore');
    assert.ok(fs.existsSync(gitignorePath), '.gitignore must exist');
    const content = fs.readFileSync(gitignorePath, 'utf-8');

    assert.match(content, /skills-lock\.json/);
    assert.match(content, /\.next\//);
    assert.match(content, /dist\//);
    assert.match(content, /\.env/);
    assert.match(content, /\.env\.local/);
    assert.match(content, /\*\.pem/);
    assert.match(content, /\*\.key/);
  });
});
