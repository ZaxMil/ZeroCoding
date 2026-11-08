#!/usr/bin/env python3
"""Opt-in pinned upstream skill checkouts for ZeroCoding.

Clones read-only source text into the machine's external vault. Does not run
upstream scripts, install packages, enable hooks, alter projects, or deploy.
Python standard library + git. No executable downloads are invoked.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

BUNDLE = Path(__file__).resolve().parents[1]
MANIFEST = BUNDLE / "registry" / "optional-packs.json"
DEFAULT_CACHE = Path.home() / ".agent-tools" / "ZeroCoding" / "external-packs"
MARKER = ".zerocoding-optional-pack.json"
MANAGER = "zerocoding-optional-packs"


class PackError(RuntimeError):
    pass


def packs():
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if data.get("schema_version") != 1:
        raise PackError("unsupported optional pack manifest")
    result = {}
    for item in data["packs"]:
        ident, repo, sha = item["id"], item["repository"], item["revision"]
        if not ident.replace("-", "").isalnum() or ident in result:
            raise PackError("invalid/duplicate pack ID")
        if len(repo.split("/")) != 2 or not all(part.replace("-", "").replace("_", "").isalnum() for part in repo.split("/")):
            raise PackError("invalid source repository")
        if len(sha) != 40 or not all(ch in "0123456789abcdef" for ch in sha):
            raise PackError("invalid pinned commit")
        if item["mode"] not in ("skills", "reference", "runtime"):
            raise PackError("unsupported pack mode")
        root = item.get("skill_root")
        if item["mode"] == "skills" and (not root or root.startswith("/") or ".." in Path(root).parts):
            raise PackError("unsafe skill root")
        result[ident] = item
    return result


def call(*args, cwd=None):
    process = subprocess.run(list(args), cwd=cwd, capture_output=True, text=True,
                             env={**os.environ, "GIT_TERMINAL_PROMPT": "0", "GIT_LFS_SKIP_SMUDGE": "1"})
    if process.returncode:
        raise PackError(f"{' '.join(args[:3])}: {(process.stderr or process.stdout).strip()[:500]}")
    return process.stdout.strip()


def destination(cache, ident):
    if cache.is_symlink():
        raise PackError("cache symlink refused")
    return cache / ident


def installed(cache, pack):
    folder = destination(cache, pack["id"])
    if folder.is_symlink() or not folder.is_dir():
        return False
    marker = folder / MARKER
    if marker.is_symlink() or not marker.is_file() or not (folder / ".git").is_dir():
        return False
    try:
        record = json.loads(marker.read_text(encoding="utf-8"))
        expected = {"manager": MANAGER, "repository": pack["repository"],
                    "revision": pack["revision"]}
        if record != expected:
            return False
        if call("git", "rev-parse", "HEAD", cwd=folder) != pack["revision"]:
            return False
        if call("git", "status", "--porcelain", "--untracked-files=no", cwd=folder):
            return False
        return True
    except (OSError, ValueError, PackError):
        return False


def skills_in(folder, pack):
    root = folder / pack["skill_root"]
    if not root.is_dir() or root.is_symlink():
        raise PackError("pinned checkout has no safe skill root")
    names = []
    for candidate in sorted(root.iterdir()):
        skill = candidate / "SKILL.md"
        if candidate.is_dir() and not candidate.is_symlink() and skill.is_file() and not skill.is_symlink():
            names.append(candidate.name)
    if not names:
        raise PackError("pinned checkout contains no direct SKILL.md directories")
    return names


def install(cache, pack, dry_run=False):
    if pack["mode"] != "skills":
        print(f"REFERENCE {pack['id']}: {pack['description']} (no skill source install)")
        return
    folder = destination(cache, pack["id"])
    if installed(cache, pack):
        print(f"ALREADY {pack['id']}: {len(skills_in(folder, pack))} source skills")
        return
    if folder.exists() or folder.is_symlink():
        raise PackError(f"unmanaged/mismatched target refused: {folder}")
    if dry_run:
        print(f"DRY RUN {pack['id']}: pinned {pack['revision']} from {pack['repository']}")
        return
    if not shutil.which("git"):
        raise PackError("Git required for pinned source acquisition")
    cache.mkdir(parents=True, exist_ok=True)
    temporary = Path(tempfile.mkdtemp(prefix=f".{pack['id']}-", dir=cache))
    try:
        call("git", "init", "-q", str(temporary))
        call("git", "remote", "add", "origin", f"https://github.com/{pack['repository']}.git", cwd=temporary)
        call("git", "sparse-checkout", "init", "--cone", cwd=temporary)
        call("git", "sparse-checkout", "set", pack["skill_root"], cwd=temporary)
        call("git", "-c", "submodule.recurse=false", "fetch", "--depth=1",
             "--filter=blob:none", "origin", pack["revision"], cwd=temporary)
        call("git", "-c", "submodule.recurse=false", "checkout", "--detach", "FETCH_HEAD", cwd=temporary)
        if call("git", "rev-parse", "HEAD", cwd=temporary) != pack["revision"]:
            raise PackError("source revision did not match the pinned commit")
        names = skills_in(temporary, pack)
        (temporary / MARKER).write_text(json.dumps({
            "manager": MANAGER, "repository": pack["repository"],
            "revision": pack["revision"]
        }, indent=2) + "\n", encoding="utf-8")
        temporary.rename(folder)
        print(f"INSTALLED {pack['id']}: {len(names)} source skill directories at {folder}")
    finally:
        if temporary.exists():
            shutil.rmtree(temporary)


def status(cache, selected):
    for pack in selected:
        if pack["mode"] != "skills":
            print(f"{pack['id']}: REFERENCE ONLY ({pack['mode']})")
        elif installed(cache, pack):
            try:
                count = len(skills_in(cache / pack["id"], pack))
                print(f"{pack['id']}: PINNED OK ({count} skill folders)")
            except PackError as error:
                print(f"{pack['id']}: INCOMPLETE ({error})")
        else:
            print(f"{pack['id']}: NOT INSTALLED")


def remove(cache, pack):
    if pack["mode"] != "skills":
        print(f"{pack['id']}: reference entry; nothing to remove")
        return
    folder = destination(cache, pack["id"])
    if not folder.exists():
        print(f"{pack['id']}: not installed")
        return
    if not installed(cache, pack):
        raise PackError(f"refusing to remove unrecognized/modified checkout: {folder}")
    changes = call("git", "status", "--porcelain", "--untracked-files=all", cwd=folder).splitlines()
    if any(line[3:] != MARKER for line in changes):
        raise PackError("refusing to remove checkout containing user changes or extra files")
    shutil.rmtree(folder)
    print(f"REMOVED {pack['id']}")


def main():
    ap = argparse.ArgumentParser(description="Opt-in pinned skill pack cache; no third-party execution")
    ap.add_argument("action", choices=("list", "install", "status", "remove", "verify-manifest"))
    ap.add_argument("--pack", default=None, help="Pack ID (default: all for list/status/install)")
    ap.add_argument("--all", action="store_true", help="Select all registered packs")
    ap.add_argument("--dry-run", action="store_true", help="Show without fetching")
    ap.add_argument("--cache", type=Path, default=DEFAULT_CACHE)
    args = ap.parse_args()
    catalog = packs()
    if args.action == "verify-manifest":
        print(f"VALID {len(catalog)} canonical packs; {sum(x['mode']=='skills' for x in catalog.values())} source-only skill packs")
        return 0
    if args.pack and args.all:
        raise PackError("use either --pack or --all")
    if args.pack and args.pack not in catalog:
        raise PackError(f"unknown pack: {args.pack}")
    if args.action == "remove" and not (args.pack or args.all):
        raise PackError("removal requires explicit --pack ID or --all")
    selected = [catalog[args.pack]] if args.pack else list(catalog.values())
    cache = args.cache.expanduser()
    if cache.is_symlink():
        raise PackError("cache symlink refused")
    cache = cache.absolute()
    if args.action == "list":
        for p in selected:
            print(f"{p['id']}\t{p['mode']}\t{p['repository']}\t{p['description']}")
    elif args.action == "status":
        status(cache, selected)
    elif args.action == "install":
        failures = []
        for p in selected:
            try:
                install(cache, p, args.dry_run)
            except (OSError, PackError) as error:
                print(f"FAILED {p['id']}: {error}", file=sys.stderr)
                failures.append(p["id"])
        if failures:
            print("Failed packs: " + ", ".join(failures), file=sys.stderr)
            return 2
    else:
        for p in selected:
            remove(cache, p)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, PackError, ValueError) as error:
        print(f"Optional packs: {error}", file=sys.stderr)
        raise SystemExit(2)
