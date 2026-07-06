# OPL Meta Agent Professional Skills

Owner: `opl-meta-agent`
Purpose: `repo_local_codex_professional_skill_pack`
State: `active_support`
Machine boundary: 本文是人读索引。机器 locator 归 `contracts/capability_map.json` 与 `contracts/pack_compiler_input.json`；本文不作为 generated Skill surface、runtime tool contract 或 owner receipt。

本目录持有 repo-local Codex-style 专业方法技能。它们把 agent-building 专家判断从 stage prompts 和 domain skill declarations 中拆出，供 Codex 在对应 stage 内手工/显式调用。

Professional skills:

- `oma-intent-architect/SKILL.md`
- `oma-external-pattern-researcher/SKILL.md`
- `oma-stage-pack-architect/SKILL.md`
- `oma-agent-lab-suite-designer/SKILL.md`
- `oma-takeover-reviewer/SKILL.md`
- `oma-work-order-author/SKILL.md`
- `oma-agent-evolution/SKILL.md`
- `oma-trajectory-learning-analyst/SKILL.md`

Boundary:

- `agent/skills/*.md` declares domain skill surfaces that OPL generated interfaces may expose or consume.
- `agent/professional_skills/*/SKILL.md` carries specialist methods used inside stage execution.
- Stage prompts own goals, routes, accepted refs, handoff shapes, and blocker enums.
- Professional skills do not create runtime wrappers, target artifacts, owner receipts, typed blockers, quality verdicts, promotion gate state, or target-domain authority.
