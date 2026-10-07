# ⚡ ZeroCoding — The Ultimate Vibe Coding & AI Agent Skills Vault

[![Antigravity](https://img.shields.io/badge/Google-Antigravity-4285F4.svg?style=flat-square&logo=google)](#)
[![Claude Code](https://img.shields.io/badge/Anthropic-Claude_Code-D97706.svg?style=flat-square&logo=anthropic)](#)
[![Codex](https://img.shields.io/badge/OpenAI-Codex-412991.svg?style=flat-square&logo=openai)](#)
[![Cursor / Windsurf](https://img.shields.io/badge/IDE-Cursor%20%7C%20Windsurf-000000.svg?style=flat-square)](#)
[![Skills](https://img.shields.io/badge/Reviewed_Skills-189-brightgreen.svg?style=flat-square)](#-all-189-skills-by-category)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

A battle-tested, curated vault of **189 specialized AI agent skills, developer workflows, and universal bootstrap automation** built specifically for **Vibe Coding**.

Empower your AI assistants (**Google Antigravity, Claude Code, OpenAI Codex, Cursor, Windsurf**) to build, animate, test, and ship production-grade code autonomously without cluttering your context window.

<p align="center">
  <a href="agent-skill-bundle/docs/media/code-motion-reel-preview.mp4">
    <img src="agent-skill-bundle/docs/media/code-motion-reel-preview.gif" alt="ZeroCoding 60fps Code Motion Reel Preview" width="360" />
  </a>
  <br>
  <sub>🎬 <b>Live Output Demo:</b> 100% code-crafted 60fps viral motion reel & procedural audio generated autonomously via <code>code-motion-reel</code>. (<a href="agent-skill-bundle/docs/media/code-motion-reel-preview.mp4"><b>Watch Full 60fps HD Video</b></a>)</sub>
</p>

---

## 💡 What is ZeroCoding?

When you **vibe code**, you want your AI to think like a staff engineer, execute like a senior craftsman, and communicate with crystal clarity—without needing 500-word prompt engineering every single turn.

**ZeroCoding delivers this with three core pillars:**
1. **Action-First Intelligence**: Embedded with `i-have-adhd` communication style for zero fluff, direct solutions, and concrete progress evidence.
2. **Strict On-Demand Architecture**: Only 2 bootstrap skills run at startup. The remaining 187 specialist workflows load dynamically *only when a specific task requires them*, saving up to 90% of your agent's context window.
3. **Cross-Host Portability**: Works uniformly across Antigravity IDE/CLI, Claude Code, OpenAI Codex, Cursor, and terminal environments.

---

## 🚀 Installation

### 1. One-Time Machine Bootstrap

Authenticate GitHub CLI once, then run the installer in your terminal:

#### Windows PowerShell
```powershell
gh api repos/ZaxMil/ZeroCoding/contents/agent-skill-bundle/install/bootstrap.ps1 -H "Accept: application/vnd.github.raw+json" | iex
```

#### macOS / Linux / Git Bash
```bash
gh api repos/ZaxMil/ZeroCoding/contents/agent-skill-bundle/install/bootstrap.sh -H "Accept: application/vnd.github.raw+json" | bash
```

---

### 2. Calibrate Any Project (In 3 Seconds)

Navigate into any existing or new project repository and run:

```bash
agent-setup
```

*(Or calibrate across all detected agent hosts simultaneously)*:
```bash
agent-init --host all
```

---

### 3. Universal Gateway for Autonomous Agents

If you are working with an autonomous coding agent (Antigravity, Claude Code, Codex), just provide this link:

```text
https://github.com/ZaxMil/ZeroCoding
```
Tell the agent: *"Read AI_SETUP.md and prepare this workspace."* The agent will automatically calibrate the workspace for you.

---

## ⚙️ What Happens When You Install?

Here is the exact step-by-step lifecycle of what happens under the hood:

```
[Your Terminal]
       │
       ▼
1. Machine Bootstrap
   ├── Creates sparse-checkout at ~/.agent-tools/ZeroCoding (downloads only the skills vault)
   ├── Adds CLI wrappers (agent-setup, agent-init, bundle-status) to ~/.agent-tools/bin
   ├── Appends ~/.agent-tools/bin to your User PATH
   └── Registers 2 Global Native Bootstraps:
         • i-have-adhd (Action-first communication protocol)
         • skill-retrieval-routing (Just-in-time skill discovery)
       │
       ▼
2. Project Calibration (`agent-setup`)
   ├── Scans project files (React, Node, Python, Godot, WordPress, Flutter, etc.)
   ├── Installs 10 Project Core skills locally into your project:
   │     • .agents/skills/ (for Antigravity & OpenAI Codex)
   │     • .claude/skills/ (for Claude Code)
   └── Safely links AGENTS.md / CLAUDE.md without overwriting your custom rules
       │
       ▼
3. Strict On-Demand Execution
   ├── Zero startup bloat: Context window usage stays under 2%
   └── When you ask for a specialist task (e.g. "make a 60fps reel", "audit security", "fix SEO"):
         Agent searches the local vault and loads only that specific SKILL.md into memory!
```

### Safety & Clean Removal Guarantees
- **Never modifies product code**: Bootstrap and init tools never change your application code or install npm/pip packages without asking.
- **Never overwrites your personal rules**: Existing project instructions and personal skills are strictly preserved.
- **1-Command Clean Removal**: Run `agent-init --remove` in your project to cleanly remove only bundle-managed files.

---

## 📚 All 189 Skills by Category

The complete vault is located in [`agent-skill-bundle/`](agent-skill-bundle/). Every skill is a self-contained directory containing `SKILL.md`, plus applicable scripts, templates, and reference guides.

<details open>
<summary><b>🎬 Creative & Media (5 skills)</b></summary>

- [`code-motion-reel`](agent-skill-bundle/creative/code-motion-reel/): 100% code-crafted 60fps Remotion viral reels & procedural synthesized audio.
- [`game-ready-2d-asset-pipeline`](agent-skill-bundle/creative/game-ready-2d-asset-pipeline/): Production-ready 2D modular sprite generation & export pipeline.
- [`openmontage`](agent-skill-bundle/creative/openmontage/): Video pipeline orchestrator and timeline assembler.
- [`shuohao-skills`](agent-skill-bundle/creative/shuohao-skills/): Visual novel, character reference sheets, and drama production workflows.
- [`zax-editor`](agent-skill-bundle/creative/zax-editor/): Arabic talking-head video editing workflow and timeline router.
</details>

<details open>
<summary><b>💻 Coding & Architecture (10 skills)</b></summary>

- [`agent-architecture-audit`](agent-skill-bundle/coding/agent-architecture-audit/): Architectural consistency and boundary auditing for agent systems.
- [`agent-harness-construction`](agent-skill-bundle/coding/agent-harness-construction/): Builds deterministic test harnesses for autonomous agents.
- [`godot-gdscript-patterns`](agent-skill-bundle/coding/godot-gdscript-patterns/): Godot 4 scene composition, signal architecture, and GDScript patterns.
- [`graphify`](agent-skill-bundle/coding/graphify/): Codebase knowledge graph generator for dependency and impact analysis.
- [`ponytail`](agent-skill-bundle/coding/ponytail/): Forces the laziest, cleanest solution that actually works (YAGNI, standard library first).
- [`ponytail-audit`](agent-skill-bundle/coding/ponytail-audit/): Detects unnecessary dependencies, over-engineering, and abstraction bloat.
- [`ponytail-debt`](agent-skill-bundle/coding/ponytail-debt/): Minimal-diff technical debt eradication.
- [`ponytail-gain`](agent-skill-bundle/coding/ponytail-gain/): High-impact, low-effort feature velocity optimizer.
- [`ponytail-help`](agent-skill-bundle/coding/ponytail-help/): Plain-English architecture clarification without jargon.
- [`ponytail-review`](agent-skill-bundle/coding/ponytail-review/): Senior PR review stripping out bloated abstractions.
</details>

<details open>
<summary><b>🎨 Design & UI/UX (26 skills)</b></summary>

- [`ui-ux-pro-max`](agent-skill-bundle/design/ui-ux-pro-max/): Complete UI/UX intelligence system with typography, color palettes, and component reasoning.
- [`frontend-design`](agent-skill-bundle/design/frontend-design/): Distinctive, production-grade frontend interfaces avoiding generic AI aesthetics.
- [`design-taste-frontend`](agent-skill-bundle/design/design-taste-frontend/): High-taste layout, typography, and motion design curation.
- [`design-style-picker`](agent-skill-bundle/design/design-style-picker/): Curates aesthetic themes matching brand and project identity.
- [`ui-designer`](agent-skill-bundle/design/ui-designer/): Component-level UI specs and interaction layouts.
- [`image-to-code`](agent-skill-bundle/design/image-to-code/): Converts screenshots and mockups into pixel-perfect responsive code.
- [`awesome-design`](agent-skill-bundle/design/awesome-design/): Design library router for 60+ contemporary web styles.
- [`brand-guidelines`](agent-skill-bundle/design/brand-guidelines/): Cohesive brand identity systems and design tokens.
- [`theme-factory`](agent-skill-bundle/design/theme-factory/): Multi-theme generators (OLED dark, light, high-contrast, cyberpunk, pastel).
- [`canvas-design`](agent-skill-bundle/design/canvas-design/): HTML5 Canvas high-performance drawing and procedural graphics.
- [`algorithmic-art`](agent-skill-bundle/design/algorithmic-art/): Generative math visuals, shader patterns, and SVG procedural art.
- [`game-economy-designer`](agent-skill-bundle/design/game-economy-designer/): Game currencies, sink/faucet loops, and progression balancing.
- [`web-artifacts-builder`](agent-skill-bundle/design/web-artifacts-builder/): Standalone single-file interactive HTML widgets and demos.
- [`web-design-guidelines`](agent-skill-bundle/design/web-design-guidelines/): Web interface guidelines and modern accessibility standards.
- [`webapp-testing`](agent-skill-bundle/design/webapp-testing/): UI behavior verification and interaction state checking.
- [`doc-coauthoring`](agent-skill-bundle/design/doc-coauthoring/), [`docx`](agent-skill-bundle/design/docx/), [`pdf`](agent-skill-bundle/design/pdf/), [`pptx`](agent-skill-bundle/design/pptx/), [`xlsx`](agent-skill-bundle/design/xlsx/): Document synthesis and data presentation skills.
- [`claude-api`](agent-skill-bundle/design/claude-api/), [`design-md`](agent-skill-bundle/design/design-md/), [`internal-comms`](agent-skill-bundle/design/internal-comms/), [`mcp-builder`](agent-skill-bundle/design/mcp-builder/), [`skill-creator`](agent-skill-bundle/design/skill-creator/), [`slack-gif-creator`](agent-skill-bundle/design/slack-gif-creator/)
</details>

<details open>
<summary><b>⚡ Automation & Integrations (15 skills)</b></summary>

- **14 Official n8n Workflow Packages**:
  - [`n8n-agents-official`](agent-skill-bundle/automation/n8n-agents-official/): AI agent nodes, vector stores, and tool calling in n8n.
  - [`n8n-binary-and-data-official`](agent-skill-bundle/automation/n8n-binary-and-data-official/): Handling files, images, buffers, and binary transforms.
  - [`n8n-code-nodes-official`](agent-skill-bundle/automation/n8n-code-nodes-official/): JavaScript and Python execution nodes.
  - [`n8n-credentials-and-security-official`](agent-skill-bundle/automation/n8n-credentials-and-security-official/): Credential management and OAuth security.
  - [`n8n-data-tables-official`](agent-skill-bundle/automation/n8n-data-tables-official/): Built-in n8n relational tables.
  - [`n8n-debugging-official`](agent-skill-bundle/automation/n8n-debugging-official/): Execution tracing and workflow fault isolation.
  - [`n8n-error-handling-official`](agent-skill-bundle/automation/n8n-error-handling-official/): Error trigger patterns and retry fallbacks.
  - [`n8n-expressions-official`](agent-skill-bundle/automation/n8n-expressions-official/): JMESPath and Luxon expression syntax.
  - [`n8n-extending-mcp-official`](agent-skill-bundle/automation/n8n-extending-mcp-official/): Connecting n8n into Model Context Protocol.
  - [`n8n-loops-official`](agent-skill-bundle/automation/n8n-loops-official/): Batching, loop-over-items, and pagination.
  - [`n8n-node-configuration-official`](agent-skill-bundle/automation/n8n-node-configuration-official/): Best-practice configuration for 400+ nodes.
  - [`n8n-subworkflows-official`](agent-skill-bundle/automation/n8n-subworkflows-official/): Modular subworkflow patterns.
  - [`n8n-workflow-lifecycle-official`](agent-skill-bundle/automation/n8n-workflow-lifecycle-official/): Versioning, deployment, and testing.
  - [`using-n8n-skills-official`](agent-skill-bundle/automation/using-n8n-skills-official/): Master index for official n8n tools.
- [`n8n-instance`](agent-skill-bundle/automation/n8n-instance/): Self-hosted n8n server setup and webhook configuration.
</details>

<details open>
<summary><b>🧠 Process & Agent Thinking (19 skills)</b></summary>

- **Superpowers Process Workflows**:
  - [`brainstorming`](agent-skill-bundle/process/brainstorming/): Structured exploration before diving into code.
  - [`test-driven-development`](agent-skill-bundle/process/test-driven-development/): Strict Red-Green-Refactor enforcement.
  - [`systematic-debugging`](agent-skill-bundle/process/systematic-debugging/): Root-cause diagnosis before modifying code.
  - [`verification-before-completion`](agent-skill-bundle/process/verification-before-completion/): Requires real test execution evidence before claiming success.
  - [`writing-plans`](agent-skill-bundle/process/writing-plans/) & [`executing-plans`](agent-skill-bundle/process/executing-plans/): Step-by-step bounded planning and execution.
  - [`dispatching-parallel-agents`](agent-skill-bundle/process/dispatching-parallel-agents/) & [`subagent-driven-development`](agent-skill-bundle/process/subagent-driven-development/): Coordinating multiple AI subagents.
  - [`requesting-code-review`](agent-skill-bundle/process/requesting-code-review/) & [`receiving-code-review`](agent-skill-bundle/process/receiving-code-review/): Rigorous peer review protocols.
  - [`finishing-a-development-branch`](agent-skill-bundle/process/finishing-a-development-branch/) & [`using-git-worktrees`](agent-skill-bundle/process/using-git-worktrees/): Git branch and worktree hygiene.
  - [`diagnosing-superpowers`](agent-skill-bundle/process/diagnosing-superpowers/) & [`using-superpowers`](agent-skill-bundle/process/using-superpowers/): Diagnostic suite for agent processes.
  - [`writing-skills`](agent-skill-bundle/process/writing-skills/): Meta-skill for authoring new agent skills.
- [`paul`](agent-skill-bundle/process/paul/): Plan-Apply-Unify portable engineering cycle.
- [`agent-introspection-debugging`](agent-skill-bundle/process/agent-introspection-debugging/): Diagnoses stuck agent loops and tool failures.
- [`architecture-decision-records`](agent-skill-bundle/process/architecture-decision-records/): Lightweight ADR documentation.
- [`iterative-retrieval`](agent-skill-bundle/process/iterative-retrieval/): Multi-stage knowledge retrieval.
</details>

<details open>
<summary><b>🛡️ Security & QA (22 skills)</b></summary>

- **Security (7 skills)**:
  - [`secure-by-default-development`](agent-skill-bundle/security/secure-by-default-development/): Universal security orchestrator, OWASP Top 10 guardrails, and RLS checks.
  - [`api-security-probing`](agent-skill-bundle/security/api-security-probing/): Adversarial probing for auth bypass, injection, and IDOR.
  - [`web-security-audit`](agent-skill-bundle/security/web-security-audit/): CSP, CORS, HTTPS headers, and client attack surfaces.
  - [`ultimate-security-audit`](agent-skill-bundle/security/ultimate-security-audit/): Full-spectrum application security auditing.
  - [`public-repo-safety`](agent-skill-bundle/security/public-repo-safety/): Pre-commit secret scanning and credential leakage prevention.
  - [`wordpress-security`](agent-skill-bundle/security/wordpress-security/) & [`wordpress-security-audit`](agent-skill-bundle/security/wordpress-security-audit/): CMS security hardening.
- **QA & Web Quality (15 skills)**:
  - [`release-readiness`](agent-skill-bundle/qa/release-readiness/): Smoke testing, deployment checklist, rollback verification.
  - [`web-quality-audit`](agent-skill-bundle/qa/web-quality-audit/): Comprehensive audit for web vitals, a11y, and SEO.
  - [`accessibility`](agent-skill-bundle/qa/accessibility/): WCAG 2.2 AA compliance auditing and keyboard navigation testing.
  - [`core-web-vitals`](agent-skill-bundle/qa/core-web-vitals/): LCP, INP, and CLS optimization.
  - [`best-practices`](agent-skill-bundle/qa/best-practices/) & [`performance`](agent-skill-bundle/qa/performance/): Performance profiling and modern standards.
  - [`cross-agent-skill-verification`](agent-skill-bundle/qa/cross-agent-skill-verification/): Multi-host compatibility verification.
  - [`screenshot-driven-visual-polish`](agent-skill-bundle/qa/screenshot-driven-visual-polish/) & [`ui-screenshot-specs`](agent-skill-bundle/qa/ui-screenshot-specs/): Visual regression testing.
  - [`ai-regression-testing`](agent-skill-bundle/qa/ai-regression-testing/), [`dogfood`](agent-skill-bundle/qa/dogfood/), [`frontend-silent-failure-debugging`](agent-skill-bundle/qa/frontend-silent-failure-debugging/), [`production-audit`](agent-skill-bundle/qa/production-audit/), [`seo`](agent-skill-bundle/qa/seo/), [`spa-browser-qa`](agent-skill-bundle/qa/spa-browser-qa/)
</details>

<details open>
<summary><b>📝 Productivity & Communication (6 skills)</b></summary>

- [`i-have-adhd`](agent-skill-bundle/productivity/i-have-adhd/): Direct, action-first communication style that eliminates AI filler and long essays.
- [`caveman`](agent-skill-bundle/productivity/caveman/): Ultra-dense, maximum information density output.
- [`humanizer`](agent-skill-bundle/productivity/humanizer/): Removes synthetic AI prose patterns and robotic jargon.
- [`claude-mem`](agent-skill-bundle/productivity/claude-mem/): Cross-session memory and context persistence connection guide.
- [`context-budget`](agent-skill-bundle/productivity/context-budget/): Token budget management and MCP tool-call optimization.
- [`graft`](agent-skill-bundle/productivity/graft/): Declarative skill vault synchronization.
</details>

<details open>
<summary><b>🌐 Operations, Multiplayer & Research (18 skills)</b></summary>

- **Multiplayer (3 skills)**:
  - [`live-cursors`](agent-skill-bundle/multiplayer/live-cursors/): Real-time collaborative multiplayer cursors.
  - [`chat-room`](agent-skill-bundle/multiplayer/chat-room/): Ephemeral and persistent WebSocket chat systems.
  - [`multiplayer-game`](agent-skill-bundle/multiplayer/multiplayer-game/): State-synchronized multiplayer game architecture.
- **Operations (11 skills)**:
  - [`safe-deployment`](agent-skill-bundle/operations/safe-deployment/): Zero-downtime deployment pipelines.
  - [`server-triage`](agent-skill-bundle/operations/server-triage/): High-load, memory-leak, and crash debugging on VPS/cloud.
  - [`nginx-tls-operations`](agent-skill-bundle/operations/nginx-tls-operations/): Nginx, reverse proxy, SSL/TLS certificates.
  - [`cloudflare-dns-operations`](agent-skill-bundle/operations/cloudflare-dns-operations/): Cloudflare DNS and edge routing.
  - [`postgresql-operations`](agent-skill-bundle/operations/postgresql-operations/): Schema migrations, indexing, and connection pools.
  - [`backup-recovery`](agent-skill-bundle/operations/backup-recovery/), [`codebase-onboarding`](agent-skill-bundle/operations/codebase-onboarding/), [`godot-android-ota`](agent-skill-bundle/operations/godot-android-ota/), [`project-handoff`](agent-skill-bundle/operations/project-handoff/), [`project-inventory`](agent-skill-bundle/operations/project-inventory/), [`secure-server-access`](agent-skill-bundle/operations/secure-server-access/)
- **Research & Discovery (4 skills)**:
  - [`skill-retrieval-routing`](agent-skill-bundle/research/skill-retrieval-routing/): Master routing skill for finding and loading specialist skills.
  - [`agent-project-catalog`](agent-skill-bundle/research/agent-project-catalog/), [`agent-reach-routing`](agent-skill-bundle/research/agent-reach-routing/), [`agent-skills`](agent-skill-bundle/research/agent-skills/)
</details>

<details>
<summary><b>📈 Growth, Marketing & Content (50 skills)</b></summary>

Comprehensive playbook of 50 standalone marketing & conversion skills:
`ab-testing`, `ad-creative`, `ads`, `ai-seo`, `analytics`, `aso`, `attribution`, `churn-prevention`, `co-marketing`, `cold-email`, `community-marketing`, `competitor-profiling`, `competitors`, `content-strategy`, `copy-editing`, `copywriting`, `cro`, `customer-research`, `directory-submissions`, `emails`, `events`, `free-tools`, `image`, `influencer-marketing`, `launch`, `lead-magnets`, `marketing-council`, `marketing-ideas`, `marketing-loops`, `marketing-plan`, `marketing-psychology`, `offers`, `onboarding`, `paywalls`, `popups`, `pricing`, `product-marketing`, `programmatic-seo`, `prospecting`, `public-relations`, `referrals`, `revops`, `sales-enablement`, `schema`, `seo-audit`, `signup`, `site-architecture`, `sms`, `social`, `video`.
</details>

<details>
<summary><b>🔌 WordPress Engineering (18 skills)</b></summary>

Professional modern WordPress development workflows:
`blueprint`, `wordpress-router`, `wp-abilities-api`, `wp-abilities-audit`, `wp-abilities-verify`, `wp-block-development`, `wp-block-themes`, `wp-interactivity-api`, `wp-patterns`, `wp-performance`, `wp-phpstan`, `wp-playground`, `wp-plugin-development`, `wp-plugin-directory-guidelines`, `wp-project-triage`, `wp-rest-api`, `wp-wpcli-and-ops`, `wpds`.
</details>

---

## 🛠️ Offline Diagnostics & Skill Search

ZeroCoding includes offline search tools that run without MCP or cloud dependencies:

```bash
# Search for skills by topic or keyword
python agent-skill-bundle/scripts/skill_doctor.py search "motion reel"
python agent-skill-bundle/scripts/skill_doctor.py search "tailwind"

# Check bundle health and verification status
python agent-skill-bundle/scripts/skill_doctor.py doctor
```

---

## 🤝 Contributing & Community

ZeroCoding is crafted for developers who want to push the boundaries of AI-assisted engineering and vibe coding.

- Star ⭐ the repository if this speeds up your workflow!
- Contributions and new reviewed skills are welcome via Pull Request.
- Follow [@ZaxMil](https://github.com/ZaxMil) for more tools, workflows, and vibe coding experiments.

---

<p align="center">
  <b>Built for builders who code at the speed of thought. ⚡</b>
</p>