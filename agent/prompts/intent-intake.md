# Intent Intake Prompt

## 目标

把用户对目标智能体的自然语言需求转成可审计的 `intent_brief_ref`、`acceptance_criteria_ref` 和 `authority_boundary_ref`，用于后续生成 OPL-compatible Foundry Agent domain pack。

## 输入

- 用户提供的目标智能体领域、交付物、受众和使用场景。
- 用户声明的质量门槛、禁止事项、可用工具、外部系统和运行限制。
- 用户提供的论文、PDF、GitHub repo、产品文档、案例系统或其他参考设计来源。
- 已有 agent repo/package 的路径或描述文件引用；如果没有，按新建 agent 处理。
- OPL profile selector/readback：新建 agent 时先消费 `opl profiles select --intent ... --json`；若命中内置 profile，再消费 `opl profiles inspect ... --json` 并选择 profile ref、rationale 和 requirements。若没有内置 profile 命中但用户提供论文/PDF/repo/产品案例等参考设计，消费 selector 返回的 `profile_selection_mode=source_derived_design` route receipt，把 source refs / pattern packet refs 转成设计思路输入，而不是强行套用现有模板。profile/catalog/template 只提供 OPL conformance 下限或 route readback，不能成为目标 agent 设计来源。
- `opl-meta-agent.agent-building-memory` 中稳定的 agent-building 经验引用。

## 步骤

1. 提取目标 agent 的核心 job：它要为谁交付什么可验证成果。
2. 用 Codex-first 方式重构需求：判断用户真正要的是新 agent、既有 agent takeover、mechanism improvement，还是 owner-boundary clarification；必要时提出更强的目标形态。
3. 分离 domain truth owner、quality verdict owner、artifact authority、memory body owner 和 OPL Framework 的 projection/runtime 角色。
4. 主动寻找反例：哪些要求会把 OPL 写成领域裁判、把 smoke 当交付、把 suite pass 当 promotion，或限制 AI executor 的专家判断空间。
5. 把用户约束写成正向 acceptance criteria：交付物必须包含什么、运行必须证明什么、receipt 必须声明什么。
6. 把禁止事项写成 explicit non-goals：不得写目标 domain truth、不得改 memory body、不得无 gate promote default agent、不得训练或部署模型权重。
7. 对新建 agent，先记录 OPL profile selector 结果：命中内置 profile 时输出 `selected_opl_profile_refs`、`profile_selection_rationale` 和 profile requirement refs；无内置匹配但有参考设计时输出 `profile_selection_mode=source_derived_design`、`source_derived_design_receipt_ref`、`reference_design_pattern_packet_refs`、transferable pattern requirements 和 capability plan requirements。上述字段必须来自 OPL selector / inspect readback 或 source-derived pattern packet，不从 OMA 记忆推断；它们只是后续 stage-decomposition 的输入，不替代 `ReferenceDesignPacket -> TransferMap -> AgentPackPlan -> BuildReceipt`。
8. 若存在参考设计，输出 `reference_design_source_refs`、短 `reference_design_pattern_notes`，或由 OPL source ingest / Codex extraction 形成的 `reference_design_pattern_packet_refs`；只记录可迁移架构、workflow、grounding、evaluation、handoff、failure taxonomy refs，不把外部系统 runtime 或领域结论写成目标 truth。后续 stage-decomposition 必须先提炼参考设计链，再迁移成 target agent stage；不能从模板、profile 或 scaffold 直接生成目标设计。
9. 标注待澄清项；只有会改变 authority boundary 或交付物定义的问题才阻塞下一阶段。
10. 输出 intake refs 的正文摘要和稳定 locator，供 stage-decomposition 消费。

## 输出

- `intent_brief_ref`：目标 agent 的 domain、用户、交付物、首个 baseline 范围。
- `acceptance_criteria_ref`：baseline 可接受条件、测试条件、owner review 条件。
- `authority_boundary_ref`：owner split、可写面、只读面、禁止 promotion 的 gate。
- `profile_selection_mode`：`builtin_profile`、`hybrid` 或 `source_derived_design`。`selected_opl_profile_refs` / `profile_selection_rationale` / `profile_requirement_refs` 只在内置 profile 或 hybrid 路线中必需；source-derived 路线必须保留 source-derived design receipt 和 pattern packet refs。
- 可选 `selected_opl_profile_refs` / `profile_selection_rationale` / `profile_requirement_refs`：OPL profile selector 与 inspect readback 的 refs-only 消费结果。
- 可选 `reference_design_source_refs` / `reference_design_pattern_notes` / `reference_design_pattern_packet_refs`：用户提供参考设计的 source locators、短 transferable pattern notes 和已提炼模式包 refs。
- source-derived handoff note：若存在参考设计，下一阶段必须产出 `ReferenceDesignPacket -> TransferMap -> AgentPackPlan -> BuildReceipt`；每个 source-derived stage requirement 必须保留 `source_pattern_ref`/`stage_pattern_source_refs` 或 `target_only_requirement`。

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
