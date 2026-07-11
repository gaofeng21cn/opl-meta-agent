# OPL Meta Agent Pack

Owner: `opl-meta-agent`
Purpose: `human_readable_agent_pack_index`
State: `active_support`
Machine boundary: 本文是唯一顶层人读索引。机器 locator 归 `contracts/capability_map.json`、`contracts/pack_compiler_input.json` 与 `agent/stages/manifest.json`；本文不作为 machine-required pack path、runtime、generated surface、owner receipt 或 target-domain authority。

Entrypoints:

- Primary Codex skill: `primary_skill/SKILL.md`; plugin mirror: `../plugins/opl-meta-agent/skills/opl-meta-agent/SKILL.md`.
- Professional skill discovery: `professional_skills/README.md`; methods remain `professional_skills/*/SKILL.md`.
- Machine stage graph: `stages/manifest.json`; it binds stage policies, prompts, knowledge, quality gates and actions.
- Domain declarations and policies: `skills/*.md`, `principles/*.md`, `knowledge/*.md`, `quality_gates/*.md` and `tools/domain_affordances.md`.

No file under `agent/` authorizes target truth, memory or artifact bodies, owner receipt or typed blocker bodies, quality/export verdicts, runtime state, App state or default promotion.
