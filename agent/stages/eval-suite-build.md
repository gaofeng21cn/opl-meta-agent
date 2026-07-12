# Stage: eval-suite-build

## 操作策略

把 acceptance criteria、artifact morphology 和 authority boundary 变成薄 Foundry evaluation request。OPL Foundry Lab 是唯一 suite-plan compiler 和 executor；OMA 不在本 Stage 生成 suite plan、scorecard observations、result 或 receipt。

## Handoff

向 `baseline-run`、`target-agent-takeover` 或 `optimizer-iteration` 交付：

- `foundry_evaluation_request_ref`
- domain task-intent / quality-gate / improvement refs
- `foundry_lab_evaluation_work_order_ref`

## Receipt 约束

- request 只携带 domain task intent 与 refs，target identity 进入 work order。
- receipt 不得包含 suite plan、observations、pass/fail、gate status 或 hosted ledger body。
- OPL execution 尚未发生时返回 pending work-order route，不等待、不伪造 result。
