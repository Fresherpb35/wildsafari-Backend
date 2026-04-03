// ─── DATABASE CONFIG ──────────────────────────────────────────────────────────
const { PrismaClient }    = require('@prisma/client');
const { createClient }    = require('@supabase/supabase-js');
const logger              = require('./logger');

// ── Prisma (for all DB reads/writes) ──────────────────────────────────────────
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event'  },
    { level: 'error', emit: 'stdout' },
    { level: 'warn',  emit: 'stdout' },
  ],
});

// Log slow queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    if (e.duration > 200) {
      logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
    }
  });
}

// ── Supabase (for auth, storage, realtime if needed) ──────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: { persistSession: false },
  }
);

// Admin client — bypasses Row Level Security (use only server-side)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);

module.exports = { prisma, supabase, supabaseAdmin };
