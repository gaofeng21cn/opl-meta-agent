# Stage: baseline-run

## 操作策略

把 candidate Agent Pack、AgentBuildReceipt 和 reviewer evidence 编译成 evaluation semantics 与 canonical work-order materialization request。该 stage 不分配 work-order identity，不实现 Agent Lab runner、suite-plan compiler，也不物化 hosted result/receipt ledger。

## Handoff

向 OPL Foundry Lab 或后续 `improve:external-suite` 交付：

- `foundry_evaluation_request_ref`
- `foundry_lab_evaluation_work_order_ref`
- `expected_evaluation_result_ref`
- target-owner route and external-evaluation refs required by `baseline-delivery`; these are work-order / route refs, not a fabricated evaluation result or owner verdict.

## Receipt 约束

- AgentBuildReceipt 只证明 Agent Pack 构建与 conformance，不是 target owner receipt。
- suite result、Foundry execution receipt 和 promotion refs 必须由 OPL evaluation-work-order execution 返回。
- 缺外部 result 时保持 pending/blocker route，不得由 OMA 自填后包装成 delivery。
