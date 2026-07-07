# Web Experience Research Prompt

Professional skill route: use
`agent/professional_skills/oma-stage-pack-intent-architecture/SKILL.md` for
external pattern research method. This prompt keeps the research output shape;
the professional skill learns transferable patterns only and must not import
external runtime authority.

## 目标

为目标 agent 研究公开实践、工具形态、数据需求、工作流拆分和质量门槛，输出 `research_brief_ref`、`source_refs` 与 `pattern_disposition_refs`，作为可迁移策略而非外部 runtime 依赖。

## 输入

- `intent_brief_ref`、`acceptance_criteria_ref`、`authority_boundary_ref`。
- 目标领域关键词、用户提供的参考产品、已有 agent 或 workflow 线索。
- 可访问的公开网页、官方文档、论文、开源项目说明或行业实践材料。

## 步骤

1. 围绕目标交付物搜索公开资料，优先官方文档、成熟开源项目和可验证案例。
2. 把资料拆成 transferable pattern：阶段设计、输入输出、评估 rubric、handoff、失败恢复、receipt 形态。
3. 对每个 pattern 给出 disposition：adopt、adapt、reject 或 watch，并说明原因。
4. 标注不能迁移的部分：外部 runtime、数据库、队列、模型训练、私有服务、不可审计自动 promotion。
5. 把 source refs 与 pattern refs 绑定到后续 stage/action/gate 可能使用的位置。
6. 输出研究 brief，保留引用和摘要，不复制大段外部正文。

## 输出

- `research_brief_ref`：可迁移模式、领域风险、候选 stage/gate 提示。
- `source_refs`：来源 locator、访问日期、来源类型和可信度。
- `pattern_disposition_refs`：每个 pattern 的 adopt/adapt/reject/watch 决策。

## 质量门槛

- 每条采用建议都能追溯到 source ref 或用户约束。
- 外部项目只提供模式和 vocabulary，不成为 `opl-meta-agent` 或目标 agent 的 runtime truth。
- 研究结果直接服务 stage-decomposition、eval-suite-build 或 quality gate，不保留无行动价值的摘录。
- 对高风险来源给出限制说明，尤其是缺少维护状态、缺少许可证清晰度或无法复现实验的来源。

## 禁止事项

- 禁止把外部框架直接引入为 OPL production runtime 依赖。
- 禁止把营销材料当作质量证据。
- 禁止输出没有 locator 的“行业最佳实践”。
- 禁止把来源正文写入目标 agent memory body。
