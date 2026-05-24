# opl-meta-agent 理想目标态差距与完善计划

Owner: `opl-meta-agent`
Purpose: `ideal_state_gap_plan`
State: `active_plan`
Machine boundary: 本文是人读 gap / completion plan。机器真相继续归 `contracts/`、`agent/`、`runtime/authority_functions/`、source、OPL Agent Lab result refs、developer work-order receipts、owner receipts、candidate refs 和未来 delivery receipts。
Date: `2026-05-24`

## 当前唯一真相

本文是 `opl-meta-agent` 当前完成进度、功能/结构差距、测试/证据差距和近期完善计划的 single Active Truth owner。North-star 目标态只维护在 [opl-meta-agent 理想目标态](../references/opl-meta-agent-ideal-state.md)；私有实现分类、脚本收薄和上收候选只维护在 [opl-meta-agent 私有实现与 OPL 迁移台账](./opl-private-implementation-migration-inventory.md)；公开状态、架构边界、硬约束和决策分别回到核心五件套。

当前结论：

- `opl-meta-agent` 是 OPL-compatible Foundry Agent，不是 OPL Framework 内置模块。
- 理想物理形态是 `Declarative Agent-Building Pack + OPL generated/hosted surfaces + minimal agent-building authority functions`。
- 当前功能/结构 gap 为 `0`：`agent/` pack、contracts、generated-surface handoff、minimal authority refs、developer work-order materializer 和 no-forbidden-write boundary 已落地；这个判断以 repo-native tests 和 contracts 为前提。
- 当前未完成项主要是测试/证据尾项：OPL registry / App 真实 discovery/render receipt、后续 cohort 的 repeat long-soak / live drilldown 证据、更多真实 target patch -> rerun -> owner receipt 样本、独立 Codex reviewer direct-evidence verdict、跨目标 agent 标准 handoff 收敛和持续 script-to-pack hygiene。
- OPL 侧当前已能把 OMA production-consumption read model 读成 ready；这个 ready 只关闭 OPL refs-only consumption gate，不授权 target domain ready、family production ready、default promotion，也不替代后续 target cohort 的 repeat long-soak evidence。

禁止误写：

- 不能把 generated surface proof、registration readiness、App projection readiness、suite pass、schema completeness、contract completeness 或 work-order shape 写成 production ready、domain ready、quality verdict、App live rendering、owner receipt 或 default promotion。
- 不能把 Agent Lab / OMA 写成 MAS、MAG、RCA 专用兼容层。正确口径是标准 OPL Agent 提供 Agent Lab / OMA 可消费的 handoff、suite seed、owner route、receipt、no-forbidden-write 和 verification refs。
- 不能把 `scripts/` 中的 smoke / materializer / helper 写成 OPL generic runtime、Agent Lab runner、queue、attempt ledger、registry owner、App shell、target truth writer 或 promotion gate。

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
| Standard domain pack | `done` | `agent/knowledge`、`agent/prompts`、`agent/quality_gates`、`agent/skills`、`agent/stages`、`contracts/pack_compiler_input.json`、`tests/contracts.test.ts` | README 和 prose 章节不作为 machine required path。 |
| Generated / registration / App projection surface | `done_with_external_consumption_tail` | `contracts/generated_surface_handoff.json`、`contracts/opl_domain_manifest_registration.json`、`contracts/app_workbench_projection.json` | OPL owns generated interfaces、registry 和 App shell；OMA 只提供 refs-only inputs。 |
| Real target scaleout evidence contract | `done_with_sample_tail` | `contracts/real_target_agent_scaleout_evidence.json` 标记 `multi_target_scaleout_closed_by_refs_only_receipts`，目标 refs 覆盖 MAS + MAG | 关闭的是 OMA refs-only scaleout gate，不授权 domain ready / quality verdict / default promotion。 |
| Developer work-order materialization | `done_with_more_real_loop_tail` | `npm run improve:external-suite`、`npm run agent:evidence`、work-order tests、`scripts/lib/work-order-*` | 可输出 executable work order 或 typed blocker；目标 truth、quality、artifact、owner receipt 仍归 target owner。 |
| External work-order execution delegation | `done_as_thin_delegation` | `npm run execute:external-work-order`、`tests/execute-external-work-order.test.ts` | 只校验 refs 和委托 `opl work-order execute`；不持有 worktree lifecycle、runner、absorb、cleanup 或 owner receipt body。 |
| Stage executor policy candidates | `done_as_candidate_only` | `contracts/stage_control_plane.json`、stage executor policy tests | OMA 只声明 refs-only candidate；试验、binding、receipt、gate 和默认 executor promotion 归 OPL / Agent Lab。 |
| Production acceptance / consumption follow-through | `done_with_repeat_evidence_tail` | `contracts/production_acceptance/meta-agent-production-acceptance.json`、OPL production-consumption read model / refs-only ledger | OPL 侧已可消费 OMA production-consumption refs；当前 ready 只说明 OPL refs-only consumption gate 闭合，不授权 target domain ready、family production ready 或默认 promotion。 |
| Script morphology | `active_hygiene` | `runtime/authority_functions/`、`scripts/lib/*`、私有实现迁移台账 | 当前脚本只允许是 authority implementation、smoke helper、fixture/proof helper 或 developer work-order materializer。 |
| Clean-room skill pattern intake | `done_as_docs_and_contract_pattern` | `contracts/trajectory_learning_contract.json`、核心 docs/tests | 只吸收 xskill trajectory / candidate / canary / redaction 模式；不引入 daemon/runtime/scheduler/installer/server。 |

## 功能/结构差距

当前无 open 功能/结构差距。这个判断只在以下条件继续成立时有效：

| Reopen trigger | 处理方式 |
| --- | --- |
| 新增 repo-owned generic CLI/MCP/Skill/product-entry wrapper、sidecar/status/workbench、scheduler、queue、attempt ledger、registry owner 或 App shell | 重新打开结构 gap，迁回 OPL generated/hosted surface 或退役。 |
| `scripts/` 承载 Agent Lab runner、promotion gate、target truth writer、owner receipt body writer、generic worktree lifecycle 或 default promotion shortcut | 重新分类到私有实现迁移台账，并优先上收、收薄或删除。 |
| required domain pack path 退化为 README、目录存在性或 Markdown heading | 重新打开 pack structure gap，恢复真实 repo file refs。 |
| MAS/MAG/RCA 等 domain 名称进入 OMA 顶层 command family、suite kind 或长期 contract vocabulary | 重新打开标准消费者边界 gap，改回 target-agent generic vocabulary。 |
| `stage_executor_policy_candidate` 被写成 executor switch、quality equivalence、runner implementation 或 default promotion | 重新打开 stage executor policy boundary gap。 |

当前仍需持续治理但不计入功能/结构 gap 的事项：

- `scripts/` 中稳定下来的 agent-building policy 继续迁回 `agent/`、`contracts/` 或 `runtime/authority_functions/`。
- MAS/MAG/RCA/RCA-like target agents 的 handoff vocabulary 继续向同一 Agent Lab / OMA 标准接口收敛。
- OPL/App production consumption、long-soak、App render/runtime drilldown 和更多 target patch-loop 样本属于证据尾项。

## 测试/证据差距

| Evidence gap | 当前已有 | 仍缺 |
| --- | --- | --- |
| OPL registry discovery consumption | OMA registration contract 与 discovery receipt surface | OPL 主仓或 App 侧真实 registry consumption receipt。 |
| App/workbench live consumption | App projection contract、drilldown readiness receipt、OPL production-consumption refs-only gate 已可消费 OMA evidence | 后续 target cohort 的真实 App render/screenshot、live runtime drilldown closeout receipt 和 repeat long-soak evidence；当前 OPL-side consumption ready 不授权 target default promotion。 |
| Stage launch on real target | work order 输入 refs、allowed editable surfaces、verification refs、owner route、no-forbidden-write refs 已成形 | 更多真实目标仓 stage attempt refs、typed blocker 或 executable developer work order。 |
| Independent Codex reviewer attempt | structured reviewer schema、fail-closed rules、reviewer evidence projection | 独立 invocation/context/trace/receipt、direct evidence、source refs、critique/suggestions/verdict/provenance 与 rollback/canary/version refs 的真实样本。 |
| Real blocked target patch loop scaleout | MAG closeout projection、MAS + MAG refs-only scaleout gate | 更多真实 target patch / rerun / owner receipt / no-forbidden-write / runtime-read-model consumption / workspace proof / cleanup / Agent Lab re-evaluation 样本。 |
| Standard target-agent handoff convergence | OMA 侧 target-agent generic intake 已落地 | 目标 agent 侧持续提供同一 vocabulary，不在 OMA 或 Agent Lab 添加 domain-specific suite / command。 |
| Script-to-pack evidence | 私有实现迁移台账、当前实现文件仍低于本仓拆分门槛 | 后续增长时继续证明脚本只是 materializer/helper；稳定规则迁入 declarative pack、contracts 或 OPL primitive。 |
| Mechanism proposal promotion | mechanism patch proposal 为 proposal-only surface | OPL / Agent Lab promotion gate receipt 与 target owner evidence，才能进入默认 agent 变更。 |

## 近期完善计划

1. `registry_app_consumption`
   让 OPL 主仓或 App 侧消费 `contracts/opl_domain_manifest_registration.json` 与 `contracts/app_workbench_projection.json`，留下 registry discovery receipt、App render/screenshot/runtime drilldown receipt；若 long-soak 仍未落证，至少 record/verify OMA-owned typed blocker。

2. `real_blocked_target_patch_loop_scaleout`
   在更多真实 target agents 上执行带 AHE 四字段的 developer work order：Codex 只改 allowed editable surfaces，重跑目标验证，记录 target runtime/read-model consumption、workspace proof、no-forbidden-write、owner receipt 或 typed blocker、patch absorption、cleanup 和 Agent Lab re-evaluation。

3. `independent_codex_reviewer_attempt`
   为真实 patch-loop 补独立 Codex reviewer attempt。reviewer 必须基于 direct evidence，保持 no-shared-context provenance，并输出 source refs、critique、suggestions、verdict 和 rollback/canary/version refs。

4. `standard_target_agent_handoff_convergence`
   推动 MAS/MAG/RCA 和新 Foundry Agent 用同一 target-agent vocabulary 暴露 production/live acceptance、Agent Lab handoff、owner route、editable surface policy、required return shapes、verification refs 和 no-forbidden-write proof。

5. `script_to_pack_hygiene`
   持续把稳定 policy 迁入 declarative pack、contracts 或 OPL primitive；保留脚本必须能指向 `runtime/authority_functions`、smoke action、fixture/proof helper 或 developer work-order materializer。

## 下一轮 Agent prompt

Objective:

- 继续治理 `/Users/gaofeng/workspace/opl-meta-agent` 的 OMA evidence tail、真实 target patch-loop scaleout、独立 reviewer attempt、standard target-agent handoff convergence 和 script-to-pack hygiene。

Write scope:

- `docs/active/opl-meta-agent-ideal-state-gap-plan.md`、`docs/status.md`、`docs/active/opl-private-implementation-migration-inventory.md`、OMA contracts、`agent/` pack、`runtime/authority_functions/`、`scripts/lib/*` 和 tests 中仍影响 OMA owner boundary 或 evidence tail 的部分。

Live truth inputs:

- `AGENTS.md`、`TASTE.md`、核心五件套、本文、ideal-state reference、private implementation inventory。
- `contracts/opl_domain_manifest_registration.json`、`contracts/app_workbench_projection.json`、`contracts/real_target_agent_scaleout_evidence.json`、production acceptance contracts、generated surface handoff、stage control plane。
- OPL `agents interfaces --repo-dir <this-repo> --json`、OPL framework readiness / App drilldown / OMA production-consumption read model、`npm test` / `npm run verify`。

Required actions:

- 推进 `registry_app_consumption`、`real_blocked_target_patch_loop_scaleout`、`independent_codex_reviewer_attempt`、`standard_target_agent_handoff_convergence` 和 `script_to_pack_hygiene`。
- 对新增或增长的 scripts/materializer 核实 active caller、authority boundary、no-forbidden-write、target owner route 和是否应迁入 `agent/`、`contracts/` 或 OPL primitive。
- 已闭合项折回本文或核心五件套；proof 流水和旧路线进入 history/provenance。

Non-goals:

- 不新增第二套 active plan。
- 不修改 target domain truth、memory body、artifact body、quality/export verdict、owner receipt body 或 default promotion authority。
- 不添加 OMA 私有 generic runtime、Agent Lab runner、queue、attempt ledger、registry/App shell、domain-specific command family 或 compatibility facade。

Verification commands:

- Docs-only：`rtk git diff --check`、`rtk rg -n "<<<<<<<|>>>>>>>|=======" docs`。
- 触及 contracts/source/tests：`rtk npm test` 或 `rtk npm run verify`。

Completion gate:

- Open evidence tail 已更新为 current truth；closed evidence 不以 dated closeout 形式留在 active path。
- main checkout 上完成触及面验证；worktree/branch 已吸收清理，或明确因近期写入/未提交改动保留。

Foldback target:

- Durable current truth 折回本文、核心五件套、private inventory 或 machine-readable contracts；proof、receipt、worktree/branch 细节进入 `docs/history/**`、OPL ledger、提交历史或 automation memory。

## 历史索引

- North-star / target-state：`docs/references/opl-meta-agent-ideal-state.md`。
- 私有实现、脚本收薄、退役 legacy surfaces：`docs/active/opl-private-implementation-migration-inventory.md`。
- 当前公开状态与未完成摘要：`docs/status.md`。
- 架构边界：`docs/architecture.md`。
- 硬约束和禁止声明：`docs/invariants.md`。
- 有效决策：`docs/decisions.md`。
- 机器证据入口：`contracts/`、`agent/`、`runtime/authority_functions/`、`tests/`、OPL Agent Lab result refs、developer work-order receipts 和 target owner receipts / typed blockers。
- dated closeout、旧路线、过程清单和已退役 surface 只保留在 history / provenance / migration inventory 语境中；不要把历史增量清单复制回本文。

## 验证口径

- 文档维护最低验证：`git diff --check`。
- 本仓结构与 contract 口径：`npm test` 或 `npm run verify`。
- 行为声明只固定 machine-readable contracts、stage/action refs、authority function refs、generated interface readiness、Agent Lab receipts、developer work-order receipts 和 no-forbidden-write boundary；测试不得固定本文措辞。
