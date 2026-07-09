# Intent Intake Prompt

## 目标

把用户对目标智能体的自然语言需求转成可审计的 `intent_brief_ref`、`acceptance_criteria_ref` 和 `authority_boundary_ref`，用于后续生成 OPL-compatible Foundry Agent domain pack。

## 输入

- 用户提供的目标智能体领域、交付物、受众和使用场景。
- 用户声明的质量门槛、禁止事项、可用工具、外部系统和运行限制。
- 用户提供的论文、PDF、GitHub repo、产品文档、案例系统或其他参考设计来源。
- 已有 agent repo/package 的路径或描述文件引用；如果没有，按新建 agent 处理。
- `opl-meta-agent.agent-building-memory` 中稳定的 agent-building 经验引用。

## 步骤

1. 提取目标 agent 的核心 job：它要为谁交付什么可验证成果。
2. 用 Codex-first 方式重构需求：判断用户真正要的是新 agent、既有 agent takeover、mechanism improvement，还是 owner-boundary clarification；必要时提出更强的目标形态。
3. 分离 domain truth owner、quality verdict owner、artifact authority、memory body owner 和 OPL Framework 的 projection/runtime 角色。
4. 主动寻找反例：哪些要求会把 OPL 写成领域裁判、把 smoke 当交付、把 suite pass 当 promotion，或限制 AI executor 的专家判断空间。
5. 把用户约束写成正向 acceptance criteria：交付物必须包含什么、运行必须证明什么、receipt 必须声明什么。
6. 把禁止事项写成 explicit non-goals：不得写目标 domain truth、不得改 memory body、不得无 gate promote default agent、不得训练或部署模型权重。
7. 若存在参考设计，输出 `reference_design_source_refs` 和短 `reference_design_pattern_notes`；只记录可迁移架构、workflow、grounding、evaluation、handoff、failure taxonomy，不把外部系统 runtime 或领域结论写成目标 truth。
8. 标注待澄清项；只有会改变 authority boundary 或交付物定义的问题才阻塞下一阶段。
9. 输出 intake refs 的正文摘要和稳定 locator，供 stage-decomposition 消费。

## 输出

- `intent_brief_ref`：目标 agent 的 domain、用户、交付物、首个 baseline 范围。
- `acceptance_criteria_ref`：baseline 可接受条件、测试条件、owner review 条件。
- `authority_boundary_ref`：owner split、可写面、只读面、禁止 promotion 的 gate。
- 可选 `reference_design_source_refs` / `reference_design_pattern_notes`：用户提供参考设计的 source locators 和短 transferable pattern notes。

## 质量门槛

- 每个交付物都有可验证形式：文件、receipt、contract ref、Agent Lab result ref 或 owner review ref。
- authority boundary 明确区分 `opl-meta-agent`、OPL Framework 和 target domain agent。
- acceptance criteria 可以直接转成 stage、action、quality gate 或 Agent Lab scorecard。
- 没有把“调研、建议、候选”写成“已采用、已交付、已授权”。
- intent brief 记录 Codex 的需求重构、反例和 route-back 理由；没有把用户第一句话机械映射成 stage graph。
- 如果缺少能支撑 agent 设计判断的领域知识、工具或质量 rubric，输出 knowledge/tool gap blocker，而不是继续生成薄 scaffold。

## 禁止事项

- 禁止用泛泛 persona 或模板替代具体交付物。
- 禁止把 OPL Framework 的 runtime、queue、workbench、attempt ledger 写成本仓责任。
- 禁止把 target domain 的事实、质量裁决或产物权威转移给 `opl-meta-agent`。
- 禁止把用户未声明的外部依赖写成默认 runtime requirement。
