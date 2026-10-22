/**
 * Backend Audit Independent Remediation Verification Suite
 *
 * Verifies all 25 findings (CRIT-01 to CRIT-04, HIGH-01 to HIGH-06,
 * MED-01 to MED-11, LOW-01 to LOW-04) from the independent backend audit.
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

describe('Backend Audit Remediation: Group 1 - Critical (P0)', () => {
  it('CRIT-01: Production error logging is unconditional for status >= 500 while sanitizing client message', () => {
    const filePath = path.join(apiDir, 'src', 'middleware', 'errorHandler.ts');
    assert.strictEqual(fs.existsSync(filePath), true);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Verifies logger.error is called for status >= 500 unconditionally
    assert.match(content, /if\s*\(\s*statusCode\s*>=\s*500\s*\)\s*\{\s*logger\.error/);
    // Verifies production response sanitization
    assert.match(
      content,
      /if\s*\(\s*isProduction\s*&&\s*statusCode\s*>=\s*500\s*\)\s*\{\s*message\s*=\s*'Internal Server Error';\s*\}/,
    );
  });

  it('CRIT-02: Inventory reservations use atomic check-and-set findOneAndUpdate for capture and release', () => {
    const filePath = path.join(apiDir, 'src', 'services', 'inventory.service.ts');
    assert.strictEqual(fs.existsSync(filePath), true);
    const content = fs.readFileSync(filePath, 'utf-8');

    // captureReservation atomic update
    assert.match(
      content,
      /findOneAndUpdate\(\s*\{\s*razorpayOrderId,\s*status:\s*'active'\s*\},\s*\{\s*\$set:\s*\{\s*status:\s*'captured'\s*\}\s*\},/,
    );
    // releaseReservation atomic update
    assert.match(
      content,
      /findOneAndUpdate\(\s*\{\s*razorpayOrderId,\s*status:\s*'active'\s*\},\s*\{\s*\$set:\s*\{\s*status:\s*'released'\s*\}\s*\},/,
    );
    // cleanExpiredReservations atomic update
    assert.match(content, /findOneAndUpdate\(\s*\{\s*_id:\s*res\._id,\s*status:\s*'active'\s*\},/);
  });

  it('CRIT-03: Webhook endpoints are exempted from the global apiLimiter rate limiter', () => {
    const filePath = path.join(apiDir, 'src', 'server.ts');
    assert.strictEqual(fs.existsSync(filePath), true);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Rate limiter exemption pattern
    assert.match(content, /req\.path\.startsWith\('\/webhooks'\)/);
    assert.match(content, /return next\(\);/);
    assert.match(content, /return apiLimiter\(req,\s*res,\s*next\);/);
  });

  it('CRIT-04: Order verification and webhooks prevent double inventory deduction races', () => {
    const orderServicePath = path.join(apiDir, 'src', 'services', 'order.service.ts');
    const webhookControllerPath = path.join(apiDir, 'src', 'controllers', 'webhook.controller.ts');
    assert.strictEqual(fs.existsSync(orderServicePath), true);
    assert.strictEqual(fs.existsSync(webhookControllerPath), true);

    const orderContent = fs.readFileSync(orderServicePath, 'utf-8');
    const webhookContent = fs.readFileSync(webhookControllerPath, 'utf-8');

    // Atomic conditional status update in order.service.ts
    assert.match(orderContent, /paymentStatus:\s*\{\s*\$ne:\s*'captured'\s*\}/);
    assert.match(orderContent, /Order\.findOneAndUpdate\(\s*updateQuery,/);
    assert.match(orderContent, /alreadyCaptured:\s*true/);

    // Webhook controller atomic conditional status update
    assert.match(
      webhookContent,
      /findOneAndUpdate\(\s*\{\s*razorpayOrderId:\s*payment\.order_id,\s*paymentStatus:\s*\{\s*\$ne:\s*'captured'\s*\}\s*\},/,
    );
    // Webhook controller must not contain the double-deduct fallback loop
    assert.doesNotMatch(
      webhookContent,
      /for\s*\(\s*const item of order\.items\s*\)\s*\{\s*await inventoryService\.deductStock/,
    );
  });
});

describe('Backend Audit Remediation: Group 2 - High Severity (P1)', () => {
  it('HIGH-01: JWT operations explicitly pin HS256 algorithm', () => {
    const authMiddlewarePath = path.join(apiDir, 'src', 'middleware', 'auth.ts');
    const authServicePath = path.join(apiDir, 'src', 'services', 'auth.service.ts');

    const middlewareContent = fs.readFileSync(authMiddlewarePath, 'utf-8');
    const serviceContent = fs.readFileSync(authServicePath, 'utf-8');

    // auth middleware verify algorithm pinning
    assert.match(
      middlewareContent,
      /jwt\.verify\([^,]+,\s*[^,]+,\s*\{\s*algorithms:\s*\['HS256'\]\s*\}\)/,
    );

    // auth service sign and verify algorithm pinning
    assert.match(serviceContent, /algorithm:\s*'HS256'/);
    assert.match(serviceContent, /algorithms:\s*\['HS256'\]/);
  });

  it('HIGH-02: Dedicated orderLimiter protects order creation from inventory hoarding', () => {
    const rateLimiterPath = path.join(apiDir, 'src', 'middleware', 'rateLimiter.ts');
    const ordersRoutesPath = path.join(apiDir, 'src', 'routes', 'orders.routes.ts');

    const limiterContent = fs.readFileSync(rateLimiterPath, 'utf-8');
    const routesContent = fs.readFileSync(ordersRoutesPath, 'utf-8');

    // orderLimiter configuration (15 requests per 15 minutes)
    assert.match(limiterContent, /export const orderLimiter\s*=/);
    assert.match(limiterContent, /max:\s*15/);
    assert.match(limiterContent, /windowMs:\s*15\s*\*\s*60\s*\*\s*1000/);

    // Mounted on create-order route
    assert.match(
      routesContent,
      /router\.post\(\s*['"]\/razorpay\/create-order['"],\s*orderLimiter,/,
    );
  });

  it('HIGH-03: Production startup halts with fatal error if default placeholder secrets are detected', () => {
    const envPath = path.join(apiDir, 'src', 'config', 'env.ts');
    const content = fs.readFileSync(envPath, 'utf-8');

    assert.match(content, /if\s*\(\s*process\.env\.NODE_ENV === 'production'\s*\)\s*\{/);
    assert.match(
      content,
      /throw new Error\(\s*['"]Fatal: Default placeholder secrets detected in production/,
    );
  });

  it('HIGH-04: Process handles unhandledRejection and uncaughtException gracefully', () => {
    const serverPath = path.join(apiDir, 'src', 'server.ts');
    const content = fs.readFileSync(serverPath, 'utf-8');

    assert.match(content, /process\.on\('unhandledRejection',\s*\(reason\)\s*=>/);
    assert.match(content, /gracefulShutdown\('unhandledRejection'\)/);
    assert.match(content, /process\.on\('uncaughtException',\s*\(err\)\s*=>/);
    assert.match(content, /gracefulShutdown\('uncaughtException'\)/);
  });

  it('HIGH-05: Refresh token rotation uses atomic check-and-set to prevent token family forking', () => {
    const authServicePath = path.join(apiDir, 'src', 'services', 'auth.service.ts');
    const content = fs.readFileSync(authServicePath, 'utf-8');

    // Atomic findOneAndUpdate check-and-set on isRevoked
    assert.match(
      content,
      /RefreshToken\.findOneAndUpdate\(\s*\{\s*tokenHash,\s*isRevoked:\s*false\s*\},\s*\{\s*\$set:\s*\{\s*isRevoked:\s*true\s*\}\s*\},/,
    );
  });

  it('HIGH-06: Uploads directory is resolved to an absolute canonical path', () => {
    const uploadPath = path.join(apiDir, 'src', 'middleware', 'upload.ts');
    const serverPath = path.join(apiDir, 'src', 'server.ts');
    const adminServicePath = path.join(apiDir, 'src', 'services', 'admin.service.ts');

    const uploadContent = fs.readFileSync(uploadPath, 'utf-8');
    const serverContent = fs.readFileSync(serverPath, 'utf-8');
    const adminServiceContent = fs.readFileSync(adminServicePath, 'utf-8');

    assert.match(
      uploadContent,
      /export const UPLOADS_DIR\s*=\s*(?:process\.env\.UPLOADS_DIR\s*\|\|\s*)?path\.resolve\(__dirname/,
    );
    assert.match(serverContent, /import\s*\{\s*UPLOADS_DIR\s*\}\s*from\s*'\.\/middleware\/upload'/);
    assert.match(
      adminServiceContent,
      /import\s*\{\s*UPLOADS_DIR\s*\}\s*from\s*'\.\.\/middleware\/upload'/,
    );
  });
});

describe('Backend Audit Remediation: Group 3 - Medium Severity (P2)', () => {
  it('MED-01: Access token default lifetime is aligned to 15m in env.ts and auth.service.ts', () => {
    const envPath = path.join(apiDir, 'src', 'config', 'env.ts');
    const envExamplePath = path.join(apiDir, '.env.example');
    const authServicePath = path.join(apiDir, 'src', 'services', 'auth.service.ts');

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');
    const authServiceContent = fs.readFileSync(authServicePath, 'utf-8');

    assert.match(envContent, /JWT_EXPIRE:\s*z\.string\(\)\.default\('15m'\)/);
    assert.match(envExampleContent, /JWT_EXPIRE=15m/);
    assert.match(authServiceContent, /expiresIn:\s*process\.env\.JWT_EXPIRE\s*\|\|\s*'15m'/);
  });

  it('MED-02: Health check endpoint inspects database connection readyState', () => {
    const serverPath = path.join(apiDir, 'src', 'server.ts');
    const content = fs.readFileSync(serverPath, 'utf-8');

    assert.match(content, /mongoose\.connection\.readyState === 1/);
    assert.match(content, /res\.status\(503\)\.json\(/);
    assert.match(content, /status:\s*'degraded'/);
  });

  it('MED-03: Binary magic byte validation function verifies image formats and blocks executables', async () => {
    const uploadPath = path.join(apiDir, 'src', 'middleware', 'upload.ts');
    const content = fs.readFileSync(uploadPath, 'utf-8');

    assert.match(content, /export function validateImageMagicBytes/);

    // Test magic byte implementation dynamically with temp files
    const { validateImageMagicBytes } = await import('../apps/api/dist/middleware/upload.js');
    const os = await import('node:os');
    const tmpDir = os.tmpdir();

    // Valid JPEG header
    const jpegPath = path.join(tmpDir, `test_${Date.now()}_1.jpg`);
    fs.writeFileSync(jpegPath, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]));
    assert.strictEqual(validateImageMagicBytes(jpegPath), true);
    fs.unlinkSync(jpegPath);

    // Valid PNG header
    const pngPath = path.join(tmpDir, `test_${Date.now()}_2.png`);
    fs.writeFileSync(pngPath, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    assert.strictEqual(validateImageMagicBytes(pngPath), true);
    fs.unlinkSync(pngPath);

    // Valid WebP header (RIFF....WEBP)
    const webpPath = path.join(tmpDir, `test_${Date.now()}_3.webp`);
    fs.writeFileSync(
      webpPath,
      Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
    );
    assert.strictEqual(validateImageMagicBytes(webpPath), true);
    fs.unlinkSync(webpPath);

    // Valid GIF header (GIF89a)
    const gifPath = path.join(tmpDir, `test_${Date.now()}_4.gif`);
    fs.writeFileSync(gifPath, Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]));
    assert.strictEqual(validateImageMagicBytes(gifPath), true);
    fs.unlinkSync(gifPath);

    // Disallowed executable / malicious header (MZ executable)
    const exePath = path.join(tmpDir, `test_${Date.now()}_5.exe`);
    fs.writeFileSync(exePath, Buffer.from([0x4d, 0x5a, 0x90, 0x00]));
    assert.strictEqual(validateImageMagicBytes(exePath), false);
    fs.unlinkSync(exePath);

    // Disallowed PHP script
    const phpPath = path.join(tmpDir, `test_${Date.now()}_6.php`);
    fs.writeFileSync(phpPath, Buffer.from('<?php echo "pwned"; ?>', 'utf-8'));
    assert.strictEqual(validateImageMagicBytes(phpPath), false);
    fs.unlinkSync(phpPath);
  });

  it('MED-04: Centralized configuration is imported from config/env.ts', () => {
    const dbPath = path.join(apiDir, 'src', 'config', 'database.ts');
    const razorpayPath = path.join(apiDir, 'src', 'config', 'razorpay.ts');
    const serverPath = path.join(apiDir, 'src', 'server.ts');

    assert.match(fs.readFileSync(dbPath, 'utf-8'), /import\s+env\s+from\s+['"]\.\/env['"]/);
    assert.match(fs.readFileSync(razorpayPath, 'utf-8'), /import\s+env\s+from\s+['"]\.\/env['"]/);
    assert.match(
      fs.readFileSync(serverPath, 'utf-8'),
      /import\s+env\s+from\s+['"]\.\/config\/env['"]/,
    );
  });

  it('MED-05: Zod request validation is mounted on previously unvalidated routes', () => {
    const usersRoutesPath = path.join(apiDir, 'src', 'routes', 'users.routes.ts');
    const authRoutesPath = path.join(apiDir, 'src', 'routes', 'auth.routes.ts');
    const productsRoutesPath = path.join(apiDir, 'src', 'routes', 'products.routes.ts');

    const usersContent = fs.readFileSync(usersRoutesPath, 'utf-8');
    const authContent = fs.readFileSync(authRoutesPath, 'utf-8');
    const productsContent = fs.readFileSync(productsRoutesPath, 'utf-8');

    // DELETE /me/addresses/:id validation
    assert.match(usersContent, /addressIdParamSchema/);
    // POST /refresh validation
    assert.match(authContent, /refreshSchema/);
    // GET /products query validation
    assert.match(productsContent, /productQuerySchema/);
  });

  it('MED-06: deleteProduct unlinks all variant images to prevent storage leaks', () => {
    const adminServicePath = path.join(apiDir, 'src', 'services', 'admin.service.ts');
    const content = fs.readFileSync(adminServicePath, 'utf-8');

    assert.match(content, /variant\.imageUrl/);
    assert.match(content, /variant\.secondaryImageUrl/);
    assert.match(content, /variant\.images/);
  });

  it('MED-07: notFound middleware envelope includes message property for ADR-006 compliance', () => {
    const notFoundPath = path.join(apiDir, 'src', 'middleware', 'notFound.ts');
    const content = fs.readFileSync(notFoundPath, 'utf-8');

    assert.match(content, /success:\s*false/);
    assert.match(content, /error:\s*message/);
    assert.match(content, /message/);
  });

  it('MED-08: CORS configuration restricts localhost origins in production', () => {
    const serverPath = path.join(apiDir, 'src', 'server.ts');
    const content = fs.readFileSync(serverPath, 'utf-8');

    assert.match(content, /env\.NODE_ENV !== 'production'/);
    assert.match(content, /'http:\/\/localhost:3000'/);
  });

  it('MED-09: razorpaySignature in Order.model.ts is hidden by default with select: false', () => {
    const orderModelPath = path.join(apiDir, 'src', 'models', 'Order.model.ts');
    const content = fs.readFileSync(orderModelPath, 'utf-8');

    assert.match(content, /razorpaySignature:\s*\{\s*type:\s*String,\s*select:\s*false\s*\}/);
  });

  it('MED-10: PageView.model.ts configures 90-day TTL index', () => {
    const pageViewModelPath = path.join(apiDir, 'src', 'models', 'PageView.model.ts');
    const content = fs.readFileSync(pageViewModelPath, 'utf-8');

    assert.match(content, /expireAfterSeconds:\s*90\s*\*\s*24\s*\*\s*60\s*\*\s*60/);
  });

  it('MED-11: Database connection failure in development throws a fatal Error', () => {
    const dbPath = path.join(apiDir, 'src', 'config', 'database.ts');
    const content = fs.readFileSync(dbPath, 'utf-8');

    assert.match(
      content,
      /throw new Error\(`Failed to connect to MongoDB after \$\{maxRetries\} attempts`\)/,
    );
  });
});

describe('Backend Audit Remediation: Group 4 - Low Severity (P3)', () => {
  it('LOW-01: seed-admin.ts masks plaintext passwords in stdout logs', () => {
    const seedAdminPath = path.join(apiDir, 'src', 'scripts', 'seed-admin.ts');
    const content = fs.readFileSync(seedAdminPath, 'utf-8');

    assert.match(content, /Password:\s*\*\*\*\*\*\*\*\*/);
    assert.doesNotMatch(content, /Password:\s*\$\{password\}/);
  });

  it('LOW-02: Password reset request and confirmation endpoints are implemented with single-use tokens', () => {
    const authRoutesPath = path.join(apiDir, 'src', 'routes', 'auth.routes.ts');
    const authServicePath = path.join(apiDir, 'src', 'services', 'auth.service.ts');
    const userModelPath = path.join(apiDir, 'src', 'models', 'User.model.ts');

    const routesContent = fs.readFileSync(authRoutesPath, 'utf-8');
    const serviceContent = fs.readFileSync(authServicePath, 'utf-8');
    const modelContent = fs.readFileSync(userModelPath, 'utf-8');

    assert.match(routesContent, /router\.post\(\s*['"]\/forgot-password['"]/);
    assert.match(routesContent, /router\.post\(\s*['"]\/reset-password['"]/);

    assert.match(serviceContent, /forgotPassword\(/);
    assert.match(serviceContent, /resetPassword\(/);
    assert.match(serviceContent, /crypto\.createHash\('sha256'\)/);

    assert.match(modelContent, /passwordResetToken/);
    assert.match(modelContent, /passwordResetExpires/);
  });

  it('LOW-03: Order route aliases are documented as deprecated in openapi.yaml', () => {
    const openapiPath = path.join(apiDir, 'openapi.yaml');
    const content = fs.readFileSync(openapiPath, 'utf-8');

    assert.match(content, /\/api\/orders\/create-order:/);
    assert.match(content, /\/api\/orders\/create-payment-intent:/);
    assert.match(content, /deprecated:\s*true/);
  });

  it('LOW-04: Review rating calculation uses MongoDB $group aggregation instead of in-memory loops', () => {
    const productServicePath = path.join(apiDir, 'src', 'services', 'product.service.ts');
    const content = fs.readFileSync(productServicePath, 'utf-8');

    assert.match(content, /Review\.aggregate(?:<[^>]+>)?\(\[/);
    assert.match(content, /\$match:\s*\{\s*productId/);
    assert.match(
      content,
      /\$group:\s*\{\s*_id:\s*'\$productId',\s*averageRating:\s*\{\s*\$avg:\s*'\$rating'\s*\}/,
    );
  });
});
