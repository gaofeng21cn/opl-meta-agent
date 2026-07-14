# Stage: target-agent-takeover

## 操作策略

读取既有 OPL-compatible target agent 的 descriptor/contracts 与 independent reviewer evidence，生成 takeover semantic request、canonical work-order materialization request 和 proposal-only candidate refs。OMA 不分配 work-order identity、不执行 suite，也不签 takeover/owner receipt。

## Handoff

向 OPL Foundry Lab 或 owner review 交付：

- `work_order_materialization_request_ref`
- `gated_self_evolution_candidate_ref`
- `mechanism_candidate_ref`
- `candidate_pack_or_takeover_assessment_ready`

## Receipt 约束

- work order 必须保留 target owner authority、canonical OPL execution owner/action 与完整 target identity。
- OMA 禁止写 target memory body、artifact body、quality verdict、Agent Lab result、owner receipt 和 default promotion。
- 外部 result 缺失时只能保持 evaluation pending 或返回合法 blocker ref。
