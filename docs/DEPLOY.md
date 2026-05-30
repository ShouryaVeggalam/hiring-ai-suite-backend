# Deploy Hiring AI Suite (free tier)

Stack: **Vercel** (frontend) + **Render** (API + workers) + **Neon** (Postgres) + **Upstash** (Redis) + **Cloudflare R2** (files).

Estimated time: **15–20 minutes** once accounts exist.

---

## Step 0 — Push the backend to GitHub

1. Create an **empty** repo: https://github.com/new  
   - Name: `hiring-ai-suite-backend` (recommended)  
   - **Do not** add README, .gitignore, or license.

2. From your machine (folder `hiring-ai-suite`):

```powershell
cd C:\Users\mudda\Projects\hiring-ai-suite
git remote add origin https://github.com/ShouryaVeggalam/hiring-ai-suite-backend.git
git push -u origin main
```

(If `origin` already exists, run `git remote set-url origin https://github.com/ShouryaVeggalam/hiring-ai-suite-backend.git` first.)

---

## Step 1 — Neon (Postgres)

1. Neon dashboard → **Create project** → copy the connection string.
2. Use the **pooled** URL if offered (good for serverless/Render).
3. It looks like:  
   `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

Save as **`DATABASE_URL`**.

---

## Step 2 — Upstash (Redis)

1. Upstash → **Create database** → region close to Render (e.g. US-West).
2. Copy the **TLS** URL (`rediss://...`) — not the plain `redis://` one.

Save as **`REDIS_URL`** and set **`REDIS_TLS=true`** (already in `render.yaml`).

---

## Step 3 — Cloudflare R2

1. Cloudflare dashboard → **R2** → **Create bucket** (e.g. `hiring-ai-suite-prod`).
2. **Manage R2 API tokens** → Create token with **Object Read & Write** on that bucket.
3. Note:
   - **Endpoint**: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
   - **Access Key ID** and **Secret Access Key**
   - **Bucket name**

Set in Render:

| Variable | Example |
|----------|---------|
| `STORAGE_DRIVER` | `s3` (default in blueprint) |
| `S3_ENDPOINT` | `https://abc123.r2.cloudflarestorage.com` |
| `S3_ACCESS_KEY_ID` | from token |
| `S3_SECRET_ACCESS_KEY` | from token |
| `S3_BUCKET` | `hiring-ai-suite-prod` |
| `S3_REGION` | `auto` (already set) |
| `S3_FORCE_PATH_STYLE` | `true` (already set) |

---

## Step 4 — Render (backend)

1. https://dashboard.render.com → **New** → **Blueprint**.
2. Connect GitHub → select **`hiring-ai-suite-backend`** repo.
3. Render detects `render.yaml` at repo root → **Apply**.
4. When prompted, set **sync: false** secrets:

| Variable | How to get it |
|----------|----------------|
| `DATABASE_URL` | Neon connection string |
| `REDIS_URL` | Upstash `rediss://...` URL |
| `JWT_ACCESS_SECRET` | Random 32+ chars (e.g. `openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | Different random 32+ chars |
| `WEBHOOK_SIGNING_SECRET` | Random 32+ chars |
| `S3_ENDPOINT` | R2 endpoint |
| `S3_ACCESS_KEY_ID` | R2 token |
| `S3_SECRET_ACCESS_KEY` | R2 token |
| `S3_BUCKET` | Bucket name |
| `APP_URL` | After deploy: `https://hiring-ai-suite-api.onrender.com` (your actual URL) |
| `CORS_ORIGINS` | After Vercel deploy: `https://your-app.vercel.app` |

5. Wait for deploy → open `https://<your-service>.onrender.com/api/v1/health` → should return JSON `ok`.

6. Go back to Render → **Environment** → set `APP_URL` to your exact Render URL if you used a placeholder.

---

## Step 5 — Vercel (frontend)

Frontend repo: https://github.com/ShouryaVeggalam/hiring-ai-suite

1. https://vercel.com → **Add New Project** → import **`hiring-ai-suite`**.
2. Framework: **Other** (static). Root: `.` (repo root). Build: leave empty. Output: `.`
3. Deploy.

4. Point the frontend at your API — add this **before** `scripts/config.js` on every page, or only on `pages/login.html` and rely on localStorage from Settings:

Edit `index.html` (and optionally all `pages/*.html`) — insert in `<head>` or before config:

```html
<script>
  window.__HIRING_AI_API_URL__ = 'https://YOUR-SERVICE.onrender.com/api/v1';
</script>
```

Commit and push; Vercel redeploys.

**Or** after first login: **Settings** → change API URL → Save (stored in `localStorage`).

5. In **Render**, set `CORS_ORIGINS` to your Vercel URL (comma-separated if multiple):

```
https://hiring-ai-suite.vercel.app
```

Redeploy Render if needed.

---

## Step 6 — Smoke test

1. Open `https://your-app.vercel.app/pages/login.html`
2. **Create account** (org + email + password with upper/lower/number).
3. **Upload** → create a job → upload a PDF → wait for screening.
4. **Results** → see list / detail.

---

## JWT secrets (quick generate)

PowerShell:

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```

Run three times for access, refresh, and webhook secrets.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| CORS error in browser | `CORS_ORIGINS` must exactly match Vercel URL (no trailing slash) |
| 401 on every request | Clear site data / re-login; check cookies (`COOKIE_SECURE=true`, `COOKIE_SAME_SITE=none`) |
| Upload works but file missing later | R2 credentials wrong or `STORAGE_DRIVER` not `s3` |
| Screening stuck on Processing | Redis URL wrong; workers need `REDIS_URL` + `rediss://` |
| Render build fails | Check build logs; ensure Node 20+ |

---

## Repo map

| Repo | Hosts |
|------|--------|
| `ShouryaVeggalam/hiring-ai-suite` | Frontend (Vercel) |
| `ShouryaVeggalam/hiring-ai-suite-backend` | Backend (Render) |
