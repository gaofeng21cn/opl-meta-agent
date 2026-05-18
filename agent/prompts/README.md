# OPL Meta Agent Prompts

本目录是 `contracts/stage_control_plane.json` 中 `prompt_refs` 的 domain-owned prompt body。OPL Framework 可以投影这些 locator，但不能复制、改写或替代本仓的 agent-building domain semantics。

覆盖的 prompt refs：

- `agent/prompts/intent-intake.md`
- `agent/prompts/web-experience-research.md`
- `agent/prompts/stage-decomposition.md`
- `agent/prompts/agent-skeleton-build.md`
- `agent/prompts/eval-suite-build.md`
- `agent/prompts/external-agent-takeover.md`
- `agent/prompts/optimizer-iteration.md`
- `agent/prompts/online-learning.md`

`baseline-run` 与 `baseline-delivery` 当前没有 prompt ref；它们的操作策略放在 `agent/stages/`，质量判定放在 `agent/quality_gates/`。
