# ZeroCoding Claude Code Entry

When the owner gives you this repository link to configure an unrelated project, use **[AI_SETUP.md](./AI_SETUP.md)** as the entrypoint. Setup targets the owner's current workspace, not ZeroCoding.

For Claude project-local skills use `<target>/.claude/skills`; for Antigravity/Codex use `<target>/.agents/skills`. The universal initializer supports `--host all` and appends managed rules without discarding existing ones.

Once set up, on each new user request use the task-scoped `skill_router` from `.agents/agent-init.json` when an authorized terminal is available. Open only selected relevant `SKILL.md` files; reroute when the task changes even if the chat stays open. The original chat context cannot be physically unloaded.

This repository is a private setup gateway plus a reviewed skill vault. External metadata-only packs (including `emilkowalski/skills`) are not automatically installed. Verify setup, then stop; no app code changes, deployment or third-party execution without a separate request.
