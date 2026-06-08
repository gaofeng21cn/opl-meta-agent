# Stage: target-agent-takeover

## 操作策略

读取既有 OPL-compatible agent 的 descriptor/contracts，接管测试编排和自进化候选组织。接管范围只包括 suite、receipt、candidate 和 proposal，不接管目标领域权威。

## Handoff

向 `optimizer-iteration` 或 owner review 交付：

- `agent_lab_external_suite_ref`
- `testing_takeover_receipt_ref`
- `gated_self_evolution_candidate_ref`
- `mechanism_patch_proposal_ref`

## Receipt 约束

- receipt 必须声明 target owner authority preserved。
- receipt 必须声明禁止写 target memory body、artifact body、quality verdict 和 default promotion。
- takeover blocker 必须标注为合同缺失、运行缺失、环境缺失或 gate 缺失。
