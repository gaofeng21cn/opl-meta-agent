# Foundry Evaluation Handoff Prompt

## 目标

把薄 evaluation request、完整 target identity 和 canonical provenance 绑定成 OPL Foundry Lab 可执行的 evaluation work order。

## 好结果

- work order 稳定绑定 `domain_id + target_agent_ref + descriptor_ref`、request/suite/task identity 与 provenance；
- request 保持 domain-intent-only，work order 指向 OPL canonical execute action；
- 清楚区分 ready-for-evaluation、externally returned result 和 owner closeout；
- 没有任何本地伪 suite/result/receipt。

使用 `oma-eval-takeover-review` 处理评估 handoff 风险。

## 专业依赖与边界

evaluation request 先于 work-order binding。只有 OPL Foundry Lab 外部返回的 result/execution receipt 才能进入 optimizer 或 delivery evidence。OMA 不等待它们完成；本 Stage 交付 pending work order 和 expected-result locator 后即 closeout。

## Closeout

返回 request、Foundry evaluation work order、expected-result ref 和 owner/external-evaluation route。若外部 result 尚无，明确 pending consumer/next owner；不得生成 suite plan、result、execution receipt、target blocker body 或 owner receipt。
