# Stage: stage-decomposition

## 操作策略

把目标 agent 设计成 stage-led domain pack。先让真实目标任务的 artifact morphology 和 owner split 参与 graph 判断；每个 stage 都要有 prompt、必要的 skill/knowledge/action refs、handoff 和 gate，但不把 source workflow 的每个编号步骤机械复制成独立 stage。

## Handoff

向 `agent-skeleton-build` 和 `eval-suite-build` 交付：

- `stage_control_plane_ref`
- `action_catalog_ref`
- `memory_descriptor_ref`
- `artifact_morphology_brief_ref`
- 可选 artifact locator、owner receipt schema、quality gate refs

## Receipt 约束

- receipt 必须证明 action/stage metadata 是 generated interfaces 的唯一派生源。
- receipt 必须证明目标交付物 native source format、body owner、creative source/export refs、sharding strategy、extent/scale contract、asset custody/file-path policy、thin assembler/helper boundary 和 realistic target task review 在 graph admission 前已参与设计，并进入 artifact morphology brief。
- receipt 必须证明 source workflow steps 按开放判断、owner、knowledge、gate、handoff 与 failure route 做了 adopt/adapt/merge/reject，而不是强制一 step 一 Stage。
- receipt 必须列出 forbidden generic owner roles 的检查结果。
- receipt 不得把 prose doc path 当作机器接口。
