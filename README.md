# Hiring AI Suite — Backend

Production-grade Node.js / Express / TypeScript / Prisma / BullMQ backend for the Hiring AI Suite, a multi-tenant B2B SaaS for AI-powered hiring.

The companion frontend lives at https://github.com/ShouryaVeggalam/hiring-ai-suite

## Layout

| Path | Description |
|------|-------------|
| `backend/` | The Node.js / Express / TypeScript API + BullMQ workers |
| `render.yaml` | Render Blueprint that deploys `backend/` as a free Web Service running API + workers in one process |

## Modules

- **Auth** — register / login / refresh / forgot-password / reset-password, JWT + refresh cookie, RBAC (Admin / Recruiter / Hiring Manager / Viewer)
- **Jobs** — CRUD with org isolation
- **Screening** — resume upload → parse → AI score, single + batch flows
- **Questions** — interview question agent (technical / behavioral / skill gap / follow-up)
- **Comparison** — side-by-side candidate ranking
- **Batch** — bulk upload + ranked results
- **Exports** — CSV / Excel / PDF / JSON, queued generation, signed download URLs
- **Analytics** — overview, usage, per-job metrics
- **Notifications** — in-app + email + webhook fanout

## Stack

Express · TypeScript · Prisma · PostgreSQL · BullMQ · Redis · S3-compatible storage · JWT · Zod · Pino · Jest · Swagger · Docker · Helmet · CORS · pino-http

## Getting started

See [`backend/README.md`](./backend/README.md) for local setup, env variables, and deployment notes.

## Deploy

This repo is set up to deploy to **Render** via the included `render.yaml` Blueprint.
The recommended free-tier stack:

| Component | Service |
|-----------|---------|
| API + workers | Render (free Web Service) |
| Postgres | Neon |
| Redis | Upstash |
| Object storage | Cloudflare R2 |
| Frontend | Vercel |
