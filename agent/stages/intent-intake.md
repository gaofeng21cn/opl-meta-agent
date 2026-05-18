# Stage: intent-intake

## 操作策略

先锁定目标 agent 的实际交付物、owner 边界和不可做事项，再允许进入调研或拆解。把模糊需求压缩成可测试的 baseline，而不是先生成大而全的 agent。

## Handoff

向 `web-experience-research` 和 `stage-decomposition` 交付：

- `intent_brief_ref`
- `acceptance_criteria_ref`
- `authority_boundary_ref`

## Receipt 约束

- receipt 必须记录用户确认或可追溯输入来源。
- receipt 必须声明 target domain owner、quality verdict owner、artifact authority 和 memory body owner。
- 如果 authority boundary 不清，receipt 标记 blocked，不进入 skeleton build。
