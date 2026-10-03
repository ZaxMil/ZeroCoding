#!/usr/bin/env python3
"""Machine-level manager for the Coding-hosted Agent Skill Bundle."""
from __future__ import annotations
import argparse, json, shutil, subprocess
from pathlib import Path

MANAGER = "coding-agent-bundle"
REPO_ROOT = Path.home() / ".agent-tools" / "Coding"
BUNDLE_SUBDIR = Path("agent-skill-bundle")
CONFIG = Path.home() / ".agent-tools" / "bundle.json"
GLOBAL_ROOT = Path.home() / ".gemini" / "config" / "skills"
GLOBAL_SKILLS = (
    ("i-have-adhd", "productivity/i-have-adhd"),
    ("skill-retrieval-routing", "research/skill-retrieval-routing"),
)
MARKER = ".bundle-managed.json"

class BundleError(RuntimeError):
    pass

def run(cmd, check=True):
    p=subprocess.run(cmd,text=True,capture_output=True)
    if check and p.returncode:
        raise BundleError((p.stderr or p.stdout).strip() or "command failed")
    return p

def repo_root(value=None):
    return Path(value).expanduser().resolve() if value else REPO_ROOT.resolve()

def bundle_root(repo):
    return repo / BUNDLE_SUBDIR

def validate(bundle):
    req=[
        bundle/"profiles"/"project-core"/"profile.json",
        bundle/"scripts"/"agent_init.py",
        bundle/"scripts"/"skill_doctor.py",
    ]
    missing=[str(x) for x in req if not x.is_file()]
    if missing:
        raise BundleError("incomplete bundle: "+", ".join(missing))

def head(repo):
    p=run(["git","-C",str(repo),"rev-parse","HEAD"],check=False)
    return p.stdout.strip() if p.returncode==0 else None

def marker(dst):
    return dst / MARKER

def managed(dst, source):
    try:
        data=json.loads(marker(dst).read_text(encoding="utf-8"))
        return data.get("manager")==MANAGER and data.get("source")==source
    except (OSError,ValueError):
        return False

def copy_skill(bundle,name,source,commit,force=False):
    src=bundle/source
    dst=GLOBAL_ROOT/name
    if not (src/"SKILL.md").is_file():
        raise BundleError(f"missing skill source: {source}")
    if dst.exists():
        if dst.is_symlink():
            raise BundleError(f"refusing symlink replacement: {dst}")
        if not managed(dst,source) and not force:
            raise BundleError(f"refusing existing unmarked skill: {dst}")
        if dst.is_dir(): shutil.rmtree(dst)
        else: dst.unlink()
    shutil.copytree(src,dst,symlinks=False)
    marker(dst).write_text(json.dumps({
        "manager":MANAGER,"source":source,"bundle_commit":commit
    },indent=2,sort_keys=True)+"\n",encoding="utf-8")

def write_config(repo,bundle,commit):
    CONFIG.parent.mkdir(parents=True,exist_ok=True)
    CONFIG.write_text(json.dumps({
        "manager":MANAGER,
        "repository":"ZAX-MILLION/Coding",
        "repository_root":str(repo),
        "bundle_root":str(bundle),
        "bundle_commit":commit,
        "vault_mode":"on-demand",
        "global_skills":[x[0] for x in GLOBAL_SKILLS],
        "project_command":"agent-init",
        "specialist_search":f'python "{bundle/"scripts"/"skill_doctor.py"}" search "<keywords>"'
    },indent=2)+"\n",encoding="utf-8")

def install(repo,force=False):
    bundle=bundle_root(repo); validate(bundle)
    GLOBAL_ROOT.mkdir(parents=True,exist_ok=True)
    commit=head(repo)
    for name,source in GLOBAL_SKILLS:
        copy_skill(bundle,name,source,commit,force)
    write_config(repo,bundle,commit)
    print("Bundle machine profile installed.")
    print(f"Bundle: {bundle}")
    print("Antigravity global bootstrap skills: 2")
    print("Vault mode: on-demand")
    print("New project command: agent-init")

def update(repo,force=False):
    if not (repo/".git").is_dir():
        raise BundleError(f"managed Coding checkout not found: {repo}")
    dirty=run(["git","-C",str(repo),"status","--porcelain"],check=False)
    if dirty.returncode or dirty.stdout.strip():
        raise BundleError("checkout has local changes; refusing automatic update")
    run(["git","-C",str(repo),"pull","--ff-only","origin","main"])
    install(repo,force)
    print("Bundle update complete.")

def status(repo):
    bundle=bundle_root(repo)
    ok=True
    try: validate(bundle)
    except BundleError: ok=False
    config_ok=False
    try:
        data=json.loads(CONFIG.read_text(encoding="utf-8"))
        config_ok=data.get("manager")==MANAGER and Path(data.get("bundle_root",""))==bundle
    except (OSError,ValueError,TypeError): pass
    installed=0; conflicts=[]
    for name,source in GLOBAL_SKILLS:
        dst=GLOBAL_ROOT/name
        if (dst/"SKILL.md").is_file() and managed(dst,source): installed+=1
        elif dst.exists(): conflicts.append(name)
    print(f"Bundle checkout: {'OK' if ok else 'MISSING'}")
    print(f"Machine config: {'OK' if config_ok else 'MISSING'}")
    print(f"Antigravity bootstrap skills: {installed}/2")
    print(f"Project core available: {'YES' if (bundle/'profiles'/'project-core'/'profile.json').is_file() else 'NO'}")
    print("Vault mode: on-demand")
    if conflicts: print("Conflicting/unmanaged: "+", ".join(conflicts))
    return 0 if ok and config_ok and installed==2 and not conflicts else 1

def remove(repo):
    removed=0
    for name,source in GLOBAL_SKILLS:
        dst=GLOBAL_ROOT/name
        if dst.exists() and managed(dst,source):
            shutil.rmtree(dst); removed+=1
    try:
        data=json.loads(CONFIG.read_text(encoding="utf-8"))
        if data.get("manager")==MANAGER: CONFIG.unlink()
    except (OSError,ValueError): pass
    print(f"Removed {removed} managed Antigravity bootstrap skills and managed config.")
    print(f"Source checkout preserved: {repo}")

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("command",choices=("install","update","status","remove"))
    ap.add_argument("--repo-root")
    ap.add_argument("--force",action="store_true")
    a=ap.parse_args(); repo=repo_root(a.repo_root)
    if a.command=="install": install(repo,a.force); return 0
    if a.command=="update": update(repo,a.force); return 0
    if a.command=="status": return status(repo)
    remove(repo); return 0

if __name__=="__main__":
    try: raise SystemExit(main())
    except BundleError as e:
        print(f"Bundle setup failed: {e}",file=__import__("sys").stderr)
        raise SystemExit(2)
