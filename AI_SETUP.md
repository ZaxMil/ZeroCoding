# ZeroCoding — AI Agent Setup Gateway

**If someone shares `https://github.com/ZaxMil/ZeroCoding` while you are working in a different project, use this document to prepare THAT project, not the ZeroCoding repository.** Start the setup in the current project; do not assume its programming language.

## Agent execution contract

1. Identify the **target project root** from the current workspace (Git root when appropriate). Do not change its product code or dependencies to set up skills.
2. Check OS, whether a terminal/filesystem is available, and whether GitHub CLI (`gh`), Git and Python 3 are present. This is a **public GitHub repository**; use an existing authorized GitHub CLI session when the documented bootstrap requires it. If authentication or shell capability is unavailable, report the blocker instead of claiming installation.
3. Read and review the bootstrap script in `agent-skill-bundle/install/` and its referenced local manager/initializer before executing. Never use untrusted web search results or a similarly named repository as a substitute.
4. Install the **machine bootstrap** if missing, and pass the target project as `AGENT_BUNDLE_PROJECT_ROOT` to initialize it in the same run. Reuse an existing checkout without force or replacing unmanaged files.
5. For project setup, use `--host all`: Antigravity and Codex use `.agents/skills/`; Claude Code uses `.claude/skills/`. Add only the 10 project core skills and managed `AGENTS.md` / `CLAUDE.md` blocks. Existing rules and personal skills must survive.
6. Verify with `agent-init --host all --status` (or the full Python command below). Inspect `.agents/agent-init.json` for the detected stack and its specialist search queries. Run `skill_doctor.py search "<query>"` only when a task needs a specialist; read the matching canonical skill. The complete vault remains outside the project.
7. Record what was installed and what was only registered as an external gateway. For Emil Kowalski, actual skills remain at `https://github.com/emilkowalski/skills` and are **not installed by this setup**. Do not install third-party executables, MCP servers, optional external skill packs, hooks, paid services, or provider credentials automatically.
8. Stop after a successful verification. Do not modify the app, install project dependencies, run migrations, deploy, push code, overwrite secrets, or publish anything merely because this setup completed.

## First-time setup — current project's terminal

**Windows PowerShell** (already signed into GitHub CLI with access):

```powershell
$env:AGENT_BUNDLE_PROJECT_ROOT = (Get-Location).Path
$script = gh api repos/ZaxMil/ZeroCoding/contents/agent-skill-bundle/install/bootstrap.ps1 -H "Accept: application/vnd.github.raw+json"
if ($LASTEXITCODE -ne 0) { throw "Unable to fetch authorized ZeroCoding bootstrap." }
Invoke-Expression ($script -join "`n")
```

**macOS / Linux / Git Bash** (already signed into GitHub CLI with access):

```bash
export AGENT_BUNDLE_PROJECT_ROOT="$PWD"
bootstrap_file="$(mktemp)"
if gh api repos/ZaxMil/ZeroCoding/contents/agent-skill-bundle/install/bootstrap.sh -H "Accept: application/vnd.github.raw+json" > "$bootstrap_file"; then
  bash "$bootstrap_file"
  result=$?
else
  result=$?
fi
rm -f "$bootstrap_file"
test "$result" -eq 0
```

The machine bootstrap authenticates through your existing `gh` session, sparse-checks out **only** `agent-skill-bundle/` into `~/.agent-tools/ZeroCoding`, installs two Antigravity global bootstrap skills, and initializes the explicit target workspace with the 10 project core skills in both project skill roots.

## Already installed — every new project

Run from the new project's directory:

```text
agent-setup
agent-init --host all --status
```

On systems where the helper command is not on `PATH`, use the local initializer directly:

```bash
python3 "$HOME/.agent-tools/ZeroCoding/agent-skill-bundle/scripts/agent_init.py" --host all --project "$PWD"
```

On Windows:

```powershell
py -3 "$HOME/.agent-tools/ZeroCoding/agent-skill-bundle/scripts/agent_init.py" --host all --project (Get-Location).Path
```

**Verify:** each relevant project skill root has 10 core skills, `.agents/agent-init.json` records the stack/vault path, and `AGENTS.md`/`CLAUDE.md` retain the owner's original content plus one managed section. Use `agent-init --host all --status`.

To safely remove only files managed by Project Core: `agent-init --remove`. This leaves unmarked project skills, existing rules, and application files intact.

## What is and is not automatic

- **Automatic once explicitly launched:** project stack detection (markers only), installation of the 10 reviewed project core skill directories, rules and routing configuration, status checks.
- **On-demand:** searching the 188 local source-vault skills and 14 Emil external gateway names; load the relevant instructions when a task requires them.
- **Not automatically installed:** the separate Skill Retrieval MCP runtime, external skills such as Emil's, external CLIs, dependencies, cloud accounts, keys, deployment or database updates. The local `skill_doctor.py` provides a read-only fallback even without MCP.
- **Other AI products:** host-native skill discovery is not guaranteed outside Antigravity, Codex and Claude Code. Any AI with authenticated repository access and an authorized terminal can follow the documented steps; chat-only AIs can read the instructions but cannot modify your local machine.

This is a **gateway and setup controller**, not the canonical home of third-party skills and not a general-purpose application installer.
