import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xydv';

export async function cleanup() {
  console.log('Connecting to database for cleanup:', MONGODB_URI);
  if (!MONGODB_URI.includes('localhost') && !MONGODB_URI.includes('127.0.0.1')) {
    throw new Error('SAFETY HALT: Attempted to cleanup non-local database: ' + MONGODB_URI);
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('xydv');

  const qaPattern = /QA-XYDV|qa-xydv|QA50|QA20|QA10|QA-ORD|QA-BULK|qa-admin|qa-buyer|qa-blocked/i;

  const usersRes = await db.collection('users').deleteMany({
    $or: [{ qaMarker: 'QA-XYDV' }, { email: qaPattern }, { name: qaPattern }]
  });
  console.log(`Cleaned up ${usersRes.deletedCount} QA Users`);

  const catRes = await db.collection('categories').deleteMany({
    $or: [{ qaMarker: 'QA-XYDV' }, { slug: qaPattern }, { name: qaPattern }]
  });
  console.log(`Cleaned up ${catRes.deletedCount} QA Categories`);

  const prodRes = await db.collection('products').deleteMany({
    $or: [{ qaMarker: 'QA-XYDV' }, { slug: qaPattern }, { name: qaPattern }]
  });
  console.log(`Cleaned up ${prodRes.deletedCount} QA Products`);

  const coupRes = await db.collection('coupons').deleteMany({
    $or: [{ qaMarker: 'QA-XYDV' }, { code: qaPattern }]
  });
  console.log(`Cleaned up ${coupRes.deletedCount} QA Coupons`);

  const discRes = await db.collection('discounts').deleteMany({
    $or: [{ qaMarker: 'QA-XYDV' }, { title: qaPattern }]
  });
  console.log(`Cleaned up ${discRes.deletedCount} QA Discounts`);

  const notifRes = await db.collection('notifications').deleteMany({
    $or: [{ qaMarker: 'QA-XYDV' }, { title: qaPattern }]
  });
  console.log(`Cleaned up ${notifRes.deletedCount} QA Notifications`);

  const orderRes = await db.collection('orders').deleteMany({
    $or: [{ qaMarker: 'QA-XYDV' }, { orderNumber: qaPattern }, { 'shippingAddress.address': qaPattern }]
  });
  console.log(`Cleaned up ${orderRes.deletedCount} QA Orders`);

  await client.close();
  console.log('Cleanup completed successfully.');
}

if (process.argv[1] && process.argv[1].endsWith('07-cleanup-qa-data.mjs')) {
  cleanup().catch(err => {
    console.error('Cleanup Error:', err);
    process.exit(1);
  });
}
