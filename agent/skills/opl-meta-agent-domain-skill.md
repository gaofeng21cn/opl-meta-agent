# Skill: OPL Meta Agent Domain Skill

## 用途

当用户要把一个高价值知识交付流程做成 OPL-compatible Foundry Agent 时，使用本 skill 驱动从 intent intake 到 baseline delivery 的完整 domain pack 构建。OMA 是 OPL Foundry Agent 系列里的 agent-building / improvement 成员，复用 MAS/MAG/RCA 同一 canonical OPL agent lifecycle、generic slots、stage sections、closeout shape 和 authority invariants。OMA 自身不维护 repo-owned generic plugin wrapper；目标 agent 必须生成 OPL Agent Package manifest sidecar，并由 OPL generated skill / Codex plugin carrier surface 对外投影。面向 Codex 的默认入口是用户自然语言，例如“帮我做一个能交付 X 的智能体”；本 skill 负责把自然语言归一成 `build-agent-baseline` 的目标 agent 字段。

## 输入

- 目标 agent 的领域、交付物、质量门槛和禁止事项。
- 可选已有 workflow、repo、文档、论文/PDF、公开参考、案例系统或失败样例。
- OPL binary locator、输出 workspace locator 和 stage-decomposition runner 设置。
- 由 Codex 从用户话语抽取的 `domain_id`、`domain_label`、`delivery_domain`、`target_brief`、可选 `reference_design_source_refs`、`reference_design_pattern_notes` 和 `reference_design_pattern_packet_refs`。

## 流程

1. 执行 `intent-intake`，冻结目标、边界和 acceptance criteria，并把自然语言需求归一为 target-agent descriptor 字段。
2. 执行 `web-experience-research`、用户提供参考设计读取，或消费 OPL source ingest / Codex extraction 形成的 pattern packet refs；只吸收可迁移模式，不复制外部 runtime、私有数据或领域 truth。若用户提供论文/PDF/repo/案例系统，参考来源是设计来源，profile/catalog/template 只作为 OPL conformance 下限或 route readback。
3. 执行 `stage-decomposition` Codex stage attempt，产出 typed closeout packet；stage/action/pack files/gate policy 必须从该 closeout 来。source-derived 路线必须先生成 `ReferenceDesignPacket -> TransferMap -> AgentPackPlan -> BuildReceipt`，且每个 source-derived stage requirement 引用 `source_pattern_ref`/`stage_pattern_source_refs` 或 `target_only_requirement`。
4. 执行 `agent-skeleton-build`，只校验并物化 closeout 中的 candidate package，再跑 scaffold/interface validation；scaffold 只是物理骨架，不是目标 agent 设计来源。
5. 执行 `eval-suite-build` 和 `baseline-run`，获得 Agent Lab evidence。
6. 对生成后的 target agent repo 执行 takeover / Agent Lab external suite，获得 takeover receipt、online-learning candidate 和 mechanism proposal。
7. 消费结构化 independent AI reviewer evaluation，并执行 `improve:external-suite` 或等价 self-evolution action，把 Agent Lab / reviewer evidence 转成 target capability candidate、developer patch work order、no-patch coordination receipt 或 typed blocker。
8. 若存在可修复缺口，进入 owner-gated improvement loop 并重跑目标 repo verification / Agent Lab re-evaluation；若无 source patch required，记录 no-patch coordination work order 和 re-evaluation refs。
9. 通过 `baseline-delivery` gate 后签发 package/runbook/receipt，并写出 `contracts/opl_agent_package_manifest.json` sidecar；Codex carrier 由 OPL generated surface 投影，sidecar 由 OPL App/Connect 管理安装、更新、依赖、repair 和按需暴露。

## 输出

- OPL-compatible agent package refs。
- OPL Agent Package manifest sidecar ref。
- stage/action/memory/artifact/gate refs。
- baseline delivery receipt refs。
- takeover / external suite result refs。
- structured AI reviewer evaluation refs。
- self-evolution receipt、target capability candidate 和 developer patch work order / typed blocker refs。
- 后续 optimizer 或 online-learning candidate refs。

## 质量门槛

- 用户自然语言能追溯到 `target_brief`；字段缺失时只回问会改变交付物或 owner boundary 的问题。
- 用户提供论文、PDF、repo 或案例系统作为参考时，必须保留 reference design refs / pattern packet refs，并先形成 `ReferenceDesignPacket -> TransferMap -> AgentPackPlan -> BuildReceipt`；这些 refs 只作为架构/评估/工作流模式来源，不写成 target truth、runtime dependency、owner receipt 或 quality verdict。
- 所有 stage 都有 prompt、tools/action、knowledge、handoff、quality gate declaration 和 independent gate policy。
- free text closeout、partial refs、缺 independent gate policy、缺 quality gate declaration 或 self-review 必须 fail closed。
- generated interfaces 从 contracts 派生，不新增私有 wrapper。
- domain truth、memory body、artifact body、quality verdict owner 明确。
- scaffold/interface validation 不能单独构成交付完成；完整 baseline handoff 必须包含 Agent Lab takeover/external-suite evidence、independent reviewer evidence 和 self-evolution closeout。
- reviewer 或 Agent Lab 发现的缺口必须进入 developer patch work order、owner-gated improvement loop 或 typed blocker；不能只在聊天或 README 中记录。

## 禁止事项

- 禁止把本 skill 用作 generic runtime。
- 禁止替目标 domain owner 写最终事实或质量裁决。
- 禁止跳过 Agent Lab baseline/takeover/external-suite evidence、independent reviewer evidence 或 self-evolution closeout 直接交付。
