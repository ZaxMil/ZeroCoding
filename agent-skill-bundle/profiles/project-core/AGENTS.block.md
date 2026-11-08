## Project Core Project Profile

- Address the project owner as **ADMIN**.
- ADMIN is the project owner, not the programmer. Explain technical decisions in plain language and keep routine answers concise.
- Start with the result or exact action. For complex work, keep visible steps small and practical.
- Treat the current project code/configuration as the source of truth. Inspect before editing and preserve working configuration.
- **On every new user message**, start a fresh per-request skill selection. Invoke the local read-only `skill_router` from `.agents/agent-init.json` with **only the current task** and `--max-skills 4 --json` when an authorized terminal is available. Open only the returned relevant `SKILL.md` files; fewer than four (including zero) is correct.
- **Same chat, new task:** rerank from scratch. Do not reuse or re-read the previous task's skills unless they match the new request. A follow-up that continues the same task may reselect them based on that task; keep task facts but not irrelevant skill scope.
- Keep Project Core skills available from `.agents/skills/` (or Claude project's `.claude/skills/`) without preloading all of their bodies. The reviewed vault and opt-in staged upstreams stay outside the project.
- Use `skill-retrieval-routing` only for discovery and path verification, with optional retrieval MCP when connected. The router is advisory; reject low-quality matches and never auto-install external tools.
- Host chat history may already contain older instructions; this rule controls new skill reads, not the model's existing history. Never claim that earlier loaded context was physically erased.
- For application/API/auth/database/infrastructure/deploy/config/dependency work, apply `secure-by-default-development`.
- Before claiming work is complete, apply `verification-before-completion` and report observed evidence.
- Use `credit-usage-helper` to avoid broad scans, repeated reads, speculative refactors, or loading skills "just in case".
- Do not silently switch branches, merge, publish, deploy, delete data, rotate credentials, or make other destructive/public changes that require ADMIN approval.
- Existing project-specific rules and safety constraints remain in force. This generic profile must not erase or weaken them.
