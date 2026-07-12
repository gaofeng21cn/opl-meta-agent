# opl-meta-agent 决策

Owner: `opl-meta-agent`
Purpose: `active_decision_record`
State: `active_truth`
Machine boundary: 本文是人读有效决策记录。机器真相继续归 `contracts/`、`agent/`、`runtime/authority_functions/`、source、CLI/API 行为、OPL Agent Lab result refs、work-order receipts、target owner receipts / typed blockers 和 tests。历史增量、proof snapshot、dated closeout 和退役 surface provenance 只从 `docs/history/process/` 或 git history 追溯。

## 读法

本文只保留仍会影响后续维护判断的 durable decisions。当前完成口径、gap 和下一轮 prompt 归 [`docs/active/opl-meta-agent-ideal-state-gap-plan.md`](./active/opl-meta-agent-ideal-state-gap-plan.md)；私有实现、script hygiene、default-caller tail 和退役门归 [`docs/active/opl-private-implementation-migration-inventory.md`](./active/opl-private-implementation-migration-inventory.md)；owner split 和机制细节归 [`docs/architecture.md`](./architecture.md)；硬约束归 [`docs/invariants.md`](./invariants.md)。

## 当前有效决策

### 标准 Agent 身份与 helper 实现语言分离

- 决策：OMA 自身和 OMA 生成/接管的目标智能体统一采用 `Declarative Standard Agent Pack + optional domain helpers`。`agent/` Markdown 与 `contracts/` JSON 是 Agent identity、stage、golden path、authority 和 generated-surface input 的唯一声明源；Python/TypeScript 只作为已声明 helper/authority function 的实现语言。
- 决策：OMA 当前实现口径固定为 `Standard Agent Pack + TypeScript agent-design/materialization helpers`。该描述不建立 TypeScript Agent 分支；更换 helper 实现语言不能要求修改 Pack ABI、stage graph、generated interface 或 Framework runtime。
- 决策：OMA 的 stage-decomposition 必须显式形成语言中立 implementation plan，并由 OPL scaffold/materializer 写入 target `pack_compiler_input`。新建 baseline 默认生成 pack-only profile；只有物理存在且已通过 target-repo 审计的 helper root 才能登记。未实现 helper need 进入 AgentPackPlan / capability requirement / developer work order。禁止通过 delivery-domain 关键词启发式选语言，也禁止预先伪造 helper 或用整个 `src/`/`packages/` 根目录掩盖 generic runtime。
- 影响：baseline delivery gate 必须拒绝 helper language 成为 Agent membership、私有 CLI/runtime/workbench owner 或第二 Pack source；OPL Framework 继续持有 scaffold、pack compiler、generated CLI/App/runtime 和 conformance。

### Foundry canonical policy body 只归 OPL Framework

- 决策：`standard_foundry_policies.json` 与 `foundry_agent_series.json` 只保存 release pin、OPL canonical consumer/contract refs、OMA identity 和 agent-building delta；stage-decomposition helper 从 OPL public consumer 读取 canonical body，并只合并 artifact morphology、OMA progress semantics 和 typed-blocker authority delta。
- 决策：generated target `foundry_agent_series.json` 同样只物化 canonical refs、release pin、target identity、OMA domain delta 与 false-authority boundary，不再复制 series design、workspace topology、membership 或 public projection body。
- 影响：OPL canonical contract 是唯一 shared policy truth；OMA 的 docs、tests、generated contracts 和本仓 JSON 均不得恢复同一 policy body。OPL owner policy release 必须实际导出 `foundry-agent-series-policy`；local source/link 验证不等于 release currentness。

### Framework import 由 OPL managed link 托管

- 决策：OMA 保留 `opl-framework/*` bare imports，但 `package.json` / lockfile 不声明或安装 `opl-framework`。OPL install/update/sync/reinstall 负责把当前 Framework root 物化为 agent root 下的 managed link；developer checkout 通过同一 OPL Connect 命令显式 repair。
- 决策：repo verification wrapper 只调用 OPL `link-framework --check --json` 并传播 typed failure / repair command；检查路径不得写 link，不得在 OMA 新增 resolver、Framework copy、tarball、`file:` dependency 或 package wrapper。
- 影响：npm lock 只持有 OMA 自身开发工具；Framework currentness、link target 和 repair authority 归 OPL owner readback。bare import 可解析只证明当前 link 可消费，不声明 Framework release currentness、runtime ready 或 OMA domain ready。

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
- 决策：`agent/stages/manifest.json` 是 OPL Pack 唯一 repo-tracked domain-owned declarative stage source；OPL 从它编译并持有 hosted `family_stage_control_plane`。本仓不保留 stage-control aggregate、source parts、leaf index、bundle manifest、同步命令或兼容入口。
- 影响：`contracts/pack_compiler_input.json`、`agent/stages/manifest.json` 和 pack tests 必须指向非 README 的真实文件；新增 stage/action/quality gate 先进入 manifest/pack/contracts，再同步人读说明。

### Stage 大小由 stage prompt 和 professional skill 的 AI 判断决定

- 决策：OMA stage 设计遵循 AI-first / contract-light。stage 主提示词负责 top-level stage graph、stage 大小和 closeout shape；repo-local professional skill 只在 stage 内需要专家方法判断时介入。一个 top-level stage 应只承载一个主要开放语义判断；确定性生成、校验、文件物化、helper receipt 和 readback 留在该 stage 内。多个独立开放判断需要不同 owner、知识源、quality gate、handoff recipient 或失败路由时才拆成不同 top-level stage。
- 决策：刻意保留的大 stage 必须暴露 typed subpacket 或 gate boundary，例如 `StageDecompositionSubpacketSet`。这些 subpacket 证明设计依据、transfer、pack、admission、morphology 与 build boundary refs 的存在和 provenance，不规定固定认知执行顺序，不升级成 OPL runtime stage，也不替代目标 stage graph 的语义拆分判断。
- 决策：artifact morphology 与 representative real task 在 graph 设计前参与 Stage 大小判断；domain/artifact/memory/quality/runtime/owner-receipt split 从设计开始贯穿。Source workflow step 必须有 adopt/adapt/merge/stage-internal/reject disposition，但不因原文编号自动成为独立 Stage。
- 决策：所有 OMA active Stage 主提示词收敛为目标、好结果、专业依赖/authority boundary 与 closeout。专业因果顺序保留在 skill/contract：source evidence/safe packet 先于其 claim、design admission 先于 materialization、materialized bytes 先于 build receipt、work order 先于 external result、external result 先于 delivery/optimizer closeout。其余工具、检查、比较和迭代顺序由 executor 决定。
- 决策：OMA stage admission 采用 Progress-First 修正口径。validator、schema 或 materializer 发现的 format、projection、ref、stage input、`requires` 或 expected receipt 缺口，如果可由有效设计对象、stage graph 和 authority refs 机械推导，应在同一 stage materialization/admission 内有界修正并继续推进；不能直接变成 terminal blocker，也不能拆成新的 runtime stage 或私有控制面。核心语义对象缺失、source/evidence 缺失、owner 决策缺失、authority 越权、forbidden claim、target truth 写入或无法推导的设计缺口仍必须 fail closed 到 route-back、typed blocker 或 human gate。
- 理由：OMA 的核心价值是 agent-building reasoning。若把 stage 大小交给 schema、validator 或脚本默认图，系统会把开放判断退化成固定流程；若把多个开放判断塞进一个大 stage，又会让某一步指令遵循失败污染整段产出。
- 影响：contracts、schema、validator 和 tests 只记录已选 stage graph、refs、subpacket chain、authority boundary、admission repair boundary 和 fail-closed 条件；它们不能作为 stage-size selector。OMA 不新增 generic runtime、scheduler、queue 或 generated surface 来解决 stage 大小或可修格式缺口问题。

### Target agent repo 目录标准归 OPL scaffold，OMA 只写领域语义

- 决策：OMA 生成新 target agent 时，目标 repo 的物理目录标准必须来自 OPL Framework `opl agents scaffold`；OMA 不维护并行目录模板、私有 scaffold 标准或 repo-local generated interface owner。
- 决策：`build-agent-baseline` 保留跨 owner 的硬依赖：admitted design/domain pack refs -> OPL scaffold materialization/validation -> generated interfaces -> AgentBuildReceipt -> thin evaluation request/work order -> OPL external result/reviewer/self-evolution -> target-owner closeout。Stage-decomposition 内的 design basis、transfer、pack plan、morphology 和 admission 可以相互迭代，但 evidence/safe packet 必须先于支持的 claim，admission 必须先于物化，build receipt 必须绑定物化后 bytes。`StageDecompositionSubpacketSet` 记录这些 refs 和 boundary，不固定内部认知顺序。
- 决策：OMA 的 canonical agent id 与 OPL Package id 都是 `oma`；`contracts/pack_compiler_input.json.canonical_agent_id` 必须与 package manifest 的 `agent_id`、`package_id` 一致。`domain_id`、repo slug、npm package name 与 Codex plugin slug 继续使用 `opl-meta-agent` 作为 carrier locator，不得通过 alias 维持双 package identity。Generated interface 不得从 domain id 推断 canonical identity。
- 决策：repo-tracked 和新生成的 Agent Package manifest 在未发布时保持 source-only，不预填 OCI `latest`、假 digest 或 non-live distribution proof。只有真实发布/registry 输入才携带 `distribution_payload`，并由 OPL Connect 严格校验 immutable ref 与 SHA-256。
- 决策：OPL external reference-design handoff 只采用 canonical `opl.reference_design_pattern_packet.v1` refs-only envelope；OMA 不复制其 required fields、不定义第二套 external packet ABI。OMA 校验 envelope/authority/non-claims，限制 semantic JSON-pointer 解引用在 packet 同目录，然后把被引用的 summary、transferable patterns、non-transferable constraints 和 authority notes 归一为 OMA-owned `ReferenceDesignPacket`。raw source、opaque packet、越界 pointer、缺 semantic refs 或 source-material mismatch 必须在物化前写 typed blocker。
- 决策：论文/PDF intake 不新增 OMA 或 OPL 专属 PDF parser runtime，也不增加把 raw PDF 直接塞进 baseline CLI 的 `--reference-design-file` 旁路。OPL Workspace 只负责 `workspace source ingest` 的保管、sha256 和 receipt；MinerU/Codex 负责 parse-once、提取 receipt、source anchors 和 canonical pattern packet；OMA 负责 `ReferenceDesignPacket -> TransferMap -> AgentPackPlan -> DesignAdmissionReceipt` 的语义迁移；OPL Pack/Foundry 负责 generated interface 与 evaluation。只有源文件 bytes 或提取方法变化时才重新提取。
- 决策：专家工作流 catalog 是 content-rich seed library，不是模板库。用户 paper/packet 是 primary design origin；seed 只能 fallback/secondary。`TransferMap` 为每个 source pattern/step 记录 adopted/adapted/merged/stage-internal/rejected disposition；`AgentPackPlan` 只为独立开放判断、owner、knowledge、gate、handoff 或 failure route 建 Stage。`DesignAdmissionReceipt` 在物化前，`AgentBuildReceipt` 在物化后。
- 决策：seed source provenance 的机器 owner 是 `contracts/expert_workflow_pattern_library.json#/anchor_catalog`。Step 继续使用字符串 `source_anchor_refs` ABI，但值只能是可解析的 opaque catalog key；官方 URL、章节/selector、support role、verification status 和 source version/fingerprint 留在 catalog entry，不把内部语义标签伪造成 URL fragment。只有官方来源明确给出工作顺序时才标 `source_derived`，并要求至少一条 `verified direct_workflow + workflow_source` 主锚；额外 synthesis/quality/evaluation anchor 只能作为支撑，不获得 direct authority。其余评价框架、报告准则、质量门和 OMA 自己增加的 framing/blocker/review/closure 一律标 `internal_synthesis`，写明 rationale，且不得声称 direct workflow 或 owner authority。Seed 进入 `ReferenceDesignPacket` 后必须保留 `authority_tier` 和 resolved anchor 子集。更新来源或 seed step 时必须同时更新 catalog、resolver negative tests 和本组 canonical docs。
- 理由：标准目录属于 OPL family 统一 scaffold / conformance；OMA 的核心价值是 agent-building reasoning、stage decomposition、artifact morphology、candidate package、developer work order 和 mechanism proposal，而不是复制 OPL Pack / Stagecraft / Connect / generated surface。
- 影响：README、目录存在、suite pass、generated interface readiness 或 scaffold validation 都不能单独声明新 target agent 完成；profile/catalog/template 只提供 OPL conformance 下限和 route/readback refs，scaffold 只提供物理骨架，不能替代参考设计提炼或 target agent 语义设计。可消费语义必须来自非 README pack files、domain-owned declarative stage manifest、typed closeout refs、owner route refs 和 delivery gate refs。

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
- 决策：OMA capability map 的重复 authority、forbidden surface、verification 与 owner-closeout policy 收敛到三个顶层 `capability_policy_profiles`；每个 capability 只保留 local profile ref。Profile 不改变 capability identity、canonical source/target paths、improvement tokens 或 owner authority；OPL conformance 必须先展开 profile，unresolved ref fail closed。
- 决策：`target_agent_feedback_external_suite` 是通用 OPL FeedbackOps external suite profile；OMA 只作为 generic consumer，把 target-agent feedback refs、source Agent Lab result ref、direct reviewer evidence、no-forbidden-write boundary、OPL work-order delegation aperture、target owner closeout refs 和 progress accounting 投影为 developer work order，不拥有 runner、queue、target truth、target worktree lifecycle 或 target owner receipt body。
- 决策：MAS `high-quality-medical-manuscript` 与 `reviewer_revision` feedback Agent Lab external suite 是标准 `agent_lab_external_suite` 输入，可被 `improve:external-suite` 消费为 `developer_patch_work_order`；work order 必须显式带 `target_agent=med-autoscience`、`source_agent_lab_result_ref`、`source_external_suite_intake`、`reviewer_evidence_refs`、false authority boundary、OPL work-order delegation aperture、target owner closeout refs 和 OPL family progress accounting。
- 决策：`build-agent-baseline` 生成 target agent scaffold 时必须跟随 OPL standard-stage-pack v2 和 Foundry Agent series policy，包括 tool affordance catalog/boundary、receipt schema refs、minimal authority function refs、L4/L5 entry gates、membership projection、standard public projection 和 workspace topology profile；delivery gate 只消费 scaffold validation readback，不能豁免或降级 blocked validation。
- 理由：source patch 必须可审计、可验证、可回滚，并且不能把质量判断或 owner acceptance 转交给 OMA 或 foreground developer。
- 影响：缺少 direct reviewer evidence、source refs、capability_map / target-owned explicit policy 命中、patch traceability、target verification、owner route、no-forbidden-write proof、closeout refs、delegation aperture、progress accounting 或 target owner receipt / typed blocker 时，只能返回 typed blocker / fail-closed validation。target domain truth、memory body、artifact body、quality/export verdict、owner receipt body 和 default promotion 仍不可写。

### 外部 work-order execution 与 post-absorb closeout 委托给 OPL

- 决策：`execute:external-work-order` 只是 OMA 对 OPL `work-order execute` primitive 的 shape validation / thin delegation entry。post-absorb target owner closeout hook 若存在，也由 OPL 调用，OMA 只记录 delegation proof。
- 理由：worktree lifecycle、runner、absorb、cleanup、owner closeout hook invocation、execution receipt 和 Agent Lab re-evaluation 是 OPL / target owner 控制面。
- 影响：OMA 必须保持 `owner_closeout_hook_delegated=true`、`target_owner_closeout_owner=target-domain via OPL`、`oma_can_write_owner_receipt=false` 的边界；不得实现 generic runner、queue、attempt ledger、absorb/cleanup loop 或 owner receipt writer。

### `build-agent-baseline` 的默认输入 authority 是 OPL StageRun query readback

- 决策：baseline materialization 必须通过 OPL public `standard-agent-action-stage-run` consumer 消费 StageRun query readbacks，并按 action catalog ordered `stage_route` 校验 target domain、exact attempt ref、accepted typed closeout、canonical completed outcome、ledger/packet identity 和无 conflict。OMA adapter 只保留 `oma_stage_closeout_payload` metadata 与 domain payload identity 校验，不复制通用 route/readback 解析。每个非首 stage 的 closeout `consumed_refs` 必须包含前一 accepted closeout ref，不能只按 stage id 排序跳过输入链。route 未闭合时返回 typed continuation且不生成 receipt；旧 direct script-authored graph、OMA-owned fixture/live runner 和 typed closeout CLI 旁路均无 compatibility path。
- 决策：OPL StageRun ledger 只持有 normalized closeout metadata 与 refs，不复制 OMA domain payload。需要完整设计/文件 payload 的 stage 必须使用 canonical `domain_owned_stage_output_ref` v1 envelope，`domain_id` 必须匹配 attempt，`output_ref` 必须同时出现在 closeout refs；OMA 当前只接受 attempt `workspace_root` 内的 `file://` output ref，并要求同 ref 的 `closeout_ref_metadata` 使用 OPL 白名单字段 `kind=oma_stage_closeout_payload` 和 SHA-256，拒绝 bytes drift、路径穿越、symlink escape、stage mismatch 和 closeout mismatch。
- 决策：`stage-decomposition` closeout 只拥有 file materialization plan，禁止夹带 file body；`agent-skeleton-build` closeout 独立拥有与计划一一对应的 materialized file bodies。目标 action schema pair 必须真实写入 target repo，并进入 `pack_compiler_input.required_domain_pack_paths` 与 build digest。
- 决策：source-derived / research-driven typed closeout 必须包含 `StageDecompositionSubpacketSet`；该对象只证明 `stage-decomposition` 内部认知步骤、refs、物化边界和 fail-closed checks，没有把这些 subpackets 升级成独立 OPL runtime stage。
- 决策：`build-agent-baseline` 对 closeout 先做严格 validator；若只缺少可从已声明设计对象确定生成的 `StageDecompositionSubpacketSet` 投影、ref、stage input / requires / expected receipt ref，则在同一个 `stage-decomposition` materialization 内做一次有界 deterministic repair，再重新严格验证。核心设计对象为空、pattern refs 缺失、authority boundary 破坏、forbidden claim 或无法从 target/design refs 推导的语义问题仍 fail closed。
- 理由：OMA 的核心价值在 AI-first stage decomposition 和 owner-gated pack generation，固定脚本图会把 domain reasoning 退化为 fallback materializer。
- 影响：foreign/nonterminal/conflicted/mismatched StageRun readback、free-text closeout、partial design refs、缺 independent gate policy、缺 quality gate declaration、缺 no-forbidden-write policy、file plan 夹带 body 或 self-review 都 fail closed；纯机械 subpacket 投影缺失不再直接 terminal blocker；不得恢复 no-`--domain-id` implicit fixture smoke、direct graph compatibility、默认 stage graph、private runner 或 fallback materialization route。

### 新建 target agent 分为 Foundry evaluation handoff 与 downstream delivery

- 决策：`build-agent-baseline`、`takeover:test` 和 `agent:evidence` 的 producer 终点是 AgentBuildReceipt、thin Foundry evaluation request 与 canonical Foundry evaluation work order；OMA 不本地编译或执行 suite，不写 Agent Lab result、Foundry execution receipt、target owner receipt、learning/scaleout ledger、promotion result 或 target-domain typed-blocker body。work order 使用完整 target identity、request/suite/task identity 和 canonical provenance，交给 `one-person-lab/OPL Foundry Lab` 的 `opl agent-lab evaluation-work-order execute`。
- 理由：AgentBuildReceipt 只证明 pack 构建，evaluation request 只证明 domain task intent，OPL-generated suite plan 才是唯一 framework-owned evaluation plan，work-order ready 只证明合法 consumer aperture。把任何一项包装成 suite result 或 delivery receipt，会同时制造第二 Agent Lab truth、第二 owner receipt authority 和不稳定的跨仓身份。
- 影响：旧 action-level `new_agent_delivery_gate` readback 删除。Producer 状态只允许是 ready for OPL Foundry Lab evaluation；完整 delivery 仍必须消费 OPL 返回的 target-bound suite result / execution receipt、independent reviewer evidence、`improve:external-suite` judgment，以及 target-owner receipt / blocker / human-gate closeout。缺 observations 时 OPL 返回平台 blocker；缺 OMA declarative work-order inputs 时 OMA 只返回 expected blocker ref，不伪造 result、receipt 或 blocker body。

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

### Source-shape 只保留 canonical audit 和单一 structure readback

- 决策：default surfaces 的物理缺席只记录在 `contracts/functional_privatization_audit.json`；OPL default-caller consumer 直接读取 `default_surface_boundary` 与 `retired_default_surface_ids`。OMA 不再持有逐 surface deletion-evidence 合同。
- 决策：script retention 只通过 `source-structure` / `source-structure:json` 暴露摘要；删除 compact/full cleanup readback aliases、重复 authority guard 和 dated count snapshot。
- 理由：第二 evidence contract 与多套只读 aliases 没有增加 authority，却会在 surface 已物理缺席后持续生成伪 worklist和旧入口传播。
- 影响：source-structure 继续 fail closed 校验 caller、source refs、retention classification 与 aggregate drift，但不能授权 physical delete、readiness、promotion、typed blocker body 或 owner receipt body。

### Source-derived design objects 使用 OPL Foundry ABI

- 决策：OMA 生成的 `ReferenceDesignPacket`、`TransferMap`、`AgentPackPlan` 与 `DesignAdmissionReceipt` 使用 `opl-framework/source-derived-agent-design-abi` 的 `opl_foundry_*` identity；OMA 不再为这些跨 producer 对象维护 `opl_meta_agent_*` identity alias。
- 理由：对象语义和设计判断仍由 OMA 持有，但 OPL Profile Spine、scaffold materializer 和未来其他 producer 需要一个与 producer 名称无关的稳定 machine interface。
- 影响：OMA 只提交 candidate semantics；物理 scaffold、文件 digest、post-materialization `opl_foundry_agent_build_receipt` 和 conformance 继续由 OPL Foundry Lab 持有。ResearchSynthesisPacket 等 OMA-only 设计输入仍保留 OMA identity。

## Superseded 决策入口

以下旧口径只作为 history/provenance 读，不再承担 current owner：

- 旧 direct script-authored graph、no-`--domain-id` implicit fixture smoke、`takeover:test --fixture` parser branch 和 direct graph compatibility path。
- 旧 active machine fields `external_agent_allowed`、`external_opl_compatible_agents_allowed`、external-agent takeover identifiers 和 OMA-specific Progress-First aliases。
- Repo-local plugin / Skill wrapper、sidecar/status/workbench shell、registry owner、Agent Lab runner、promotion gate、generic worktree lifecycle 和 compatibility facade。
- 逐条 proof/coverage/closeout 决策流水。当前结论折回本文、active plan、private inventory、contracts、source/tests；过程只保留在 `docs/history/process/`。
