# Service Logs Summary – Errors and Fixes

This document summarizes the errors found in Docker service logs and how to fix them.

---

## Service Status Overview

| Service | Status | Issue |
|---------|--------|-------|
| **analytics-service** | Exited (1) | Missing `morgan` package → **FIXED** (added to package.json) |
| **notification-service** | Exited (1) | DB connection refused + email_queue query error |
| **auth-service** | Up | GET /me returns 500 – `column "email" does not exist` |
| **finance-service** | Up | Multiple 500s – missing columns (revision_number, etc.) |
| **hr-service** | Up | GET /employees returns 500 – schema/DB mismatch |
| **gateway** | Up | 404 for flat APIs; 503 for analytics (service down) |

---

## 1. Analytics Service – FIXED

**Error:** `ERR_MODULE_NOT_FOUND: Cannot find package 'morgan'`

**Fix:** Added `morgan` to `services/analytics-service/package.json` dependencies.

**Next step:** Rebuild and restart:
```bash
docker compose up -d --build analytics-service
```

---

## 2. Auth Service – GET /me 500

**Error:** `column "email" does not exist` (in users table)

**Cause:** The DB schema is out of sync. The code expects `email`, `full_name`, `role_id`, `is_active`, `updated_at` in the `users` table, but the DB may have been created before these columns were added.

**Fix:** Run the users columns migration:
```bash
psql "$DB_URL" -f services/shared/drizzle/0003_users_columns.sql
```

Or manually:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
```

---

## 3. Finance Service – Multiple 500 Errors

**Errors:**
- `invoices.revision_number does not exist`
- `errorMissingColumn` for tax-types, basts, projects, proposal-penawaran

**Cause:** DB schema is behind the Drizzle schema. Migrations 0001, 0002 may not have been fully applied.

**Fix:** Run the Drizzle migrations against your DB:
```bash
# From project root, with DB_URL set
cd services/shared && npx drizzle-kit push
# Or run the SQL files manually:
psql "$DB_URL" -f services/shared/drizzle/0001_aberrant_namor.sql
psql "$DB_URL" -f services/shared/drizzle/0002_new_modules_basts_projects_tax_proposal.sql
```

For `invoices.revision_number` specifically:
```sql
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS revision_number INTEGER DEFAULT 0;
```

---

## 4. HR Service – GET /employees 500

**Error:** DrizzleQueryError (likely a column mismatch in employees table)

**Fix:** Ensure all Drizzle migrations have been run. The employees table schema in `services/shared/db/schema.js` must match the DB.

---

## 5. Notification Service – Exited

**Errors:**
- `DrizzleQueryError` on `email_queue` (status, retry_count, etc.)
- `ECONNREFUSED 103.74.5.159:5432` – DB connection refused

**Cause:** Either the DB was unreachable when the email processor ran, or the `email_queue` table/columns don't exist.

**Fix:**
1. Ensure DB is reachable from Docker (check firewall, network).
2. Create `email_queue` and `email_templates` tables if missing (see schema).
3. Rebuild and restart: `docker compose up -d --build notification-service`

---

## 6. Gateway – 404 for Flat APIs

**Observed:** `GET /api/invoices` 404, `GET /api/employees` 404

**Note:** The gateway has flat proxies (e.g. `/api/employees` → hr-service, `/api/invoices` → finance-service). If you see 404, the frontend may be calling the wrong path. The correct paths per Swagger are:
- `/api/hr/employees` (not `/api/employees`)
- `/api/finance/invoices` (not `/api/invoices`)

Update the frontend to use the prefixed URLs from `docs/API_STRUCTURE.md` and `docs/FRONTEND_API_INTEGRATION.md`.

---

## Quick Fix Checklist

1. **Run DB migrations** (no psql needed – uses Node.js + DB_URL from .env):
   ```bash
   npm run migrate
   ```
   This runs: 0003 (users columns), 0002 (basts, projects, tax_types, proposal_penawaran), 0004 (invoices columns).

2. **Rebuild analytics-service:**
   ```bash
   docker compose up -d --build analytics-service
   ```

3. **Restart all services after DB migrations:**
   ```bash
   docker compose up -d
   ```

4. **Verify:** `curl http://localhost:3000/health` and `curl -H "Authorization: Bearer <token>" http://localhost:3000/api/auth/me`

---

## DB Connection Note

The DB is at `103.74.5.159:5432`. Ensure:
- The VPS allows connections from your machine/Docker host
- `DB_URL` in `.env` is correct
- PostgreSQL is running on the VPS
