---
name: open-design-reference
description: "Use the external Open Design app when the user explicitly needs design creation or editing workflows. This is a full application, not an Agent Skill."
---

# Open Design: canonical source integration

Author/source: https://github.com/nexu-io/open-design
Reviewed upstream revision: `59e4f2ae85de7e7318a5e6bdcf3a34584c4b7582` (2026-11-15).

Open Design is a full application, not an installable Agent Skill. Read upstream README and QUICKSTART when the user actually requests this tool. Do not install its desktop client, daemon, plugins, databases, services, or external dependencies during ZeroCoding setup.

## On-demand workflow

1. Use this guidance only when a task requests Open Design or clearly requires its specialized features, not for generic UI work.
2. Inspect the target project and open the canonical upstream README and relevant docs for the exact requested feature.
3. Explain required dependencies, license boundaries, performance costs and alternatives before integrating.
4. Only when the project task authorizes integration, follow the upstream documentation in **the target project**, not in the ZeroCoding skill vault.
5. Check visual result, mobile support, accessibility, performance and license compliance. Report what actually happened.

**Distribution:** ZeroCoding-original reference only. No third-party executable, component code, assets, plugin or application is included or installed.
