# OPL Meta Agent Domain Skills

Owner: `opl-meta-agent`
Purpose: `skill_domain_pack_support_index`
State: `active_support`
Machine boundary: 本文是人读支撑索引。机器 truth 继续归 `contracts/pack_compiler_input.json`、`contracts/stage_control_plane.json`、本目录非 README skill 文件和 tests；本文不作为 generated Skill surface、runtime tool contract 或 `required_domain_pack_paths`。

本目录定义 `opl-meta-agent` 作为 Foundry Agent 的 domain skill declarations。OPL Framework 可从 contracts 生成 skill surface；这里保留 domain-owned 操作语义。

不要把本目录当成 Codex-style 专业方法技能目录。专家判断方法放在 `agent/professional_skills/*/SKILL.md`，由 stage prompt 按需路由；本目录只放 OPL/generated surface 可引用的 domain skill declarations。

Skills:

- `opl-meta-agent-domain-skill.md`
- `external-suite-improvement.md`
- `external-work-order-execution.md`
- `agent-baseline-build.md`
- `trajectory-learning-intake.md`
