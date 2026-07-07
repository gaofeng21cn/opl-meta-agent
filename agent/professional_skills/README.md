# OPL Meta Agent Professional Skills

Owner: `opl-meta-agent`
Purpose: `repo_local_codex_professional_skill_pack`
State: `active_support`
Machine boundary: 本文是人读索引。机器 locator 归 `contracts/capability_map.json` 与 `contracts/pack_compiler_input.json`；本文不作为 generated Skill surface、runtime tool contract 或 owner receipt。

本目录持有 repo-local Codex-style 专业方法技能。它们把 agent-building 专家判断从 stage prompts 和 domain skill declarations 中拆出，供 Codex 在对应 stage 内手工/显式调用。

`contracts/capability_map.json` 覆盖本目录 active workflow-level professional skills，并登记 legacy fine-grained redirect ledger。旧入口只保留 discovery 迁移路径，不再写成独立 authority、active capability 或物理 tombstone 文件。

Active workflow-level professional skills:

- `oma-agent-design-evolution/SKILL.md`
- `oma-stage-pack-intent-architecture/SKILL.md`
- `oma-eval-takeover-review/SKILL.md`
- `oma-work-order-hygiene/SKILL.md`

Legacy redirects:

- `legacy-professional-skill:oma-agent-evolution` -> `oma-agent-design-evolution/SKILL.md`
- `legacy-professional-skill:oma-trajectory-learning-analyst` -> `oma-agent-design-evolution/SKILL.md`
- `legacy-professional-skill:oma-intent-architect` -> `oma-stage-pack-intent-architecture/SKILL.md`
- `legacy-professional-skill:oma-external-pattern-researcher` -> `oma-stage-pack-intent-architecture/SKILL.md`
- `legacy-professional-skill:oma-stage-pack-architect` -> `oma-stage-pack-intent-architecture/SKILL.md`
- `legacy-professional-skill:oma-agent-lab-suite-designer` -> `oma-eval-takeover-review/SKILL.md`
- `legacy-professional-skill:oma-takeover-reviewer` -> `oma-eval-takeover-review/SKILL.md`
- `legacy-professional-skill:oma-work-order-author` -> `oma-work-order-hygiene/SKILL.md`
- `legacy-professional-skill:oma-script-to-pack-hygiene-reviewer` -> `oma-work-order-hygiene/SKILL.md`

Boundary:

- `agent/skills/*.md` declares domain skill surfaces that OPL generated interfaces may expose or consume.
- Active `agent/professional_skills/*/SKILL.md` carries workflow-level specialist methods used inside stage execution.
- Legacy redirect entries carry no independent authority, are not repo paths, and should not be used as new capability targets.
- Stage prompts own goals, routes, accepted refs, handoff shapes, and blocker enums.
- Professional skills do not create runtime wrappers, target artifacts, owner receipts, typed blockers, quality verdicts, promotion gate state, or target-domain authority.

Stability rule:

- Keep each repo-local professional method as `<skill-id>/SKILL.md` unless `contracts/capability_map.json`, pack compiler input, and the generated Codex carrier all prove an equivalent discovery surface.
- `method_skill` is an authority/capability classification, not a reason to flatten the file into `agent/skills/*.md`.
- If a professional method is demoted to a plain Markdown support file, treat it as a discovery regression unless the stage prompt no longer needs Codex-style Skill invocation.
