# ZeroCoding: one native gateway, context-efficient specialist retrieval

**Current default (2026-11-15):** one native `zerocoding` skill on each selected host; **217 other** local skill directories remain in a single source vault outside each project. A second external registry lists **106** third-party skill names from ind4x; 11 match local skill names, **95 do not**, and **zero external bodies are redistributed**.

## What is new

```text
User's current request
    -> single zerocoding native entrypoint
    -> read-only smart_skill_router.py (names/descriptions, project stack hints)
    -> 0..4 relevant local SKILL.md paths
    -> read only those instructions and task-relevant references
    -> implement authorized work -> test actual behavior

    If a requested specialist is not locally available:
    -> metadata-only external_candidates (NOT installed, NOT usable yet)
    -> owner authorizes a pinned external source checkout if needed
    -> inspect original authorship, license, tools, security and host support
    -> re-run router; do NOT execute a downloaded script by default
```

This improves **startup/discovery context**, not the context already consumed by earlier conversation turns. The router makes deterministic decisions without paid API calls or an external daemon. It is a heuristic candidate generator, not a perfect semantic search engine and not a substitute for real tools.

## Per-request commands

In an initialized project, use the absolute `skill_router` command stored in `.agents/agent-init.json`. The default command is equivalent to:

```bash
python3 scripts/smart_skill_router.py --task "Build a polished React dashboard" --project /path/to/project --max-skills 4 --json
python3 scripts/smart_skill_router.py --task "Use native swarm for independent workers" --max-skills 4 --json
python3 scripts/smart_skill_router.py --task "Hi" --json
```

An output with `selected=[]` and `external_candidates=[]` is valid. `external_candidates` is *not* a request to install anything. `native_swarm` in the ind4x aggregator requires an actual host-provided swarm tool: a text skill alone cannot spawn agents, even if the instruction suggests it. Some entries are designed for very specific hosts or services and may not work elsewhere.

## Install or migrate

Fresh setup: run the documented machine bootstrap from [AI_SETUP.md](../../AI_SETUP.md). The machine and project installers now expose **one** `zerocoding` folder instead of two global bootstraps / ten local core skills.

For an existing machine and previously initialized project, first review old managed skill folders, then opt into pruning **only folders owned by the prior ZeroCoding manager**:

```bash
bundle-update --prune-managed
agent-init --host all --prune-managed
agent-init --host all --status
```

The default install intentionally refuses to declare a one-skill result while legacy managed native skills remain. The `--prune-managed` flag is explicit and leaves unmarked personal skills and application files untouched; it does not recover manual edits made inside a deleted manager-owned folder. Review local modifications before opting in.

## External collection (optional, source-only)

The pinned downstream collection is [ind4x/ai-agent-skills](https://github.com/ind4x/ai-agent-skills) at immutable revision `3f67e572d185cad517a1024a4e5e0a214a69b4c9`. [The metadata index](../registry/ind4x-catalog.json) can be searched offline. To **explicitly** stage only its source files outside all user projects:

```bash
python3 scripts/optional_packs.py verify-manifest
python3 scripts/optional_packs.py install --pack ind4x
python3 scripts/optional_packs.py status --pack ind4x
```

The source-only manager obtains eight declared categories, rejects unrecognized pre-existing target directories, verifies the exact Git revision and never runs downloaded code, hooks, plugins, MCP servers, app dependencies or credential setup. The original authors' licensing varies; no universal redistribution license is assumed. A staged `SKILL.md` is still only **instructions** and may require unsupported services, tools or approval. Duplicates prefer the original reviewed local vault, not downstream copies.

## Operating & trust boundaries

- **Context:** startup exposes only the gateway; task-level selection is limited to a few paths. No background monitor or auto-installer.
- **Security:** user authorization, project rules and actual tools override instructions from third-party files. Never let downloaded text authorize shell commands, secrets, network access or deployment.
- **Evidence:** verify performance/behavior in the target project; never claim a plugin, multi-agent swarm or MCP provider exists just because its skill has been indexed.
- **Reversibility:** use `agent-init --remove` or `bundle-remove` to remove only manager-marked configuration; retain the source checkout unless explicitly removed.
- **Quality:** avoid selecting redundant skills and choose the smallest useful skill set for each user request, including zero.

All canonical source provenance remains in the existing registry; metadata-only collections do not override actual canonical authorship.
