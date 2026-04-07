// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("❌ No Bearer token found");
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorised — no token' 
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      console.log("❌ Token is empty");
      return res.status(401).json({ success: false, message: 'Invalid token format' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log(`✅ Token verified successfully → ${decoded.email || decoded.sub} (${decoded.role || 'Unknown'})`);

    req.admin = decoded;        // ya req.user = decoded;  (dono chalega)
    next();
  } catch (err) {
    console.error("JWT Verify Failed:", err.name, "-", err.message);
    logger.warn('Auth failed:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired' });
    }
    return res.status(401).json({ success: false, message: 'Not authorised — invalid token' });
  }
}

module.exports = { protect };