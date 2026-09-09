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
  "location": "Saudi Arabia"
}
```

When a provider is configured, the response contains candidates with ATS scores out of 100, matched and missing skills, explanation, evidence confidence, location classification, and provider provenance. Scores use only role, skills, experience, education, geography, and relocation. Without a provider, the API returns `candidate_provider_not_configured`; it does not fabricate records.

Health checks are `GET /health` and `GET /ready`.

## Authentication

Authentication is intentionally disabled only for this local demo endpoint and UI. Existing backend authentication code remains available for future production routes. To restore protected local behavior, remove or stop using `/api/v1/candidate-search` and route requests through the existing authenticated endpoints; production deployments must set `NODE_ENV=production`, keep `ALLOW_DEV_AUTH` disabled, and configure the approved identity/API-key controls.
