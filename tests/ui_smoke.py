import json
import unittest

from playwright.sync_api import sync_playwright


def candidate(index: int) -> dict:
    return {
        "id": f"candidate-{index}",
        "name": f"Candidate {index}",
        "title": "Data Engineer",
        "skills": ["Python", "SQL", "Spark"],
        "experienceYears": 5,
        "education": "Verified degree",
        "location": "Riyadh, Saudi Arabia",
        "locationClassification": "Saudi Arabia",
        "relocation": False,
        "atsScore": 100 - index,
        "matchedSkills": ["Python", "SQL", "Spark"],
        "missingSkills": [],
        "confidence": "High",
        "evidenceConfidence": "High",
        "explanation": "All requested criteria matched.",
        "recommendation": "Strong evidence-based match.",
        "scoreBreakdown": {
            "requiredSkills": 40,
            "roleTitle": 20,
            "experience": 15,
            "education": 10,
            "geography": 10,
            "industry": 5,
        },
        "scoreBreakdownMaximums": {
            "requiredSkills": 40,
            "roleTitle": 20,
            "experience": 15,
            "education": 10,
            "geography": 10,
            "industry": 5,
        },
        "sourceUrl": f"https://profiles.example/candidate-{index}",
        "label": "Provider result",
    }


class CandidateFinderBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def test_complete_recruiter_flow(self):
        page = self.browser.new_page(viewport={"width": 1440, "height": 1000})
        response = page.goto("http://localhost:3000", wait_until="networkidle")
        self.assertEqual(response.status, 200)
        self.assertEqual(page.get_by_text("Login", exact=True).count(), 0)

        for destination in ("Candidate search", "Results", "Settings"):
            self.assertTrue(page.get_by_role("button", name=destination).is_visible())

        page.get_by_role("button", name="Data Engineer", exact=True).click()
        self.assertEqual(page.get_by_label("Job title").input_value(), "Data Engineer")
        self.assertEqual(page.get_by_label("Industry").input_value(), "Technology")
        self.assertEqual(page.get_by_label("Location").input_value(), "Saudi Arabia")

        page.get_by_label("Industry").select_option("Custom")
        self.assertTrue(page.get_by_placeholder("Enter an industry").is_visible())
        page.get_by_placeholder("Enter an industry").fill("Aviation")
        page.get_by_label("Industry").select_option("Technology")

        page.get_by_role("button", name="+ AWS").click()
        self.assertIn("AWS", page.get_by_label("Skills (optional)").input_value())
        page.get_by_label("Skills (optional)").fill("phython")
        page.get_by_role("button", name="Suggestion: replace misspelling with Python").click()
        self.assertEqual(page.get_by_label("Skills (optional)").input_value(), "Python")

        page.get_by_label("Location").select_option("Custom")
        self.assertTrue(page.get_by_placeholder("Enter city, country, or region").is_visible())
        page.get_by_label("Location").select_option("Saudi Arabia")

        page.get_by_label("Job description upload").set_input_files(
            {"name": "job.md", "mimeType": "text/markdown", "buffer": b"Senior data engineer with Python and SQL."}
        )
        self.assertEqual(page.get_by_label("Optional search prompt").input_value(), "Senior data engineer with Python and SQL.")
        self.assertTrue(page.get_by_text("Loaded: job.md").is_visible())
        page.get_by_label("Optional authorized profile/provider URL").fill("https://profiles.example/authorized")

        payload = {"count": 10, "provider": "test", "demo": False, "candidates": [candidate(index) for index in range(1, 11)]}
        captured = {}

        def fulfill_search(route):
            captured.update(route.request.post_data_json)
            route.fulfill(status=200, content_type="application/json", body=json.dumps(payload))

        page.route("http://localhost:3001/api/v1/candidate-search", fulfill_search)
        page.get_by_role("button", name="Find candidates").click()
        page.get_by_text("Top 10 verified").wait_for()
        self.assertEqual(captured["role"], "Data Engineer")
        self.assertEqual(captured["industry"], "Technology")
        self.assertEqual(captured["skills"], ["Python"])
        self.assertEqual(captured["experienceMin"], 3)
        self.assertEqual(captured["experienceMax"], 10)
        self.assertEqual(captured["location"], "Saudi Arabia")
        self.assertEqual(captured["limit"], 10)
        self.assertEqual(captured["prompt"], "Senior data engineer with Python and SQL.")
        self.assertEqual(captured["publicProfileUrls"], ["https://profiles.example/authorized"])
        self.assertTrue(page.get_by_text("Rank #10").is_visible())
        self.assertEqual(page.locator("article").count(), 10)

        page.get_by_text("Candidate 1", exact=True).click()
        self.assertTrue(page.get_by_text("ATS score breakdown").is_visible())
        self.assertTrue(page.get_by_text("Not collected or used in hiring scores").is_visible())
        self.assertGreaterEqual(page.get_by_role("link", name="Open public source").count(), 1)
        page.get_by_role("button", name="Close").click()

        page.get_by_role("button", name="Settings").click()
        self.assertTrue(page.get_by_role("heading", name="Settings").is_visible())
        page.get_by_role("button", name="Results").click()
        self.assertTrue(page.get_by_role("heading", name="Top candidates").is_visible())
        page.close()

    def test_mobile_layout_has_no_horizontal_overflow(self):
        page = self.browser.new_page(viewport={"width": 390, "height": 844})
        page.goto("http://localhost:3000", wait_until="networkidle")
        self.assertTrue(page.get_by_role("button", name="Candidate search").is_visible())
        dimensions = page.evaluate("() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth })")
        self.assertLessEqual(dimensions["scroll"], dimensions["client"])
        page.close()

    def test_empty_and_network_error_states(self):
        page = self.browser.new_page(viewport={"width": 1280, "height": 900})
        page.goto("http://localhost:3000", wait_until="networkidle")
        page.get_by_role("button", name="Data Engineer", exact=True).click()
        page.get_by_label("Skills (optional)").fill("")

        empty_payload = {"count": 0, "provider": "test", "demo": False, "candidates": []}
        page.route("http://localhost:3001/api/v1/candidate-search", lambda route: route.fulfill(status=200, content_type="application/json", body=json.dumps(empty_payload)))
        page.get_by_role("button", name="Find candidates").click()
        self.assertTrue(page.get_by_role("heading", name="No results yet").is_visible())

        page.unroute("http://localhost:3001/api/v1/candidate-search")
        page.get_by_role("button", name="Go to candidate search").click()
        page.route("http://localhost:3001/api/v1/candidate-search", lambda route: route.abort("connectionfailed"))
        page.get_by_role("button", name="Find candidates").click()
        page.get_by_text("Cannot reach the candidate-search API", exact=False).wait_for()
        page.close()


if __name__ == "__main__":
    unittest.main()
