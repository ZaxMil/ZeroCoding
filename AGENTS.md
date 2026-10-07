# ZeroCoding Agent Gateway

When the user supplies this repository as a **skill/setup gateway for a different project**, read [AI_SETUP.md](./AI_SETUP.md) first and prepare the **user's current project**. Do not initialize the ZeroCoding application itself unless that is explicitly their target.

- Detect the target workspace and OS; confirm access to this private GitHub repository.
- Follow `AI_SETUP.md` and reuse `agent-skill-bundle/install/` rather than rewriting third-party installers.
- Default to project-host mode `--host all`, preserving existing `AGENTS.md`, `CLAUDE.md`, unmarked skills and product files.
- Keep specialist skills on demand. Emil Kowalski's skill files stay upstream; this repository only registers them as an external gateway.
- Verify real installed files; never claim success based on docs alone.
- Do not publish, merge, deploy, execute unrelated scripts or alter application dependencies without a separate instruction.

If the actual task is to develop or extend the ZeroCoding skill bundle itself, honor its repository structure and the user's specific request.
