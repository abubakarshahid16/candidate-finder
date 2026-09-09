# FastAPI backend

The local API now runs on Python FastAPI. The React/TypeScript frontend remains unchanged and continues to use port `3001`.

Start the local services with:

```powershell
docker compose -f docker-compose.local.yml up -d
```

OpenAPI documentation is available at `http://localhost:3001/docs`.

The first migration exposes `/health`, `/ready`, `/api/v1/candidate-search`, and compatible search-job routes. The response contract preserves ATS scores, matched skills, missing skills, and synthetic-demo labeling. Additional legacy Node routes should be migrated one bounded group at a time before removing the Node implementation.
