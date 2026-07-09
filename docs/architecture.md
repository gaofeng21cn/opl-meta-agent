# opl-meta-agent 架构

Owner: `opl-meta-agent`
Purpose: `architecture_and_owner_boundary`
State: `active_truth`
Machine boundary: 本文是人读架构说明。机器真相继续归 `contracts/`、`agent/`、`runtime/authority_functions/`、source、CLI/API 行为、OPL Agent Lab result refs 和测试。

`opl-meta-agent` 是 OPL-based Foundry Agent，不是 OPL Framework 内置模块。它作为 OPL Foundry Agent 系列的 Agent Foundry 成员，复用 MAS、MAG、RCA 所用的 canonical `opl_foundry_agent_series_design_profile.v1`；系列差异只落在 `domain_specific_profile`、stage/action contracts 和 authority refs 中。OMA 读取 target agent spec / evidence / Agent Lab handoff，产出 candidate agent package、developer patch work order、target capability improvement candidate、mechanism patch proposal 或 typed blocker。

## Owner Split

- `opl-meta-agent` owns：agent-building semantics、intent brief、research brief、stage decomposition、candidate agent package policy、Agent Lab suite specs、baseline delivery receipt、online learning review policy 和 mechanism patch proposal 记录。
- `opl-meta-agent` owns as candidate author：每个 stage 的 `stage_executor_policy_candidate`，用于描述可试验的 executor / model / provider / capability / receipt 组合；这些 candidate 只是 refs-only policy proposal。
- `opl-meta-agent` owns as domain pack：`agent/knowledge`、`agent/prompts`、`agent/quality_gates`、`agent/skills`、`agent/stages` 下的领域引用文件，以及 `contracts/` 中声明这些文件、阶段、动作、handoff 和 authority boundary 的机器合同。`agent/skills/*.md` 是 OPL/generated skill surface 可引用的 domain skill declarations。
- `opl-meta-agent` owns as professional skills：`agent/professional_skills/*/SKILL.md` 下的 repo-local Codex-style 专业方法技能。Active skill 已收敛为 `agent-design/evolution`、`stage-pack/intent architecture`、`eval/takeover review` 和 `work-order/hygiene` 四个 workflow-level 方法；旧细粒度入口只保留 redirect/tombstone，不再写成独立 authority。它们由 stage prompt 按需路由，不是 generated Skill surface、runtime wrapper、target artifact、owner receipt、typed blocker 或 promotion gate state。
- `opl-meta-agent` can consume standard target-agent handoff：既有 OPL-compatible agent 的测试编排、自进化候选组织、developer patch work order、mechanism patch proposal 产出和 takeover receipt。
- `OPL Framework` owns：generic runtime、Agent Lab、standard scaffold、queue、attempt ledger、provider receipt、observability projection、optimizer/RL transition refs、stage executor policy read model、stage executor policy gate、work order execution / absorb / cleanup 和 promotion gates。
- target domain agent owns：domain truth、quality verdict、artifact authority、memory body、owner receipt，并负责提供 Agent Lab / OMA 可消费的标准 descriptor、handoff、owner-route、owner closeout hook、receipt、verification 和 no-forbidden-write refs。

OPL family `Foundry Agent OS` target delta 当前由 [OMA Foundry Agent OS 目标差异页](./active/foundry-agent-os-target-delta.md) 维护。架构读法是：`OPL Agent OS + Declarative Agent-Building Pack + Agent-Building Authority Kernel + Improvement Capability Registry`。Capability Registry 由 OPL `Atlas + Pack + Stagecraft` 承载 catalog / ABI / use policy；OMA 只声明 agent-building capability refs、mechanism candidate policy 和 script-to-pack retirement gates。默认 reader 必须回到 `current_owner_delta`，OPL generated surface、Agent Lab、Vault、Console、Runway、Pack 或 Capability Registry 均不能写 target truth、target artifact body、target memory body、target quality/export verdict、target owner receipt body 或 default promotion authority。

`contracts/foundry-agent-os-domain-kernel-manifest.json` 是这条 owner split 的机器合同入口。它把 agent-building semantics、candidate package materialization policy、developer work-order materialization、mechanism proposal、target-agent no-forbidden-write proof、route-back evidence、owner receipt 和 typed blocker 固定为 OMA kernel，把 Agent Lab runtime、suite execution、generated interface bundle、work-order execute/absorb/cleanup、target owner closeout hook invocation、projection、Vault lineage 和 capability ABI 固定为 OPL upcollect surface；架构与测试均不得从 Agent Lab suite pass 或 generated interface readiness 推导 target-agent readiness。

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

1. `build-agent-baseline` 调用 `opl agents scaffold --target-dir ... --domain-id ... --domain-label ... --json` 生成标准目录。
2. OMA 写入最小 domain pack refs，并用 stage-decomposition typed closeout 物化 target stage / prompt / skill / quality / knowledge refs。
3. OMA 调用 `opl agents scaffold --validate <targetAgentDir> --json` 和 `opl agents interfaces --repo-dir <targetAgentDir> --json`，让 OPL 持有 scaffold validation 与 generated interface projection。
4. Agent Lab suite、independent reviewer、new-agent delivery gate、target owner receipt / typed blocker / human gate 共同决定收口形态。

这条链路的边界是：OPL scaffold 负责目录和接口标准；OMA 负责目标智能体的语义设计、候选包和受限改进建议；target domain owner 持有 domain truth、artifact body、quality/export verdict、owner receipt 和 typed blocker。`writeMinimalAgentDomainPack` 里的 README 只做人读索引，不能作为 semantic pack source；可被合同消费的 source 必须是非 README pack files、stage control plane refs 和 closeout packet refs。

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

CLI、MCP、Skill、product-entry、OpenAI tool 和 AI SDK 描述由 OPL Framework 通过 `opl agents interfaces --repo-dir <repo>` 从 `contracts/action_catalog.json` 与 `contracts/stage_control_plane.json` 统一生成。本仓不实现私有 MCP server、通用 CLI wrapper、product-entry shell 或 Skill 包装层；OMA 自身的 Codex plugin 只作为 `agent/primary_skill/SKILL.md` 的 repo-local materialized carrier，generated interface bundle 仍由 OPL Framework 统一生成。仓内脚本只作为领域 smoke / minimal authority action 的可调用目标。生成接口的权限上限写入 `contracts/pack_compiler_input.json`、`contracts/generated_surface_handoff.json` 与 `contracts/foundry_agent_series.json` 的 canonical `series_design_profile` / OMA-owned `domain_specific_profile`：它可以 invoke/project 已声明 action、registration refs、App projection refs、scaleout evidence refs 与 minimal authority function，不能写 domain truth、memory body、artifact body、quality/export verdict，也不能成为 generated surface owner。

## Domain Pack Structure

`agent/` 当前是可验证 domain pack，而不是占位目录。`contracts/pack_compiler_input.json` 通过 `canonical_semantic_pack_root="agent/"` 和 `canonical_semantic_pack_role="repo_source_declarative_meta_agent_pack"` 指向 canonical semantic pack；`required_domain_pack_paths` 只列真实 principles、prompts、stage policies、skills、quality gates 和 knowledge policies，不把 README 当作机器 required path。`contracts/standard-agent-principles-adoption.json` 声明 OMA 采用 OPL Standard Agent AI-first Principle Pack，并把 `domain_intake` 映射到 `intent-intake`；`agent/principles/opl-standard-agent-principles.md` 是 OPL 原则投影，`agent/principles/domain-specialization.md` 是 OMA 领域特化。`tests/contracts-domain-pack.test.ts` 校验这些文件非空、无占位；`tests/contracts-stage-control.test.ts` 校验 `stage_control_plane` 的 prompt、skill、knowledge、evaluation refs 解析到真实 `agent/` pack 文件。

`contracts/stage_control_plane.json` 保持 existing consumer aggregate path；维护入口是 `contracts/stage_control_plane.source.json`、`contracts/stage_control_plane.leaf-index.json` 和 `contracts/stage_control_plane.parts/**`。`contracts/stage_control_plane.bundle-manifest.json` 是 OPL Pack Source / Generated Bundle metadata，记录 source roots、leaf dirs、generator commands、source digest、do-not-edit consumer surface 和 false-authority flags。修改 stage control plane 时只编辑 source / parts，再运行 `npm run stage-control:write` 生成 aggregate 与 bundle manifest，并用 `npm run stage-control:check` 或 `scripts/verify.sh structure` 检查 drift。`contracts/stage_control_plane.json` 是 generated consumer surface，不能手工编辑为第二真相源。`contracts/source_structure_policy.json` 和 `scripts/check-source-structure.ts` 提供 family-level source-structure lane；默认 `structure` / `source-structure` 是 advisory，显式 `structure:strict` / `source-structure:strict` 才作为硬失败；旧 `line-budget` aliases 已退役。

## Optimization

`opl-meta-agent` 可以生成 prompt、skill、stage-policy、tool-policy、few-shot、rubric-gap candidate refs。候选进入 OPL Agent Lab gates 后才能成为 baseline 变更。

## Self-Learning Loop

当前 `build-agent-baseline` 闭环按以下顺序运行；入口可以来自 Codex Skill 的自然语言请求，也可以来自参数化 CLI：

1. `agent-skeleton-build`：Codex 从用户自然语言归一 `domain_id`、`domain_label`、`delivery_domain`、`target_brief` 和 stage-decomposition attempt input 后，启动 live Codex `stage-decomposition` attempt，或消费显式 typed closeout packet；该 closeout 持有目标 stage graph、action refs、pack 文件、independent gate policy 和 quality gate declaration。脚本只校验并物化 pack draft，再调用 OPL `agents scaffold` 校验用户指定的目标 agent package；`--domain-id` 是硬要求；脚本不再保留隐式 fixture smoke、隐式 default graph 或兼容 fallback。
2. `eval-suite-build`：写入 `agent-lab-suite.json`，只包含 refs、recovery probes、scorecard refs 和 promotion gate。
3. `baseline-run`：调用 OPL `agent-lab run --suite`，由 OPL Agent Lab 返回 suite result。
4. `baseline-delivery`：消费结构化 AI reviewer evaluation 和 stage-decomposition closeout proof，写入 `baseline-delivery-receipt.json`，只声明 baseline package refs、review provenance、generated-from-closeout proof 和 acceptance gates；缺 reviewer evaluation、空 critique/suggestions、source refs 只有 suite/scaffold refs、缺 typed closeout proof、free text closeout、partial refs、缺 independent gate policy、缺 quality gate declaration 或 self-review 时 fail closed。
5. `online-learning`：写入 `online-learning-candidate.json` 与 `mechanism-patch-proposal.json`，候选保持 gated，不自动推广默认 agent、不训练或部署模型权重。

自举闭环还会调用 `opl agents interfaces --repo-dir <candidate-agent>`，证明由 `OPL Meta Agent` 生成的目标智能体也能被 OPL 统一投影出 CLI / MCP / Skill / product-entry 接口包。

## Target Agent Testing Takeover

`target-agent-takeover` 读取目标 agent repo/package 的 descriptor/contracts，生成 `agent_lab_external_suite`，调用 OPL `agent-lab run`，再写入 `testing_takeover_self_evolution_receipt`、gated online-learning candidate 和 mechanism patch proposal。

`improve-from-external-agent-lab-suite` 读取目标 domain 的 Agent Lab suite/result，并消费与 baseline delivery 相同 schema 的 AI reviewer evaluation。reviewer critique、suggestions、source refs 和 provenance 会进入 target capability improvement candidate、developer patch work order 和 mechanism patch proposal refs；可识别 suggestion 只在目标 agent `contracts/capability_map.json` 声明 matching improvement token，或 target-owned production acceptance 显式声明 change-ref policy 时，映射到 `patch_traceability_matrix` 的 required patch refs、editable surfaces 和 target repo file hints。Agent Lab handoff 只保留 external entry、evidence/context 与 fixture 场景，不复制 patch target authority。缺少 capability_map / production acceptance policy 命中时，OMA 返回 typed blocker 并要求 target owner 声明 capability-map policy 或返回 blocker；旧 `external_agent/*` generic patch-ref fallback 不再生成 executable source patch work order。

`agent:evidence` 读取目标 agent 的 standard production evidence handoff，生成 `agent_production_evidence_suite`、Agent Lab run result、developer patch work order、target capability improvement candidate、mechanism patch proposal 或 typed blocker。MAS/MAG 等目标 agent 只通过 domain refs 出现在输入与 owner route 中；命令、suite kind、输出文件和 OMA surface kind 保持 target-agent generic。

Usable landing 的当前真实 target patch-loop / scaleout evidence 已由 MAS/MAG refs-only closeout 折回 `contracts/real_target_agent_scaleout_evidence.json`：blocked suite / OMA work order / patch traceability / target verification / runtime read-model consumption / workspace proof / no-forbidden-write / owner receipt or typed blocker / absorption / cleanup / Agent Lab re-evaluation 都有可投影 refs。后续证据要求是把同一 shape 扩展到更多真实 target 与真实 source patch / rerun 样本。work order、generated-surface readiness、suite pass 或 refs-only scaleout closeout 仍只能算消费面 proof，不能写成 target domain ready、quality verdict、artifact readiness、owner receipt body 或 default promotion。

OMA 侧执行入口保持薄委托：`execute:external-work-order` 读取已经生成的 developer patch work order，只校验 refs-only shape 与 authority boundary，然后调用 OPL Framework 的 `opl work-order execute --work-order <path> --json`。target worktree lifecycle、generic runner、queue、attempt ledger、absorb、cleanup、post-absorb owner closeout hook invocation 和 execution receipt 均由 OPL Framework primitive / target owner 控制面持有；Agent Lab 只消费 re-evaluation refs；OMA 不在本仓实现第二套执行器、worktree 管理或 owner receipt writer。

MAS `reviewer_revision` feedback self-evolution trigger 进入 OMA 时按标准 external-suite 消费：`improve-from-external-agent-lab-suite -> execute-external-work-order -> target owner closeout/readback`。如果 MAS 侧只物化了 suite/result，且 trigger contract 声明 `contract_itself_triggers_execution=false`，OMA/App readback 必须显示 `runnable_pending`，不能显示 `executed`。执行态只能由 OPL work-order execute receipt 加 target owner closeout/readback 证明；OMA 只持有 materialized suite consumer 和 work-order materializer 边界。

该 takeover 只覆盖测试接管和候选生成。target domain truth、quality verdict、artifact body、memory body、默认 agent promotion authority 继续由目标 domain owner 持有；receipt 和 candidate 必须显式声明 `can_write_target_domain_memory_body=false`、`can_promote_default_agent_without_gate=false`。

## Mechanism Patch Proposal

Mechanism patch proposal 是 self-learning / takeover loop 的 proposal-only 输出。它把一次 Agent Lab segment run 转成三个受控段：

1. `observe`：引用 `segment_run_ref` 与 suite/receipt/candidate source refs。
2. `diagnose`：引用 `evidence_delta_ref`，说明本轮证据变化。
3. `edit`：引用 `next_mechanism_candidate_ref` 与 candidate 的 proposed change refs。

可编辑面只允许是 agent-building 机制面，例如 prompt policy、skill policy、stage policy、Agent Lab suite policy、takeover review policy、optimizer candidate policy 或 quality gate policy。proposal 不能直接写 target truth、memory body、artifact body、quality/export verdict，也不能绕过 explicit promotion gate。
