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
[ -f "$HOME/.gemini/config/skills/i-have-adhd/SKILL.md" ]
[ -f "$HOME/.gemini/config/skills/skill-retrieval-routing/SKILL.md" ]
[ "$(find "$TMP/project/.agents/skills" -mindepth 1 -maxdepth 1 -type d | wc -l)" -eq 10 ]
env HOME="$HOME" python3 "$TMP/repo/agent-skill-bundle/scripts/agent_init.py" --source "$TMP/repo/agent-skill-bundle" --project "$TMP/project" --remove
env HOME="$HOME" python3 "$TMP/repo/agent-skill-bundle/scripts/bundle_manager.py" remove --repo-root "$TMP/repo"
echo "PASS: machine bundle install + project agent-init are isolated, reversible, and on-demand."
