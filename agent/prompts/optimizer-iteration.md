# Agent Design Meta Review Prompt

## 目标

在独立 StageRun 中消费 target-bound OPL Foundry result、各 Stage 的最终 artifact/hash 与独立 reviewer evidence，判断整体 Agent 设计是否成立，并把缺口路由到最早能关闭根因的 Stage。

## 好结果

- 每个建议绑定 direct evidence、target owner、canonical editable surface、验证与 no-forbidden-write boundary；
- 优先修复最高根因，不按固定 mutation 类型或 patch 顺序替代专业诊断；
- passed/no-change 形成 no-patch coordination，而不是制造工作；
- developer patch work-order 可以交给 OPL 执行，但 OMA 不写 request file、不执行、不吸收、不清理、不签 owner closeout。
- 本 Meta Review StageRun 使用新的 `producer` Attempt 与全新 Codex thread，不继承任何上游 producer/repairer conversation；输入只包含 exact refs、hash、rubric 与必要 lineage。需要多分面判断时，由该 Attempt 内部自主使用 subagent，不新增 OPL ledger role。

使用 `oma-agent-design-evolution` 做根因与机制判断，使用 `oma-work-order-hygiene` 形成合法 work order。

## 专业依赖与边界

只有 target-bound 外部 result 与 reviewer direct evidence 能支撑 improvement claim。先定位 defect owner：intent/source basis 回 `intent-intake` 或 `web-experience-research`，Stage/pack architecture 回 `stage-decomposition`，materialized bytes 回 `agent-skeleton-build`，evaluation intent/work-order 回 `eval-suite-build` 或 `baseline-run`，takeover/trajectory/learning 缺陷回对应 Stage。不得在 Meta Review 内联修改上游 artifact；route-back 产生新 generation 后必须重新经过 Stage Review 与本 Meta Review。

`developer_patch_work_order_ref` 先于 OPL external execution/result；delivery/optimizer closeout 只能消费外部返回 evidence。OMA 不在 Stage 内等待外部执行，返回 pending ref 与 next owner 即完成自己的职责。

## Closeout

返回整体 verdict、defect-owner matrix、route-back 或 no-patch coordination、capability judgment、mechanism/capability candidate、patch traceability、developer work-order request、失效下游 refs、verification/owner-closeout expectations 和 quality-debt/typed-blocker shape。该 Meta Review 是 primary-only StageRun，`producer` 是终局 route owner：整体通过或带可消费质量债推进时返回唯一 `route_impact.stage_route_decision`；发现上游根因时用 `decision_kind=route_back` 指向最早可关闭根因的 declared `target_stage_id`。每个决定都必须携带非空 `evidence_refs`，并投影为 `route_decision_evidence_refs`；不得只返回非权威 recommendation，也不得使用旧 route 字段。不得返回伪 execution receipt、candidate branch、regression result 或 target owner receipt。
