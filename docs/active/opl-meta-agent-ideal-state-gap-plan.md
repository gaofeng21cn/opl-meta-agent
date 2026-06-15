# opl-meta-agent 理想目标态差距与完善计划

Owner: `opl-meta-agent`
Purpose: `ideal_state_gap_plan`
State: `active_plan`
Machine boundary: 本文是人读 gap / completion plan。机器真相继续归 `contracts/`、`agent/`、`runtime/authority_functions/`、source、OPL Agent Lab result refs、developer work-order receipts、target owner receipts / typed blockers、candidate refs 和 tests。

## 当前唯一真相

本文是 `opl-meta-agent` 当前完成口径、功能/结构差距、测试/证据差距和下一轮 Agent prompt 的 single Active Truth owner。

- North-star 目标态只维护在 [opl-meta-agent 理想目标态](../references/opl-meta-agent-ideal-state.md)。
- 当前公开状态摘要维护在 [状态](../status.md)。
- 私有实现分类、脚本收薄、default-caller tail 和上收候选维护在 [私有实现与 OPL 迁移台账](./opl-private-implementation-migration-inventory.md)。
- 文档生命周期和每份文档唯一职责维护在 [文档组合治理](../docs_portfolio_consolidation.md)。
- dated closeout、proof snapshot、coverage tranche 和过程流水只作为 history/provenance 读取。

Currentness policy：本文不冻结 run date、branch、worktree、commit SHA、receipt id、动态 counts、read-model 输出或 closeout 流程。带日期的 refs 只作为证据 provenance；当前状态仍以 live contracts、source、tests、OPL read models 和本仓最新核心 docs 为准。

## 当前结论

- `opl-meta-agent` 是 OPL-compatible Foundry Agent，不是 OPL Framework 内置模块。
- 理想物理形态是 `Declarative Agent-Building Pack + OPL generated/hosted surfaces + minimal agent-building authority functions`。
- Purpose-first owner-delta 是默认完成口径：OMA 只输出 target-agent semantics、developer work order、target capability / mechanism candidate 或 typed blocker，并把下一步写成某个 target owner、OPL Framework / Agent Lab / App 或 human gate 欠的 owner delta、receipt、gate 或 blocker。
- 当前 source-shape truth 是：没有发现 repo-owned generic runtime、generated shell、workbench、sidecar 或 compatibility surface；`functional_structure_gap_count=0` 不能升级成 strict purity 完成态、OPL 已接管脚本面或 physical delete authority。
- Script-to-pack 细节的 SSOT 是 `docs/active/opl-private-implementation-migration-inventory.md`、`runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy/script_to_pack_retirement_gates` 和 `tests/source-purity.test.ts`。本文只保留当前 gap 读法：脚本面仍是 strict source-purity hygiene tail；没有对应 machine gate 证据时，不能写成已退役、已由 OPL 接管或可恢复 compatibility surface。
- OMA 不能成为第二 Agent Lab 或第二 OPL Framework。`purpose_first_owner_delta_gate.second_framework_guard` 固定允许输出为 candidate package、developer patch work order、target capability candidate、mechanism proposal 或 typed blocker；Agent Lab runner、promotion gate、queue/attempt ledger、work-order execute/absorb/cleanup、registry/generated interface、App/workbench 和 target owner closeout hook invocation 都归 OPL / App / target owner。
- 当前未完成项主要是测试/证据尾项：OPL generated/default caller consumption tail、OPL registry / App 真实 discovery/render receipt、后续 cohort 的 repeat long-soak / live drilldown 证据、后续真实 source patch -> rerun -> owner receipt 样本、独立 Codex reviewer direct-evidence verdict、跨目标 agent 标准 handoff 收敛、domain refs-only adapter thinning 和持续 script-to-pack hygiene。已闭合样本只证明 refs-only scaleout / new-agent consumption / stage-replay typed-blocker handoff shape；不声明 target domain ready、quality/export verdict、owner receipt body、App live rendering、human approval、default promotion 或 family production ready。
- OPL 侧当前已能把 OMA production-consumption read model 读成 refs-only verified ledger；live 当前性以 `opl runtime oma-production-consumption list --json` 为准。Active plan 不冻结 receipt 数量、long-soak / typed-blocker 分布、dated refs 或旧 production-acceptance 字段；这些动态证据只作为 contracts / OPL read-model / history provenance 读取，不能替代后续 target cohort 的 repeat long-soak evidence。
- OPL stage replay missing-receipt ledger 已把 `oma_baseline_owner_review` 读成 domain-owned typed blocker closure。该 closure 只说明 baseline owner review receipt pending；不授权 human approval、replay success、domain ready、production ready 或默认 promotion。
- Strict source-purity 仍有 `scripts/` materializer/helper 收薄和 OPL primitive replacement 尾项；per-script 分类、active caller、已迁回合同的 policy 细节和退役门回到私有实现迁移台账与 machine guards。
- 已闭合或已有样本的 production-consumption、new-agent consumption、stage replay typed blocker 证据只作为 contract / OPL read-model / history provenance 读取；本文不复制动态 receipt counts、worklist 字段或 dated cohort closeout。
- OMA 不走 MAS/MAG/RCA 的 plugin packaged structure；外显入口保持 OPL generated skill surface / generated interface bundle。

禁止误写：

- 不能把 generated surface proof、registration readiness、App projection readiness、suite pass、schema completeness、contract completeness、work-order shape、source-shape conformance、refs-only scaleout closeout 或 OPL refs-only consumption 写成 production ready、domain ready、quality verdict、App live rendering、owner receipt body、human approval 或 default promotion。
- 不能把 Agent Lab / OMA 写成 MAS、MAG、RCA 专用兼容层。正确口径是标准 OPL Agent 提供 Agent Lab / OMA 可消费的 handoff、suite seed、owner route、receipt、no-forbidden-write 和 verification refs。
- 不能把 `scripts/` 中的 smoke / materializer / helper 写成 OPL generic runtime、Agent Lab runner、queue、attempt ledger、registry owner、App shell、worktree lifecycle owner、target truth writer、target owner closeout hook owner 或 promotion gate。

## 目标态

`opl-meta-agent` 的目标是构建、接管、修复和持续改进 OPL-compatible 高价值知识交付智能体。它读取用户意图、目标领域材料和目标 agent 的标准 handoff surface，形成可审计的 agent brief、stage plan、domain pack、quality gates、Agent Lab suite seed、baseline receipt、developer patch work order、online-learning candidate 和 mechanism patch proposal。

Owner split 固定为：

| Owner | 持有内容 |
| --- | --- |
| `opl-meta-agent` | agent-building semantics、declarative pack、candidate package policy、Agent Lab suite seed、developer work-order policy、target capability candidate、mechanism proposal、typed blocker 和 minimal authority functions |
| OPL Framework / Agent Lab / App | generic runtime、standard scaffold、generated interfaces、queue、attempt ledger、provider receipt、Agent Lab execution、promotion gate、registry/discovery、App/workbench shell、work-order execute / absorb / cleanup |
| target domain agent | domain truth、memory body、artifact body、quality/export verdict、owner receipt、default promotion authority、target owner closeout hook 和标准 handoff refs |

## 当前完成进度

| Progress item | Status | Current evidence | Remaining boundary |
| --- | --- | --- | --- |
| Standard domain pack and Foundry Agent identity | `done` | `agent/` pack、`contracts/pack_compiler_input.json`、`contracts/foundry_agent_series.json`、`tests/contracts-domain-pack.test.ts`、`tests/contracts-foundry-series.test.ts` | 不把 README、目录存在性或 human prose 当成 machine-required pack path。 |
| Generated interface / registry / App projection input | `done_with_external_consumption_tail` | `contracts/generated_surface_handoff.json`、`contracts/opl_domain_manifest_registration.json`、`contracts/app_workbench_projection.json`、OPL generated interface read model | Generated / registry / App live rendering owner 仍是 OPL / App；OMA 不声明 generated surface ownership。 |
| Work-order and mechanism proposal materialization | `done_with_more_real_loop_tail` | `build-agent-baseline`、`takeover:test`、`improve:external-suite`、`agent:evidence`、`execute:external-work-order`、matching tests | 只能输出 candidate package、developer work order、target capability candidate、mechanism proposal 或 typed blocker；target truth、artifact、memory、quality verdict 和 owner receipt body 仍归 target owner。 |
| StageRun canary and overclaim guard | `done_as_controlled_canary` | `contracts/stage_run_kernel_profile.json`、`contracts/stage_run_canary_evidence.json`、`tests/contracts-stage-run-kernel.test.ts` | Controlled fixture 只证明 repo-local canary shape；不声明 live domain progress、production readiness、human approval、App rendering 或 default promotion。 |
| Source shape / no-resurrection guard | `generic_shell_absent_with_script_hygiene_tail` | `contracts/functional_privatization_audit.json`、`contracts/default_caller_deletion_evidence.json`、`runtime/authority_functions/meta-agent-authority-functions.json`、`tests/source-purity.test.ts` | `functional_structure_gap_count=0` 只证明 repo-owned wrapper/runtime/workbench shell absent；scripts/materializers 仍按 script-to-pack gate 持续收薄。 |
| Retired legacy alias and wrapper tails | `retired_and_guarded` | retired-surface provenance、private inventory 和 source-purity guards | 本文只保留退役状态；具体 no-resurrection 清单回到 `docs/history/process/retired-surface-provenance.md`、私有实现迁移台账和 machine guards。 |
| Production-consumption / new-agent scaleout / patch-loop evidence | `current_refs_only_scaleout_gate_closed_with_future_cohort_tail` | production acceptance contracts、`contracts/real_target_agent_scaleout_evidence.json` 的 MAS/MAG two-target closeout、new-agent consumption evidence refs、OPL refs-only production-consumption read model、target patch-loop work-order shape | 当前 gate 只关闭 refs-only scaleout evidence；仍需 OPL/App registry discovery、App render/runtime drilldown、后续 target cohorts、repeat long-soak、independent reviewer direct evidence 和真实 source patch / owner gate 样本。 |

## 已落地

| Area | 当前状态 | 主要证据 | 边界 |
| --- | --- | --- | --- |
| Standard domain pack | `done` | `agent/` pack、`contracts/pack_compiler_input.json`、`contracts/stage_control_plane.json`、`tests/contracts-domain-pack.test.ts`、`tests/contracts-stage-control.test.ts` | README 和 prose 章节不作为 machine required path。 |
| Cognitive Kernel adoption | `done_as_advisory_contract` | `contracts/cognitive_kernel_adoption.json`、`contracts/golden_path_profile.json`、`agent/tools/domain_affordances.md`、`contracts/pack_compiler_input.json`、`contracts/stage_control_plane.json`、`tests/cognitive-kernel-adoption.test.ts` | 只约束 OMA stage-internal tool affordance、strategy refs、candidate policy、independent gate 和 owner-delta handoff；不把脚本、tool catalog 或 OMA work order 写成第二 Agent Lab、promotion gate、worktree lifecycle owner、registry/App shell、target truth writer 或 target owner receipt body owner。 |
| Foundry Agent series pin | `done_for_structural_conformance` | `contracts/foundry_agent_series.json`、package dependency pin tests | 关闭 structural conformance blocker；不授权 domain ready、quality/export verdict、artifact/memory body、owner receipt 或 default promotion。 |
| Generated / registration / App projection | `done_with_external_consumption_tail` | `contracts/generated_surface_handoff.json`、`contracts/opl_domain_manifest_registration.json`、`contracts/app_workbench_projection.json` | OPL owns generated interfaces、registry 和 App shell；OMA 只提供 refs-only inputs。 |
| Stage-Native compiler refs | `done_as_ref_templates_with_split_parts` | `contracts/stage_control_plane.json`、`scripts/lib/stage-native-artifact-contract.ts`、`scripts/lib/stage-decomposition-pack-draft-parts/`、`tests/stage-decomposition-materializer.test.ts`、`tests/contracts-stage-control.test.ts` | 生成 target agent pack 时包含 physical kernel locator、conformance 和 workbench consumption refs-only templates；不创建 runtime state、不 owner promotion、不管理 target worktree、不写 owner receipt body。旧 `stage-decomposition-pack-draft.ts` barrel re-export 已退役；closeout fixture builder、pack validator、file materializer 和 shared refs/helper 由 concrete parts 直接承接并纳入 machine gate；这仍是 retained materializer/helper，不是 OPL primitive parity 或整组退役授权。 |
| External work-order execution delegation | `done_as_thin_delegation` | `npm run execute:external-work-order`、`tests/execute-external-work-order.test.ts` | 只校验 refs 和委托 `opl work-order execute`；不持有 worktree lifecycle、runner、absorb、cleanup 或 owner receipt body。 |
| Stage executor policy candidates | `done_as_candidate_only` | `contracts/stage_control_plane.json`、stage executor policy tests | OMA 只声明 refs-only candidate；试验、binding、receipt、gate 和默认 executor promotion 归 OPL / Agent Lab。 |
| Production acceptance / consumption follow-through | `done_with_repeat_evidence_tail` | `contracts/production_acceptance/meta-agent-production-acceptance.json`、`contracts/production_acceptance/new_agent_consumption_evidence.json`、OPL production-consumption read model / refs-only ledger、OPL stage replay missing-receipt ledger | Production-consumption、new-agent consumption 和 stage-replay human-gate blocker 只证明 refs-only consumption / typed blocker handoff shape；dated cohort 细节和 read-model 字段留在 contracts、OPL read models 或 history provenance。当前 ready、新消费样本和 typed blocker 都不授权 target domain ready、family production ready、未来 cohort long-soak、human approval 或默认 promotion。 |
| Purpose-first owner-delta gate | `active_gate` | `docs/status.md`、`runtime/authority_functions/meta-agent-authority-functions.json#purpose_first_owner_delta_gate`、`contracts/production_acceptance/meta-agent-production-acceptance.json#purpose_first_owner_delta_gate` | OMA 只给 target-agent semantics、developer work order、target capability / mechanism candidate 或 typed blocker；下一步必须指向明确 owner delta / receipt / gate / blocker。 |
| Script morphology | `active_hygiene` | `runtime/authority_functions/`、`scripts/lib/*`、私有实现迁移台账 | 当前脚本只允许是 authority implementation、smoke helper、fixture/proof helper 或 developer work-order materializer；它们不得成为第二 Agent Lab、promotion gate、registry/App shell、worktree lifecycle owner 或 target truth writer。 |
| Script-to-pack retirement gates | `active_machine_gate_with_policy_contracts` | `runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy/script_to_pack_retirement_gates`、`contracts/developer_work_order_policy.json`、`contracts/standard_foundry_policies.json`、`tests/source-purity.test.ts` | 三组脚本面必须以 OPL primitive parity、target-agent generic handoff / explicit fixture path、no-forbidden-write、no-active-caller 和 tombstone/provenance refs 作为吸收或退役条件；developer work-order policy 与 standard Foundry policy 已有 contract refs，旧 standalone projection helpers 已退役；gate 未齐时其余脚本只能保留为薄 materializer/helper。 |
| Second-framework guard | `active_machine_guard` | `runtime/authority_functions/meta-agent-authority-functions.json#purpose_first_owner_delta_gate/second_framework_guard`、`tests/source-purity.test.ts` | OMA 只输出 candidate package、developer work order、target capability candidate、mechanism proposal 或 typed blocker refs；Agent Lab runner、promotion gate、queue、attempt ledger、work-order execute/absorb/cleanup、registry/App shell 与 target owner closeout hook invocation 保持外部 owner。 |
| Fallow TS/JS hygiene | `production_unused_surface_closed_with_complexity_tail` | `fallow --production`、`scripts/lib/*`、`scripts/agent-evidence-takeover.ts`、`scripts/improve-from-agent-lab-suite.ts` | unused export/type 应保持关闭；复杂度治理只允许继续按参数解析、contract loading、receipt/artifact materialization 等自然 helper 收薄，不能新增通用 CLI 框架或 runner。 |
| Clean-room skill pattern intake | `done_as_docs_and_contract_pattern` | `contracts/trajectory_learning_contract.json`、核心 docs/tests | 只吸收 xskill trajectory / candidate / canary / redaction 模式；不引入 daemon/runtime/scheduler/installer/server。 |
| Standard Agent source shape purity | `generic_shell_absent_with_script_hygiene_tail` | `contracts/functional_privatization_audit.json`、`contracts/default_caller_deletion_evidence.json`、`runtime/authority_functions/meta-agent-authority-functions.json#source_purity_scan_receipt`、`tests/source-purity.test.ts`、本文 | `functional_structure_gap_count=0` 只说明 repo-owned generic shell absent；default caller、sidecar、workbench 和 generated shell 只保留 OPL-owned refs 与 OMA boundary evidence tail。Scripts/materializers 仍是 strict source-purity hygiene tail，不能扩成 runner / promotion gate / workbench。 |

## 功能/结构差距

当前无 repo-owned generic runtime/shell gap，但仍有 strict source-purity hygiene gap。`functional_structure_gap_count=0` 只在以下条件继续成立时有效：

| Reopen trigger | 处理方式 |
| --- | --- |
| 新增 repo-owned generic CLI/MCP/Skill/product-entry wrapper、sidecar/status/workbench、scheduler、queue、attempt ledger、registry owner 或 App shell | 重新打开结构 gap，迁回 OPL generated/hosted surface 或退役。 |
| `scripts/` 承载 Agent Lab runner、promotion gate、physical kernel runtime state owner、conformance gate owner、workbench owner、target truth writer、owner receipt body writer、generic worktree lifecycle、target owner closeout hook owner 或 default promotion shortcut | 重新分类到私有实现迁移台账，并优先上收、收薄或删除。 |
| required domain pack path 退化为 README、目录存在性或 Markdown heading | 重新打开 pack structure gap，恢复真实 repo file refs。 |
| MAS/MAG/RCA 等 domain 名称进入 OMA 顶层 command family、suite kind 或长期 contract vocabulary | 重新打开标准消费者边界 gap，改回 target-agent generic vocabulary。 |
| `stage_executor_policy_candidate` 被写成 executor switch、quality equivalence、runner implementation 或 default promotion | 重新打开 stage executor policy boundary gap。 |

当前 strict source-purity 只在本文维护三类开放尾项；细节 owner 不在本文：

| Open tail | Active-plan reading | Detail owner |
| --- | --- | --- |
| OPL generated/default caller consumption | 本仓只能提供 refs-only boundary evidence；真实 default caller / App / registry 消费仍归 OPL / App 侧落证。 | `contracts/default_caller_deletion_evidence.json`、OPL generated/default caller read model、`docs/active/opl-private-implementation-migration-inventory.md` |
| Script-to-pack hygiene | 保留脚本必须继续证明只是 authority implementation、smoke/proof helper、thin delegation 或 developer work-order materializer；新增或增长脚本先回到 machine gate 分类。 | `runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy/script_to_pack_retirement_gates`、`tests/source-purity.test.ts`、私有实现迁移台账 |
| Target-agent handoff / evidence scaleout | 当前 MAS/MAG refs-only gate 已闭合；后续 App drilldown、repeat cohort、real source patch-loop 和 reviewer direct-evidence 仍是证据尾项。 | production acceptance contracts、OPL read models、target owner receipts / typed blockers、`docs/status.md` |

## 测试/证据差距

| Evidence gap | 当前已有 | 仍缺 |
| --- | --- | --- |
| OPL registry discovery consumption | OMA registration contract 与 refs-only discovery receipt surface | OPL 主仓或 App 侧真实 registry consumption receipt。 |
| App/workbench live consumption | App projection contract、drilldown readiness receipt、refs-only production-consumption evidence entrypoints | 真实 App render/screenshot、live runtime drilldown closeout receipt 和 repeat long-soak evidence。 |
| Repeated new-agent scaffold/conformance/readiness consumption | 明确 target-agent baseline、real-target receipt surfaces、已记录的新消费样本入口 | 更多非 fixture target cohorts 的 App live path、domain owner receipt 或 typed blocker，以及 long-soak 证据。 |
| Real blocked target patch loop scaleout | OMA work-order shape、MAS/MAG two-target refs-only scaleout closeout、App/workbench patch-loop machine refs plus reviewer evidence/provenance projection、work-order execution delegation tests | 后续目标 cohort 的真实 source patch / rerun / owner receipt / typed blocker / no-forbidden-write / runtime-read-model consumption / workspace proof / cleanup / Agent Lab re-evaluation 样本。 |
| Independent Codex reviewer attempt | structured reviewer schema、fail-closed rules、reviewer evidence/provenance projection | 独立 invocation/context/trace/receipt、direct evidence、source refs、critique/suggestions/verdict/provenance 与 rollback/canary/version refs 的真实样本。 |
| Standard target-agent handoff convergence | OMA 侧 target-agent generic intake 已落地 | 目标 agent 侧持续提供同一 vocabulary，不在 OMA 或 Agent Lab 添加 domain-specific suite / command。 |
| Script-to-pack evidence | 私有实现迁移台账、source-purity guards、`script_to_pack_retirement_gates` 和 policy contracts。 | 后续增长时继续证明脚本只是 materializer/helper；新增或继续稳定下来的规则继续迁入 declarative pack、contracts 或 OPL primitive；未进入 gate 的新增脚本必须 fail closed。 |
| Mechanism proposal promotion | mechanism patch proposal 为 proposal-only surface | OPL / Agent Lab promotion gate receipt 与 target owner evidence，才能进入默认 agent 变更。 |

## 下一轮工作范围

0. `rational_refactor_watch`
   2026-06-15 的 OPL family 合理重构快照把本仓归为 `watch_only / generated aggregate governed` 为主。`contracts/stage_control_plane.json` 是现有 consumer aggregate path，维护源继续是 `contracts/stage_control_plane.source.json`、`contracts/stage_control_plane.leaf-index.json` 和 `contracts/stage_control_plane.parts/**`；用 `npm run stage-control:check` 防止 drift，用 `npm run source-structure` 保持 advisory。当前 source-structure lane 已接受该 aggregate，普通代码没有新的强拆候选。后续不要因为 aggregate 行数把 `stage_control_plane.json` 手工碎片化；只在 source parts、leaf index、generator 或 consumer contract 不清晰时治理生成链路。短脚本和 test support 继续按 script-to-pack hygiene 分类，只有 deletion test 证明单 caller pass-through 且不承担 Interface 时才合并。

1. `registry_app_consumption`
   让 OPL 主仓或 App 侧消费 `contracts/opl_domain_manifest_registration.json` 与 `contracts/app_workbench_projection.json`，留下 registry discovery receipt、App render/screenshot/runtime drilldown receipt；后续 cohort 若缺 evidence 必须 record/verify domain-owned typed blocker。

2. `new_agent_consumption_scaleout`
   继续用更多非 fixture target agent 复验 `build-agent-baseline` 生成的 Stage Pack v2、file-backed independent gate、generated interface、Agent Lab baseline、readiness 和 App/workbench descriptor consumption；每个样本都必须显式记录 open production/domain-ready tail。

3. `real_blocked_target_patch_loop_scaleout`
   在后续真实 target agents 上执行带 AHE 四字段的 developer work order：Codex 只改 allowed editable surfaces，重跑目标验证，记录 target runtime/read-model consumption、workspace proof、no-forbidden-write、owner receipt 或 typed blocker、patch absorption、cleanup 和 Agent Lab re-evaluation；不要把当前 MAS/MAG refs-only scaleout gate 重复写成未闭合。

4. `independent_codex_reviewer_attempt`
   为真实 patch-loop 补独立 Codex reviewer attempt。reviewer 必须基于 direct evidence，保持 no-shared-context provenance，并输出 source refs、critique、suggestions、verdict 和 rollback/canary/version refs。

5. `standard_target_agent_handoff_convergence`
   推动 MAS/MAG/RCA 和新 Foundry Agent 用同一 target-agent vocabulary 暴露 production/live acceptance、Agent Lab handoff、owner route、editable surface policy、required return shapes、verification refs 和 no-forbidden-write proof。

6. `script_to_pack_hygiene`
   持续减少仍需保留的 materializer/helper 语义，而不是扩大脚本职责。每次新增或收薄脚本，都先回到私有实现迁移台账和 `script_to_pack_retirement_gates` 分类，再用 `tests/source-purity.test.ts` 验证 no-resurrection / no-forbidden-surface boundary。

## 下一轮 Agent prompt

Objective:

- 继续治理 `/Users/gaofeng/workspace/opl-meta-agent` 的 OMA evidence tail、新 Agent consumption scaleout、真实 target patch-loop scaleout、独立 reviewer attempt、standard target-agent handoff convergence 和 script-to-pack hygiene。

Write scope:

- `docs/active/opl-meta-agent-ideal-state-gap-plan.md`、`docs/status.md`、`docs/active/opl-private-implementation-migration-inventory.md`、OMA contracts、`agent/` pack、`runtime/authority_functions/`、`scripts/lib/*` 和 tests 中仍影响 OMA owner boundary 或 evidence tail 的部分。

Live truth inputs:

- `AGENTS.md`、`TASTE.md`、核心五件套、本文、ideal-state reference、private implementation inventory。
- `contracts/opl_domain_manifest_registration.json`、`contracts/app_workbench_projection.json`、`contracts/real_target_agent_scaleout_evidence.json`、production acceptance contracts、generated surface handoff、stage control plane。
- OPL `agents interfaces --repo-dir <this-repo> --json`、OPL framework readiness / App drilldown / OMA production-consumption read model、`npm test` / `npm run verify`。

Required actions:

- 推进 `registry_app_consumption`、`new_agent_consumption_scaleout`、`real_blocked_target_patch_loop_scaleout`、`independent_codex_reviewer_attempt`、`standard_target_agent_handoff_convergence` 和 `script_to_pack_hygiene`。
- 对新增或增长的 scripts/materializer 核实 active caller、authority boundary、no-forbidden-write、target owner route 和是否应迁入 `agent/`、`contracts/` 或 OPL primitive。
- 若推进 script-to-pack hygiene，先读取 `runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy/script_to_pack_retirement_gates`，按对应 gate 补齐 OPL primitive parity、target-agent generic handoff / explicit fixture path、no-forbidden-write、no-active-caller 和 tombstone/provenance refs；不要用口头判断替代退役证据。
- 已闭合项折回本文或核心五件套；proof 流水和旧路线进入 history/provenance。

Non-goals:

- 不新增第二套 active plan。
- 不修改 target domain truth、memory body、artifact body、quality/export verdict、owner receipt body 或 default promotion authority。
- 不添加 OMA 私有 generic runtime、Agent Lab runner、queue、attempt ledger、registry/App shell、domain-specific command family 或 compatibility facade。

Verification commands:

- Docs-only：`rtk git diff --check`、`rtk rg -n "<<<<<<<|>>>>>>>|=======" README* docs agent/*/README.md`、docs inventory sanity。
- 触及 contracts/source/tests：`rtk npm test` 或 `rtk npm run verify`。

Completion gate:

- Open evidence tail 已更新为 current truth；closed evidence 不以 dated closeout 形式留在 active path。
- 文档职责归位，history/process 只保留 provenance，不承担当前 truth。

## 历史索引

- North-star / target-state：`docs/references/opl-meta-agent-ideal-state.md`。
- 私有实现、脚本收薄、退役 legacy surfaces：`docs/active/opl-private-implementation-migration-inventory.md`。
- 当前公开状态与未完成摘要：`docs/status.md`。
- 架构边界：`docs/architecture.md`。
- 硬约束和禁止声明：`docs/invariants.md`。
- 有效决策：`docs/decisions.md`。
- 文档生命周期：`docs/docs_portfolio_consolidation.md`。
- 机器证据入口：`contracts/`、`agent/`、`runtime/authority_functions/`、`tests/`、OPL Agent Lab result refs、developer work-order receipts 和 target owner receipts / typed blockers。
- dated closeout、旧路线、过程清单和已退役 surface 只保留在 history / provenance / migration inventory 语境中；不要把历史增量清单复制回本文。

## 验证口径

- 文档维护最低验证：`git diff --check`。
- 本仓结构与 contract 口径：`npm test` 或 `npm run verify`。
- 行为声明只固定 machine-readable contracts、stage/action refs、authority function refs、generated interface readiness、Agent Lab receipts、developer work-order receipts 和 no-forbidden-write boundary；测试不得固定本文措辞。
