# Agent Skeleton Build Prompt

## 目标

生成 OPL-compatible candidate agent package，补齐最小可运行 domain pack，并通过 OPL scaffold/interface validation 形成 `candidate_agent_package_ref`。

## 输入

- `stage_control_plane_ref`、`action_catalog_ref`、`memory_descriptor_ref`。
- 目标 agent 的 descriptor、prompt、skill、quality gate、artifact locator 策略。
- 若为 source-derived / research-driven 设计依据路线，必须输入 `ReferenceDesignPacket` 或 `ResearchSynthesisPacket`、`TransferMap`、`AgentPackPlan`、`DesignAdmissionReceipt` 和 `StageDecompositionSubpacketSet` refs，以及每个 stage requirement 的 `source_pattern_ref`/`stage_pattern_source_refs` 或 `target_only_requirement`；`AgentBuildReceipt` / `build_receipt` 是物化后的证明，不是 skeleton 输入。
- `build-agent-baseline` action 的 workspace locators：`output_dir`、`opl_bin`、`ai_reviewer_evaluation`。
- Codex 从用户自然语言归一出的 `domain_id`、`domain_label`、`delivery_domain` 和 `target_brief`。

## 步骤

1. 在指定 output root 创建以 `domain_id` 命名的候选 agent package，不污染 `opl-meta-agent` 源码 checkout。
2. 生成标准目录：`agent/`、`contracts/`、`runtime/`、`docs/`，并确保空目录有明确作用说明。该 scaffold 只是物理骨架，不得从 scaffold/profile/template 反推目标 agent 设计。
3. 写入 domain descriptor、stage control plane、action catalog、memory descriptor、artifact locator 和 owner receipt skeleton；source-derived / research-driven 路线只能物化 `AgentPackPlan` 里的 target stage pack，不能跳过 `ReferenceDesignPacket` 或 `ResearchSynthesisPacket`、`TransferMap`、`AgentPackPlan`、`DesignAdmissionReceipt` 和 `StageDecompositionSubpacketSet`。
4. 写入 prompts、skills、quality gates、knowledge policy，要求每份文档可执行、可验证、无占位标记。
5. 调用 OPL scaffold validation，修复合同结构错误。
6. 调用 `opl agents interfaces --repo-dir <candidate>`，确认 generated interface bundle 可以从 contracts 派生。
7. 记录 package refs、validation refs 和接口投影 refs。

## 输出

- `domain_descriptor_ref`
- `skill_refs`
- `prompt_refs`
- `candidate_agent_package_ref`
- scaffold validation result ref
- generated interface bundle ref

## 质量门槛

- candidate package 能被 OPL scaffold validate 接受。
- generated interface 不需要 repo-private wrapper 即可投影。
- 所有 agent docs 都说明目标、输入、步骤、输出、质量门槛和禁止事项，或在 stage/skill/gate 语境中等价覆盖。
- baseline package 不包含 target domain truth、memory body 或最终 artifact body。
- source-derived / research-driven package 中每个 design-derived stage requirement 都能追溯到 `source_pattern_ref`/`stage_pattern_source_refs` 或 `target_only_requirement`，且保留 `StageDecompositionSubpacketSet`；缺失时返回 route-back / typed blocker，而不是生成薄 scaffold。

## 禁止事项

- 禁止在候选 package 中实现 generic runtime、queue、daemon、workbench 或 attempt ledger。
- 禁止把 sample smoke 结果写成真实线上 delivery。
- 禁止为了通过 validation 删除 owner boundary 字段。
- 禁止把 OPL binary 路径硬编码进生成的长期合同。
