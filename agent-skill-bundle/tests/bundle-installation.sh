#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
HOME="$TMP/home"
mkdir -p "$HOME" "$TMP/project" "$TMP/repo/agent-skill-bundle"
cp -a "$ROOT/." "$TMP/repo/agent-skill-bundle/"

env HOME="$HOME" python3 "$TMP/repo/agent-skill-bundle/scripts/bundle_manager.py" install --repo-root "$TMP/repo"
env HOME="$HOME" python3 "$TMP/repo/agent-skill-bundle/scripts/bundle_manager.py" status --repo-root "$TMP/repo"
env HOME="$HOME" python3 "$TMP/repo/agent-skill-bundle/scripts/agent_init.py" --source "$TMP/repo/agent-skill-bundle" --project "$TMP/project"
env HOME="$HOME" python3 "$TMP/repo/agent-skill-bundle/scripts/agent_init.py" --source "$TMP/repo/agent-skill-bundle" --project "$TMP/project" --status
[ -f "$HOME/.gemini/config/skills/zerocoding/SKILL.md" ]
[ "$(find "$TMP/project/.agents/skills" -mindepth 1 -maxdepth 1 -type d | wc -l)" -eq 1 ]
# Migrating an older machine-owned two-skill bootstrap is explicit.
old="$HOME/.gemini/config/skills/i-have-adhd"
mkdir -p "$old"
printf '%s\n' '---' 'name: i-have-adhd' '---' > "$old/SKILL.md"
printf '%s\n' '{"manager":"coding-agent-bundle","source":"productivity/i-have-adhd"}' > "$old/.bundle-managed.json"
if env HOME="$HOME" python3 "$TMP/repo/agent-skill-bundle/scripts/bundle_manager.py" install --repo-root "$TMP/repo" > "$TMP/global-refusal.log" 2>&1; then
  echo "FAIL: old managed native skills were silently retained" >&2; exit 1
fi
[ -f "$old/SKILL.md" ]
env HOME="$HOME" python3 "$TMP/repo/agent-skill-bundle/scripts/bundle_manager.py" install --repo-root "$TMP/repo" --prune-managed >/dev/null
[ ! -e "$old" ]
[ -f "$HOME/.gemini/config/skills/zerocoding/SKILL.md" ]
env HOME="$HOME" python3 "$TMP/repo/agent-skill-bundle/scripts/agent_init.py" --source "$TMP/repo/agent-skill-bundle" --project "$TMP/project" --remove
env HOME="$HOME" python3 "$TMP/repo/agent-skill-bundle/scripts/bundle_manager.py" remove --repo-root "$TMP/repo"
echo "PASS: machine bundle install + project agent-init are isolated, reversible, and on-demand."
