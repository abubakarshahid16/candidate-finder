import unittest

from infra.fastapi.main import CandidateSearchRequest, score_candidate


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


if __name__ == "__main__":
    unittest.main()
