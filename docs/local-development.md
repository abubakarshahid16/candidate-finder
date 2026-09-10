# Local Candidate Finder

## Start

```powershell
Copy-Item .env.example .env
docker compose --env-file .env -f docker-compose.local.yml up -d
npm.cmd run dev
```

Open `http://localhost:3000`. Local development opens directly without login or a frontend token. The UI sends one search request to the configured candidate provider and displays provider results when available.

## Search API

`POST http://localhost:3001/api/v1/candidate-search` requires no authentication when running locally:

```json
{
  "role": "Data Engineer",
  "skills": ["Python", "SQL"],
  "experienceMin": 3,
  "experienceMax": 10,
  "location": "Saudi Arabia",
  "limit": 10
}
```

When Claude web search is configured, the response contains up to 10 unique verified candidates sorted by job-criteria match score. Each candidate includes matched and missing skills, a score breakdown, explanation, evidence coverage and confidence, location classification, rubric version, and public-source provenance. Rubric v2 gives equal weight to each active, job-related criterion: role, requested skills, minimum experience, explicitly requested education, geography/relocation, and industry. Experience above the preferred maximum is not penalized. Fewer than 10 records means the provider could not verify 10 suitable public profiles; the service never pads results with fabricated candidates. Without `ANTHROPIC_API_KEY`, the API returns `claude_api_key_not_configured`.

`skills`, `industry`, and `educationRequirement` are optional. An omitted criterion is excluded and the score is normalized across the remaining active criteria, so candidates are not penalized for a filter the recruiter did not provide. Education is never scored unless `educationRequirement` is explicitly supplied.

Health checks are `GET /health` and `GET /ready`.

## Authentication

Authentication is intentionally disabled only for this local demo endpoint and UI. Existing backend authentication code remains available for future production routes. To restore protected local behavior, remove or stop using `/api/v1/candidate-search` and route requests through the existing authenticated endpoints; production deployments must set `NODE_ENV=production`, keep `ALLOW_DEV_AUTH` disabled, and configure the approved identity/API-key controls.
