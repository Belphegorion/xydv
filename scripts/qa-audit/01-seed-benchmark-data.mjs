import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xydv';

async function seed() {
  console.log('Connecting to database:', MONGODB_URI);
  if (!MONGODB_URI.includes('localhost') && !MONGODB_URI.includes('127.0.0.1')) {
    throw new Error('SAFETY HALT: Attempted to seed non-local database: ' + MONGODB_URI);
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('xydv');
  console.log('Confirmed database name:', db.databaseName);

  const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);
  const now = new Date();

  // 1. QA Admin & Customers
  const usersCol = db.collection('users');
  const adminDoc = {
    _id: new ObjectId(),
    name: 'QA-XYDV Admin Superuser',
    email: 'qa-admin@xydv.test',
    password: hashedPassword,
    role: 'admin',
    isBlocked: false,
    loyaltyPoints: 1000,
    addresses: [{
      street: '123 QA Command Hub',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      isDefault: true
    }],
    qaMarker: 'QA-XYDV',
    createdAt: now,
    updatedAt: now
  };

  const buyerDoc = {
    _id: new ObjectId(),
    name: 'QA-XYDV Jonathan Bartholomew Constantine Alexander Montgomery-Vanderbilt III',
    email: 'qa-buyer-longname@xydv.test',
    password: hashedPassword,
    role: 'customer',
    isBlocked: false,
    loyaltyPoints: 250,
    addresses: [{
      street: '456 Silk Board Tech Park Block 9',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560068',
      country: 'India',
      isDefault: true
    }],
    qaMarker: 'QA-XYDV',
    createdAt: now,
    updatedAt: now
  };

  const blockedUserDoc = {
    _id: new ObjectId(),
    name: 'QA-XYDV Blocked Test User',
    email: 'qa-blocked@xydv.test',
    password: hashedPassword,
    role: 'customer',
    isBlocked: true,
    loyaltyPoints: 0,
    addresses: [],
    qaMarker: 'QA-XYDV',
    createdAt: now,
    updatedAt: now
  };

  await usersCol.deleteMany({ email: { $in: [adminDoc.email, buyerDoc.email, blockedUserDoc.email] } });
  await usersCol.insertMany([adminDoc, buyerDoc, blockedUserDoc]);
  console.log('Seeded QA Users: admin, long-name buyer, blocked user');

  // 2. QA Categories
  const categoriesCol = db.collection('categories');
  await categoriesCol.deleteMany({ slug: /^qa-xydv-/ });
  const category1 = {
    _id: new ObjectId(),
    name: 'QA-XYDV Tactical Activewear',
    slug: 'qa-xydv-tactical-activewear',
    description: 'High-density ballistic nylon and micro-grid performance activewear.',
    image: '/products/lookbook-cover.jpg',
    qaMarker: 'QA-XYDV',
    createdAt: now,
    updatedAt: now
  };
  const category2 = {
    _id: new ObjectId(),
    name: 'QA-XYDV Nanotech Outerwear',
    slug: 'qa-xydv-nanotech-outerwear',
    description: 'DWR-coated water-repellent shells and insulated expedition parkas.',
    image: '/products/lookbook-cover.jpg',
    qaMarker: 'QA-XYDV',
    createdAt: now,
    updatedAt: now
  };
  await categoriesCol.insertMany([category1, category2]);
  console.log('Seeded QA Categories');

  // 3. QA Products
  const productsCol = db.collection('products');
  await productsCol.deleteMany({ slug: /^qa-xydv-/ });

  const products = [
    {
      _id: new ObjectId(),
      name: 'QA-XYDV Tactical Articulated Stealth Jacket',
      slug: 'qa-xydv-tactical-stealth-jacket',
      description: 'Engineered with 3-layer bonded ripstop for extreme weather resistance.',
      price: 1299900, // INR 12,999.00 in paise
      mrpPaise: 1899900, // INR 18,999.00
      sellingPricePaise: 1299900,
      effectivePricePaise: 1299900,
      category: 'qa-xydv-tactical-activewear',
      images: ['/products/lookbook-cover.jpg', '/products/lookbook-cover.jpg'],
      variants: [
        { _id: new ObjectId(), size: 'M', color: 'Obsidian', stock: 25, sku: 'QA-STH-BLK-M' },
        { _id: new ObjectId(), size: 'L', color: 'Obsidian', stock: 15, sku: 'QA-STH-BLK-L' }
      ],
      isPublished: true,
      qaMarker: 'QA-XYDV',
      createdAt: now,
      updatedAt: now
    },
    {
      _id: new ObjectId(),
      name: 'QA-XYDV Ultra-High-Performance Advanced Nanotech Seamless Compression Base-Layer Long-Sleeve Shirt with Reinforced Articulated Elbow Scrims',
      slug: 'qa-xydv-ultra-long-name-compression-shirt',
      description: 'Extremely long title product testing typography overflow and layout containment.',
      price: 499900, // INR 4,999.00
      mrpPaise: 699900,
      sellingPricePaise: 499900,
      effectivePricePaise: 499900,
      category: 'qa-xydv-tactical-activewear',
      images: ['/products/lookbook-cover.jpg'],
      variants: [
        { _id: new ObjectId(), size: 'S', color: 'Volt', stock: 10, sku: 'QA-LNG-VLT-S' },
        { _id: new ObjectId(), size: 'M', color: 'Volt', stock: 10, sku: 'QA-LNG-VLT-M' }
      ],
      isPublished: true,
      qaMarker: 'QA-XYDV',
      createdAt: now,
      updatedAt: now
    },
    {
      _id: new ObjectId(),
      name: 'QA-XYDV Zero-Stock Depleted Windbreaker',
      slug: 'qa-xydv-zero-stock-windbreaker',
      description: 'Fully out-of-stock jacket testing add-to-cart rejection and stock badge UI.',
      price: 899900,
      mrpPaise: 1299900,
      sellingPricePaise: 899900,
      effectivePricePaise: 899900,
      category: 'qa-xydv-nanotech-outerwear',
      images: ['/products/lookbook-cover.jpg'],
      variants: [
        { _id: new ObjectId(), size: 'M', color: 'Carbon', stock: 0, sku: 'QA-ZRO-CRB-M' },
        { _id: new ObjectId(), size: 'L', color: 'Carbon', stock: 0, sku: 'QA-ZRO-CRB-L' }
      ],
      isPublished: true,
      qaMarker: 'QA-XYDV',
      createdAt: now,
      updatedAt: now
    },
    {
      _id: new ObjectId(),
      name: 'QA-XYDV Missing-Image Phantom Vest',
      slug: 'qa-xydv-missing-image-phantom-vest',
      description: 'Product with non-existent image URL testing image broken fallback component.',
      price: 349900,
      mrpPaise: 499900,
      sellingPricePaise: 349900,
      effectivePricePaise: 349900,
      category: 'qa-xydv-tactical-activewear',
      images: ['/products/non-existent-broken-image.jpg'],
      variants: [
        { _id: new ObjectId(), size: 'M', color: 'Phantom', stock: 5, sku: 'QA-PHM-PHT-M' }
      ],
      isPublished: true,
      qaMarker: 'QA-XYDV',
      createdAt: now,
      updatedAt: now
    },
    {
      _id: new ObjectId(),
      name: 'QA-XYDV Heavy-Discount Flash Drop Hoodie',
      slug: 'qa-xydv-heavy-discount-hoodie',
      description: 'Heavy 70% discount testing strike-through, saving calculation, and floor bounds.',
      price: 299900, // ₹2,999
      mrpPaise: 999900, // ₹9,999 (70% off)
      sellingPricePaise: 299900,
      effectivePricePaise: 299900,
      discountAmountPaise: 700000,
      discountType: 'percentage',
      discountPercent: 70,
      category: 'qa-xydv-nanotech-outerwear',
      images: ['/products/lookbook-cover.jpg'],
      variants: [
        { _id: new ObjectId(), size: 'L', color: 'Obsidian', stock: 30, sku: 'QA-HVY-BLK-L' }
      ],
      isPublished: true,
      qaMarker: 'QA-XYDV',
      createdAt: now,
      updatedAt: now
    }
  ];

  await productsCol.insertMany(products);
  console.log(`Seeded ${products.length} QA Products`);

  // 4. QA Coupons
  const couponsCol = db.collection('coupons');
  await couponsCol.deleteMany({ code: /^QA/ });
  const coupons = [
    {
      _id: new ObjectId(),
      code: 'QA50',
      description: 'QA 50% discount tier coupon',
      discountType: 'percentage',
      discountValue: 50,
      presetTier: '50',
      maxDiscountAmount: 200000, // ₹2,000 max cap in paise
      minOrderAmount: 199900,
      maxRedemptions: 100,
      maxRedemptionsPerUser: 1,
      redemptionCount: 2,
      status: 'active',
      startDate: new Date(Date.now() - 86400000 * 2),
      endDate: new Date(Date.now() + 86400000 * 30),
      qaMarker: 'QA-XYDV',
      createdAt: now,
      updatedAt: now
    },
    {
      _id: new ObjectId(),
      code: 'QA20',
      description: 'QA 20% discount tier coupon',
      discountType: 'percentage',
      discountValue: 20,
      presetTier: '20',
      minOrderAmount: 99900,
      maxRedemptions: 500,
      maxRedemptionsPerUser: 1,
      redemptionCount: 5,
      status: 'active',
      startDate: new Date(Date.now() - 86400000 * 2),
      endDate: new Date(Date.now() + 86400000 * 30),
      qaMarker: 'QA-XYDV',
      createdAt: now,
      updatedAt: now
    },
    {
      _id: new ObjectId(),
      code: 'QA10',
      description: 'QA 10% discount tier coupon',
      discountType: 'percentage',
      discountValue: 10,
      presetTier: '10',
      minOrderAmount: 49900,
      maxRedemptions: 1000,
      maxRedemptionsPerUser: 1,
      redemptionCount: 10,
      status: 'active',
      startDate: new Date(Date.now() - 86400000 * 2),
      endDate: new Date(Date.now() + 86400000 * 30),
      qaMarker: 'QA-XYDV',
      createdAt: now,
      updatedAt: now
    }
  ];
  await couponsCol.insertMany(coupons);
  console.log(`Seeded ${coupons.length} QA Coupons (QA50, QA20, QA10)`);

  // 5. QA Discounts
  const discountsCol = db.collection('discounts');
  await discountsCol.deleteMany({ title: /^QA-XYDV/ });
  const discounts = [
    {
      _id: new ObjectId(),
      title: 'QA-XYDV Catalog Seasonal Clearance',
      description: 'Storewide 15% promotional discount on entire catalog',
      scope: 'catalog',
      type: 'percentage',
      value: 15,
      weight: 10,
      isActive: true,
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000 * 14),
      qaMarker: 'QA-XYDV',
      createdAt: now,
      updatedAt: now
    },
    {
      _id: new ObjectId(),
      title: 'QA-XYDV Tactical Category Special',
      description: 'Targeted 25% discount on tactical activewear',
      scope: 'category',
      categoryId: category1._id,
      categorySlug: category1.slug,
      type: 'percentage',
      value: 25,
      weight: 20,
      isActive: true,
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000 * 7),
      qaMarker: 'QA-XYDV',
      createdAt: now,
      updatedAt: now
    }
  ];
  await discountsCol.insertMany(discounts);
  console.log(`Seeded ${discounts.length} QA Promotional Discounts`);

  // 6. QA Notifications
  const notificationsCol = db.collection('notifications');
  await notificationsCol.deleteMany({ title: /^QA-XYDV/ });
  const notifications = [
    {
      _id: new ObjectId(),
      title: 'QA-XYDV Limited Technical Drop Alert',
      message: 'New modular performance shells are now live in test catalog.',
      format: 'modal',
      priority: 10,
      targetAudience: 'all',
      frequency: 'once_per_session',
      isActive: true,
      imageUrl: '/products/lookbook-cover.jpg',
      ctaText: 'Explore Drop',
      ctaLink: '/products',
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000 * 30),
      impressionsCount: 42,
      clicksCount: 15,
      dismissalsCount: 8,
      qaMarker: 'QA-XYDV',
      createdAt: now,
      updatedAt: now
    },
    {
      _id: new ObjectId(),
      title: 'QA-XYDV Free Express Shipping',
      message: 'Complimentary courier express dispatched on orders over ₹1,500.',
      format: 'toast',
      priority: 5,
      targetAudience: 'all',
      frequency: 'always',
      isActive: true,
      ctaText: 'View Details',
      ctaLink: '/shipping',
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000 * 30),
      impressionsCount: 120,
      clicksCount: 30,
      dismissalsCount: 25,
      qaMarker: 'QA-XYDV',
      createdAt: now,
      updatedAt: now
    }
  ];
  await notificationsCol.insertMany(notifications);
  console.log(`Seeded ${notifications.length} QA Notification Popups`);

  // 7. QA Orders in every status & refunds
  const ordersCol = db.collection('orders');
  await ordersCol.deleteMany({ 'shippingAddress.address': /QA-XYDV/ });

  const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const baseOrderItems = [
    {
      product: products[0]._id,
      name: products[0].name,
      slug: products[0].slug,
      sku: products[0].variants[0].sku,
      variantId: products[0].variants[0]._id,
      size: 'M',
      color: 'Obsidian',
      quantity: 1,
      price: products[0].price,
      mrpPaise: products[0].mrpPaise,
      sellingPricePaise: products[0].sellingPricePaise,
      effectivePricePaise: products[0].effectivePricePaise,
      image: '/products/lookbook-cover.jpg'
    }
  ];

  const sampleOrders = orderStatuses.map((st, idx) => ({
    _id: new ObjectId(),
    user: buyerDoc._id,
    orderNumber: `QA-ORD-${1000 + idx}`,
    items: baseOrderItems,
    shippingAddress: {
      name: buyerDoc.name,
      address: 'QA-XYDV 123 Performance Parkway',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      phone: '+919876543210'
    },
    paymentMethod: 'razorpay',
    paymentStatus: st === 'cancelled' ? 'failed' : (st === 'pending' ? 'pending' : 'captured'),
    status: st,
    subtotal: 1299900,
    shippingFee: 0,
    tax: 233982,
    total: 1533882,
    razorpayOrderId: `order_qa_${1000 + idx}`,
    razorpayPaymentId: st === 'pending' ? null : `pay_qa_${1000 + idx}`,
    refundStatus: 'none',
    refundAmount: 0,
    qaMarker: 'QA-XYDV',
    createdAt: new Date(Date.now() - (idx * 3600000 * 24)),
    updatedAt: new Date(Date.now() - (idx * 3600000 * 24))
  }));

  // Add partial refund and full refund order
  const partialRefundOrder = {
    _id: new ObjectId(),
    user: buyerDoc._id,
    orderNumber: 'QA-ORD-REFUND-PARTIAL',
    items: baseOrderItems,
    shippingAddress: {
      name: buyerDoc.name,
      address: 'QA-XYDV 456 Partial Refund Lane',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      phone: '+919876543210'
    },
    paymentMethod: 'razorpay',
    paymentStatus: 'refunded',
    status: 'delivered',
    subtotal: 1299900,
    shippingFee: 0,
    tax: 233982,
    total: 1533882,
    razorpayOrderId: 'order_qa_partial_ref',
    razorpayPaymentId: 'pay_qa_partial_ref',
    refundStatus: 'partial',
    refundAmount: 500000, // ₹5,000 partial refund
    qaMarker: 'QA-XYDV',
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(Date.now() - 86400000 * 3)
  };

  const fullRefundOrder = {
    _id: new ObjectId(),
    user: buyerDoc._id,
    orderNumber: 'QA-ORD-REFUND-FULL',
    items: baseOrderItems,
    shippingAddress: {
      name: buyerDoc.name,
      address: 'QA-XYDV 789 Full Refund Boulevard',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      phone: '+919876543210'
    },
    paymentMethod: 'razorpay',
    paymentStatus: 'refunded',
    status: 'cancelled',
    subtotal: 1299900,
    shippingFee: 0,
    tax: 233982,
    total: 1533882,
    razorpayOrderId: 'order_qa_full_ref',
    razorpayPaymentId: 'pay_qa_full_ref',
    refundStatus: 'full',
    refundAmount: 1533882, // ₹15,338.82 full refund
    qaMarker: 'QA-XYDV',
    createdAt: new Date(Date.now() - 86400000 * 4),
    updatedAt: new Date(Date.now() - 86400000 * 4)
  };

  await ordersCol.insertMany([...sampleOrders, partialRefundOrder, fullRefundOrder]);
  console.log(`Seeded ${sampleOrders.length + 2} QA Status & Refund Orders`);

  // 8. High-volume scaling seed for query plans and admin tables (1,000 orders)
  console.log('Seeding 1,000 volume benchmark orders for query plans and admin table tests...');
  const bulkOrders = [];
  const statusPool = ['delivered', 'shipped', 'processing', 'confirmed', 'pending', 'cancelled'];
  for (let i = 0; i < 1000; i++) {
    const st = statusPool[i % statusPool.length];
    const isRefund = i % 25 === 0;
    bulkOrders.push({
      _id: new ObjectId(),
      user: buyerDoc._id,
      orderNumber: `QA-BULK-${2000 + i}`,
      items: [{
        product: products[i % products.length]._id,
        name: products[i % products.length].name,
        slug: products[i % products.length].slug,
        sku: `QA-SKU-${i}`,
        quantity: (i % 3) + 1,
        price: 299900 + ((i % 10) * 100000),
        image: '/products/lookbook-cover.jpg'
      }],
      shippingAddress: {
        name: `QA-XYDV Benchmark User ${i}`,
        address: `QA-XYDV Stress Test Street ${i}`,
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        phone: '+919876543210'
      },
      paymentMethod: 'razorpay',
      paymentStatus: st === 'cancelled' ? 'failed' : (st === 'pending' ? 'pending' : (isRefund ? 'refunded' : 'captured')),
      status: st,
      subtotal: 500000,
      shippingFee: 0,
      tax: 90000,
      total: 590000,
      razorpayOrderId: `order_bulk_${i}`,
      razorpayPaymentId: `pay_bulk_${i}`,
      refundStatus: isRefund ? 'full' : 'none',
      refundAmount: isRefund ? 590000 : 0,
      qaMarker: 'QA-XYDV',
      createdAt: new Date(Date.now() - (i * 1800000)), // spread over last ~20 days
      updatedAt: new Date(Date.now() - (i * 1800000))
    });
  }
  await ordersCol.insertMany(bulkOrders);
  console.log('Seeded 1,000 volume benchmark orders successfully');

  // Summary counts
  const totalOrders = await ordersCol.countDocuments();
  const totalProducts = await productsCol.countDocuments();
  console.log(`Database Ready for Audit: Total Orders = ${totalOrders}, Total Products = ${totalProducts}`);

  await client.close();
}

seed().catch(err => {
  console.error('Seed Error:', err);
  process.exit(1);
});
