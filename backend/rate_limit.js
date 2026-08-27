const rateLimit = require('express-rate-limit');

const login_limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per window per IP
  message: { message: 'Too many login attempts. Please try again in 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only counts failed attempts against the limit
});

const register_limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { message: 'Too many accounts created from this device. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const two_fa_limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { message: 'Too many 2FA attempts. Please try again in 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const read_limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 GET requests per minute
  message: { message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
});

const write_limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 create/update/delete requests per minute
  message: { message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
});

module.exports = { login_limiter, register_limiter, two_fa_limiter, read_limiter, write_limiter };