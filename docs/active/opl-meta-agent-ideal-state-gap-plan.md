# opl-meta-agent 理想目标态差距与完善计划

Owner: `opl-meta-agent`
Purpose: `ideal_state_gap_plan`
State: `active_plan`
Machine boundary: 本文是人读 gap / completion plan。机器真相继续归 `contracts/`、`agent/`、`runtime/authority_functions/`、source、OPL Agent Lab result refs、developer work-order receipts、target owner receipts / typed blockers、candidate refs 和 tests。

## 当前唯一真相

本文是 `opl-meta-agent` 当前完成口径、功能/结构差距、测试/证据差距和近期完善计划的 single Active Truth owner。

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
- 当前 `functional_structure_gap_count=0` 只表示没有发现 repo-owned generic runtime、generated shell、workbench、sidecar 或 compatibility surface；它不能把 `scripts/` materializer、bootstrap pack writer、Agent Lab invocation helper 或 default-caller evidence contracts 写成 strict purity 完成态。
- Active source shape 的目标是 `Declarative Agent-Building Pack + OPL generated/hosted surfaces + minimal agent-building authority functions`。当前 repo active scripts 只能作为 authority implementation、smoke helper、fixture/proof helper 或 developer work-order materializer 暂留；稳定 policy 必须迁回 `agent/`、`contracts/`、`runtime/authority_functions/` 或 OPL primitive。
- Script-to-pack hygiene 现在有 machine-checkable 退役门：`runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy/script_to_pack_retirement_gates` 把 `agent:evidence` / `improve:external-suite` materializers、`build-agent-baseline` / stage-decomposition materializers、`execute:external-work-order` thin delegation 分成三组。每组必须先留下 OPL primitive parity、target-agent generic handoff 或 explicit fixture/proof path、no-forbidden-write、no-active-caller 和 tombstone/provenance refs，才能吸收或退役；没有这些 refs 时只保持薄物化，不能写成已由 OPL 接管。
- OMA 不能成为第二 Agent Lab 或第二 OPL Framework。`purpose_first_owner_delta_gate.second_framework_guard` 固定允许输出为 candidate package、developer patch work order、target capability candidate、mechanism proposal 或 typed blocker；Agent Lab runner、promotion gate、queue/attempt ledger、work-order execute/absorb/cleanup、registry/generated interface、App/workbench 和 target owner closeout hook invocation 都归 OPL / App / target owner。
- 当前未完成项主要是测试/证据尾项：OPL generated/default caller consumption tail、OPL registry / App 真实 discovery/render receipt、后续 cohort 的 repeat long-soak / live drilldown 证据、更多真实 target patch -> rerun -> owner receipt 样本、独立 Codex reviewer direct-evidence verdict、跨目标 agent 标准 handoff 收敛、domain refs-only adapter thinning 和持续 script-to-pack hygiene。`new_agent_consumption_scaleout` 已从 `publication-brief-agent` 单样本推进到 `publication-brief-agent` + `handoff-analyst-agent` 两个 cohort；第二个 cohort 修复并验证了 OMA 生成器对当前 OPL Progress-First scaffold 的消费，目标 pack 现在包含 `progress_delta_policy`、`typed_blocker_lineage_policy` 和 canonical `series_design_profile`，并被 OPL scaffold/conformance、generated interfaces、readiness 和 Agent Lab baseline 复验消费；这些样本仍保留 production/domain-ready tail open。
- OPL 侧当前已能把 OMA production-consumption read model 读成 refs-only verified ledger：当前 `opl runtime oma-production-consumption list --json` 输出 2 条 receipt，包括 1 条 verified long-soak ref 和 1 条历史 typed-blocker provenance ref；当前 CLI 输出以 `receipt_count` 和 per-receipt `authority_boundary` 为 machine-readable currentness surface，不再把旧 `open_gate_count` / `active_typed_blocker_ref_count` 作为当前输出字段。这个 ledger 只关闭当前 OPL refs-only consumption gate，旧 `long-soak-pending` typed blocker 只保留为 provenance；它不授权 target domain ready、family production ready、default promotion，也不替代后续 target cohort 的 repeat long-soak evidence。
- OPL stage replay missing-receipt ledger 现在已 record/verify OMA baseline-owner review 的 domain-owned typed blocker receipt：`opl://stage-replay-missing-receipt/opl-meta-agent%2Fstage-decomposition%2Fhuman_gate%3Aoma_baseline_owner_review`，source 为 `contracts/production_acceptance/meta-agent-production-acceptance.json#/stage_replay_human_gate_blocker_summary`。Fresh worklist 将 `human_gate:oma_baseline_owner_review` 从 missing ref 读为 `blocked_by_domain_owned_typed_blocker_ref`，但 success receipt 仍为 0；该 blocker 只说明 baseline owner review receipt pending，不授权 human approval、replay success、domain ready、production ready 或默认 promotion。
- 当前 `functional_structure_gap_count=0` 只表示没有发现 repo-owned generic runtime、generated shell、workbench、sidecar 或 compatibility surface；strict source-purity 仍有 `scripts/` materializer/helper 收薄和 OPL primitive replacement 尾项。
- OMA 不走 MAS/MAG/RCA 的 plugin packaged structure；外显入口保持 OPL generated skill surface / generated interface bundle。
- OMA 不走 MAS/MAG/RCA 的 plugin packaged structure；外显入口保持 OPL generated skill surface / generated interface bundle。

禁止误写：

- 不能把 generated surface proof、registration readiness、App projection readiness、suite pass、schema completeness、contract completeness、work-order shape、source-shape conformance 或 OPL refs-only consumption 写成 production ready、domain ready、quality verdict、App live rendering、owner receipt、human approval 或 default promotion。
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

## 已落地

| Area | 当前状态 | 主要证据 | 边界 |
| --- | --- | --- | --- |
| Standard domain pack | `done` | `agent/` pack、`contracts/pack_compiler_input.json`、`contracts/stage_control_plane.json`、`tests/contracts.test.ts` | README 和 prose 章节不作为 machine required path。 |
| Foundry Agent series pin | `done_for_structural_conformance` | `contracts/foundry_agent_series.json`、package dependency pin tests | 关闭 structural conformance blocker；不授权 domain ready、quality/export verdict、artifact/memory body、owner receipt 或 default promotion。 |
| Generated / registration / App projection | `done_with_external_consumption_tail` | `contracts/generated_surface_handoff.json`、`contracts/opl_domain_manifest_registration.json`、`contracts/app_workbench_projection.json` | OPL owns generated interfaces、registry 和 App shell；OMA 只提供 refs-only inputs。 |
| Work-order materialization | `done_with_more_real_loop_tail` | `npm run build-agent-baseline`、`takeover:test`、`improve:external-suite`、`agent:evidence`、work-order tests | 可输出 executable work order 或 typed blocker；目标 truth、quality、artifact、memory body、owner receipt 仍归 target owner。 |
| External work-order execution delegation | `done_as_thin_delegation` | `npm run execute:external-work-order`、`tests/execute-external-work-order.test.ts` | 只校验 refs 和委托 `opl work-order execute`；不持有 worktree lifecycle、runner、absorb、cleanup 或 owner receipt body。 |
| Stage executor policy candidates | `done_as_candidate_only` | `contracts/stage_control_plane.json`、stage executor policy tests | OMA 只声明 refs-only candidate；试验、binding、receipt、gate 和默认 executor promotion 归 OPL / Agent Lab。 |
| Production acceptance / consumption follow-through | `done_with_repeat_evidence_tail` | `contracts/production_acceptance/meta-agent-production-acceptance.json`、`contracts/production_acceptance/new_agent_consumption_evidence.json`、OPL production-consumption read model / refs-only ledger、OPL stage replay missing-receipt ledger | OPL 侧已可消费 OMA production-consumption refs，当前 cohort 的 long-soak ref 已 verified，历史 typed blocker 已退为 provenance；new-agent consumption 已有 2 个 cohort，且 `handoff-analyst-agent` 关闭了生成器对 current Progress-First scaffold 的 drift，证明新 Agent 对 Stage Pack v2 scaffold/conformance/generated interface/readiness/Agent Lab 和 generated App/workbench descriptor surfaces 的重复消费；`stage_replay_human_gate_blocker_summary` 让 `stage-decomposition / oma_baseline_owner_review` 的 replay human-gate 缺口变成 OMA-owned typed blocker。当前 ready、新消费样本和 typed blocker 都不授权 target domain ready、family production ready、未来 cohort long-soak、human approval 或默认 promotion。 |
| Purpose-first owner-delta gate | `active_gate` | `docs/status.md`、`runtime/authority_functions/meta-agent-authority-functions.json#purpose_first_owner_delta_gate`、`contracts/production_acceptance/meta-agent-production-acceptance.json#purpose_first_owner_delta_gate` | OMA 只给 target-agent semantics、developer work order、target capability / mechanism candidate 或 typed blocker；下一步必须指向明确 owner delta / receipt / gate / blocker。 |
| Script morphology | `active_hygiene` | `runtime/authority_functions/`、`scripts/lib/*`、私有实现迁移台账 | 当前脚本只允许是 authority implementation、smoke helper、fixture/proof helper 或 developer work-order materializer；它们不得成为第二 Agent Lab、promotion gate、registry/App shell、worktree lifecycle owner 或 target truth writer。 |
| Script-to-pack retirement gates | `active_machine_gate` | `runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy/script_to_pack_retirement_gates`、`tests/source-purity.test.ts` | 三组脚本面必须以 OPL primitive parity、target-agent generic handoff / explicit fixture path、no-forbidden-write、no-active-caller 和 tombstone/provenance refs 作为吸收或退役条件；gate 未齐时只能保留为薄 materializer/helper。 |
| Second-framework guard | `active_machine_guard` | `runtime/authority_functions/meta-agent-authority-functions.json#purpose_first_owner_delta_gate/second_framework_guard`、`tests/source-purity.test.ts` | OMA 只输出 candidate package、developer work order、target capability candidate、mechanism proposal 或 typed blocker refs；Agent Lab runner、promotion gate、queue、attempt ledger、work-order execute/absorb/cleanup、registry/App shell 与 target owner closeout hook invocation 保持外部 owner。 |
| Fallow TS/JS hygiene | `production_unused_surface_closed_with_complexity_tail` | `fallow --production`、`scripts/lib/*`、`scripts/agent-evidence-takeover.ts`、`scripts/improve-from-agent-lab-suite.ts` | unused export/type 应保持关闭；复杂度治理只允许继续按参数解析、contract loading、receipt/artifact materialization 等自然 helper 收薄，不能新增通用 CLI 框架或 runner。 |
| Clean-room skill pattern intake | `done_as_docs_and_contract_pattern` | `contracts/trajectory_learning_contract.json`、核心 docs/tests | 只吸收 xskill trajectory / candidate / canary / redaction 模式；不引入 daemon/runtime/scheduler/installer/server。 |
| Standard Agent source shape purity | `generic_shell_absent_with_script_hygiene_tail` | `contracts/functional_privatization_audit.json`、`contracts/default_caller_deletion_evidence.json`、`runtime/authority_functions/meta-agent-authority-functions.json#source_purity_scan_receipt`、`tests/source-purity.test.ts`、本文 | `functional_structure_gap_count=0` 只说明 repo-owned generic shell absent；default caller、sidecar、workbench 和 generated shell 只保留 OPL-owned refs 与 OMA boundary evidence tail。Scripts/materializers 仍是 strict source-purity hygiene tail，不能扩成 runner / promotion gate / workbench。 |

## 功能/结构差距

当前无 repo-owned generic runtime/shell gap，但仍有 strict source-purity hygiene gap。`functional_structure_gap_count=0` 只在以下条件继续成立时有效：

| Reopen trigger | 处理方式 |
| --- | --- |
| 新增 repo-owned generic CLI/MCP/Skill/product-entry wrapper、sidecar/status/workbench、scheduler、queue、attempt ledger、registry owner 或 App shell | 重新打开结构 gap，迁回 OPL generated/hosted surface 或退役。 |
| `scripts/` 承载 Agent Lab runner、promotion gate、target truth writer、owner receipt body writer、generic worktree lifecycle、target owner closeout hook owner 或 default promotion shortcut | 重新分类到私有实现迁移台账，并优先上收、收薄或删除。 |
| required domain pack path 退化为 README、目录存在性或 Markdown heading | 重新打开 pack structure gap，恢复真实 repo file refs。 |
| MAS/MAG/RCA 等 domain 名称进入 OMA 顶层 command family、suite kind 或长期 contract vocabulary | 重新打开标准消费者边界 gap，改回 target-agent generic vocabulary。 |
| `stage_executor_policy_candidate` 被写成 executor switch、quality equivalence、runner implementation 或 default promotion | 重新打开 stage executor policy boundary gap。 |

当前仍需持续治理的 strict source-purity 事项：

- OPL generated/default caller consumption tail 继续由 default-caller evidence、typed blocker/no-forbidden-write/provenance refs 和 OPL-side consumption receipt 管理。
- domain refs-only adapter thinning 继续压缩 adapter/materializer 边界；无法证明为 OMA minimal authority implementation 的 helper 要迁入 OPL primitive 或删除。
- `scripts/` 中稳定下来的 agent-building policy 继续迁回 `agent/`、`contracts/` 或 `runtime/authority_functions/`；脚本不得成为长期 private runner、Agent Lab replacement、workbench、promotion engine、worktree lifecycle owner、registry/App shell 或 compatibility facade。
- work order / candidate / typed blocker 的默认核查顺序改为 owner-delta first：先看 target-agent semantic delta 是否存在、下一 owner 是否明确、缺口是否返回 typed blocker，再看 suite / scaffold / generated interface / App descriptor 等 proof refs。
- script-to-pack 退役不再按“脚本看起来可上收”判断；必须满足对应 machine gate 中的 parity / no-active-caller / no-forbidden-write / tombstone-or-provenance refs。没有 gate 证据时，脚本仍是当前 active materializer/helper，不得在 active docs 写成已退役或已由 OPL primitive 接管。
- fallow production hygiene 继续作为 script surface 噪声门：unused export/type 不能重新进入 public API；复杂度热点只按真实职责边界拆成窄 helper，例如 target contract intake、artifact materialization、receipt materialization 或 policy projection。
- `runtime/authority_functions/meta-agent-authority-functions.json` 的 `source_purity_scan_receipt` 继续记录扫描到的 script refs、缺席的 repo-owned wrapper/runtime 路径、package surface 边界和允许保留的非污染 authority 面；任何新增 script 或 wrapper 路径都必须同步分类和测试。
- MAS/MAG/RCA/RCA-like target agents 的 handoff vocabulary 继续向同一 Agent Lab / OMA 标准接口收敛。
- OPL/App production consumption 当前 cohort 的 refs-only gate 已观测为 ready；App render/runtime drilldown、后续 cohort repeat long-soak 和更多 target patch-loop 样本仍属于证据尾项。

## 测试/证据差距

| Evidence gap | 当前已有 | 仍缺 |
| --- | --- | --- |
| OPL registry discovery consumption | OMA registration contract 与 refs-only discovery receipt surface | OPL 主仓或 App 侧真实 registry consumption receipt。 |
| App/workbench live consumption | App projection contract、drilldown readiness receipt、refs-only production-consumption read-model evidence | 真实 App render/screenshot、live runtime drilldown closeout receipt 和 repeat long-soak evidence。 |
| Repeated new-agent scaffold/conformance/readiness consumption | 明确 target-agent baseline、real-target receipt surfaces、已记录的新消费样本 | 更多非 fixture target cohorts 的 App live path、domain owner receipt 或 typed blocker，以及 long-soak 证据。 |
| Real blocked target patch loop scaleout | OMA work-order shape、MAG/MAS 类真实 target refs-only closeout evidence | 更多真实 target patch / rerun / owner receipt / typed blocker / no-forbidden-write / runtime-read-model consumption / workspace proof / cleanup / Agent Lab re-evaluation 样本。 |
| Independent Codex reviewer attempt | structured reviewer schema、fail-closed rules、reviewer evidence projection | 独立 invocation/context/trace/receipt、direct evidence、source refs、critique/suggestions/verdict/provenance 与 rollback/canary/version refs 的真实样本。 |
| Standard target-agent handoff convergence | OMA 侧 target-agent generic intake 已落地 | 目标 agent 侧持续提供同一 vocabulary，不在 OMA 或 Agent Lab 添加 domain-specific suite / command。 |
| Script-to-pack evidence | 私有实现迁移台账、source-purity guards、当前实现文件 split-pressure 分类 | 后续增长时继续证明脚本只是 materializer/helper；稳定规则迁入 declarative pack、contracts 或 OPL primitive。 |
| Mechanism proposal promotion | mechanism patch proposal 为 proposal-only surface | OPL / Agent Lab promotion gate receipt 与 target owner evidence，才能进入默认 agent 变更。 |

## 近期完善计划

1. `registry_app_consumption`
   让 OPL 主仓或 App 侧消费 `contracts/opl_domain_manifest_registration.json` 与 `contracts/app_workbench_projection.json`，留下 registry discovery receipt、App render/screenshot/runtime drilldown receipt；后续 cohort 若缺 evidence 必须 record/verify domain-owned typed blocker。

2. `new_agent_consumption_scaleout`
   继续用更多非 fixture target agent 复验 `build-agent-baseline` 生成的 Stage Pack v2、file-backed independent gate、generated interface、Agent Lab baseline、readiness 和 App/workbench descriptor consumption；每个样本都必须显式记录 open production/domain-ready tail。

3. `real_blocked_target_patch_loop_scaleout`
   在更多真实 target agents 上执行带 AHE 四字段的 developer work order：Codex 只改 allowed editable surfaces，重跑目标验证，记录 target runtime/read-model consumption、workspace proof、no-forbidden-write、owner receipt 或 typed blocker、patch absorption、cleanup 和 Agent Lab re-evaluation。

4. `independent_codex_reviewer_attempt`
   为真实 patch-loop 补独立 Codex reviewer attempt。reviewer 必须基于 direct evidence，保持 no-shared-context provenance，并输出 source refs、critique、suggestions、verdict 和 rollback/canary/version refs。

5. `standard_target_agent_handoff_convergence`
   推动 MAS/MAG/RCA 和新 Foundry Agent 用同一 target-agent vocabulary 暴露 production/live acceptance、Agent Lab handoff、owner route、editable surface policy、required return shapes、verification refs 和 no-forbidden-write proof。

6. `script_to_pack_hygiene`
   持续把稳定 policy 迁入 declarative pack、contracts 或 OPL primitive；保留脚本必须能指向 `runtime/authority_functions`、smoke action、fixture/proof helper 或 developer work-order materializer。每次新增或收薄脚本，都要更新 `script_to_pack_retirement_gates` 或证明该脚本已有 gate 覆盖，并跑 `tests/source-purity.test.ts`。

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
