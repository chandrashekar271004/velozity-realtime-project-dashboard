# Deployment Guide

## Velozity Real-Time Client Project Dashboard

Production deployment:

```text
Frontend → Vercel
Backend  → Render
Database → Neon PostgreSQL
```

## 1. Repository

GitHub:

[https://github.com/chandrashekar271004/velozity-realtime-project-dashboard](https://github.com/chandrashekar271004/velozity-realtime-project-dashboard?utm_source=chatgpt.com)

## 2. Production URLs

### Frontend

```text
https://velozity-dashboard-hazel.vercel.app/
```

### Backend

```text
https://velozity-dashboard-api-3zuw.onrender.com
```

### Backend Health

```text
https://velozity-dashboard-api-3zuw.onrender.com/health
```

### API Base URL

```text
https://velozity-dashboard-api-3zuw.onrender.com/api
```

## 3. Database — Neon PostgreSQL

The production database uses PostgreSQL hosted by Neon.

The backend connects to Neon through:

```text
DATABASE_URL
```

The database URL is stored only as a deployment environment variable.

It must not be committed to Git.

## 4. Backend — Render

The backend is deployed as a persistent Node.js web service on Render.

This is required because the application uses Socket.IO for persistent WebSocket communication.

### Repository

```text
chandrashekar271004/velozity-realtime-project-dashboard
```

### Root Directory

```text
backend
```

### Build Command

```bash
npm install --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build
```

### Start Command

```bash
npm start
```

### Environment

Configure the following variables in Render:

```text
DATABASE_URL=<Neon PostgreSQL connection string>

PORT=5000

CLIENT_URL=https://velozity-dashboard-hazel.vercel.app

JWT_ACCESS_SECRET=<strong production secret>

JWT_REFRESH_SECRET=<different strong production secret>

ACCESS_TOKEN_TTL=15m

REFRESH_TOKEN_TTL_DAYS=7

NODE_ENV=production
```

Never commit the actual secret values.

## 5. Prisma Deployment

Render automatically runs:

```bash
npx prisma generate
```

followed by:

```bash
npx prisma migrate deploy
```

This applies committed Prisma migrations to the production PostgreSQL database.

Do not use:

```bash
prisma migrate dev
```

against the production database.

## 6. Production Seed

Seed data should be inserted into the production database only when required for assessment/demo purposes.

The seed includes:

```text
1 Admin
2 Project Managers
4 Developers
3+ Projects
5+ Tasks per project
Overdue tasks
Activity history
```

Seed credentials:

```text
Password:
Password@123
```

Demo users:

```text
admin@velozity.local

pm1@velozity.local
pm2@velozity.local

dev1@velozity.local
dev2@velozity.local
dev3@velozity.local
dev4@velozity.local
```

These credentials are for assessment/demo purposes and should not be used in a real production system.

## 7. Frontend — Vercel

The React + TypeScript frontend is deployed on Vercel.

### Repository

```text
chandrashekar271004/velozity-realtime-project-dashboard
```

### Root Directory

```text
frontend
```

### Framework

```text
Vite
```

### Environment Variables

Configure:

```text
VITE_API_URL=https://velozity-dashboard-api-3zuw.onrender.com/api

VITE_SOCKET_URL=https://velozity-dashboard-api-3zuw.onrender.com
```

After changing frontend environment variables, trigger a new Vercel deployment.

## 8. CORS Configuration

The Render backend must allow the deployed Vercel frontend.

Configure:

```text
CLIENT_URL=https://velozity-dashboard-hazel.vercel.app
```

The backend uses this value for CORS and Socket.IO origin configuration.

## 9. Socket.IO Deployment

The application does not use polling or Server-Sent Events for application updates.

Real-time updates use Socket.IO.

```text
Browser
   │
   │ Socket.IO
   ▼
Render Node.js Server
   │
   ├── Activity events
   ├── Notifications
   └── Presence
```

Vercel hosts the frontend only.

The Socket.IO server remains on Render as a persistent Node.js process.

## 10. Authentication in Production

The application uses:

```text
Access Token
+
Refresh Token
```

Access tokens are short-lived and kept in frontend memory.

Refresh tokens are:

* Random opaque values
* Hashed before database storage
* Sent using an HttpOnly cookie
* Secure in production
* Not stored in localStorage

This prevents the refresh token from being directly accessible through client-side JavaScript.

## 11. Deployment Verification

After deployment, verify:

### Frontend

```text
https://velozity-dashboard-hazel.vercel.app/
```

### Backend health

```text
https://velozity-dashboard-api-3zuw.onrender.com/health
```

Expected response should indicate that the API is healthy.

### Authentication

Test:

```text
Login
Refresh
Logout
```

Confirm that the refresh token is handled through the browser cookie.

### RBAC

Test all three roles:

```text
Admin
Project Manager
Developer
```

Verify:

* Admin can access global data.
* PM can access only owned projects.
* Developer can access only assigned tasks.
* Unauthorized API requests are rejected server-side.

### Real-Time Activity

Open two browser sessions and verify:

```text
Task status change
       ↓
PostgreSQL activity record
       ↓
Socket.IO event
       ↓
Connected authorized clients
```

### Notifications

Verify:

```text
Task assignment
Developer moves task to In Review
Unread notification
Mark one as read
Mark all as read
```

### Missed Events

Disconnect a client, generate activity from another client, reconnect, and verify that the client receives the latest persisted missed events.

### Overdue Scheduler

Create or use a task whose due date is in the past.

The background scheduler should automatically transition it to:

```text
OVERDUE
```

and create an activity record.

## 12. Database Verification

Verify that the production database contains:

```text
Users
Clients
Projects
Tasks
TaskStatusHistory
Activities
Notifications
RefreshTokens
```

The schema uses foreign keys to enforce relational integrity.

## 13. Production Architecture

```text
                         Internet
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
       Vercel Frontend              Render Backend
       React + TypeScript           Node + Express
              │                           │
              │ REST + Socket.IO          │
              └──────────────┬────────────┘
                             │
                           Prisma
                             │
                             ▼
                       Neon PostgreSQL
```

Background processing:

```text
Render Node Process
       │
       └── node-cron
             │
             └── Every minute
                    │
                    └── Detect overdue tasks
```

## 14. Environment Security

Never commit:

```text
.env
.env.local
production database URLs
JWT secrets
private credentials
```

The repository contains only example environment files.

Production secrets are configured through Vercel and Render environment settings.

## 15. Deployment Limitations

The current deployment uses process-local Socket.IO presence.

For multiple backend instances, the recommended architecture is:

```text
                 Load Balancer
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
      Node Instance 1          Node Instance 2
          │                         │
          └────────────┬────────────┘
                       ▼
                 Redis Adapter
                       │
                       ▼
                 PostgreSQL
```

Redis would provide shared Socket.IO room/presence state across instances.

Email and push notification providers are outside the assessment scope.

## 16. Final Deployment

```text
Frontend:
https://velozity-dashboard-hazel.vercel.app/

Backend:
https://velozity-dashboard-api-3zuw.onrender.com

API:
https://velozity-dashboard-api-3zuw.onrender.com/api

Health:
https://velozity-dashboard-api-3zuw.onrender.com/health

Repository:
https://github.com/chandrashekar271004/velozity-realtime-project-dashboard
```

## 17. Submission Checklist

* [x] React + TypeScript frontend
* [x] Node.js + Express + TypeScript backend
* [x] PostgreSQL
* [x] Prisma ORM
* [x] Foreign keys
* [x] Database indexes
* [x] JWT access token
* [x] Refresh token
* [x] HttpOnly refresh cookie
* [x] API-level RBAC
* [x] Ownership isolation
* [x] Server-side validation
* [x] Structured errors
* [x] Socket.IO real-time communication
* [x] Persistent activity history
* [x] Missed activity recovery
* [x] Persistent notifications
* [x] node-cron overdue scheduler
* [x] Seed data
* [x] Vercel frontend deployment
* [x] Render backend deployment
* [x] Neon PostgreSQL production database
* [x] Public GitHub repository
