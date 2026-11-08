# Per-request skill routing

**Goal:** the user can request one task, then an unrelated task **in the same chat**, and the agent chooses the smallest set of appropriate skills each time. No "load every skill up front" strategy.

## What happens on each new user message

1. The coding agent reads its persistent project rules.
2. It invokes `smart_skill_router.py` on the **current request**, not the whole chat. The selector reads skill names and frontmatter descriptions only, never entire skill bodies.
3. It checks the shortlist for actual relevance and reads only the selected original `SKILL.md` plus necessary references. Up to four by default, fewer or zero for simple tasks.
4. It carries out the authorized task, verifies the result and reports truthfully.
5. With the **next** user message the selection is recomputed from scratch. The agent keeps necessary project/task facts, but doesn't reread unrelated skill bodies from the earlier task.

Example, using the same conversation:

| Current request | Suggested kind of skills |
|---|---|
| "Redesign my website with better responsive UI and animation" | UI/UX design, responsive frontend, animation |
| "Now audit security and indexing" | Security audit and SEO; previous animation skill does not carry forward |
| "Thanks!" | None |

The router is **not** asked to load four skills every time; four is just a default ceiling that can be adjusted. An unrelated skill must never be added merely to fill a slot. User or project instructions override a poor automatic match.

## Use in an initialized project

Your existing ZeroCoding bootstrap creates a source checkout and installs a small Project Core. In a project already set up, run `agent-setup` again to refresh the managed agent rules without overwriting user-authored rules.

The coding agent is instructed through its managed `AGENTS.md` / `CLAUDE.md` block to run the selector automatically **when the host permits local terminal access**. The command is available in the project's `.agents/agent-init.json` as `skill_router`.

To inspect the router yourself from the source checkout:

```bash
python3 scripts/smart_skill_router.py --task "Redesign my website and improve animations" --max-skills 4 --json
python3 scripts/smart_skill_router.py --task "Audit my website security and SEO indexing" --max-skills 4 --json
python3 scripts/smart_skill_router.py --task "Hi" --json
```

Windows PowerShell:

```powershell
py -3 "$HOME/.agent-tools/ZeroCoding/agent-skill-bundle/scripts/smart_skill_router.py" --task "Fix the website design and animation" --json
```

The tool's `selected[].path` entries point to the original, locally available `SKILL.md` files. Reading those files is a **separate step for the agent**, never an automatic side effect of the selector.

Optional source packs staged via `optional_packs.py install` are also candidates. They are not installed implicitly by this router. External, metadata-only gateways and runtime-dependent plugins remain excluded from automatic selection.

## Safety, limitations, and performance

- The selector uses lightweight, deterministic metadata matching without paid AI calls, network requests, or running external scripts. Its first pass is a useful shortlist, not an infallible semantic judgment. The agent must reject unsuitable matches.
- The library lives on disk outside projects. The agent only loads the task-specific instructions it needs. A task can correctly require **zero** skills.
- ChatGPT, Claude and other model hosts may retain previously read text in the same conversation's model context. **No local router can delete that history.** Per-request routing controls what is read and followed **next**, not what a model already saw.
- `AGENTS.md` and `CLAUDE.md` are **instructions to a compatible coding agent**, not an operating-system listener. A host that ignores project rules or lacks a local terminal cannot be made to invoke the router by adding a repository script. Do not claim that it ran without evidence.
- Reuse high-level task facts when the user refers to an earlier job; reroute only when the task changes, or rerun with the current active goal on continuations. Never use the old selection just because it is cached.
- Keep secrets, credentials, app code, infrastructure, deployment, hooks and destructive operations subject to the user's authorization. Routing never grants access or permissions.

## Developer validation

```bash
python3 -m unittest discover -s tests -p 'test_smart_skill_router.py'
python3 scripts/smart_skill_router.py --task "Improve UI and animations" --json
```

Existing installer, Project Core and legacy source provenance checks should continue to pass. The router does not add a new global host skill, replace the original 205 local skills, or change upstream skill bodies.
