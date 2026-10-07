# ⚡ ZeroCoding — AI Agent Skills Vault & Universal Setup Gateway

[![Antigravity](https://img.shields.io/badge/Google-Antigravity-4285F4.svg)](#)
[![Codex](https://img.shields.io/badge/OpenAI-Codex-412991.svg)](#)
[![Claude Code](https://img.shields.io/badge/Anthropic-Claude_Code-D97706.svg)](#)
[![Skills](https://img.shields.io/badge/Reviewed_Skills-189+-brightgreen.svg)](#-whats-included)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A curated collection of reviewed AI agent skills, developer workflows, and cross-host bootstrap automation for **Google Antigravity, OpenAI Codex, Claude Code**, and other file-based Agent Skills environments.

> **🤖 Quick Entrypoint for Coding Agents:**  
> If an AI agent was given `https://github.com/ZaxMil/ZeroCoding` to prepare an unrelated project, start with **[AI_SETUP.md](AI_SETUP.md)**. It detects the target workspace stack and installs the 10 Project Core skills without polluting startup discovery.

---

## 🚀 Quick Start (Machine Bootstrap)

Authenticate GitHub CLI once, then run the one-line setup in your terminal:

### Windows PowerShell
```powershell
gh api repos/ZaxMil/ZeroCoding/contents/agent-skill-bundle/install/bootstrap.ps1 -H "Accept: application/vnd.github.raw+json" | iex
```

### macOS / Linux / Git Bash
```bash
gh api repos/ZaxMil/ZeroCoding/contents/agent-skill-bundle/install/bootstrap.sh -H "Accept: application/vnd.github.raw+json" | bash
```

### In Every New Project
```bash
agent-setup
# Or initialize across all detected hosts (Antigravity, Codex, Claude Code):
agent-init --host all
```

---

## 🎯 Architecture: Strict On-Demand

Loading 180+ skills at agent startup clutters context windows and degrades tool routing. ZeroCoding utilizes **strict on-demand loading**:

1. **2 Native Global Bootstraps**:
   - `i-have-adhd`: Action-first, low-latency, concise communication style.
   - `skill-retrieval-routing`: Keyword routing to locate specialist skills.
2. **189+ Specialist Skills**: Remain stored in the single source vault (`agent-skill-bundle/`).
3. **Just-in-Time Loading**: When an agent begins a task (e.g., motion reel generation, web audit, secure backend implementation), it loads only that specific `SKILL.md` into memory.

---

## 📦 What's Included

Explore [`agent-skill-bundle/`](agent-skill-bundle/) for complete categorized workflows:

| Category | Highlights & Workflows |
|---|---|
| 🎬 **Creative & Media** | [`code-motion-reel`](agent-skill-bundle/creative/code-motion-reel/) (automated 60fps Remotion brand reels & audio), `openmontage` video routing, `zax-editor` Arabic talking-head editing, `shuohao-skills` visual novel & drama workflows. |
| 💻 **Coding & Architecture** | TDD loops, Godot 4 GDScript patterns, Paul Plan-Apply-Unify, refactoring frameworks, Superpowers process workflows. |
| 🎨 **Design & UI/UX** | `ui-ux-pro-max`, Frontend Design, Emil Kowalski design/animation gateway, SVG & 2D asset pipelines, Design Systems. |
| ⚡ **Automation & Integrations** | 14 official n8n automation skills, custom scripts, webhook architectures. |
| 🛡️ **Security & QA** | Secure-by-default orchestrator, `release-readiness`, web quality audits, verification before completion. |
| 📝 **Productivity & Writing** | `i-have-adhd` style, Caveman writing, Humanizer, Claude-Mem connection guides. |
| 📈 **Marketing & WordPress** | 50+ marketing, SEO, conversion, and WordPress development workflows. |

---

## 📁 Repository Structure

```text
ZeroCoding/
├── AI_SETUP.md            # Universal agent bootstrap instructions for any project
├── AGENTS.md              # Agent gateway execution contract
├── agent-skill-bundle/    # Complete vault of 189+ curated agent skills
│   ├── creative/          # Video generation (code-motion-reel), animation, reels
│   ├── coding/            # Software architecture, refactoring, patterns
│   ├── design/            # UI/UX guidelines, design systems
│   ├── automation/        # n8n workflows and automation recipes
│   ├── security/          # Security auditors and verification gates
│   ├── qa/                # Test-driven development, browser verification
│   ├── scripts/           # Diagnostics (`skill_doctor.py`), setup CLI (`agent_init.py`)
│   └── adapters/          # Host adapters for Antigravity, Codex, Claude Code
└── docs/                  # Architectural guides & legacy platform documentation
```

---

## 🛠️ Diagnostics & Skill Search

ZeroCoding includes offline search tools that run without MCP or cloud dependencies:

```bash
# Search skills by topic or keyword
python agent-skill-bundle/scripts/skill_doctor.py search "motion reel"

# Run bundle diagnostics
python agent-skill-bundle/scripts/skill_doctor.py doctor
```

---

## 📜 Historical Note

Documentation for the legacy manga platform previously housed in this repository is preserved in [`docs/LEGACY_MANGA_APP.md`](docs/LEGACY_MANGA_APP.md).