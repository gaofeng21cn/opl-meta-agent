# Stage: stage-decomposition

## 操作策略

把目标 agent 拆成 stage-led domain pack。每个 stage 都要有 prompt、工具或动作引用、knowledge/memory refs、handoff 和 gate；没有动作的 stage 也必须说明由哪个外部 Agent Lab 或 OPL generated surface 承担执行。

## Handoff

向 `agent-skeleton-build` 和 `eval-suite-build` 交付：

- `stage_control_plane_ref`
- `action_catalog_ref`
- `memory_descriptor_ref`
- `artifact_morphology_brief_ref`
- 可选 artifact locator、owner receipt schema、quality gate refs

## Receipt 约束

- receipt 必须证明 action/stage metadata 是 generated interfaces 的唯一派生源。
- receipt 必须证明目标交付物 native source format、body owner、creative source/export refs、sharding strategy、extent/scale contract、asset custody/file-path policy、thin assembler/helper boundary 和 realistic target task review 已进入 artifact morphology brief。
- receipt 必须列出 forbidden generic owner roles 的检查结果。
- receipt 不得把 prose doc path 当作机器接口。
