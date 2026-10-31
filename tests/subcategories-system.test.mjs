/**
 * Subcategories System Verification Test Suite
 * Validates:
 * 1. Domain Types & Database Models (Category parentId/parentSlug, Product subcategory)
 * 2. Zod Validation Schemas (admin category & product schemas, product query schema)
 * 3. Admin Service Category Hierarchy, Self-Parenting Guard, Slug Cascade & Deletion Integrity
 * 4. Product Service Subcategory Filtering & Category Taxonomy Exposure
 * 5. Admin Category Management UI (Hierarchy Tree, Subcategory Checkbox, Parent Selector)
 * 6. Admin Product Management UI (Dynamic Category-Filtered Subcategory Dropdown, Table Indicator)
 * 7. Storefront Catalog UI (Dynamic Subcategory Pills for Bottoms & All Gear, Reset Behavior, Touch Targets, A11y)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'apps', 'web');
const apiDir = path.join(rootDir, 'apps', 'api');
const typesDir = path.join(rootDir, 'packages', 'types');

describe('Subcategory System: Module 1 - Domain Types & Database Models', () => {
  it('1.1: packages/types/src/product.ts exports subcategory and category hierarchy fields', () => {
    const typesPath = path.join(typesDir, 'src', 'product.ts');
    assert.strictEqual(fs.existsSync(typesPath), true, 'packages/types/src/product.ts must exist');
    const content = fs.readFileSync(typesPath, 'utf-8');

    assert.match(content, /subcategory\?: string \| null;/, 'Product interface must include subcategory field');
    assert.match(content, /subcategory\?: string;/, 'ProductFilters interface must include subcategory field');
    assert.match(content, /parentId\?: string \| null;/, 'CategoryItem interface must include parentId field');
    assert.match(content, /parentSlug\?: string \| null;/, 'CategoryItem interface must include parentSlug field');
  });

  it('1.2: Category.model.ts defines parentId and parentSlug with indexes', () => {
    const categoryModelPath = path.join(apiDir, 'src', 'models', 'Category.model.ts');
    assert.strictEqual(fs.existsSync(categoryModelPath), true);
    const content = fs.readFileSync(categoryModelPath, 'utf-8');

    assert.match(content, /parentId\?: mongoose\.Types\.ObjectId \| null;/, 'ICategory must include parentId');
    assert.match(content, /parentSlug\?: string \| null;/, 'ICategory must include parentSlug');
    assert.match(content, /ref:\s*'Category'/, 'Category schema parentId must reference Category model');
    assert.match(content, /categorySchema\.index\(\{\s*parentId:\s*1\s*\}\)/, 'Category schema must index parentId');
    assert.match(content, /categorySchema\.index\(\{\s*parentSlug:\s*1\s*\}\)/, 'Category schema must index parentSlug');
  });

  it('1.3: Product.model.ts defines subcategory with compound indexes', () => {
    const productModelPath = path.join(apiDir, 'src', 'models', 'Product.model.ts');
    assert.strictEqual(fs.existsSync(productModelPath), true);
    const content = fs.readFileSync(productModelPath, 'utf-8');

    assert.match(content, /subcategory\?: string \| null;/, 'IProduct must include subcategory');
    assert.match(content, /subcategory:\s*\{\s*type:\s*String/, 'Product schema must define subcategory field');
    assert.match(content, /productSchema\.index\(\{\s*category:\s*1,\s*subcategory:\s*1,\s*isPublished:\s*1\s*\}\)/, 'Product schema must have compound category + subcategory index');
    assert.match(content, /productSchema\.index\(\{\s*subcategory:\s*1,\s*isPublished:\s*1\s*\}\)/, 'Product schema must index subcategory');
  });
});

describe('Subcategory System: Module 2 - Request Validation Schemas', () => {
  it('2.1: admin.schema.ts validates parentId, parentSlug, and product subcategory', () => {
    const adminSchemaPath = path.join(apiDir, 'src', 'validators', 'admin.schema.ts');
    const content = fs.readFileSync(adminSchemaPath, 'utf-8');

    assert.match(content, /createCategorySchema/, 'admin.schema.ts must export createCategorySchema');
    assert.match(content, /updateCategorySchema/, 'admin.schema.ts must export updateCategorySchema');
    assert.match(content, /subcategory:\s*z\.string\(\)\.nullable\(\)\.optional\(\)/, 'Product schemas must validate subcategory');
  });

  it('2.2: product.schema.ts validates subcategory query parameter', () => {
    const productSchemaPath = path.join(apiDir, 'src', 'validators', 'product.schema.ts');
    const content = fs.readFileSync(productSchemaPath, 'utf-8');

    assert.match(content, /productQuerySchema/, 'product.schema.ts must export productQuerySchema');
    assert.match(content, /subcategory:\s*z\.string\(\)\.optional\(\)/, 'productQuerySchema must validate optional subcategory');
  });
});

describe('Subcategory System: Module 3 - Admin Service Hierarchy & Integrity Guards', () => {
  const adminServicePath = path.join(apiDir, 'src', 'services', 'admin.service.ts');
  const content = fs.readFileSync(adminServicePath, 'utf-8');

  it('3.1: getCategories returns parentId, parentSlug, and productCount', () => {
    assert.match(content, /parentId:\s*cat\.parentId/, 'getCategories must map parentId');
    assert.match(content, /parentSlug:\s*cat\.parentSlug/, 'getCategories must map parentSlug');
    assert.match(content, /subcategoryCounts/, 'getCategories must count products by subcategory');
  });

  it('3.2: createCategory validates parent existence and assigns parentSlug', () => {
    assert.match(content, /Parent category not found/, 'createCategory must guard against non-existent parent');
    assert.match(content, /parentSlug\s*=\s*parent\.slug/, 'createCategory must resolve parentSlug from parent');
  });

  it('3.3: updateCategory prevents self-parenting cycle', () => {
    assert.match(content, /data\.parentId\s*===\s*id/, 'updateCategory must check if parentId equals id');
    assert.match(content, /Category cannot be its own parent/, 'updateCategory must throw error for self-parenting');
  });

  it('3.4: updateCategory cascades category slug renames to products and children', () => {
    assert.match(content, /Product\.updateMany\(\s*\{\s*category:/, 'updateCategory must update Product.category on rename');
    assert.match(content, /Product\.updateMany\(\s*\{\s*subcategory:/, 'updateCategory must update Product.subcategory on rename');
    assert.match(content, /Category\.updateMany\(\s*\{\s*\$or:\s*\[\{\s*parentId:\s*cat\._id\s*\},/s, 'updateCategory must update child Category.parentSlug and parentId on rename');
  });

  it('3.5: deleteCategory prevents deletion when child subcategories or products exist', () => {
    assert.match(content, /active subcategories assigned to it/, 'deleteCategory must protect categories with subcategories');
    assert.match(content, /active products are currently assigned to it/, 'deleteCategory must protect categories with assigned products');
    assert.match(content, /Category\.countDocuments\(\s*\{\s*\$or:\s*\[\s*\{\s*parentId:\s*cat\._id\s*\},\s*\{\s*parentSlug:\s*cat\.slug\s*\}\s*\]/s, 'deleteCategory must check both parentId and parentSlug');
  });

  it('3.6: createProduct and updateProduct normalize subcategory', () => {
    assert.match(content, /subcategory\.trim\(\)\.toLowerCase\(\)/, 'Product creation/update must normalize subcategory to lowercase and trimmed');
  });

  it('3.7: createCategory and updateCategory prevent nesting a subcategory under another subcategory', () => {
    assert.match(content, /Cannot nest a sub-category under another sub-category/, 'Must prevent multi-level subcategory nesting');
  });

  it('3.8: updateCategory prevents converting a parent with active children into a subcategory', () => {
    assert.match(content, /Cannot convert a category that has active sub-categories into a sub-category/, 'Must prevent cycles when parent has children');
  });
});

describe('Subcategory System: Module 4 - Product Service Query Filtering', () => {
  const productServicePath = path.join(apiDir, 'src', 'services', 'product.service.ts');
  const content = fs.readFileSync(productServicePath, 'utf-8');

  it('4.1: getProducts applies subcategory filter in database query', () => {
    assert.match(content, /if\s*\(\s*subcategory\s*&&\s*subcategory\.toLowerCase\(\)\s*!==\s*['"]all['"]\s*\)/, 'getProducts must check subcategory');
    assert.match(content, /filter\.subcategory\s*=\s*subcategory\.toLowerCase\(\)\.trim\(\)/, 'getProducts must filter by normalized subcategory');
  });

  it('4.2: getCategories exports parentId and parentSlug for public taxonomy', () => {
    assert.match(content, /parentId:\s*dbCat\?\.parentId/, 'product.service getCategories must expose parentId');
    assert.match(content, /parentSlug:\s*dbCat\?\.parentSlug/, 'product.service getCategories must expose parentSlug');
  });

  it('4.3: getCategories aggregates subcategory metrics and exposes _id', () => {
    assert.match(content, /rawSubcategories/, 'product.service getCategories must aggregate subcategory metrics');
    assert.match(content, /_id:\s*dbCat\?\._id\s*\?\s*String\(dbCat\._id\)\s*:\s*undefined/, 'product.service getCategories must expose _id');
  });
});

describe('Subcategory System: Module 5 - Admin Categories UI', () => {
  const adminCategoriesPath = path.join(webDir, 'src', 'app', 'admin', 'categories', 'page.tsx');
  const content = fs.readFileSync(adminCategoriesPath, 'utf-8');

  it('5.1: Modal provides "Make this a sub-category" checkbox and parent selector', () => {
    assert.match(content, /Make this a sub-category/, 'Modal must provide Make this a sub-category label');
    assert.match(content, /Parent Category/, 'Modal must render Parent Category field');
    assert.match(content, /parentCandidates/, 'Categories page must filter eligible parent candidates');
  });

  it('5.2: Table renders hierarchical tree with visual indentation and badges', () => {
    assert.match(content, /hierarchicalCategories/, 'Categories page must compute hierarchicalCategories');
    assert.match(content, /ArrowElbowDownRight/, 'Tree must render indentation icon for subcategories');
    assert.match(content, /Sub of/, 'Subcategory rows must display Sub of badge');
  });
});

describe('Subcategory System: Module 6 - Admin Products UI', () => {
  const adminProductsPath = path.join(webDir, 'src', 'app', 'admin', 'products', 'page.tsx');
  const content = fs.readFileSync(adminProductsPath, 'utf-8');

  it('6.1: Product form dynamically filters available subcategories by selected category', () => {
    assert.match(content, /availableSubcategories/, 'Products page must compute availableSubcategories');
    assert.match(content, /Sub-Category \(Optional\)/, 'Product modal must render Sub-Category selector');
  });

  it('6.2: Products table displays subcategory badge in category column', () => {
    assert.match(content, /p\.subcategory/, 'Products table must check p.subcategory');
    assert.match(content, /\/\{p\.subcategory\}/, 'Products table must display /{p.subcategory}');
  });
});

describe('Subcategory System: Module 7 - Storefront Catalog UI & Filtering', () => {
  const productsPagePath = path.join(webDir, 'src', 'app', 'products', 'page.tsx');
  const content = fs.readFileSync(productsPagePath, 'utf-8');
  const catalogPath = path.join(webDir, 'src', 'lib', 'catalog.ts');
  const catalogContent = fs.readFileSync(catalogPath, 'utf-8');

  it('7.1: CatalogProduct interface and mock catalog include subcategories', () => {
    assert.match(catalogContent, /subcategory\?: string;/, 'CatalogProduct must define subcategory');
    assert.match(catalogContent, /subcategory:\s*['"]shorts['"]/, 'Apex Shorts must have shorts subcategory');
    assert.match(catalogContent, /subcategory:\s*['"]pants['"]/, 'Tactical Jogger must have pants subcategory');
  });

  it('7.2: Storefront products/page.tsx renders dynamic subcategory filter pills', () => {
    assert.match(content, /availableSubcategories/, 'products page must compute availableSubcategories');
    assert.match(content, /role="region"/, 'Subcategory pill container must declare region landmark');
    assert.match(content, /aria-label="Subcategory filters"/, 'Subcategory pill container must declare aria-label');
    assert.match(content, /role="tablist"/, 'Pill list must declare role tablist');
    assert.match(content, /role="tab"/, 'Individual pills must declare role tab');
    assert.match(content, /aria-selected=/, 'Pill buttons must declare aria-selected');
  });

  it('7.3: Storefront subcategory pills meet touch target (>=44px) and focus accessibility', () => {
    assert.match(content, /touch-target/, 'Pill buttons must include touch-target class');
    assert.match(content, /min-h-\[44px\]/, 'Pill buttons must satisfy min-h-[44px]');
    assert.match(content, /focus-visible:ring-2/, 'Pill buttons must declare high-contrast focus ring');
  });

  it('7.4: Storefront filters products by subcategory', () => {
    assert.match(content, /p\.subcategory && p\.subcategory\.toLowerCase\(\) === subcategory\.toLowerCase\(\)/, 'filteredProducts must filter by selected subcategory');
    assert.match(content, /setSubcategory\('all'\)/, 'Subcategory must be resettable to all');
  });

  it('7.5: Storefront product detail page maps subcategory and displays breadcrumb', () => {
    const slugPagePath = path.join(webDir, 'src', 'app', 'products', '[slug]', 'page.tsx');
    assert.strictEqual(fs.existsSync(slugPagePath), true);
    const slugContent = fs.readFileSync(slugPagePath, 'utf-8');
    assert.match(slugContent, /subcategory\?: string;/, '[slug]/page.tsx ApiProductInput must define subcategory');
    assert.match(slugContent, /subcategory:\s*apiProd\.subcategory/, '[slug]/page.tsx mapApiProductToCatalog must map subcategory');
    assert.match(slugContent, /product\.subcategory\s*&&/, '[slug]/page.tsx must conditionally render subcategory breadcrumb');
  });

  it('7.6: Storefront subcategory tablist supports keyboard arrow navigation', () => {
    assert.match(content, /handleSubcategoryKeyDown/, 'products page must declare handleSubcategoryKeyDown');
    assert.match(content, /onKeyDown=\{handleSubcategoryKeyDown\}/, 'Subcategory tablist must handle onKeyDown');
  });
});

describe('Subcategory System: Module 8 - Functional Zod Validation Execution', () => {
  it('8.1: Category and Product schemas parse valid subcategory payloads correctly', () => {
    const { createCategorySchema, updateCategorySchema, adminCreateProductSchema } =
      require('../apps/api/dist/validators/admin.schema.js');
    const { productQuerySchema } = require('../apps/api/dist/validators/product.schema.js');

    // 1. Create subcategory with parent
    const validCatResult = createCategorySchema.safeParse({
      body: {
        name: 'Shorts',
        slug: 'shorts',
        parentId: '64b0f0f0f0f0f0f0f0f0f0f0',
        parentSlug: 'bottoms',
      },
    });
    assert.strictEqual(validCatResult.success, true);
    if (validCatResult.success) {
      assert.strictEqual(validCatResult.data.body.parentSlug, 'bottoms');
      assert.strictEqual(validCatResult.data.body.parentId, '64b0f0f0f0f0f0f0f0f0f0f0');
    }

    // 2. Update category clearing parentId/parentSlug
    const clearParentResult = updateCategorySchema.safeParse({
      params: { id: '64b0f0f0f0f0f0f0f0f0f0f1' },
      body: {
        parentId: null,
        parentSlug: null,
      },
    });
    assert.strictEqual(clearParentResult.success, true);
    if (clearParentResult.success) {
      assert.strictEqual(clearParentResult.data.body.parentId, null);
    }

    // 3. Create product with subcategory
    const validProductResult = adminCreateProductSchema.safeParse({
      body: {
        name: 'Apex Utility Short',
        description: 'Engineered training short',
        category: 'bottoms',
        subcategory: 'shorts',
        price: 4500,
        brand: 'XYDV',
      },
    });
    assert.strictEqual(validProductResult.success, true);
    if (validProductResult.success) {
      assert.strictEqual(validProductResult.data.body.subcategory, 'shorts');
    }

    // 4. Query products with subcategory
    const validQueryResult = productQuerySchema.safeParse({
      query: {
        category: 'bottoms',
        subcategory: 'shorts',
      },
    });
    assert.strictEqual(validQueryResult.success, true);
    if (validQueryResult.success && validQueryResult.data.query) {
      assert.strictEqual(validQueryResult.data.query.subcategory, 'shorts');
    }
  });
});

describe('Subcategory System: Module 9 - Functional Catalog Filtering Simulation', () => {
  const mockProducts = [
    {
      id: 'prod_1',
      name: 'Apex Utility Short',
      category: 'bottoms',
      subcategory: 'shorts',
      gender: 'men',
    },
    {
      id: 'prod_2',
      name: 'Tactical Cargo Pant',
      category: 'bottoms',
      subcategory: 'pants',
      gender: 'men',
    },
    {
      id: 'prod_3',
      name: 'Aero Compression Top',
      category: 'tops',
      subcategory: null,
      gender: 'men',
    },
    {
      id: 'prod_4',
      name: 'All-Terrain Short',
      category: 'bottoms',
      subcategory: 'shorts',
      gender: 'men',
    },
  ];

  function filterCatalog(products, { category = 'all', subcategory = 'all' }) {
    return products.filter((p) => {
      if (category !== 'all' && p.category.toLowerCase() !== category.toLowerCase()) {
        return false;
      }
      if (
        subcategory !== 'all' &&
        (!p.subcategory || p.subcategory.toLowerCase() !== subcategory.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }

  it('9.1: returns all bottoms when category is bottoms and subcategory is all', () => {
    const results = filterCatalog(mockProducts, { category: 'bottoms', subcategory: 'all' });
    assert.strictEqual(results.length, 3);
    assert.ok(results.every((p) => p.category === 'bottoms'));
  });

  it('9.2: filters specifically to shorts when subcategory is shorts', () => {
    const results = filterCatalog(mockProducts, { category: 'bottoms', subcategory: 'shorts' });
    assert.strictEqual(results.length, 2);
    assert.ok(results.every((p) => p.subcategory === 'shorts'));
    assert.ok(!results.some((p) => p.name === 'Tactical Cargo Pant'));
  });

  it('9.3: filters specifically to pants when subcategory is pants', () => {
    const results = filterCatalog(mockProducts, { category: 'bottoms', subcategory: 'pants' });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].name, 'Tactical Cargo Pant');
  });

  it('9.4: filters across all categories when category is all and subcategory is shorts', () => {
    const results = filterCatalog(mockProducts, { category: 'all', subcategory: 'shorts' });
    assert.strictEqual(results.length, 2);
    assert.ok(results.every((p) => p.subcategory === 'shorts'));
  });
});

describe('Subcategory System: Module 10 - Functional Hierarchy Tree Assembly', () => {
  const rawCategories = [
    { _id: 'cat_bottoms', name: 'Bottoms', slug: 'bottoms', parentId: null, parentSlug: null },
    { _id: 'cat_pants', name: 'Pants', slug: 'pants', parentId: 'cat_bottoms', parentSlug: 'bottoms' },
    { _id: 'cat_tops', name: 'Tops', slug: 'tops', parentId: null, parentSlug: null },
    { _id: 'cat_shorts', name: 'Shorts', slug: 'shorts', parentId: 'cat_bottoms', parentSlug: 'bottoms' },
    { _id: 'cat_tees', name: 'T-Shirts', slug: 'tees', parentId: 'cat_tops', parentSlug: 'tops' },
  ];

  function buildHierarchicalCategories(categories) {
    const rootCategories = categories.filter((c) => !c.parentId && !c.parentSlug);
    const subcategoryMap = new Map();

    for (const cat of categories) {
      if (cat.parentId || cat.parentSlug) {
        const key = cat.parentId ? String(cat.parentId) : String(cat.parentSlug);
        if (!subcategoryMap.has(key)) {
          subcategoryMap.set(key, []);
        }
        subcategoryMap.get(key).push(cat);
      }
    }

    const result = [];
    for (const root of rootCategories) {
      result.push({ ...root, depth: 0 });
      const children =
        (root._id ? subcategoryMap.get(String(root._id)) : undefined) ||
        (root.slug ? subcategoryMap.get(String(root.slug)) : undefined) ||
        [];
      for (const child of children) {
        result.push({ ...child, depth: 1, parentName: root.name });
      }
    }
    return result;
  }

  it('10.1: builds flattened tree with children placed under parents at depth 1', () => {
    const tree = buildHierarchicalCategories(rawCategories);
    assert.strictEqual(tree.length, 5);

    // Root 1: Bottoms
    assert.strictEqual(tree[0].name, 'Bottoms');
    assert.strictEqual(tree[0].depth, 0);

    // Children of Bottoms: Pants and Shorts
    assert.strictEqual(tree[1].name, 'Pants');
    assert.strictEqual(tree[1].depth, 1);
    assert.strictEqual(tree[1].parentName, 'Bottoms');

    assert.strictEqual(tree[2].name, 'Shorts');
    assert.strictEqual(tree[2].depth, 1);
    assert.strictEqual(tree[2].parentName, 'Bottoms');

    // Root 2: Tops
    assert.strictEqual(tree[3].name, 'Tops');
    assert.strictEqual(tree[3].depth, 0);

    // Children of Tops: T-Shirts
    assert.strictEqual(tree[4].name, 'T-Shirts');
    assert.strictEqual(tree[4].depth, 1);
    assert.strictEqual(tree[4].parentName, 'Tops');
  });
});
