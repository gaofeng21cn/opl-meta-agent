# Skill: Agent Baseline Build

## 用途

当用户用自然语言要求“做一个新的智能体”“把某个高价值知识交付流程沉淀成 OPL-compatible agent”时，使用本 skill 调用 `build-agent-baseline` action 的领域流程。用户不需要直接提供 CLI 参数；Codex 先把用户话语归一成目标 agent 字段，再调用同一个 action。

## 输入

- `output_dir`
- `opl_bin`
- `ai_reviewer_evaluation`
- `domain_id`
- `domain_label`
- `delivery_domain`
- `target_brief`
- `profile_selection_mode`：先消费 OPL profile selector（`opl profiles select --intent ... [--intent-signal <canonical-signal>] --json`）；非英文或混合语言请求由 OMA 先提炼 catalog 中存在的 canonical signals，并通过重复 `--intent-signal` 传入。命中内置 profile 时为 `builtin_profile`，命中内置 profile 且同时有参考设计或调研设计依据时为 `hybrid`，未命中内置 profile 但有 reference design source / pattern packet refs 时为 `source_derived_design`，只有模糊想法且需先调研专家实践时为 `research_driven_design`。
- 可选 `selected_opl_profile_refs`：内置 profile / hybrid 路线消费 OPL profile selector / readback（`opl profiles select --intent ... --json` 与 `opl profiles inspect ... --json`）后写入；source-derived / research-driven 路线可以为空。
- 可选 `profile_selection_rationale`：内置 profile / hybrid 路线来自 OMA profile selection receipt，说明为什么该 OPL 基座 profile 覆盖目标 agent；source-derived 路线由 source-derived design receipt 和 pattern packet refs 提供 rationale；research-driven 路线由 research-driven design receipt 和 research synthesis refs 提供 rationale。
- 可选 `profile_requirement_refs`：来自 OPL profile readback 与 OMA profile selection receipt 的 requirement refs。
- 可选 `reference_design_source_refs`：用户提供的论文/PDF/repo/产品文档/案例系统等设计参考。
- 可选 `reference_design_pattern_notes`：从参考设计抽取的短模式说明，例如 grounding、mode routing、rubric、validation 或 failure taxonomy。
- 可选 `reference_design_pattern_packet_refs`：由 OPL source ingest / Codex extraction 从 PDF/论文/外部案例提炼出的 refs-only 模式包。
- source-derived design machine objects：`ReferenceDesignPacket`、`TransferMap`、`AgentPackPlan`，当用户提供论文/PDF/repo/案例系统作为参考设计时必须生成并保留。外部 handoff 只接受 OPL `opl.reference_design_pattern_packet.v1` refs-only envelope，并只在 packet 本地目录安全解引用其 semantic JSON-pointer refs；三类设计对象必须来自已解析的真实 transferable patterns/anchors，或来自 seed library 的真实 workflow steps，pattern note 只能补充说明。raw source、opaque packet、identity shell、越界 pointer 或缺 steps/anchors 必须 fail closed。`DesignAdmissionReceipt` 必须在物化前证明 design-derived stage refs、target-only requirements、rejected source patterns、forbidden claims 和 refs-only authority boundary；`StageDecompositionSubpacketSet` 必须把 design-basis、transfer-planning、agent-pack-planning、design-admission 和 build-verification 串成可校验内部链条；`AgentBuildReceipt` / `build_receipt` 是物化后的构建溯源证明，不是第四个设计对象。
- 可选 `research_source_refs` / `expert_practice_notes` / `research_synthesis_refs`：用户只有模糊想法时，由 OMA/Codex 调研专家实践后形成。
- research-driven design machine objects：`ResearchSynthesisPacket`、`TransferMap`、`AgentPackPlan`，当没有参考设计但需要从外部成熟经验提炼 agent 设计时必须生成并保留；三类设计对象必须来自 research synthesis ref、expert practice note 或 research source ref，不能只是目标需求复述；物化前必须有 `DesignAdmissionReceipt` 和 `StageDecompositionSubpacketSet`，物化后保留 `AgentBuildReceipt` / `build_receipt`。
- stage-decomposition runner settings or explicit `stage_decomposition_closeout`
- intent、stage、action、memory、artifact 和 quality gate refs。
- artifact morphology brief refs：native source format、artifact body owner、creative source/export refs、sharding strategy、extent/scale contract、asset custody/file-path policy、thin assembler/helper boundary 和 realistic target task review refs。

`domain_id`、`domain_label`、`delivery_domain` 和 `target_brief` 来自用户自然语言需求；builtin / hybrid 路线的 `selected_opl_profile_refs` 和 `profile_selection_rationale` 来自 OPL profile catalog / selector，不靠 OMA 记忆猜测。source-derived 路线必须有用户提供或 Codex/source ingest 形成的 reference design source refs / pattern packet refs，并由 OMA 提炼可迁移设计思路。research-driven 路线必须有 research source refs、expert practice notes 或 research synthesis refs，并由 OMA 先调研“专家会怎么做”再迁移成目标 stage pack。只有目标 agent 的交付物、authority boundary 或质量门槛不清时才回问；不要要求用户理解底层脚本参数。
`stage_decomposition_closeout` 必须是 Codex `stage-decomposition` typed closeout；如果未显式提供，默认 runner 仍必须产出 typed closeout，不能从自由文本摘要推断 stage graph。

## 流程

1. 准备 output workspace，确认不会写入 source checkout 的 runtime artifact。
2. 从自然语言目标生成稳定的 target-agent descriptor 字段和 candidate agent package 路径。
3. 调用 OPL profile selector / readback：builtin / hybrid 路线把 selected profile、rationale、canonical `intent_signals` 和 requirements 写入 target descriptor、capability map 和 stage control plane；source-derived 路线按 `source extraction -> OPL refs-only packet -> local JSON-pointer resolution -> ReferenceDesignPacket -> TransferMap -> per-step AgentPackPlan -> DesignAdmissionReceipt` 执行后物化。每个声明 source 都必须有 typed packet 覆盖；用户 packet 存在时 seed 只作 context；每个 admitted workflow step 必须成为真实 stage 并带 prompt/skill/knowledge/quality-gate refs。research-driven 路线先把外部调研和专家实践提炼成非空 `ResearchSynthesisPacket`，再映射成非空 `TransferMap`、`AgentPackPlan` 和 `DesignAdmissionReceipt` 后物化。两条设计依据路线都必须把 receipt、pattern refs、transferable pattern requirements、capability plan requirements、design admission refs、`StageDecompositionSubpacketSet` refs 和 build receipt refs 写入同一组 surface。
4. 启动或读取 `stage-decomposition` typed closeout，从其中的 stage graph、action refs、artifact morphology brief、pack file bodies、profile selection mode、selected profile refs / source-derived design refs / research-driven design refs、三类设计对象、`DesignAdmissionReceipt`、`StageDecompositionSubpacketSet`、`AgentBuildReceipt` / `build_receipt`、profile requirements、independent gate policy、reference design refs / pattern packet refs / research synthesis refs 和 quality gate declaration 生成 candidate agent package 的标准目录和 contracts。
5. 写入 prompts、skills、stages、quality gates、knowledge policy，并保留 generated-from-closeout proof。
6. 确认 target artifact locator 引用 morphology refs，且长书、长 deck、长文、素材型交付或数据型交付的 creative source 是可分片 native source，不是脚本字符串或单一导出物。
7. 调用 OPL scaffold validation。
8. 调用 OPL generated interface projection。
9. 构造 declarative Agent Lab baseline suite seed 与 canonical Foundry evaluation work order；suite 必须包含 realistic target task 和 artifact-shape probes，但不得包含 observation、pass/fail、gate status 或 result/receipt body。
10. 对 existing target agent 可调用 takeover action，生成 takeover suite seed、target-bound evaluation work order、gated self-evolution candidate ref 和 mechanism candidate ref；不得本地执行 suite 或生成 takeover receipt。
11. 把 evaluation work order 交给 OPL Foundry Lab。只有 OPL 返回的 suite result 与 execution receipt 才能作为 `improve:external-suite --suite-result` 输入；reviewer evidence 必须覆盖 artifact morphology 风险，不能只有 scaffold/suite refs。
12. `improve:external-suite` 只生成 target capability candidate、developer patch work order、no-source-patch judgment 或 expected typed-blocker ref；实际 patch、target verification、Agent Lab re-evaluation、absorb/cleanup 和 owner closeout 由 OPL / target owner 执行。
13. Producer 阶段以 `candidate_package_materialized_ready_for_opl_foundry_lab_evaluation` 收口；只有外部 evaluation、self-evolution 与 owner closeout evidence 齐全后，才进入 delivery receipt / no-patch / developer work order / typed blocker 的 downstream gate。

## 输出

- `candidate_agent_package_ref`
- `opl_agent_package_manifest_ref`，指向目标 agent repo 的 `contracts/opl_agent_package_manifest.json`
- scaffold validation ref
- generated interface bundle ref
- profile selection mode / selected OPL profile refs / source-derived design receipt / research-driven design receipt / profile selection receipt ref / profile requirements
- `ReferenceDesignPacket` 或 `ResearchSynthesisPacket` / `TransferMap` / `AgentPackPlan` refs 与非空对象；`DesignAdmissionReceipt` refs 与非空对象；`StageDecompositionSubpacketSet` refs 与有序 cognitive packet 链；物化后的 `AgentBuildReceipt` / `build_receipt` refs；每个 design-derived stage 的 `stage_pattern_source_refs`
- reference design source refs / pattern notes / pattern packet refs
- research source refs / expert practice notes / research synthesis refs
- artifact morphology brief ref
- artifact morphology review / realistic target task evidence ref
- baseline suite seed / Foundry evaluation work-order refs
- takeover suite seed / Foundry evaluation work-order refs
- optional OPL-returned suite result / execution-receipt refs
- structured AI reviewer evaluation ref
- external-suite capability judgment ref
- target capability candidate ref
- developer patch work order or typed blocker ref
- delivery receipt, no-patch coordination receipt, or failure taxonomy ref

## 质量门槛

- package 可以在 clean output root 中重建。
- package 必须包含 OPL Agent Package manifest sidecar；Codex plugin 是默认 carrier/projection，不是 package truth。
- contract metadata 足以生成 CLI/MCP/Skill/product-entry/OpenAI/AI SDK surface。
- stage graph 和 action catalog 来自 typed closeout，而不是脚本内固定 graph。
- source-derived / research-driven closeout 必须保留 `StageDecompositionSubpacketSet`，证明 stage-decomposition 没有跳过设计依据、迁移计划、pack 计划、设计准入和物化后 build proof 的顺序。
- artifact morphology brief 来自 typed closeout，并被 artifact locator、suite task manifest、takeover/external-suite evidence 和 delivery receipt 引用。
- free text closeout、partial refs、缺 independent gate policy、缺 quality gate declaration 或 self-review 必须 fail closed。
- baseline delivery gate 通过前不签发交付。
- `build-agent-baseline` / takeover producer 状态只表示 Foundry evaluation handoff ready，不能声明 evaluation complete 或 delivery complete。
- 新建智能体交付必须包含 Agent Lab takeover / external suite evidence 和 independent AI reviewer evidence；只跑 scaffold validation、generated interface projection 或 baseline suite 不足以完成交付。
- independent AI reviewer evidence 必须引用真实 target task、artifact locator、native source/shard/asset refs、diff/receipt 或 owner feedback；只有 scaffold、interface projection 或 suite pass refs 不足以证明 morphology 风险已覆盖。
- external-suite judgment 若返回 developer work order，必须明确转交 OPL work-order owner；若返回 no-source-patch judgment，也必须等待 OPL/target-owner re-evaluation 与 closeout refs。

## 禁止事项

- 禁止把 `output_dir` 内 smoke artifact 当作本仓长期源码。
- 禁止硬编码本机路径进目标 agent contracts。
- 禁止生成空 README 或占位标记作为 agent pack 内容。
- 禁止把用户/source 声明的目标体量静默降级。
- 禁止把开放式正文、书稿或长 deck 正文写进 Python/TS 字符串作为创作源。
- 禁止把缺少项目内可复制路径、manifest/provenance 的 imagegen 或外部资产当成交付完成。
