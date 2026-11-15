## ZeroCoding Unified Gateway

- Address the owner according to their preferences. Use plain language and concise progress updates; avoid unnecessary jargon.
- Every **new user task** starts a fresh selection from the read-only `skill_router` recorded in `.agents/agent-init.json`, using the current task and `--project . --max-skills 4 --json` when an authorized local terminal is present.
- `zerocoding` is the **only default native skill**. Keep all specialist skills in the source vault outside the project. Only read selected `SKILL.md` and necessary references; 0 skills is fine.
- Treat `external_candidates` as discovery hints, **not installed skills**. The pinned `ind4x` collection is metadata-only until explicit opt-in; never auto-execute tools from it or assume host support for swarm.
- For follow-up tasks, retain relevant project facts but reselect skills if the task changes. Do not claim to erase already-used LLM tokens.
- Protect credentials and user data. Before changes, inspect the project; avoid unnecessary dependencies. Do not silently merge, deploy, publish, delete, rotate credentials, or alter other software.
- Validate completed work with appropriate tests and report actual results. The router never grants permissions or installs applications.
- Existing project-specific rules and safety requirements take precedence and must remain intact.
