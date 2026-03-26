# Coreapps Alugra ERP - Microservices

> **Containerized Enterprise Resource Planning System for PT Alugra Indonesia**

**Stack**: PostgreSQL, Redis, MinIO, Node.js (no MongoDB)

## 🏗️ Architecture
The system is built as a set of decoupled Node.js microservices orchestrated with Docker Compose. This architecture ensures high availability and independent scalability of modules.

### Microservices Grid
- **API Gateway**: Entry point for all client requests.
- **Auth Service**: Identity and Access Management.
- **CRM Service**: Sales and Customer relationship.
- **Finance Service**: Billing, Payments, and Procurement.
- **HR Service**: Employees and Payroll.
- **Inventory Service**: Warehouse and Stock management.
- **Accounting Service**: Double-entry bookkeeping and Workflows.
- **Notification, Manufacturing, Asset, Analytics** services.

---

## 🚀 Quick Start (Docker)

### 1. Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- (Optional) [Postman](https://www.postman.com/) for API testing

### 2. Configuration
The services rely on a root `.env` file. Create it from the template:
```bash
cp .env.example .env
# Edit .env with your specific credentials (DB, Redis, MinIO)
# For Docker: set DB_NAME, DB_USER, DB_PASSWORD to match PostgreSQL
```

**Local development (services outside Docker):** When running `npm run dev`, the gateway uses localhost URLs. If you run the gateway standalone, copy `.env.local.example` to `.env.local` so service URLs point to `localhost` instead of Docker hostnames:
```bash
cp .env.local.example .env.local
```

### 3. Build & Launch
Build and start the entire stack (PostgreSQL, Redis, MinIO, all microservices):
```bash
docker compose up -d --build
```
This command will:
- Start PostgreSQL, Redis, MinIO
- Build and start all microservices
- Start the API Gateway on port `3000`

### 4. Verification
```bash
curl http://localhost:3000/health
```

---

## 📚 Swagger API Documentation

| URL | Description |
|-----|-------------|
| **http://localhost:3000/api-docs** | Interactive Swagger UI |
| **http://localhost:3000/api-docs.json** | OpenAPI 3.0 JSON spec |

**Usage**:
1. Open `http://localhost:3000/api-docs` in your browser
2. Click **Authorize** and paste a JWT from `POST /api/auth/login`
3. Use "Try it out" on any endpoint

---

## 📡 API Endpoints (via Gateway)

| Module | Route | Service Location |
| :--- | :--- | :--- |
| **Authentication** | `POST /api/auth/login` | `auth-service:3001` |
| **CRM** | `GET /api/crm/leads` | `crm-service:3002` |
| **Finance** | `POST /api/finance/invoices` | `finance-service:3003` |
| **HR** | `GET /api/hr/employees` | `hr-service:3004` |
| **Inventory** | `GET /api/inventory/products` | `inventory-service:3005` |
| **Accounting** | `GET /api/accounting/accounts` | `accounting-service:3006` |

---

## 🛠️ Development

### Folder Structure
```
.
├── services/           # Microservices source code
│   ├── shared/         # Shared DB schema & utils
│   ├── gateway/        # API Gateway (Express)
│   ├── auth-service/   # Auth logic
│   └── ...            # Other modules
├── docs/               # Technical documentation
└── docker-compose.yml  # System orchestration
```

### Adding a New Service
1. Create a directory in `services/`.
2. Add a `Dockerfile`.
3. Register the service in `docker-compose.yml`.
4. Update the `gateway` routes.

---

## Secrets Management

**Never commit `.env` to git.** Copy `.env.example` to `.env` and fill in real values.

Generate cryptographically secure secrets:
```bash
# JWT_SECRET and JWT_REFRESH_SECRET — run twice, use different values
openssl rand -hex 64
```

Rotate secrets immediately if any are exposed. After rotation:
1. Update `.env` on the server
2. Restart all services: `docker compose -f docker-compose.prod.yml restart`
3. Force all users to re-login (JWT_SECRET change invalidates all tokens)

## GitHub Actions Secrets Required

Set these in GitHub -> Settings -> Secrets -> Actions:

| Secret | Description |
|---|---|
| `VPS_HOST` | Production server IP or hostname |
| `VPS_USER` | SSH username on VPS |
| `VPS_SSH_KEY` | Private SSH key for deployment |
| `PROD_API_URL` | Production API URL (e.g. https://api.alugra.co.id) |

---

## Database Backups

Run backups daily at 2am on the VPS:
```bash
# Add to crontab (run: crontab -e)
0 2 * * * /opt/coreapps/coreapps-alugra/scripts/backup-db.sh >> /var/log/coreapps-backup.log 2>&1
```

Backups are stored in `/var/backups/coreapps/` and retained for 30 days.

To restore:
```bash
zcat /var/backups/coreapps/coreapps_YYYYMMDD_HHMMSS.sql.gz | psql "$DB_URL"
```

---

© 2026 PT Alugra Indonesia. All Rights Reserved.
