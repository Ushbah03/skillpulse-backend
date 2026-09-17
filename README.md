# 🚀 SkillPulse AI — Backend API & Multi-Tenant Database

Welcome to the backend engine of **SkillPulse AI (SP-AI)** — an Enterprise Multi-Tenant Workforce Skill & Talent Development SaaS Platform.

---

## 🛠️ Tech Stack & Architecture

- **Runtime**: Node.js & Express.js (ES Modules)
- **Database ORM**: Prisma ORM (Type-safe relational modeling)
- **Database Engine**: PostgreSQL (Supported on Local Postgres, Supabase, Neon, AWS RDS)
- **Authentication**: JWT (JSON Web Tokens) with Argon2/Bcrypt password hashing
- **Access Control**: Role-Based Access Control (RBAC) across 5 documented tiers:
  - `SUPER_ADMIN` (Platform governance)
  - `COMPANY_ADMIN` (Tenant configuration)
  - `HR_MANAGER` (Workforce & succession planning)
  - `TEAM_LEADER` (Squad formation & team skills)
  - `EMPLOYEE` (Skill profile, gaps & learning)

---

## 📁 Directory Structure

```
skillpulse-backend/
├── prisma/
│   ├── schema.prisma          # Comprehensive 20+ multi-tenant models
│   └── seed.js                # Seed script with realistic personas (Emily Zhang, etc.)
├── src/
│   ├── config/
│   │   └── db.js              # Prisma client singleton
│   ├── controllers/
│   │   ├── authController.js        # Login, Register, Me
│   │   ├── employeeController.js    # Skills, Gaps, Course progress
│   │   ├── teamLeaderController.js  # Team matrix, AI squad builder
│   │   ├── hrController.js          # Org analytics, Forecasting
│   │   ├── adminController.js       # Tenant & user governance
│   │   └── aiController.js          # AI gap inference & squad matchmaking
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification & tenant context
│   │   ├── rbacMiddleware.js        # Role permission guards
│   │   └── errorHandler.js          # Centralized error handler
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── employeeRoutes.js
│   │   ├── teamLeaderRoutes.js
│   │   ├── hrRoutes.js
│   │   ├── adminRoutes.js
│   │   └── aiRoutes.js
│   ├── app.js                 # Express application & CORS configuration
│   └── server.js              # Server entry point (Port 5000)
├── .env                       # Environment variables & DB connection
├── package.json
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Configure Database Connection
Open `.env` in `skillpulse-backend` and set your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/skillpulse_db?schema=public"
```
*(You can also use a free cloud PostgreSQL database from [Supabase.com](https://supabase.com) or [Neon.tech](https://neon.tech) and paste the connection URI).*

### 2. Push Schema to Database
```bash
npm run prisma:push
```

### 3. Seed Database with Realistic Data
```bash
npm run prisma:seed
```
This populates your database with:
- **Enterprise Corp** workspace
- Users for all 5 roles (`admin@enterprise.com`, `hr@enterprise.com`, `leader@enterprise.com`, `emily.zhang@enterprise.com`, etc.)
- Default password for all seeded users: `Password123!`
- Skill categories, master skills, critical skill gaps, courses, and AI squad recommendations.

### 4. Start Development Server
```bash
npm run dev
```
The server will run at: `http://localhost:5000`  
Health check endpoint: `http://localhost:5000/api/health`

### 5. Launch Visual Database Browser (Prisma Studio)
```bash
npm run prisma:studio
```
Open `http://localhost:5555` to view, search, and edit database records visually.

---

## 📡 Core API Endpoints

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | User login & JWT issuance | Public |
| `POST` | `/api/auth/register` | Tenant user registration | Public |
| `GET` | `/api/auth/me` | Current user & tenant profile | Authenticated |
| `GET` | `/api/employee/profile` | Personal skill matrix | Authenticated |
| `GET` | `/api/employee/gaps` | Individual skill gaps | Authenticated |
| `GET` | `/api/employee/learning` | AI-recommended courses | Authenticated |
| `POST` | `/api/employee/enroll` | Enroll in training program | Authenticated |
| `GET` | `/api/team-leader/overview` | Team skill roster | Team Leader+ |
| `GET` | `/api/team-leader/gaps` | Team gap heatmap data | Team Leader+ |
| `POST` | `/api/team-leader/projects` | AI Squad matchmaking | Team Leader+ |
| `GET` | `/api/hr/analytics` | Organization-wide analytics | HR Manager+ |
| `GET` | `/api/hr/forecast` | 6-12 month skill demand | HR Manager+ |
| `GET` | `/api/admin/tenants` | Manage client workspaces | Super Admin |
| `GET` | `/api/admin/users` | Tenant user management | Company Admin+ |
| `POST` | `/api/ai/infer-gaps` | AI Skill Gap algorithm | Authenticated |
