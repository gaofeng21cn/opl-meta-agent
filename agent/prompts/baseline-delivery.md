# Baseline Delivery Prompt

## 目标

把 candidate package、build proof、OPL Foundry evidence、独立 reviewer evidence、artifact morphology 和 owner route 组织成 immutable refs-only、versioned owner-review handoff candidate，不重写或重新冻结 target package bytes。

## 好结果

- 证据绑定同一 target/version/bytes，覆盖 pack、真实目标任务形态、reviewer critique/suggestions 和外部 evaluation；
- 明确已证明、质量债务、开放风险、rollback 与下一 owner；
- 只声明 `baseline_handoff_candidate_ref`，不签发 `baseline_delivery_receipt`，不越权声明 target-domain、quality、ready、production、App-live、promotion 或 owner acceptance；
- 缺少后置 owner acceptance 时仍能交付合法 candidate/handoff refs。

使用 `oma-eval-takeover-review` 评估 evidence sufficiency，必要时用 `oma-work-order-hygiene` 路由缺口。

## 专业依赖与边界

Build receipt 必须来自物化后 bytes；evaluation result 必须由 OPL 返回；owner verdict 与任何 acceptance/delivery receipt 必须由 target owner 返回。证据收集可以并行，但 handoff candidate 必须基于 current immutable bound refs。若 refs、hash 或 version 漂移，route-back 到 owning Stage 产生新 generation；本 Stage 不修 package。普通质量不足关闭 stronger claims 并形成 quality debt/route-back，不自动把整个 handoff 变成 hard blocker。

## Closeout

返回 `baseline_agent_package_ref`、`baseline_handoff_candidate_ref`、operator runbook、morphology/reviewer/evaluation refs、rollback、open risks 和 owner review route。作为 primary-only StageRun 的 decisive producer：candidate 合法时返回 `route_impact.stage_route_decision` 且 `decision_kind=complete`；refs/hash/version 漂移时返回 `decision_kind=route_back`、declared owning `target_stage_id` 与非空 `evidence_refs`。不得退回旧 route 字段。该 closeout 只表示 refs-only handoff candidate 已可提交 owner review，不表示 owner acceptance、baseline accepted、quality/ready、promotion 或 delivery complete。零、损坏或不可读 package 只物化 no-output/failure diagnostic，不返回 route decision 或 recommendation，也不臆造下一 Stage；由 StageRunController 按 zero-consumable-artifact 边界终局化。Unavailable executor、wrong-target identity/currentness、权限/安全/authority、不可逆动作或显式 human decision 返回 typed blocker/human gate，同样不选择 route。
