# Local development profile

The local profile is designed for a 16 GB RAM computer and uses only free/open-source components:

- PostgreSQL 16 with the pgvector extension
- Redis 7 Alpine with a 128 MB cache limit
- One small Node.js API placeholder
- One small Node.js worker placeholder

It intentionally does not start OpenSearch, Kubernetes, a local LLM, or any paid provider.

## Start the services

Copy `.env.example` to `.env`, then run:

```powershell
docker compose --env-file .env -f docker-compose.local.yml up -d
docker compose --env-file .env -f docker-compose.local.yml ps
```

The API endpoints are:

- `http://localhost:3001/health` — process health
- `http://localhost:3001/ready` — PostgreSQL and Redis connectivity
- `http://localhost:3001/api/v1/health` — versioned readiness endpoint

The worker health endpoint is `http://localhost:3002/health`. The web application remains a separate local process:

```powershell
npm.cmd run dev
```

## Development authentication

FND-05 uses a dependency-free local authentication mode. It is enabled by `DEV_AUTH_ENABLED=true` and is for development only. All users and credentials are synthetic:

| User | Role | Password |
| --- | --- | --- |
| `recruiter@example.test` | recruiter | `local-dev` |
| `manager@example.test` | hiring-manager | `local-dev` |
| `admin@example.test` | admin | `local-dev` |

Use `POST /api/v1/auth/login` with `{ "email": "...", "password": "local-dev" }`. Send the returned bearer token to `/api/v1/me`, `/api/v1/candidates`, or `/api/v1/organization`. Every protected response carries the authenticated organization context; the API does not accept an organization ID from the client for authorization.

The development-users endpoint is available only while `DEV_AUTH_ENABLED=true`. Do not use these static tokens or credentials outside local development. Production authentication belongs in a later security issue and must use approved organizational identity controls.

## Structured search API

SRC-03 adds `POST /api/v1/searches`. It requires a recruiter or admin bearer token and accepts only controlled filters:

```json
{
  "filters": {
    "role": "data_engineer",
    "industry": "technology",
    "mustHaveSkills": ["python", "spark"],
    "minExperience": 5,
    "geography": "saudi_arabia"
  }
}
```

The local adapter searches synthetic records only and returns the authenticated organization ID, matched records, count, filters, and source coverage. Unknown taxonomy values and invalid experience ranges return `400`; missing authentication returns `401`; users without `search:run` receive `403`.

## Search jobs and public URL ingestion

SRC-04–06 add Redis-backed asynchronous jobs. Submit a recruiter/admin job with `POST /api/v1/search-jobs` and check it with `GET /api/v1/search-jobs/<jobId>`. Jobs move through `queued`, `running`, and `completed`; source failures produce partial results and `blocked_or_unavailable` coverage entries. The working provider is user-supplied public URL ingestion and requires no API key. It accepts public HTML only, blocks private hosts, rejects credentials and unsafe content, limits responses to 1 MB and fetches to five seconds, and never directly scrapes LinkedIn.

## Stop the services

```powershell
docker compose --env-file .env -f docker-compose.local.yml down
```

The database volume is retained by default. To remove local database data, use `down --volumes` only when that data is disposable.

## Resource notes

The Compose limits reserve approximately 1.5 GB for the local services. PostgreSQL and Redis are the only stateful services. Heavy ingestion, embeddings, and model work should be added later as sequential workers or external adapters, not as default local containers.
