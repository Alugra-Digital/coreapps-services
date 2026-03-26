# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a microservices ERP system for PT Alugra Indonesia with the following components:

**API Gateway (port 3000)**: Single entry point using Express + http-proxy-middleware. Handles CORS, rate limiting (Redis-backed), circuit breakers (Opossum), and Swagger documentation (`/api-docs`). Proxies requests to backend microservices.

**Microservices**: Each service is an independent Express app:
- `auth-service` (3001) - JWT auth, user/role/permission management
- `crm-service` (3002) - Leads, customers, opportunities
- `finance-service` (3003) - Invoices, quotations, payments, vouchers, journals
- `hr-service` (3004) - Employees, payroll, leave, attendance, loans
- `inventory-service` (3005) - Products, stock, warehouses
- `accounting-service` (3006) - Chart of accounts, journal entries
- `analytics-service` (3010) - Dashboard metrics
- `notification-service` (3011) - Email/SMS/WhatsApp notifications
- `manufacturing-service` (3012) - BOM, work orders, quality control
- `asset-service` (3013) - Asset registry, depreciation, maintenance
- `integration-service` - Third-party integrations (email/payment); not proxied through the gateway by default

**Shared Code** (`services/shared/`):
- `db/` - Drizzle ORM schema and connection pool
- `middleware/` - auth, RBAC, security, caching
- `utils/` - JWT, validation (Zod), pagination, error handling
- `drizzle/` - SQL migration files

**Infrastructure**:
- PostgreSQL - Single database shared across all services
- Redis - Rate limiting and caching
- MinIO - Object storage for documents

## Common Commands

### Development
```bash
# Run all services locally (outside Docker)
npm run dev

# Run individual service
npm run dev:auth
npm run dev:gateway
npm run dev:finance
# ... (other services follow same pattern)

# Start with Docker Compose
docker compose up -d --build
```

### Database Migrations
```bash
# Run all pending migrations
npm run migrate

# Targeted migrations / seeding
npm run migrate:clients
npm run migrate:users
npm run seed:users
```

### Testing
```bash
# Integration tests (uses Vitest)
cd services/tests
npm test          # run once
npm run test:watch  # watch mode

# Run tests for a specific service (if it has its own test setup)
cd services/auth-service
npm test
```

### API Documentation
- Swagger UI: `http://localhost:3000/api-docs`
- Gateway health: `http://localhost:3000/health`
- Service health: `http://localhost:3000/health/services`

## Service Routing Patterns

**Gateway Proxy Configuration**: Routes are defined in `services/gateway/src/server.js`:
- Flat proxies: `/api/employees` → hr-service, `/api/invoices` → finance-service, etc.
- Module-based: `/api/hr/*` → hr-service, `/api/finance/*` → finance-service
- Circuit breakers wrap most service proxies (Opossum)
- Some bypass proxies exist for specific endpoints requiring direct access

**Service URL Configuration**:
- Docker: Service URLs use Docker network names (e.g., `http://finance-service:3003`)
- Local dev: Use `.env.local` to override with localhost URLs

## Database & Schema

**Drizzle ORM**: Schema defined in `services/shared/db/schema.js`. Use:
```javascript
import { db } from '../../shared/db/index.js';
import { employees, users } from '../../shared/db/schema.js';
import { eq, and } from 'drizzle-orm';

// Query
const result = await db.select().from(employees).where(eq(employees.id, id));
// Insert
await db.insert(employees).values({ nik, name, ... });
```

**Migrations**: SQL files in `services/shared/drizzle/` (named with numeric prefix). Add new migrations to `scripts/run-db-migrations.js` array.

**Shared Database**: All services connect to the same PostgreSQL instance via `DB_URL` environment variable.

## Authentication & Authorization

**JWT Flow**:
1. Client POSTs to `/api/auth/login`
2. Service returns JWT token
3. Client includes `Authorization: Bearer <token>` header
4. Gateway validates via `authenticate` middleware
5. `req.user` populated with payload + permissions

**RBAC**: Use middleware in `services/shared/middleware/`:
```javascript
import { authenticate, authorize, requirePermission } from '../../shared/middleware/auth.middleware.js';

// Role-based
app.get('/admin', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), handler);

// Permission-based
app.post('/create', authenticate, requirePermission('employee:create'), handler);
```

**SUPER_ADMIN Role**: Bypasses all permission checks automatically.

## Validation

**Zod Schemas**: Import from `services/shared/utils/validators.js` or create new schemas:
```javascript
import { employeeSchema } from '../../shared/utils/validators.js';
import { z } from 'zod';

const result = employeeSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ errors: result.error.flatten() });
}
```

## Security

All services use `applySecurityMiddleware` from `services/shared/middleware/security.middleware.js`, which applies:
- Helmet for security headers
- CORS whitelist
- XSS sanitization
- Input sanitization (removes `$` and `.` from keys for PostgreSQL safety)
- HPP (HTTP Parameter Pollution protection)

## Environment Configuration

**`.env`** - Main configuration for Docker/production
**`.env.local`** - Local dev overrides (copy from `.env.local.example`)

Required variables: `DB_URL`, `JWT_SECRET`, `REDIS_HOST`, `REDIS_PASSWORD`, `MINIO_ENDPOINT`, plus service URLs.

## Adding a New Service

1. Create `services/<new-service>/` with:
   - `package.json` with `start` script
   - `Dockerfile`
   - `src/server.js` with Express app
   - `src/routes/` for route definitions

2. Add service URL to `.env.example`

3. Register in `docker-compose.yml`

4. Add proxy configuration in `services/gateway/src/server.js`

5. Add to root `package.json` scripts if needed

## File Upload

Services use Multer for multipart form handling. MinIO client configured in `services/shared/config/minio.config.js`. File types defined in Zod schemas (`KTP`, `NPWP`, `CONTRACT`, `CV`, `OTHER`).
