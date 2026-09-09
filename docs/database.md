# Local database

The local database uses PostgreSQL 16 with the `vector` extension from `pgvector`. The schema is migration-first and all seed records are synthetic; no real candidate personal information is included.

## Schema

`db/migrations/001_initial.sql` creates the first release entities:

- Organizations and users
- Requisitions and job-description versions
- Candidates, sources, evidence, skills, experience, and education
- Reproducible scores
- Shortlists and shortlist items
- Audit events

Location is represented independently through `location_classification`, `current_city`, `current_country`, `relocation_statement`, and `remote_statement`. Nationality and age/DOB are intentionally absent.

## Apply locally

Start PostgreSQL with `docker compose` as described in [local-development.md](local-development.md), then apply the migration and seed scripts:

```powershell
Get-Content db/migrations/001_initial.sql | docker compose -f docker-compose.local.yml exec -T postgres psql -U candidate_finder -d candidate_finder
Get-Content db/seed/001_synthetic.sql | docker compose -f docker-compose.local.yml exec -T postgres psql -U candidate_finder -d candidate_finder
```

The Compose init directory is mounted for inspection and future migrations. The migration commands above are explicit and repeatable only against a fresh database; future releases should add a migration ledger before applying multiple versions automatically.

## Verify the seed

```powershell
docker compose -f docker-compose.local.yml exec -T postgres psql -U candidate_finder -d candidate_finder -c "SELECT count(*) AS candidates FROM candidates; SELECT location_classification, count(*) FROM candidates GROUP BY location_classification ORDER BY location_classification; SELECT extname FROM pg_extension WHERE extname = 'vector';"
```

Expected candidate count is `4`, with Saudi Arabia, outside Saudi Arabia, remote, and unknown represented once each. The vector extension query should return one row.

Search jobs are stored in Redis for this local-first slice, not PostgreSQL. PostgreSQL remains the source for organizations, candidates, evidence, and audit records.
