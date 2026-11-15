---
name: canvas-ui-reference
description: "Find and evaluate Canvas UI effects and WebGL/canvas components when the user explicitly requests this library."
---

# Canvas UI: canonical source integration

Author/source: https://github.com/DavidHDev/canvas-ui
Reviewed upstream revision: `a0be3b7e1f42d0d1bafde470b6794b39f6729502` (2026-11-15).

Canvas UI is a component library, not a portable Agent Skill. Its MIT + Commons Clause license restricts redistribution of standalone components; ZeroCoding must not mirror its code or assets. Evaluate mobile GPU, reduced-motion preference, fallbacks and accessibility before integration in an authorized target application.

## On-demand workflow

1. Use this guidance only when a task requests Canvas UI or clearly requires its specialized features, not for generic UI work.
2. Inspect the target project and open the canonical upstream README and relevant docs for the exact requested feature.
3. Explain required dependencies, license boundaries, performance costs and alternatives before integrating.
4. Only when the project task authorizes integration, follow the upstream documentation in **the target project**, not in the ZeroCoding skill vault.
5. Check visual result, mobile support, accessibility, performance and license compliance. Report what actually happened.

**Distribution:** ZeroCoding-original reference only. No third-party executable, component code, assets, plugin or application is included or installed.
