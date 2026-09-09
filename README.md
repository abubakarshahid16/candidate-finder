# Candidate Finder

Candidate Finder is an evidence-first talent discovery workspace for recruiters. It is designed for lawful public-data discovery, human review, explainable ranking, and governed shortlists.

## Current status

The active application is a stateless recruiter search flow backed by Claude web search. Recruiters can enter structured filters or upload a text/Markdown job description, retrieve up to 10 verified public profiles, inspect source links, and review a deterministic ATS score with an evidence breakdown. No candidate database or fabricated fallback records are used by the active flow.

## Local development

Requirements: Node.js 22.13+, Docker Desktop, and an Anthropic API key.

```powershell
Copy-Item .env.example .env
docker compose --env-file .env -f docker-compose.local.yml up -d
npm.cmd run dev
```

Set `ANTHROPIC_API_KEY` and a valid `ANTHROPIC_MODEL` in `.env`, then open `http://localhost:3000`. Validate the production build with `npm.cmd run build`.

The current search path runs without PostgreSQL or Redis and is suitable for a normal 16 GB development computer.

## Product and safety

Read [candidate-finder-product-spec.md](candidate-finder-product-spec.md) before implementing features. The application must keep evidence and provenance attached to material claims, separate current location from nationality and work authorization, avoid protected-trait inference, and keep age/DOB out of search and ranking.

## Contribution workflow

Use short-lived branches and Conventional Commits. Every issue should include acceptance criteria, tests, authorization behavior, error states, audit requirements, and documentation impact. Use synthetic or permissioned data only.

## Planned milestones

See [docs/github-roadmap.md](docs/github-roadmap.md).
