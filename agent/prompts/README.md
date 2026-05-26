# OPL Meta Agent Prompts

Owner: `opl-meta-agent`
Purpose: `prompt_domain_pack_support_index`
State: `active_support`
Machine boundary: 本文是人读支撑索引。机器 truth 继续归 `contracts/stage_control_plane.json`、`contracts/pack_compiler_input.json`、本目录非 README prompt 文件和 tests；本文不作为 `prompt_refs` 或 `required_domain_pack_paths`。

本目录是 `contracts/stage_control_plane.json` 中 `prompt_refs` 的 domain-owned prompt body。OPL Framework 可以投影这些 locator，但不能复制、改写或替代本仓的 agent-building domain semantics。

覆盖的 prompt refs：

- `agent/prompts/intent-intake.md`
- `agent/prompts/web-experience-research.md`
- `agent/prompts/stage-decomposition.md`
- `agent/prompts/agent-skeleton-build.md`
- `agent/prompts/eval-suite-build.md`
- `agent/prompts/baseline-run.md`
- `agent/prompts/external-agent-takeover.md`
- `agent/prompts/optimizer-iteration.md`
- `agent/prompts/baseline-delivery.md`
- `agent/prompts/online-learning.md`
- `agent/prompts/trajectory-learning-intake.md`
