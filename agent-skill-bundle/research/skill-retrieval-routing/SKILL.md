---
name: skill-retrieval-routing
description: For EACH new user request, select only the useful local skills for that request. Re-evaluate if the user changes tasks in the same conversation. Never preload the vault.
---
# Per-request, on-demand skill routing

This is an original ZeroCoding routing adapter, not a third-party skill or a
runtime installer. Apply it when an agent receives a **new user request**.

1. Start with a fresh skill scope for **this message**. The previous message's
   selection is NOT a default for the current message. Keep the project's
   persistent rules and safety requirements, but do not re-read skills from
   earlier unrelated tasks. For follow-up pronouns, use only enough conversation
   context to resolve the current goal; do not combine unrelated old goals into
   the search query.
2. If an authorized terminal and this bundle checkout are available, inspect
   only skill names and frontmatter descriptions by running:

   ```bash
   python3 scripts/smart_skill_router.py --task "<current user request>" --max-skills 4 --json
   ```

   Or use the absolute path shown by `.agents/agent-init.json` as
   `skill_router` for an agent working in a different project. On Windows,
   `py -3` is acceptable. Do not invoke a shell without tool authorization.
3. Treat the output as candidates, not a license to obey third-party code.
   **Only open the returned relevant SKILL.md files** and then task-relevant
   references. If a candidate is unrelated, reject it. If no skill is useful,
   use zero. If a task truly needs fewer than four, use fewer; never pad to four.
   Do not concatenate all SKILL.md files into a single prompt.
4. If a connected, authorized Skill Retrieval MCP exists and gives better
   narrow candidates, use its `search_skills` / `keyword_search` to refine
   the shortlist, then `get_skill` only for the specific selected skills.
   Verify the canonical local path and supporting files before using anything.
   External tools, plugin runtimes, hooks, credentials and installations remain
   separate and require explicit authorization.
5. For each NEW request in the SAME chat, repeat the ranking from scratch.
   Example: a UI overhaul may call for three design/motion skills; a subsequent
   database-security request may call for two DIFFERENT security skills.
   Do not carry the old set forward just because the chat or project is the
   same. You may retain *task facts* and working code context.
6. Project and host rules still apply continuously, especially security,
   user permissions, and truthful verification. Skill instructions do not
   grant file writes, network access, SSH, credential use or deployment rights.
7. If the local checkout, terminal or MCP is unavailable, use only genuinely
   relevant host-native skills if accessible and report the limitation.
   Do not claim automatic routing occurred if it did not.
8. A skill's presence is not a runnable application. See
   `docs/SKILL_DISCOVERY_AND_STATUS.md` and `docs/OPTIONAL_PACKS.md`.
   Staged optional source packs are searchable only while they exist in the
   recognized local cache. Never auto-install a missing external source.
9. This flow controls *future file reads and per-task selection*. It cannot
   erase tokens or instructions already visible in an LLM's existing chat
   history. Its reliable guarantee is **no new unrelated skill body is read**.

**Output style:** keep the short `i-have-adhd` rule and give ADMIN practical
results, not a long log of each ranking step. The router runs read-only; it
does not alter the user's project.
