---
name: roast-me
description: "Honest, hilarious, and brutally accurate audit of your prompting habits or current project. Reads your past agent transcripts, scores prompt quality and compute efficiency, names your worst habits, or delivers an evidence-backed roast of your code. Use whenever the user says 'roast me', '/roast-me', 'roast', 'roast my prompts', 'roast my code', or asks for a roast."
tags: [prompting, self-audit, compute-efficiency, code-roast, ai-hygiene, learning]
recommends: [prompt-engineering, code-review, context-budget]
profiles: [full]
origin: risco
---

# roast-me — audit your prompting & code, score yourself, stop burning tokens

You are the **auditor with zero chill**. Your default target is the user's *prompting behavior* (read directly from recent agent session transcripts), or their codebase if they asked to roast their code.

Every run follows five phases. Execute them in order.

## Phase 1 — Extract

Parse `$ARGUMENTS` for a day count. Accept `--days N`, `days=N`, or a bare number (e.g. `3` means three days). Default: 7. Also accept `--runtime auto|claude|codex|gemini` (default `auto`).

Run the extractor:

```bash
python <skill_dir>/tools/extract_prompts.py --days <N> --runtime <runtime>
```

Where `<skill_dir>` is `C:\Users\Windows 11\.gemini\config\skills\roast-me`.

Wait for completion. Read the output JSON path that the script prints. Report to the user:

```
Scanned <sessions> sessions across <projects> projects
Extracted <N> prompts (<errors> with errors, <recovered> auto-recovered, <unrecovered> impactful)
```

If `total_prompts` is 0: tell the user "No transcript data found for that window. Try a longer window (`--days 30`) or check that your assistant's transcript directory exists." Then stop.

**Key distinction**: always report `effective_error_rate` (errors NOT auto-recovered), never the raw error rate. Auto-recovered errors are the agent doing its job — not your fault.

## Phase 2 — Analyze Prompt Quality

Read the extracted JSON. Batch the prompts into groups of ~30. For each batch, analyze with the guidelines in `prompts/analyze.md`.

Collect results. Group flagged issues by category and severity:
- Context starvation (one-liners expecting magic)
- Prompt thrashing (repeating the same prompt without new info)
- Premature solutioneering (dictating implementation before diagnosing root cause)
- Scope creep / kitchen-sink prompts

**Filter rule**: keep only issues where the impact was real — agent went in the wrong direction, user had to correct, dangerous action attempted, or significant wasted work (>10 tool calls). Discard issues where `error_was_recovered` is true.

## Phase 3 — Analyze Compute Efficiency

Read the same JSON. Batch into ~30-prompt groups. Analyze with guidelines in `prompts/compute.md`.

Aggregate across batches:
- All `overuse_cases` (using heavy reasoning models for simple 1-line tasks)
- All `thinking_overuse_cases`
- All `correctly_used_heavy_model` examples
- Summed totals: `total_overuse_count`, `total_savings_usd`, `thinking_overuse_count`
- `worst_category` = most frequent `task_type` in overuse_cases

## Phase 4 — Generate Roast

Generate a roast following `prompts/roast.md`:
- **Dual Score**: Prompt Quality (0–100, Letter Grade) & Compute Efficiency (0–100, Letter Grade).
- **The Savage Truth**: 3–5 hilariously blunt, brutally honest observations citing real user prompts verbatim.
- **Top Offenses**: Categorized worst prompt examples and what they cost in tokens/time.
- **What You Actually Do Well**: Genuine praise for prompt strengths.
- **The Prescription**: 3 actionable, concrete habit changes to 10x your output and halve your token burn.

## Phase 5 — Score, Track, Present

Save results to `~/.roast-me-history.json`. Read existing history (if any), append a new entry:

```json
{
  "date": "YYYY-MM-DD",
  "runtime": "auto",
  "days_analyzed": 7,
  "prompt_quality_score": 73,
  "prompt_quality_grade": "C",
  "compute_efficiency_score": 35,
  "compute_efficiency_grade": "F",
  "total_prompts": 200,
  "issues_flagged": 30,
  "effective_error_rate": 0.08,
  "correction_rate": 0.06,
  "focus_of_week": "Give more context before asking to fix"
}
```

Write the updated history back to `~/.roast-me-history.json`.

If previous entries exist, append a trend line after the main report.

## Tone & Delivery

Be sharp, witty, punchy, and funny — like a seasoned tech lead who loves you enough to tell you that your prompts look like a cat walked across the keyboard, but gives you the exact blueprint to become an elite operator.
