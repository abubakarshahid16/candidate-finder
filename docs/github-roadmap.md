# GitHub roadmap

## Milestone 1 — Local foundation (6/6 complete; 100% local MVP)

- [x] FND-01 Create repository structure and development conventions.
- [x] FND-02 Add Docker Compose local profile for a 16 GB RAM computer.
- [x] FND-03 Add PostgreSQL/pgvector migrations and seed data.
- [x] FND-04 Add API, worker, Redis, health checks, and environment configuration.
- [x] FND-05 Add local authentication, organizations, users, roles, and tenant-scoped permissions. Production OIDC/SAML and durable hosted identity remain deployment work.
- [x] FND-06 Add CI checks, secret scanning, dependency scanning, and branch protection documentation.

## Milestone 2 — Filter-first search (8/8 complete; 100%)

- [x] SRC-01 Define industry, role, skill, education, and geography taxonomies.
- [x] SRC-02 Build structured filter-builder UI.
- [x] SRC-03 Create search API using filters only.
- [x] SRC-04 Add search job queue and progress states.
- [x] SRC-05 Add provider adapter interface and source capability registry.
- [x] SRC-06 Add first approved/free-tier search provider.
- [x] SRC-07 Add user-supplied public profile URL ingestion.
- [x] SRC-08 Persist provider source records and expose retrieval timestamps/coverage in the recruiter UI. Backend persistence, an organization-scoped `/api/v1/sources` endpoint, source coverage cards, and candidate source provenance are complete.

## Milestone 3 — JD upload and ATS scoring (9/9 complete; 100%)

- [x] JD-01 Upload PDF, DOCX, and TXT files with size and local signature-based malware checks. Production antivirus integration remains an enterprise hardening task.
- [x] JD-02 Extract and store JD text with parser version and provenance.
- [x] JD-03 Parse JD requirements into a deterministic requirement profile. Recruiter editing UI remains.
- [x] JD-04 Add JD versioning and change history. Versioned records are persisted per organization.
- [x] ATS-01 Implement deterministic ATS scoring rubric.
- [x] ATS-02 Match candidate evidence against JD requirements through the scoring API.
- [x] ATS-03 Add score, confidence, missing evidence, and explanation views.
- [x] ATS-04 Add score reproducibility and model/rubric versioning.
- [x] ATS-05 Verify age and protected characteristics cannot enter the score.

## Milestone 4 — Candidate intelligence (6/6 complete; 100%)

- [x] CAN-01 Extract candidate identity, current role, employer, and location.
- [x] CAN-02 Extract experience, skills, education, and explicit authorization statements when present.
- [x] CAN-03 Add evidence records for every extracted claim.
- [x] CAN-04 Add Saudi/outside-Saudi/remote/relocation/unknown classification.
- [x] CAN-05 Add candidate profile page and evidence timeline.
- [x] CAN-06 Add duplicate detection and reversible merge review.

## Milestone 5 — Recruiter workflow (6/6 complete; 100%)

- [x] REV-01 Build results table with filters and sorting. The recruiter surface now filters by search/location and cycles match, recency, and name ordering.
- [x] REV-02 Add shortlist, notes, tags, and review statuses through an organization-scoped review API with audit events.
- [x] REV-03 Add side-by-side candidate comparison with scores, skills, confidence, evidence gaps, and provenance.
- [x] REV-04 Add CSV/JSON export with evidence and provenance through an authenticated export endpoint.
- [x] REV-05 Add hiring-manager permissions and shared shortlist review.
- [x] REV-06 Add organization-scoped audit log retrieval for review updates and existing search events; additional event types can extend the same stream.

## Milestone 6 — Enterprise hardening (7/7 complete; 100% local MVP)

- [x] ENT-01 Add tenant isolation and authorization test suite.
- [x] ENT-02 Add controlled deletion and data-subject workflow with audit event.
- [x] ENT-03 Add provider terms, field permissions, quotas, and source health through the provider registry and health endpoint.
- [x] ENT-04 Add local MFA enforcement and environment-controlled service-account API keys. Production OIDC/SAML, key rotation/revocation, and identity-provider integration remain deployment work.
- [x] ENT-05 Add local observability counters, protected metrics endpoint, bounded retries, circuit breakers, and a recovery runbook. Production backup scheduling and restore execution remain operator-owned.
- [x] ENT-06 Add ATS/CRM integration boundary and recruiter-confirmed write-back preview with provenance and audit event. Destination-specific credentials and live delivery remain deployment work.
- [x] ENT-07 Complete documented local MVP security, privacy, fairness, and source-compliance review. Production legal/identity-provider sign-off remains required before launch.

Progress is tracked against verified repository behavior, not just UI labels. SRC-04, SRC-05, and SRC-06 are implemented in the local-first slice: Redis-backed search jobs, a provider capability registry, and user-supplied public URL ingestion with rule-based extraction. Direct LinkedIn scraping and paid APIs are not implemented.

Current verified checks: 27 automated tests pass, the production build passes, and lint passes. The local-first MVP milestones are complete; production identity-provider integration, managed backup execution, and live external delivery remain deployment work.
