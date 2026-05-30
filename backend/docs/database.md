# Database Design

## ER Diagram

```mermaid
erDiagram
    Organization ||--o| Subscription : has
    Organization ||--{ User : employs
    Organization ||--{ Team : contains
    Organization ||--{ Job : posts
    Organization ||--{ Candidate : tracks
    Organization ||--{ Resume : stores
    Organization ||--{ Screening : runs
    Organization ||--{ QuestionSet : generates
    Organization ||--{ Comparison : creates
    Organization ||--{ Export : exports
    Organization ||--{ Notification : sends
    Organization ||--{ AuditLog : audits
    Organization ||--{ ActivityLog : logs
    Organization ||--{ APIKey : issues
    Organization ||--{ Usage : meters

    Team ||--{ TeamMember : has
    User ||--{ TeamMember : joins

    Candidate ||--o{ Resume : has
    Resume ||--|| ResumeFile : file

    Job ||--o{ Screening : targets
    Resume ||--o{ Screening : screened
    Screening ||--o| ScreeningResult : produces

    Job ||--o{ QuestionSet : questions
    Candidate ||--o{ QuestionSet : questions

    Comparison ||--o{ ComparisonCandidate : includes
    Candidate ||--o{ ComparisonCandidate : compared
```

## Indexing Strategy

| Query pattern | Index |
|---------------|-------|
| List by org, newest first | `(organizationId, createdAt)` |
| Screenings by status | `(organizationId, status)` |
| Rank by score for job | `(organizationId, jobId, matchScore)` |
| Batch operations | `(batchId)` |
| User login | `(organizationId, email)` UNIQUE |

## Soft Delete

`deletedAt` on Organization (optional), User, Job, Candidate, Resume. Repositories exclude `deletedAt IS NOT NULL` by default.

## JSON vs Scalar

- **JSON**: AI payloads (`parsedData`, `skillMatch`, question arrays)
- **Scalars**: `matchScore`, `verdict`, `status` for sorting and filters

## Migrations

```bash
cd backend
cp .env.example .env
npm run prisma:migrate
npm run seed
```
