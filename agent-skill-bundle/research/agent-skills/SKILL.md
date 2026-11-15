---
name: agent-skills
description: Discover, review and distribute portable Agent Skills across Antigravity, Codex, Claude Code and other compatible coding agents without bloating startup context.
---
# Agent Skills discovery and portability

Open format: https://agentskills.io/ ; canonical installer/discovery tool: https://github.com/vercel-labs/skills (MIT, reviewed at `7407f3893ad4dceab546ac002c3ef806e4000c73`). This is a bundle-authored workflow, not a clone of the package manager or the `find-skills` skill.

1. Search the **existing bundle and local retrieval index first** for the task. Prefer the reviewed local copy over an unknown skill or accidental second copy.
2. For the new one-gateway layout, first consult [the pinned 106-skill ind4x metadata catalog](../../registry/ind4x-catalog.json) **only when local search has no adequate match**; 95 of those skill names are absent locally. This catalog contains no third-party skill bodies or permission to install them. Consult the appropriate original author and runtime requirements before any use.
3. If absent, inspect the reviewed [VoltAgent Awesome Agent Skills source index](references/voltagent-catalog.md) and the [ECC canonical skill-name index](references/ecc-catalog.md), then inspect pinned upstream paths for task-relevant entries. This is **a directory of links**, not installed or reviewed skill packages. Alternatively search `https://skills.sh`; run `npx skills find <topic>` only after confirming Node/npm is available and the user approves a third-party CLI.
3. Resolve any catalog listing to the canonical author's actual repository and specific file path, then inspect its current commit, `SKILL.md`, scripts, references, license, external requests, prompts and credentials before installation. Do not treat the directory's MIT license as a license for listed third-party skills. Catalog inclusion and popularity are not security audits.
4. For approved additions, preserve a full skill directory and license. Record source revision and SHA; avoid an upstream skill whose instructions fetch mutable code or instructions unless reviewed/pinned.
5. Install only the chosen native skill or leave it searchable through the local Skill Retrieval MCP; never bulk-install a discovered repository by default. Use `adapters/multi-host/README.md` for Antigravity, Codex, Claude Code and generic paths.
6. Skills are instructions, not automatically installed executables, authenticated tools, MCP connections, model upgrades or production permissions. Test host discovery and the required runtime separately.
