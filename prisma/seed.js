// ─── PRISMA SEED ──────────────────────────────────────────────────────────────
// Run: node prisma/seed.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin
  const passwordHash = await bcrypt.hash('Admin@Safari2025', 12);

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@wildlifesafariindia.com' },
    update: {},
    create: {
      email:        'admin@wildlifesafariindia.com',
      passwordHash,
      name:         'Safari Admin',
    },
  });

  console.log('✅ Admin created:', admin.email);
  console.log('🔑 Default password: Admin@Safari2025  ← CHANGE THIS IMMEDIATELY');
  console.log('✅ Seed complete.');
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
