# HIRING AI SUITE — Architecture

## Overview

HIRING AI SUITE is a multi-tenant B2B SaaS backend for AI-powered recruitment. The API is stateless; async work runs in BullMQ workers backed by Redis. Files live in S3-compatible storage. PostgreSQL holds all tenant data via Prisma.

## Layered Architecture

```
HTTP Request
    → Middleware (security, auth, tenant, validation)
    → Controller (HTTP adapter)
    → Service (business logic)
    → Repository (Prisma, org-scoped)
    → PostgreSQL
```

External systems are accessed only through adapters:

- **providers/** — AI (screening, questions, comparison)
- **storage/** — S3 uploads and signed URLs
- **exports/** — CSV, Excel, PDF
- **providers/email, webhook** — notifications

## Multi-Tenancy

Every tenant-scoped table includes `organizationId`. After JWT validation, `tenantMiddleware` sets `req.tenant.organizationId`. Repositories always filter by this ID.

## Async Processing

| Queue | Purpose |
|-------|---------|
| `resume-processing` | Parse PDF/DOCX, extract text |
| `screening` | Run AI screening vs job |
| `question-generation` | Interview question sets |
| `comparison` | Compare candidates |
| `export` | Generate export files |

Statuses: `PENDING` → `PROCESSING` → `COMPLETED` | `FAILED`

## AI Provider Strategy

`AI_PROVIDER` env selects implementation (`mock` | `openai`). Services depend on interfaces (`IScreeningProvider`, etc.), never concrete SDKs.

## Security

- Helmet, CORS, rate limiting
- JWT access + refresh (Phase 2)
- RBAC: Admin, Recruiter, Hiring Manager, Viewer
- AuditLog for security events; ActivityLog for product feed

## Observability

- Pino structured logging + request ID
- `/api/v1/health`, `/api/v1/health/ready`, `/api/v1/metrics`
- Swagger at `/api-docs` when enabled

## Deployment Topology

```
                    ┌─────────────┐
                    │   Load      │
                    │   Balancer  │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
      ┌─────────┐    ┌─────────┐    ┌─────────┐
      │ API (N) │    │ Worker  │    │ Worker  │
      └────┬────┘    └────┬────┘    └────┬────┘
           │              │              │
           └──────────────┼──────────────┘
                          ▼
              ┌───────────────────────┐
              │ PostgreSQL │ Redis │ S3 │
              └───────────────────────┘
```

## Phase Roadmap

| Phase | Scope |
|-------|--------|
| 1 | Architecture, schema, Docker, config ✅ |
| 2 | Authentication & RBAC |
| 3 | Resume screening + storage + queues |
| 4 | Interview questions |
| 5 | Comparison & batch screening |
| 6 | Exports, analytics, notifications |
| 7 | Tests & hardening |
