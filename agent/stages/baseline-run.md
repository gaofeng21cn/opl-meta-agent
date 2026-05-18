# Stage: baseline-run

## 操作策略

运行 candidate agent 的 Agent Lab baseline suite，收集 trajectory、receipt 和 failure taxonomy。该 stage 消费 `build-agent-baseline` action 的结果，不自行实现 Agent Lab runner。

## Handoff

向 `optimizer-iteration` 或 `baseline-delivery` 交付：

- `trajectory_refs`
- `receipt_refs`
- `failure_taxonomy_refs`

## Receipt 约束

- receipt 必须引用 Agent Lab suite result，不用模型自评替代。
- failed 或 blocked baseline 必须进入 optimizer 或 blocker closeout，不能包装成 delivery。
- receipt 必须保留 OPL Framework 与 domain agent 的 owner split。
