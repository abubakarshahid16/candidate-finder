from fastapi import FastAPI

app = FastAPI(title="Candidate Finder Worker")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "worker", "runtime": "fastapi"}
