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

本仓已具备 OPL standard domain-agent scaffold、真实 `agent/` domain pack、refs-only generated / registration / App projection input、Agent Lab / takeover / developer work-order materialization surface、external work-order thin delegation、State Index Kernel refs-only adoption 和 source-purity guard。当前 tracked source 没有 repo-owned generic runtime、generated shell、workbench、sidecar 或 compatibility surface。

`functional_structure_gap_count=0` 只说明这类私有通用壳 absent；它不能把 `scripts/` materializer、Agent Lab invocation helper、bootstrap pack writer 或 default-caller evidence contract 写成 strict purity 完成态。`contracts/developer_work_order_policy.json` 现在持有 developer work-order 默认 forbidden surfaces、runtime/workspace verification refs 和 closeout evidence policy；`contracts/standard_foundry_policies.json` 现在持有 standard Foundry stage-log、progress-delta、typed-blocker lineage 和 series-design policy；对应脚本只做 contract projection。其他 `scripts/` 只能保持为 authority implementation、smoke/proof helper、fixture helper、thin delegation 或 developer work-order materializer；`stage-decomposition-pack-draft.ts` 已收薄为 public export entry，builder / validator / materializer / shared helper 已拆入 `scripts/lib/stage-decomposition-pack-draft-parts/` 并纳入 script-to-pack machine gate。新增或继续稳定下来的 policy 必须迁回 `agent/`、`contracts/`、`runtime/authority_functions/` 或 OPL primitive。

OMA 的默认输出只允许是 target-agent semantics、developer work order、target capability candidate、mechanism proposal 或 typed blocker。下一跳必须指向 target owner、OPL Framework / Agent Lab / App 或 human gate 需要产出的 owner delta、receipt、gate 或 blocker。

## 已落地边界

| Surface | 当前状态 | 机器入口 | 边界 |
| --- | --- | --- | --- |
| Domain pack | `agent/knowledge`、`agent/prompts`、`agent/quality_gates`、`agent/skills`、`agent/stages` 提供真实 pack 文件 | `contracts/pack_compiler_input.json`、`contracts/stage_control_plane.json`、`tests/contracts.test.ts` | README 只做人读索引，不作为 `required_domain_pack_paths`。 |
| Foundry Agent series | OMA 使用 canonical Foundry-series lifecycle，并声明 OMA-specific agent-building profile | `contracts/foundry_agent_series.json`、package dependency pin tests | OMA 不走 plugin packaged structure，外显入口保持 OPL generated skill surface / generated interface bundle。 |
| Generated / registry / App projection | 本仓提供 refs-only registration、generated handoff 和 App projection inputs | `contracts/generated_surface_handoff.json`、`contracts/opl_domain_manifest_registration.json`、`contracts/app_workbench_projection.json` | OPL/App 持有 generated interface、registry、product/workbench shell；本仓不声明 App live rendering 或 generated surface owner。 |
| Work-order materialization | `build-agent-baseline`、`takeover:test`、`improve:external-suite`、`agent:evidence` 和 `execute:external-work-order` 已形成 refs-only action surface | `contracts/action_catalog.json`、scripts、work-order tests | 可输出 receipt、candidate、work order、mechanism proposal 或 typed blocker；不能写 target truth、memory body、artifact body、quality/export verdict、owner receipt body 或 default promotion。 |
| Developer work-order policy | 默认 forbidden surfaces、runtime/workspace verification refs 和 closeout evidence policy 已迁入 machine-readable contract | `contracts/developer_work_order_policy.json`、`scripts/lib/work-order-policy-constants.ts`、`tests/source-purity.test.ts` | 脚本只投影 contract 给 active callers；不持有 policy truth、不运行 Agent Lab、不接管 OPL work-order primitive、target owner closeout、absorb、cleanup 或 promotion gate。 |
| Standard Foundry policy | Stage-log、progress-delta、typed-blocker lineage 和 series-design defaults 已迁入 machine-readable contract | `contracts/standard_foundry_policies.json`、`scripts/lib/standard-foundry-policies.ts`、`tests/source-purity.test.ts` | 脚本只投影 contract 给 stage-decomposition materializer；不持有 policy truth、不替代 OPL Framework / Agent Lab、不授权 target truth、quality/export、default promotion 或 owner receipt body。 |
| State Index Kernel adoption | OMA 声明消费 OPL-owned SQLite sidecar index，只提供可索引 refs | `contracts/stage_artifact_kernel_adoption.json`、`contracts/stage_control_plane.json`、`tests/contracts.test.ts` | 只索引 candidate package / Agent Lab result / developer work-order / typed blocker / proposal refs；不能拥有 target runtime、queue、attempt ledger、promotion gate、worktree lifecycle、target truth 或 owner receipt body。 |
| External work-order execution | OMA 只做 shape validation 和 OPL primitive delegation | `npm run execute:external-work-order`、`tests/execute-external-work-order.test.ts` | target worktree lifecycle、runner、queue、attempt ledger、absorb、cleanup 和 owner closeout hook invocation 归 OPL / target owner。 |
| Source-purity guard | repo-owned wrapper/runtime surface 仍保持缺席 | `contracts/functional_privatization_audit.json`、`runtime/authority_functions/meta-agent-authority-functions.json`、`tests/source-purity.test.ts` | `scripts/` 只能是 authority implementation、smoke/proof helper、fixture helper、thin delegation 或 developer work-order materializer。 |

## 当前证据尾项

- `registry_app_consumption`：本仓已提供 refs-only discovery / App projection surface；真实 registry discovery receipt、App render/screenshot、live runtime drilldown closeout 和 repeat long-soak 证据仍归 OPL/App 侧落证。
- `real_blocked_target_patch_loop_scaleout`：OMA work order shape 已能表达 patch -> rerun -> owner receipt / typed blocker closeout；后续需要更多真实 target patch-loop 样本、no-forbidden-write proof、cleanup closeout 和 Agent Lab re-evaluation refs。
- `independent_codex_reviewer_attempt`：结构化 reviewer schema 与 fail-closed rules 已存在；真实独立 invocation/context/trace/receipt、direct evidence、source refs、critique/suggestions/verdict/provenance 与 rollback/canary/version refs 仍是证据尾项。
- `standard_target_agent_handoff_convergence`：OMA 消费 target-agent generic handoff；MAS/MAG/RCA 和新 Foundry Agent 需要持续提供同一 vocabulary，不能在 OMA 或 Agent Lab 内新增 domain-specific command family。
- `script_to_pack_hygiene`：developer work-order 默认 policy 与 standard Foundry policy bundle 已迁入 contract-backed projection；后续新增或继续稳定下来的 agent-building policy 必须继续迁回 declarative pack、contracts、authority refs 或 OPL primitive；脚本退役只能按 machine gate 证明。
- `stage_executor_policy_candidate`：OMA 只声明 refs-only candidate；非默认 executor 的 binding、试验、receipt、gate 和默认 executor promotion 归 OPL / Agent Lab。

## 不可升级的声明

Generated surface proof、registry/App projection readiness、suite pass、schema completeness、contract completeness、work-order shape、source-shape conformance 或 OPL refs-only consumption 都不能写成 target domain ready、family production ready、quality verdict、artifact readiness、owner receipt body、App live rendering、human approval 或 default promotion。

## 当前读法

- 当前 completion/gap/prompt：[`docs/active/opl-meta-agent-ideal-state-gap-plan.md`](./active/opl-meta-agent-ideal-state-gap-plan.md)。
- 私有实现、script hygiene、default-caller tail 和 OPL primitive 上收边界：[`docs/active/opl-private-implementation-migration-inventory.md`](./active/opl-private-implementation-migration-inventory.md)。
- 文档生命周期与每份文档唯一职责：[`docs/docs_portfolio_consolidation.md`](./docs_portfolio_consolidation.md)。
