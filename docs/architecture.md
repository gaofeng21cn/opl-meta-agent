# opl-meta-agent 架构

Owner: `opl-meta-agent`
Purpose: `architecture_and_owner_boundary`
State: `active_truth`
Machine boundary: 本文是人读架构说明。机器真相继续归 `contracts/`、`agent/`、`runtime/authority_functions/`、source、CLI/API 行为、OPL Agent Lab result refs 和测试。

`opl-meta-agent` 是 OPL-based Foundry Agent，不是 OPL Framework 内置模块。它作为 OPL Foundry Agent 系列的 Agent Foundry 成员，通过 OPL `foundry-agent-series-policy` public consumer 复用 canonical series policy；本仓只保存 policy release pin、canonical refs、`domain_specific_profile`、stage/action contracts 和 authority refs。OMA 读取 target agent spec / evidence / Agent Lab handoff，产出 candidate agent package、developer patch work order、target capability improvement candidate、mechanism patch proposal 或 typed blocker。

OMA 的新建 agent intake 路线分四类：`builtin_profile`、`hybrid`、`source_derived_design`、`research_driven_design`，既有 agent 接管/改进走 takeover / improvement route。`builtin_profile` 和 `hybrid` 先消费 OPL `profiles select/inspect` 的 selected profile refs 与 requirements；`source_derived_design` 用在无内置 profile trigger 命中但用户提供论文/PDF/repo/产品案例等 reference design 时，OMA 必须保留 source-derived route receipt、source refs、pattern packet refs、transferable pattern requirements 和 capability plan requirements，并先把论文/参考系统里的设计思路提炼成 `ReferenceDesignPacket`，再映射成 `TransferMap`，落成 `AgentPackPlan`，通过 `DesignAdmissionReceipt` 后再生成 target agent stage pack；`research_driven_design` 用在用户只有模糊想法且没有参考设计时，OMA 先上网/外部 source 调研专家实践，保留 `research_source_refs`、`expert_practice_notes`、`research_synthesis_refs` 和 research-driven route receipt，并先提炼成 `ResearchSynthesisPacket`，再映射成 `TransferMap`、`AgentPackPlan` 和 `DesignAdmissionReceipt`。两条设计依据路线都用 `StageDecompositionSubpacketSet` 把 `design-basis -> transfer-planning -> agent-pack-planning -> design-admission -> build-verification` 固化为 stage-decomposition 内部 typed cognitive chain；它不是 5 个 OPL runtime stage，也不是 target domain truth，而是物化前后 refs、顺序和 fail-closed 条件的机器可读证明。物化后统一保留 `AgentBuildReceipt` / `build_receipt` 作为构建溯源与 conformance 证明，不再把 BuildReceipt 当作第四个设计对象。内置 profile 只作为 lower-bound guardrail；OMA 不能因 catalog 缺模板而停止，也不能导入外部 runtime、私有数据、target truth、domain verdict 或 promotion authority。每个 design-derived stage 必须声明 `stage_pattern_source_refs`；target-only owner gate 不能替代当前 stage 的 design-pattern 消费证明。`DesignAdmissionReceipt` 必须把 design-derived stage refs、target-only requirements、rejected source patterns、forbidden claims 和 refs-only authority boundary 留在 OPL 可读 surface 中。

外部 reference design 的机器边界只有一条：OPL 按 `opl.reference_design_pattern_packet.v1` 交付 body-free refs envelope，OMA 校验 envelope 后只在 packet 同目录安全解引用其 JSON-pointer semantic refs，再物化 OMA-owned content-rich `ReferenceDesignPacket`。OMA 不定义第二套 external packet ABI。`TransferMap` 保留每个 source pattern/step 的 anchor、provenance、适用限制和 adopt/adapt/merge/stage-internal/reject disposition；`AgentPackPlan` 根据开放判断、owner、knowledge、gate、handoff 与 failure route 决定 Stage，不机械复制 source 编号。raw/opaque/越界或 source-material mismatch 在物化前 fail closed；专家 catalog 只作 seed fallback/secondary，用户 packet 始终是 design origin。

专家工作流 seed provenance 由 `contracts/expert_workflow_pattern_library.json` 根层 `anchor_catalog` 持有，`source_anchor_refs` 只是 `seed-anchor:oma/...` opaque key，不是可解引用 URL，也不允许用虚构 fragment 冒充章节。每个 catalog entry 记录 source ref、官方 locator、section/selector、support role、verification status 与 source version/fingerprint；`source_derived` 必须至少有一条来自 `workflow_source` 的 `verified + direct_workflow` 主锚，也可以附加 synthesis/quality/evaluation 支撑锚，`internal_synthesis` 则必须保留 rationale 且不得引用 direct-workflow authority。NIH、NSF、ICMJE、EQUATOR、PRISMA、TRIPOD/PROBAST、DECIDE-AI、CONSORT-AI、SPIRIT-AI 等评价/报告来源默认只作综合或质量约束。OMA 物化 seed 时同时保留 pattern `authority_tier` 和本 pattern 使用的 `resolved_source_anchors` 子集，使 `ReferenceDesignPacket`、`AgentPackPlan` 与 build proof 离开 catalog 根目录后仍可审计。resolver 每次消费 seed 时校验整库，任何 unresolved anchor、source/version mismatch、direct role/currentness 漂移或 synthesis 越权都 fail closed；维护者更新来源版本时必须同步 source catalog、anchor entry、step provenance 与 focused negative tests。

标准 Agent Pack ABI 只从 `opl-framework/standard-agent-pack-abi` 消费；该 bare import 由 OPL Connect 管理的 Framework link 解析，OMA 的 `package.json` / lockfile 不安装或固定 Framework 实现。OMA 不在 `standard_foundry_policies` 复制 ABI body。source-derived / research-driven 的正式 `AgentBuildReceipt` 只由 OPL 在 target files 全部物化并计算 digest 后写盘，`build-agent-baseline` 的 action output 同时暴露 receipt path/ref；预物化 OMA surface 只保留 candidate 与 `expected_build_receipt_ref`。

标准 Agent 的外部接口按语言中立模型读取：`agent/` Markdown 与 `contracts/` JSON 共同定义 Agent identity 和 Pack ABI；`runtime/authority_functions/`、`runtime/native_helpers/` 或等价已声明 source refs 只承载可选 helper implementation。OMA 自身因此是 `Standard Agent Pack + TypeScript agent-design/materialization helpers`，不是 TypeScript Agent。OMA 新建目标仓时默认交给 OPL scaffold 一个 pack-only implementation profile；只有已经物理存在并通过 target-repo 审计的 helper root 才可登记。尚未实现的 helper need、建议 language 和验证边界进入 AgentPackPlan / capability requirement / developer work order，不能按 delivery-domain 文本启发式猜语言或伪造成已落地 helper。

Repo-tracked `contracts/opl_agent_package_manifest.json` 和 OMA 生成的 target manifest 都是 source-only sidecars。未发生真实发布时不写 `distribution_payload`、OCI ref、rolling tag 或 digest；真实 published registry 路径继续由 OPL Connect 要求 immutable payload 与有效 SHA-256。Framework link 的 policy、物化、校验和 repair receipt 归 OPL package owner surface；OMA verification wrapper 只调用只读 `--check`，不实现 resolver、复制 Framework 或在检查路径写 link。

Reference-driven route 还执行三条硬门：每个 `reference_design_source_ref` 必须由 typed packet 的 `source_material_ref` 覆盖；有用户 packet 时 seed 只保留 context/disposition，不进入 active TransferMap 或 stage graph；`AgentPackPlan` 的每个 source workflow step 必须在 `stage_control_plane.stages` 一一物化，并带匹配的 provenance、internal synthesis rationale、prompt、skill、knowledge、tool affordance 与 quality gate refs。非英文或混合语言 intake 通过 typed `intent_signals` 调用 OPL selector；selector 只补 lower-bound profile，不改变 reference design 的设计来源地位。

Stage 大小属于 OMA 的 AI 设计判断，不属于 schema-driven generation。`agent/prompts/stage-decomposition.md` 持有 top-level decomposition 与 closeout shape；`agent/professional_skills/oma-stage-pack-intent-architecture/SKILL.md` 持有 stage 内 intent / pattern / stage-pack 方法判断。一个 top-level stage 只承载一个主要开放语义判断；确定性生成、校验、文件物化、helper receipt 和 readback 留在 stage 内。需要不同 owner、知识源、quality gate、handoff recipient 或失败路由的开放判断才拆 stage；同一判断的机械步骤应合并或删除。`StageDecompositionSubpacketSet` 是保留大 stage 时暴露内部认知链的 typed proof，不是私有 runtime 子流程，也不是把 stage-size 判断外包给 validator。

## Owner Split

- `opl-meta-agent` owns：agent-building semantics、intent brief、research brief、stage decomposition、candidate Agent Pack policy、build receipt candidate/expected ref、declarative Agent Lab suite specs、Foundry evaluation work-order candidate、external-result judgment 和 mechanism candidate 记录。
- `opl-meta-agent` owns as candidate author：每个 stage 的 `stage_executor_policy_candidate`，用于描述可试验的 executor / model / provider / capability / receipt 组合；这些 candidate 只是 refs-only policy proposal。
- `opl-meta-agent` owns as domain pack：`agent/knowledge`、`agent/prompts`、`agent/quality_gates`、`agent/skills`、`agent/stages` 下的领域引用文件，以及 `contracts/` 中声明这些文件、阶段、动作、handoff 和 authority boundary 的机器合同。`agent/skills/*.md` 是 OPL/generated skill surface 可引用的 domain skill declarations。
- `opl-meta-agent` owns as professional skills：`agent/professional_skills/*/SKILL.md` 下的 repo-local Codex-style 专业方法技能。Active skill 已收敛为 `agent-design/evolution`、`stage-pack/intent architecture`、`eval/takeover review` 和 `work-order/hygiene` 四个 workflow-level 方法；旧细粒度入口只保留 redirect/tombstone，不再写成独立 authority。它们由 stage prompt 按需路由，不是 generated Skill surface、runtime wrapper、target artifact、owner receipt、typed blocker 或 promotion gate state。
- `opl-meta-agent` can consume standard target-agent handoff：既有 OPL-compatible agent 的 descriptor/evidence、OPL-returned suite result / execution receipt 和 owner-route refs，并产出 takeover evaluation work order、target capability judgment、developer patch work order 或 expected blocker ref。
- `OPL Framework` owns：generic runtime、Agent Lab、standard scaffold target IO/path safety/digest/final build receipt、queue、attempt ledger、provider receipt、observability projection、optimizer/RL transition refs、stage executor policy read model、stage executor policy gate、work order execution / absorb / cleanup 和 promotion gates。
- target domain agent owns：domain truth、quality verdict、artifact authority、memory body、owner receipt，并负责提供 Agent Lab / OMA 可消费的标准 descriptor、handoff、owner-route、owner closeout hook、receipt、verification 和 no-forbidden-write refs。

OPL family `Foundry Agent OS` target delta 当前由 [OMA Foundry Agent OS 目标差异页](./active/foundry-agent-os-target-delta.md) 维护。架构读法是：`OPL Agent OS + Declarative Agent-Building Pack + Agent-Building Authority Kernel + Improvement Capability Registry`。Capability Registry 由 OPL `Atlas + Pack + Stagecraft` 承载 catalog / ABI / use policy；OMA 只声明 agent-building capability refs、mechanism candidate policy 和 script-to-pack retirement gates。默认 reader 必须回到 `current_owner_delta`，OPL generated surface、Agent Lab、Vault、Console、Runway、Pack 或 Capability Registry 均不能写 target truth、target artifact body、target memory body、target quality/export verdict、target owner receipt body 或 default promotion authority。

`contracts/foundry-agent-os-domain-kernel-manifest.json` 是这条 owner split 的机器合同入口。它把 agent-building semantics、candidate package materialization policy、Foundry evaluation/developer work-order materialization、mechanism candidate、target-agent no-forbidden-write proof、route-back evidence和 OMA-owned blocker refs 固定为 OMA kernel，把 Agent Lab runtime、suite/result/receipt ledger、work-order execute/absorb/cleanup、target owner closeout hook invocation、generated interface projection、Vault lineage 和 capability ABI 固定为 OPL upcollect surface；架构与测试均不得从 work-order ready、Agent Lab suite pass 或 generated interface readiness 推导 target-agent readiness。

## Stage Executor Policy Boundary

Codex CLI 仍是 OMA 每个 stage 的 first-class default executor。`selected_executor` 保持 `codex_cli`；stage-level executor policy candidate 不等于 executor 切换，也不等于质量等价声明。

OMA 只声明和生成 `stage_executor_policy_candidate`：例如为 `eval-suite-build` 提出 `antigravity_cli` / `gemini-3.5-flash` / `high` / `google` 的 HTML suite authoring candidate，或为 `web-experience-research` 提出 `claude_code` reviewer-diversity candidate。非默认 executor candidate 必须带显式 adapter / binding / receipt；缺 `executor_binding_ref` 时 fail closed 为 `blocker:missing_non_default_executor_binding_ref`，不能启动试验。

OPL / Agent Lab 负责执行试验、记录 stage executor policy read model、运行 policy gate、签发 executor / stage attempt receipts，并决定是否进入后续 promotion gate。OMA 不复制 Agent Lab runner、queue、attempt ledger、executor adapter 或 provider binding；OMA 也不能直接切换默认 executor、不能绕过 gate promote 默认 executor、不能把 suite pass / candidate completeness 写成质量等价。

## Domain-Owned Stage Completion Policy

OMA 生成的每个 target stage 必须带 `stage_completion_policy`。该 policy 固定阶段完成判断属于 `domain_stage`：stage 内 executor / reviewer / owner surface 负责判断本 stage 是否已形成可接力结果，并输出标准 `stage_closeout_packet_ref`。OPL 只消费这个 closeout packet 来执行 runtime transition、attempt ledger、queue handoff 和 next-stage scheduling；OPL 不判断内容质量、不把 provider completion 升级成 domain completion，也不根据文件存在、suite pass 或 conformance pass 自动关闭 stage。

标准 closeout packet 至少要把结果归入 `completed_and_continue`、`completed_and_wait_owner`、`route_back`、`blocked` 或 `rejected`。packet 可携带 `owner_receipt_ref`、`typed_blocker_ref`、`human_gate_ref` 或 `route_back_ref`，由 domain / stage owner 表达内容判断、阻塞、人工门或返工路径。OPL 的责任是验证 packet shape、记录 attempt、执行接力和暴露 read model；内容是否足够进入下一阶段由 domain stage 自己在 closeout 前完成。

这条 policy 解决的是 stage loop 的默认语义：`stage 执行 -> stage-owned closeout judgment -> OPL runtime transition`。如果 target agent 的 stage 只声明 provider attempt completion、只依赖文件落盘、只依赖 suite pass，或要求 OPL 通过其他 channel 判定内容是否完成，Agent Lab / OMA 都应把它识别为 conformance blocker，而不是把 runtime 成功误认为 stage 完成。

## Standard Consumer Boundary

Agent Lab 与 `opl-meta-agent` 是标准消费者。目标 agent 兼容它们，而不是它们分别兼容每个目标 agent。

- Agent Lab 消费 `agent_lab_external_suite`、`agent_production_evidence_suite`、recovery probes、scorecard refs、promotion gate refs、mechanism evolution refs 和 production evidence gate refs。Agent Lab 不持有 MAS/MAG/RCA 专用 suite kind，也不签发目标 domain verdict。
- OMA 消费目标 agent 的 production/live acceptance、Agent Lab handoff、generated-surface handoff、owner receipt contract、editable surface policy、verification command refs 和 no-forbidden-write proof refs。OMA 产出 target-agent generic work order / candidate / proposal / blocker，不维护 MAS/MAG/RCA 私有 command family。
- 目标 agent 可以在 owner routes、receipt refs、artifact refs 或 smoke fixture 中出现自己的 domain id；这些 domain refs 不能反向污染 Agent Lab / OMA 的顶层 contract vocabulary。

## Standard Target Agent Repo Generation

OMA 生成 target agent 时只提供 agent-building 语义，不维护私有 repo 目录标准。目标 repo 的物理骨架必须来自 OPL Framework 的 standard agent scaffold；OMA 的 stage-decomposition、candidate package 和 developer work order 只能填充 domain-owned pack refs、stage refs、artifact morphology refs、owner route refs 和 closeout refs。

当前默认链路是：

1. `build-agent-baseline` 校验 OPL StageRun closeout，形成 OMA-owned target identity、stage graph、domain file bodies、descriptor/capability projection 和 `build_receipt_candidate`。
2. OMA 写出 `opl_agent_scaffold_materialization_request`，并只调用 `opl agents scaffold --materialize-request <request.json> --target-dir <targetAgentDir> --json`。OPL 负责相对路径与 symlink escape 校验、标准 scaffold、allowlist merge、目标仓文件 IO、pack compiler input、materialized digests 和最终 `opl_agent_scaffold_materialization_receipt` / build receipt；命令缺失、非零或 receipt shape 不符时 OMA fail closed，不回退本地写入。
3. OMA 调用 `opl agents scaffold --validate <targetAgentDir> --json` 和 `opl agents interfaces --repo-dir <targetAgentDir> --json`，消费 OPL 持有的 scaffold validation 与 generated interface projection。
4. Agent Lab suite、independent reviewer、new-agent delivery gate、target owner receipt / typed blocker / human gate 共同决定收口形态。

这条链路的边界是：OPL scaffold 负责目录标准、物理 materialization、digest 和最终 build receipt；OMA 只负责目标智能体的语义设计、domain-authored request、候选包和受限改进建议；target domain owner 持有 domain truth、artifact body、quality/export verdict、owner receipt 和 typed blocker。OPL scaffold 自带的 README 只做人读索引，不能作为 semantic pack source；可被合同消费的 source 必须是非 README pack files、stage control plane refs 和 closeout packet refs。

目标仓的语言替换测试是强制架构检查：将一个 Python helper 改写为 TypeScript（或反向）时，若必须修改 Agent identity、stage/prompt/skill/knowledge/quality-gate pack、golden path、generated interface 或 Framework runtime，说明实现语言已经泄漏进 Agent 架构，目标仓不能按标准形态收口。

## Self-Evolution Responsibility Split

自进化闭环的 owner split 固定为三段：

1. `OPL Agent Lab`：运行 suite，归并 evidence / root cause / targeted fix / predicted impact / next-run falsification refs，比较 variant candidates，执行 risk-tiered promotion gate，并输出 refs-only App/workbench read model。
2. `opl-meta-agent`：消费 Agent Lab result 与目标 agent handoff，生成 developer patch work order、target capability improvement candidate、mechanism patch proposal 或 typed blocker；work order 必须说明 `agent_evolution_decision_ref`、`failure_class`、target owner route、target editable surfaces、forbidden surfaces、expected behavior delta、verification refs、owner closeout readback、rollback/version refs、no-forbidden-write proof 和 target runtime/read-model consumption verification。
3. `target domain agent`：通过 target-domain owner closeout hook 签发 owner receipt 或 typed blocker，持有 domain truth、quality verdict、artifact authority、memory body 和最终 owner acceptance。

因此，OMA 的 self-evolution 不是“自己判断并推广目标 agent”，而是把可审计证据转成受限 patch loop。Codex 只能在 work order 授权的文件范围内修改目标仓；目标验证和 owner receipt 回填后，下一轮仍回到 Agent Lab 做 evidence delta、falsification 和 promotion gate 评估。

`oma-agent-design-evolution` 是本仓 workflow-level 专业能力，不属于 MAS ScholarSkills。它把失败路由到 `stage-route`、`specialist-skill`、`tool-connector`、`quality-gate`、`read-model-currentness`、`authority-boundary`、`app-observability` 或 trajectory/owner-route policy gap，并据此组织 OMA-owned agent design/source patch work order、mechanism proposal、route-back 或 typed blocker shape。MAS、MAG、RCA 等 target domain 仍只通过标准 handoff、owner route、feedback refs 和 owner closeout refs 参与；OPL Agent Lab / FeedbackOps / App 只提供 refs-only evidence、projection 或队列，不持有 MAS study truth。

## Clean-Room Skill Pattern Intake

`skillnerds/xskill` 的吸收边界是 pattern source，不是依赖或运行时。OMA 只学习以下 agent-building 组织形态：

- trajectory atomization：把 skill 改进拆成可引用的 observe / diagnose / edit / evidence atoms，并进入 stage attempt、reviewer evidence、mechanism proposal 或 work-order refs。
- candidate buffer：把多个 skill / prompt / policy 候选保持为 refs-only buffer，等待 Agent Lab 评估和 OPL promotion gate，而不是在 OMA 内直接采用默认版本。
- per-skill version / canary evidence：每个 skill 级变更必须带 version、rollback、canary 或 target verification refs；缺这些 refs 时只能输出 typed blocker。
- team redaction / sync refs：跨人或跨团队复用只能表达为 redacted source refs、sync receipt refs 和 owner route refs，不能复制目标 domain memory body、artifact body、truth 或 reviewer verdict。

不吸收 xskill daemon/runtime、generic scheduler、skill installer、team server 或任何替代 OPL execution plane 的实现。Agent Lab、promotion gate、queue、attempt ledger、worktree lifecycle、absorb / cleanup 和 generated interfaces 仍归 OPL Framework；OMA 只产出 refs-only proposal、developer work order 或 typed blocker。

## Runtime

本仓只保留 `runtime/authority_functions/` 下的最小 authority refs。长期运行、唤醒、排队、恢复、attempt ledger、sidecar/projection dispatch、status read model 和 operator workbench 由 OPL Framework 生成或托管。

`contracts/stage_run_kernel_profile.json` 持有 OMA 的 StageRun Kernel profile。当前 canary 固定为 `intent-intake -> stage-decomposition-candidates -> mechanism-and-test-review -> owner-approval-or-typed-blocker`，并通过 `contracts/stage_run_canary_evidence.json` 落一份 `controlled_fixture_not_live_domain_progress` evidence。该 fixture 只持有 stage_run / manifest / current pointer refs、candidate generation / grounded reflection / comparative selection / revision / meta-review / independent quality gate refs、role artifact refs、owner receipt 或 typed blocker closeout refs 和 controlled canary operator summary；它证明 canary shape 可被 repo-local contracts/tests 消费，不证明 live domain progress。

canary 中的 tool refs 只表达 affordance：研究、脚手架、Agent Lab、review 和 artifact materialization 能力可以被 executor 选择使用，但不能写成硬编码 workflow、替代 stage reasoning、签发 domain verdict、触发 closeout、绕过 independent gate，或绕过 owner approval / typed blocker。provider completion、file presence、read model、conformance pass 与 same-attempt self review 都不能成为 StageRun closeout。

operator summary 是面向操作者的受控 fixture 摘要，只能展示 stage sequence、strategy refs、terminal owner receipt 或 typed blocker ref、blocked claims 和 next owner delta ref。`overclaim_boundary` 将允许声明压到 repo-local canary shape、controlled strategy refs 和 closeout ref 存在；它明确禁止 live domain progress、target-agent/domain/artifact/quality/export readiness、Agent Lab promotion readiness、production readiness、App live rendering、human approval、default promotion 或 OPL 物化 owner receipt body。

legacy runtime residue guard 是审计守卫，不是清理器或兼容层。它只绑定 functional privatization audit、default-caller deletion evidence、source-purity scan receipt 和 source-purity tests，证明 repo-tracked source/contracts/docs 里旧 runtime/status/workbench wrapper 没有恢复为 active owner；它不能写 runtime state、read model、closeout，也不能授权物理删除文件。

旧 scripts/runtime wrapper/status shell/workbench wrapper 的当前身份是 OPL-hosted runtime/projection 的迁移输入、diagnostic 或 provenance refs。它们不得恢复为 repo-owned CLI/MCP/Skill/product wrapper、status/workbench shell、sidecar/projection owner、Agent Lab runner、queue/attempt ledger、worktree lifecycle、promotion gate 或 compatibility route。OMA 保留的是 agent-building domain truth、Agent Lab / quality verdict refs、artifact authority refs、owner receipt refs、typed blocker refs 和 domain knowledge / skills / tools / quality gate refs。

## Codex-Attempt-Native Landing

当前 usable landing 机器面已经从 contract-ready 推进到 developer work order / patch-loop 控制面。`opl-meta-agent` 的 `improve:external-suite` 与 `agent:evidence` 以真实 target agent handoff 为输入，读取 allowed editable surfaces、blocked evidence、verification refs、owner route、no-forbidden-write refs 和 rollback/version refs，输出 stage attempt refs、developer patch work order、mechanism proposal 或 typed blocker。developer work order 必须包含 AHE-style failure evidence、root cause、targeted fix、predicted impact 四字段，以及 target repo file hints、required verification refs、rollback/version refs、owner route refs、no-forbidden-write proof 和 target runtime/read-model consumption verification。Codex 可以在 developer work order 授权的文件范围内实施 patch，但不能越权写 target truth、memory body、artifact body、quality/export verdict 或 owner receipt。

Executor-first work order bundle 的必需 refs 固定为 `executor_lease_ref`、`reviewer_pool_refs`、`patch_execution_bundle_ref` 和 `target_closeout_refs`。这些 refs 来自或回填到 OPL work-order execute primitive、Agent Lab re-evaluation 和 target owner 控制面：executor lease 说明 selected executor 的工具、网络、sandbox、worktree、subagent、预算、TTL、risk lane 和 expected receipt 边界；reviewer pool 说明独立 Codex reviewer attempt 的 direct evidence、source refs、critique/suggestion/verdict 和 no-shared-context provenance；patch bundle 说明受限 patch traceability；target closeout refs 说明目标验证、owner receipt / typed blocker、no-forbidden-write、cleanup 和 Agent Lab re-evaluation。缺任何关键 refs 时只能输出 typed blocker，不能输出 executable work order。

Efficiency non-regression 是同一 target-agent generic work order 的一个证据投影，而不是新的 domain command family。`improve:external-suite` 与 `agent:evidence` 只消费标准 suite / production evidence handoff 中的 `quality_floor_refs`、`latency_baseline_refs`、`usage_cost_refs`、`cache_reuse_refs`、`target_verification_refs`，以及 refs-only `*_efficiency_handoff_projection`，并把它们投影到 developer work order、completeness、machine closeout 和 required verification refs。缺 quality floor refs 或缺 reviewer direct evidence 时 fail closed typed blocker；OMA 不能为了效率优化写 target truth、memory body、artifact body、quality/export verdict 或 owner receipt。

Patch-loop closeout 的 machine refs 仍固定为 blocked suite result、developer patch work order、patch traceability matrix、target repo verification、target runtime/read-model consumption、workspace environment proof、no-forbidden-write proof、target owner receipt or typed blocker、patch absorption、worktree cleanup 和 Agent Lab re-evaluation；App/workbench 与 scaleout projection 还必须暴露 reviewer evidence/provenance refs，包括 reviewer evaluation、source/direct evidence、verdict、predicted impact、independence、provenance 和 reviewer pool refs。target owner receipt or typed blocker 可由 OPL 在 absorb 后调用 target-domain owner closeout hook 获得；OMA 只在 delegation receipt 中记录 `owner_closeout_hook_delegated=true`、`target_owner_closeout_owner=target-domain via OPL` 和 `oma_can_write_owner_receipt=false`。`contracts/real_target_agent_scaleout_evidence.json` 当前记录 MAS/MAG 两个真实目标的 refs-only scaleout closeout；这证明的是 OMA -> target owner handoff / scaleout evidence gate，不是 MAS/MAG domain readiness、质量/导出裁决、owner receipt body、App live rendering 或 OMA default promotion authority。

独立 Codex reviewer attempt 是采用门槛的一部分。reviewer 必须基于 direct evidence、无共享执行上下文、带 reviewer provenance、source refs、critique/suggestions/verdict 和 rollback/canary/version refs；generated surface proof、suite pass、schema completeness 或 contract completeness 只能作为输入证据，不能替代 reviewer / owner verdict。

## Registration And Product Projection

`contracts/opl_domain_manifest_registration.json` 是 OPL domain registry / discovery 的 refs-only 输入。它汇总 descriptor、stage/action contracts、pack compiler input、generated surface handoff、authority function refs、owner receipt、App workbench projection 和 scaleout evidence contract。registry owner 仍是 OPL Framework；本仓只提供 registration metadata refs。

`contracts/app_workbench_projection.json` 是 OPL App/workbench 的 refs-only projection contract。它允许展示 target brief、candidate package、Agent Lab results、developer work order、mechanism patch proposal 和 scaleout evidence 的 refs/status/receipt/blocker。App shell、workbench runtime state 和 drilldown rendering 由 OPL Framework / OPL App 持有；`opl-meta-agent` 不写 target domain truth、memory body、artifact body、quality/export verdict 或默认 agent promotion。

上述 registration / App projection 是 landing 的消费输入，不是 landing 完成证明。当前 OPL generated interface read-model 可消费本仓 contracts，OPL App/operator drilldown 可消费 OMA patch-loop refs；production completion 仍必须来自 OPL 主仓或 App 侧的 registry discovery receipt、App render / screenshot / runtime drilldown receipt、`long_soak_refs` closeout，以及目标 agent owner receipt。

`contracts/real_target_agent_scaleout_evidence.json` 定义真实目标 agent delivery 与多目标 scaleout 的 evidence gate。当前状态是 `closed_by_two_real_target_refs_only_receipts`：MAS/MAG 两个目标提供 delivery receipt、owner receipt / typed blocker refs、Agent Lab result refs、no-forbidden-write proof refs 和 cleanup closeout refs，满足当前 refs-only multi-target gate。它仍禁止把 implicit fixture bootstrap、testing takeover smoke、suite pass、developer work order、mechanism patch proposal 或 refs-only closeout 升级成 target domain ready、quality/export verdict、owner receipt body、App live rendering 或 default promotion。

## Generated Interfaces

CLI、MCP、Skill、product-entry、OpenAI tool 和 AI SDK 描述由 OPL Framework 通过 `opl agents interfaces --repo-dir <repo>` 从 `contracts/action_catalog.json` 与 domain-owned `agent/stages/manifest.json` 编译生成；hosted `family_stage_control_plane` 是 OPL Pack 生成物。本仓不实现私有 MCP server、通用 CLI wrapper、product-entry shell 或 Skill 包装层；OMA 自身的 Codex plugin 只作为 `agent/primary_skill/SKILL.md` 的 repo-local materialized carrier，generated interface bundle 仍由 OPL Framework 统一生成。仓内脚本只作为领域 smoke / minimal authority action 的可调用目标。生成接口的权限上限写入 `contracts/pack_compiler_input.json`、`contracts/generated_surface_handoff.json`、OPL canonical Foundry policy 与 `contracts/foundry_agent_series.json` 的 OMA-owned `domain_specific_profile`：它可以 invoke/project 已声明 action、registration refs、App projection refs、scaleout evidence refs 与 minimal authority function，不能写 domain truth、memory body、artifact body、quality/export verdict，也不能成为 generated surface owner。

Generated interface identity 只读取 `contracts/pack_compiler_input.json.canonical_agent_id="oma"`；`contracts/opl_agent_package_manifest.json` 的 `agent_id` 与 `package_id` 都必须等于 `oma`。`domain_id="opl-meta-agent"`、repo slug、npm package name 与 Codex plugin slug 继续表示 carrier locator；OPL 不得从 locator 推断 canonical identity，也不得通过 alias 维持第二个 package identity。

## Domain Pack Structure

`agent/` 当前是可验证 domain pack，而不是占位目录。`contracts/pack_compiler_input.json` 通过 `canonical_semantic_pack_root="agent/"` 和 `canonical_semantic_pack_role="repo_source_declarative_meta_agent_pack"` 指向 canonical semantic pack；`required_domain_pack_paths` 只列真实 manifest、principles、prompts、stage policies、skills、quality gates 和 knowledge policies，不把 README 当作机器 required path。`agent/stages/manifest.json` 显式持有 11 个 stage 的 kind、goal、policy/prompt/knowledge/gate refs、allowed actions、requires/ensures、transition 和 trust lane；`canonical_agent_id="oma"` 与 `target_domain_id="opl-meta-agent"` 分离。`contracts/standard-agent-principles-adoption.json` 声明 OMA 采用 OPL Standard Agent AI-first Principle Pack，并把 `domain_intake` 映射到 `intent-intake`；`agent/principles/opl-standard-agent-principles.md` 是 OPL 原则投影，`agent/principles/domain-specialization.md` 是 OMA 领域特化。`tests/contracts-domain-pack.test.ts` 校验 manifest 与 pack refs 非空、可解析、无占位；generated-interface test 校验 OPL Pack 消费 manifest 后仍输出 `agent_id=oma`、`target_domain_id=opl-meta-agent`。

新增或修改现役 stage graph 必须改 `agent/stages/manifest.json` 与被引用的 domain pack 文件；本仓不跟踪 hosted stage-control aggregate、拆分 source、leaf index、bundle manifest 或同步器。`contracts/source_structure_policy.json` 和 `scripts/check-source-structure.ts` 提供 family-level source-structure lane；默认 `structure` / `source-structure` 是 advisory，显式 `structure:strict` / `source-structure:strict` 才作为硬失败；旧 `line-budget` aliases 已退役。

## Optimization

`opl-meta-agent` 可以生成 prompt、skill、stage-policy、tool-policy、few-shot、rubric-gap candidate refs。候选进入 OPL Agent Lab gates 后才能成为 baseline 变更。

## Self-Learning Loop

当前 `build-agent-baseline` 闭环按以下顺序运行；入口可以来自 Codex Skill 的自然语言请求，也可以来自参数化 CLI：

1. `build-agent-baseline` 只消费 OPL StageRun query readbacks，并按 action catalog 的 ordered `stage_route` 校验同域 identity、exact attempt ref、accepted typed closeout、canonical completed outcome、无 conflict 和不可跳步。route 未闭合时返回 typed continuation，不生成 receipt。OPL ledger 只运输 closeout identity 和 refs；需要 domain payload 时，closeout 使用 canonical `domain_output={surface_kind=domain_owned_stage_output_ref, version=domain-owned-stage-output-ref.v1, domain_id, output_ref}`，且 `output_ref` 同时存在于 closeout refs。OMA 只接受 attempt `workspace_root` 内的 `file://` ref，并要求同 ref 的 OPL canonical metadata 使用 `kind=oma_stage_closeout_payload` 和 SHA-256，防 bytes drift、path traversal 与 symlink escape，再复核 stage/closeout identity。`stage-decomposition` payload 只持有目标 stage graph、action refs、文件物化计划、independent gate policy、quality gate declaration，以及 source-derived / research-driven 路线的 `StageDecompositionSubpacketSet`；`agent-skeleton-build` payload 独立持有与计划一一对应的文件正文。脚本严格校验两者并只对可机械推导的 subpacket 投影做一次有界 repair，随后调用 OPL `agents scaffold` 校验目标 agent package。OMA 不启动私有 stage attempt，也不保留 fixture/live runner、隐式 default graph 或兼容 fallback。
2. `eval-suite-build`：写入 thin `foundry-evaluation-request.json`，只包含 domain task intent、quality/improvement/promotion refs 和 exact false-authority boundary；不包含 target identity、environment、probe、scorecard spec、completion policy、suite plan、observation/pass/fail/gate status。
3. `baseline-run`：把完整 target identity、request/suite/task identity 与 canonical source/reviewer/candidate provenance 绑定到 `foundry-lab-work-order.json`；OPL Foundry Lab 再编译唯一 suite plan，producer 到此只声明 ready for OPL Foundry Lab evaluation。
4. OPL 通过 `opl agent-lab evaluation-work-order execute --work-order <work-order.json> --output <dir>` 执行并返回 target-bound suite result / execution receipt；没有 observations 时必须返回平台 blocker，OMA 不自填 result/receipt。
5. `improve:external-suite` 显式消费 `--suite-result`，输出 no-source-patch judgment、expected blocker ref 或 developer patch work order；实际 patch、verification、re-evaluation、absorb/cleanup 和 target-owner closeout 继续由 OPL / target owner 持有。
6. `baseline-delivery` 只有在 OPL evaluation、independent reviewer、self-evolution 和 owner closeout refs 齐全后才可收口；AgentBuildReceipt 或 work-order ready 不能替代该 downstream evidence。

自举闭环还会调用 `opl agents interfaces --repo-dir <candidate-agent>`，证明由 `OPL Meta Agent` 生成的目标智能体也能被 OPL 统一投影出 CLI / MCP / Skill / product-entry 接口包。

## Target Agent Testing Takeover

`target-agent-takeover` 读取目标 agent repo/package 的 descriptor/contracts 与 independent reviewer evidence，生成 thin takeover evaluation request、canonical Foundry evaluation work order、gated self-evolution candidate ref 和 mechanism candidate ref。它不调用 Agent Lab runner、suite-plan compiler，不写 suite result、takeover/owner receipt、learning ledger 或 promotion result。

`improve-from-external-agent-lab-suite` 必须同时读取 declarative suite、显式 OPL Foundry Lab suite result 和 AI reviewer evaluation。reviewer critique、suggestions、source/direct evidence 与 provenance 进入 target capability improvement candidate 和 developer patch work-order semantic request；可识别 suggestion 只在 target `contracts/capability_map.json` 声明 matching improvement token，或 target-owned production acceptance 显式声明 change-ref policy 时，映射到 `patch_traceability_matrix`。缺少 suite result、Foundry execution receipt、quality floor 或 target-owned patch policy 时，OMA 只返回 missing fields 与 expected typed-blocker ref，不物化 target-domain blocker body，也不生成 executable work order file。

`agent:evidence` 读取目标 agent 的 standard production evidence handoff，只生成 thin production-evidence evaluation request、Foundry evaluation work order 和 proposal-only candidate refs。它不生成 Agent Lab suite plan/run result、owner receipt、learning/scaleout ledger、promotion result 或 target-domain typed-blocker body。MAS/MAG 等目标 agent 只通过 domain refs 出现在 target identity 与 owner route 中；命令、suite kind、输出文件和 OMA surface kind 保持 target-agent generic。

Usable landing 的当前真实 target patch-loop / scaleout evidence 已由 MAS/MAG refs-only closeout 折回 `contracts/real_target_agent_scaleout_evidence.json`：blocked suite / OMA work order / patch traceability / target verification / runtime read-model consumption / workspace proof / no-forbidden-write / owner receipt or typed blocker / absorption / cleanup / Agent Lab re-evaluation 都有可投影 refs。后续证据要求是把同一 shape 扩展到更多真实 target 与真实 source patch / rerun 样本。work order、generated-surface readiness、suite pass 或 refs-only scaleout closeout 仍只能算消费面 proof，不能写成 target domain ready、quality verdict、artifact readiness、owner receipt body 或 default promotion。

OMA 侧执行入口保持薄委托：`execute:external-work-order` 读取已经生成的 developer patch work order，只校验 refs-only shape 与 authority boundary，然后调用 OPL Framework 的 `opl work-order execute --work-order <path> --json`。target worktree lifecycle、generic runner、queue、attempt ledger、absorb、cleanup、post-absorb owner closeout hook invocation 和 execution receipt 均由 OPL Framework primitive / target owner 控制面持有；Agent Lab 只消费 re-evaluation refs；OMA 不在本仓实现第二套执行器、worktree 管理或 owner receipt writer。

MAS `reviewer_revision` feedback self-evolution trigger 进入 OMA 时按标准 external-suite 消费：`improve-from-external-agent-lab-suite -> opl work-order execute -> target owner closeout/readback`。如果 MAS 侧只物化了 suite/result，且 trigger contract 声明 `contract_itself_triggers_execution=false`，OMA/App readback 必须显示 `runnable_pending`，不能显示 `executed`。执行态只能由 OPL work-order execute receipt 加 target owner closeout/readback 证明；OMA 只持有 suite consumer、agent-building judgment 和 work-order semantic request 边界。

该 takeover 只覆盖 evaluation handoff 和候选 refs 生成。target domain truth、quality verdict、artifact body、memory body、owner closeout 和默认 agent promotion authority 继续由 target owner / OPL 持有；work order 与 candidate 必须显式声明 OMA 不能执行 suite、写 result/owner receipt 或无 gate promotion。

## Mechanism Patch Proposal

Mechanism patch proposal 是 self-learning / takeover loop 的 proposal-only 输出。它把一次 Agent Lab segment run 转成三个受控段：

1. `observe`：引用 `segment_run_ref` 与 suite/receipt/candidate source refs。
2. `diagnose`：引用 `evidence_delta_ref`，说明本轮证据变化。
3. `edit`：引用 `next_mechanism_candidate_ref` 与 candidate 的 proposed change refs。

可编辑面只允许是 agent-building 机制面，例如 prompt policy、skill policy、stage policy、Agent Lab suite policy、takeover review policy、optimizer candidate policy 或 quality gate policy。proposal 不能直接写 target truth、memory body、artifact body、quality/export verdict，也不能绕过 explicit promotion gate。
