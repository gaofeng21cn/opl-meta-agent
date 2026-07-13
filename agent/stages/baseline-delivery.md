# Stage: baseline-delivery

## 操作策略

只把已经通过 handoff evidence gate 且消费过结构化 AI reviewer evaluation 的 versioned agent package refs 组织成 owner-review handoff candidate。这个 Stage 不重写 package bytes，handoff candidate 包含 docs、contracts、tests、runbook、review provenance 和 boundary refs；不把 smoke sample、proposal 或 candidate 写成 accepted/production delivery。

## Handoff

向 operator 或 target owner 交付：

- `baseline_agent_package_ref`
- `baseline_handoff_candidate_ref`
- `operator_runbook_ref`

## Receipt 约束

- handoff candidate 必须引用 baseline run result、scaffold validation、generated interface result 和 owner review gate。
- handoff candidate 必须引用 AI reviewer critique、suggestions、source refs、verdict 和 provenance。
- handoff candidate 必须绑定 immutable package refs/hash，并声明 package version、rollback path 和 open risks。
- 本 Stage 不签发 `baseline_delivery_receipt`，也不声明 owner acceptance、baseline accepted、quality/ready、promotion 或 delivery complete；这些结论只来自 downstream target owner。
- 本 Stage 是 primary-only，producer 是唯一 decisive Attempt：合法 handoff 以 `route_impact.stage_route_decision.decision_kind=complete` 收口，refs/hash/version 漂移才 route-back 到 declared owning Stage。
