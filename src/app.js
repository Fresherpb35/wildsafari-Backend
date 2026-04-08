// ─── EXPRESS APP ─────────────────────────────────────────────────────────────
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const compression  = require('compression');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');

const logger       = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const bookingRoutes    = require('./routes/bookingRoutes');
const contactRoutes    = require('./routes/contactRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const adminRoutes      = require('./routes/adminRoutes');
const blogRoutes = require('./routes/blogRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const app = express();

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────────────────────
app.use(helmet());



app.use(cors({
  origin: function (origin, callback) {
    // ✅ allow server-to-server / Postman / curl
    if (!origin) return callback(null, true);

    // ✅ allow localhost (dev)
    if (origin.includes("localhost")) {
      return callback(null, true);
    }

    // ✅ allow ALL Vercel deployments (auto)
    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    // ❌ block everything else
    return callback(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly (good practice)
app.options('*', cors());

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

app.use(globalLimiter);

// ─── BODY PARSING & COMPRESSION ──────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(compression());

// ─── REQUEST LOGGING ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));
}

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/bookings', bookingRoutes);
app.use('/api/contacts', contactRoutes);   // Note: strictLimiter is missing in your code
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/hotels', hotelRoutes);
// ─── 404 HANDLER ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;