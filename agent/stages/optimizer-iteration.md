# Stage: optimizer-iteration

## 操作策略

基于 Agent Lab evidence 生成并执行受 gate 的目标 agent 改进。允许在明确 owner gate 下修改目标 agent source、tests、docs；所有改动必须有 failure ref 和 regression proof。

执行阶段由 OPL Agent Lab `execute-work-order` 承接。OMA 只把 `developer_patch_work_order_ref` 薄委托给 OPL，不实现 generic runner、target worktree lifecycle、queue、attempt ledger、absorb、cleanup 或 target owner closeout hook 调用。

## Handoff

向 `baseline-run`、`baseline-delivery`、`online-learning` 或 target owner review 交付：

- `improvement_candidate_refs`
- `target_capability_improvement_candidate_refs`
- `mechanism_patch_proposal_refs`
- `developer_patch_work_order_refs`
- `external_work_order_execution_delegation_refs`
- `target_agent_version_receipt_refs`
- `target_owner_closeout_hook_delegation_refs`
- `candidate_branch_refs`
- `regression_result_refs`

## Receipt 约束

- receipt 必须包含 patch traceability matrix。
- receipt 必须包含 runtime/read-model consumption verification when relevant。
- receipt 必须记录 target owner patch gate、version absorb gate 和 cleanup state。
- execution delegation receipt 必须声明 OMA 不拥有 target worktree lifecycle，且不写 target truth、memory body、artifact body、quality/export verdict 或 owner receipt body。
- target owner closeout hook 如存在，必须由 OPL 在 absorb 后调用 target-domain owner action；OMA 只能记录 hook delegated proof 和 no-owner-receipt-write proof。
