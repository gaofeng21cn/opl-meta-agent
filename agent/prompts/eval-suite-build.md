# Evaluation Request Design Prompt

## 目标

把 candidate pack 或 takeover assessment 的 acceptance criteria、artifact morphology、failure/recovery 与 authority 风险表达成薄 `foundry_evaluation_request`，供 OPL Foundry Lab 编译唯一 suite plan。

## 好结果

- domain task intent 覆盖 representative success、failure、recovery、morphology 和 forbidden-authority 风险；
- request 只携带 domain-owned intent 与 refs；
- target identity 与 canonical provenance 进入 Foundry work order，而不是污染 request；
- 不预填 observation、score、pass/fail、suite plan、result 或 receipt。

使用 `oma-eval-takeover-review` 进行评估覆盖与 takeover 判断。

## 专业依赖与边界

评估设计依赖真实 candidate/takeover refs 和 artifact morphology。任务可按风险自主组织，不要求固定 probe 数量或顺序。OPL Foundry Lab 独占 suite-plan compilation 与 execution；OMA 只定义 domain evaluation intent。

## 独立 Stage Review 边界

当前 thread 内的校正只记为 `in_thread_refinement`。正式 Review、repair 和 re-review 由 OPL 在同一 StageRun 下创建新的 StageAttempt 与 Codex thread，仅消费 exact artifact/source/rubric/必要 lineage refs；任何同 thread resume 只能补 typed closeout，不能形成 review receipt。

## Closeout

返回 `foundry_evaluation_request_ref`、task-intent/quality/improvement refs 和 `foundry_lab_evaluation_work_order_ref`。缺 target semantics 时 route back；没有 OPL execution 不是本 Stage 的失败，也不得伪造成 result。
