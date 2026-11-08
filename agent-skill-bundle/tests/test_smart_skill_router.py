#!/usr/bin/env python3
"""Offline, dependency-free checks of one-request-at-a-time routing."""
import sys
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from smart_skill_router import route, load_catalog, detect_intents


def row(name, category, description):
    return {
        "name": name,
        "source": category + "/" + name,
        "description": description,
        "path": "/test-only/" + category + "/" + name + "/SKILL.md",
    }


CATALOG = [
    row("hallmark", "design", "Anti AI slop, original visual design and UI review."),
    row("ui-ux-pro-max", "design", "Design beautiful, responsive websites and application UI."),
    row("animate", "design", "Animate frontend motion transitions and microinteractions."),
    row("systematic-debugging", "process", "Root-cause debugging of crashes and bugs."),
    row("webapp-testing", "design", "Test browser frontend application behavior."),
    row("web-security-audit", "security", "Audit website vulnerabilities and web security."),
    row("seo", "qa", "Check SEO indexing and search optimization."),
    row("godot-gdscript-patterns", "coding", "Godot GDScript game programming."),
]


class SmartRouterTest(unittest.TestCase):
    def test_interface_and_animation_use_relevant_skills(self):
        result = route("Redesign the website UI, fix responsive layout, and improve animations", CATALOG)
        names = [x["name"] for x in result["selected"]]
        self.assertIn("ui-ux-pro-max", names)
        self.assertIn("animate", names)
        self.assertNotIn("web-security-audit", names)
        self.assertLessEqual(len(names), 4)

    def test_new_chat_message_reselects_not_reuses(self):
        first = route("Redesign our website UI and animate transitions", CATALOG)
        second = route("Now review security vulnerabilities and SEO indexing", CATALOG)
        one = {x["name"] for x in first["selected"]}
        two = {x["name"] for x in second["selected"]}
        self.assertIn("web-security-audit", two)
        self.assertIn("seo", two)
        self.assertTrue(one.isdisjoint(two))

    def test_greeting_does_not_force_skills(self):
        self.assertEqual(route("Hi, how are you?", CATALOG)["selected"], [])

    def test_simple_debugging_uses_one(self):
        found = route("Fix a crash", CATALOG)
        self.assertEqual([x["name"] for x in found["selected"]], ["systematic-debugging"])

    def test_rejects_unrelated_godot_skill(self):
        found = route("Make this mobile game load faster", CATALOG)
        self.assertNotIn("godot-gdscript-patterns", [x["name"] for x in found["selected"]])

    def test_limits_and_input_validation(self):
        self.assertLessEqual(route("Full website UI SEO security performance testing review", CATALOG, 3)["count"], 3)
        with self.assertRaises(ValueError):
            route(" ", CATALOG)
        with self.assertRaises(ValueError):
            route("test", CATALOG, 0)

    def test_arabic_website_and_seo_terms(self):
        self.assertIn("seo", detect_intents("راجع فهرسة الموقع والسيو"))

    def test_real_vault_is_readable_without_installing_anything(self):
        catalog = load_catalog(ROOT)
        self.assertGreaterEqual(len(catalog), 190)
        results = route("Fix a crash", catalog)
        self.assertTrue(results["selected"])
        for item in results["selected"]:
            self.assertTrue(Path(item["path"]).is_file())


if __name__ == "__main__":
    unittest.main()
