# Deployment

## PostgreSQL
Use Neon/Supabase/Railway PostgreSQL and set `DATABASE_URL`.

## API
Deploy `backend` to Render/Railway/Fly as a Docker or Node service.
Set `DATABASE_URL`, `CLIENT_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_TTL=15m`, `REFRESH_TOKEN_TTL_DAYS=7`, `NODE_ENV=production`.
Run migrations before starting: `npx prisma migrate deploy`.

## Frontend
Deploy `frontend` to Vercel. Set `VITE_API_URL=https://YOUR-API/api` and `VITE_SOCKET_URL=https://YOUR-API`.

## Important
The browser must use the API's HTTPS URL in production because the refresh cookie is `Secure` and cross-site `SameSite=None`.
