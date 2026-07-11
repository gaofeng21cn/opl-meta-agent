# OPL Meta Agent Stages

Owner: `opl-meta-agent`
Purpose: `stage_domain_pack_support_index`
State: `active_support`
Machine boundary: 本文是人读支撑索引。OPL Pack 的机器 stage source 是 `agent/stages/manifest.json`，并引用本目录非 README stage policy、prompt、knowledge 与 quality-gate 文件；hosted `family_stage_control_plane` 由 OPL Framework 从该 manifest 编译。本文不作为 stage attempt ledger、runtime receipt 或 `required_domain_pack_paths`。

本目录定义 `opl-meta-agent` 的 stage 操作策略、handoff 和 receipt 约束。`manifest.json` 是 domain-owned declarative graph；OPL Pack 从它编译 hosted `family_stage_control_plane`。

Stage files:

- `intent-intake.md`
- `web-experience-research.md`
- `stage-decomposition.md`
- `agent-skeleton-build.md`
- `eval-suite-build.md`
- `baseline-run.md`
- `target-agent-takeover.md`
- `optimizer-iteration.md`
- `baseline-delivery.md`
- `online-learning.md`
- `trajectory-learning-intake.md`
