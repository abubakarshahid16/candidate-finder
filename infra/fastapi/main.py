from __future__ import annotations

import os
import socket
import uuid
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Candidate Finder API", version="local-v1")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["*"], allow_headers=["*"])


class CandidateSearchRequest(BaseModel):
    role: str = Field(min_length=1)
    industry: str = Field(default="", max_length=120)
    skills: list[str] = Field(min_length=1)
    experienceMin: int = Field(ge=0)
    experienceMax: int = Field(ge=0)
    location: str = Field(min_length=1)
    publicProfileUrls: list[str] = []


DEMO_CANDIDATES = [
    {"id": "demo-aurora-1", "name": "Demo Candidate Aurora", "title": "Data Engineer", "industry": "Technology", "skills": ["Python", "SQL", "Spark"], "experienceYears": 6, "education": "Bachelor's degree", "location": "Riyadh, Saudi Arabia", "locationClassification": "Saudi Arabia", "relocation": False},
    {"id": "demo-orbit-2", "name": "Demo Candidate Orbit", "title": "Senior Data Engineer", "industry": "Technology", "skills": ["Python", "SQL", "Airflow"], "experienceYears": 8, "education": "Master's degree", "location": "Jeddah, Saudi Arabia", "locationClassification": "Saudi Arabia", "relocation": False},
    {"id": "demo-lumen-3", "name": "Demo Candidate Lumen", "title": "Analytics Engineer", "industry": "Technology", "skills": ["SQL", "dbt", "Python"], "experienceYears": 4, "education": "Bachelor's degree", "location": "Remote, outside Saudi Arabia", "locationClassification": "Outside Saudi Arabia", "relocation": True},
]


def score_candidate(candidate: dict[str, Any], request: CandidateSearchRequest) -> dict[str, Any]:
    requested = [skill.lower() for skill in request.skills]
    matched = [skill for skill in candidate["skills"] if skill.lower() in requested]
    missing = [skill for skill in request.skills if skill.lower() not in {item.lower() for item in candidate["skills"]}]
    role_match = request.role.lower() in candidate["title"].lower() or candidate["title"].lower().split()[0] in request.role.lower()
    experience_match = request.experienceMin <= candidate["experienceYears"] <= request.experienceMax
    geography_match = request.location.lower() in candidate["locationClassification"].lower() or candidate["relocation"]
    industry_match = not request.industry or request.industry.lower() in candidate["industry"].lower()
    score = min(100, round(len(matched) / max(len(requested), 1) * 40 + (20 if role_match else 0) + (15 if experience_match else 0) + 10 + (10 if geography_match else 0) + (5 if industry_match else 0)))
    return {**candidate, "demo": True, "label": "Synthetic demo candidate", "atsScore": score, "matchedSkills": matched, "missingSkills": missing, "confidence": "High" if score >= 75 else "Medium", "explanation": f"{len(matched)} of {len(requested)} required skills matched; {'role matches' if role_match else 'adjacent role'}; {'industry matches' if industry_match else 'industry differs'}; {'experience is in range' if experience_match else 'experience is outside range'}; {'geography is compatible' if geography_match else 'geography differs'}."}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "api", "runtime": "fastapi"}


def can_connect(host: str, port: int) -> bool:
    try:
        with socket.create_connection((host, port), timeout=0.5):
            return True
    except OSError:
        return False


@app.get("/ready")
def ready() -> dict[str, Any]:
    database = can_connect(os.getenv("DATABASE_HOST", "postgres"), int(os.getenv("DATABASE_PORT", "5432")))
    redis = can_connect(os.getenv("REDIS_HOST", "redis"), int(os.getenv("REDIS_PORT", "6379")))
    return {"ready": database and redis, "database": database, "redis": redis}


@app.post("/api/v1/candidate-search")
def candidate_search(request: CandidateSearchRequest) -> dict[str, Any]:
    if request.experienceMax < request.experienceMin:
        raise HTTPException(status_code=422, detail="experienceMax must be greater than or equal to experienceMin")
    results = sorted((score_candidate(candidate, request) for candidate in DEMO_CANDIDATES), key=lambda item: item["atsScore"], reverse=True)
    return {"count": len(results), "candidates": results, "demo": True}


@app.post("/api/v1/search-jobs")
def create_search_job(request: CandidateSearchRequest) -> dict[str, Any]:
    job_id = str(uuid.uuid4())
    results = candidate_search(request)["candidates"]
    return {"jobId": job_id, "status": "completed", "results": results, "candidates": results}


@app.get("/api/v1/search-jobs/{job_id}")
def get_search_job(job_id: str) -> dict[str, Any]:
    return {"jobId": job_id, "status": "completed", "results": []}
