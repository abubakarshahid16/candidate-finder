import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from infra.fastapi.main import CandidateSearchRequest, _search_requests, app, candidate_search, score_candidate


class CandidateScoringTests(unittest.TestCase):
    def request(self, **overrides):
        values = {
            "role": "Data Scientist",
            "industry": "Technology",
            "skills": ["phython"],
            "experienceMin": 1,
            "experienceMax": 10,
            "location": "Saudi Arabia",
        }
        values.update(overrides)
        return CandidateSearchRequest(**values)

    def test_score_normalizes_skills_and_uses_candidate_location(self):
        result = score_candidate(
            {
                "name": "Public profile",
                "title": "Senior Data Scientist",
                "industry": "Technology",
                "skills": ["Python"],
                "experienceYears": 5,
                "education": "Unknown",
                "location": "Riyadh",
                "locationClassification": "In-country",
                "relocation": False,
                "sourceUrl": "https://www.linkedin.com/in/public-profile",
                "evidenceConfidence": "high",
            },
            self.request(),
        )

        self.assertEqual(result["atsScore"], 100)
        self.assertEqual(result["scoreBreakdown"]["requiredSkills"], 20)
        self.assertEqual(result["scoreBreakdown"]["education"], 0)
        self.assertEqual(result["scoreBreakdown"]["geography"], 20)
        self.assertEqual(result["confidence"], "High")
        self.assertEqual(result["evidenceCoverage"], 100)

    def test_unknown_evidence_does_not_receive_points(self):
        result = score_candidate(
            {
                "title": "Unknown",
                "skills": [],
                "experienceYears": None,
                "education": "Not available",
                "location": "Unknown",
                "locationClassification": "Unknown",
                "sourceUrl": "javascript:bad()",
                "age": 42,
            },
            self.request(),
        )

        self.assertEqual(result["atsScore"], 0)
        self.assertEqual(result["evidenceCoverage"], 0)
        self.assertEqual(result["sourceUrl"], "")
        self.assertNotIn("age", result)

    def test_duplicate_and_blank_requested_skills_do_not_change_weights(self):
        result = score_candidate(
            {
                "title": "Data Scientist",
                "industry": "Technology",
                "skills": ["Python"],
                "experienceYears": 5,
                "location": "Riyadh",
                "locationClassification": "Saudi Arabia",
                "sourceUrl": "https://profiles.example/normalized-skills",
            },
            self.request(skills=["Python", " phython "]),
        )

        self.assertEqual(result["matchedSkills"], ["Python"])
        self.assertEqual(result["missingSkills"], [])
        self.assertEqual(result["atsScore"], 100)

    def test_empty_skills_are_excluded_and_score_is_normalized(self):
        result = score_candidate(
            {
                "title": "Data Scientist",
                "industry": "Technology",
                "skills": [],
                "experienceYears": 5,
                "education": "Unknown",
                "location": "Riyadh",
                "locationClassification": "Saudi Arabia",
                "sourceUrl": "https://profiles.example/no-skills",
            },
            self.request(skills=[]),
        )

        self.assertEqual(result["atsScore"], 100)
        self.assertEqual(result["scoreBreakdown"]["requiredSkills"], 0)
        self.assertEqual(result["scoreBreakdownMaximums"]["requiredSkills"], 0)
        self.assertIn("no skills filter was applied", result["explanation"])

    def test_education_is_scored_only_when_the_recruiter_states_a_requirement(self):
        candidate = {
            "title": "Data Scientist",
            "industry": "Technology",
            "skills": ["Python"],
            "experienceYears": 5,
            "education": "Bachelor of Science in Computer Science",
            "location": "Riyadh",
            "locationClassification": "Saudi Arabia",
            "sourceUrl": "https://profiles.example/education",
        }

        not_requested = score_candidate(candidate, self.request())
        requested = score_candidate(candidate, self.request(educationRequirement="Bachelor Computer Science"))

        self.assertEqual(not_requested["scoreBreakdownMaximums"]["education"], 0)
        self.assertGreater(requested["scoreBreakdownMaximums"]["education"], 0)
        self.assertGreater(requested["scoreBreakdown"]["education"], 0)

    def test_experience_above_preferred_maximum_is_not_penalized(self):
        result = score_candidate(
            {
                "title": "Data Scientist",
                "industry": "Technology",
                "skills": ["Python"],
                "experienceYears": 18,
                "education": "Unknown",
                "location": "Riyadh",
                "locationClassification": "Saudi Arabia",
                "sourceUrl": "https://profiles.example/senior",
            },
            self.request(experienceMax=10),
        )

        self.assertEqual(result["scoreBreakdown"]["experience"], result["scoreBreakdownMaximums"]["experience"])
        self.assertIn("no score penalty", result["explanation"])

    def test_scoring_is_deterministic_and_strips_protected_traits(self):
        candidate = {
            "name": "Public profile",
            "title": "Data Analyst",
            "industry": "Technology",
            "skills": ["Python"],
            "experienceYears": 1,
            "education": "Unknown",
            "location": "Riyadh",
            "locationClassification": "Saudi Arabia",
            "sourceUrl": "https://profiles.example/deterministic",
            "age": 37,
            "gender": "not-used",
            "nationality": "not-used",
        }

        first = score_candidate(candidate, self.request())
        second = score_candidate(candidate, self.request())

        self.assertEqual(first, second)
        self.assertNotIn("age", first)
        self.assertNotIn("gender", first)
        self.assertNotIn("nationality", first)
        self.assertAlmostEqual(sum(first["scoreBreakdownMaximums"].values()), 100)

    def test_search_returns_at_most_ten_unique_ranked_candidates(self):
        records = [
            {
                "name": f"Candidate {index}",
                "title": "Data Scientist" if index % 2 == 0 else "Analyst",
                "industry": "Technology",
                "skills": ["Python"] if index < 6 else [],
                "experienceYears": 5,
                "education": "Degree",
                "location": "Riyadh",
                "locationClassification": "Saudi Arabia",
                "sourceUrl": f"https://profiles.example/{index}",
                "evidenceConfidence": "High",
            }
            for index in range(12)
        ]
        records.append(records[0].copy())

        with patch("infra.fastapi.main.claude_candidates", return_value=records):
            response = candidate_search(self.request(limit=10))

        self.assertEqual(response["count"], 10)
        self.assertEqual(len(response["candidates"]), 10)
        self.assertEqual(len({candidate["sourceUrl"] for candidate in response["candidates"]}), 10)
        scores = [candidate["atsScore"] for candidate in response["candidates"]]
        self.assertEqual(scores, sorted(scores, reverse=True))


class CandidateSearchValidationTests(unittest.TestCase):
    def setUp(self):
        _search_requests.clear()
        self.client = TestClient(app)
        self.valid = {
            "role": "Data Engineer",
            "industry": "Technology",
            "skills": ["Python", "SQL"],
            "experienceMin": 3,
            "experienceMax": 10,
            "location": "Saudi Arabia",
            "limit": 10,
        }

    def test_invalid_filter_contracts_return_422(self):
        cases = [
            {**self.valid, "role": ""},
            {**self.valid, "experienceMin": 11},
            {**self.valid, "limit": 11},
            {**self.valid, "prompt": "x" * 12001},
        ]
        for payload in cases:
            with self.subTest(payload=payload):
                response = self.client.post("/api/v1/candidate-search", json=payload)
                self.assertEqual(response.status_code, 422)

    def test_empty_provider_result_is_a_valid_empty_state(self):
        with patch("infra.fastapi.main.claude_candidates", return_value=[]):
            response = self.client.post("/api/v1/candidate-search", json=self.valid)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)
        self.assertEqual(response.json()["candidates"], [])

    def test_local_frontend_origin_is_allowed(self):
        response = self.client.options(
            "/api/v1/candidate-search",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["access-control-allow-origin"], "http://localhost:3000")

    def test_rejects_unsafe_or_excessive_profile_urls(self):
        unsafe = self.client.post("/api/v1/candidate-search", json={**self.valid, "publicProfileUrls": ["javascript:alert(1)"]})
        excessive = self.client.post("/api/v1/candidate-search", json={**self.valid, "publicProfileUrls": [f"https://profiles.example/{index}" for index in range(11)]})

        self.assertEqual(unsafe.status_code, 422)
        self.assertEqual(excessive.status_code, 422)

    def test_rejects_blank_or_oversized_skills(self):
        blank = self.client.post("/api/v1/candidate-search", json={**self.valid, "skills": [""]})
        oversized = self.client.post("/api/v1/candidate-search", json={**self.valid, "skills": ["x" * 81]})

        self.assertEqual(blank.status_code, 422)
        self.assertEqual(oversized.status_code, 422)

    def test_optional_api_key_protects_paid_search(self):
        with patch.dict(os.environ, {"API_ACCESS_TOKEN": "local-secret"}):
            denied = self.client.post("/api/v1/candidate-search", json=self.valid)
            with patch("infra.fastapi.main.claude_candidates", return_value=[]):
                allowed = self.client.post("/api/v1/candidate-search", json=self.valid, headers={"X-API-Key": "local-secret"})

        self.assertEqual(denied.status_code, 401)
        self.assertEqual(allowed.status_code, 200)

    def test_search_rate_limit_is_enforced(self):
        with patch.dict(os.environ, {"SEARCH_RATE_LIMIT_PER_MINUTE": "2"}):
            # The configured module-level default is intentionally patched for this isolated test.
            with patch("infra.fastapi.main.RATE_LIMIT_REQUESTS", 2), patch("infra.fastapi.main.claude_candidates", return_value=[]):
                first = self.client.post("/api/v1/candidate-search", json=self.valid)
                second = self.client.post("/api/v1/candidate-search", json=self.valid)
                limited = self.client.post("/api/v1/candidate-search", json=self.valid)

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(limited.status_code, 429)
        self.assertIn("Retry-After", limited.headers)


if __name__ == "__main__":
    unittest.main()
