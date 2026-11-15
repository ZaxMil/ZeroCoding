#!/usr/bin/env python3
"""Offline, dependency-free checks of one-request-at-a-time routing."""
import sys
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from smart_skill_router import route, load_catalog, detect_intents, suggest_external, detect_project_stack


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
    row("gsap-scrolltrigger", "design", "GSAP ScrollTrigger parallax and pinned scrolling motion."),
    row("gsap-core", "design", "Official GSAP animation tweens."),
    row("react-bits-reference", "design", "React Bits external UI component integration."),
    row("canvas-ui-reference", "design", "Canvas UI WebGL effects reference."),
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

    def test_gsap_scrolltrigger_is_selected_when_named(self):
        names = [s["name"] for s in route("Use GSAP ScrollTrigger for a scroll animation", CATALOG)["selected"]]
        self.assertIn("gsap-scrolltrigger", names)

    def test_react_bits_reference_when_named(self):
        names = [s["name"] for s in route("Use React Bits for animated interface components", CATALOG)["selected"]]
        self.assertIn("react-bits-reference", names)

    def test_canvas_ui_reference_when_named(self):
        names = [s["name"] for s in route("Use Canvas UI WebGL components", CATALOG)["selected"]]
        self.assertIn("canvas-ui-reference", names)

    def test_external_swarm_is_metadata_only_and_not_loaded(self):
        result = route("Use native swarm to coordinate independent workers", CATALOG)
        self.assertNotIn("native_swarm", [x["name"] for x in result["selected"]])
        external = suggest_external("Use native swarm to coordinate independent workers", result["selected"], ROOT)
        self.assertIn("native_swarm", [x["name"] for x in external])
        self.assertTrue(all(x["status"] == "not_installed_metadata_only" for x in external))

    def test_stack_markers_are_read_only(self):
        import tempfile
        import json
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "package.json").write_text(json.dumps({"dependencies":{"react":"18","gsap":"3"}}))
            self.assertEqual(detect_project_stack(root), ["gsap", "react"])

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
        self.assertGreaterEqual(len(catalog), 202)
        results = route("Fix a crash", catalog)
        self.assertTrue(results["selected"])
        for item in results["selected"]:
            self.assertTrue(Path(item["path"]).is_file())


if __name__ == "__main__":
    unittest.main()
