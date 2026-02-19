# Testing & Documentation Quick Start

## 🚀 Quick Start

### 1. Start All Services
```bash
docker-compose up -d
```

Wait ~30 seconds for all services to initialize.

### 2. Access Swagger Documentation
Open your browser and navigate to:
```
http://localhost:3000/api-docs
```

**Features**:
- ✅ All 9 microservices documented in one place
- ✅ Interactive "Try it out" for testing endpoints
- ✅ Request/Response examples
- ✅ Authentication workflow

---

## 📋 Testing Options

### Option 1: Use Swagger UI (Recommended)
1. Go to `http://localhost:3000/api-docs`
2. Click the **"Authorize"** button at the top
3. Login first via `/api/auth/login` to get your token
4. Paste the token in the Authorization dialog
5. Use "Try it out" on any endpoint

### Option 2: Run Automated Test Script
```bash
chmod +x test-all-modules.sh
./test-all-modules.sh
```

The script will:
- Authenticate automatically
- Test all CRUD operations
- Generate `test-report.md`

### Option 3: Manual Testing with curl
See `TESTING_GUIDE.md` for detailed curl commands for each module.

---

## 📊 What's Being Tested

### ✅ HR Module
- Employee CRUD
- Leave Management (Apply, Approve)
- Attendance Tracking
- Payroll with PPh 21 Tax
- Employee Loans

### ✅ Manufacturing Module
- BOM Creation and Cost Calculation
- Work Order Lifecycle
- Stock Backflushing
- Quality Inspections

### ✅ Asset Management Module
- Asset CRUD
- Depreciation (SLM/WDV)
- Maintenance Scheduling

### ✅ Accounting Module
- Chart of Accounts
- Journal Entries
- Trial Balance

### ✅ CRM, Finance, Inventory
- Standard CRUD operations
- Business logic validation

---

## 📄 Documentation Files

| File | Purpose |
|------|---------|
| `TESTING_GUIDE.md` | Detailed manual testing commands |
| `TEST_REPORT.md` | Comprehensive test results template |
| `test-all-modules.sh` | Automated testing script |
| `http://localhost:3000/api-docs` | Interactive Swagger UI |

---

## 🔧 Troubleshooting

### Services not starting?
```bash
docker-compose down
docker-compose up -d --build
docker-compose logs -f
```

### Token expired?
Re-authenticate:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Swagger not loading?
```bash
cd services/gateway
npm install swagger-ui-express swagger-jsdoc
docker-compose restart gateway
```

---

## ✨ Next Steps

After verifying all tests pass:
1. Review `TEST_REPORT.md` for detailed results
2. Check Swagger documentation for API reference
3. Proceed with Phase 6: Project Management Module

---

**Happy Testing! 🎉**
