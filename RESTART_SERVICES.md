## FundX Backend Service Restart Guide

### Current Status
- Services running on ports 8000-8005 (API Gateway, User, Startup, Investor, Deal, AI services)
- PostgreSQL running on port 5432
- Code has been updated with `/verify-cin` endpoint and database migration
- **Issue**: Running services still have old code without the new endpoint

### What You Need To Do

#### Option 1: Restart via Docker Compose (Recommended)
If you have Docker Desktop running:
```bash
cd c:\Users\swapn\OneDrive\Desktop\FundX_2\FundX
docker-compose down
docker-compose up --build -d
```

This will:
- Stop all services
- Rebuild Docker images with updated code
- Run database migrations automatically
- Start all services fresh

#### Option 2: Manual Process Restart
If services are running as Python processes, you need to:
1. Kill existing processes listening on ports 8001-8005
2. Restart them with updated code

#### Option 3: Run Migration on Running Database
If you can access the database directly:
```sql
-- Execute the SQL in: database/supabase/migrations/002_add_cin_verification.sql
```

### Code Changes Made
1. ✅ Created `/backend/shared/migrations.py` - Database migration runner
2. ✅ Updated `/backend/user-service/app/main.py` - Added `/admin/run-migrations` endpoint and import
3. ✅ Updated `/backend/api-gateway/app/main.py` - Added `/admin/run-migrations` admin proxy
4. ✅ Added migration import to on_startup handler

### After Restart, Test With:
```bash
# Test verify-cin endpoint
curl http://localhost:8000/api/users/verify-cin/U40100WB2022PTC256639

# Expected response (after migration):
# {"verified": true, "eligible": true, "message": "CIN verified as Active.", "company": {...}}
```

### Files Modified
- `backend/shared/migrations.py` - NEW
- `backend/user-service/app/main.py` - Updated
- `backend/api-gateway/app/main.py` - Updated
- `database/supabase/migrations/002_add_cin_verification.sql` - Already exists

### Next Steps After Restart
1. Frontend will automatically work - no code changes needed
2. RegisterPage CIN verification will show real-time status
3. Startups/Investors can register with CIN auto-verification
4. Eligibility gates will enforce verification for publishing deals/offers
