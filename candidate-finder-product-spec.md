Exit code: 0
Wall time: 0.4 seconds
Total output lines: 783
Output:
# Candidate Finder â€” Build-Ready Product Specification

**Document status:** Build-ready v1.1  
**Target:** An enterprise candidate-finding product, delivered through a focused first release  
**Primary market:** Saudi Arabia and international recruiting teams  
**Core principle:** Discover and rank publicly available professional information responsibly, with human review and evidence attached to every material claim.

---

## 1. Product brief

Candidate Finder is an enterprise talent-discovery platform. Its primary job is to find relevant candidates from the public internet and approved data providers, unify their professional profiles, rank them against a role, and give recruiters an evidence-backed shortlist they can act on.

This is not merely a search form or an ATS plug-in. It is a candidate intelligence layer that sits before the ATS: it turns a hiring requirement into a search strategy, searches multiple permitted sources, resolves duplicate identities, verifies job-relevant facts, ranks candidates, and maintains a traceable candidate record. The ATS remains the system of record for applicants and hiring workflow; Candidate Finder is the system of discovery and sourcing.

### Product promise

> Describe the person you need, and Candidate Finder finds the best publicly discoverable matches, explains why they match, shows where every fact came from, and lets a recruiting team turn the results into a governed shortlist.

### What â€œenterpriseâ€ means in this product

- Multi-tenant organization and business-unit separation.
- Multiple recruiters working on requisitions with ownership, approvals, and shared shortlists.
- Source/provider governance, contracts, usage limits, and regional controls.
- Explainable ranking with reproducible scores and model/version history.
- Security, retention, deletion, audit, SSO, RBAC, and export controls.
- API and ATS/CRM integration so discovery becomes part of an existing recruiting stack.
- Operational reliability: queues, retries, monitoring, partial-result handling, and source health.
- Configurable taxonomies, scoring policies, languages, and compliance settings.

The product should:

- Discover candidates from indexed public web pages, permitted provider APIs, public portfolios, publications, professional directories, and user-supplied URLs.
- Accept LinkedIn profile URLs or public LinkedIn identifiers where access and use are lawful and permitted by the source's terms.
- Separate Saudi Arabia from outside Saudi Arabia as an explicit location dimension.
- Filter by industry, experience, profession/role, current role, skills, education, and other job-relevant criteria.
- Calculate an explainable AI-assisted ATS score against a job description.
- Preserve source links, evidence snippets, confidence, timestamps, and provenance.
- Deduplicate profiles and show why records were merged.
- Support shortlist, notes, tags, review status, export, and audit logs.

### Product boundaries

- Automated hiring, rejection, or interview decisions. Candidate Finder recommends; authorized people decide.
- Contact scraping, email harvesting, or unsolicited outreach automation.
- Circumventing authentication, paywalls, bot controls, robots directives, rate limits, or technical access restrictions.
- Inferring sensitive or protected characteristics.
- Inferring age from photos, graduation dates, career timelines, names, or other proxies.

---

## 2. Product principles and guardrails

1. **Evidence before assertion.** Every extracted fact has a source URL, excerpt or structured citation, retrieval time, and confidence.
2. **Human-in-the-loop.** AI recommendations assist a recruiter; they do not make employment decisions.
3. **Job relevance only.** Score criteria that are defined in the job requirement and defensible for the role.
4. **No protected-trait inference.** Do not infer age, gender, race, ethnicity, religion, disability, family status, health, or similar attributes.
5. **Lawful public data only.** Publicly visible does not automatically mean unrestricted for collection or employment use. Apply jurisdictional privacy, employment, and data-transfer requirements.
6. **Saudi-specific clarity.** â€œSaudi Arabia,â€ â€œoutside Saudi Arabia,â€ â€œwilling to relocate,â€ and â€œremote/unknownâ€ are separate valuesâ€”not assumptions.
7. **Explainability.** A recruiter can see the score components, missing evidence, conflicts, and model version.
8. **Fairness monitoring.** Measure false-positive/false-negative patterns by legitimate business segments and geography; never create prohibited proxy segments.

### Age and date of birth policy

Age is not a default filter, ranking feature, or ATS-score input. The system must not calculate age from birth year, photos, education dates, or work history. If date of birth or age is explicitly public, the user has a documented lawful need, and policy permits processing, show it only as an optional non-ranking field with a prominent compliance warning, access logging, retention controls, and no export by default. Prefer not collecting it at all.

---

## 3. Personas and primary workflow

### Recruiter workflow

1. Create a requisition or start directly from the Candidate Finder search screen.
2. Select structured filters for role, skills, industry, experience, location, education, and other permitted criteria.
3. Optionally upload a job description file, paste its text, or write a prompt to pre-fill the filters and calculate ATS relevance.
4. Review and edit the structured criteria; the recruiter controls the final search criteria.
5. Run public-web/provider discovery and optionally add profile URLs.
6. Review candidate cards with score, evidence, confidence, location classification, and source links.
7. Apply filters, compare candidates, inspect conflicts, and shortlist.
8. Add notes and review status; export a CSV/XLSX/PDF or JSON evidence package.

### Hiring manager workflow

View a permissioned shortlist, compare job-relevant evidence, leave feedback, and request changes to requirements. Hiring managers cannot silently alter source evidence or audit history.

### Compliance/admin workflow

Configure approved providers, retention, regions, access roles, model versions, consent/contact policies, deletion requests, and audit reports.

---

## 4. Functional requirements

### 4.1 Candidate discovery

Inputs:

- Structured filters (the primary and complete search experience).
- Job description file or pasted text (optional shortcut for pre-filling filters and ATS scoring).
- Natural-language prompt (optional convenience layer for translating a request into filters).
- Public profile URLs, including LinkedIn URLs/IDs supplied by the user.
- Optional approved provider/source selection.

Job description behavior:

- Accept PDF, DOCX, TXT, and pasted text in the first production release.
- Extract title, responsibilities, must-have skills, preferred skills, experience, industry, location, education, certifications, and explicit work-authorization requirements.
- Show extracted requirements in an editable review screen before using them for search or scoring.
- Preserve the original file, extracted text, parser version, uploader, and timestamp according to retention policy.
- Create a versioned requisition profile so score changes remain reproducible when the job description changes.
- Never use age, gender, nationality, or other protected characteristics from a job description as ranking criteria.
- Enforce file type and size limits, virus-scan uploads, report extraction failures, and allow manual text entry when parsing fails.

Discovery behavior:

- Search only configured, lawful sources and indexed public pages.
- Normalize URLs and source identifiers.
- Prefer canonical profile pages over snippets.
- Fetch only fields required for the stated recruiting purpose.
- Return source coverage and â€œnot found/insufficient evidenceâ€ states rather than filling gaps with guesses.
- Display freshness and retrieval time.

### 4.2 Filters

| Filter | MVP behavior | Notes |
|---|---|---|
| Industry | Multi-select plus include/exclude | Use controlled taxonomy with source label preserved |
| Experience | Minimum/maximum years; exact/estimated/unknown | Explain calculation and uncertainty |
| Preferred location | Saudi Arabia / outside Saudi Arabia / remote / willing to relocate / unknown | Never equate nationality with location |
| Country/city | Multi-select | Store current, preferred, and source-reported locations separately |
| Profession/role | Controlled role taxonomy plus keyword | Map synonyms, show original title |
| Current role | Current title, seniority, employer, recency | Mark stale if last evidence is old |
| Skills | Must-have, should-have, exclude; AND/OR | Evidence required for â€œverifiedâ€ |
| Education | Degree, field, institution, level | Do not treat school prestige as an unrequested proxy |
| Work authorization | Explicitly stated only | Country-specific; unknown is valid |
| Nationality | Optional display/filter only when explicitly/publicly provided and legally appropriate | Never infer from name, language, or location |
| Availability | Explicitly stated only | No assumptions from employment gaps |
| Age/DOB | Hidden/off by default; never ranking | See compliance policy above |

### 4.3 Candidate profile

Show:

- Name and professional headline.
- Current role and employer, with evidence and freshness.
- Location classification: current, preferred, Saudi/outside/unknown, and relocation/remote statement.
- Experience summary and calculation basis.
- Skills grouped by must-have/should-have/other, with evidence.
- Education and certifications.
- Work authorization or nationality only when explicitly stated and permitted.
- ATS score, score breakdown, confidence, missing evidence, and conflicts.
- Source links, source type, retrieval date, and excerpts.
- Deduplication/merge history.
- Notes, tags, status, owner, and activity history.

### 4.4 Ranking and shortlist

- Sort by ATS score, evidence confidence, experience match, location match, newest evidence, or manual order.
- Never rank by age or inferred protected characteristics.
- Shortlist statuses: New, Reviewed, Shortlisted, Maybe, Rejectedâ€”reason required for rejection where policy requires it.
- Bulk actions require confirmation and log actor, timestamp, and affected records.
- Export includes a â€œdata provenanceâ€ sheet and a disclaimer that AI scores are advisory.

---

## 5. Recommended architecture

```text
Web app (Next.js)
        |
API gateway / auth / rate limits
        |
Candidate service ---- Search orchestration ---- Source adapters
        |                         |                    |
Postgres + pgvector       Queue/workers        Provider APIs/public pages
        |
Evidence store + audit log + encrypted object storage
        |
LLM extraction, embeddings, scoring, policy and quality checks
```

### Recommended stack

- **Frontend:** Next.js, TypeScript, Tailwind, accessible component library.
- **API:** TypeScript with Fastify or NestJS; OpenAPI-generated client.
- **Database:** PostgreSQL; pgvector for semantic retrieval; PostGIS optional for geography.
- **Queue:** Redis/BullMQ or a managed queue for crawling, extraction, deduplication, and rescoring.
- **Object storage:** S3-compatible encrypted storage for permitted raw snapshots/evidence artifacts.
- **Search:** PostgreSQL full-text + vector search first; OpenSearch only when scale requires it.
- **AI:** Structured-output LLM for extraction and explanation; embedding model for semantic retrieval; deterministic scoring service for final score.
- **Auth:** OIDC/SAML SSO, MFA, RBAC, organization-level tenant isolation.
- **Observability:** OpenTelemetry, centralized logs, metrics, trace IDs, error monitoring.
- **Deployment:** Managed Postgres/Redis/object storage with regional deployment options and infrastructure-as-code.

### Service boundaries

1. **Requisition service:** requirements, versions, approvals.
2. **Discovery service:** query planning and provider/source orchestration.
3. **Ingestion service:** fetch, normalize, rate-limit, and store permitted evidence.
4. **Profile service:** extraction, canonicalization, deduplication, profile views.
5. **Scoring service:** deterministic rubric, model outputs, explanations, calibration.
6. **Review service:** shortlist, notes, decisions, collaboration.
7. **Governance service:** policies, consent/legal basis metadata, retention, audit, deletion.

---

## 6. Search and retrieval strategy

### Query planning

Convert structured filtersâ€”and optionally a prompt or job descriptionâ€”into:

- Required concepts: role, skills, industry, seniority, experience, geography.
- Optional concepts: preferred skills, education, certifications.
- Exclusions: explicit only; do not invent exclusion rules.
- Source constraints: allowed sources, freshness, language, region.
- Ambiguities: surfaced as questions or â€œunknown,â€ not silently resolved.

Run hybrid retrieval:

1. Exact/Boolean search for titles, skills, locations, and employers.
2. Semantic search for equivalent role and skill wording.
3. Source-specific retrieval through permitted APIs or approved public pages.
4. Re-rank with job-relevance features and evidence quality.
5. Extract facts only from retrieved content; attach citations.

### Providers/connectors

Use a provider abstraction so each connector can be enabled only after legal, contractual, and security review. Potential categories include:

- Licensed talent/profile data providers with documented employment-use rights.
- Official partner APIs and user-authorized integrations.
- Public professional portfolios, personal websites, publications, conference pages, Git repositories, and professional directories.
- Search-engine APIs for discovery of publicly indexed pages, subject to their terms.

LinkedIn handling is intentionally provider-dependent: accept a user-supplied public URL/ID, use an approved API or licensed provider where available, and do not bypass login, anti-bot controls, robots directives, rate limits, or terms of service. Store only the minimum permitted fields.

### Local-first and free-tier operation

The product must run locally for development, demonstrations, and small internal deployments:

**Local hardware target:** 16 GB RAM desktop/laptop. The default configuration must remain usable on this machine, with no assumption of a dedicated GPU or server-grade infrastructure.

- Package the application with Docker Compose.
- Support local PostgreSQL with pgvector, Redis, object storage, and workers.
- Keep the default local stack lightweight: PostgreSQL, a small Redis instance, one API process, and one worker; avoid running OpenSearch, Kubernetes, or multiple databases locally.
- Use CPU-friendly local models or external API mode. Local LLM use must be optional because large models can exceed a 16 GB RAM budget.
- Provide a `docker-compose.local.yml` profile with resource limits and a lighter `docker-compose.enterprise.yml` profile for larger deployments.
- Recommend starting with a small quantized model through Ollama for extraction, or using a free/paid external API when configured.
- Provide `.env.example`, migrations, seed data, health checks, backup instructions, and startup documentation.
- Use open-source components and local full-text search by default.
- Make LLM, embeddings, search, storage, and enrichment providers replaceable through adapters.
- Support local models through Ollama or another OpenAI-compatible local endpoint.
- Support free-tier or no-cost APIs only where their terms, quotas, privacy rules, and commercial-use rights permit them; never promise unlimited free access.
- If no external API key is configured, continue with local search, manual URL ingestion, rule-based extraction, and clearly labeled reduced capabilities.

The local profile should reserve memory for the operating system and browser. Recommended starting limits are approximately 2â€“3 GB for PostgreSQL, 0.5â€“1 GB for Redis, 1â€“2 GB for API/workers, and a separately started small quantized model only when required. Heavy embedding, crawling, and re-ranking jobs should run sequentially or through an external worker.

Maintain a provider capability matrix covering cost, quotas, authentication, permitted fields, geography, retention, and commercial-use status.

### Freshness

Store `retrieved_at`, `source_last_updated_at` when available, and a freshness class. Re-fetch only according to source policy and a bounded schedule. Mark stale facts instead of overwriting history.

---

## 7. Data model

### Candidate

```json
{
  "id": "cand_01J...",
  "organization_id": "org_01J...",
  "display_name": "Example Candidate",
  "headline": "Senior Data Engineer",
  "current_role": {"title": "Senior Data Engineer", "employer": "Example Co", "as_of": "2026-08"},
  "locations": [{"kind": "current", "country": "Saudi Arabia", "city": "Riyadh", "confidence": 0.96}],
  "location_classification": "saudi_arabia",
  "relocation_statement": {"value": "willing_to_relocate", "explicit": true},
  "experience": {"years": 8.5, "range": [8, 10], "basis": "dated_roles", "confidence": 0.88},
  "skills": [{"name": "Python", "level": "unknown", "evidence_ids": ["ev_123"]}],
  "education": [{"degree": "BSc", "field": "Computer Science", "institution": "Example University", "evidence_ids": ["ev_124"]}],
  "work_authorization": [{"country": "Saudi Arabia", "value": "explicitly_stated", "evidence_ids": ["ev_125"]}],
  "nationality": {"value": null, "status": "not_collected"},
  "age_or_dob": {"value": null, "status": "not_collected"},
  "source_refs": ["src_001"],
  "confidence": 0.86,
  "created_at": "2026-09-09T08:00:00Z",
  "updated_at": "2026-09-09T08:10:00Z"
}
```

### Core tables/entities

- `organizations`, `users`, `roles`, `permissions`
- `requisitions`, `requisition_versions`, `requirement_items`
- `candidates`, `candidate_aliases`, `candidate_identifiers`
- `experiences`, `skills`, `candidate_skills`, `educations`, `certifications`
- `locations`, `work_authorization_statements`, `nationality_statements`
- `sources`, `source_documents`, `evidence_items`
- `candidate_merges`, `merge_decisions`
- `search_runs`, `search_results`, `saved_searches`
- `scores`, `score_components`, `model_versions`
- `shortlists`, `shortlist_items`, `notes`, `tags`
- `consent_or_legal_basis`, `retention_events`, `deletion_requests`, `audit_events`

### Evidence item

```json
{
  "id": "ev_123",
  "candidate_id": "cand_01J...",
  "field": "skills.python",
  "claim": "Python appears in the candidate's listed skills",
  "excerpt": "...Python, SQL, and Airflow...",
  "source_url": "https://example.org/profile",
  "source_type": "public_profile",
  "retrieved_at": "2026-09-09T08:01:00Z",
  "confidence": 0.94,
  "is_explicit": true,
  "content_hash": "sha256:..."
}
```

---

## 8. API design

Base path: `/api/v1`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/requisitions` | Create requisition using filters; JD parsing is optional |
| POST | `/requisitions/{id}/job-description` | Upload or submit JD text for optional parsing and ATS profile creation |
| POST | `/requisitions/{id}/searches` | Start structured-filter search; prompt/JD enrichment is optional |
| GET | `/searches/{id}` | Read progress, coverage, and results |
| POST | `/candidates/ingest-url` | Ingest a user-supplied permitted URL |
| GET | `/candidates` | Filter, search, sort, paginate |…828 tokens truncated…h**

> Find cybersecurity engineers outside Saudi Arabia who have 5â€“10 years of experience, cloud security skills, and an explicit statement of remote or relocation availability. Separate current location from preferred location and show evidence for every match.

**Evidence-first search**

> Search approved public sources for data analysts with SQL and Power BI. Rank by job relevance and evidence quality. Return unknown when a requirement cannot be verified; do not infer missing details.

---

## 10. Deduplication and entity resolution

Use a layered approach:

1. Exact source identifier or canonical URL.
2. Normalized email/phone only when lawfully supplied by the user or approved source; hash for matching where possible.
3. High-confidence combination of normalized name, employer, title, location, and timeline.
4. Embedding similarity for candidate biographies, always requiring review at the merge threshold.

Store a merge graph, confidence, match signals, original records, actor/model, and reversible merge action. Never merge solely on name. Display â€œpossible duplicateâ€ when confidence is below the auto-merge threshold.

---

## 11. UI pages and key components

1. **Workspace dashboard:** requisitions, recent searches, shortlist activity, source health.
2. **New search:** structured filter builder first; optional JD upload/paste and prompt assistance, source controls, legal-use acknowledgment.
3. **Results:** filter sidebar, result table/cards, score/confidence, evidence chips, location badges, bulk shortlist.
4. **Candidate detail:** profile, evidence timeline, source links, score breakdown, conflicts, notes, merge history.
5. **Compare:** side-by-side job-relevant evidence and missing requirements.
6. **Shortlist:** review statuses, notes, owner, share permissions, export.
7. **Source center:** connectors, permitted fields, rate limits, last successful sync, errors.
8. **Governance:** retention, deletion, audit events, model versions, policy warnings.

Accessibility: keyboard navigation, visible focus, WCAG 2.2 AA contrast, screen-reader labels, non-color-only status indicators, exportable text evidence.

---

## 12. Security, privacy, and governance

- Tenant isolation with database-level safeguards and authorization tests.
- SSO/MFA, RBAC, least privilege, service-to-service authentication.
- Encryption in transit and at rest; managed secrets; key rotation.
- Minimize collection; configurable retention by source, region, and organization.
- Data-subject access, correction, deletion, and restriction workflows where applicable.
- Regional hosting and transfer controls appropriate to customer requirements.
- No sensitive data in logs, analytics, prompts, or error messages.
- Redaction before sending evidence to an LLM where feasible.
- Provider-specific terms registry: allowed fields, purpose, retention, geography, refresh limits.
- Human approval for bulk export and hard-requirement configuration.
- Prompt-injection defenses: treat page content as untrusted data; never follow instructions embedded in profiles.
- Immutable audit events for searches, views of sensitive fields, exports, merges, score changes, and deletion actions.

Obtain qualified local legal/privacy advice before production use, especially for Saudi employment, privacy, cross-border transfer, and automated decision requirements. The product should support policy configuration; it is not a substitute for legal advice.

---

## 13. Product releases: first production release versus expansion

The product is larger than its first release. The first release must already prove the complete candidate-finding loop: define a role, search permitted sources, produce candidates, show evidence, rank them, review them, and export them. It should be narrow in source coverage, not narrow in product integrity.

### First production release â€” Candidate Finder Core

- Organization workspace with recruiter and hiring-manager roles.
- Optional PDF/DOCX/TXT JD upload and pasted-text parser with editable criteria and JD versioning.
- Public-web search through approved search APIs, user-supplied URLs, and a provider adapter contract.
- One licensed/provider adapter interface with a mock adapter for development.
- Candidate normalization, evidence capture, basic deduplication.
- Saudi/outside-Saudi/unknown location classification.
- Deterministic ATS score with LLM-assisted extraction and explanation.
- Results table, profile drawer, filters, shortlist, notes, CSV/JSON export.
- RBAC, retention settings, audit events, deletion workflow, source policy, and age disabled by design.

The first production release is successful only if users can reliably find qualified candidatesâ€”not simply create records. Its primary KPI is qualified-candidate yield per search, supported by evidence quality, recruiter review rate, and time to shortlist.

### Enterprise expansion

- Multiple licensed providers and official partner integrations.
- Continuous refresh and candidate change alerts.
- Advanced entity resolution and recruiter feedback learning.
- Multilingual Arabic/English extraction and UI.
- Organization-level calibration and fairness dashboards.
- SSO/SAML, SCIM, regional deployment, DLP, legal holds.
- Hiring CRM/ATS integrations, approval workflows, collaborative scorecards.
- Candidate consent/engagement portal and source-specific deletion automation.

### Enterprise operating model

- **Tenant administration:** organizations, departments, seats, roles, policies, billing/usage quotas, and data residency.
- **Recruiting operations:** requisition templates, approval gates, recruiter ownership, hiring-team collaboration, SLAs, and saved searches.
- **Source operations:** connector credentials, provider contracts, field-level permissions, rate limits, health dashboards, and source shutdown controls.
- **Governance:** legal-basis metadata, retention schedules, deletion/export requests, audit exports, model approvals, and policy acknowledgments.
- **Integration:** ATS/CRM sync, webhooks, candidate write-back only after recruiter confirmation, and API keys scoped to an organization or service account.
- **Reliability:** asynchronous discovery jobs, retry/backoff, deduplicated work, source-level circuit breakers, idempotency, observability, and disaster recovery.

---

## 14. Acceptance criteria

- A recruiter can create a search using structured filters alone; JD upload and prompt assistance are optional.
- Every displayed candidate claim links to at least one source or is labeled unknown.
- Saudi Arabia and outside Saudi Arabia are independently filterable, with unknown separated.
- Location, nationality, and work authorization are never conflated.
- ATS score is reproducible for a fixed requisition, evidence set, and model version.
- Score explanation lists matched, missing, conflicting, and uncertain requirements.
- Age/DOB is absent from default search, ranking, score, and export paths.
- A candidate URL can be ingested only through an approved source policy and is auditable.
- Duplicate candidates are detected with reversible merges and preserved provenance.
- Shortlist updates and exports are permissioned and logged.
- Deletion removes or quarantines candidate data according to configured retention/legal-hold policy.
- Source outage or blocked access produces a clear partial-results status, never fabricated records.
- Accessibility and mobile-responsive smoke checks pass for core flows.

---

## 15. Testing and evaluation

### Automated tests

- Unit tests for taxonomy mapping, experience calculation, geography classification, score math, freshness, and URL canonicalization.
- Contract tests for every provider adapter and source-policy enforcement.
- Authorization tests for tenant isolation, exports, sensitive fields, and audit access.
- Adversarial tests for prompt injection in profile text and malicious URLs.
- Property tests for idempotent ingestion and reversible deduplication.

### Quality sets

Create a reviewed, legally usable evaluation set of synthetic or permissioned profiles covering:

- Saudi, outside-Saudi, remote, relocation, and unknown location.
- Explicit versus ambiguous work authorization.
- Synonyms, multilingual titles, career gaps, conflicting sources, and stale profiles.
- Near-duplicate profiles and common names.
- Missing evidence and misleading snippets.

Track precision/recall for discovery, extraction accuracy by field, citation correctness, duplicate precision, score calibration, latency, cost per search, blocked-source rate, and recruiter override rate. Review quality by job family and geography; do not evaluate or optimize using protected traits.

---

## 16. Same-day implementation plan

### Hour 0â€“1: Scope and safety foundation

- Confirm first-release sources, target geography, legal-use assumptions, and user roles.
- Create repository, environment configuration, threat model, and source-policy registry.

### Hour 1â€“2: Data and API skeleton

- Initialize Next.js/API/Postgres project.
- Add migrations for requisitions, JD versions, candidates, sources, evidence, scores, shortlists, and audit events.
- Add tenant and user context to every request.

### Hour 2â€“3: Filter builder and optional parser

- Build the structured filter builder first.
- Implement the requirement schema and editable criteria state.
- Add optional job-description/prompt parsing as a convenience feature that pre-fills filters only.
- Add unknown/ambiguous field handling.

### Hour 3â€“4: Search orchestration

- Implement provider interface, public-search adapter, URL ingestion flow, rate limits, and job queue.
- Return partial progress and source coverage.

### Hour 4â€“5: Extraction and evidence

- Add structured-output extraction for JD requirements and candidate roles, dates, skills, education, location, and explicit authorization statements.
- Persist evidence excerpts, URLs, hashes, timestamps, and confidence.

### Hour 5â€“6: Normalization and deduplication

- Add role/skill/location taxonomies, URL canonicalization, exact identifier matching, and reviewable duplicate suggestions.

### Hour 6â€“7: Scoring and ranking

- Implement deterministic rubric, confidence score, freshness factor, explanation, and model-version record.
- Explicitly exclude age and protected-trait fields from score inputs.

### Hour 7â€“8: Results UI

- Build results table/cards, filters, Saudi/outside-Saudi badges, evidence chips, sorting, and empty/error states.

### Hour 8â€“9: Profile, compare, shortlist

- Build candidate detail drawer, source timeline, score breakdown, notes, tags, shortlist statuses, and compare view.

### Hour 9â€“10: Export and governance

- Add CSV/JSON export with provenance, export confirmation, RBAC, retention settings, deletion request, and audit log view.

### Hour 10â€“11: Security and adversarial verification

- Test tenant isolation, malicious URLs, prompt injection, blocked sources, stale/conflicting evidence, and unauthorized exports.

### Hour 11â€“12: End-to-end acceptance pass

- Run a synthetic evaluation set.
- Fix critical defects, document provider/legal assumptions, seed demo data, and deploy the MVP to a protected environment.

If a same-day build must be smaller, keep the evidence model, location separation, deterministic scoring, audit trail, and age guardrail; reduce source breadth and visual polish first.

---

## 17. Sample records

### Candidate A â€” strong Saudi match

- Current role: Senior Data Engineer, Riyadh; explicitly supported by a recent public profile.
- Experience: 8 years from dated roles; confidence 0.88.
- Skills: Python and Spark explicitly evidenced; Airflow not found.
- Location: `saudi_arabia`; relocation not needed.
- Score: 84/100; confidence 0.81.
- Review note: â€œStrong must-have match; verify Airflow in screening.â€

### Candidate B â€” outside Saudi, explicit relocation

- Current role: Data Platform Engineer, London.
- Experience: 7â€“9 years; confidence 0.71 because one role date is approximate.
- Location: `outside_saudi_arabia`; explicit statement: willing to relocate to Riyadh.
- Work authorization: unknown; no inference.
- Score: 78/100; confidence 0.67.
- Review note: â€œGood technical fit; verify authorization and relocation timing.â€

### Candidate C â€” insufficient evidence

- Current role: â€œTechnology Professionalâ€; source is an old directory listing.
- Location: unknown.
- Skills: partial keyword evidence only.
- Score: 52/100; confidence 0.34.
- UI warning: â€œDo not treat missing evidence as a negative; verify before advancing.â€

---

## 18. Definition of done

The first production release is ready for a controlled pilot when the acceptance criteria pass, the approved source inventory and provider capability matrix are documented, local startup works without paid APIs, provider terms and retention rules are configured, the synthetic evaluation set meets agreed quality thresholds, security review has no critical findings, and pilot users can explain why every shortlisted candidate received their score.

**Recommended launch posture:** private beta with one recruiting team, approved sources only, no automated outreach, age disabled, exports permissioned, and weekly review of evidence quality, source compliance, recruiter overrides, and false positives.

---

## 19. GitHub project standards and issue plan

Use GitHub as the source of truth for implementation. Do not create one giant issue for the entire product. Create milestones, then implement small vertical slices that can be reviewed and tested independently.

### Recommended repository structure

```text
candidate-finder/
â”œâ”€â”€ apps/web/              # recruiter and admin UI
â”œâ”€â”€ apps/api/              # API and authorization
â”œâ”€â”€ workers/                # discovery, extraction, scoring jobs
â”œâ”€â”€ packages/domain/       # shared types, taxonomies, scoring rules
â”œâ”€â”€ packages/providers/    # source/provider adapters
â”œâ”€â”€ packages/ui/           # shared components
â”œâ”€â”€ db/migrations/         # database migrations
â”œâ”€â”€ infra/                 # Docker and deployment configuration
â”œâ”€â”€ docs/                  # architecture, policies, runbooks
â””â”€â”€ .github/               # workflows, templates, CODEOWNERS
```

### GitHub standards

- Protect `main`; require pull requests, passing checks, and at least one review.
- Use short-lived branches: `feature/`, `fix/`, `security/`, or `docs/`.
- Keep commits small and use Conventional Commits: `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `security:`.
- Every feature issue must have acceptance criteria and tests.
- Require database migrations for schema changes; never edit production data manually.
- Never commit API keys, candidate data, uploaded JDs, raw source pages, or personal data.
- Add secret scanning, dependency scanning, linting, type checking, unit tests, and build checks to pull requests.
- Use synthetic or permissioned data in fixtures and screenshots.
- Label issues with `feature`, `bug`, `security`, `privacy`, `data-source`, `ai`, `blocked`, and `good-first-issue`.
- Require a privacy/security review for new fields, new providers, exports, model changes, and personally identifiable information.

### Issue template

```md
## Goal

What user capability is being built?

## User value

Why does this help a recruiter or administrator?

## Scope

What is included in this issue?

## Acceptance criteria

- [ ] The main success path works
- [ ] Empty, loading, and error states are handled
- [ ] Authorization is enforced
- [ ] Audit event is added where required
- [ ] Tests are included
- [ ] Documentation is updated

## Dependencies

List issue numbers or write `None`.

## Out of scope

What must not be added in this issue?
```

### Suggested GitHub milestones and issues

#### Milestone 1 â€” Local foundation

- `FND-01` Create repository structure and development conventions.
- `FND-02` Add Docker Compose local profile for a 16 GB RAM computer.
- `FND-03` Add PostgreSQL/pgvector migrations and seed data.
- `FND-04` Add API, worker, Redis, health checks, and environment configuration.
- `FND-05` Add authentication, organizations, users, and roles.
- `FND-06` Add CI checks, secret scanning, dependency scanning, and branch protection documentation.

#### Milestone 2 â€” Filter-first search

- `SRC-01` Define industry, role, skill, education, and geography taxonomies.
- `SRC-02` Build structured filter-builder UI.
- `SRC-03` Create search API using filters only.
- `SRC-04` Add search job queue and progress states.
- `SRC-05` Add provider adapter interface and source capability registry.
- `SRC-06` Add first approved/free-tier search provider.
- `SRC-07` Add user-supplied public profile URL ingestion.
- `SRC-08` Add source links, retrieval timestamps, blocked-source handling, and coverage reporting.

#### Milestone 3 â€” JD upload and ATS scoring

- `JD-01` Upload PDF, DOCX, and TXT files with size and virus checks.
- `JD-02` Extract and store JD text with parser version and provenance.
- `JD-03` Parse JD requirements into an editable requirement profile.
- `JD-04` Add JD versioning and change history.
- `ATS-01` Implement deterministic ATS scoring rubric.
- `ATS-02` Match candidate evidence against JD requirements.
- `ATS-03` Add score, confidence, missing evidence, and explanation views.
- `ATS-04` Add score reproducibility and model/rubric versioning.
- `ATS-05` Verify age and protected characteristics cannot enter the score.

#### Milestone 4 â€” Candidate intelligence

- `CAN-01` Extract candidate identity, current role, employer, and location.
- `CAN-02` Extract experience, skills, education, and explicit authorization statements.
- `CAN-03` Add evidence records for every extracted claim.
- `CAN-04` Add Saudi/outside-Saudi/remote/relocation/unknown classification.
- `CAN-05` Add candidate profile page and evidence timeline.
- `CAN-06` Add duplicate detection and reversible merge review.

#### Milestone 5 â€” Recruiter workflow

- `REV-01` Build results table with filters and sorting.
- `REV-02` Add shortlist, notes, tags, and review statuses.
- `REV-03` Add side-by-side candidate comparison.
- `REV-04` Add CSV/JSON export with evidence and provenance.
- `REV-05` Add hiring-manager permissions and shared shortlist review.
- `REV-06` Add audit log for searches, views, merges, scores, and exports.

#### Milestone 6 â€” Enterprise hardening

- `ENT-01` Add tenant isolation and authorization test suite.
- `ENT-02` Add retention, deletion, and data-subject workflows.
- `ENT-03` Add provider terms, field permissions, quotas, and source health.
- `ENT-04` Add SSO/MFA and service-account API keys.
- `ENT-05` Add observability, retries, circuit breakers, backups, and recovery runbook.
- `ENT-06` Add ATS/CRM integration and recruiter-confirmed write-back.
- `ENT-07` Complete security, privacy, fairness, and source-compliance review.

### Definition of complete for every issue

An issue is complete only when the implementation, automated tests, authorization behavior, error states, audit requirements, documentation, and local 16 GB RAM setup have been verified. A feature that works only with a paid API or powerful server is incomplete unless its limitation is explicitly documented.


