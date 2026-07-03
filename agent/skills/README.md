# OPL Meta Agent Skills

Owner: `opl-meta-agent`
Purpose: `skill_domain_pack_support_index`
State: `active_support`
Machine boundary: 本文是人读支撑索引。机器 truth 继续归 `contracts/pack_compiler_input.json`、`contracts/stage_control_plane.json`、本目录非 README skill 文件和 tests；本文不作为 generated Skill surface、runtime tool contract 或 `required_domain_pack_paths`。

本目录定义 `opl-meta-agent` 作为 Foundry Agent 的 domain skill 使用说明。OPL Framework 可从 contracts 生成 skill surface；这里保留 domain-owned 操作语义。

Repo-local professional skill pack:

- `../professional_skills/oma-intent-architect/SKILL.md`
- `../professional_skills/oma-external-pattern-researcher/SKILL.md`
- `../professional_skills/oma-stage-pack-architect/SKILL.md`
- `../professional_skills/oma-agent-lab-suite-designer/SKILL.md`
- `../professional_skills/oma-takeover-reviewer/SKILL.md`
- `../professional_skills/oma-work-order-author/SKILL.md`
- `../professional_skills/oma-trajectory-learning-analyst/SKILL.md`

These are Codex-style professional method skills. They route expertise out of
stage prompts and domain policy prose, but they do not become machine truth,
generated OPL Skill surfaces, runtime wrappers, target artifacts, owner
receipts, typed blockers, or promotion gate state. OMA/OPL/target-owner
authority boundaries stay unchanged.

Skills:

- `opl-meta-agent-domain-skill.md`
- `external-suite-improvement.md`
- `external-work-order-execution.md`
- `agent-baseline-build.md`
- `trajectory-learning-intake.md`
