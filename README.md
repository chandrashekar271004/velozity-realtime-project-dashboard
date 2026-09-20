# Velozity Global Solutions — Real-Time Client Project Dashboard

Full-stack technical hiring assessment implementation.

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + Prisma
- Real-time: Socket.IO
- Background jobs: node-cron
- Validation: Zod
- Auth: short-lived JWT access token + rotating refresh token in HttpOnly cookie

## Architecture
`React/Vercel -> Express/Render -> PostgreSQL`
`React <-> Socket.IO/Render`

Vercel is used for the React application. The long-lived Socket.IO/API process is deployed separately to a Node-compatible host (Render/Railway/Fly.io); Vercel serverless functions are not used for the WebSocket server.

## Local setup
1. Copy `backend/.env.example` to `backend/.env`.
2. Start PostgreSQL: `docker compose up -d postgres`.
3. `npm install && npm --prefix backend install && npm --prefix frontend install`.
4. `npm --prefix backend run prisma:generate`.
5. `npm --prefix backend run prisma:migrate`.
6. `npm run seed`.
7. `npm run dev`.

Frontend: http://localhost:5173
API: http://localhost:5000/api
Health: http://localhost:5000/health

## Seed accounts
All seeded accounts use password `Password@123`.
- admin@velozity.local
- pm1@velozity.local
- pm2@velozity.local
- dev1@velozity.local through dev4@velozity.local

## Database/index decisions
Foreign keys enforce ownership and assignment relationships. Indexes cover user role, project owner, project/client, task project/assignee/status/priority/due date, activity project/task/createdAt, notifications recipient/read state, and refresh-token lookup. This supports the dashboard filters, overdue job, role-scoped activity queries and notification badge queries.

## Security
- Access tokens are returned in JSON and kept in frontend memory only.
- Refresh tokens are random opaque values stored hashed in PostgreSQL and sent in an HttpOnly, Secure-in-production cookie.
- Every protected REST route authenticates and authorizes on the API.
- Ownership and assignment are checked server-side before project/task/activity access.
- Zod validates request bodies/query parameters.
- Helmet, CORS, rate limiting, parameterized Prisma queries and structured errors are enabled.

## WebSocket design
Socket.IO was selected for reliable browser reconnection, rooms and presence primitives. Server-side socket authorization mirrors REST authorization. Admin sockets receive the global activity stream; PM sockets receive only owned-project events; developers receive only events for tasks assigned to them. Project viewers join project rooms, while developers join task rooms so another developer's task activity cannot leak.

On reconnect, the client sends its last seen activity timestamp to `/activity/missed`; the server queries PostgreSQL for up to 20 missed, role-visible events. No missed-event state depends on process memory.

## Background job
node-cron runs every minute and marks tasks with due dates in the past as `OVERDUE`. It writes an activity entry only when the task transitions into overdue, avoiding duplicate history rows.

## API groups
- `/api/auth`
- `/api/users`
- `/api/clients`
- `/api/projects`
- `/api/tasks`
- `/api/activity`
- `/api/notifications`
- `/api/dashboard`

## Known limitations
- Presence is process-local; production multi-instance deployment should use a shared Socket.IO adapter (Redis) for cross-instance presence/rooms.
- Email/push delivery is intentionally outside this assessment; notifications are in-app and persisted.
- File uploads are not part of the required scope.
