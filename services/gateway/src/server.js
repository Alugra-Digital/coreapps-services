import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Input sanitization for PostgreSQL (removes $ and . from keys to prevent injection patterns)
function sanitizeInput(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeInput);
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith('$') || key.includes('.')) continue;
        sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
}

function inputSanitizer(req, res, next) {
    try {
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeInput(req.body);
        }
    } catch (_) {
        // ignore
    }
    next();
}
import swaggerSpec from './swagger.config.js';
import { createCircuitBreaker, getBreakerStats } from './middleware/circuitBreaker.js';
import { staticCacheHeaders } from './middleware/cacheHeaders.js';
import { createRateLimiter, createAuthRateLimiter } from './middleware/rateLimit.js';
import batchRoutes from './routes/batch.routes.js';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') }); // local dev overrides (copy from .env.local.example)

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// CORS configuration – origins from ALLOWED_ORIGINS env var (comma-separated)
const rawOrigins = process.env.ALLOWED_ORIGINS || '';
const allowedOrigins = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

// Dev fallback if env var not set
if (allowedOrigins.length === 0 && process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
}

// In development, allow any localhost origin (Swagger UI, Vite, etc.)
const isDev = process.env.NODE_ENV !== 'production';
const isLocalhost = (origin) => origin && /^https?:\/\/localhost(:\d+)?$/.test(origin);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Dev: allow any localhost (fixes Swagger "Failed to fetch" from various ports)
        if (isDev && isLocalhost(origin)) return callback(null, true);
        callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID', 'Accept'],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400 // 24h preflight cache
}));

// Request parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security: Input sanitization (PostgreSQL-safe; removes $ and . from keys)
app.use(inputSanitizer);
// Note: XSS sanitization is handled by each microservice's shared security middleware

// Logging
app.use(morgan('dev'));

// Static asset cache headers
app.use(staticCacheHeaders);

// Initialize rate limiters
let rateLimiter, authRateLimiter;
(async () => {
    try {
        rateLimiter = await createRateLimiter();
        authRateLimiter = await createAuthRateLimiter();
        console.log('✅ Rate limiters initialized');
    } catch (error) {
        console.warn('⚠️  Rate limiters initialization failed:', error.message);
    }
})();

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'gateway', timestamp: new Date() });
});

// Circuit breaker health check
app.get('/health/services', (req, res) => {
    const breakerStats = getBreakerStats();
    const allHealthy = Object.values(breakerStats).every(s => s.state === 'closed');

    res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: breakerStats
    });
});

// Swagger Documentation – inject current origin as default server to avoid CORS/URL scheme errors
app.get('/api-docs.json', (req, res) => {
    const protocol = req.protocol || (req.get('x-forwarded-proto')?.split(',')[0]?.trim()) || 'http';
    const host = req.get('host') || `localhost:${PORT}`;
    const baseUrl = `${protocol}://${host}`;
    const spec = {
        ...swaggerSpec,
        servers: [
            { url: baseUrl, description: 'Current Server (recommended)' },
            { url: 'http://localhost:3000', description: 'Localhost' },
            { url: 'https://api.alugra.co.id', description: 'Production' }
        ]
    };
    res.setHeader('Content-Type', 'application/json');
    res.send(spec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CoreApps ERP API Docs',
    swaggerOptions: {
        url: '/api-docs.json',
        persistAuthorization: true,
        tryItOutEnabled: true,
        displayRequestDuration: true
    }
}));

// Apply general rate limiting to all API routes
app.use('/api', (req, res, next) => {
    if (rateLimiter) {
        rateLimiter(req, res, next);
    } else {
        next();
    }
});

// Apply stricter rate limiting to auth endpoints
app.use('/api/auth/login', (req, res, next) => {
    if (authRateLimiter) {
        authRateLimiter(req, res, next);
    } else {
        next();
    }
});

app.use('/api/auth/register', (req, res, next) => {
    if (authRateLimiter) {
        authRateLimiter(req, res, next);
    } else {
        next();
    }
});

// Batch endpoint
app.use('/api', batchRoutes);

// Flat API proxies (doc-compliant paths) - MUST be registered before /api/hr, /api/finance
// These map /api/employees -> hr/employees, /api/invoices -> finance/invoices, etc.
const flatProxies = [
    { path: '/api/employees', url: process.env.HR_SERVICE_URL, rewrite: '/employees' },
    { path: '/api/positions', url: process.env.HR_SERVICE_URL, rewrite: '/positions' },
    { path: '/api/invoices', url: process.env.FINANCE_SERVICE_URL, rewrite: '/invoices' },
    { path: '/api/purchase-orders', url: process.env.FINANCE_SERVICE_URL, rewrite: '/purchase-orders' },
    { path: '/api/quotations', url: process.env.FINANCE_SERVICE_URL, rewrite: '/quotations' },
    { path: '/api/clients', url: process.env.FINANCE_SERVICE_URL, rewrite: '/clients' },
    { path: '/api/vendors', url: process.env.FINANCE_SERVICE_URL, rewrite: '/vendors' },
    { path: '/api/basts', url: process.env.FINANCE_SERVICE_URL, rewrite: '/basts' },
    { path: '/api/projects', url: process.env.FINANCE_SERVICE_URL, rewrite: '/projects' },
    { path: '/api/tax-types', url: process.env.FINANCE_SERVICE_URL, rewrite: '/tax-types' },
    { path: '/api/proposal-penawaran', url: process.env.FINANCE_SERVICE_URL, rewrite: '/proposal-penawaran' },
    { path: '/api/inventory', url: process.env.INVENTORY_SERVICE_URL, rewrite: '/inventory' },
    { path: '/api/dashboard', url: process.env.ANALYTICS_SERVICE_URL, rewrite: '/dashboard' },
    { path: '/api/auth', url: process.env.AUTH_SERVICE_URL, rewrite: '' },
    { path: '/api/roles', url: process.env.AUTH_SERVICE_URL, rewrite: '/roles' },
    { path: '/api/users', url: process.env.AUTH_SERVICE_URL, rewrite: '/users' },
];

flatProxies.forEach(({ path, url, rewrite }) => {
    if (!url) {
        console.warn(`⚠️  Warning: ${path} proxy - service URL not defined, skipping`);
        return;
    }
    app.use(path, createProxyMiddleware({
        target: url,
        changeOrigin: true,
        timeout: 15000,
        // Fix: Express strips the mounting path (e.g. '/api/roles') before passing to the proxy.
        // So req.url becomes '/' or '/123'. We need to prepend the rewrite path if it's not empty.
        pathRewrite: rewrite !== ''
            ? (reqPath) => rewrite + (reqPath === '/' ? '' : reqPath)
            : undefined,
        on: { proxyReq: fixRequestBody },
    }));
    console.log(`✅ Flat proxy: ${path} -> ${url}${rewrite}`);
});

// Proxy routes with circuit breakers (auth uses flat proxy above)
const proxies = {
    '/api/crm': { url: process.env.CRM_SERVICE_URL, name: 'crm-service' },
    '/api/finance': { url: process.env.FINANCE_SERVICE_URL, name: 'finance-service' },
    '/api/hr': { url: process.env.HR_SERVICE_URL, name: 'hr-service' },
    '/api/inventory': { url: process.env.INVENTORY_SERVICE_URL, name: 'inventory-service' },
    '/api/accounting': { url: process.env.ACCOUNTING_SERVICE_URL, name: 'accounting-service' },
    '/api/notification': { url: process.env.NOTIFICATION_SERVICE_URL, name: 'notification-service' },
    '/api/manufacturing': { url: process.env.MANUFACTURING_SERVICE_URL, name: 'manufacturing-service' },
    '/api/assets': { url: process.env.ASSET_SERVICE_URL, name: 'asset-service' },
    '/api/analytics': { url: process.env.ANALYTICS_SERVICE_URL, name: 'analytics-service' },
};

// Create proxies with circuit breakers
Object.entries(proxies).forEach(([path, config]) => {
    if (!config.url) {
        console.warn(`⚠️  Warning: ${path} service URL is not defined, skipping proxy`);
        return;
    }

    const breaker = createCircuitBreaker(config.name, async (proxyReq) => {
        return new Promise((resolve, reject) => {
            const proxy = createProxyMiddleware({
                target: config.url,
                changeOrigin: true,
                timeout: 15000,
                pathRewrite: {
                    [`^${path}`]: '',
                },
                on: {
                    proxyReq: fixRequestBody,
                    proxyRes: (proxyRes, req, res) => {
                        resolve({ status: proxyRes.statusCode });
                    },
                    error: (err, req, res) => {
                        console.error(`Proxy error [${config.name}]:`, err.message, 'target:', config.url);
                        reject(err);
                    }
                }
            });

            proxy(proxyReq.req, proxyReq.res, (err) => {
                if (err) reject(err);
            });
        });
    });

    app.use(path, async (req, res, next) => {
        try {
            const result = await breaker.fire({ req, res });
            if (result?.body) {
                return res.status(result.status || 503).json(result.body);
            }
        } catch (error) {
            if (error?.body) {
                return res.status(error.status || 503).json(error.body);
            }
            const proxy = createProxyMiddleware({
                target: config.url,
                changeOrigin: true,
                timeout: 15000,
                pathRewrite: { [`^${path}`]: '' },
                on: { proxyReq: fixRequestBody },
            });
            proxy(req, res, next);
        }
    });

    console.log(`✅ Proxy configured: ${path} -> ${config.url} (with circuit breaker)`);
});

// Error handling
app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            message: 'Origin not allowed',
            code: 'CORS_ERROR'
        });
    }

    console.error('Gateway error:', err);
    res.status(500).json({
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        code: 'ERROR'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});
