# Internship Web Application

This project is the foundational scaffolding for the frontend and backend of the internship application.

## Architecture & Technologies

**Frontend**:
- Next.js 15+ (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui (with RTL support initialized for Arabic translation readiness)
- Centralized API service layer (`frontend/src/services/api/client.ts`)

**Backend**:
- Python 3.12+
- Django 5.2+
- Django REST Framework
- PostgreSQL (Mandatory for all environments)

**Database**:
PostgreSQL is required. SQLite is explicitly disabled for local development to ensure parity with staging and production.

---

## Running it locally

Prerequisites: **Python 3.12+**, **Node 22+**, **npm**, **PostgreSQL**.

### 1. Database Setup
Create a local PostgreSQL database for the project. For example:
```sql
CREATE DATABASE immo;
CREATE USER immo WITH PASSWORD 'immo';
GRANT ALL PRIVILEGES ON DATABASE immo TO immo;
```

### 2. Environment Variables
Copy the example environment files and configure them:

**Backend (`backend/.env`)**:
```bash
cp backend/.env.example backend/.env
```
Ensure your `POSTGRES_*` variables match your local database credentials.

**Frontend (`frontend/.env.local`)**:
```bash
cp frontend/.env.local.example frontend/.env.local
```
This configures `NEXT_PUBLIC_API_URL` so the frontend knows where to reach the backend API.

### 3. Install Dependencies & Start Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt # (Once generated)
python manage.py migrate
python manage.py runserver
```

### 4. Install Dependencies & Start Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend is available at http://localhost:3000. It communicates with the backend via the centralized `apiClient` configured to use `NEXT_PUBLIC_API_URL`.

---

## Layout

| Path | What |
|---|---|
| [frontend/src/app/](frontend/src/app/) | Next.js routes and application layouts |
| [frontend/src/components/ui/](frontend/src/components/ui/) | Reusable shadcn/ui components |
| [frontend/src/components/layout/](frontend/src/components/layout/) | App-level components (headers, footers) |
| [frontend/src/features/](frontend/src/features/) | Feature-specific frontend code (when added) |
| [frontend/src/services/api/](frontend/src/services/api/) | Centralized API client abstraction |
| [backend/config/](backend/config/) | Django settings and core configuration |
| [backend/apps/](backend/apps/) | Django application modules |
