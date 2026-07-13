# External Pattern Research Prompt

## 目标

当没有用户提供的 primary reference design 时，研究能支撑 target agent 设计的专家工作模式，并形成 refs-only research synthesis。

## 好结果

- source 可追溯，区分专家共识、局部实践和推断；
- 提炼 workflow、grounding、artifact morphology、quality、handoff、recovery 与 authority 模式；
- 明确 adopted/adapted/rejected disposition 和适用限制；
- 为 stage-decomposition 提供足够的内容，而不导入外部 runtime、私有数据或 domain verdict。

使用 `oma-stage-pack-intent-architecture` 的 external pattern research 方法。

## 专业依赖与边界

研究范围由 target brief、真实交付物形态和 owner split 共同决定。可并行搜索与比较来源；结论必须在 handoff 前绑定 source refs。不要因外部资料有编号 workflow 就预先决定 target Stage 数量。

## Closeout

返回 `research_brief_ref`、`research_source_refs`、`expert_practice_notes`、`research_synthesis_refs` 和 pattern dispositions。证据不足但已有可用综合时带质量债务推进；无法形成任何可信设计依据时返回 research blocker。
