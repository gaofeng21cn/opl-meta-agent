# opl-meta-agent 状态

Owner: `opl-meta-agent`
Purpose: `current_status_and_evidence_boundary`
State: `active_truth`
Machine boundary: 本文是人读状态摘要。机器真相继续归 `contracts/`、`agent/`、`runtime/authority_functions/`、source、CLI/API 行为、OPL Agent Lab result refs、work-order receipts、target owner receipts / typed blockers 和 tests。

Plugin native profile pointer: `contracts/opl-native-profile.json` 只声明插件同步/发现所需的 repo-native profile；它不是 domain truth、active gap、read model、runtime authority 或 owner receipt。

Docs lifecycle boundary: 本文件只保留当前能力状态、边界、剩余尾项和不能声明的结论。Coverage tranche、doctor transcript、branch/worktree closeout、dated proof packet 和 repeated no-drift 记录只进入 `docs/history/process/` 索引；durable 结论折回 active gap plan、private inventory、contracts、source 或 tests。

## 当前状态

`opl-meta-agent` 是独立 OPL-compatible Foundry Agent，负责 agent-building / improvement 语义。它不是 OPL Framework 内置模块，也不是 MAS/MAG/RCA 这类 target-domain truth owner。

当前目标物理形态是：

```text
Declarative Agent-Building Pack
  + OPL generated/hosted surfaces
  + minimal agent-building authority functions
```

本仓已具备 OPL standard domain-agent scaffold、真实 `agent/` domain pack、refs-only generated / registration / App projection input、Agent Lab / takeover / developer work-order materialization surface、external work-order thin delegation、State Index Kernel refs-only adoption、StageRun controlled canary evidence 和 source-purity guard。当前 tracked source 没有 repo-owned generic runtime、generated shell、workbench、sidecar 或 compatibility surface。

StageRun Kernel 当前补充了 agent-building canary：`intent-intake -> stage-decomposition-candidates -> mechanism-and-test-review -> owner-approval-or-typed-blocker`。`contracts/stage_run_canary_evidence.json` 固定了一份 controlled fixture evidence，覆盖 candidate generation、grounded reflection、comparative selection、evolution/revision、meta-review learning、independent quality gate 与 owner receipt closeout refs，并提供 `operator_summary` 给 operator 读取受控 canary 的阶段、refs、closeout 和 next-delta 摘要。该证据只证明 repo-local StageRun canary shape 可被合同和测试消费，不声明 live domain progress；工具只作为 affordance refs，不能变成固定 workflow、domain verdict、owner approval 或 wrapper 恢复路径。

Target-agent owner-chain evidence 已新增为机器合同：`contracts/target_agent_owner_chain_evidence.json` 记录 OPL-hosted `build-agent-baseline`、`takeover-target-agent-test`、`improve-from-external-agent-lab-suite` 和 `execute-external-work-order` path 可接受的 target-agent owner receipt、typed blocker、developer / execution work-order receipt 和 no-regression ref shapes，并把 false-authority flags 固定为 refs-only。该 readout 证明 OMA 能表达 live progress evidence 的 owner-chain ref shape；它不真实修改外部 target repo，不生成实际 candidate agent body，不声明 target domain ready、production ready、target artifact authority、quality/export verdict 或 target owner receipt body。

StageRun overclaim boundary 已进入机器合同：`contracts/stage_run_kernel_profile.json#agent_building_stage_run_canary.overclaim_boundary` 只允许声明 repo-local canary shape 可消费、controlled fixture strategy refs 存在、owner receipt 或 typed blocker ref 存在、legacy residue guard 已声明；禁止升级为 live domain progress、target-agent readiness、quality/export verdict、Agent Lab promotion readiness、production readiness、App live rendering、human approval、default promotion 或 OPL 物化 owner receipt body。`legacy_runtime_residue_guard` 把旧 runtime/status/workbench residue 守卫绑定到 functional privatization audit、default-caller deletion evidence、source-purity scan receipt 和 source-purity tests；它只能证明 guard 存在，不能授权物理删除或恢复 repo-owned runtime wrapper。

`functional_structure_gap_count=0` 只说明这类私有通用壳 absent；它不能把 `scripts/` materializer、Agent Lab invocation helper、bootstrap pack writer 或 default-caller evidence contract 写成 strict purity 完成态。Script-to-pack 当前 truth 归 `docs/active/opl-private-implementation-migration-inventory.md`、`runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy/script_to_pack_retirement_gates` 和 `tests/source-purity.test.ts`：稳定 policy 已迁回 contracts，保留脚本只能是 authority implementation、smoke/proof helper、thin delegation 或 developer work-order materializer；没有 machine gate 证据时，不能写成已由 OPL 接管、已退役或可恢复 compatibility surface。

OMA 的默认输出只允许是 target-agent semantics、developer work order、target capability candidate、mechanism proposal 或 typed blocker。下一跳必须指向 target owner、OPL Framework / Agent Lab / App 或 human gate 需要产出的 owner delta、receipt、gate 或 blocker。

## 已落地边界

| Surface | 当前状态 | 机器入口 | 边界 |
| --- | --- | --- | --- |
| Domain pack | `agent/knowledge`、`agent/prompts`、`agent/quality_gates`、`agent/skills`、`agent/stages` 提供真实 pack 文件 | `contracts/pack_compiler_input.json`、`contracts/stage_control_plane.json`、`tests/contracts-domain-pack.test.ts`、`tests/contracts-stage-control.test.ts` | README 只做人读索引，不作为 `required_domain_pack_paths`。 |
| Foundry Agent series | OMA 使用 canonical Foundry-series lifecycle，并声明 OMA-specific agent-building profile | `contracts/foundry_agent_series.json`、package dependency pin tests | OMA 不走 plugin packaged structure，外显入口保持 OPL generated skill surface / generated interface bundle。 |
| Generated / registry / App projection | 本仓提供 refs-only registration、generated handoff 和 App projection inputs | `contracts/generated_surface_handoff.json`、`contracts/opl_domain_manifest_registration.json`、`contracts/app_workbench_projection.json` | OPL/App 持有 generated interface、registry、product/workbench shell；本仓不声明 App live rendering 或 generated surface owner。 |
| Work-order materialization | `build-agent-baseline`、`takeover:test`、`improve:external-suite`、`agent:evidence` 和 `execute:external-work-order` 已形成 refs-only action surface | `contracts/action_catalog.json`、scripts、work-order tests | 可输出 receipt、candidate、work order、mechanism proposal 或 typed blocker；不能写 target truth、memory body、artifact body、quality/export verdict、owner receipt body 或 default promotion。 |
| Developer work-order policy | 默认 forbidden surfaces、runtime/workspace verification refs 和 closeout evidence policy 已迁入 machine-readable contract | `contracts/developer_work_order_policy.json`、`scripts/lib/work-order-refs.ts`、`tests/source-purity.test.ts` | Active caller 通过 work-order refs owner helper 直接消费 contract；旧 standalone projection helper 已退役，不持有 policy truth、不运行 Agent Lab、不接管 OPL work-order primitive、target owner closeout、absorb、cleanup 或 promotion gate。 |
| Target improvement change-ref policy | `improve:external-suite` 只消费目标 agent 显式声明的 `default_change_refs` / `change_ref_mappings`，缺 policy 时返回 typed blocker | `scripts/lib/target-improvement-policy.ts`、`scripts/lib/external-suite-materializer.ts`、`runtime/authority_functions/meta-agent-authority-functions.json`、`tests/external-suite-developer-work-order.test.ts`、`tests/source-purity.test.ts` | 旧 `external_agent/*` generic patch-ref fallback 已退役；不得用 OMA 内置默认 refs 生成 source patch work order、compatibility route、facade 或 old public path。 |
| Standard Foundry policy | Stage-log、progress-delta、typed-blocker lineage 和 series-design defaults 已迁入 machine-readable contract | `contracts/standard_foundry_policies.json`、`scripts/lib/stage-decomposition-pack-draft-parts/shared.ts`、`tests/source-purity.test.ts` | Stage-decomposition owner helper 直接消费 contract；旧 standalone projection helper 已退役，不持有 policy truth、不替代 OPL Framework / Agent Lab、不授权 target truth、quality/export、default promotion 或 owner receipt body。 |
| State Index Kernel adoption | OMA 声明消费 OPL-owned SQLite sidecar index，只提供可索引 refs | `contracts/stage_artifact_kernel_adoption.json`、`contracts/stage_control_plane.json`、`tests/contracts-stage-control.test.ts` | 只索引 candidate package / Agent Lab result / developer work-order / typed blocker / proposal refs；不能拥有 target runtime、queue、attempt ledger、promotion gate、worktree lifecycle、target truth 或 owner receipt body。 |
| StageRun Kernel canary | OMA 声明 agent-building StageRun canary、controlled evidence fixture、operator summary、overclaim boundary 和旧 wrapper/status/workbench residue guard | `contracts/stage_run_kernel_profile.json`、`contracts/stage_run_canary_evidence.json`、`tests/contracts-stage-run-kernel.test.ts` | canary 只允许 intent / candidate / review / receipt-or-blocker refs；controlled fixture 的 `evidence_scope=controlled_fixture_not_live_domain_progress`，operator summary 不能升级 readiness，旧脚本、runtime wrapper、status shell、workbench wrapper 只能作为 migration input、diagnostic 或 provenance refs，不能恢复为 active workflow owner。 |
| Target-agent owner-chain evidence | OMA 声明 OPL-hosted generated action path 的 live-progress ref shape readout | `contracts/target_agent_owner_chain_evidence.json`、`contracts/stage_run_kernel_profile.json`、`contracts/action_catalog.json`、`tests/target-agent-owner-chain-evidence.test.ts` | 只接受 owner receipt / typed blocker / work-order receipt / no-regression refs；不真实修改 target repo，不生成实际 candidate agent body，不持有 target domain ready、production ready、target artifact authority、quality/export verdict 或 target owner receipt body。 |
| External work-order execution | OMA 只做 shape validation 和 OPL primitive delegation | `npm run execute:external-work-order`、`tests/execute-external-work-order.test.ts` | target worktree lifecycle、runner、queue、attempt ledger、absorb、cleanup 和 owner closeout hook invocation 归 OPL / target owner。 |
| Source-purity guard | repo-owned wrapper/runtime surface 仍保持缺席 | `contracts/functional_privatization_audit.json`、`runtime/authority_functions/meta-agent-authority-functions.json`、`tests/source-purity.test.ts` | `scripts/` 只能是 authority implementation、smoke/proof helper、fixture helper、thin delegation 或 developer work-order materializer。 |

Source-structure / line-budget 检查属于 daily / strict maintenance 的
source-size 治理信号，不进入普通开发的 hard gate。`scripts/verify.sh
structure`、`npm run source-structure` 和 `npm run line-budget` 执行 advisory
lane；`scripts/verify.sh structure:strict`、`npm run source-structure:strict`
和 `npm run line-budget:strict` 才作为硬失败。`contracts/stage_control_plane.json`
仍是现有 consumer aggregate path；维护源是
`contracts/stage_control_plane.source.json`、`contracts/stage_control_plane.leaf-index.json`
和 `contracts/stage_control_plane.parts/**`，用 `npm run stage-control:write`
重建 aggregate，用 `npm run stage-control:check` 防止 drift。`scripts/verify.sh
smoke`、`npm test`、`npm run typecheck` 和 repo hygiene 继续验证当前合同、源码、
测试与生成物边界，不把普通开发默认升级为行数硬门。

## 当前证据尾项

- `registry_app_consumption`：本仓已提供 refs-only discovery / App projection surface；真实 registry discovery receipt、App render/screenshot、live runtime drilldown closeout 和 repeat long-soak 证据仍归 OPL/App 侧落证。
- `real_blocked_target_patch_loop_scaleout`：当前多目标 refs-only scaleout gate 已由 `contracts/real_target_agent_scaleout_evidence.json` 记录 MAS/MAG 两个真实目标的 delivery receipt、owner receipt / typed blocker refs、Agent Lab result refs、no-forbidden-write proof 和 cleanup closeout refs；App/workbench projection 与 tests 固定 patch-loop machine refs 加 independent reviewer evidence/provenance refs。后续尾项是更多目标 cohort、真实 source patch / rerun、真实独立 reviewer invocation/context/trace/receipt 样本、App/OPL live consumption 和目标 owner gate 证据；这些 refs 不授权 domain ready、quality/export verdict、owner receipt body、App live rendering 或 default promotion。
- `independent_codex_reviewer_attempt`：结构化 reviewer schema、fail-closed rules 与 controlled canary independent gate refs 已存在；真实独立 invocation/context/trace/receipt、direct evidence、source refs、critique/suggestions/verdict/provenance 与 rollback/canary/version refs 仍是证据尾项。
- `standard_target_agent_handoff_convergence`：OMA 消费 target-agent generic handoff；MAS/MAG/RCA 和新 Foundry Agent 需要持续提供同一 vocabulary，不能在 OMA 或 Agent Lab 内新增 domain-specific command family。
- `script_to_pack_hygiene`：developer work-order 默认 policy 与 standard Foundry policy bundle 已迁入 contract-backed projection；后续新增或继续稳定下来的 agent-building policy 必须继续迁回 declarative pack、contracts、authority refs 或 OPL primitive；脚本退役只能按 machine gate 证明。
- `stage_executor_policy_candidate`：OMA 只声明 refs-only candidate；非默认 executor 的 binding、试验、receipt、gate 和默认 executor promotion 归 OPL / Agent Lab。

## 不可升级的声明

Generated surface proof、registry/App projection readiness、controlled canary evidence、controlled canary operator summary、overclaim boundary pass、legacy runtime residue guard、suite pass、schema completeness、contract completeness、work-order shape、source-shape conformance 或 OPL refs-only consumption 都不能写成 target domain ready、live domain progress、family production ready、quality verdict、artifact readiness、owner receipt body、App live rendering、human approval 或 default promotion。

## 当前读法

- 当前 completion/gap/prompt：[`docs/active/opl-meta-agent-ideal-state-gap-plan.md`](./active/opl-meta-agent-ideal-state-gap-plan.md)。
- 私有实现、script hygiene、default-caller tail 和 OPL primitive 上收边界：[`docs/active/opl-private-implementation-migration-inventory.md`](./active/opl-private-implementation-migration-inventory.md)。
- 文档生命周期与每份文档唯一职责：[`docs/docs_portfolio_consolidation.md`](./docs_portfolio_consolidation.md)。
