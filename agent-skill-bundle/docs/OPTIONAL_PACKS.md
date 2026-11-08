# Optional upstream packs (10 canonical sources)

ZeroCoding's existing bootstrap, 2 global starter skills, 10 project core skills, and 205 local vault skills are **unchanged**. This add-on follows the same **source outside project, discover on demand** method.

The extra pack manager downloads only reviewed, immutable **Git commit** snapshots into the machine's external source vault. It does not install software, execute third-party scripts, add hooks/MCP servers, change agent rules, or modify application code. A skill document is not a guarantee that an external runtime works.

## After normal ZeroCoding setup

Open a terminal where your ZeroCoding checkout is available. Run:

```bash
python agent-skill-bundle/scripts/optional_packs.py list
python agent-skill-bundle/scripts/optional_packs.py install --all
python agent-skill-bundle/scripts/optional_packs.py status
python agent-skill-bundle/scripts/skill_doctor.py search "animation"
```

Windows PowerShell may use `py -3` in place of `python`. For the machine-bootstrap sparse checkout, use:

```powershell
py -3 "$HOME/.agent-tools/ZeroCoding/agent-skill-bundle/scripts/optional_packs.py" install --all
```

On macOS/Linux:

```bash
python3 "$HOME/.agent-tools/ZeroCoding/agent-skill-bundle/scripts/optional_packs.py" install --all
```

If you prefer not to fetch every skill pack, first use `--dry-run`, or replace `--all` with `--pack hallmark` (same for another pack ID). Git and network access to GitHub are required to fetch upstream sources; Python 3 uses only its standard library. Machine bootstrap continues to work unchanged when offline.

## Sources and behavior

| ID | Canonical upstream | Handling |
|---|---|---|
| `karpathy` | [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) | Reference only. No declared repository license; do not redistribute its guidance. Existing ZeroCoding coding guidelines are preserved. |
| `emil` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | Optional original skill source checkout; replaces old metadata-only search entries when staged. |
| `graphify` | [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify) | Runtime gateway only. Upstream explicitly requires installing `graphifyy` separately, then `graphify install`. |
| `ponytail` | [dietrichgebert/ponytail](https://github.com/dietrichgebert/ponytail) | Optional latest pinned original source; older ZeroCoding copies remain intact. |
| `caveman` | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) | Optional original skill source only; no proxy, compression engine, hooks or metrics service. Observe component-specific licenses. |
| `hallmark` | [nutlope/hallmark](https://github.com/nutlope/hallmark) | Optional anti-generic-design skill source. |
| `superpowers` | [obra/superpowers](https://github.com/obra/superpowers) | Optional full skill source; no plugin, hooks or commands enabled. Existing local skills remain. |
| `agentskills` | [agentskills/agentskills](https://github.com/agentskills/agentskills) | Official format/specification reference, not a set of ready-to-install skill folders. |
| `antigravity` | [rmyndharis/antigravity-skills](https://github.com/rmyndharis/antigravity-skills) | Optional large specialist source library; keep it outside project folders. |
| `anthropic` | [anthropics/skills](https://github.com/anthropics/skills) | Optional original skill source with per-skill licensing; don't assume a blanket repo-wide license. |

**What does `install --all` do?** Stages the seven sources in `skills` mode at `~/.agent-tools/ZeroCoding/external-packs/`, and prints reference/runtime messages for the other three. Installed source files stay *outside* projects; search includes their skill documents on demand. It does not copy hundreds of files into an app's `.agents/skills` or `.claude/skills` directories.

Use normal `agent-setup` to initialize a new project; the default 10 core skills and your existing rules are unaffected.

## Maintenance and safety

```bash
python agent-skill-bundle/scripts/optional_packs.py verify-manifest
python agent-skill-bundle/scripts/optional_packs.py status
python agent-skill-bundle/scripts/optional_packs.py remove --pack hallmark
```

- Pinned commit IDs are in [the optional source registry](../registry/optional-packs.json). A new upstream version must be reviewed and intentionally repinned, not silently fetched.
- A pre-existing target with an unrecognized marker or different revision is **never overwritten**. Removal only applies to recognized, unchanged managed checkouts.
- Sources remain attributed to their original authors. This repository does **not** republish entire external skill packs or grant permissions beyond upstream licenses.
- Skill text can request dangerous operations. Review the specific instruction and its supporting scripts before an agent follows or runs them. Avoid loading all skills into context simultaneously.
- `Graphify` can work locally, but its actual CLI/dependencies are separate from the skill text. Follow its official instructions if you intentionally choose to install the application.
- This manager needs to be run explicitly. It never authorizes credentials, deployments, file deletion outside its own managed cache, or external software execution.

