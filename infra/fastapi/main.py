from __future__ import annotations

import os
import json
import urllib.request
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


def score_candidate(candidate: dict[str, Any], request: CandidateSearchRequest) -> dict[str, Any]:
    requested = [skill.lower() for skill in request.skills]
    matched = [skill for skill in candidate["skills"] if skill.lower() in requested]
    missing = [skill for skill in request.skills if skill.lower() not in {item.lower() for item in candidate["skills"]}]
    role_match = request.role.lower() in candidate["title"].lower() or candidate["title"].lower().split()[0] in request.role.lower()
    experience_match = request.experienceMin <= candidate["experienceYears"] <= request.experienceMax
    geography_match = request.location.lower() in candidate["locationClassification"].lower() or candidate["relocation"]
    industry_match = not request.industry or request.industry.lower() in candidate["industry"].lower()
    score = min(100, round(len(matched) / max(len(requested), 1) * 40 + (20 if role_match else 0) + (15 if experience_match else 0) + 10 + (10 if geography_match else 0) + (5 if industry_match else 0)))
    return {**candidate, "demo": False, "label": "Provider result", "atsScore": score, "matchedSkills": matched, "missingSkills": missing, "confidence": "High" if score >= 75 else "Medium", "explanation": f"{len(matched)} of {len(requested)} required skills matched; {'role matches' if role_match else 'adjacent role'}; {'industry matches' if industry_match else 'industry differs'}; {'experience is in range' if experience_match else 'experience is outside range'}; {'geography is compatible' if geography_match else 'geography differs'}."}


def claude_candidates(request: CandidateSearchRequest) -> list[dict[str, Any]]:
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=503, detail="claude_api_key_not_configured")
    prompt = f"Find public professional candidate profiles for this recruiter search: role={request.role}; industry={request.industry}; skills={', '.join(request.skills)}; experience={request.experienceMin}-{request.experienceMax} years; location={request.location}. Search public permitted sources only. Do not use or return age, gender, nationality, religion, photos, private data, or LinkedIn session data. Return exactly three records as JSON array, each with name, title, industry, skills (array), experienceYears (number), education, location, locationClassification, relocation (boolean), sourceUrl, evidenceConfidence. If fewer than three verifiable public records exist, return the records found."
    payload = {"model": os.getenv("ANTHROPIC_MODEL", "claude-sonnet"), "max_tokens": 3000, "system": "You are a careful recruiting research assistant. Use the web search tool and return only public, job-relevant information. Never invent candidates or facts. Return JSON only.", "tools": [{"type": "web_search_20250305", "name": "web_search", "max_uses": 5}], "messages": [{"role": "user", "content": prompt}]}
    body = json.dumps(payload).encode()
    http_request = urllib.request.Request("https://api.anthropic.com/v1/messages", data=body, headers={"content-type": "application/json", "x-api-key": api_key, "anthropic-version": "2023-06-01"}, method="POST")
    try:
        with urllib.request.urlopen(http_request, timeout=60) as response:
            result = json.loads(response.read())
        text = "".join(block.get("text", "") for block in result.get("content", []) if block.get("type") == "text").strip()
        if not text:
            raise RuntimeError(f"claude_response_missing_text_blocks:{','.join(block.get('type', 'unknown') for block in result.get('content', []))}")
        text = text.removeprefix("```json").removesuffix("```").strip()
        if not text.startswith("["):
            start, end = text.find("["), text.rfind("]")
            if start >= 0 and end > start:
                text = text[start : end + 1]
        records = json.loads(text)
        return records if isinstance(records, list) else []
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"claude_search_failed: {error}") from error


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "api", "runtime": "fastapi"}


@app.get("/ready")
def ready() -> dict[str, Any]:
    return {"ready": True, "database": False, "redis": False, "mode": "stateless"}


@app.post("/api/v1/candidate-search")
def candidate_search(request: CandidateSearchRequest) -> dict[str, Any]:
    if request.experienceMax < request.experienceMin:
        raise HTTPException(status_code=422, detail="experienceMax must be greater than or equal to experienceMin")
    records = claude_candidates(request)
    scored = sorted((score_candidate(record, request) for record in records), key=lambda item: item["atsScore"], reverse=True)
    return {"count": len(scored), "candidates": scored, "provider": "claude_web_search", "demo": False}


@app.post("/api/v1/search-jobs")
def create_search_job(request: CandidateSearchRequest) -> dict[str, Any]:
    job_id = str(uuid.uuid4())
    results = candidate_search(request)["candidates"]
    return {"jobId": job_id, "status": "completed", "results": results, "candidates": results}


@app.get("/api/v1/search-jobs/{job_id}")
def get_search_job(job_id: str) -> dict[str, Any]:
    return {"jobId": job_id, "status": "completed", "results": []}
