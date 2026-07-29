# Deployment Guide

## Backend on Render

**Option A — Blueprint (recommended):** In Render, choose **New +** → **Blueprint**,
point it at this repo — it will read `backend/render.yaml` and provision the
service automatically (build/start commands and health check path are
pre-configured). You'll still need to fill in `MONGO_URI` and `CLIENT_ORIGIN`
since those are secrets/environment-specific (`sync: false` in the blueprint).

**Option B — Manual:**
1. Push this repo to GitHub.
2. In Render, create a new **Web Service** pointed at the repo, root directory `backend`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables (Render → Environment):
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a long random string
   - `JWT_EXPIRES_IN` — e.g. `7d`
   - `CLIENT_ORIGIN` — your deployed frontend URL (e.g. `https://cgl-dashboard.vercel.app`)
   - `NODE_ENV` — `production`
6. Deploy. Once live, run the seed script once via Render's Shell tab:
   ```bash
   npm run seed
   ```
7. Note the deployed API URL, e.g. `https://cgl-dashboard-api.onrender.com`.

The service exposes `GET /api/health` for Render's health check, and ships
with `helmet` (security headers), gzip `compression`, and a rate limiter on
`/api/auth/login` (20 attempts / 15 min per IP) already wired in.

## Frontend on Vercel

`frontend/vercel.json` is already configured with the Vite build command,
output directory, and an SPA rewrite (so refreshing `/dashboard` or any other
client-side route doesn't 404).

1. In Vercel, import the same repo, set **root directory** to `frontend`.
2. Framework preset: Vite (auto-detected from `vercel.json`).
3. Add environment variable:
   - `VITE_API_URL` = your Render backend URL from above
4. Deploy.

## MongoDB Atlas

1. Create a free cluster at https://www.mongodb.com/cloud/atlas.
2. Database Access → add a user with a strong password.
3. Network Access → add `0.0.0.0/0` (or your deployment provider's IP ranges) so Render can connect.
4. Clusters → Connect → Drivers → copy the connection string, replace
   `<username>`, `<password>`, and add a database name, e.g.:
   ```
   mongodb+srv://cgluser:<password>@cluster0.xxxxx.mongodb.net/cgl_dashboard?retryWrites=true&w=majority
   ```
5. Paste this into `backend/.env` as `MONGO_URI` (and into Render's environment variables for production).

## Post-deploy checklist

- [ ] Backend `/api/health` returns `{ "status": "ok" }`
- [ ] `npm run seed` has been run against the production database at least once
- [ ] Frontend `VITE_API_URL` points at the live backend
- [ ] CORS: backend `CLIENT_ORIGIN` matches the deployed frontend origin exactly
- [ ] Login works with a seeded demo account, then change/rotate those passwords
- [ ] As an Admin user, `/audit-logs` loads and shows recent activity (confirms the audit logger + MongoDB write path both work end-to-end)
