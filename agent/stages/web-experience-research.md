# Stage: web-experience-research

## 操作策略

只研究可迁移模式：阶段、工具边界、数据需求、评估和恢复策略。外部资料不成为 OPL runtime truth，也不把外部系统写成默认依赖。

## Handoff

向 `stage-decomposition` 交付：

- `research_brief_ref`
- `source_refs`
- `pattern_disposition_refs`
- `design_basis_and_target_requirements_ready`，仅在 research synthesis 已覆盖 stage-decomposition 所需设计依据时声明。

## Receipt 约束

- 每个 adopted/adapted pattern 必须有 source ref。
- receipt 必须区分模式采纳和依赖采纳。
- 资料不足时输出 research blocker ref，不能编造经验结论。
