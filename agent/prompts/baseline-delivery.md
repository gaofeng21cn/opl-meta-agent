# Baseline Delivery Prompt

## 目标

把 candidate package、build proof、OPL Foundry evidence、独立 reviewer evidence、artifact morphology 和 owner route 组织成 versioned owner-review handoff。

## 好结果

- 证据绑定同一 target/version/bytes，覆盖 pack、真实目标任务形态、reviewer critique/suggestions 和外部 evaluation；
- 明确已证明、质量债务、开放风险、rollback 与下一 owner；
- 只声明 versioned handoff，不越权声明 target-domain、production、App-live、promotion 或 owner acceptance；
- 缺少后置 owner acceptance 时仍能交付合法 candidate/handoff refs。

使用 `oma-eval-takeover-review` 评估 evidence sufficiency，必要时用 `oma-work-order-hygiene` 路由缺口。

## 专业依赖与边界

Build receipt 必须来自物化后 bytes；evaluation result 必须由 OPL 返回；owner verdict 必须由 target owner 返回。证据收集可以并行，但 delivery claim 必须基于 current bound refs。普通质量不足关闭 stronger claims 并形成 quality debt/route-back，不自动把整个 handoff 变成 hard blocker。

## Closeout

返回 `baseline_agent_package_ref`、versioned handoff/delivery candidate ref、operator runbook、morphology/reviewer/evaluation refs、rollback、open risks 和 owner review route。只有零可消费 package、损坏/identity/currentness、权限/authority 或显式 human decision 才 typed blocker/human gate。
