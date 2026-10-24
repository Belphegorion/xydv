import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5000/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xydv';

async function runJourneys() {
  console.log('Starting End-to-End User Journeys & Propagation Verification...');

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('xydv');

  const results = {
    testedAt: new Date().toISOString(),
    buyerJourney: {},
    adminJourney: {},
    propagationProof: {},
    dataFlowStages: []
  };

  // 1. Obtain Customer and Admin tokens
  console.log('Authenticating test users...');
  const custRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'qa-buyer-longname@xydv.test', password: 'AdminPassword123!' })
  });
  const custData = await custRes.json();
  const buyerToken = custData.token;
  const buyerId = custData.user?._id || custData.user?.id;

  const admRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'qa-admin@xydv.test', password: 'AdminPassword123!' })
  });
  const admData = await admRes.json();
  const adminToken = admData.token;

  // 2. Buyer Journey: Catalog -> PDP -> Cart -> Coupon -> Order -> Payment
  console.log('\n--- EXECUTING BUYER JOURNEY ---');
  // Step A: Catalog fetch
  const catRes = await fetch(`${API_URL}/products?category=qa-xydv-tactical-activewear`);
  const catData = await catRes.json();
  const targetProduct = catData.data?.[0] || catData.products?.[0] || catData[0];
  console.log(`Step 1: Browsed Catalog. Selected Product: "${targetProduct.name}" (ID: ${targetProduct._id})`);

  // Record stock before
  const prodBefore = await db.collection('products').findOne({ _id: new ObjectId(targetProduct._id) });
  const variantTarget = prodBefore.variants[0];
  const stockBefore = variantTarget.stock;
  console.log(`Initial stock for variant ${variantTarget.size}/${variantTarget.color} (SKU ${variantTarget.sku}): ${stockBefore}`);

  // Step B: Validate Coupon QA20
  const couponValidateRes = await fetch(`${API_URL}/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: 'QA20',
      items: [{
        productId: targetProduct._id.toString(),
        sku: variantTarget.sku,
        quantity: 1,
        price: targetProduct.price || 1299900
      }],
      guestEmail: 'qa-buyer-longname@xydv.test'
    })
  });
  const couponValidation = await couponValidateRes.json();
  console.log(`Step 2: Validated Coupon QA20: Success=${couponValidation.success}, Discount=${couponValidation.data?.discountAmountPaise || couponValidation.discountAmountPaise} paise`);

  // Step C: Create Order via Razorpay Order creation endpoint
  const createOrderPayload = {
    items: [{
      productId: targetProduct._id.toString(),
      variantId: variantTarget._id.toString(),
      quantity: 1,
      price: targetProduct.price,
      name: targetProduct.name,
      size: variantTarget.size,
      color: variantTarget.color,
      sku: variantTarget.sku,
      slug: targetProduct.slug
    }],
    shippingAddress: {
      name: 'QA-XYDV Jonathan Montgomery-Vanderbilt III',
      address: 'QA-XYDV 100 Performance Plaza',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      phone: '+919876543210'
    },
    couponCode: 'QA20'
  };

  const createOrderRes = await fetch(`${API_URL}/orders/razorpay/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${buyerToken}`
    },
    body: JSON.stringify(createOrderPayload)
  });
  const orderCreatedJson = await createOrderRes.json();
  const orderId = orderCreatedJson.data?.orderId || orderCreatedJson.order?._id || orderCreatedJson.orderId;
  const razorpayOrderId = orderCreatedJson.data?.razorpayOrderId || orderCreatedJson.razorpayOrderId;
  console.log(`Step 3: Created Order on server: Status=${createOrderRes.status}, OrderId=${orderId}, RzpOrderId=${razorpayOrderId}`);
  const mockPaymentId = `pay_simulated_${Date.now()}`;

  // Update order to confirmed with payment captured
  const verifyRes = await fetch(`${API_URL}/orders/razorpay/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${buyerToken}`
    },
    body: JSON.stringify({
      orderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: 'dev_simulated_sig'
    })
  }).catch(() => null);

  // Directly verify database state
  const orderInDb = await db.collection('orders').findOne({
    $or: [{ _id: new ObjectId(orderId) }, { razorpayOrderId }]
  });
  const prodAfter = await db.collection('products').findOne({ _id: new ObjectId(targetProduct._id) });
  const stockAfter = prodAfter.variants.find(v => v.sku === variantTarget.sku).stock;

  results.buyerJourney = {
    productId: targetProduct._id,
    productName: targetProduct.name,
    orderId,
    razorpayOrderId,
    couponApplied: 'QA20',
    stockBefore,
    stockAfter,
    stockDecrementedCorrectly: stockAfter === stockBefore - 1,
    orderRecordedInDb: !!orderInDb,
    orderStatusInDb: orderInDb?.status,
    totalPaise: orderInDb?.total
  };

  console.log(`Step 4: Database Snapshot Verification:`);
  console.log(`- Order Status: ${orderInDb?.status}`);
  console.log(`- Stock: ${stockBefore} -> ${stockAfter} (Decremented: ${results.buyerJourney.stockDecrementedCorrectly})`);

  // 3. Admin Journey: Status Transition & Partial Refund
  console.log('\n--- EXECUTING ADMIN FULFILLMENT & REFUND JOURNEY ---');
  if (orderInDb) {
    // Transition to Confirmed
    await fetch(`${API_URL}/admin/orders/${orderInDb._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'confirmed' })
    });
    console.log(`Admin Step 1: Updated Status to Confirmed`);

    // Transition to Processing
    const updStatusRes = await fetch(`${API_URL}/admin/orders/${orderInDb._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'processing' })
    });
    console.log(`Admin Step 2: Updated Status to Processing -> HTTP ${updStatusRes.status}`);

    // Transition to Shipped
    await fetch(`${API_URL}/admin/orders/${orderInDb._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'shipped', trackingNumber: 'XYDV-TRK-998877' })
    });
    console.log(`Admin Step 3: Updated Status to Shipped`);

    // Transition to Delivered
    await fetch(`${API_URL}/admin/orders/${orderInDb._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'delivered' })
    });
    console.log(`Admin Step 4: Updated Status to Delivered`);

    // Update payment status to captured in DB to simulate Razorpay capture before refund
    await db.collection('orders').updateOne(
      { _id: orderInDb._id },
      { $set: { paymentStatus: 'captured', razorpayPaymentId: 'pay_test_capture_refund' } }
    );

    // Partial Refund of ₹1,000 (100,000 paise)
    const refundRes = await fetch(`${API_URL}/admin/orders/${orderInDb._id}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        amount: 100000,
        reason: 'QA Partial gesture refund'
      })
    });
    console.log(`Admin Step 5: Dispatched Partial Refund -> HTTP ${refundRes.status}`);

    const finalOrderDb = await db.collection('orders').findOne({ _id: orderInDb._id });
    results.adminJourney = {
      orderId: orderInDb._id,
      finalStatus: finalOrderDb?.status,
      refundStatus: finalOrderDb?.refundStatus,
      refundAmountPaise: finalOrderDb?.refundAmount
    };
    console.log(`Final Order Snapshot in DB: status="${finalOrderDb?.status}", refundStatus="${finalOrderDb?.refundStatus}", refundAmount=${finalOrderDb?.refundAmount}`);
  }

  // 4. Cross-System Propagation Proof with Marker QA-XYDV-FLOW-001
  console.log('\n--- EXECUTING CROSS-SYSTEM PROPAGATION TEST (QA-XYDV-FLOW-001) ---');
  const markerId = new ObjectId();
  const markerName = 'QA-XYDV-FLOW-001 High-Velocity Shell';
  const markerPrice = 777700; // ₹7,777
  const markerStock = 13;

  const t0 = performance.now();
  // Admin creates product via API
  const createProdRes = await fetch(`${API_URL}/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: markerName,
      slug: 'qa-xydv-flow-001-shell',
      description: 'Propagation verification marker product.',
      price: markerPrice,
      compareAt: markerPrice + 200000,
      category: 'qa-xydv-tactical-activewear',
      images: [{ url: '/products/lookbook-cover.jpg' }],
      variants: [{
        size: 'L',
        color: 'Volt',
        price: markerPrice,
        stock: markerStock,
        sku: 'QA-FLOW-001-L'
      }],
      isPublished: true,
      discipline: 'All-Terrain',
      gender: 'Unisex',
      features: ['Waterproof', 'Thermal Grid']
    })
  });
  const tCreate = performance.now() - t0;
  console.log(`Admin created product QA-XYDV-FLOW-001 in ${Math.round(tCreate)}ms -> HTTP ${createProdRes.status}`);

  // Query storefront catalog immediately
  const t1 = performance.now();
  const storeCatRes = await fetch(`${API_URL}/products?search=FLOW-001`);
  const tQuery = performance.now() - t1;
  const storeCatJson = await storeCatRes.json();
  const foundInCatalog = (storeCatJson.data || storeCatJson.products || storeCatJson).find(p => p.name.includes('QA-XYDV-FLOW-001'));

  console.log(`Storefront Catalog Search latency: ${Math.round(tQuery)}ms, Found = ${!!foundInCatalog}`);

  results.propagationProof = {
    marker: 'QA-XYDV-FLOW-001',
    createLatencyMs: Math.round(tCreate),
    propagationQueryLatencyMs: Math.round(tQuery),
    propagatedImmediately: !!foundInCatalog,
    matchedPrice: foundInCatalog?.price === markerPrice,
    matchedStock: foundInCatalog?.variants?.[0]?.stock === markerStock
  };

  // Clean up marker product
  if (foundInCatalog) {
    await db.collection('products').deleteOne({ _id: new ObjectId(foundInCatalog._id) });
    console.log('Cleaned up marker product QA-XYDV-FLOW-001');
  }

  await client.close();

  const outPath = 'scratch/audit-results/journeys-and-dataflow.json';
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nJourneys & Data Flow Verification Completed! Written to ${outPath}`);
}

runJourneys().catch(err => {
  console.error('Journeys Failed:', err);
  process.exit(1);
});
