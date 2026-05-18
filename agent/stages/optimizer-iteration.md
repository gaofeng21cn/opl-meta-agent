# Stage: optimizer-iteration

## 操作策略

基于 Agent Lab evidence 生成并执行受 gate 的目标 agent 改进。允许在明确 owner gate 下修改目标 agent source、tests、docs；所有改动必须有 failure ref 和 regression proof。

## Handoff

向 `baseline-run`、`baseline-delivery`、`online-learning` 或 target owner review 交付：

- `improvement_candidate_refs`
- `target_capability_improvement_candidate_refs`
- `mechanism_patch_proposal_refs`
- `developer_patch_work_order_refs`
- `target_agent_version_receipt_refs`
- `candidate_branch_refs`
- `regression_result_refs`

## Receipt 约束

- receipt 必须包含 patch traceability matrix。
- receipt 必须包含 runtime/read-model consumption verification when relevant。
- receipt 必须记录 target owner patch gate、version absorb gate 和 cleanup state。
