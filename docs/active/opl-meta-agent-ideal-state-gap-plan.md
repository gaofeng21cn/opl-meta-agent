# opl-meta-agent 理想目标态差距与完善计划

Owner: `opl-meta-agent`
Purpose: `ideal_state_gap_plan`
State: `active_plan`
Machine boundary: 本文是人读 gap / completion plan。机器真相继续归 `contracts/`、`agent/`、`runtime/authority_functions/`、source、OPL Agent Lab result refs、developer work-order receipts、target owner receipts / typed blockers、candidate refs 和 tests。

## 当前唯一真相

本文是 `opl-meta-agent` 当前完成口径、功能/结构差距、后置 evidence routing 和下一轮 Agent prompt 的 single Active Truth owner。

- North-star 目标态只维护在 [opl-meta-agent 理想目标态](../references/opl-meta-agent-ideal-state.md)。
- 当前公开状态摘要维护在 [状态](../status.md)。
- 私有实现分类、脚本收薄、default-caller tail 和上收候选维护在 [私有实现与 OPL 迁移台账](./opl-private-implementation-migration-inventory.md)。
- 文档生命周期和每份文档唯一职责维护在 [文档组合治理](../docs_portfolio_consolidation.md)。
- dated closeout、proof snapshot、coverage tranche 和过程流水只作为 history/provenance 读取。

Currentness policy：本文不冻结 run date、branch、worktree、commit SHA、receipt id、动态 counts、read-model 输出或 closeout 流程。带日期的 refs 只作为证据 provenance；当前状态仍以 live contracts、source、tests、OPL read models 和本仓最新核心 docs 为准。

2026-06-30 SSOT refresh：本文的默认 active gap 只维护功能面落地、结构收薄、strict source-purity、script-to-pack hygiene、developer work-order policy、target-agent handoff vocabulary、no-forbidden-write guard、no-active-caller 与 tombstone/provenance。OPL registry / App live rendering、repeat target cohorts、real source patch -> rerun -> owner receipt、independent reviewer direct evidence、human approval、default promotion 和 production readiness 是后置 evidence lane，不再混进功能/结构 gap。除了 live evidence 之外，OMA 当前仍需关注的缺口是 script-to-pack / source-purity 持续治理：新增或保留 scripts/materializers 必须有真实 active caller、repo-local refs、no-forbidden-write、OPL primitive parity / no-active-caller / tombstone gate，且不能靠 source-purity self-guard 字符串自证。

本文执行原则是功能/结构优先：script-to-pack machine gate、retained script active-caller classification、OPL primitive replacement mapping、generated / registry / App projection refs、developer work-order and target-improvement policy contracts、no-forbidden-write guard、no-active-caller 与 tombstone/provenance 清理不等待 registry/App live rendering 或 target cohort evidence。OPL registry / App live rendering、repeat target cohorts、real source patch -> rerun -> owner receipt、independent reviewer direct evidence、human approval、default promotion 和 production readiness 只在对应声明前回 owner evidence surface；controlled canary、suite pass、refs-only scaleout、OPL refs-only consumption 或 contract completeness 不能替代这些 owner evidence。

## 当前结论

- `opl-meta-agent` 是 OPL-compatible Foundry Agent，不是 OPL Framework 内置模块。
- 理想物理形态是 `Declarative Agent-Building Pack + OPL generated/hosted surfaces + minimal agent-building authority functions`。
- Purpose-first owner-delta 是默认完成口径：OMA 只输出 target-agent semantics、developer work order、target capability / mechanism candidate 或 typed blocker，并把下一步写成某个 target owner、OPL Framework / Agent Lab / App 或 human gate 欠的 owner delta、receipt、gate 或 blocker。
- 当前 source-shape truth 是：没有发现 repo-owned generic runtime、generated shell、workbench、sidecar 或 compatibility surface；`functional_structure_gap_count=0` 不能升级成 strict purity 完成态、OPL 已接管脚本面或 physical delete authority。
- Script-to-pack 细节的 SSOT 是 [私有实现与 OPL 迁移台账](./opl-private-implementation-migration-inventory.md)、authority source-purity / morphology surfaces、`contracts/script_to_pack_gate_receipt.json`、`contracts/private_functional_surface_policy.json#allowed_opl_surface_consumption_refs`、`npm run source-structure:json` 和 source-purity tests。`agent/professional_skills/oma-work-order-hygiene/SKILL.md` 读取同一入口做 retain / absorb / delete / tombstone / route-back 判断。唯一 readback 只证明 caller、source-ref 和 retention classification 对齐，不能授权 physical delete、owner receipt、typed blocker instance、OPL primitive parity、readiness、promotion 或 script retirement。
- OMA 不能成为第二 Agent Lab 或第二 OPL Framework。`purpose_first_owner_delta_gate.second_framework_guard` 固定允许输出为 candidate package、developer patch work order、target capability candidate、mechanism proposal 或 typed blocker；Agent Lab runner、promotion gate、queue/attempt ledger、work-order execute/absorb/cleanup、registry/generated interface、App/workbench 和 target owner closeout hook invocation 都归 OPL / App / target owner。
- 当前未完成项主要是 script-to-pack / source-purity 持续治理：新增或保留 scripts/materializers 必须证明 active caller、repo-local source refs、no-forbidden-write、OPL primitive parity、no-active-caller 和 tombstone/provenance。OPL generated/default caller consumption、OPL registry / App 真实 discovery/render receipt、后续 cohort repeat long-soak / live drilldown、真实 source patch -> rerun -> owner receipt、独立 reviewer direct-evidence verdict 和 default promotion 都是后置 evidence lane，不作为本文默认 active backlog。已闭合样本只证明 refs-only scaleout / new-agent consumption / stage-replay typed-blocker handoff shape / script gate shape；不声明 target domain ready、quality/export verdict、owner receipt body、App live rendering、human approval、default promotion 或 family production ready。
- OPL 侧当前已能把 OMA production-consumption read model 读成 refs-only verified ledger；live 当前性以 `opl runtime oma-production-consumption list --json` 为准。Active plan 不冻结 receipt 数量、long-soak / typed-blocker 分布、dated refs 或旧 production-acceptance 字段；这些动态证据只作为 contracts / OPL read-model / history provenance 读取，不能替代后续 target cohort 的 repeat long-soak evidence。
- OPL stage replay missing-receipt ledger 已把 `oma_baseline_owner_review` 读成 domain-owned typed blocker closure。该 closure 只说明 baseline owner review receipt pending；不授权 human approval、replay success、domain ready、production ready 或默认 promotion。
- Strict source-purity 仍有 `scripts/` domain validator/helper 的持续收薄与 no-active-caller 尾项；通用 target physical materialization 和 work-order lifecycle 已分别委托 OPL scaffold materializer 与 work-order executor。per-script 分类、active caller graph、已迁回合同的 policy 细节和退役门回到私有实现迁移台账与 machine guards。
- 当前 cleanup 结论：`execute-external-work-order.ts` 及其 package/action/schema/test caller 已物理退役；`agent:evidence` 与 external-suite improvement 只返回 OMA typed judgment 和 semantic requests，`stage-decomposition-pack-draft/` 只保留 OMA typed judgment与 scaffold request builder。通用文件 preflight/materialization、digest receipt、work-order admission/execute/absorb/cleanup 均由 OPL primitive承担。
- 已闭合或已有样本的 production-consumption、new-agent consumption、stage replay typed blocker 证据只作为 contract / OPL read-model / history provenance 读取；本文不复制动态 receipt counts、worklist 字段或 dated cohort closeout。
- OMA 不维护 repo-owned generic plugin wrapper；目标 agent 必须生成 OPL Agent Package manifest sidecar，并通过 `opl packages validate-manifest --manifest-url <sidecar> --json` 调用 OPL Base 校验。OPL contracts / package validator 是 Agent Package manifest 机器 SSOT；OMA 自身的 Codex plugin 只是 repo-local materialized full-copy carrier，不是第二套 package manifest 标准。
- OMA 维护 repo-owned rich primary skill：`agent/primary_skill/SKILL.md` 是 OMA 默认 Codex entry，覆盖用途、普通入口、Agent Lab / target-agent handoff、new-agent delivery gate、authority boundary、professional skill routing 和 false-completion guard。`plugins/opl-meta-agent/skills/opl-meta-agent/SKILL.md` 必须与它完全一致；OPL 仍持有 manifest standard / validation，OMA 只消费标准并提供 domain-owned primary skill source。

禁止误写：

- 不能把 generated surface proof、registration readiness、App projection readiness、suite pass、schema completeness、contract completeness、work-order shape、source-shape conformance、refs-only scaleout closeout 或 OPL refs-only consumption 写成 production ready、domain ready、quality verdict、App live rendering、owner receipt body、human approval 或 default promotion。
- 不能把 Agent Lab / OMA 写成 MAS、MAG、RCA 专用兼容层。正确口径是标准 OPL Agent 提供 Agent Lab / OMA 可消费的 handoff、evaluation request、owner route、receipt、no-forbidden-write 和 verification refs；suite plan 仅由 OPL Foundry Lab 从 request 编译。
- 不能把 `scripts/` 中的 smoke / materializer / helper 写成 OPL generic runtime、Agent Lab runner、queue、attempt ledger、registry owner、App shell、worktree lifecycle owner、target truth writer、target owner closeout hook owner 或 promotion gate。

## 目标态

`opl-meta-agent` 的目标是构建、接管、修复和持续改进 OPL-compatible 高价值知识交付智能体。它读取用户意图、目标领域材料和目标 agent 的标准 handoff surface，形成可审计的 agent brief、stage plan、domain pack、quality gates、thin Foundry evaluation request、baseline receipt、developer patch work order、online-learning candidate 和 mechanism patch proposal。

Owner split 固定为：

| Owner | 持有内容 |
| --- | --- |
| `opl-meta-agent` | agent-building semantics、declarative pack、candidate package policy、thin Foundry evaluation request、developer work-order policy、target capability candidate、mechanism proposal、typed blocker 和 minimal authority functions |
| OPL Framework / Agent Lab / App | generic runtime、standard scaffold、generated interfaces、queue、attempt ledger、provider receipt、Agent Lab execution、promotion gate、registry/discovery、App/workbench shell、work-order execute / absorb / cleanup |
| target domain agent | domain truth、memory body、artifact body、quality/export verdict、owner receipt、default promotion authority、target owner closeout hook 和标准 handoff refs |

## 当前完成进度

| Progress item | Status | Current evidence | Remaining boundary |
| --- | --- | --- | --- |
| Standard domain pack and Foundry Agent identity | `done` | `agent/` pack、`contracts/pack_compiler_input.json`、`contracts/foundry_agent_series.json`、`tests/contracts-domain-pack.test.ts`、`tests/contracts-foundry-series.test.ts` | 不把 README、目录存在性或 human prose 当成 machine-required pack path。 |
| Generated interface / registry / App projection input | `done_with_later_external_consumption_lane` | `contracts/generated_surface_handoff.json`、`contracts/opl_domain_manifest_registration.json`、`contracts/app_workbench_projection.json`、OPL generated interface read model | Generated / registry / App rendering owner 仍是 OPL / App；OMA 不声明 generated surface ownership，真实 registry/App consumption 走后置 evidence lane。 |
| Work-order and mechanism proposal materialization | `done_with_more_real_loop_tail` | `build-agent-baseline`、`takeover:test`、`improve:external-suite`、`agent:evidence`、`execute:external-work-order`、matching tests | 可输出 candidate package、partial/non-executable developer work order、target capability candidate、mechanism proposal、no-patch coordination receipt、quality-debt/no-output diagnostic 或真实硬边界 typed blocker；缺 target source morphology、owner route、generated surface consumption、private residue decision、accepted owner-answer shape、StageRun refs-only boundary、independent reviewer evidence 或 no-forbidden-write proof 时继续后续 declared stage，但关闭 executable/promotion/delivery/ready claim；target truth、artifact、memory、quality verdict 和 owner receipt body 仍归 target owner。 |
| StageRun canary and overclaim guard | `done_as_controlled_canary` | `contracts/stage_run_kernel_profile.json`、`contracts/stage_run_canary_evidence.json`、`tests/contracts-stage-run-kernel.test.ts` | Controlled fixture 只证明 repo-local canary shape；不声明 live domain progress、production readiness、human approval、App rendering 或 default promotion。 |
| Source shape / no-resurrection guard | `generic_shell_absent_with_script_hygiene_tail` | `contracts/functional_privatization_audit.json`、`runtime/authority_functions/meta-agent-authority-functions.json`、source-purity tests | `functional_structure_gap_count=0` 只证明 repo-owned wrapper/runtime/workbench shell absent；default surface absence 不再复制第二证据合同。 |
| Retired legacy alias and wrapper tails | `retired_and_guarded` | retired-surface provenance、private inventory 和 source-purity guards | 本文只保留退役状态；具体 no-resurrection 清单回到 `docs/history/process/retired-surface-provenance.md`、私有实现迁移台账和 machine guards。 |
| Production-consumption / new-agent scaleout / patch-loop evidence | `later_evidence_lane_routed` | production acceptance contracts、`contracts/real_target_agent_scaleout_evidence.json`、OPL refs-only production-consumption read model、target patch-loop work-order shape | 这些只作为后置 evidence routing 和 false-ready guard；不构成本文默认功能/结构 backlog，也不声明 target ready、App rendering ready、human approval 或 default promotion。 |

## 已落地

| Area | 当前状态 | 主要证据 | 边界 |
| --- | --- | --- | --- |
| Standard domain pack | `done` | `agent/` pack、`contracts/pack_compiler_input.json`、`agent/stages/manifest.json`、`tests/contracts-domain-pack.test.ts` | README 和 prose 章节不作为 machine required path。 |
| Rich primary skill source | `done` | `agent/primary_skill/SKILL.md`、`contracts/capability_map.json#primary_skill`、`contracts/pack_compiler_input.json`、`tests/contracts-domain-pack.test.ts` | Primary skill 是默认 Codex entry；repo-local professional skills 继续由 stage / primary skill 按需路由，不默认全局暴露。 |
| Cognitive Kernel adoption | `done_as_advisory_contract` | `contracts/cognitive_kernel_adoption.json`、`contracts/golden_path_profile.json`、`agent/tools/domain_affordances.md`、`contracts/pack_compiler_input.json`、`agent/stages/manifest.json`、`tests/cognitive-kernel-adoption.test.ts` | 只约束 OMA stage-internal tool affordance、strategy refs、candidate policy、independent gate 和 owner-delta handoff；不把脚本、tool catalog 或 OMA work order 写成第二 Agent Lab、promotion gate、worktree lifecycle owner、registry/App shell、target truth writer 或 target owner receipt body owner。 |
| Foundry Agent policy / Framework hosting | `done_for_structural_conformance` | `contracts/foundry_agent_series.json`、`scripts/lib/stage-decomposition-pack-draft/builder.ts`、OPL-managed Framework link、`tests/contracts-foundry-series.test.ts`、`tests/bootstrap-loop.test.ts`、`tests/managed-framework-link.test.ts` | repo 与生成 target 均显式声明跨域 truth/memory/artifact/quality authority 为 false；OMA package/lock 不持有 Framework 或 Temporal closure。link check 和 materialization regression 只证明结构与 import 可消费，不授权 release currentness、domain ready、quality/export verdict、artifact/memory body、owner receipt 或 default promotion。 |
| Generated / registration / App projection | `done_with_later_external_consumption_lane` | `contracts/generated_surface_handoff.json`、`contracts/opl_domain_manifest_registration.json`、`contracts/app_workbench_projection.json` | OPL owns generated interfaces、registry 和 App shell；OMA 只提供 refs-only inputs。真实 registry/App consumption 归后置 evidence lane。 |
| Stage-Native compiler refs | `done_as_opl_materialization_request` | `contracts/stage_native_artifact_vocabulary.json`、`scripts/lib/stage-native-artifact-contract.ts`、`scripts/lib/stage-decomposition-pack-draft/`、`tests/stage-decomposition-materializer.test.ts` | OMA 只把 physical kernel locator、conformance 和 workbench consumption refs-only templates放入 scaffold request；OPL 负责实际落盘、digest 和 final build receipt。helper 不创建 runtime state、不 owner promotion、不管理 target worktree、不写 owner receipt body。 |
| External work-order execution delegation | `done_retired_to_opl` | `contracts/action_catalog.json`、source-purity receipt、retired-surface provenance、OPL work-order commands | OMA 不再持有 execution action/delegation/receipt validator；只输出 typed semantic request。 |
| Production acceptance / consumption follow-through | `later_evidence_lane_routed` | `contracts/production_acceptance/meta-agent-production-acceptance.json`、`contracts/production_acceptance/new_agent_consumption_evidence.json`、OPL production-consumption read model / refs-only ledger、OPL stage replay missing-receipt ledger | Production-consumption、new-agent consumption 和 stage-replay human-gate blocker 只证明 refs-only consumption / typed blocker handoff shape；dated cohort 细节和 read-model 字段留在 contracts、OPL read models 或 history provenance。它们不授权 target domain ready、family production ready、future cohort long-soak、human approval 或默认 promotion，也不构成本文默认 active backlog。 |
| Purpose-first owner-delta gate | `active_gate` | `docs/status.md`、`runtime/authority_functions/meta-agent-authority-functions.json#purpose_first_owner_delta_gate`、`contracts/production_acceptance/meta-agent-production-acceptance.json#purpose_first_owner_delta_gate` | OMA 只给 target-agent semantics、developer work order、target capability / mechanism candidate 或 typed blocker；下一步必须指向明确 owner delta / receipt / gate / blocker。 |
| Script morphology | `active_hygiene_with_machine_receipt` | `runtime/authority_functions/`、`contracts/script_to_pack_gate_receipt.json`、`scripts/lib/*`、私有实现迁移台账 | 当前脚本只允许是 authority implementation、smoke helper、fixture/proof helper 或 typed semantic request builder；当前 machine gate receipt 已证明扫描范围、caller graph 和 no-resurrection gate 可消费，但不授权第二 Agent Lab、promotion gate、registry/App shell、worktree lifecycle owner 或 target truth writer。 |
| Script-to-pack retirement gates | `machine_gate_receipt_closed_with_future_retirement_evidence_tail` | `contracts/script_to_pack_gate_receipt.json`、authority source-purity / morphology surfaces、source-purity tests、`npm run source-structure:json` | Repo-local scripts have one retention summary and caller/source-ref gate；readback cannot authorize delete, retirement, readiness, promotion or owner receipt writes. |
| Second-framework guard | `active_machine_guard` | `runtime/authority_functions/meta-agent-authority-functions.json#purpose_first_owner_delta_gate/second_framework_guard`、source-purity tests | OMA 只输出 candidate package、developer work order、target capability candidate、mechanism proposal 或 typed blocker refs；Agent Lab runner、promotion gate、queue、attempt ledger、work-order execute/absorb/cleanup、registry/App shell 与 target owner closeout hook invocation 保持外部 owner。 |
| Fallow TS/JS hygiene | `production_unused_surface_closed_with_complexity_tail` | `fallow --production`、`scripts/lib/*`、`scripts/lib/agent-evidence-materializer.ts`、`scripts/improve-from-agent-lab-suite.ts` | unused export/type 应保持关闭；复杂度治理只允许继续按参数解析、contract loading、receipt/artifact materialization 等自然 helper 收薄，不能新增通用 CLI 框架或 runner。 |
| Clean-room skill pattern intake | `done_as_docs_and_contract_pattern` | `contracts/trajectory_learning_contract.json`、核心 docs/tests | 只吸收 xskill trajectory / candidate / canary / redaction 模式；不引入 daemon/runtime/scheduler/installer/server。 |
| Standard Agent source shape purity | `generic_shell_absent_with_script_hygiene_tail` | `contracts/functional_privatization_audit.json`、`runtime/authority_functions/meta-agent-authority-functions.json#source_purity_scan_receipt`、source-purity tests、本文 | `functional_structure_gap_count=0` 只说明 repo-owned generic shell absent；default caller 物理缺席状态由 canonical audit 声明并由 OPL consumer 读取，不再持有第二证据合同。Scripts/materializers 仍是 source-purity hygiene tail。 |

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
| Script-to-pack hygiene | 保留或新增 scripts 必须证明真实 caller、repo-local refs、允许的 class、false-authority 边界和退役 route；唯一 JSON readback 是 `source-structure:json`。 | `contracts/script_to_pack_gate_receipt.json`、authority source-purity / morphology surfaces、source-purity tests、私有实现迁移台账 |
| Target-agent handoff vocabulary | Producer 已统一为 OMA-owned evaluation/developer-patch semantics 与 canonical `opl_work_order_materialization_request.v2`；OPL 持有 work-order identity/materialization/lifecycle 并作为唯一 suite-plan compiler，旧 action-level `new_agent_delivery_gate` readback 已删除。App drilldown、repeat cohort、real source patch-loop、reviewer direct evidence 和 target owner receipt 样本继续走后置 evidence lane。 | `scripts/lib/work-order-materialization-request.ts`、action output schemas、producer scripts、OPL evaluation readback、target owner receipts / typed blockers、`docs/status.md` |
| Target-agent rich primary skill | `build-agent-baseline` 必须为 OMA-generated target agent 生成 `agent/primary_skill/SKILL.md`，并在 target `contracts/capability_map.json` 和 package sidecar `codex_surface.primary_skill_ref` 中声明默认 primary entry。OPL owns standard / validation / generated carrier；OMA consumes the standard and emits candidate repo-owned source. | `scripts/build-agent-baseline.ts`、`tests/bootstrap-loop.test.ts`、target `contracts/capability_map.json`、target `contracts/opl_agent_package_manifest.json#/codex_surface` |

## Ready / Promotion 声明边界

本文不维护 OPL registry discovery、App/workbench live rendering、repeat target cohorts、real source patch -> rerun -> owner receipt、independent reviewer direct evidence、human approval、default promotion 或 production readiness worklist。这些只在 OPL/App/target-owner evidence lane、production acceptance contracts 或 target owner receipt / typed blocker surface 中读取。

Active plan 只保留非 live 功能/结构缺口：script-to-pack / source-purity 持续治理、retained script active-caller classification、OPL primitive replacement mapping、developer work-order policy、target-agent handoff vocabulary、no-forbidden-write guard、no-active-caller 与 tombstone/provenance。若新增或增长 scripts/materializers，必须先进入 machine gate、caller graph、source-ref integrity 和 retirement gates；readback 可以列 missing evidence 和 owner-delta route，但不能授权 physical delete、owner receipt、typed blocker instance、OPL primitive parity、App/registry/generated-hosted readiness、default promotion 或 target/domain/production readiness。

本轮按 `launcher|wrapper|alias|compat|legacy|status|sidecar|product-entry|helper|facade` 关键词复核后，没有发现可直接物理删除的孤立普通入口。命中的 script/materializer/helper/status/workbench residue 已在 source-purity guard、script-to-pack receipt、私有实现迁移台账和本计划中归为 authority implementation、smoke/proof helper、thin delegation、developer work-order materializer 或 provenance refs；退役仍必须满足 OPL primitive parity、真实 active-caller 迁出、no-forbidden-write、no-active-caller 与 tombstone/provenance。

## 下一轮工作范围

0. `rational_refactor_watch`
   OMA stage source 已收敛到 `agent/stages/manifest.json`；hosted `family_stage_control_plane` 由 OPL Framework 编译并持有，本仓不再维护对应 aggregate、source parts、leaf index、bundle manifest 或同步入口。短脚本和 test support 继续按 script-to-pack hygiene 分类，只有 deletion test 证明单 caller pass-through 且不承担 Interface 时才合并。
   合理重构 lane 必须先用 tracked source/test path 对齐真实写集；若任务指定的 source 或 test 文件在当前 checkout 不存在，且只有 TypeScript / JSON 类比 surface 存在，则不得把类比文件当作隐式授权写集。此时记录 `no_safe_semantic_split` / authority-scope blocker，并要求重新对齐 source of truth 或写权限后再做 source/test slice。

1. `script_to_pack_hygiene`
   当前 missing-machine-gate blocker 已关闭；后续工作是持续减少仍需保留的 materializer/helper 语义，而不是扩大脚本职责。每次新增或收薄脚本，都先回到私有实现迁移台账、script-to-pack receipt、script morphology policy、readback 和 source-purity tests 分类；新增保留脚本如果没有真实 active caller、只被 source-purity 自身字符串引用，或 source refs 不是 repo-local `scripts/` 下 `.ts` / `.sh`，必须 fail closed。`scripts/lib/domain-pack.ts` 这类共享 pack helper 只能保留为 pack summary / deterministic target-agent fixture helper，不能升级为 OPL pack compiler、generated interface owner、scaffold generator owner、target pack authority 或 target truth writer。
   item `5` alias surface 已关闭；item `6/7` 的通用 mechanics 也已通过 OPL command delegation 收薄。剩余条件只包括 OMA-specific typed validator/builder 是否能由 generated action 直接消费、no-active-caller 和 tombstone/provenance；这些未满足时保留 domain validation，不恢复本地 target IO 或 worktree lifecycle。
   本轮 source-purity / fixture 收薄确认三点：`script-morphology.test-case.ts` 的大块 matrix 仍是 machine receipt / policy field guard，不做脆弱重写；测试文件直接 import `node:*` 标准库，`tests/support/contracts.ts` 只保留 repo-specific helper；`external-suite-fixtures.ts` 只保留 external-suite fixture builders/assertions，并复用 `writeJsonFile`。legacy professional skill tombstone 物理文件已删除，redirect truth 留在 `contracts/capability_map.json` 与 `agent/professional_skills/README.md`。后续若继续收薄 fixture，只删重复构造或单 caller pass-through，不新增 fixture abstraction 层。

## 下一轮 Agent prompt

Objective:

- 继续治理 `/Users/gaofeng/workspace/opl-meta-agent` 的 script-to-pack hygiene、source-purity、developer work-order policy、target-agent handoff vocabulary、no-forbidden-write guard、no-active-caller 和 tombstone/provenance 清理。

Write scope:

- `docs/active/opl-meta-agent-ideal-state-gap-plan.md`、`docs/status.md`、`docs/active/opl-private-implementation-migration-inventory.md`、OMA contracts、`agent/` pack、`runtime/authority_functions/`、`scripts/lib/*` 和 tests 中仍影响 OMA owner boundary、script/source morphology 或 target-agent handoff vocabulary 的部分。

Live truth inputs:

- `AGENTS.md`、用户级 `~/.codex/TASTE.md`、核心五件套、本文、ideal-state reference、private implementation inventory。
- `contracts/opl_domain_manifest_registration.json`、`contracts/app_workbench_projection.json`、generated surface handoff、stage control plane、script-to-pack gate receipt、source-purity contracts 和 private implementation inventory。Production acceptance / real target scaleout contracts 只用于 false-ready boundary 或后置 evidence routing。
- OPL `agents interfaces --repo-dir <this-repo> --json`、OPL framework/App read-model shape、`npm test` / `npm run test:smoke` / `npm run test:behavior` / `npm run verify`。

Required actions:

- 不在本文维护 live / production evidence tail；本文只维护 `script_to_pack_hygiene` closed-structure-gate 后的持续退役/上收治理和 target-agent handoff vocabulary。
- 对新增或增长的 scripts/materializer 核实 active caller、authority boundary、no-forbidden-write、target owner route 和是否应迁入 `agent/`、`contracts/` 或 OPL primitive。
- 若推进 script-to-pack hygiene，先读取 receipt、morphology policy、OPL surface allowlist、`source-structure:json` 和 source-purity tests，再按 gate 补齐 caller、repo-local refs、OPL primitive parity、no-forbidden-write、no-active-caller 和 provenance refs；不要把 structure readback 写成 retirement、physical delete、readiness 或 parity claim。
- 已闭合项折回本文或核心五件套；proof 流水和旧路线进入 history/provenance。

Non-goals:

- 不新增第二套 active plan。
- 不修改 target domain truth、memory body、artifact body、quality/export verdict、owner receipt body 或 default promotion authority。
- 不添加 OMA 私有 generic runtime、Agent Lab runner、queue、attempt ledger、registry/App shell、domain-specific command family 或 compatibility facade。

Verification commands:

- Docs-only：`rtk git diff --check`、`rtk rg -n "<<<<<<<|>>>>>>>|=======" README* docs agent/README.md agent/professional_skills/README.md`、docs inventory sanity。
- 触及 contracts/source/tests：默认 `rtk npm test` / `rtk npm run test:smoke` 或 `rtk npm run verify`；触及 bootstrap、external-suite、work-order、owner-chain 或 live-progress behavior 时补 `rtk npm run test:behavior`。

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
- 本仓结构与 contract 口径：`npm test` / `npm run test:smoke` 或 `npm run verify`；behavior/full evidence 显式使用 `npm run test:behavior` / `npm run test:full`。
- 行为声明只固定 machine-readable contracts、stage/action refs、authority function refs、generated interface readiness、Agent Lab receipts、developer work-order receipts 和 no-forbidden-write boundary；测试不得固定本文措辞。
