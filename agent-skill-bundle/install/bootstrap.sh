#!/usr/bin/env bash
set -euo pipefail
REPO="ZAX-MILLION/Coding"
ROOT="${AGENT_BUNDLE_REPO_ROOT:-$HOME/.agent-tools/Coding}"
BUNDLE="$ROOT/agent-skill-bundle"
BIN="${AGENT_BUNDLE_BIN_DIR:-$HOME/.local/bin}"

need(){ command -v "$1" >/dev/null 2>&1 || { echo "Missing required command: $1" >&2; exit 2; }; }
need git; need gh; need python3
gh auth status >/dev/null 2>&1 || { echo "Run: gh auth login" >&2; exit 2; }

if [ -d "$ROOT/.git" ]; then
  if [ -n "$(git -C "$ROOT" status --porcelain)" ]; then
    echo "Existing checkout has local changes; preserving it without update: $ROOT" >&2
  else
    git -C "$ROOT" sparse-checkout init --cone >/dev/null 2>&1 || true
    git -C "$ROOT" sparse-checkout set agent-skill-bundle
    git -C "$ROOT" checkout main
    git -C "$ROOT" pull --ff-only origin main
  fi
elif [ -e "$ROOT" ]; then
  echo "Refusing to replace non-Git path: $ROOT" >&2; exit 2
else
  mkdir -p "$(dirname "$ROOT")"
  gh repo clone "$REPO" "$ROOT" -- --filter=blob:none --no-checkout
  git -C "$ROOT" sparse-checkout init --cone
  git -C "$ROOT" sparse-checkout set agent-skill-bundle
  git -C "$ROOT" checkout main
fi

[ -f "$BUNDLE/scripts/bundle_manager.py" ] || { echo "Bundle manager missing: $BUNDLE" >&2; exit 2; }
mkdir -p "$BIN"
wrap(){
  local name="$1" command="$2" script="$3"
  cat > "$BIN/$name" <<EOF
#!/usr/bin/env bash
exec python3 "$BUNDLE/scripts/$script" $command "\$@"
EOF
  chmod +x "$BIN/$name"
}
wrap bundle-install install bundle_manager.py
wrap bundle-update update bundle_manager.py
wrap bundle-status status bundle_manager.py
wrap bundle-remove remove bundle_manager.py
wrap agent-init "" agent_init.py
python3 "$BUNDLE/scripts/bundle_manager.py" install --repo-root "$ROOT"
echo "Commands installed in: $BIN"
case ":$PATH:" in *":$BIN:"*) ;; *) echo "Add $BIN to PATH if needed.";; esac
echo "Ready: run agent-init inside any project."
