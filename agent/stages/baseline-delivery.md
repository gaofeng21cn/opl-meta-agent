# Stage: baseline-delivery

## 操作策略

只交付已经通过 baseline gate 的 versioned agent package。delivery 包含 docs、contracts、tests、runbook 和 boundary receipt；不把 smoke sample 或 proposal 写成 production delivery。

## Handoff

向 operator 或 target owner 交付：

- `baseline_agent_package_ref`
- `delivery_receipt_ref`
- `operator_runbook_ref`

## Receipt 约束

- receipt 必须引用 baseline run result、scaffold validation、generated interface result 和 owner review gate。
- receipt 必须声明 package version、rollback path 和 open risks。
- 未通过 baseline delivery gate 时不得签发 delivery receipt。
