# Bundle installation

For a reusable agent instruction that can prepare *any existing workspace*, start with [AI_SETUP.md](../../../AI_SETUP.md). It includes host-aware machine/project setup for Windows, macOS and Linux.

The Bundle lives inside the private `ZaxMil/ZeroCoding` repository under `agent-skill-bundle/`.

## One-time machine setup

Authenticate GitHub CLI once with `gh auth login`. The bootstrap uses a **sparse checkout**, so it checks out only the Bundle and not unrelated ZeroCoding project files.

Windows PowerShell:

```powershell
gh api repos/ZaxMil/ZeroCoding/contents/agent-skill-bundle/install/bootstrap.ps1 -H "Accept: application/vnd.github.raw+json" | iex
```

macOS / Linux / Git Bash:

```bash
gh api repos/ZaxMil/ZeroCoding/contents/agent-skill-bundle/install/bootstrap.sh -H "Accept: application/vnd.github.raw+json" | bash
```

After bootstrap:

- `bundle-status` verifies the checkout, managed config, and two Antigravity global bootstrap skills.
- `bundle-update` fast-forwards the sparse checkout and refreshes managed bootstraps.
- `bundle-install` reapplies the managed machine profile.
- `bundle-remove` removes only Bundle-managed global skills/config and preserves the source checkout.
- `agent-init` initializes a single host's project skills (Antigravity by default).
- `agent-setup` initializes the current project for Antigravity, Codex and Claude Code together.

## Every new project

Run:

```text
agent-setup
agent-init --host all --status
```

This installs 10 project-local core skills in `.agents/skills/` for Antigravity/Codex and `.claude/skills/` for Claude Code, preserves existing rules, appends managed `AGENTS.md` / `CLAUDE.md` blocks, detects the project's stack from existing files, and points specialist search at the local on-demand vault. No project dependencies, cloud accounts, paid integrations, or external gateway skill bodies are installed.

Useful project commands:

```text
agent-init --host all --status
agent-init --remove
```

## Antigravity scope

The machine installer copies only `i-have-adhd` and `skill-retrieval-routing` into `~/.gemini/config/skills/`. Project-specific core skills live in `<project>/.agents/skills/`. The complete vault is not copied into native startup discovery.
