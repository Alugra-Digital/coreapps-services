# Security Policy – CoreApps ERP

This document describes the security architecture and controls applied across all CoreApps ERP microservices.

---

## Architecture Overview

```
Internet
   │
   ▼
[API Gateway :3000]  ← Single public entry point
   │  • Helmet headers      • CORS whitelist
   │  • Rate limiting       • XSS sanitization
   │  • Input sanitization  • Circuit breaker
   │
   ├──► [auth-service :3001]
   ├──► [crm-service :3002]
   ├──► [finance-service :3003]
   ├──► [hr-service :3004]
   ├──► [inventory-service :3005]
   ├──► [accounting-service :3006]
   ├──► [analytics-service :3010]
   ├──► [notification-service :3011]
   ├──► [manufacturing-service :3012]
   └──► [asset-service :3013]
         Each service applies the same shared security middleware
```

All microservices are **not publicly exposed** — they are only reachable through the API Gateway on the internal Docker network (`coreapps-internal`).

---

## Security Layers

### 1. HTTP Security Headers (Helmet)

Applied via `helmet` in every service and the gateway.

| Header | Value | Protection |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'` | XSS, data injection |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | HTTPS enforcement (HSTS) |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Information leakage |
| `X-Permitted-Cross-Domain-Policies` | `none` | Flash/PDF cross-domain |
| `X-Powered-By` | *(removed)* | Technology fingerprinting |

---

### 2. CORS (Cross-Origin Resource Sharing)

**Configuration file:** `services/shared/middleware/security.middleware.js`

Origins are controlled via the `ALLOWED_ORIGINS` environment variable.

```env
# .env
ALLOWED_ORIGINS=https://erp.alugra.dev,https://app.alugra.dev
```

| Setting | Value |
|---|---|
| Allowed Origins | `ALLOWED_ORIGINS` env var (comma-separated) |
| Dev fallback | `http://localhost:5173`, `http://localhost:3000` |
| Credentials | `true` |
| Allowed Methods | `GET, POST, PUT, PATCH, DELETE, OPTIONS` |
| Allowed Headers | `Content-Type, Authorization, X-Requested-With, X-Request-ID` |
| Preflight cache | 24 hours |

> [!IMPORTANT]
> In production, set `ALLOWED_ORIGINS` to your exact frontend domain(s). Never use `*` in production.

**How to add a new allowed origin:**
```env
ALLOWED_ORIGINS=https://erp.alugra.dev,https://new-frontend.alugra.dev
```
No code changes required — restart the services after updating `.env`.

---

### 3. XSS (Cross-Site Scripting) Prevention

**Location:** `security.middleware.js` → `xssSanitizer`

Applied to all incoming request bodies **before** they reach any controller.

Strips:
- `<script>...</script>` tags
- Inline event handlers (`onclick=`, `onload=`, etc.)
- `javascript:` and `vbscript:` URI schemes
- `data:text/html` URIs

**Example:**
```json
// Input
{ "name": "<script>alert(1)</script>John" }

// After sanitization
{ "name": "John" }
```

---

### 4. Input Sanitization (Injection Prevention)

**Location:** `security.middleware.js` → `inputSanitizer`

Removes keys from request bodies and query strings that match injection patterns:

| Pattern | Threat |
|---|---|
| Keys starting with `$` | MongoDB/NoSQL operator injection |
| Keys containing `.` | Path traversal / dot-notation injection |

**Example:**
```json
// Input
{ "$where": "1==1", "user.admin": true, "name": "John" }

// After sanitization
{ "name": "John" }
```

---

### 5. Rate Limiting

Applied at the **API Gateway** level only (services are internal).

| Endpoint | Limit |
|---|---|
| All `/api/*` routes | General rate limit (configurable via Redis) |
| `/api/auth/login` | Strict auth rate limit (brute-force protection) |
| `/api/auth/register` | Strict auth rate limit |

Rate limiter uses Redis for distributed state across multiple gateway instances.

---

### 6. Request Size Limit

All services reject request bodies larger than **1 MB** (`express.json({ limit: '1mb' })`).

The gateway allows up to **10 MB** to support file uploads proxied to services.

---

### 7. HTTP Parameter Pollution (HPP) Prevention

**Location:** `security.middleware.js` → `hpp`

When duplicate query parameters are sent (e.g., `?status=active&status=admin`), only the **last value** is kept. This prevents attackers from bypassing filters by sending multiple values.

---

### 8. Authentication & Authorization

| Mechanism | Implementation |
|---|---|
| Authentication | JWT Bearer tokens (`Authorization: Bearer <token>`) |
| Token verification | `shared/middleware/auth.middleware.js` |
| Authorization | Role-Based Access Control (RBAC) via `shared/middleware/rbac.middleware.js` |
| Roles | `SUPER_ADMIN`, `HR_ADMIN`, `FINANCE_ADMIN` |

All protected routes require a valid JWT. Tokens are verified on every request — no session state is stored server-side.

---

### 9. Circuit Breaker

The API Gateway uses a circuit breaker pattern for all downstream service calls. If a service becomes unavailable:
- After threshold failures → circuit opens → requests fail fast with `503`
- After recovery timeout → circuit closes → normal operation resumes

This prevents cascading failures across microservices.

---

## Environment Variable Reference

| Variable | Description | Example |
|---|---|---|
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `https://erp.alugra.dev` |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | `supersecretlongrandomstring32+` |
| `REDIS_PASSWORD` | Redis authentication password | `redisalgr123!@#` |
| `INTERNAL_SERVICE_SECRET` | Secret for internal service-to-service calls | `internal-secret-xyz` |

---

## OWASP Top 10 Coverage

| # | Risk | Status | Control |
|---|---|---|---|
| A01 | Broken Access Control | ✅ | RBAC on all routes, JWT auth |
| A02 | Cryptographic Failures | ✅ | JWT with strong secret, HTTPS via HSTS |
| A03 | Injection | ✅ | Input sanitization (key filtering), Zod validation, parameterized queries |
| A04 | Insecure Design | ✅ | Microservice isolation, internal-only service ports |
| A05 | Security Misconfiguration | ✅ | Helmet headers, CORS whitelist, no `X-Powered-By` |
| A06 | Vulnerable Components | ⚠️ | Run `npm audit` regularly |
| A07 | Auth Failures | ✅ | Rate limiting on auth endpoints, JWT expiry |
| A08 | Software & Data Integrity | ✅ | Input validation via Zod on all endpoints |
| A09 | Logging & Monitoring | ✅ | Morgan `combined` format, audit logs in DB |
| A10 | SSRF | ✅ | No user-controlled URLs in server-side requests |

---

## Shared Security Middleware

**File:** `services/shared/middleware/security.middleware.js`

**Usage in any service:**

```js
import { applySecurityMiddleware } from '../../../shared/middleware/security.middleware.js';

const app = express();
applySecurityMiddleware(app); // applies all layers in correct order
app.use(morgan('combined'));
```

**Middleware execution order:**
1. `helmet()` – security headers
2. `cors()` – origin whitelist + pre-flight
3. `express.json({ limit: '1mb' })` – body parsing with size limit
4. `express.urlencoded()` – form data parsing with size limit
5. `xssSanitizer` – strip dangerous HTML from body
6. `inputSanitizer` – remove injection-pattern keys
7. `hpp` – deduplicate query params
8. `corsErrorHandler` – return 403 for CORS violations

---

## Incident Response

### If a security vulnerability is detected:

1. **Isolate** the affected service: `docker compose stop <service-name>`
2. **Log** the incident in `/docs/bug_tracking.md` with timestamp, affected service, and nature of the vulnerability
3. **Patch** the vulnerability and update tests
4. **Redeploy**: `docker compose up -d --build <service-name>`
5. **Audit** logs for signs of exploitation

### Security contact

Report vulnerabilities to the project maintainer. Do not open public GitHub issues for security vulnerabilities.
