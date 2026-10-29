"""Gemini / Antigravity CLI adapter.

Supports:
  1. Antigravity Brain transcripts: ~/.gemini/antigravity/brain/*/transcript.jsonl
  2. Gemini CLI chats: ~/.gemini/tmp/<project_hash>/chats/*.json
"""

from __future__ import annotations

import datetime
import json
import re
from pathlib import Path
from typing import Any

from .base import CORRECTION_RE, BaseAdapter


def _ts(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return datetime.datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()
        except (ValueError, AttributeError):
            return None
    return None


class GeminiAdapter(BaseAdapter):
    RUNTIME_ID = "gemini"

    GEMINI_TMP_DIR = Path.home() / ".gemini" / "tmp"
    ANTIGRAVITY_BRAIN_DIR = Path.home() / ".gemini" / "antigravity" / "brain"

    def discover(self) -> list[Path]:
        """Find all session files under ~/.gemini/tmp/ and Antigravity brain transcripts."""
        files: list[Path] = []
        if self.GEMINI_TMP_DIR.exists():
            try:
                for jf in self.GEMINI_TMP_DIR.rglob("chats/*.json"):
                    try:
                        if jf.is_file():
                            files.append(jf)
                    except OSError:
                        continue
            except OSError:
                pass

        if self.ANTIGRAVITY_BRAIN_DIR.exists():
            try:
                for tf in self.ANTIGRAVITY_BRAIN_DIR.rglob("transcript.jsonl"):
                    try:
                        if tf.is_file():
                            files.append(tf)
                    except OSError:
                        continue
            except OSError:
                pass

        return sorted(files, key=lambda f: f.stat().st_mtime, reverse=True)

    def parse(self, path: Path) -> list[dict[str, Any]]:
        """Parse one Gemini chat JSON or Antigravity JSONL file into user-prompt records."""
        if path.suffix == ".jsonl":
            return self._parse_antigravity(path)
        return self._parse_gemini_json(path)

    def _parse_antigravity(self, path: Path) -> list[dict[str, Any]]:
        timeline: list[dict[str, Any]] = []
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        step = json.loads(line)
                    except Exception:
                        continue
                    stype = step.get("type")
                    content = step.get("content", "")
                    ts = _ts(step.get("created_at"))
                    if stype == "USER_INPUT":
                        clean_text = content or ""
                        if "<USER_REQUEST>" in clean_text:
                            clean_text = clean_text.split("<USER_REQUEST>")[1].split("</USER_REQUEST>")[0]
                        clean_text = clean_text.strip()
                        if clean_text:
                            timeline.append({"kind": "user", "text": clean_text, "ts": ts})
                    elif stype == "PLANNER_RESPONSE":
                        has_err = step.get("status") == "ERROR"
                        timeline.append({
                            "kind": "assistant",
                            "text": content or "",
                            "ts": ts,
                            "model": str(step.get("model", "gemini-2.5-pro")),
                            "has_error": has_err,
                            "input_tokens": step.get("input_tokens", 0),
                            "output_tokens": step.get("output_tokens", 0),
                        })
        except Exception:
            return []

        user_indices = [i for i, t in enumerate(timeline) if t["kind"] == "user"]
        records: list[dict[str, Any]] = []
        for n, idx in enumerate(user_indices):
            turn = timeline[idx]
            next_user = user_indices[n + 1] if n + 1 < len(user_indices) else len(timeline)
            model = ""
            context_after_assistant = ""
            has_error = False
            for j in range(idx + 1, next_user):
                if timeline[j]["kind"] == "assistant":
                    model = timeline[j].get("model", "") or model
                    if timeline[j].get("has_error"):
                        has_error = True
                    if not context_after_assistant:
                        context_after_assistant = timeline[j]["text"]

            context_before = ""
            for j in range(idx - 1, -1, -1):
                if timeline[j]["kind"] == "assistant":
                    context_before = timeline[j]["text"]
                    break

            followed_by_correction = False
            correction_text = ""
            if next_user < len(timeline):
                nxt = timeline[next_user]["text"]
                if CORRECTION_RE.search(nxt):
                    followed_by_correction = True
                    correction_text = nxt

            records.append({
                "runtime": self.RUNTIME_ID,
                "session_file": str(path),
                "prompt_text": turn["text"],
                "timestamp": turn.get("ts"),
                "model": model or "gemini",
                "context_before": context_before,
                "followed_by_error": has_error,
                "error_was_recovered": False,
                "followed_by_correction": followed_by_correction,
                "correction_text": correction_text,
                "error_tool": "",
                "error_text": "",
            })
        return records

    def _parse_gemini_json(self, path: Path) -> list[dict[str, Any]]:
        try:
            obj = json.loads(path.read_text(encoding="utf-8", errors="replace"))
        except (OSError, json.JSONDecodeError):
            return []
        if not isinstance(obj, dict):
            return []

        messages = obj.get("messages")
        if not isinstance(messages, list):
            return []

        timeline: list[dict[str, Any]] = []
        for m in messages:
            if not isinstance(m, dict):
                continue
            mtype = m.get("type")
            content = m.get("content", "")
            if not isinstance(content, str) or not content.strip():
                continue
            ts = _ts(m.get("timestamp"))
            if mtype == "user":
                timeline.append({"kind": "user", "text": content, "ts": ts})
            elif mtype == "gemini":
                model = m.get("model")
                timeline.append({
                    "kind": "assistant",
                    "text": content,
                    "ts": ts,
                    "model": str(model) if model else "",
                })

        user_indices = [i for i, t in enumerate(timeline) if t["kind"] == "user"]
        records: list[dict[str, Any]] = []
        for n, idx in enumerate(user_indices):
            turn = timeline[idx]
            next_user = user_indices[n + 1] if n + 1 < len(user_indices) else len(timeline)

            model = ""
            context_after_assistant = ""
            for j in range(idx + 1, next_user):
                if timeline[j]["kind"] == "assistant":
                    model = timeline[j].get("model", "") or model
                    if not context_after_assistant:
                        context_after_assistant = timeline[j]["text"]

            context_before = ""
            for j in range(idx - 1, -1, -1):
                if timeline[j]["kind"] == "assistant":
                    context_before = timeline[j]["text"]
                    break

            followed_by_correction = False
            correction_text = ""
            if next_user < len(timeline):
                nxt = timeline[next_user]["text"]
                if CORRECTION_RE.search(nxt):
                    followed_by_correction = True
                    correction_text = nxt

            records.append({
                "runtime": self.RUNTIME_ID,
                "session_file": str(path),
                "prompt_text": turn["text"],
                "timestamp": turn.get("ts"),
                "model": model,
                "context_before": context_before,
                "followed_by_error": False,
                "error_was_recovered": False,
                "followed_by_correction": followed_by_correction,
                "correction_text": correction_text,
                "error_tool": "",
                "error_text": "",
            })

        return records
