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
- `profile_selection_mode`：先消费 OPL profile selector（`opl profiles select --intent ... --json`）；命中内置 profile 时为 `builtin_profile`，命中内置 profile 且同时有参考设计时为 `hybrid`，未命中内置 profile 但有 reference design source / pattern packet refs 时为 `source_derived_design`。
- 可选 `selected_opl_profile_refs`：内置 profile / hybrid 路线消费 OPL profile selector / readback（`opl profiles select --intent ... --json` 与 `opl profiles inspect ... --json`）后写入；source-derived 路线可以为空。
- 可选 `profile_selection_rationale`：内置 profile / hybrid 路线来自 OMA profile selection receipt，说明为什么该 OPL 基座 profile 覆盖目标 agent；source-derived 路线由 source-derived design receipt 和 pattern packet refs 提供 rationale。
- 可选 `profile_requirement_refs`：来自 OPL profile readback 与 OMA profile selection receipt 的 requirement refs。
- 可选 `reference_design_source_refs`：用户提供的论文/PDF/repo/产品文档/案例系统等设计参考。
- 可选 `reference_design_pattern_notes`：从参考设计抽取的短模式说明，例如 grounding、mode routing、rubric、validation 或 failure taxonomy。
- 可选 `reference_design_pattern_packet_refs`：由 OPL source ingest / Codex extraction 从 PDF/论文/外部案例提炼出的 refs-only 模式包。
- source-derived design machine objects：`ReferenceDesignPacket`、`TransferMap`、`AgentPackPlan`，当用户提供论文/PDF/repo/案例系统作为参考设计时必须生成并保留；三对象必须来自 pattern packet 或 pattern note，不能只是 raw source ref 或 identity shell。
- stage-decomposition runner settings or explicit `stage_decomposition_closeout`
- intent、stage、action、memory、artifact 和 quality gate refs。
- artifact morphology brief refs：native source format、artifact body owner、creative source/export refs、sharding strategy、extent/scale contract、asset custody/file-path policy、thin assembler/helper boundary 和 realistic target task review refs。

`domain_id`、`domain_label`、`delivery_domain` 和 `target_brief` 来自用户自然语言需求；builtin / hybrid 路线的 `selected_opl_profile_refs` 和 `profile_selection_rationale` 来自 OPL profile catalog / selector，不靠 OMA 记忆猜测。source-derived 路线必须有用户提供或 Codex/source ingest 形成的 reference design source refs / pattern packet refs，并由 OMA 提炼可迁移设计思路。只有目标 agent 的交付物、authority boundary 或质量门槛不清时才回问；不要要求用户理解底层脚本参数。
`stage_decomposition_closeout` 必须是 Codex `stage-decomposition` typed closeout；如果未显式提供，默认 runner 仍必须产出 typed closeout，不能从自由文本摘要推断 stage graph。

## 流程

1. 准备 output workspace，确认不会写入 source checkout 的 runtime artifact。
2. 从自然语言目标生成稳定的 target-agent descriptor 字段和 candidate agent package 路径。
3. 调用或消费 OPL profile selector / readback：builtin / hybrid 路线把 selected profile、rationale 和 requirements 写入 target descriptor、capability map 和 stage control plane；source-derived 路线先把论文/外部系统参考设计提炼成非空 `ReferenceDesignPacket`，再映射成非空 `TransferMap`，最后落成非空 `AgentPackPlan`，并把 `source_derived_design_receipt`、pattern packet refs、transferable pattern requirements 和 capability plan requirements 写入同一组 surface。只有 source ref 但没有 pattern packet / pattern note 时必须 route back 或 typed blocker。
4. 启动或读取 `stage-decomposition` typed closeout，从其中的 stage graph、action refs、artifact morphology brief、pack file bodies、profile selection mode、selected profile refs / source-derived design refs、三类设计对象、profile requirements、independent gate policy、reference design refs / pattern packet refs 和 quality gate declaration 生成 candidate agent package 的标准目录和 contracts。
5. 写入 prompts、skills、stages、quality gates、knowledge policy，并保留 generated-from-closeout proof。
6. 确认 target artifact locator 引用 morphology refs，且长书、长 deck、长文、素材型交付或数据型交付的 creative source 是可分片 native source，不是脚本字符串或单一导出物。
7. 调用 OPL scaffold validation。
8. 调用 OPL generated interface projection。
9. 构造 Agent Lab baseline suite 并运行；suite 必须包含 realistic target task 和 artifact-shape probes，能发现体量降级、正文入源码字符串、缺 sharding、外部资产无项目内 custody 的缺口。
10. 对已生成的 target agent repo 运行 OMA takeover / Agent Lab external suite，生成 takeover receipt、online learning candidate 和 mechanism patch proposal。
11. 消费结构化 independent AI reviewer evaluation，运行 `improve:external-suite` 或等价 action，把 reviewer evidence、Agent Lab result 和 target-agent source refs 转成 external-suite self-evolution receipt、target capability candidate、developer patch work order 或 typed blocker；reviewer evidence 必须覆盖 artifact morphology 风险，不能只有 scaffold/suite refs。
12. 若 external-suite / reviewer evidence 暴露可修复缺口，执行 owner-gated improvement loop 并重新跑目标 repo 验证和 Agent Lab re-evaluation；若无 source patch required，也必须记录 no-patch work order / coordination receipt。
13. 根据 gate 输出 delivery receipt、no-patch coordination receipt、developer work order 或 typed blocker。

## 输出

- `candidate_agent_package_ref`
- `opl_agent_package_manifest_ref`，指向目标 agent repo 的 `contracts/opl_agent_package_manifest.json`
- scaffold validation ref
- generated interface bundle ref
- profile selection mode / selected OPL profile refs or source-derived design receipt / profile selection receipt ref / profile requirements
- `ReferenceDesignPacket` / `TransferMap` / `AgentPackPlan` refs 与非空对象；每个 source-derived stage 的 `stage_pattern_source_refs`
- reference design source refs / pattern notes / pattern packet refs
- artifact morphology brief ref
- artifact morphology review / realistic target task evidence ref
- baseline suite result ref
- takeover suite result ref
- takeover receipt ref
- structured AI reviewer evaluation ref
- external-suite self-evolution receipt ref
- target capability candidate ref
- developer patch work order or typed blocker ref
- delivery receipt, no-patch coordination receipt, or failure taxonomy ref

## 质量门槛

- package 可以在 clean output root 中重建。
- package 必须包含 OPL Agent Package manifest sidecar；Codex plugin 是默认 carrier/projection，不是 package truth。
- contract metadata 足以生成 CLI/MCP/Skill/product-entry/OpenAI/AI SDK surface。
- stage graph 和 action catalog 来自 typed closeout，而不是脚本内固定 graph。
- artifact morphology brief 来自 typed closeout，并被 artifact locator、suite task manifest、takeover/external-suite evidence 和 delivery receipt 引用。
- free text closeout、partial refs、缺 independent gate policy、缺 quality gate declaration 或 self-review 必须 fail closed。
- baseline delivery gate 通过前不签发交付。
- 新建智能体交付必须包含 Agent Lab takeover / external suite evidence 和 independent AI reviewer evidence；只跑 scaffold validation、generated interface projection 或 baseline suite 不足以完成交付。
- independent AI reviewer evidence 必须引用真实 target task、artifact locator、native source/shard/asset refs、diff/receipt 或 owner feedback；只有 scaffold、interface projection 或 suite pass refs 不足以证明 morphology 风险已覆盖。
- external-suite self-evolution 若返回 developer work order，必须执行或明确转交 owner gate；若返回 no-patch coordination record，必须保留 receipt 和 re-evaluation refs。

## 禁止事项

- 禁止把 `output_dir` 内 smoke artifact 当作本仓长期源码。
- 禁止硬编码本机路径进目标 agent contracts。
- 禁止生成空 README 或占位标记作为 agent pack 内容。
- 禁止把用户/source 声明的目标体量静默降级。
- 禁止把开放式正文、书稿或长 deck 正文写进 Python/TS 字符串作为创作源。
- 禁止把缺少项目内可复制路径、manifest/provenance 的 imagegen 或外部资产当成交付完成。
