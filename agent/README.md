# OPL Meta Agent Pack

Owner: `opl-meta-agent`
Purpose: `human_readable_agent_pack_index`
State: `active_support`
Machine boundary: 本文是人读入口。机器 locator 归 `contracts/capability_map.json` 与 `contracts/pack_compiler_input.json`；本文不作为 runtime、generated surface、owner receipt 或 target-domain authority。

Stable entrypoints:

- Primary Codex entry: `agent/primary_skill/SKILL.md`
- Workflow-level professional skills: `agent/professional_skills/README.md`
- Domain skill declarations: `agent/skills/README.md`
- Stage prompts: `agent/prompts/README.md`
- Knowledge, principles, quality gates, stages and tools: sibling README files under `agent/`

Boundary:

- `agent/professional_skills/*/SKILL.md` contains repo-local Codex-style professional methods.
- Active professional methods are workflow-level skills; legacy fine-grained entries are redirect/tombstone files only.
- No file under `agent/` authorizes target truth, memory body, artifact body, owner receipt body, typed blocker body, quality/export verdict, runtime queue, provider attempt, App state or default promotion.
