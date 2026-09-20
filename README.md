# Velozity Global Solutions — Real-Time Client Project Dashboard

A production-oriented full-stack project management dashboard built as a technical hiring assessment for the Full Stack Software Developer role at Velozity Global Solutions.

The application provides role-based project and task management, real-time activity updates, notifications, dashboards, overdue-task automation, and secure authentication.

## Live Application

* Frontend: https://velozity-dashboard-hazel.vercel.app/
* Backend API: https://velozity-dashboard-api-3zuw.onrender.com
* GitHub: https://github.com/chandrashekar271004/velozity-realtime-project-dashboard

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Socket.IO Client

### Backend

* Node.js
* Express.js
* TypeScript
* Socket.IO
* Zod
* node-cron
* JWT

### Database

* PostgreSQL
* Prisma ORM

### Deployment

* Vercel — Frontend
* Render — Backend
* Neon PostgreSQL — Production Database

## Architecture

```text
                    ┌──────────────────────────┐
                    │       React + Vite       │
                    │     TypeScript Client    │
                    └────────────┬─────────────┘
                                 │
                    REST API + Socket.IO
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │   Node.js + Express      │
                    │      TypeScript API      │
                    │                          │
                    │  Authentication          │
                    │  RBAC / Ownership        │
                    │  Validation              │
                    │  Notifications           │
                    │  Activity                │
                    │  Dashboard               │
                    │  Background Scheduler    │
                    └────────────┬─────────────┘
                                 │
                              Prisma
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │       PostgreSQL         │
                    │      Neon Database       │
                    └──────────────────────────┘
```

Real-time communication:

```text
React Client
     │
     │ Socket.IO
     ▼
Node.js / Render
     │
     ├── Admin → Global activity
     ├── PM → Owned-project activity
     └── Developer → Assigned-task activity
```

The backend is deployed as a persistent Node.js service because Socket.IO requires a long-lived server connection. The frontend is deployed separately on Vercel.

## Core Features

### Authentication

* JWT access-token authentication
* Short-lived access tokens
* Refresh-token authentication
* Refresh tokens stored as hashed values in PostgreSQL
* Refresh token delivered through an HttpOnly cookie
* Secure production cookie configuration
* Logout / refresh flow
* Protected API routes

### Role-Based Access Control

The system supports three roles:

| Role            | Access                                             |
| --------------- | -------------------------------------------------- |
| Admin           | Full system access                                 |
| Project Manager | Manage projects they own and related team activity |
| Developer       | Access and update tasks assigned to them           |

Authorization is enforced at the API level. Frontend visibility is not treated as a security boundary.

### Project Management

* Create projects
* View projects
* Update projects
* Delete projects where authorized
* Project ownership
* Client association
* Project status
* Project filtering

### Task Management

* Create and manage tasks
* Assign developers
* Task status
* Priority
* Due dates
* Server-side ownership checks
* Developer assignment isolation
* Task filtering
* Task status history

Supported task statuses include:

```text
TODO
IN_PROGRESS
IN_REVIEW
COMPLETED
OVERDUE
```

### Activity History

Important actions are persisted as activity records.

Examples:

* Project creation
* Task creation
* Task assignment
* Task status changes
* Overdue transitions

Each status change records:

* Previous status
* New status
* User who performed the change
* Timestamp
* Related task/project

### Real-Time Activity

Socket.IO is used instead of polling or Server-Sent Events.

The system provides role-scoped real-time activity:

* Admin → global activity feed
* Project Manager → activity for owned projects
* Developer → activity for assigned tasks
* Project viewers → project-specific activity
* Task viewers → task-specific activity

Server-side authorization controls which events each user can receive.

### Offline / Missed Activity Recovery

Activity events are persisted in PostgreSQL.

When a client reconnects, the application can request missed activity events. The backend retrieves up to the latest 20 role-visible events from the database.

This means missed events do not depend on in-memory server state.

### Notifications

Notifications are persisted in PostgreSQL and delivered through Socket.IO.

Supported functionality includes:

* Assignment notifications
* Task moved to In Review notification
* Unread notification count
* Mark one notification as read
* Mark all notifications as read
* Real-time notification updates

### Overdue Task Scheduler

A `node-cron` background job runs every minute.

It:

1. Finds tasks whose due date has passed.
2. Checks that the task is not already overdue.
3. Changes the task status to `OVERDUE`.
4. Creates an activity record.
5. Broadcasts the activity through Socket.IO.

The overdue state is therefore generated by the background job rather than by loading a dashboard page.

## Database Design

PostgreSQL is used as the relational database.

The schema contains relationships between:

```text
User
 ├── Projects
 ├── Assigned Tasks
 ├── Activities
 ├── Notifications
 └── Refresh Tokens

Project
 ├── Client
 ├── Owner
 ├── Tasks
 └── Activities

Task
 ├── Project
 ├── Developer
 ├── Status History
 └── Activities
```

### Indexing Decisions

Indexes are used for frequently queried relationships and dashboard filters.

Important indexed fields include:

* User role
* Project owner
* Project/client relationship
* Task project
* Task developer
* Task status
* Task priority
* Task due date
* Activity project
* Activity task
* Activity creation time
* Notification recipient
* Notification read state
* Refresh-token lookup

These indexes support role-scoped queries, dashboard filtering, activity retrieval, notification badges, and the overdue scheduler.

## API Structure

```text
/api/auth
/api/users
/api/clients
/api/projects
/api/tasks
/api/activity
/api/notifications
/api/dashboard
```

Health endpoint:

```text
GET /health
```

## Security

The application implements:

* API-level RBAC
* Server-side ownership validation
* Developer assignment validation
* JWT authentication
* HttpOnly refresh-token cookie
* Hashed refresh tokens
* Zod request validation
* Helmet security headers
* CORS configuration
* Rate limiting
* Parameterized Prisma queries
* Structured API errors
* Environment-based secrets
* No secrets committed to Git

Frontend authorization is only for user experience. Actual authorization decisions are performed by the backend.

## Seed Data

The application includes seed data containing:

* 1 Admin
* 2 Project Managers
* 4 Developers
* 3+ Projects
* 5+ Tasks per project
* Different task statuses
* Different priorities
* Overdue tasks
* Existing activity history

### Seed Credentials

All seeded accounts use:

```text
Password@123
```

Accounts:

```text
admin@velozity.local

pm1@velozity.local
pm2@velozity.local

dev1@velozity.local
dev2@velozity.local
dev3@velozity.local
dev4@velozity.local
```

These credentials are intended for assessment/demo purposes only.

## Local Development

### Requirements

* Node.js
* npm
* Docker Desktop
* PostgreSQL or Docker PostgreSQL

### Install

From the project root:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### Environment

Create backend environment file:

```bash
cp backend/.env.example backend/.env
```

Create frontend environment file:

```bash
cp frontend/.env.example frontend/.env
```

Configure the database, JWT secrets, frontend URL, and other required variables.

### Start PostgreSQL

```bash
docker compose up -d postgres
```

### Generate Prisma Client

```bash
npm --prefix backend run prisma:generate
```

### Run migrations

```bash
npm --prefix backend run prisma:migrate
```

### Seed database

```bash
npm run seed
```

### Start application

```bash
npm run dev
```

Default local URLs:

```text
Frontend:
http://localhost:5173

Backend:
http://localhost:5000

API:
http://localhost:5000/api

Health:
http://localhost:5000/health
```

## Production Deployment

Production deployment consists of:

```text
Vercel
  │
  │ HTTPS / REST / Socket.IO
  ▼
Render
  │
  │ Prisma
  ▼
Neon PostgreSQL
```

Detailed deployment instructions are available in:

```text
DEPLOYMENT.md
```

## Environment Variables

Secrets are supplied through environment variables and are not committed to the repository.

Backend variables include:

```text
DATABASE_URL
PORT
CLIENT_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
ACCESS_TOKEN_TTL
REFRESH_TOKEN_TTL_DAYS
NODE_ENV
```

Frontend:

```text
VITE_API_URL
VITE_SOCKET_URL
```

Actual production secret values are intentionally excluded from the repository.

## Project Structure

```text
velozity-realtime-project-dashboard/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       ├── sockets/
│       ├── utils/
│       ├── app.ts
│       └── server.ts
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── hooks/
│       └── ...
│
├── docker-compose.yml
├── DEPLOYMENT.md
├── README.md
└── package.json
```

## Known Limitations

* Socket.IO presence is process-local. A multi-instance production deployment should use a shared Socket.IO adapter such as Redis.
* Email and push notification delivery are outside the assessment scope.
* Notifications are currently persisted as in-app notifications.
* File uploads are outside the required scope.
* The current deployment is designed for the assessment environment rather than a multi-region production architecture.

## Technical Assessment Highlights

The implementation focuses on the major requirements of the assessment:

* React + TypeScript
* Node.js + Express + TypeScript
* PostgreSQL relational schema
* Prisma ORM
* API-level RBAC
* Ownership isolation
* JWT access/refresh authentication
* HttpOnly refresh cookies
* Socket.IO real-time communication
* Persistent activity history
* Missed-event recovery
* Persistent notifications
* node-cron overdue processing
* Server-side validation
* Structured errors
* Database indexing
* Seed data
* Vercel + Render deployment

## Repository

[GitHub Repository](https://github.com/chandrashekar271004/velozity-realtime-project-dashboard?utm_source=chatgpt.com)

## Live Demo

[Open Live Dashboard](https://velozity-dashboard-hazel.vercel.app/?utm_source=chatgpt.com)

## Submission Explanation

The hardest part of this implementation was designing the real-time activity feed while maintaining strict role-based data isolation. Socket.IO is used for authenticated real-time communication, while server-side authorization ensures that users receive only activity relevant to their role and ownership. Admin users can receive global activity, project managers receive activity from projects they own, and developers receive activity only for tasks assigned to them.

Task status changes are persisted in PostgreSQL together with the user, previous status, new status, and timestamp before the activity is broadcast. This makes the activity history durable rather than dependent on in-memory state.

Notifications are also persisted and delivered through Socket.IO. When users reconnect, the application retrieves up to the latest 20 missed role-visible activity events from PostgreSQL.

For a larger multi-instance deployment, I would introduce a Redis-backed Socket.IO adapter to share rooms and presence across backend instances. The current implementation keeps the architecture appropriate for the assessment while maintaining server-side authorization, persistence, and real-time communication.
