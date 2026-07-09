# opl-meta-agent 决策

Owner: `opl-meta-agent`
Purpose: `active_decision_record`
State: `active_truth`
Machine boundary: 本文是人读有效决策记录。机器真相继续归 `contracts/`、`agent/`、`runtime/authority_functions/`、source、CLI/API 行为、OPL Agent Lab result refs、work-order receipts、target owner receipts / typed blockers 和 tests。历史增量、proof snapshot、dated closeout 和退役 surface provenance 只从 `docs/history/process/` 或 git history 追溯。

## 读法

本文只保留仍会影响后续维护判断的 durable decisions。当前完成口径、gap 和下一轮 prompt 归 [`docs/active/opl-meta-agent-ideal-state-gap-plan.md`](./active/opl-meta-agent-ideal-state-gap-plan.md)；私有实现、script hygiene、default-caller tail 和退役门归 [`docs/active/opl-private-implementation-migration-inventory.md`](./active/opl-private-implementation-migration-inventory.md)；owner split 和机制细节归 [`docs/architecture.md`](./architecture.md)；硬约束归 [`docs/invariants.md`](./invariants.md)。

## 当前有效决策

### External learning / suite signals 是 advisory inputs，不是 target owner verdict

- 决策：external learning notes、suite findings、scorecards、optimizer candidates、promotion signals 和 regression pass/fail 只能作为 Codex / independent reviewer 的证据输入、developer work order trace、mechanism proposal、route-back 或 reviewer attention。
- 理由：OMA 面向 agent-building，可以组织评估和改进证据，但不能把 checklist、suite pass、scorecard、external memory 或 promotion hint 升级成 target-domain truth、target quality verdict、default promotion、App-live readiness、export verdict、owner receipt 或 typed blocker authority。
- 影响：patch/promotion/ready claim 必须有 owner route、direct evidence、independent reviewer provenance、no-forbidden-write proof、target verification refs、target owner receipt 或 typed blocker return shape；缺可选 advisory learning 默认成为 work-order gap / route-back / reviewer-attention note，不作为全局 stop。

### OMA 接入 OPL Family Foundry Agent OS target pattern

- 决策：OMA 采用 family-level `OPL Agent OS + Declarative Agent-Building Pack + Agent-Building Authority Kernel + Improvement Capability Registry` 目标形态，target delta 维护在 [`docs/active/foundry-agent-os-target-delta.md`](./active/foundry-agent-os-target-delta.md)。
- 决策：`contracts/foundry-agent-os-domain-kernel-manifest.json` 是 W4 domain-kernel manifest 的机器合同入口，固定 OMA retained authority kernel、OPL upcollect surfaces、`current_owner_delta` 默认读根、domain signer surfaces、target-agent forbidden authority 和 false-authority flags。
- 理由：MAS/MAG/RCA/OMA 应共享同一 Agent OS pattern，避免 OMA 复制 Agent Lab、work-order runner、generated interface、promotion shell、App/workbench 或 capability registry；agent-building semantics、candidate package、developer work order、mechanism proposal 和 route-back evidence 仍由 OMA kernel 持有。
- 影响：默认读根必须是 `current_owner_delta`；Capability Registry 只能是 Atlas/Pack/Stagecraft 的 catalog / ABI / use-policy，不是 Agent Lab runner、promotion gate 或 target owner authority；OPL/Agent Lab/Vault/Console/Runway/Pack 不能写 target truth、artifact body、memory body、quality/export verdict、owner receipt body 或 default promotion authority。该决策与 manifest 不声明 target-agent ready、App live ready、human approval、default promotion 或 production-ready。

### OMA 是独立 Foundry Agent，不是 OPL Framework 内置模块

- 决策：`opl-meta-agent` 采用 OPL standard domain-agent scaffold，长期形态是 `Declarative Agent-Building Pack + OPL generated/hosted surfaces + minimal agent-building authority functions`。
- 决策：OMA 通过 `contracts/standard-agent-principles-adoption.json`、`agent/principles/opl-standard-agent-principles.md` 和 `agent/principles/domain-specialization.md` 采用 OPL Standard Agent AI-first Principle Pack；`intent-intake` 是 OMA 的 domain intake mapping，不是独立 Skill。
- 理由：Agent-building semantics、candidate package、developer work order、mechanism proposal 和 typed blocker 是 OMA 的 domain value；generic runtime、Agent Lab、registry、generated interfaces、queue、attempt ledger、App/workbench 和 promotion gate 属于 OPL Framework / App。
- 影响：本仓不实现 repo-local generic CLI/MCP/Skill/product-entry wrapper、sidecar/status/workbench shell、scheduler、queue、attempt ledger、registry/App shell、Agent Lab runner、promotion engine、通用 intake Skill 或 target worktree lifecycle。

### `agent/` 是 repo-tracked declarative pack root

- 决策：`agent/` 下的 principles、prompts、stages、skills、quality gates 和 knowledge files 是机器可验证 pack source；README 与文档章节只做人读索引。
- 理由：标准 OPL Agent 需要 contracts/tests 能解析真实 pack path，避免把 prose heading、目录存在性或 README 当成 semantic pack truth。
- 影响：`contracts/pack_compiler_input.json`、`contracts/stage_control_plane.json` 和 pack tests 必须指向非 README 的真实文件；新增 stage/action/quality gate 先进入 pack/contracts，再同步人读说明。

### Target agent repo 目录标准归 OPL scaffold，OMA 只写领域语义

- 决策：OMA 生成新 target agent 时，目标 repo 的物理目录标准必须来自 OPL Framework `opl agents scaffold`；OMA 不维护并行目录模板、私有 scaffold 标准或 repo-local generated interface owner。
- 决策：`build-agent-baseline` 的语义设计顺序是 OMA stage-decomposition / domain pack refs -> OPL scaffold materialization / validation -> OPL generated interfaces -> Agent Lab / reviewer / delivery gate -> owner receipt、typed blocker、developer work order 或 no-patch coordination。若输入包含论文/PDF/repo/产品案例等 `reference_design_source`，stage-decomposition 必须先把参考来源提炼为 `ReferenceDesignPacket -> TransferMap -> AgentPackPlan`，通过 `DesignAdmissionReceipt` 做设计准入，再迁移到 target agent stage pack；物化后用 `AgentBuildReceipt` / `build_receipt` 证明构建溯源与 conformance。每个 source-derived stage requirement 必须引用 `source_pattern_ref`/`stage_pattern_source_refs` 或明确标为 `target_only_requirement`。
- 理由：标准目录属于 OPL family 统一 scaffold / conformance；OMA 的核心价值是 agent-building reasoning、stage decomposition、artifact morphology、candidate package、developer work order 和 mechanism proposal，而不是复制 OPL Pack / Stagecraft / Connect / generated surface。
- 影响：README、目录存在、suite pass、generated interface readiness 或 scaffold validation 都不能单独声明新 target agent 完成；profile/catalog/template 只提供 OPL conformance 下限和 route/readback refs，scaffold 只提供物理骨架，不能替代参考设计提炼或 target agent 语义设计。可消费语义必须来自非 README pack files、`contracts/stage_control_plane.json`、typed closeout refs、owner route refs 和 delivery gate refs。后续 Stage Pack v2 字段稳定后，OMA 应把 target agent v2 缺口从 advisory 收紧为 delivery gate blocker。

### OPL 持有 generated surfaces，OMA 只提供 refs-only inputs

- 决策：CLI、MCP、Skill、product-entry、OpenAI tool 与 AI SDK descriptors 由 OPL Framework 从 action/stage contracts 生成或托管；OMA 可以暴露 declared minimal authority actions，但不拥有 generated surface。
- 理由：generated interface 是 family-level projection/invocation surface，不能变成 domain repo 的第二 runtime 或第二 truth owner。
- 影响：generated interface readiness、registry/App projection readiness、suite pass、schema completeness、contract completeness 或 source-shape conformance 不能声明 target-domain ready、quality/export verdict、App live rendering、human approval、owner receipt body 或 default promotion。

### OMA 和 Agent Lab 是标准 target-agent consumers

- 决策：OMA 消费标准 target-agent handoff、production/live acceptance、owner route、editable surface policy、verification refs、no-forbidden-write proof 和 owner receipt / typed blocker refs；不得为 MAS/MAG/RCA 或任何单一 target agent 增加 OMA 专用 command family、suite kind 或 compatibility layer。
- 理由：标准 OPL Agent 应兼容统一 consumer boundary；target domain 名称只应作为 refs、owner routes、fixtures、receipts 或 provenance 出现。
- 影响：target-agent patch loop 只能输出 target-agent generic developer work order、capability candidate、mechanism proposal 或 typed blocker；target truth、memory body、artifact body、quality/export verdict 和 default promotion authority 保留给 target owner。

### Developer work order 是受限 patch loop，不是目标 owner

- 决策：OMA 可以把 blocked Agent Lab evidence 转成 developer patch work order，但 work order 必须包含 executor-first aperture、independent reviewer provenance、AHE failure/root-cause/fix/impact refs、patch traceability、target verification、runtime/read-model consumption、workspace environment proof、no-forbidden-write proof、rollback/canary/version refs、owner route refs、target owner receipt or typed blocker return shape 和 machine closeout refs。
- 决策：`oma-agent-evolution` 是 OMA / `opl-meta-agent` 的专业能力，不放入 MAS ScholarSkills；它的 diagnosis router 固定使用 `stage-route`、`specialist-skill`、`tool-connector`、`quality-gate`、`read-model-currentness`、`authority-boundary` 和 `app-observability` 七类 failure class。developer work order 必须带 `agent_evolution_decision_ref`、`failure_class`、`target_owner_route`、`target_editable_surface_refs`、`forbidden_surfaces`、`expected_behavior_delta`、`verification_refs` 和 `owner_closeout_readback`。
- 决策：external-suite self-evolution 的 source patch target 只能来自目标 agent `contracts/capability_map.json` 或目标 agent 显式 policy；`agent_lab_handoff` 只提供 suite entry、fixture/runtime context 和 external learning refs，不提供 patch target authority；generic owner-receipt / package / typed-blocker 关键词不能生成 patch target。命不中时返回 target-improvement typed blocker；passed suite 只能生成 no-patch coordination shape。
- 决策：`target_agent_feedback_external_suite` 是通用 OPL FeedbackOps external suite profile；OMA 只作为 generic consumer，把 target-agent feedback refs、source Agent Lab result ref、direct reviewer evidence、no-forbidden-write boundary、OPL work-order delegation aperture、target owner closeout refs 和 progress accounting 投影为 developer work order，不拥有 runner、queue、target truth、target worktree lifecycle 或 target owner receipt body。
- 决策：MAS `high-quality-medical-manuscript` 与 `reviewer_revision` feedback Agent Lab external suite 是标准 `agent_lab_external_suite` 输入，可被 `improve:external-suite` 消费为 `developer_patch_work_order`；work order 必须显式带 `target_agent=med-autoscience`、`source_agent_lab_result_ref`、`source_external_suite_intake`、`reviewer_evidence_refs`、false authority boundary、OPL work-order delegation aperture、target owner closeout refs 和 OPL family progress accounting。
- 决策：`build-agent-baseline` 生成 target agent scaffold 时必须跟随 OPL standard-stage-pack v2 和 Foundry Agent series policy，包括 tool affordance catalog/boundary、receipt schema refs、minimal authority function refs、L4/L5 entry gates、membership projection、standard public projection 和 workspace topology profile；delivery gate 只消费 scaffold validation readback，不能豁免或降级 blocked validation。
- 理由：source patch 必须可审计、可验证、可回滚，并且不能把质量判断或 owner acceptance 转交给 OMA 或 foreground developer。
- 影响：缺少 direct reviewer evidence、source refs、capability_map / target-owned explicit policy 命中、patch traceability、target verification、owner route、no-forbidden-write proof、closeout refs、delegation aperture、progress accounting 或 target owner receipt / typed blocker 时，只能返回 typed blocker / fail-closed validation。target domain truth、memory body、artifact body、quality/export verdict、owner receipt body 和 default promotion 仍不可写。

### 外部 work-order execution 与 post-absorb closeout 委托给 OPL

- 决策：`execute:external-work-order` 只是 OMA 对 OPL `work-order execute` primitive 的 shape validation / thin delegation entry。post-absorb target owner closeout hook 若存在，也由 OPL 调用，OMA 只记录 delegation proof。
- 理由：worktree lifecycle、runner、absorb、cleanup、owner closeout hook invocation、execution receipt 和 Agent Lab re-evaluation 是 OPL / target owner 控制面。
- 影响：OMA 必须保持 `owner_closeout_hook_delegated=true`、`target_owner_closeout_owner=target-domain via OPL`、`oma_can_write_owner_receipt=false` 的边界；不得实现 generic runner、queue、attempt ledger、absorb/cleanup loop 或 owner receipt writer。

### `build-agent-baseline` 的默认输入 authority 是 Codex stage-decomposition typed closeout

- 决策：baseline materialization 必须来自 live Codex `stage-decomposition` attempt 或显式 typed closeout packet；旧 direct script-authored graph 没有 compatibility path。`fixture` runner 只能消费显式 proof/test typed closeout，用于 deterministic validation。
- 理由：OMA 的核心价值在 AI-first stage decomposition 和 owner-gated pack generation，固定脚本图会把 domain reasoning 退化为 fallback materializer。
- 影响：free-text closeout、partial refs、缺 independent gate policy、缺 quality gate declaration、缺 no-forbidden-write policy 或 self-review 都 fail closed；不得恢复 no-`--domain-id` implicit fixture smoke、direct graph compatibility 或 fallback materialization route。

### 新建 target agent 交付必须包含 Agent Lab 评估和自进化闭环

- 决策：新建 OPL-compatible target agent 的完成定义必须包含 OPL scaffold validation、generated interface projection、Agent Lab baseline / takeover 或 external suite、结构化 independent AI reviewer evaluation、`improve:external-suite` self-evolution consumption，以及 delivery receipt / no-patch coordination receipt / developer work order / typed blocker 中的一种收口形态。
- 理由：scaffold 和 generated interfaces 只证明结构可消费，不能证明 target agent 达到高质量交付要求。OMA 的职责是构建并评估 target agent，并把 Agent Lab / reviewer evidence 转成可执行改进、no-patch closeout 或明确 blocker。
- 影响：只生成 repo skeleton、只跑 `opl agents scaffold --validate`、只跑 `opl agents interfaces`、只记录 baseline/takeover suite pass、只消费 StageRun / Temporal provider completion、只给 canary/operator summary 或只记录 conformance pass，都不能称为 OMA 新建智能体完成。`contracts/action_catalog.json#actions/build-agent-baseline/new_agent_delivery_gate`、`contracts/action_catalog.json#actions/takeover-target-agent-test/new_agent_delivery_gate` 与 `scripts/build-agent-baseline.ts#assertNewAgentDeliveryGate` 是当前机器守门入口；实际 baseline / takeover payload 必须带 `new_agent_delivery_gate` readback，并包含 StageRun/Temporal refs-only consumption、`stage_completion_policy_ref`、`stage_closeout_packet_ref`、target owner receipt / typed blocker / human gate ref、no-forbidden target truth write proof 和 target-domain artifact morphology reviewer evidence。若 Agent Lab 或 reviewer evidence 暴露缺口，必须进入 owner-gated improvement loop、developer work order 或 typed blocker；若无需 source patch，也必须记录 no-patch coordination work order / receipt 和 re-evaluation refs。

### Target-domain artifact morphology 是 Foundry 流程必需设计面

- 决策：`stage-decomposition` typed closeout 必须产出 target-domain artifact morphology brief；baseline、takeover、external-suite 和 reviewer evidence 必须引用该 brief，并用 realistic target task 反推产物结构。
- 理由：Foundry agent 的真实价值不只在 scaffold、interface 或 suite 可消费，还在于目标领域交付物能以正确形态被创作、审核、装配、复制和交接。近期暴露的问题说明，如果流程不显式设计交付物形态，系统会把目标体量静默降级、把开放式正文塞进源码字符串、用单文件承载长体量创作、丢失 imagegen/外部资产 custody，或只凭 scaffold/interface 通过而没有反推真实产物结构。
- 影响：新建 target agent 的 closeout 和 delivery receipt 必须保留 native source format、artifact body owner、creative source/export refs、sharding strategy、extent/scale contract、asset custody/file-path policy、thin assembler/helper boundary 和 realistic target task review refs。缺少这些 refs，或 reviewer evidence 只有 scaffold/interface/suite refs，只能返回 typed blocker、developer work order 或 owner route-back；不能签发 baseline delivery，也不能把 suite pass 写成 artifact readiness。该决策是通用 OMA Foundry 流程规则，不新增任何 target-domain-specific command family。

### Stage-native artifact、State Index 和 StageRun 只按 refs-only adoption 读取

- 决策：OMA 可以在 stage contracts、generated target packs、Agent Lab suites、developer work orders 和 typed blockers 中 materialize stage-native artifact refs、state-index refs、StageRun canary refs、operator summary 和 conformance refs；真实 physical stage folder lifecycle、SQLite sidecar index、runtime state、queue、attempt ledger、workbench consumption 和 promotion gate 归 OPL/App。
- 理由：OMA 需要生成可被 OPL 消费的 contract/ref templates，但不能创建 runtime state、owner promotion state、target owner receipt body 或 workbench state。
- 影响：controlled canary、operator summary、legacy residue guard 或 conformance pass 只证明 repo-local shape 可消费；不能升级为 live domain progress、target-agent readiness、production readiness、quality/export verdict、App live rendering、human approval 或 default promotion。

### Stage executor policy 是 candidate，不是 executor switch

- 决策：Codex CLI 是 OMA stage 的 first-class default executor。OMA 只能提出 `stage_executor_policy_candidate`；非默认 executor 需要 adapter / binding / receipt refs，缺失时 fail closed。
- 理由：executor binding、trial、policy read model、gate、receipt 和 default promotion 是 OPL / Agent Lab 职责。
- 影响：不得把 non-default executor candidate、suite pass 或 candidate completeness 写成 executor switch、runner implementation、quality equivalence 或 default-executor promotion。

### Stage completion judgment 属于 domain stage，OPL 只负责 runtime 接力

- 决策：OMA 生成的 target stage 默认必须包含 `stage_completion_policy`，并固定 `completion_judgment_owner=domain_stage`、`closeout_packet_required=true`、`provider_completion_is_domain_completion=false`、`opl_content_judgment_allowed=false`、`next_stage_transition_owner=opl_runtime`。
- 理由：stage loop 要保持 RCA/OBF 式的低摩擦推进体验，但不能把 runtime completion、provider receipt、文件存在或测试通过误当成 domain completion。正确闭环是 stage 内完成内容判断并输出标准 closeout packet，OPL 只验证 packet shape、记录 attempt、执行 next-stage transition。
- 影响：每个 stage contract / generated pack 必须携带 `stage_completion_policy_ref`，并要求 `stage_closeout_packet_ref`。Agent Lab / OMA 应检测缺失 policy、错误 owner、OPL 内容判断、provider completion 即 domain completion、缺 closeout packet、缺 accepted outcome refs 或缺 owner receipt / typed blocker / human gate / route-back refs 的 stage，并把它们标为 conformance blocker。

### Progress-First accounting 使用 OPL family canonical fields

- 决策：developer work orders 必须使用 `progress_delta_classification`、`deliverable_progress_delta`、`platform_repair_delta` 和 `target_progress_accounting_ref`；退役 OMA-specific aliases 不再被 emitted 或 accepted。
- 理由：target-agent deliverable progress、platform/interface repair、typed blocker、human gate 和 stop-loss 必须能被 OPL family read model 统一理解。
- 影响：platform repair、cleanup、absorption、Agent Lab re-evaluation、currentness repair 和 refs-only ledger 不能计为 target-agent substantive deliverable progress；typed blocker 必须带 lineage、repeat budget、next allowed action、next forced delta 和 escalation/dead-letter refs。

### Clean-room pattern intake 只吸收 agent-building 模式

- 决策：`skillnerds/xskill` 等外部经验只作为 clean-room pattern source，用于 trajectory atomization、candidate buffer、per-skill version/canary refs 和 team redaction/sync refs。
- 理由：OMA 可以学习 agent-building organization，但不能引入 alternate runtime、installer、server 或 execution plane。
- 影响：不得导入 xskill daemon/runtime、generic scheduler、skill installer、team server、storage authority 或 generated interface owner；xskill-derived 内容只能进入 refs-only proposal、developer work order、typed blocker、reviewer evidence 或 declarative policy。

## Superseded 决策入口

以下旧口径只作为 history/provenance 读，不再承担 current owner：

- 旧 direct script-authored graph、no-`--domain-id` implicit fixture smoke、`takeover:test --fixture` parser branch 和 direct graph compatibility path。
- 旧 active machine fields `external_agent_allowed`、`external_opl_compatible_agents_allowed`、external-agent takeover identifiers 和 OMA-specific Progress-First aliases。
- Repo-local plugin / Skill wrapper、sidecar/status/workbench shell、registry owner、Agent Lab runner、promotion gate、generic worktree lifecycle 和 compatibility facade。
- 逐条 proof/coverage/closeout 决策流水。当前结论折回本文、active plan、private inventory、contracts、source/tests；过程只保留在 `docs/history/process/`。
