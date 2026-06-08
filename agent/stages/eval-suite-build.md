# Stage: eval-suite-build

## 操作策略

把 acceptance criteria 和 authority boundary 变成 Agent Lab suite。suite 覆盖正常路径、恢复探针、scorecard 和 promotion gate，全部通过 refs 连接目标 agent，不复制目标领域正文。

## Handoff

向 `baseline-run`、`target-agent-takeover` 或 `optimizer-iteration` 交付：

- `agent_lab_task_manifest_refs`
- `scorecard_refs`
- `promotion_gate_refs`
- external target 时的 `agent_lab_external_suite_ref`

## Receipt 约束

- receipt 必须列出 suite version、target agent refs、expected receipts 和 forbidden writes。
- blocked suite 必须输出 blocker taxonomy。
- promotion gate 不能省略 owner review。
