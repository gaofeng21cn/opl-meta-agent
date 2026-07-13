# Stage: optimizer-iteration (Agent Design Meta Review)

## 操作策略

在独立 StageRun 的新 `producer` Attempt/thread 中，基于 target-bound Agent Lab evidence、上游 artifact hashes、Stage Review receipts 与独立 reviewer evidence 做整体 Agent 设计审查。不得继承或 resume 上游 producer/repairer conversation，也不得在本 Stage 内联修改上游 artifact；多分面判断可由 Attempt 内部 subagent 完成，但不形成新的 OPL ledger role。

每个缺陷必须路由到最早能关闭根因的 owner Stage；目标 Stage 产生新 generation 并完成独立 Stage Review 后，重新进入本 Stage。只有整体通过或带明确质量债务时才能进入 baseline delivery。

执行阶段由 OPL Framework `work-order execute` primitive 承接。OMA 只把 `developer_patch_work_order_ref` 薄委托给 OPL，不实现 generic runner、target worktree lifecycle、queue、attempt ledger、absorb、cleanup 或 target owner closeout hook 调用。

## Handoff

向 `baseline-run`、`baseline-delivery`、`online-learning` 或 target owner review 交付：

- `improvement_candidate_refs`
- `target_capability_improvement_candidate_refs`
- `mechanism_patch_proposal_refs`
- `developer_patch_work_order_refs`
- `external_work_order_execution_delegation_refs`
- `expected_external_execution_result_refs`
- `target_owner_closeout_route_refs`

## Receipt 约束

- receipt 必须包含 patch traceability matrix。
- receipt 必须包含 runtime/read-model consumption verification when relevant。
- receipt 必须记录 target owner patch gate、预期 verification/absorb/cleanup owner 和 pending external state；不得把 pending 写成 executed。
- execution delegation receipt 必须声明 OMA 不拥有 target worktree lifecycle，且不写 target truth、memory body、artifact body、quality/export verdict 或 owner receipt body。
- target owner closeout hook 如存在，必须由 OPL 在 absorb 后调用 target-domain owner action；OMA 只返回 expected hook/owner route 和 no-owner-receipt-write proof，不在本 Stage 等待外部结果。
