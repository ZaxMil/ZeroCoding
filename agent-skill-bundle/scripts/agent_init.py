#!/usr/bin/env python3
"""Project Core one-command project bootstrap for Antigravity, Codex and Claude.

Installs a small project-local core profile into host-recognized skill roots,
with the complete source vault outside the project for on-demand retrieval.
Preserves existing project rules, unmarked skills, and application code.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
from typing import Any

DEFAULT_REF = "main"
MANAGER = "agent-project-bootstrap"
BEGIN = "<!-- AGENT_INIT:BEGIN -->"
END = "<!-- AGENT_INIT:END -->"
HOST_ROOTS = {
    "antigravity": ".agents/skills",
    "codex": ".agents/skills",
    "claude": ".claude/skills",
}


def target_skill_roots(project: Path, host: str) -> list[Path]:
    selected = HOST_ROOTS.keys() if host == "all" else (host,)
    return list(dict.fromkeys(project / HOST_ROOTS[name] for name in selected))


def detect_project(project: Path) -> dict[str, list[str]]:
    """Read project markers only. Never execute code or install dependencies."""
    found: set[str] = set()
    if (project / "package.json").is_file():
        found.add("node")
        try:
            package = json.loads((project / "package.json").read_text(encoding="utf-8"))
            dependencies = {**package.get("dependencies", {}), **package.get("devDependencies", {})}
            for pkg, label in (
                ("react", "react"), ("next", "nextjs"), ("astro", "astro"),
                ("vue", "vue"), ("svelte", "svelte"), ("@supabase/supabase-js", "supabase"),
            ):
                if pkg in dependencies:
                    found.add(label)
            if "typescript" in dependencies:
                found.add("typescript")
        except (OSError, ValueError, TypeError):
            pass
    for marker, label in (
        ("pyproject.toml", "python"), ("requirements.txt", "python"),
        ("Pipfile", "python"), ("project.godot", "godot"),
        ("pubspec.yaml", "flutter"), ("Cargo.toml", "rust"),
        ("go.mod", "go"), ("composer.json", "php"),
        ("wp-config.php", "wordpress"), ("wp-config-sample.php", "wordpress"),
        ("build.gradle", "gradle"), ("settings.gradle", "gradle"),
        ("pom.xml", "java"), ("docker-compose.yml", "docker"),
        ("compose.yaml", "docker"), ("Dockerfile", "docker"),
    ):
        if (project / marker).is_file():
            found.add(label)
    if (project / "Assets").is_dir() and (project / "ProjectSettings").is_dir():
        found.add("unity")
    if list(project.glob("*.sln")) or list(project.glob("*.csproj")):
        found.add("dotnet")
    queries = {
        "godot": "godot gdscript game",
        "react": "frontend design accessibility performance",
        "nextjs": "nextjs seo performance",
        "astro": "astro seo performance",
        "vue": "frontend design performance",
        "svelte": "frontend design performance",
        "flutter": "mobile native ui",
        "wordpress": "wordpress security performance",
        "python": "python testing security",
        "supabase": "supabase auth database security",
        "unity": "game testing performance",
        "node": "typescript testing quality",
    }
    return {
        "detected_stacks": sorted(found) if found else ["generic"],
        "specialist_search_queries": [queries[tag] for tag in sorted(found) if tag in queries],
    }


class BootstrapError(RuntimeError):
    pass


def run(cmd: list[str], *, cwd: Path | None = None, check: bool = True) -> subprocess.CompletedProcess[str]:
    proc = subprocess.run(cmd, cwd=cwd, text=True, capture_output=True)
    if check and proc.returncode != 0:
        detail = (proc.stderr or proc.stdout).strip()
        raise BootstrapError(f"command failed: {' '.join(cmd)}\n{detail}")
    return proc


def find_project(explicit: str | None) -> Path:
    if explicit:
        project = Path(explicit).expanduser().resolve()
    else:
        probe = run(["git", "rev-parse", "--show-toplevel"], check=False)
        project = Path(probe.stdout.strip()).resolve() if probe.returncode == 0 and probe.stdout.strip() else Path.cwd().resolve()
    if not project.exists() or not project.is_dir():
        raise BootstrapError(f"project directory does not exist: {project}")
    return project


def default_checkout() -> Path:
    config = Path.home() / ".agent-tools" / "bundle.json"
    if config.is_file():
        try:
            data = json.loads(config.read_text(encoding="utf-8"))
            candidate = data.get("bundle_root")
            if candidate:
                return Path(candidate).expanduser().resolve()
        except (OSError, ValueError, TypeError):
            pass
    return (Path.home() / ".agent-tools" / "ZeroCoding" / "agent-skill-bundle").resolve()


def ensure_checkout(source_arg: str | None, no_update: bool, ref: str) -> Path:
    source = Path(source_arg).expanduser().resolve() if source_arg else default_checkout()
    if not (source / "profiles" / "project-core" / "profile.json").is_file():
        raise BootstrapError(
            f"bundle source not found: {source}\n"
            "Run bundle-install first, or pass --source <bundle-path>."
        )
    return source


def load_profile(source: Path) -> dict[str, Any]:
    path = source / "profiles" / "project-core" / "profile.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    skills = data.get("core_skills")
    if not isinstance(skills, list) or not skills:
        raise BootstrapError("Project Core profile has no core_skills")
    for entry in skills:
        if not isinstance(entry, dict) or not entry.get("name") or not entry.get("source"):
            raise BootstrapError("invalid core skill entry in Project Core profile")
    return data


def marker_path(destination: Path) -> Path:
    return destination / ".agent-init-managed.json"


def is_managed(destination: Path, source_key: str) -> bool:
    marker = marker_path(destination)
    if not marker.is_file() or marker.is_symlink():
        return False
    try:
        data = json.loads(marker.read_text(encoding="utf-8"))
    except (ValueError, OSError):
        return False
    return data.get("manager") == MANAGER and data.get("source") == source_key


def git_head(source: Path) -> str | None:
    proc = run(["git", "-C", str(source), "rev-parse", "HEAD"], check=False)
    return proc.stdout.strip() if proc.returncode == 0 and proc.stdout.strip() else None


def install_skill(source: Path, destination: Path, source_key: str, force: bool, head: str | None) -> None:
    origin = source / source_key
    if not (origin / "SKILL.md").is_file():
        raise BootstrapError(f"missing core skill source: {source_key}")

    if destination.exists():
        if destination.is_symlink():
            raise BootstrapError(f"refusing to replace symlink skill: {destination}")
        if not is_managed(destination, source_key) and not force:
            raise BootstrapError(
                f"refusing to replace existing unmarked skill: {destination}\n"
                "Review it first, then rerun with --force only if replacement is intended."
            )
        if destination.is_dir():
            shutil.rmtree(destination)
        else:
            destination.unlink()

    shutil.copytree(origin, destination, symlinks=False)
    marker_path(destination).write_text(
        json.dumps(
            {"manager": MANAGER, "source": source_key, "bundle_commit": head},
            indent=2,
            sort_keys=True,
        ) + "\n",
        encoding="utf-8",
    )


def managed_rules(source: Path, profile: dict[str, Any]) -> str:
    relative = profile.get("rules_template")
    if not isinstance(relative, str) or not relative:
        raise BootstrapError("Project Core profile rules_template is missing")
    body = (source / relative).read_text(encoding="utf-8").strip()
    return f"{BEGIN}\n{body}\n{END}"


def update_agents(project: Path, block: str, filename: str = "AGENTS.md") -> None:
    path = project / filename
    if path.is_symlink():
        raise BootstrapError(f"refusing to write through symlink: {path}")
    current = path.read_text(encoding="utf-8") if path.exists() else ""
    has_begin, has_end = BEGIN in current, END in current
    if has_begin != has_end:
        raise BootstrapError(f"{filename} has an incomplete Project Core managed block; refusing to edit it")

    if has_begin:
        start = current.index(BEGIN)
        stop = current.index(END, start) + len(END)
        updated = current[:start].rstrip() + "\n\n" + block + current[stop:]
    else:
        updated = current.rstrip()
        if updated:
            updated += "\n\n"
        updated += block + "\n"

    path.write_text(updated.rstrip() + "\n", encoding="utf-8")


def write_manifest(
    project: Path, source: Path, profile: dict[str, Any], head: str | None,
    host: str, roots: list[Path],
) -> None:
    agents = project / ".agents"
    if agents.is_symlink():
        raise BootstrapError(f"refusing symlink project metadata directory: {agents}")
    agents.mkdir(parents=True, exist_ok=True)
    payload = {
        "manager": MANAGER,
        "profile": profile.get("name", "Project Core"),
        "profile_version": profile.get("profile_version"),
        "host": host,
        "project_skill_roots": [str(root.relative_to(project)) for root in roots],
        "project_detection": detect_project(project),
        "vault_mode": profile.get("vault_mode", "on-demand"),
        "vault_path": str(source),
        "bundle_commit": head,
        "core_skills": [entry["name"] for entry in profile["core_skills"]],
        "specialist_search": f'python "{source / "scripts" / "skill_doctor.py"}" search "<keywords>"',
    }
    dest = agents / "agent-init.json"
    if dest.is_symlink():
        raise BootstrapError(f"refusing symlink manifest: {dest}")
    if dest.exists():
        try:
            existing = json.loads(dest.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            existing = {}
        if existing.get("manager") != MANAGER:
            raise BootstrapError(f"refusing to replace unowned manifest: {dest}")
    dest.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def remove_managed_block(path: Path) -> None:
    if path.is_symlink():
        raise BootstrapError(f"refusing to write through symlink: {path}")
    if not path.exists():
        return
    current = path.read_text(encoding="utf-8")
    has_begin, has_end = BEGIN in current, END in current
    if not has_begin and not has_end:
        return
    if has_begin != has_end:
        raise BootstrapError("AGENTS.md has an incomplete Project Core managed block; refusing to remove it")
    start = current.index(BEGIN)
    stop = current.index(END, start) + len(END)
    updated = (current[:start].rstrip() + "\n\n" + current[stop:].lstrip()).strip()
    if updated:
        path.write_text(updated + "\n", encoding="utf-8")
    else:
        path.unlink()


def remove_profile(project: Path, profile: dict[str, Any]) -> None:
    removed = 0
    for skills_root in target_skill_roots(project, "all"):
        for entry in profile["core_skills"]:
            destination = skills_root / entry["name"]
            if destination.exists() and is_managed(destination, entry["source"]):
                shutil.rmtree(destination)
                removed += 1
    manifest = project / ".agents" / "agent-init.json"
    if manifest.is_file():
        try:
            data = json.loads(manifest.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            data = {}
        if data.get("manager") == MANAGER:
            manifest.unlink()
    remove_managed_block(project / "AGENTS.md")
    remove_managed_block(project / "CLAUDE.md")
    print(f"Project Core profile removed: {removed} managed skill copies. Unmarked skills/project rules were preserved.")


def status(project: Path, profile: dict[str, Any], host: str) -> int:
    roots = target_skill_roots(project, host)
    missing = []
    unmanaged = []
    for skills_root in roots:
        for entry in profile["core_skills"]:
            destination = skills_root / entry["name"]
            if not (destination / "SKILL.md").is_file():
                missing.append(str(destination.relative_to(project)))
            elif not is_managed(destination, entry["source"]):
                unmanaged.append(str(destination.relative_to(project)))

    manifest = project / ".agents" / "agent-init.json"
    manifest_ok = False
    if manifest.is_file():
        try:
            data = json.loads(manifest.read_text(encoding="utf-8"))
            configured = set(data.get("project_skill_roots", []))
            expected = {str(root.relative_to(project)) for root in roots}
            manifest_ok = data.get("manager") == MANAGER and expected.issubset(configured)
        except (OSError, ValueError, TypeError):
            pass
    agents_text = (project / "AGENTS.md").read_text(encoding="utf-8") if (project / "AGENTS.md").exists() else ""
    rules_ok = BEGIN in agents_text and END in agents_text
    claude_required = host in ("claude", "all")
    claude_text = (project / "CLAUDE.md").read_text(encoding="utf-8") if (project / "CLAUDE.md").exists() else ""
    claude_ok = not claude_required or (BEGIN in claude_text and END in claude_text)

    print(f"Project: {project}")
    print(f"Detected: {', '.join(detect_project(project)['detected_stacks'])}")
    print(f"Project core copies: {len(roots) * len(profile['core_skills']) - len(missing)}/{len(roots) * len(profile['core_skills'])}")
    print(f"Manifest: {'OK' if manifest_ok else 'MISSING'}")
    print(f"AGENTS rules: {'OK' if rules_ok else 'MISSING'}")
    if claude_required:
        print(f"CLAUDE rules: {'OK' if claude_ok else 'MISSING'}")
    if missing:
        print("Missing: " + ", ".join(missing))
    if unmanaged:
        print("Unmanaged/conflicting: " + ", ".join(unmanaged))
    return 0 if not missing and not unmanaged and manifest_ok and rules_ok and claude_ok else 1


def preflight(project: Path, roots: list[Path], profile: dict[str, Any], host: str, force: bool) -> None:
    for parent in (project / ".agents", project / ".claude"):
        if parent.is_symlink():
            raise BootstrapError(f"refusing symlink project directory: {parent}")
    for root in roots:
        if root.is_symlink():
            raise BootstrapError(f"refusing symlink skill root: {root}")
        for entry in profile["core_skills"]:
            destination = root / entry["name"]
            if destination.is_symlink():
                raise BootstrapError(f"refusing symlink skill: {destination}")
            if destination.exists() and not is_managed(destination, entry["source"]) and not force:
                raise BootstrapError(f"refusing to replace existing unmarked skill: {destination}")
    for filename in ("AGENTS.md", "CLAUDE.md") if host in ("claude", "all") else ("AGENTS.md",):
        path = project / filename
        if path.is_symlink():
            raise BootstrapError(f"refusing symlink rules: {path}")
        if path.is_file():
            content = path.read_text(encoding="utf-8")
            if (BEGIN in content) != (END in content):
                raise BootstrapError(f"incomplete managed block in {path}; refusing changes")
    manifest = project / ".agents" / "agent-init.json"
    if manifest.is_symlink():
        raise BootstrapError(f"refusing symlink manifest: {manifest}")
    if manifest.exists():
        try:
            current = json.loads(manifest.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            current = {}
        if current.get("manager") != MANAGER:
            raise BootstrapError(f"refusing to replace unowned manifest: {manifest}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Install the Project Core profile for Antigravity, Codex, Claude, or all three.")
    parser.add_argument("--project", help="Project directory; defaults to Git root or current directory.")
    parser.add_argument("--host", choices=("antigravity", "codex", "claude", "all"), default="antigravity",
                        help="Agent host to prepare; all sets up Antigravity/Codex and Claude project skill roots.")
    parser.add_argument("--source", help="Use an existing agent-skill-bundle checkout (mainly for development/tests).")
    parser.add_argument("--bundle-ref", default=os.environ.get("AGENT_BUNDLE_REF", DEFAULT_REF), help="Bundle Git ref to clone/update.")
    parser.add_argument("--no-update", action="store_true", help="Do not update an existing bundle checkout.")
    parser.add_argument("--force", action="store_true", help="Replace conflicting same-name unmarked core skills after review.")
    parser.add_argument("--status", action="store_true", help="Check the current project's Project Core profile.")
    parser.add_argument("--remove", action="store_true", help="Remove only Project Core-managed project files/skill copies.")
    args = parser.parse_args()

    project = find_project(args.project)
    source = ensure_checkout(args.source, args.no_update, args.bundle_ref)
    profile = load_profile(source)

    if args.status:
        return status(project, profile, args.host)
    if args.remove:
        remove_profile(project, profile)
        return 0

    roots = target_skill_roots(project, args.host)
    preflight(project, roots, profile, args.host, args.force)
    head = git_head(source)
    for skills_root in roots:
        skills_root.mkdir(parents=True, exist_ok=True)
        for entry in profile["core_skills"]:
            install_skill(
                source,
                skills_root / entry["name"],
                entry["source"],
                args.force,
                head,
            )

    block = managed_rules(source, profile)
    update_agents(project, block)
    if args.host in ("claude", "all"):
        update_agents(project, block.replace(".agents/skills/", ".claude/skills/"), "CLAUDE.md")
    write_manifest(project, source, profile, head, args.host, roots)

    print("Project Core project profile installed.")
    print(f"Project: {project}")
    print(f"Detected stack: {', '.join(detect_project(project)['detected_stacks'])}")
    print(f"Hosts: {args.host}")
    print(f"Core skills: {len(profile['core_skills'])} in {len(roots)} project root(s)")
    print(f"On-demand vault: {source}")
    print("Ready: the agent can inspect this project and load specialist skills only as needed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except BootstrapError as exc:
        print(f"Project Core setup failed: {exc}", file=sys.stderr)
        raise SystemExit(2)
