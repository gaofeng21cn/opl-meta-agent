# Stage Decomposition Prompt

## 目标

把已选设计依据转成 admitted target Agent Pack plan，使 Stage graph、专业能力、artifact morphology、owner boundary 和 handoff 能共同支撑真实目标任务。

## 好结果

- 在设计 graph 前就理解真实交付物的 native source、body owner、creative/export split、规模、分片、资产 custody、assembler/helper 边界和 representative task；
- 从一开始让 owner split 贯穿 Stage、prompt、skill、gate、artifact 和 closeout，而不是最后补字段；
- 一个 top-level Stage 承担一个主要开放语义判断；只有 owner、知识源、quality gate、handoff 或失败路由真正不同才拆 Stage；
- source/research patterns 被保真迁移并有 adopt/adapt/merge/reject 解释，但 source workflow step 不会仅因原文编号而机械升级成独立 Stage；
- deterministic generation、validation、projection 和 receipt repair 留在相应 Stage 内；
- 产出可物化、可评估、可 route-back 的 plan，而不是模板化 generic graph。

使用 `oma-stage-pack-intent-architecture` 进行 Stage graph、artifact morphology 和 no-forbidden-write 判断。

## 专业依赖与边界

Source-derived 路线必须从安全解析、source-anchor 支撑的内容进入 OMA design objects；research-driven 路线必须有可追溯 synthesis。设计依据、transfer mapping、pack plan、admission 和 morphology 会相互校正，模型可自主迭代；但 source evidence 与 safe packet 必须先于其 claim，design admission 必须先于 target-pack materialization，build receipt 只能证明物化后的 bytes。

保留 `ReferenceDesignPacket` 或 `ResearchSynthesisPacket`、`TransferMap`、`AgentPackPlan`、`DesignAdmissionReceipt`、`StageDecompositionSubpacketSet` 和 artifact morphology refs 的可追溯边界；`StageDecompositionSubpacketSet` 记录这些设计对象与 admission/build boundary，不再规定固定认知子包执行顺序。

不导入外部 runtime/domain verdict，不用 schema 代替 Stage 语义设计，不要求每个 source workflow step 独立成 Stage。

## 独立 Stage Review 边界

当前 thread 内的校正只记为 `in_thread_refinement`。正式 Review、repair 和 re-review 由 OPL 在同一 StageRun 下创建新的 StageAttempt 与 Codex thread，仅消费 exact artifact/source/rubric/必要 lineage refs；任何同 thread resume 只能补 typed closeout，不能形成 review receipt。

## Closeout

返回 admitted `AgentPackPlan`、Stage graph、action/skill/knowledge/gate/memory/artifact refs、artifact morphology brief、owner/authority map、pattern dispositions 和 `StageDecompositionSubpacketSet`。普通缺口记质量债务与 route-back；零、损坏或不可读设计物化为 no-output/failure diagnostic，仍可进入任一 declared stage。只有 unavailable executor、unsafe source access、authority/permission、wrong-target identity/currentness、不可逆动作或显式 owner/human 决策才 typed blocker/human gate。
