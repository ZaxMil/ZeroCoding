# Design source expansion — 2026-11-15

All 12 projects in the reviewed screenshot are verified canonical GitHub repositories. ZeroCoding distinguishes native Agent Skills from standalone software and component libraries. It does not bundle restricted components or install external dependencies on setup.

| Repository | Revision | Integration |
|---|---|---|
| [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | `1f50119f717e` | Existing local and optional current skill source |
| [Awesome DESIGN.md](https://github.com/VoltAgent/awesome-design-md) | `fcc702849322` | Existing design-system collection; source reference |
| [Open Design](https://github.com/nexu-io/open-design) | `59e4f2ae85de` | External application reference plus original gateway |
| [Taste Skill](https://github.com/Leonxlnx/taste-skill) | `f6b76575f949` | Existing older skill; optional current skill source |
| [Impeccable](https://github.com/pbakaus/impeccable) | `2b86d9c07b97` | Optional source skill; no executables enabled |
| [React Bits](https://github.com/DavidHDev/react-bits) | `cf2801031f07` | Component-library reference + original gateway; no redistribution |
| [Emil Kowalski Skills](https://github.com/emilkowalski/skills) | `64eb3deb9a5f` | 20 current catalog names and optional source skill pack |
| [Hallmark](https://github.com/nutlope/hallmark) | `04977e15f3df` | Optional source skill pack (full original references) |
| [Google DESIGN.md](https://github.com/google-labs-code/design.md) | `1ed38aa9dd44` | Reference specification, distinct from existing Hermes design-md |
| [GSAP Skills](https://github.com/greensock/gsap-skills) | `aed9cfd32777` | 8 source-preserved native skills and optional source pack |
| [Scroll World](https://github.com/oso95/scroll-world) | `71cc36d3bb15` | Complete native skill with five references and optional source |
| [Canvas UI](https://github.com/DavidHDev/canvas-ui) | `a0be3b7e1f42` | Component-library reference + original gateway; no redistribution |

The complete immutable pins and source types are in [the provenance manifest](../registry/design-expansion-2026-11-15.json).

## What's included now

- 8 exact official GreenSock `SKILL.md` files with original MIT license notice overlaid into each skill directory.
- 1 exact Scroll World `SKILL.md`, five original supporting references and original MIT license notice.
- 3 independently written ZeroCoding guides for Open Design, React Bits and Canvas UI. **No upstream application code or component source has been copied.**
- Current source pins for Impeccable, Hallmark, Emil (all 20 skills), Taste and UI/UX Pro Max, available as *explicit* opt-in source checkouts.

The source-vault total is now **217** local `SKILL.md` directories (up from 205). This does not count the 20 Emil skills and other optional upstream skills as physically bundled or installed. The earlier local UI/UX Pro Max, Taste and VoltAgent collection are retained as reviewed snapshots, not silently declared identical to their newer upstream revisions.

## Optional source-only install

From the `agent-skill-bundle/` directory of the installed ZeroCoding checkout:

```bash
python3 scripts/optional_packs.py verify-manifest
python3 scripts/optional_packs.py list
python3 scripts/optional_packs.py install --pack impeccable
python3 scripts/optional_packs.py install --pack hallmark
python3 scripts/optional_packs.py install --pack emil
python3 scripts/optional_packs.py install --pack taste-current
python3 scripts/optional_packs.py install --pack ui-ux-pro-max-current
python3 scripts/optional_packs.py status
```

This manager checks out original source at pinned revisions into a separate local cache and does **not run included scripts or install programs, plugins, servers, hooks, or dependencies**. The on-demand router considers optional skills only after separately staged. Avoid storing 100+ skills directly inside each project; use task-level retrieval (default max 4).

**License note:** React Bits and Canvas UI use MIT + Commons Clause. They can be integrated under their specific conditions into user applications but their components/tools cannot be redistributed as a standalone skill bundle. The local guides are original references, not mirrors. The Open Design application uses Apache-2.0 but is not an installable Agent Skill. Current GSAP skill instructions use MIT; the GSAP JavaScript library and plugins must be evaluated separately when actually used.

## Check

```bash
python3 scripts/optional_packs.py verify-manifest
python3 -m unittest discover -s tests -p test_smart_skill_router.py
python3 scripts/smart_skill_router.py --task 'Use GSAP ScrollTrigger animation' --json
python3 scripts/smart_skill_router.py --task 'Use React Bits components' --json
```
