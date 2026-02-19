/**
 * Shared Security Middleware – CoreApps ERP
 *
 * Applies a full security stack to any Express app:
 *   1. Helmet   – HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
 *   2. CORS     – Origin whitelist driven by ALLOWED_ORIGINS env var
 *   3. XSS      – Strip <script> tags and dangerous HTML from request bodies
 *   4. Input sanitization – Remove keys starting with $ or containing . (injection prevention)
 *   5. Payload size limit – Reject bodies > 1 MB
 *   6. HPP (manual) – Keep only the last value for duplicate query params
 *
 * Usage (in any service server.js):
 *   import { applySecurityMiddleware } from '../../../shared/middleware/security.middleware.js';
 *   applySecurityMiddleware(app);
 */

import helmet from 'helmet';
import cors from 'cors';
import express from 'express';

// ---------------------------------------------------------------------------
// 1. Helmet – strict HTTP security headers
// ---------------------------------------------------------------------------
const helmetConfig = helmet({
  // Content-Security-Policy: only allow same-origin resources by default
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // allow inline styles for API docs
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  // HTTP Strict Transport Security: 1 year, include subdomains
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  // Prevent MIME-type sniffing
  noSniff: true,
  // Disable X-Powered-By header
  hidePoweredBy: true,
  // XSS filter for older browsers
  xssFilter: true,
  // Referrer policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // Permissions policy (disable sensitive browser features)
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
});

// ---------------------------------------------------------------------------
// 2. CORS – whitelist from ALLOWED_ORIGINS env var
// ---------------------------------------------------------------------------
function buildCorsOptions() {
  const raw = process.env.ALLOWED_ORIGINS || '';
  const isDev = process.env.NODE_ENV !== 'production';

  // Parse comma-separated origins; fall back to localhost in dev
  const whitelist = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (isDev && whitelist.length === 0) {
    whitelist.push('http://localhost:5173', 'http://localhost:3000');
  }

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (whitelist.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400, // 24 h preflight cache
  };
}

// ---------------------------------------------------------------------------
// 3. XSS sanitization – strip dangerous HTML from body values
// ---------------------------------------------------------------------------
const XSS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<[^>]+on\w+\s*=\s*["'][^"']*["'][^>]*>/gi, // inline event handlers
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
];

function sanitizeXss(value) {
  if (typeof value === 'string') {
    let sanitized = value;
    for (const pattern of XSS_PATTERNS) {
      sanitized = sanitized.replace(pattern, '');
    }
    return sanitized;
  }
  if (Array.isArray(value)) return value.map(sanitizeXss);
  if (value !== null && typeof value === 'object') return sanitizeObjectXss(value);
  return value;
}

function sanitizeObjectXss(obj) {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    result[key] = sanitizeXss(val);
  }
  return result;
}

function xssSanitizer(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObjectXss(req.body);
  }
  next();
}

// ---------------------------------------------------------------------------
// 4. Input sanitization – prevent NoSQL / SQL injection via key names
// ---------------------------------------------------------------------------
function sanitizeKeys(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeKeys);
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    // Drop keys that start with $ (MongoDB operators) or contain . (path traversal)
    if (key.startsWith('$') || key.includes('.')) continue;
    clean[key] = sanitizeKeys(value);
  }
  return clean;
}

function inputSanitizer(req, _res, next) {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeKeys(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeKeys(req.query);
    }
  } catch (_) {
    // Never block the request due to sanitization errors
  }
  next();
}

// ---------------------------------------------------------------------------
// 5. HTTP Parameter Pollution (HPP) – keep last value for duplicate params
// ---------------------------------------------------------------------------
function hpp(req, _res, next) {
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      if (Array.isArray(req.query[key])) {
        // Keep only the last value to prevent pollution
        req.query[key] = req.query[key][req.query[key].length - 1];
      }
    }
  }
  next();
}

// ---------------------------------------------------------------------------
// 6. CORS error handler
// ---------------------------------------------------------------------------
function corsErrorHandler(err, req, res, next) {
  if (err && err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({
      message: 'CORS policy violation: origin not allowed',
      code: 'CORS_FORBIDDEN',
    });
  }
  next(err);
}

// ---------------------------------------------------------------------------
// Main export – call this once in each service's server.js
// ---------------------------------------------------------------------------
export function applySecurityMiddleware(app) {
  // Security headers
  app.use(helmetConfig);

  // CORS with whitelist
  app.use(cors(buildCorsOptions()));

  // Body parsing with size limit (1 MB)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // XSS sanitization (runs after body parsing)
  app.use(xssSanitizer);

  // Key-based injection sanitization
  app.use(inputSanitizer);

  // HTTP Parameter Pollution prevention
  app.use(hpp);

  // CORS error handler
  app.use(corsErrorHandler);
}
