import unittest
from unittest.mock import patch

from infra.fastapi.main import CandidateSearchRequest, candidate_search, score_candidate


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


if __name__ == "__main__":
    unittest.main()
