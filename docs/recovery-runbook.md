# Candidate Finder recovery runbook

## Scope

This runbook covers the local-first PostgreSQL, Redis, API, and worker profile. It is an operational checklist, not a substitute for provider-specific backup guarantees.

## Before an incident

- Keep `DATABASE_URL`, provider credentials, and authentication secrets outside the repository.
- Take scheduled PostgreSQL backups and test restoring them into an isolated database.
- Treat Redis as a queue/cache layer; preserve PostgreSQL as the system of record before production rollout.
- Monitor `/health`, `/ready`, `/metrics`, provider health, queue depth, and worker error counters.

## Recovery sequence

1. Declare the incident and record the UTC start time.
2. Check API and worker health, then inspect PostgreSQL and Redis connectivity.
3. If Redis is unavailable, pause new searches and preserve queued job payloads before restarting it.
4. Restore PostgreSQL from the most recent verified backup when data loss is suspected.
5. Start Redis, API, and worker in that order; confirm readiness before accepting searches.
6. Re-run a synthetic search, a JD parse, an ATS score, and a provenance lookup.
7. Review audit events and provider health before closing the incident.

## Backup acceptance criteria

- Restore completes in an isolated environment.
- Organization, candidate, evidence, JD version, and audit records are present.
- Tenant-isolation and authorization tests pass after restore.
- The recovery timestamp and backup identifier are recorded with the incident.
