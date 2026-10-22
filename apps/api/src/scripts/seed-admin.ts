import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/database';
import { User } from '../models/User.model';
import { Category } from '../models/Category.model';

async function seedAdmin() {
  console.log('Connecting to database...');
  await connectDB();

  if (mongoose.connection.readyState === 0) {
    throw new Error(
      'Could not establish connection to MongoDB. Please check that MONGODB_URI is correctly configured and reachable in your environment (.env).',
    );
  }

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@vertex.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
  const adminName = process.env.ADMIN_NAME || 'XYDV System Administrator';

  console.log(`Checking admin user: ${adminEmail}...`);

  let user = await User.findOne({ email: adminEmail }).select('+password');

  if (user) {
    console.log(`Found existing user with email ${adminEmail}. Updating to admin role...`);
    user.name = adminName;
    user.role = 'admin';
    user.isBlocked = false;
    user.password = adminPassword;
    await user.save();
    console.log(`Successfully updated admin user: ${adminEmail}`);
  } else {
    console.log(`Creating new admin user: ${adminEmail}...`);
    user = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isBlocked: false,
    });
    console.log(`Successfully created admin user: ${adminEmail}`);
  }

  // Also seed default categories if not already present
  const defaultCategories = [
    { name: 'Tops', slug: 'tops', description: 'Technical tees, tanks, and compression long sleeves.' },
    { name: 'Bottoms', slug: 'bottoms', description: 'Cargo joggers, training shorts, and lined utility tights.' },
    { name: 'Outerwear', slug: 'outerwear', description: 'Waterproof shells, modular vests, and storm windbreakers.' },
    { name: 'Accessories', slug: 'accessories', description: 'Technical caps, ballistic bags, and training socks.' },
  ];

  for (const cat of defaultCategories) {
    const existing = await Category.findOne({ slug: cat.slug });
    if (!existing) {
      await Category.create(cat);
      console.log(`Seeded category: ${cat.name} (${cat.slug})`);
    }
  }

  console.log('\n======================================================');
  console.log(' XYDV ADMIN CREDENTIALS INITIALIZED SUCCESSFULLY');
  console.log('======================================================');
  console.log(` Email:    ${adminEmail}`);
  console.log(' Password: ********');
  console.log(` Role:     admin`);
  console.log('======================================================\n');

  await disconnectDB();
  process.exit(0);
}

seedAdmin().catch(async (err) => {
  console.error('Failed to seed admin user:', err);
  await disconnectDB();
  process.exit(1);
});
