# Skill: Agent Baseline Build

## 用途

当用户用自然语言要求“做一个新的智能体”“把某个高价值知识交付流程沉淀成 OPL-compatible agent”时，使用本 skill 调用 `build-agent-baseline` action 的领域流程。用户不需要直接提供 CLI 参数；Codex 先把用户话语归一成目标 agent 字段，再调用同一个 action。

## 输入

- `output_dir`
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
- source-derived design machine objects：`ReferenceDesignPacket`、`TransferMap`、`AgentPackPlan`、morphology 与 `DesignAdmissionReceipt` 必须来自已解析的真实 patterns/anchors。它们可相互校正，但 safe packet/source evidence 先于 claim，admission 先于物化，`AgentBuildReceipt` 绑定物化后 bytes。`StageDecompositionSubpacketSet` 记录这些 refs 与 boundary provenance，不规定固定认知顺序。
- 可选 `research_source_refs` / `expert_practice_notes` / `research_synthesis_refs`：用户只有模糊想法时，由 OMA/Codex 调研专家实践后形成。
- research-driven design machine objects：`ResearchSynthesisPacket`、`TransferMap`、`AgentPackPlan`，当没有参考设计但需要从外部成熟经验提炼 agent 设计时必须生成并保留；三类设计对象必须来自 research synthesis ref、expert practice note 或 research source ref，不能只是目标需求复述；物化前必须有 `DesignAdmissionReceipt` 和 `StageDecompositionSubpacketSet`，物化后保留 `AgentBuildReceipt` / `build_receipt`。
- OPL hosted StageRun 注入的 `stage_decomposition_closeout_ref` 与 `agent_skeleton_build_closeout_ref`
- 可选 `developer_proof_receipt_ref`：只接受 OPL host 对当前 request SHA、target identity 与五项 input refs 签发的 aggregate proof receipt。
- intent、stage、action、memory、artifact 和 quality gate refs。
- artifact morphology brief refs：native source format、artifact body owner、creative source/export refs、sharding strategy、extent/scale contract、asset custody/file-path policy、thin assembler/helper boundary 和 realistic target task review refs。

`domain_id`、`domain_label`、`delivery_domain` 和 `target_brief` 来自用户自然语言需求；builtin / hybrid 路线的 `selected_opl_profile_refs` 和 `profile_selection_rationale` 来自 OPL profile catalog / selector，不靠 OMA 记忆猜测。source-derived 路线必须有用户提供或 Codex/source ingest 形成的 reference design source refs / pattern packet refs，并由 OMA 提炼可迁移设计思路。research-driven 路线必须有 research source refs、expert practice notes 或 research synthesis refs，并由 OMA 先调研“专家会怎么做”再迁移成目标 stage pack。只有目标 agent 的交付物、authority boundary 或质量门槛不清时才回问；不要要求用户理解底层脚本参数。
两个 closeout ref 必须分别指向 Codex `stage-decomposition` 与 `agent-skeleton-build` 的 OMA-owned typed closeout packet；不得从自由文本摘要推断 stage graph 或 file bodies，也不得把 raw OPL StageRun query 交给 OMA helper 解释。

## 流程

1. 准备 output workspace，确认不会写入 source checkout 的 runtime artifact。
2. 从自然语言目标生成稳定的 target-agent descriptor 字段和 candidate agent package 路径。
3. 消费 OPL profile/source/research route refs，并让真实 artifact morphology、owner split、design objects 与 source-step dispositions 共同决定 target graph。每个 workflow step 必须可追溯，但可按开放判断、owner、knowledge、gate、handoff 或 failure route 合并为 Stage-internal method；不得强制一 step 一 Stage。
4. 由 OPL hosted StageRun 读取 `stage-decomposition` 与 `agent-skeleton-build` typed closeout refs，从前者的 stage graph、action refs、artifact morphology brief、profile/design objects 与 gate declarations，以及后者的 pack file bodies，构造 OPL scaffold materialization request；OMA 不启动或查询 StageRun。
5. 把 prompts、skills、stages、quality gates 与 knowledge policy 作为 declarative file plan/body 写入 scaffold request；物理文件写入只由 OPL host 执行，并保留 generated-from-closeout proof。
6. 确认 target artifact locator 引用 morphology refs，且长书、长 deck、长文、素材型交付或数据型交付的 creative source 是可分片 native source，不是脚本字符串或单一导出物。
7. 将 scaffold materialization/validation request 交给 OPL host，并消费其 exact proof receipt。
8. 消费 OPL host 返回的 generated interface、package manifest validation 与 profile conformance proof refs。
9. 构造 evaluation semantics 与 canonical work-order materialization request；semantic request 只包含 realistic target task 的 domain-owned intent/refs，materialization request 绑定 target identity 与 provenance；两者都不得包含 environment、probe、scorecard spec、completion policy、observation、pass/fail、gate status、suite plan 或 result/receipt body。
10. 对 existing target agent 可调用 takeover action，生成 takeover semantic request、canonical work-order materialization request、gated self-evolution candidate ref 和 mechanism candidate ref；不得分配 work-order identity、本地编译或执行 suite，亦不得生成 takeover receipt。
11. 把 evaluation work order 交给 OPL Foundry Lab；由 OPL 编译唯一 suite plan。只有 OPL 返回的 suite result 与 execution receipt 才能作为 `improve:external-suite --suite-result` 输入；reviewer evidence 必须覆盖 artifact morphology 风险，不能只有 scaffold/suite refs。
12. `improve:external-suite` 只生成 target capability candidate、developer-patch semantic request、no-source-patch judgment 或 expected typed-blocker ref；canonical work order materialization、实际 patch、target verification、Agent Lab re-evaluation、absorb/cleanup 和 owner closeout 由 OPL / target owner 执行。
13. Producer 阶段以 `candidate_package_materialized_ready_for_opl_foundry_lab_evaluation` 收口；只有外部 evaluation、self-evolution 与 owner closeout evidence 齐全后，才进入 delivery receipt / no-patch / developer work order / typed blocker 的 downstream gate。

## 输出

- `candidate_agent_package_ref`
- `opl_agent_package_manifest_ref`，指向目标 agent repo 的 `contracts/opl_agent_package_manifest.json`
- scaffold validation ref
- generated interface bundle ref
- `opl_standard_agent_developer_proof_request` 与 request-bound `opl_standard_agent_developer_proof_receipt` ref
- profile selection mode / selected OPL profile refs / source-derived design receipt / research-driven design receipt / profile selection receipt ref / profile requirements
- `ReferenceDesignPacket` 或 `ResearchSynthesisPacket` / `TransferMap` / `AgentPackPlan` refs 与非空对象；`DesignAdmissionReceipt` refs；`StageDecompositionSubpacketSet` provenance/boundary refs；物化后的 `AgentBuildReceipt` / `build_receipt` refs；每个 design-derived Stage 的 source/disposition refs
- reference design source refs / pattern notes / pattern packet refs
- research source refs / expert practice notes / research synthesis refs
- artifact morphology brief ref
- artifact morphology review / realistic target task evidence ref
- baseline evaluation semantic / work-order materialization request refs
- takeover evaluation semantic / work-order materialization request refs
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
- source-derived / research-driven closeout 必须保留 `StageDecompositionSubpacketSet`，证明设计依据、迁移、pack、morphology、准入和 post-materialization build proof 的 refs 与边界完整；不用于冻结模型的认知顺序。
- artifact morphology brief 来自 typed closeout，并被 artifact locator、suite task manifest、takeover/external-suite evidence 和 delivery receipt 引用。
- free text closeout、partial refs、缺 independent gate policy、缺 quality gate declaration 或 self-review 记录 `completed_with_quality_debt` 并 route-back；它们阻止 baseline delivery、promotion 和 ready 声明，不阻止 stage transition。零、损坏或不可读 artifact 物化 no-output/failure diagnostic 并继续；只有 executor unavailable、权限/安全/authority、wrong-target identity/currentness、不可逆动作或显式人工决策才硬停止。
- baseline delivery gate 通过前不签发交付。
- `build-agent-baseline` / takeover producer 状态只表示 Foundry evaluation handoff ready，不能声明 evaluation complete 或 delivery complete。
- 新建智能体交付必须包含 Agent Lab takeover / external suite evidence 和 independent AI reviewer evidence；只跑 scaffold validation、generated interface projection 或 OPL-generated suite plan 不足以完成交付。
- independent AI reviewer evidence 必须引用真实 target task、artifact locator、native source/shard/asset refs、diff/receipt 或 owner feedback；只有 scaffold、interface projection 或 suite pass refs 不足以证明 morphology 风险已覆盖。
- external-suite judgment 若返回 developer work order，必须明确转交 OPL work-order owner；若返回 no-source-patch judgment，也必须等待 OPL/target-owner re-evaluation 与 closeout refs。

## 禁止事项

- 禁止把 `output_dir` 内 smoke artifact 当作本仓长期源码。
- 禁止硬编码本机路径进目标 agent contracts。
- 禁止生成空 README 或占位标记作为 agent pack 内容。
- 禁止把用户/source 声明的目标体量静默降级。
- 禁止把开放式正文、书稿或长 deck 正文写进 Python/TS 字符串作为创作源。
- 禁止把缺少项目内可复制路径、manifest/provenance 的 imagegen 或外部资产当成交付完成。
