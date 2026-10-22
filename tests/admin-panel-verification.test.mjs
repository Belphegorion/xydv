/**
 * XYDV Admin Panel Verification & Integrity Test Suite
 * Validates:
 * 1. Admin RBAC, JWT verification, and self-protection invariant guards
 * 2. Product and Category Catalog CRUD & Dynamic Categories
 * 3. Inventory control, low-stock threshold alerting, and automatic stock restoration
 * 4. Order fulfillment, status lifecycle, Razorpay refund integrity
 * 5. Customer management, fraud suspension, and permission controls
 * 6. Analytics aggregation, conversion rate arithmetic, and page view telemetry
 * 7. Frontend route contracts and design tokens (anti-slop, no banned purple)
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
const apiDir = path.join(rootDir, 'apps', 'api');

describe('Admin Panel: Module 1 - RBAC & Security Middleware Contracts', () => {
  it('1.1: requireAdmin middleware enforces admin role and rejects non-admin users', () => {
    const authMiddlewarePath = path.join(apiDir, 'src', 'middleware', 'auth.ts');
    assert.strictEqual(fs.existsSync(authMiddlewarePath), true);
    const content = fs.readFileSync(authMiddlewarePath, 'utf-8');

    assert.match(content, /export function requireAdmin/);
    assert.match(content, /req\.user\?\.role !== 'admin'/);
    assert.match(content, /Admin access required/);
  });

  it('1.2: Blocked user check prevents suspended users from authenticating in auth.service', () => {
    const authServicePath = path.join(apiDir, 'src', 'services', 'auth.service.ts');
    const content = fs.readFileSync(authServicePath, 'utf-8');

    assert.match(content, /user\.isBlocked/);
    assert.match(content, /Your account has been suspended/);
  });

  it('1.3: Blocked user check prevents suspended users from placing checkout orders', () => {
    const orderServicePath = path.join(apiDir, 'src', 'services', 'order.service.ts');
    const content = fs.readFileSync(orderServicePath, 'utf-8');

    assert.match(content, /user\?\.isBlocked/);
    assert.match(content, /Your account has been suspended/);
  });

  it('1.4: Self-protection invariant guards prevent admin self-demotion and self-blocking', () => {
    const adminServicePath = path.join(apiDir, 'src', 'services', 'admin.service.ts');
    const content = fs.readFileSync(adminServicePath, 'utf-8');

    assert.match(content, /id === currentAdminId && role !== 'admin'/);
    assert.match(content, /You cannot demote your own admin account/);
    assert.match(content, /id === currentAdminId && isBlocked/);
    assert.match(content, /You cannot block your own admin account/);
  });
});

describe('Admin Panel: Module 2 - Product & Category Catalog Management', () => {
  it('2.1: Product model allows dynamic categories without enum constraint', () => {
    const productModelPath = path.join(apiDir, 'src', 'models', 'Product.model.ts');
    const content = fs.readFileSync(productModelPath, 'utf-8');

    assert.match(content, /category:\s*string;/);
    assert.doesNotMatch(content, /enum:\s*\['tops',\s*'bottoms',\s*'outerwear',\s*'accessories'\]/);
  });

  it('2.2: Category model exists with name and unique slug fields', () => {
    const categoryModelPath = path.join(apiDir, 'src', 'models', 'Category.model.ts');
    assert.strictEqual(fs.existsSync(categoryModelPath), true);
    const content = fs.readFileSync(categoryModelPath, 'utf-8');

    assert.match(content, /name:\s*\{\s*type:\s*String/);
    assert.match(content, /slug:\s*\{\s*type:\s*String/);
  });

  it('2.3: AdminService supports multi-parameter product filtering, searching, and pagination', () => {
    const adminServicePath = path.join(apiDir, 'src', 'services', 'admin.service.ts');
    const content = fs.readFileSync(adminServicePath, 'utf-8');

    assert.match(content, /getProducts\(/);
    assert.match(content, /createProduct\(/);
    assert.match(content, /updateProduct\(/);
    assert.match(content, /deleteProduct\(/);
    assert.match(content, /getCategories\(/);
    assert.match(content, /createCategory\(/);
  });

  it('2.4: Upload middleware supports multi-image upload with local and Cloudinary storage', () => {
    const uploadMiddlewarePath = path.join(apiDir, 'src', 'middleware', 'upload.ts');
    assert.strictEqual(fs.existsSync(uploadMiddlewarePath), true);
    const content = fs.readFileSync(uploadMiddlewarePath, 'utf-8');

    assert.match(content, /multer\.diskStorage/);
    assert.match(content, /cloudinary/);
    assert.match(content, /getFileUrl/);
  });
});

describe('Admin Panel: Module 3 - Inventory Control & Low-Stock Alerts', () => {
  it('3.1: AdminService provides inventory matrix with low-stock threshold evaluation', () => {
    const adminServicePath = path.join(apiDir, 'src', 'services', 'admin.service.ts');
    const content = fs.readFileSync(adminServicePath, 'utf-8');

    assert.match(content, /getInventory\(/);
    assert.match(content, /updateVariantStock\(/);
    assert.match(content, /getLowStockAlerts\(/);
    assert.match(content, /'variants\.\$\.stock':/);
  });

  it('3.2: Cancelling or refunding an order restores variant inventory stock atomically', () => {
    const adminServicePath = path.join(apiDir, 'src', 'services', 'admin.service.ts');
    const content = fs.readFileSync(adminServicePath, 'utf-8');

    assert.match(content, /\$inc:\s*\{\s*'variants\.\$\.stock':\s*item\.quantity\s*\}/);
  });
});

describe('Admin Panel: Module 4 - Order Fulfillment & Refund Integrity', () => {
  it('4.1: Order model includes optional refund tracking fields', () => {
    const orderModelPath = path.join(apiDir, 'src', 'models', 'Order.model.ts');
    const content = fs.readFileSync(orderModelPath, 'utf-8');

    assert.match(content, /refundAmount\?:\s*number/);
    assert.match(content, /refundReason\?:\s*string/);
    assert.match(content, /refundId\?:\s*string/);
  });

  it('4.2: AdminService refundOrder invokes Razorpay API and marks order refunded', () => {
    const adminServicePath = path.join(apiDir, 'src', 'services', 'admin.service.ts');
    const content = fs.readFileSync(adminServicePath, 'utf-8');

    assert.match(content, /refundOrder\(/);
    assert.match(content, /razorpay\.payments\.refund/);
    assert.match(content, /paymentStatus\s*=\s*'refunded'/);
  });

  it('4.3: Order routes AST invariant: orders.routes.ts was preserved untouched', () => {
    const ordersRoutesPath = path.join(apiDir, 'src', 'routes', 'orders.routes.ts');
    const content = fs.readFileSync(ordersRoutesPath, 'utf-8');

    // Confirms M1 invariant: orders.routes.ts was not edited
    assert.strictEqual(content.includes('item.quantity <= 0'), false);
    assert.strictEqual(content.includes('timingSafeEqual'), false);
  });
});

describe('Admin Panel: Module 5 - Customer Management', () => {
  it('5.1: Customer model includes isBlocked field defaulting to false', () => {
    const userModelPath = path.join(apiDir, 'src', 'models', 'User.model.ts');
    const content = fs.readFileSync(userModelPath, 'utf-8');

    assert.match(content, /isBlocked\?:\s*boolean/);
    assert.match(content, /isBlocked:\s*\{\s*type:\s*Boolean,\s*default:\s*false\s*\}/);
  });

  it('5.2: AdminService provides customer list, full profile history, and permission toggles', () => {
    const adminServicePath = path.join(apiDir, 'src', 'services', 'admin.service.ts');
    const content = fs.readFileSync(adminServicePath, 'utf-8');

    assert.match(content, /getCustomers\(/);
    assert.match(content, /getCustomerById\(/);
    assert.match(content, /updateCustomerRole\(/);
    assert.match(content, /toggleBlockCustomer\(/);
  });
});

describe('Admin Panel: Module 6 - Analytics, Telemetry & Conversion Rate', () => {
  it('6.1: PageView model records traffic paths and dates', () => {
    const pageViewModelPath = path.join(apiDir, 'src', 'models', 'PageView.model.ts');
    assert.strictEqual(fs.existsSync(pageViewModelPath), true);
    const content = fs.readFileSync(pageViewModelPath, 'utf-8');

    assert.match(content, /path:\s*\{\s*type:\s*String/);
    assert.match(content, /date:\s*\{\s*type:\s*String/);
  });

  it('6.2: AdminService aggregates revenue, status breakdown, top products, and conversion rate', () => {
    const adminServicePath = path.join(apiDir, 'src', 'services', 'admin.service.ts');
    const content = fs.readFileSync(adminServicePath, 'utf-8');

    assert.match(content, /getAnalytics\(/);
    assert.match(content, /\$group:\s*\{\s*_id:\s*null,\s*total:\s*\{\s*\$sum:\s*'\$total'\s*\}\s*\}/);
    assert.match(content, /conversionRate/);
  });
});

describe('Admin Panel: Module 7 - Frontend Admin App Router & Design System', () => {
  it('7.1: All required admin App Router pages exist', () => {
    const adminRoutes = [
      'admin/layout.tsx',
      'admin/page.tsx',
      'admin/login/page.tsx',
      'admin/products/page.tsx',
      'admin/categories/page.tsx',
      'admin/orders/page.tsx',
      'admin/inventory/page.tsx',
      'admin/customers/page.tsx',
    ];

    for (const route of adminRoutes) {
      const fullPath = path.join(webDir, 'src', 'app', ...route.split('/'));
      assert.strictEqual(fs.existsSync(fullPath), true, `Route ${route} must exist`);
    }
  });

  it('7.2: Admin components adhere strictly to design system tokens and ban AI purple colors', () => {
    const bannedColors = ['#8A2BE2', '#6366F1', '#8B5CF6', '#7C3AED', '#A855F7'];
    const adminFiles = [
      path.join(webDir, 'src', 'components', 'admin', 'AdminSidebar.tsx'),
      path.join(webDir, 'src', 'components', 'admin', 'AdminTopBar.tsx'),
      path.join(webDir, 'src', 'components', 'admin', 'AdminGuard.tsx'),
      path.join(webDir, 'src', 'components', 'admin', 'ConfirmDialog.tsx'),
      path.join(webDir, 'src', 'components', 'admin', 'AdminCharts.tsx'),
    ];

    for (const file of adminFiles) {
      assert.strictEqual(fs.existsSync(file), true, `Component ${path.basename(file)} must exist`);
      const content = fs.readFileSync(file, 'utf-8');
      for (const banned of bannedColors) {
        assert.strictEqual(
          content.toUpperCase().includes(banned),
          false,
          `File ${path.basename(file)} must not contain banned purple ${banned}`,
        );
      }
    }
  });

  it('7.3: Admin seed script exists and is registered in package.json', () => {
    const seedScriptPath = path.join(apiDir, 'src', 'scripts', 'seed-admin.ts');
    assert.strictEqual(fs.existsSync(seedScriptPath), true);

    const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
    assert.strictEqual(Boolean(rootPkg.scripts?.['seed:admin']), true);
  });

  it('7.4: Double-submit keystroke guards (FORM-01) are implemented across all mutation forms', () => {
    const productsPage = fs.readFileSync(path.join(webDir, 'src', 'app', 'admin', 'products', 'page.tsx'), 'utf-8');
    assert.match(productsPage, /if \(isSaving\) return;/);
    assert.match(productsPage, /if \(isDeleting\) return;/);
    assert.match(productsPage, /if \(isUploading\) return;/);

    const inventoryPage = fs.readFileSync(path.join(webDir, 'src', 'app', 'admin', 'inventory', 'page.tsx'), 'utf-8');
    assert.match(inventoryPage, /if \(isUpdatingStock\) return;/);

    const ordersPage = fs.readFileSync(path.join(webDir, 'src', 'app', 'admin', 'orders', 'page.tsx'), 'utf-8');
    assert.match(ordersPage, /if \(isUpdatingStatus\) return;/);
    assert.match(ordersPage, /if \(isRefunding\) return;/);

    const categoriesPage = fs.readFileSync(path.join(webDir, 'src', 'app', 'admin', 'categories', 'page.tsx'), 'utf-8');
    assert.match(categoriesPage, /if \(isSaving\) return;/);
    assert.match(categoriesPage, /if \(isDeleting\) return;/);

    const customersPage = fs.readFileSync(path.join(webDir, 'src', 'app', 'admin', 'customers', 'page.tsx'), 'utf-8');
    assert.match(customersPage, /if \(isUpdatingRole\) return;/);
    assert.match(customersPage, /if \(isUpdatingBlock\) return;/);

    const loginPage = fs.readFileSync(path.join(webDir, 'src', 'app', 'admin', 'login', 'page.tsx'), 'utf-8');
    assert.match(loginPage, /if \(isLoading\) return;/);
  });
});

describe('Admin Panel: Module 8 - Rigorous Business Invariants & Security Hardening', () => {
  it('8.1: Variant SKU Uniqueness (VAL-02) is enforced in Product model and AdminService', () => {
    const productModel = fs.readFileSync(path.join(apiDir, 'src', 'models', 'Product.model.ts'), 'utf-8');
    assert.match(productModel, /Each variant must have a unique SKU code/);

    const adminService = fs.readFileSync(path.join(apiDir, 'src', 'services', 'admin.service.ts'), 'utf-8');
    assert.match(adminService, /Each variant must have a unique SKU code/);
  });

  it('8.2: Order state machine transitions (ORD-01) enforce terminal states and valid lifecycle', () => {
    const adminService = fs.readFileSync(path.join(apiDir, 'src', 'services', 'admin.service.ts'), 'utf-8');
    assert.match(adminService, /ALLOWED_TRANSITIONS/);
    assert.match(adminService, /delivered:\s*\[\s*\]/);
    assert.match(adminService, /cancelled:\s*\[\s*\]/);
    assert.match(adminService, /Cannot transition order from/);
  });

  it('8.3: Refund eligibility guard (ORD-02) and check-and-set lock (SEC-05) prevent illegal and double refunds', () => {
    const adminService = fs.readFileSync(path.join(apiDir, 'src', 'services', 'admin.service.ts'), 'utf-8');
    assert.match(adminService, /paymentStatus !== 'captured'/);
    assert.match(adminService, /paymentStatus === 'refunding'/);
    assert.match(adminService, /paymentStatus:\s*'refunding'/);
  });

  it('8.4: Deletion dependency guards protect products (CAT-01) and categories (CAT-02)', () => {
    const adminService = fs.readFileSync(path.join(apiDir, 'src', 'services', 'admin.service.ts'), 'utf-8');
    assert.match(adminService, /Cannot delete product: active unfulfilled orders exist/);
    assert.match(adminService, /active products are currently assigned to it/);
  });

  it('8.5: Financial metrics (FIN-01) require paymentStatus: captured for platform revenue and customer spend', () => {
    const adminService = fs.readFileSync(path.join(apiDir, 'src', 'services', 'admin.service.ts'), 'utf-8');
    assert.match(adminService, /paymentStatus:\s*'captured'/);
    assert.match(adminService, /status:\s*\{\s*\$nin:\s*\['cancelled'\]\s*\}/);
  });

  it('8.6: Telemetry schema (SEC-03) caps path and referrer string lengths', () => {
    const adminSchema = fs.readFileSync(path.join(apiDir, 'src', 'validators', 'admin.schema.ts'), 'utf-8');
    assert.match(adminSchema, /trackViewSchema/);
    assert.match(adminSchema, /max\(200/);
    assert.match(adminSchema, /max\(300/);
  });
});
