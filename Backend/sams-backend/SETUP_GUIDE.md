# SAMS FastAPI Backend — Complete Setup Guide

## Folder Structure

```
sams-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                     ← FastAPI app entry point
│   ├── core/
│   │   ├── config.py               ← Settings from .env
│   │   ├── security.py             ← JWT + bcrypt
│   │   └── dependencies.py         ← Auth guards (require_student, require_coordinator)
│   ├── database/
│   │   ├── base.py                 ← SQLAlchemy Base
│   │   └── connection.py           ← Engine + get_db()
│   ├── models/
│   │   ├── student.py              ← Student table
│   │   ├── staff.py                ← Staff (Lecturer / Coordinator)
│   │   ├── company.py              ← Company table
│   │   ├── placement.py            ← Placement table
│   │   ├── weekly_log.py           ← Weekly Log table
│   │   ├── field_visit.py          ← Field Visit table
│   │   └── final_report.py         ← Final Report table
│   ├── schemas/                    ← Pydantic request/response models
│   ├── services/                   ← Business logic (called by routes)
│   ├── routes/                     ← Thin API endpoints
│   └── utils/
│       └── response.py             ← Standard response helpers
├── alembic/
│   ├── env.py
│   └── versions/                   ← Generated migration files go here
├── database/
│   └── seed.sql                    ← Sample data
├── uploads/                        ← Uploaded files (logbooks, reports, visit forms)
├── .env                            ← Environment variables (DO NOT commit this)
├── alembic.ini
└── requirements.txt
```

---

## PHASE 1 — Database Setup

### Step 1: Install MySQL

**Windows:**
1. Download MySQL Installer from https://dev.mysql.com/downloads/installer/
2. Run the installer, choose "Developer Default"
3. Set root password (remember this — you'll need it)
4. Start MySQL service

**macOS:**
```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

### Step 2: Create the database

```bash
# Login to MySQL
mysql -u root -p

# Inside MySQL shell:
CREATE DATABASE sams_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;   -- verify sams_db appears
EXIT;
```

---

## PHASE 2 — Python Environment

### Step 3: Create virtual environment

```bash
# Navigate to the project folder
cd sams-backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Your prompt should now show (venv)
```

### Step 4: Install dependencies

```bash
pip install -r requirements.txt
```

If you see errors on Windows with `cryptography`, run:
```bash
pip install --upgrade pip
pip install cryptography
pip install -r requirements.txt
```

---

## PHASE 3 — Configuration

### Step 5: Edit .env file

Open `.env` and set your MySQL password:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_password_here    ← change this
DB_NAME=sams_db

SECRET_KEY=my_super_secret_key_change_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200
```

Also update `alembic.ini` line 53:
```ini
sqlalchemy.url = mysql+pymysql://root:your_actual_password@localhost:3306/sams_db
```

---

## PHASE 4 — Database Migration

### Step 6: Run Alembic migrations

```bash
# Make sure (venv) is active and you're in sams-backend/

# Create the initial migration (auto-detects all models)
alembic revision --autogenerate -m "initial_tables"

# Apply migrations to the database (creates all tables)
alembic upgrade head

# Verify tables were created:
mysql -u root -p sams_db -e "SHOW TABLES;"
```

You should see these tables:
- `students`
- `staff`
- `companies`
- `placements`
- `weekly_logs`
- `field_visits`
- `final_reports`

### Step 7: Seed sample data

```bash
mysql -u root -p sams_db < database/seed.sql
```

This inserts:
- 1 coordinator account
- 4 lecturer accounts
- 5 student accounts
- 6 companies
- 4 placements
- 10 weekly logs
- 2 final reports
- 2 field visits

**All seeded passwords are: `Sams@2025`**

---

## PHASE 5 — Run the Server

### Step 8: Start FastAPI

```bash
# From sams-backend/ with (venv) active:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

### Step 9: Test the API

Open your browser:
- **Swagger UI (interactive docs):** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Health check:** http://localhost:8000/api/v1/health

---

## PHASE 6 — Test Endpoints

### Using curl

**Register a student:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "registrationNumber": "SCT/2022/001",
    "email": "test@students.ku.ac.ke",
    "phone": "0712000001",
    "company": "Test Company Ltd",
    "location": {"county": "Nairobi", "city": "Westlands"},
    "stationSupervisor": "Mr. Test Supervisor",
    "startDate": "2025-02-03",
    "endDate": "2025-05-15",
    "password": "Sams@2025"
  }'
```

**Login as student:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "j.muthoni@students.ku.ac.ke",
    "password": "Sams@2025",
    "role": "student"
  }'
```
Save the `access_token` from the response.

**Login as coordinator:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "a.kariuki@ku.ac.ke",
    "password": "Sams@2025",
    "role": "coordinator"
  }'
```

**Get student placement progress (authenticated):**
```bash
curl http://localhost:8000/api/v1/students/SCT%2F2021%2F045/placement-progress \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get weekly logs:**
```bash
curl "http://localhost:8000/api/v1/logs?page=1&pageSize=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get KPIs (coordinator only):**
```bash
curl http://localhost:8000/api/v1/analytics/kpis \
  -H "Authorization: Bearer COORDINATOR_TOKEN_HERE"
```

---

## PHASE 7 — Angular Integration

### Step 10: Update Angular environment

In your Angular project, open:
`src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',   // ← points to FastAPI
};
```

### Step 11: Remove the mock interceptor

In `src/app/app.config.ts`, remove `mockApiInterceptor`:

```typescript
// BEFORE (development with mock data):
withInterceptors([mockApiInterceptor, loadingInterceptor, authInterceptor])

// AFTER (connected to real FastAPI):
withInterceptors([loadingInterceptor, authInterceptor])
```

### Step 12: Angular Auth Service

The Angular `AuthService` already calls:
- `POST /api/v1/auth/login` → returns `{ access_token, token_type, user }`
- `POST /api/v1/auth/register` → student signup

The JWT token is stored in `localStorage` as `sams_token` and attached to every request by `auth.interceptor.ts`.

### Step 13: Update API URL in Angular services

All Angular services use `environment.apiUrl` already. The real backend now replaces the mock.

The API response shape matches exactly what the mock interceptor was returning:
```
{ data: <payload> }          ← for single objects
{ data: { items, total, page, pageSize } }   ← for paginated lists
```

---

## All API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/v1/auth/register | None | Student signup |
| POST | /api/v1/auth/register/staff | None | Staff signup |
| POST | /api/v1/auth/login | None | Login (student or staff) |
| GET  | /api/v1/auth/me | Any | Get current user |
| POST | /api/v1/auth/change-password | Student | Change password |
| GET  | /api/v1/students | Coordinator | List all students |
| GET  | /api/v1/students/{reg_no} | Any | Get student |
| PATCH| /api/v1/students/{reg_no} | Any | Update student |
| GET  | /api/v1/students/{reg_no}/placement-progress | Any | Placement KPIs |
| GET  | /api/v1/students/{reg_no}/notifications | Student | Real notifications |
| PATCH| /api/v1/students/{reg_no}/assign-supervisor | Coordinator | Assign lecturer |
| GET  | /api/v1/logs | Any | Get weekly logs |
| POST | /api/v1/logs | Student | Submit log |
| POST | /api/v1/logs/draft | Student | Save draft |
| POST | /api/v1/logs/{id}/file | Student | Upload log file |
| PATCH| /api/v1/logs/{id}/review | Staff | Review log |
| GET  | /api/v1/supervisors | Any | List lecturers |
| POST | /api/v1/supervisors | Coordinator | Add lecturer |
| GET  | /api/v1/companies | Any | List companies |
| POST | /api/v1/companies | Coordinator | Add company |
| PATCH| /api/v1/companies/{id} | Coordinator | Update company |
| DELETE| /api/v1/companies/{id} | Coordinator | Delete company |
| GET  | /api/v1/analytics/kpis | Coordinator | Dashboard KPIs |
| GET  | /api/v1/analytics/urgent-flags | Coordinator | Urgent alerts |
| GET  | /api/v1/reports/{reg_no} | Any | Get final report |
| POST | /api/v1/reports/{reg_no}/upload | Student | Upload report PDF |
| PATCH| /api/v1/reports/{reg_no}/grade | Coordinator | Grade report |
| GET  | /api/v1/field-visits/{reg_no} | Any | Get field visits |
| POST | /api/v1/field-visits | Coordinator | Create visit |
| POST | /api/v1/field-visits/{id}/upload | Staff | Upload visit form |

---

## Troubleshooting

**`ModuleNotFoundError: No module named 'app'`**
```bash
# Make sure you're in sams-backend/ when running uvicorn
cd sams-backend
uvicorn app.main:app --reload
```

**`Access denied for user 'root'@'localhost'`**
- Check your `.env` DB_PASSWORD matches your MySQL root password
- Also update `alembic.ini` with the same password

**`Table already exists` on alembic upgrade**
```bash
# Drop and recreate the database
mysql -u root -p -e "DROP DATABASE sams_db; CREATE DATABASE sams_db;"
alembic upgrade head
```

**Angular CORS error**
- Make sure `ALLOWED_ORIGINS=http://localhost:4200` is in `.env`
- Restart the FastAPI server after editing `.env`

**Token expired / 401 errors**
- Default expiry is 24 hours (1440 minutes)
- Clear `localStorage` in browser and log in again

**`422 Unprocessable Entity` on registration**
- Check the request body matches the schema exactly
- `registrationNumber` must match pattern: `DEPT/YEAR/NUMBER` e.g. `SCT/2021/045`
- `phone` must be Kenyan format: `0712345678` or `+254712345678`
