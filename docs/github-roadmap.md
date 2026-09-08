# GitHub roadmap

## Milestone 1 — Local foundation

- FND-01 Create repository structure and development conventions.
- FND-02 Add Docker Compose local profile for a 16 GB RAM computer.
- FND-03 Add PostgreSQL/pgvector migrations and seed data.
- FND-04 Add API, worker, Redis, health checks, and environment configuration.
- FND-05 Add authentication, organizations, users, and roles.
- FND-06 Add CI checks, secret scanning, dependency scanning, and branch protection documentation.

## Milestone 2 — Filter-first search

- SRC-01 Define industry, role, skill, education, and geography taxonomies.
- SRC-02 Build structured filter-builder UI.
- SRC-03 Create search API using filters only.
- SRC-04 Add search job queue and progress states.
- SRC-05 Add provider adapter interface and source capability registry.
- SRC-06 Add first approved/free-tier search provider.
- SRC-07 Add user-supplied public profile URL ingestion.
- SRC-08 Add source links, retrieval timestamps, blocked-source handling, and coverage reporting.

## Milestone 3 — JD upload and ATS scoring

- JD-01 Upload PDF, DOCX, and TXT files with size and virus checks.
- JD-02 Extract and store JD text with parser version and provenance.
- JD-03 Parse JD requirements into an editable requirement profile.
- JD-04 Add JD versioning and change history.
- ATS-01 Implement deterministic ATS scoring rubric.
- ATS-02 Match candidate evidence against JD requirements.
- ATS-03 Add score, confidence, missing evidence, and explanation views.
- ATS-04 Add score reproducibility and model/rubric versioning.
- ATS-05 Verify age and protected characteristics cannot enter the score.

## Milestone 4 — Candidate intelligence

- CAN-01 Extract candidate identity, current role, employer, and location.
- CAN-02 Extract experience, skills, education, and explicit authorization statements.
- CAN-03 Add evidence records for every extracted claim.
- CAN-04 Add Saudi/outside-Saudi/remote/relocation/unknown classification.
- CAN-05 Add candidate profile page and evidence timeline.
- CAN-06 Add duplicate detection and reversible merge review.

## Milestone 5 — Recruiter workflow

- REV-01 Build results table with filters and sorting.
- REV-02 Add shortlist, notes, tags, and review statuses.
- REV-03 Add side-by-side candidate comparison.
- REV-04 Add CSV/JSON export with evidence and provenance.
- REV-05 Add hiring-manager permissions and shared shortlist review.
- REV-06 Add audit log for searches, views, merges, scores, and exports.

## Milestone 6 — Enterprise hardening

- ENT-01 Add tenant isolation and authorization test suite.
- ENT-02 Add retention, deletion, and data-subject workflows.
- ENT-03 Add provider terms, field permissions, quotas, and source health.
- ENT-04 Add SSO/MFA and service-account API keys.
- ENT-05 Add observability, retries, circuit breakers, backups, and recovery runbook.
- ENT-06 Add ATS/CRM integration and recruiter-confirmed write-back.
- ENT-07 Complete security, privacy, fairness, and source-compliance review.
