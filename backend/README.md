# HIRING AI SUITE — Backend

Production-grade Node.js / Express / TypeScript API for the HIRING AI SUITE B2B recruitment platform.

## Phase Status

**Phase 1** — Architecture, schema, Docker, health endpoints ✅

**Phase 2** — Authentication ✅

**Phase 3** — Resume screening, storage, queues ✅

**Phase 4** — Interview question agent ✅

**Phase 5** — Candidate comparison & batch screening ✅

**Phase 6** — Exports, analytics, notifications ✅

- Register (creates organization + admin user)
- Login / logout / refresh (JWT access + httpOnly refresh cookie)
- Forgot / reset password
- RBAC middleware (`authMiddleware`, `roleMiddleware`, `tenantMiddleware`)
- Audit logging for auth events

## Deployment (free tier)

Deployed to **Render** as a single Web Service that runs the HTTP API and the
BullMQ workers in one Node process (`npm run start:render`). See
`../render.yaml` at the repo root for the Blueprint definition.

Backing services on free tiers:
- **Neon** — Postgres (set `DATABASE_URL`)
- **Upstash** — Redis (set `REDIS_URL`, keep `REDIS_TLS=true`)
- **Cloudflare R2** — S3-compatible storage (set `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, region `auto`)

For cross-site cookie auth from the Vercel frontend, set:
```
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
CORS_ORIGINS=https://<your-vercel-app>.vercel.app
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker Desktop (optional, for local infra)

### Local development

```bash
cd backend
cp .env.example .env
# Edit JWT secrets in .env (min 16 characters)

# Start infrastructure
docker compose up -d postgres redis minio

npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

API: `http://localhost:4000/api/v1`  
Swagger: `http://localhost:4000/api-docs`  
Health: `http://localhost:4000/api/v1/health`

### Full stack via Docker

```bash
cp .env.example .env
docker compose up --build
```

## Project Structure

See [docs/STRUCTURE.md](./docs/STRUCTURE.md) for a file-by-file guide.

## Documentation

- [Architecture](./docs/architecture.md)
- [Database](./docs/database.md)
- [OpenAPI stub](./docs/openapi.yaml)

## Auth API (`/api/v1/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Create org + admin |
| POST | `/auth/login` | No | Login |
| POST | `/auth/refresh` | Cookie/body | New access token |
| POST | `/auth/logout` | Bearer | Logout |
| POST | `/auth/forgot-password` | No | Request reset |
| POST | `/auth/reset-password` | No | Set new password |
| GET | `/auth/me` | Bearer | Current user |

Refresh token is set as **httpOnly cookie** (`refreshToken`). Access token is returned in JSON.

## Screening API (`/api/v1`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/screening/upload` | Admin, Recruiter, HM | Upload PDF/DOCX (`file` field) |
| POST | `/screening/run` | Admin, Recruiter, HM | Queue AI screening `{ resumeId, jobId }` |
| GET | `/screening/:id` | Any | Screening + result |
| GET | `/screening/results` | Any | List screenings (filter by `jobId`, `status`) |
| DELETE | `/screening/:id` | Admin, Recruiter | Delete screening |
| GET | `/screening/resume/:resumeId/download` | Any | Signed download URL |

## Jobs API (`/api/v1/jobs`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/jobs` | Create job posting |
| GET | `/jobs` | List jobs |
| GET | `/jobs/:id` | Get job |

### Run workers (required for parsing & screening)

```bash
npm run worker
```

Use `STORAGE_DRIVER=local` for dev without MinIO.

## Questions API (`/api/v1`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/questions/generate` | Admin, Recruiter, HM | Queue question generation |
| GET | `/questions/:id` | Any | Get question set + status |
| POST | `/questions/export` | Admin, Recruiter, HM | Export as JSON or CSV |

Generate body example:

```json
{
  "jobId": "clxxx",
  "resumeId": "clyyy",
  "candidateId": "clzzz"
}
```

Or ad-hoc: `{ "jobDescription": "...", "jobTitle": "...", "skills": ["Node.js"] }`

Poll `GET /questions/:id` until `status` is `COMPLETED`.

## Comparison API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/comparison` | Compare 2–10 candidates `{ candidateIds, jobId? }` |
| GET | `/comparison/:id` | Comparison result + winner |

## Batch screening API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/batch/upload` | Multipart `files[]` + `jobId` |
| POST | `/batch/run` | `{ "batchId": "..." }` — screen all parsed resumes |
| GET | `/batch/:id` | Batch status + uploaded resumes |
| GET | `/batch/:id/results` | Ranked/filtered screenings (`minScore`, `verdict`, `search`) |
| GET | `/batch/results?batchId=` | Same as above (query param) |

## Export API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/export/csv` | Queue CSV export |
| POST | `/export/excel` | Queue Excel export |
| POST | `/export/pdf` | Queue PDF export |
| GET | `/export/:id` | Status + signed download URL |
| GET | `/export/history` | List past exports |

Body: `{ "resourceType": "screenings|candidates|question_set|batch", "filters": { ... } }`

## Analytics API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/overview` | Uploads, screenings, success rate, avg processing time |
| GET | `/analytics/usage` | Monthly usage metrics (`?period=2026-05`) |
| GET | `/analytics/jobs` | Per-job screening stats |

## Notifications API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | In-app notification history |
| PATCH | `/notifications/:id/read` | Mark as read |

Channels: in-app, email (console in dev), webhook (`ORG_WEBHOOK_URL` + `WEBHOOK_SIGNING_SECRET`).

## Backend complete

All planned phases (1–6) are implemented. Run `npm run prisma:migrate` after pulling schema changes.
