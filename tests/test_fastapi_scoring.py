import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from infra.fastapi.main import CandidateSearchRequest, app, candidate_search, score_candidate


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

        self.assertEqual(result["atsScore"], 90)
        self.assertEqual(result["scoreBreakdown"]["requiredSkills"], 40)
        self.assertEqual(result["scoreBreakdown"]["education"], 0)
        self.assertEqual(result["scoreBreakdown"]["geography"], 10)
        self.assertEqual(result["confidence"], "High")

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
            },
            self.request(),
        )

        self.assertEqual(result["atsScore"], 0)
        self.assertEqual(result["sourceUrl"], "")
        self.assertNotIn("age", result)

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
            {**self.valid, "skills": []},
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


if __name__ == "__main__":
    unittest.main()
