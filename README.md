# Candidate Finder

Candidate Finder is an evidence-first talent discovery workspace for recruiters. It is designed for lawful public-data discovery, human review, explainable ranking, and governed shortlists.

## Current status

The repository contains a recruiter-facing local-first MVP surface with synthetic demo candidates, public URL ingestion, Redis-backed persistence, development/service-account authentication controls, JD extraction, deterministic ATS scoring, evidence provenance, recruiter workflow APIs, exports, and audit events. Production identity-provider integration, live ATS/CRM delivery, and managed backup operations remain deployment work.

## Local development

Requirements: Node.js 22.13+.

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vinext. Validate the production build with `npm.cmd run build`.

The first production architecture should remain local-first on a 16 GB computer: PostgreSQL with pgvector, a small Redis instance, one API process, and one worker. Heavy models and paid providers are optional adapters, never required for the base development flow.

## Product and safety

Read [candidate-finder-product-spec.md](candidate-finder-product-spec.md) before implementing features. The application must keep evidence and provenance attached to material claims, separate current location from nationality and work authorization, avoid protected-trait inference, and keep age/DOB out of search and ranking.

## Contribution workflow

Use short-lived branches and Conventional Commits. Every issue should include acceptance criteria, tests, authorization behavior, error states, audit requirements, and documentation impact. Use synthetic or permissioned data only.

## Planned milestones

See [docs/github-roadmap.md](docs/github-roadmap.md).
