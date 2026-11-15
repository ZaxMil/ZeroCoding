#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf -- "$tmp"' EXIT

project="$tmp/project"
mkdir -p "$project/.agents/skills/personal"
printf '%s\n' '# Existing Project Rule' > "$project/AGENTS.md"
printf '%s\n' '---' 'name: personal' 'description: personal' '---' > "$project/.agents/skills/personal/SKILL.md"

python3 "$root/scripts/agent_init.py" --source "$root" --project "$project" --no-update >/dev/null

managed="$(find "$project/.agents/skills" -mindepth 2 -maxdepth 2 -name .agent-init-managed.json | wc -l | tr -d ' ')"
[ "$managed" -eq 1 ] || { echo "FAIL: expected 1 managed core skill, got $managed" >&2; exit 1; }
[ -f "$project/.agents/agent-init.json" ]
[ -f "$project/.agents/skills/personal/SKILL.md" ]
grep -q '# Existing Project Rule' "$project/AGENTS.md"
[ "$(grep -c '<!-- AGENT_INIT:BEGIN -->' "$project/AGENTS.md")" -eq 1 ]
[ "$(grep -c '<!-- AGENT_INIT:END -->' "$project/AGENTS.md")" -eq 1 ]

for skill in zerocoding; do
  [ -f "$project/.agents/skills/$skill/SKILL.md" ] || { echo "FAIL: missing $skill" >&2; exit 1; }
done

# Re-running is idempotent for Project Core-owned files.
python3 "$root/scripts/agent_init.py" --source "$root" --project "$project" --no-update >/dev/null
[ "$(grep -c '<!-- AGENT_INIT:BEGIN -->' "$project/AGENTS.md")" -eq 1 ]
[ -f "$project/.agents/skills/personal/SKILL.md" ]

# Refuse to overwrite an unmarked same-name project skill.
conflict="$tmp/conflict"
mkdir -p "$conflict/.agents/skills/zerocoding"
printf '%s\n' 'personal zerocoding skill' > "$conflict/.agents/skills/zerocoding/SKILL.md"
if python3 "$root/scripts/agent_init.py" --source "$root" --project "$conflict" --no-update >/dev/null 2>"$tmp/conflict.err"; then
  echo "FAIL: bootstrap replaced an unmarked same-name skill" >&2
  exit 1
fi
grep -q 'refusing to replace existing unmarked skill' "$tmp/conflict.err"
grep -q 'personal zerocoding skill' "$conflict/.agents/skills/zerocoding/SKILL.md"

# Removal only removes managed content.
python3 "$root/scripts/agent_init.py" --source "$root" --project "$project" --no-update --remove >/dev/null
[ -f "$project/.agents/skills/personal/SKILL.md" ]
[ ! -e "$project/.agents/agent-init.json" ]
grep -q '# Existing Project Rule' "$project/AGENTS.md"
! grep -q '<!-- AGENT_INIT:BEGIN -->' "$project/AGENTS.md"
remaining_managed="$(find "$project/.agents/skills" -name .agent-init-managed.json | wc -l | tr -d ' ')"
[ "$remaining_managed" -eq 0 ]

# Universal host setup: write skill metadata for Antigravity/Codex + Claude
# without touching the application itself.
universal="$tmp/universal"
mkdir -p "$universal"
printf '%s\n' '{"dependencies":{"react":"18.3.1"},"devDependencies":{"typescript":"5.5.3"}}' > "$universal/package.json"
printf '%s\n' '# Existing Claude rule' > "$universal/CLAUDE.md"
python3 "$root/scripts/agent_init.py" --source "$root" --project "$universal" --host all --no-update >/dev/null
python3 "$root/scripts/agent_init.py" --source "$root" --project "$universal" --host all --no-update --status >/dev/null
for skills_root in ".agents/skills" ".claude/skills"; do
  [ "$(find "$universal/$skills_root" -mindepth 2 -maxdepth 2 -name SKILL.md | wc -l | tr -d ' ')" -eq 1 ]
  [ -f "$universal/$skills_root/zerocoding/SKILL.md" ]
  [ ! -e "$universal/$skills_root/graft" ]
done
grep -q '# Existing Claude rule' "$universal/CLAUDE.md"
[ "$(grep -c '<!-- AGENT_INIT:BEGIN -->' "$universal/CLAUDE.md")" -eq 1 ]
grep -q '"react"' "$universal/.agents/agent-init.json"
grep -q '"typescript"' "$universal/.agents/agent-init.json"
grep -q '".claude/skills"' "$universal/.agents/agent-init.json"
python3 "$root/scripts/agent_init.py" --source "$root" --project "$universal" --host all --no-update >/dev/null
[ "$(grep -c '<!-- AGENT_INIT:BEGIN -->' "$universal/CLAUDE.md")" -eq 1 ]
python3 "$root/scripts/agent_init.py" --source "$root" --project "$universal" --no-update --remove >/dev/null
[ ! -e "$universal/.agents/agent-init.json" ]
grep -q '# Existing Claude rule' "$universal/CLAUDE.md"
! grep -q '<!-- AGENT_INIT:BEGIN -->' "$universal/CLAUDE.md"
[ -f "$universal/package.json" ]

# No partial setup on skill-name conflict.
conflict_all="$tmp/conflict-all"
mkdir -p "$conflict_all/.claude/skills/zerocoding"
printf '%s\n' 'personal Claude test' > "$conflict_all/.claude/skills/zerocoding/SKILL.md"
if python3 "$root/scripts/agent_init.py" --source "$root" --project "$conflict_all" --host all --no-update >"$tmp/all.err" 2>&1; then
  echo "FAIL: universal bootstrap accepted an unmarked Claude skill" >&2; exit 1
fi
[ ! -e "$conflict_all/.agents/skills/zerocoding" ]
grep -q 'personal Claude test' "$conflict_all/.claude/skills/zerocoding/SKILL.md"

# Old Project Core is not silently destroyed during upgrade.
legacy="$tmp/legacy-core"
mkdir -p "$legacy/.agents/skills/ponytail"
printf '%s\n' '---' 'name: ponytail' '---' > "$legacy/.agents/skills/ponytail/SKILL.md"
printf '%s\n' '{"manager":"agent-project-bootstrap","source":"coding/ponytail"}' > "$legacy/.agents/skills/ponytail/.agent-init-managed.json"
if python3 "$root/scripts/agent_init.py" --source "$root" --project "$legacy" --no-update >"$tmp/legacy-warning.log" 2>&1; then
  echo "FAIL: old 10-skill profile was silently retained" >&2; exit 1
fi
[ -f "$legacy/.agents/skills/ponytail/SKILL.md" ]
python3 "$root/scripts/agent_init.py" --source "$root" --project "$legacy" --no-update --prune-managed >/dev/null
[ -f "$legacy/.agents/skills/zerocoding/SKILL.md" ]
[ ! -e "$legacy/.agents/skills/ponytail" ]

# Godot detection is read-only.
godot="$tmp/godot-project"
mkdir -p "$godot"
: > "$godot/project.godot"
python3 "$root/scripts/agent_init.py" --source "$root" --project "$godot" --host all --no-update >/dev/null
grep -q '"godot"' "$godot/.agents/agent-init.json"

echo "PASS: Project Core default + universal host bootstrap; stack detection, preflight, preservation, reruns and safe removal."
