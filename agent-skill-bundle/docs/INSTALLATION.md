# Bundle installation

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
- `agent-init` initializes the current project.

## Every new project

Run:

```text
agent-init
```

This installs the 10 project-local core skills under `.agents/skills/`, preserves existing project rules, updates the managed `AGENTS.md` block, and points specialist search at the local on-demand vault.

Useful project commands:

```text
agent-init --status
agent-init --remove
```

## Antigravity scope

The machine installer copies only `i-have-adhd` and `skill-retrieval-routing` into `~/.gemini/config/skills/`. Project-specific core skills live in `<project>/.agents/skills/`. The complete vault is not copied into native startup discovery.
