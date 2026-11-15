#!/usr/bin/env python3
"""Offline regression checks for optional upstream gateway (no network)."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / "scripts" / "optional_packs.py"
spec = importlib.util.spec_from_file_location("optional_packs", FILE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class OptionalPacksTest(unittest.TestCase):
    def test_all_requested_sources_are_registered(self):
        rows = module.packs()
        self.assertEqual(
            set(rows),
            {"karpathy", "emil", "graphify", "ponytail", "caveman",
             "hallmark", "superpowers", "agentskills", "antigravity", "anthropic",
             "ui-ux-pro-max-current", "awesome-design-md", "open-design",
             "taste-current", "impeccable", "react-bits", "google-design-md",
             "gsap", "scroll-world", "canvas-ui"},
        )
        self.assertEqual(sum(p["mode"] == "skills" for p in rows.values()), 12)
        self.assertEqual(sum(p["mode"] != "skills" for p in rows.values()), 8)

    def test_valid_dot_repository_is_allowed_without_relaxing_path_safety(self):
        import json
        from unittest.mock import patch
        self.assertEqual(module.packs()["google-design-md"]["repository"], "google-labs-code/design.md")
        original = module.MANIFEST
        for bad in ("bad/..", "bad/.hidden", "bad/evil..repo", "../repo", "bad/repo?query"):
            with self.subTest(repository=bad), tempfile.TemporaryDirectory() as temp:
                data = json.loads(original.read_text(encoding="utf-8"))
                data["packs"][0]["repository"] = bad
                candidate = Path(temp) / "unsafe.json"
                candidate.write_text(json.dumps(data), encoding="utf-8")
                with patch.object(module, "MANIFEST", candidate):
                    with self.assertRaises(module.PackError):
                        module.packs()

    def test_all_sources_are_immutable_pins(self):
        for pack in module.packs().values():
            self.assertEqual(len(pack["revision"]), 40)
            self.assertTrue(pack["repository"].count("/") == 1)

    def test_dry_run_never_creates_files(self):
        with tempfile.TemporaryDirectory() as temp:
            cache = Path(temp) / "vault"
            module.install(cache, module.packs()["hallmark"], dry_run=True)
            self.assertFalse(cache.exists())

    def test_existing_unmanaged_folder_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as temp:
            cache = Path(temp)
            folder = cache / "hallmark"
            folder.mkdir()
            protected = folder / "my-file.txt"
            protected.write_text("keep", encoding="utf-8")
            with self.assertRaises(module.PackError):
                module.install(cache, module.packs()["hallmark"])
            self.assertEqual(protected.read_text(encoding="utf-8"), "keep")

    def test_unmanaged_directory_is_never_removed(self):
        with tempfile.TemporaryDirectory() as temp:
            cache = Path(temp)
            (cache / "hallmark").mkdir()
            with self.assertRaises(module.PackError):
                module.remove(cache, module.packs()["hallmark"])
            self.assertTrue((cache / "hallmark").is_dir())

    def test_reference_does_not_install(self):
        with tempfile.TemporaryDirectory() as temp:
            cache = Path(temp)
            module.install(cache, module.packs()["graphify"])
            self.assertFalse((cache / "graphify").exists())


if __name__ == "__main__":
    unittest.main()
