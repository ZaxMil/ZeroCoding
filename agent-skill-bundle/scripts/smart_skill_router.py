#!/usr/bin/env python3
"""Select relevant on-disk SKILL.md documents for ONE user request.

Only names, paths and frontmatter descriptions are indexed. This tool never
reads complete skill instructions into the agent, installs packs, invokes
third-party code, persists selections, or edits the user project. The agent
must open the selected SKILL.md files explicitly for the CURRENT request.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import sys

import skill_doctor

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MAX = 4
STOP = frozenset("""
a an the and or to for from on with in at i we my me our it this that
is are be been was were do does did please can could should would want
need make just help use using add change another now same new current
project work task things something update thanks hello hi hey
""".split())

# A narrow intent has specific skills. These are preferences, not mandatory
# installs or instructions; other catalog skills are scored for relevance too.
RULES = {
    "design": {
        "pattern": r"\b(ui|ux|design|redesign|layout|responsive|frontend|website|webpage|landing[ -]?page|interface|visual|aesthetic|mockup|antislop|anti[ -]?slop)\b|تصميم|واجه|متجاوب|شكل الموقع",
        "preferred": ("hallmark", "ui-ux-pro-max", "frontend-design", "web-design-guidelines", "ui-designer", "design-taste-frontend"),
    },
    "motion": {
        "pattern": r"\b(animations?|animate|motion|transitions?|parallax|microinteractions?|videos?|reels?|remotion|cinematic)\b|انيميشن|موشن|فيديو|حرك",
        "preferred": ("animate", "emil-design-eng", "review-animations", "code-motion-reel", "animation-performance", "animation-vocabulary"),
    },
    "debug": {
        "pattern": r"\b(bugs?|debug|broken|crash|errors?|failure|stuck|not working|regression|troubleshoot)\b|اصلح|مشكله|خطأ|تعطل|مش شغال",
        "preferred": ("systematic-debugging", "frontend-silent-failure-debugging", "ai-regression-testing", "debugger"),
    },
    "testing": {
        "pattern": r"\b(tests?|testing|qa|quality assurance|verify|validate|e2e|audit|accessibility)\b|اختبار|فحص|راجع",
        "preferred": ("webapp-testing", "web-quality-audit", "ai-regression-testing", "release-readiness", "accessibility"),
    },
    "security": {
        "pattern": r"\b(security|secure|vulnerability|vulnerabilities|penetration|pentest|injection|auth|authentication|authorization|secret|xss|csrf)\b|امن|أمن|ثغرات|اختراق|صلاحيات",
        "preferred": ("web-security-audit", "security-audit", "secure-by-default-development", "api-security-probing"),
    },
    "seo": {
        "pattern": r"\b(seo|geo|indexing|indexation|sitemap|search console|search engine|structured data|ranking|schema markup)\b|سيو|فهرس|محرك البحث",
        "preferred": ("seo", "seo-audit", "ai-seo", "schema", "site-architecture"),
    },
    "performance": {
        "pattern": r"\b(speed|speedup|slow|performance|latency|lighthouse|core web vitals|load time|optimi[sz]e|fps)\b|سرع|بطء|اداء|أداء",
        "preferred": ("core-web-vitals", "performance", "production-audit", "best-practices"),
    },
    "game": {
        "pattern": r"\b(game|gaming|godot|gdscript|unity|gameplay|2d game|3d game|level design)\b|لعبه|لعبة|العاب|ألعاب",
        "preferred": ("godot-gdscript-patterns", "game-ready-2d-asset-pipeline", "game-economy-designer"),
    },
    "automation": {
        "pattern": r"\b(automation|automate|workflow|n8n|scheduled|scheduler|cron|zapier|pipeline)\b|اوتوميشن|أتمت|جدول تلقائ|تلقائي",
        "preferred": ("using-n8n-skills-official", "n8n-workflow-lifecycle-official", "n8n-debugging-official"),
    },
    "wordpress": {
        "pattern": r"\b(wordpress|woocommerce|wp-cli|wordpress plugin|wordpress theme)\b|ووردبريس|وردبريس",
        "preferred": ("wordpress", "wordpress-security", "wordpress-security-audit"),
    },
    "marketing": {
        "pattern": r"\b(marketing|conversion|advertising|ads|outreach|branding|copywriting|sales|retention|growth|campaign|social media)\b|تسويق|اعلان|إعلان|مبيعات",
        "preferred": ("marketing-plan", "cro", "copywriting", "marketing-ideas", "social"),
    },
    "deploy": {
        "pattern": r"\b(deploy|deployment|release|hosting|server|docker|vercel|nginx|ci/cd|github actions)\b|نشر|استضافة|سيرفر|خادم",
        "preferred": ("release-readiness", "production-audit", "verification-before-completion"),
    },
    "documents": {
        "pattern": r"\b(pdf|docx|word document|powerpoint|pptx|spreadsheet|xlsx|document layout)\b|مستند|ملف وورد|بوربوينت|جداول",
        "preferred": ("pdf", "docx", "pptx", "xlsx", "doc-coauthoring"),
    },
    "code-review": {
        "pattern": r"\b(code review|pull request|\bpr\b|refactor|simplif|clean up code|tech debt|git merge)\b|مراجعة الكود|دمج الكود",
        "preferred": ("ponytail-review", "requesting-code-review", "ponytail", "task-to-pr"),
    },
}

# A word such as "fix" should not select a dozen debugging skills solely by
# matching "development" in generic descriptions. Prefer precise names first.
CONTROL_SKILLS = {"i-have-adhd", "skill-retrieval-routing", "credit-usage-helper"}
GENERIC_GATEWAYS = {"graphify", "n8n-instance", "claude-mem", "openmontage", "shuohao-skills", "zax-editor"}
WORD = re.compile(r"[a-z0-9][a-z0-9-]*", re.I)


def terms(value: str) -> set[str]:
    return {w for w in WORD.findall(value.lower()) if len(w) > 2 and w not in STOP}


def load_catalog(vault: Path) -> list[dict]:
    rows = skill_doctor.skill_catalog(vault) + skill_doctor.external_skill_catalog()
    # Project Core sources may not be in category directories.
    profile = vault / "profiles" / "project-core" / "profile.json"
    if profile.is_file():
        data = json.loads(profile.read_text(encoding="utf-8"))
        for item in data.get("core_skills", []):
            path = vault / item["source"] / "SKILL.md"
            if path.is_file() and not path.is_symlink() and not path.parent.is_symlink():
                prefix = path.read_text(encoding="utf-8", errors="replace")[:3500]
                match = re.search(r"^description:\s*(.+)$", prefix, re.M)
                rows.append({"name": item["name"], "source": item["source"],
                             "description": match.group(1).strip() if match else "",
                             "path": str(path.resolve())})
    # Exact skills, not external metadata or tools requiring extra runtimes.
    unique = {}
    for row in rows:
        if row.get("external") or row["name"] in CONTROL_SKILLS or row["name"] in GENERIC_GATEWAYS:
            continue
        path = Path(row["path"])
        if path.name != "SKILL.md" or not path.is_file() or path.is_symlink() or path.parent.is_symlink():
            continue
        name = row["name"].lower()
        # Prefer reviewed local copies for duplicate names, unless there is
        # no local copy. Optional source files are still searchable.
        if name not in unique or (unique[name]["source"].startswith("optional:") and not row["source"].startswith("optional:")):
            unique[name] = row
    return list(unique.values())


def detect_intents(task: str) -> list[str]:
    return [name for name, rule in RULES.items() if re.search(rule["pattern"], task.lower(), re.I)]


def rank(row: dict, task_tokens: set[str], intent: str) -> float:
    rule = RULES[intent]
    name = row["name"].lower()
    name_words = terms(name.replace("-", " "))
    desc_words = terms(row.get("description") or "")
    preferred = rule["preferred"]
    overlap = task_tokens & (name_words | desc_words)
    if name in preferred:
        # Common core patterns (security, SEO, QA) are good for broad goals;
        # narrow engines/specialties require an actual matching clue.
        narrow = {
            "godot-gdscript-patterns": {"godot", "gdscript"},
            "game-ready-2d-asset-pipeline": {"2d", "asset", "sprite"},
            "animate": {"animate", "animation", "motion", "transition"},
            "code-motion-reel": {"video", "reel", "remotion", "cinematic", "motion"},
            "n8n-workflow-lifecycle-official": {"n8n"},
            "wordpress-security-audit": {"wordpress", "woocommerce"},
            "task-to-pr": {"git", "pr", "github", "pull"},
            "seo": {"seo", "indexing", "search", "sitemap"},
        }
        if name not in narrow or task_tokens & narrow[name]:
            return 40 - preferred.index(name) * 2.5 + 0.5 * len(overlap)
        return 0
    if not overlap:
        return 0
    category_hint = {
        "design": ("design/", "qa/screenshot"), "motion": ("creative/", "design/"),
        "debug": ("qa/", "process/"), "testing": ("qa/", "process/"),
        "security": ("security/",), "seo": ("qa/", "marketing/"),
        "performance": ("qa/",), "game": ("coding/", "creative/", "design/"),
        "automation": ("automation/",), "wordpress": ("wordpress/",),
        "marketing": ("marketing/",), "deploy": ("operations/", "ops/", "qa/"),
        "documents": ("design/",), "code-review": ("coding/", "process/"),
    }
    prefix = row["source"].split(":")[0] + "/" if ":" not in row["source"] else ""
    bonus = 3 if any(prefix.startswith(p) for p in category_hint.get(intent, ())) else 0
    return min(len(overlap & name_words), 5) * 3 + min(len(overlap & desc_words), 5) + bonus


def route(task: str, catalog: list[dict], limit: int = DEFAULT_MAX) -> dict:
    if not task.strip():
        raise ValueError("task cannot be blank")
    if not 1 <= limit <= 8:
        raise ValueError("max-skills must be between 1 and 8")
    intents = detect_intents(task)
    task_tokens = terms(task)
    selected: list[dict] = []
    seen = set()
    candidates = {}
    for intent in intents:
        ranked = sorted(
            ((rank(row, task_tokens, intent), row) for row in catalog),
            key=lambda x: (-x[0], x[1]["name"], x[1]["source"]),
        )
        # Only choose a skill for the task if there is positive evidence.
        candidates[intent] = [(score, row) for score, row in ranked if score >= 6]

    # Give distinct goals at least one matching skill before selecting extras.
    for intent in intents:
        for score, row in candidates[intent]:
            if row["name"].lower() not in seen:
                selected.append({"name": row["name"], "source": row["source"],
                                 "path": row["path"], "reason": intent})
                seen.add(row["name"].lower())
                break
        if len(selected) >= limit:
            break

    # A complex single goal may benefit from 2-3 complementary skills, but a
    # simple task gets one (or zero), never a mandatory quota.
    detailed = len(task_tokens) >= 8 or re.search(
        r"\b(full|complete|comprehensive|everything|entire|end.to.end|from scratch|all aspects)\b",
        task.lower(),
    )
    target = min(limit, len(selected) + (2 if detailed and len(intents) == 1 else 1 if detailed else 0))
    if not selected and intents:
        target = 0
    extra = sorted(
        ((score, intent, row) for intent in intents for score, row in candidates[intent]
         if row["name"].lower() not in seen),
        key=lambda x: (-x[0], x[1], x[2]["name"]),
    )
    for _, intent, row in extra:
        if len(selected) >= target:
            break
        if row["name"].lower() in seen:
            continue
        selected.append({"name": row["name"], "source": row["source"],
                         "path": row["path"], "reason": intent})
        seen.add(row["name"].lower())

    # When user asks for specialist work outside known themes, use a
    # strict name/description match but never invent a skill.
    if not intents and len(task_tokens) >= 2:
        fallback = sorted(
            ((len(task_tokens & terms(row["name"].replace("-", " "))) * 4 +
              len(task_tokens & terms(row.get("description", ""))), row)
             for row in catalog),
            key=lambda x: (-x[0], x[1]["name"]),
        )
        if fallback and fallback[0][0] >= 7:
            row = fallback[0][1]
            selected.append({"name": row["name"], "source": row["source"],
                             "path": row["path"], "reason": "exact-match"})

    return {
        "policy": "fresh-selection-for-this-message-only",
        "intents": intents,
        "selected": selected,
        "count": len(selected),
        "limit": limit,
        "note": "Read only these SKILL.md files after validating their local paths. No automatic execution.",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Pick only skills needed for the current user message")
    parser.add_argument("--task", required=True, help="Current user request only; do not paste the entire conversation")
    parser.add_argument("--max-skills", type=int, default=DEFAULT_MAX)
    parser.add_argument("--vault", type=Path, default=ROOT)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    try:
        result = route(args.task, load_catalog(args.vault.resolve()), args.max_skills)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"Router: {error}", file=sys.stderr)
        return 2
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print("Selected for this request only:")
        if not result["selected"]:
            print("  none (no sufficiently relevant locally available skill)")
        for skill in result["selected"]:
            print(f"  {skill['name']} [{skill['reason']}] {skill['path']}")
        print("Scope expires at the next user request. Open selected SKILL.md only.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
