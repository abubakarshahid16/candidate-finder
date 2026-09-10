# Candidate Finder

Candidate Finder is a local recruiter workspace that searches permitted public sources with Claude and ranks the returned profiles against explicit, job-related criteria. Every result includes its public source, evidence coverage, matched and missing skills, and a deterministic rubric breakdown.

The score is a review aid—not an employment decision or a universal ATS cutoff. Recruiters must verify source evidence and monitor real hiring outcomes for adverse impact.

## What you need

- Windows 10/11, macOS, or Linux
- [Git](https://git-scm.com/downloads)
- [Node.js 22.13 or newer](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- An Anthropic API key with access to Claude web search

Docker Desktop must be running before you start the API.

## Install on a new computer

Open PowerShell (Windows) or a terminal (macOS/Linux), then run:

```bash
git clone https://github.com/abubakarshahid16/candidate-finder.git
cd candidate-finder
npm ci
```

Create your local configuration:

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

### macOS or Linux

```bash
cp .env.example .env
```

Open `.env` in a text editor and set these values:

```dotenv
ANTHROPIC_API_KEY=your_anthropic_api_key
ANTHROPIC_MODEL=claude-sonnet-4-6
API_ACCESS_TOKEN=choose-a-long-random-local-token
NEXT_PUBLIC_API_ACCESS_TOKEN=choose-the-same-long-random-local-token
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

`API_ACCESS_TOKEN` and `NEXT_PUBLIC_API_ACCESS_TOKEN` must match. The browser value is intentionally visible to the local browser and protects a personal/local installation from accidental unauthenticated calls; it is not a replacement for production user authentication.

## Start the app

Start the API and worker containers:

```bash
docker compose --env-file .env -f docker-compose.local.yml up -d
```

Confirm that the API is healthy by opening <http://localhost:3001/health>. It should return a small JSON response containing `"status":"ok"`.

Start the web interface in a second terminal:

```bash
npm run dev
```

Open <http://localhost:3000>.

To stop the app:

```bash
docker compose --env-file .env -f docker-compose.local.yml down
```

Stop the web development server with `Ctrl+C` in its terminal.

## How to use it

1. Choose a role template or enter a job title.
2. Select the industry and location scope.
3. Enter minimum experience. The maximum is a preferred search boundary; candidates above it are not penalized.
4. Add only skills genuinely required when someone starts the job.
5. Add an education requirement only when job analysis shows it is necessary. Otherwise education is excluded from scoring.
6. Optionally paste a search brief, upload a text/Markdown job description up to 1 MB, or provide an authorized public profile URL.
7. Select **Find candidates**. A live search normally takes 45–90 seconds and uses paid Anthropic API/web-search capacity.
8. Open a candidate card to inspect the evidence, score breakdown, and source before making any recruiting decision.

The app never pads a result set with fabricated candidates. Receiving fewer than ten results means Claude could not verify ten suitable public profiles.

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Required for live searches | Empty |
| `ANTHROPIC_MODEL` | Claude API model ID | `claude-sonnet-4-6` |
| `API_ACCESS_TOKEN` | Optional API token checked through `X-API-Key` | Empty |
| `NEXT_PUBLIC_API_ACCESS_TOKEN` | Browser copy of the local API token | Empty |
| `NEXT_PUBLIC_API_BASE_URL` | Browser-visible API address | `http://localhost:3001` |
| `ALLOWED_ORIGINS` | Comma-separated browser origins allowed by the API | Local port 3000 origins |
| `SEARCH_RATE_LIMIT_PER_MINUTE` | Search requests allowed per client per minute | `10` |
| `API_PORT` | Host port for the FastAPI service | `3001` |
| `WORKER_PORT` | Host port for the worker health service | `3002` |

After changing a `NEXT_PUBLIC_...` value, restart `npm run dev`. After changing API settings, recreate the container:

```bash
docker compose --env-file .env -f docker-compose.local.yml up -d --force-recreate api
```

## Run without Docker

Docker is recommended. For a direct Python setup, use Python 3.12:

```bash
python -m venv .venv
```

Activate the environment:

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

```bash
# macOS/Linux
source .venv/bin/activate
```

Then install and run the API:

```bash
python -m pip install -r infra/fastapi/requirements.txt
python -m uvicorn infra.fastapi.main:app --host 127.0.0.1 --port 3001
```

Environment variables from `.env` are passed automatically by Docker, but a directly launched Python process needs them exported by your shell or loaded by your preferred environment manager.

## Validation

Run all checks before committing changes:

```bash
npm test
python -m unittest discover -s tests -p "test_*.py"
npm run lint
npm run build
python tests/ui_smoke.py
npm audit
```

The browser suite requires the web interface at `http://localhost:3000`; it intercepts candidate-search calls, so it does not spend Anthropic API credits.

## Troubleshooting

### “Cannot reach the candidate-search API”

- Confirm Docker Desktop is running.
- Run `docker compose --env-file .env -f docker-compose.local.yml ps`.
- Open <http://localhost:3001/health>.
- Confirm `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`.

### `invalid_api_key`

Make `API_ACCESS_TOKEN` and `NEXT_PUBLIC_API_ACCESS_TOKEN` identical, then restart both the API container and web server.

### `claude_api_key_not_configured`

Set `ANTHROPIC_API_KEY` in `.env`, then recreate the API container.

### `claude_search_failed`

Check that the API key is valid, the account has available credit, and `ANTHROPIC_MODEL` names a model available to the account. Provider availability and model IDs can change over time.

### Port already in use

Change `API_PORT`, `WORKER_PORT`, or the web development port. If the API host port changes, update `NEXT_PUBLIC_API_BASE_URL` to match.

## Security and deployment notes

- `.env` is ignored by Git. Never commit API keys or access tokens.
- The default setup is intended for a single-user local machine.
- Do not expose port 3001 to the public internet with only the browser-visible local token.
- A real multi-user deployment needs server-side authentication, per-user authorization, centralized rate limiting, HTTPS, secret management, audit logging, and a separately deployed API URL.
- Configure `NEXT_PUBLIC_API_BASE_URL` and `ALLOWED_ORIGINS` for the deployed domains before building.
- Candidate Finder uses public, job-relevant evidence only. Do not use age, gender, nationality, religion, health, race, photos, or inferred protected traits in ranking.

See [the product specification](candidate-finder-product-spec.md), [local development details](docs/local-development.md), and [the security review](docs/security-review.md) for additional architecture and governance context.
