# opl-meta-agent 理想目标态差距与完善计划

Owner: `opl-meta-agent`
Purpose: `ideal_state_gap_plan`
State: `active_plan`
Machine boundary: 本文是人读 gap / completion plan。机器真相继续归 `contracts/`、`runtime/authority_functions/`、OPL Agent Lab result refs、owner receipts、candidate refs 和未来 delivery receipts。
Date: `2026-05-20`

## 文档读法

- 本文只维护 `opl-meta-agent` 当前定位、owner 边界、功能/结构差距、测试/证据差距和完善顺序。
- North-star 目标态回到 [opl-meta-agent 理想目标态](../references/opl-meta-agent-ideal-state.md)。
- 差距按标准 OPL Agent 目标态判断，不按当前脚本是否能跑判断。通用 runtime、queue、attempt ledger、Agent Lab execution、promotion gate、generated interface wrapper、operator workbench 和 App shell 都归 OPL Framework；`opl-meta-agent` 只保留 declarative agent-building pack、refs-only action outputs、developer work-order materialization 和 minimal authority functions。
- 当前文档口径必须固定为：Agent Lab / OMA 是通用标准消费者，标准 OPL Agent 提供它们需要的 interface / handoff；不能写成 Agent Lab 或 OMA 为 MAS、MAG、RCA 单独兼容。

## 当前定位

`opl-meta-agent` 是 OPL-compatible Foundry Agent，面向“开发新的 OPL-compatible 高价值知识交付智能体”。它已经具备 sample agent bootstrap、real-target delivery minimum evidence、external agent testing takeover、external suite self-evolution、developer work order 和 mechanism patch proposal 的 repo-local loop。

当前计划已经从 contract-ready 收敛到 Codex-attempt-native / usable landing。AHE-style developer work order 机器面已进入 `improve:external-suite` 与 `agent:evidence`：OMA 可以把真实目标 handoff、blocked suite 和结构化 reviewer evaluation 转成 failure evidence、root cause、targeted fix、predicted impact、allowed editable surfaces、verification refs、rollback/version refs、owner route refs 和 no-forbidden-write proof 齐备的 patch-loop work order 或 typed blocker。剩余目标不是继续补 contract，而是一次性打通真实执行证据：stage launch contract 发起真实目标尝试，独立 Codex reviewer 基于 direct evidence 做无共享上下文评审，OPL registry / App 消费本仓 refs-only surface，真实 blocked target 进入 patch -> rerun -> owner receipt loop，并持续执行 script-to-pack hygiene。

OPL Framework 持有 standard scaffold、Agent Lab、generated interface bundle、runtime / queue / attempt ledger / provider receipt / observability / promotion gate。`opl-meta-agent` 不能把这些能力复制成仓内私有平台。

OMA 的理想职责不是“为每个 domain agent 做一套专用 evidence takeover”，而是提供一套 target-agent generic foundry / repair / takeover 机制。目标 agent 通过标准 contracts 暴露 descriptor、stage/action refs、generated surface handoff、owner receipt contract、Agent Lab handoff、production/live acceptance、owner routes、required return shapes、no-forbidden-write proof 和 verification refs；OMA 读取这些接口，产出通用 suite、work order、candidate、proposal 或 typed blocker。

## 当前功能/结构状态

当前结构收口口径：

- `agent/` 是 canonical repo-source semantic pack，真实存在 `knowledge/`、`prompts/`、`quality_gates/`、`skills/`、`stages/` 文件。
- `contracts/pack_compiler_input.json` 已使用 `canonical_semantic_pack_root="agent/"` 与 `canonical_semantic_pack_role="repo_source_declarative_meta_agent_pack"`，不再使用 `domain_pack_root` 作为机器接口。
- `required_domain_pack_paths` 已过滤 README，只保留真实 pack semantic files。README 可以作为人读入口存在，但不能满足 OPL scaffold required path。
- `contracts/generated_surface_handoff.json` 使用 `canonical_semantic_pack_root="agent/"`，generated interface owner 仍是 `one-person-lab`。
- `candidate_agent_package_builder` 与 `mechanism_patch_proposal_authorizer` 已从裸 scripts 路径归位为 `runtime/authority_functions/meta-agent-authority-functions.json` 中的 explicit authority refs；`contracts/functional_privatization_audit.json` 只把该 contract 作为 code path，把实际 scripts 放在 `implementation_refs`。
- 上述 authority functions 均为 refs-only minimal authority functions，只能签发候选包、owner receipt 或 proposal refs；它们不得成为通用 runtime owner，也显式禁止 generic scheduler、queue、attempt ledger、state-machine runner、CLI/MCP/product wrapper、sidecar、session store、status/workbench owner。

当前新增 product/registration/evidence surface 口径：

- `contracts/opl_domain_manifest_registration.json` 已把 descriptor、stage/action contracts、pack compiler input、generated surface handoff、authority function refs、owner receipt、App workbench projection 和 scaleout evidence contract 汇成 refs-only registration metadata，并带 OPL registry 可消费的 discovery receipt surface；OPL Framework 仍持有 registry / discovery owner。
- `contracts/app_workbench_projection.json` 已声明 target brief、candidate package、Agent Lab result、developer work order、mechanism patch proposal 和 scaleout evidence 的 App/workbench refs-only projection，并带 App drilldown readiness receipt surface；OPL App/workbench 持有展示与 runtime state。
- `contracts/real_target_agent_scaleout_evidence.json` 已声明真实目标 agent delivery、blocked suite -> developer work order、多目标 scaleout 的 evidence classes、minimum completion gate 和 no-forbidden-write proof refs；当前已由 bootstrap loop 支撑 `real_target_agent_delivery_count_min=1` 的 receipt/ledger，并用 MAS + MAG 两个真实目标的 owner receipt / typed blocker / no-forbidden-write / cleanup closeout refs 关闭 `multi_target_scaleout` 证据门。该 closeout 只证明 OMA 可消费两个真实 target-agent handoff，不授权 domain ready、quality verdict 或 default promotion。
- `contracts/production_acceptance/meta-agent-production-acceptance.json` 已把结构/物理 conformance 之后的 `production_live_soak_not_claimed_by_conformance` / `domain_ready_not_claimed_by_conformance` 证据尾巴收口为 external-agent takeover/improve loop acceptance receipt，并记录 real-target delivery minimum receipt surface：intake refs、Agent Lab test handoff refs、proposal/materializer refs、review/audit receipt refs 和下一步验证命令 refs 均有稳定 machine surface；promotion 仍是 gated。
- `contracts/generated_surface_handoff.json`、`contracts/action_catalog.json` 与 `contracts/functional_privatization_audit.json` 已引用上述三类 machine surface，后续 OPL registration、product projection 和 evidence review 可从稳定 ref 消费。
- `agent:evidence` 已替代 MAS-specific command 口径：它读取目标 agent 的 production acceptance / Agent Lab handoff / generated-surface handoff / owner-receipt contract，生成 `agent_production_evidence_suite` 与 target-agent generic artifacts。MAS 只是当前真实 smoke target，不是 OMA 的 contract vocabulary 或设计中心。
- AHE-style work order 已落地到 target-agent generic patch loop：`improve:external-suite` 与 `agent:evidence` 输出的 developer work order 现在要求 failure evidence、root cause、targeted fix、predicted impact 四字段，并带 target repo file hints、allowed editable surfaces、required verification refs、rollback/version refs、owner route refs、no-forbidden-write proof、target runtime/read-model consumption verification 和 workspace environment proof。缺 structured reviewer evaluation、缺 source refs、缺 predicted impact、缺 required verification 或缺 no-forbidden-write proof 会 fail closed 到 typed blocker；work order 结构完整性不授权 target domain ready、quality verdict、artifact readiness 或 default promotion。

2026-05-19 的 physical source morphology 调研把本仓源码目标进一步固定：`agent/` 承载 agent-building semantic pack，`contracts/` 承载 machine handoff / registration / App projection / scaleout evidence，`runtime/authority_functions/` 承载最小 authority refs，`scripts/` 只能是这些 authority refs、smoke helpers 或 fixture/proof implementation。`scripts/bootstrap-sample-agent.ts`、`scripts/lib/meta-agent-loop.ts`、testing takeover 和 external-suite improvement 入口不能被写成 generic runtime、promotion engine、OPL registry、App workbench 或 target-domain owner；真实运行、Agent Lab execution、promotion gate、generated interface 和 workbench 继续归 OPL Framework。

这条目标吸收的是成熟 agent/runtime 项目的分层经验，不引入它们作为依赖。2026-05-19 live check 中，OpenAI Agents SDK 将 Agent 与 Runner / sessions / handoffs / guardrails 分开；LangGraph 将 checkpoint、thread、store、replay 分开；AutoGen 将 agents、tools/workbench、teams 与 state/termination 分开；CrewAI 用声明式 agent role/goal/tools 与 crew/process 承载协作。`opl-meta-agent` 对应落点是：agent-building pack、minimal authority materializer、Agent Lab execution、registry / generated surface、App workbench 和 promotion gate 分离。

本仓的理想物理形态不是把 agent builder 逻辑散落在 scripts 中长期增长，而是逐步把可声明的构建策略回写到 `agent/prompts/`、`agent/stages/`、`agent/skills/`、`agent/knowledge/`、`agent/quality_gates/` 和 `contracts/`；scripts 只保留必要 package materializer、proposal authorizer、receipt writer、developer work-order materializer 或 smoke runner。若未来出现 repo-owned scheduler、queue、attempt ledger、state-machine loop、registry owner、App shell、target truth writer、domain-specific command family 或 promotion shortcut，应重新打开功能/结构 gap。

2026-05-20 的 Codex-first semantic pack 加强把 `opl-meta-agent` 的智能来源重新压回 executor：Codex 负责需求重构、反例搜索、stage graph 取舍、工具/knowledge/rubric gap 识别、root-cause reasoning 和机制改进判断；合同只作为权限、receipt、projection、evidence 和 fail-closed 地板。核心 prompts 与 `mechanism-patch-adoption` gate 已要求独立 AI reviewer direct-evidence、no-shared-context、rollback/canary/version refs，并明确 scorecard、suite pass、schema completeness、contract completeness 不能替代专家 verdict。

当前功能/结构差距以 machine contract 读取为：

`functional_structure_gap_count=0` 的前提是 OPL scaffold validation、generated interface readiness、authority function refs 和 no-forbidden-write tests 同时通过。若未来发现新的 repo-owned generic wrapper、runtime loop、promotion shortcut、target truth writer 或 README-only pack path，应重新打开结构 gap，而不是写成 evidence tail。

## 当前测试/证据差距

以下是结构正确后的证据缺口，不能反向解释成 generic runtime 或 target-domain authority：

- `OPL domain manifest registration` 的本仓 contract 与 discovery receipt surface 已落地；仍缺 OPL 主仓 / App 侧真实 registry consumption receipt。
- App/workbench projection 的本仓 contract 与 drilldown readiness receipt surface 已落地；仍缺 OPL App 实际渲染、截图或 runtime drilldown receipt。
- Stage launch contract 仍需在真实目标仓触发：输入应包含 target repo、allowed editable surfaces、stage prompt/skill/knowledge refs、blocked evidence refs、verification refs、owner route 和 no-forbidden-write refs。
- Independent Codex reviewer attempt 仍需落证：reviewer 必须读取 direct evidence、无共享上下文，输出 critique/suggestions/source refs/verdict/provenance，并带 rollback/canary/version refs；suite pass、scorecard、schema completeness 或 generated-surface proof 都不能替代该 reviewer verdict。
- `real_target_agent_delivery_count_min=1` 的 receipt/ledger 已由 bootstrap loop 支撑；多目标 scaleout 的 OMA refs-only gate 已由 MAS + MAG closeout refs 闭合。剩余证据是继续扩展到更多 target agents 和真实 target patch / rerun / owner receipt 的长期样本。
- external-agent takeover/improve loop 的 production acceptance evidence 已由 `contracts/production_acceptance/meta-agent-production-acceptance.json` 收口；它不再作为结构标准化缺口统计，也不替代真实线上目标领域 delivery 或默认 promotion gate。
- 真实 blocked target patch loop 的 work order 机器面已落地；仍需在至少一个真实目标仓闭合 Codex patch -> target repo verification -> owner receipt -> cleanup closeout，并把 no-forbidden-write、target runtime/read-model consumption、workspace environment proof 和 patch absorption refs 回填。
- 目标 agent 标准 handoff 的跨仓一致性仍需继续积累：MAS/MAG/RCA 都应向同一 Agent Lab / OMA 接口靠拢，domain-specific suite/command 名称只允许停留在 owner refs、fixtures 或历史 provenance。
- Script-to-pack hygiene 是持续证据项：仍在 scripts 中增长的 agent-building policy 必须迁回 `agent/`、`contracts/` 或 explicit authority refs；保留脚本需要证明自己只是 authority implementation、smoke helper、fixture/proof helper 或 developer work-order materializer。
- Mechanism patch proposal 仍是 proposal-only；需要 promotion gate receipt 才能进入默认 agent 变更。

## Usable landing 顺序

1. `stage_launch_contract`
   在真实目标仓启动 OMA stage launch，输入 target repo、blocked evidence、allowed editable surfaces、verification refs、owner route、no-forbidden-write refs 和 rollback/version refs。输出必须是 stage attempt refs、typed blocker 或 developer work order，而不是泛泛 plan。

2. `independent_codex_reviewer_attempt`
   由独立 Codex reviewer 读取 direct evidence 与 target refs，输出结构化 reviewer evaluation。该 reviewer 不能共享执行上下文，不能只引用 suite/scaffold/generated proof，必须给出 critique、suggestions、source refs、verdict、provenance 和 rollback/canary/version refs。

3. `registry_app_consumption`
   OPL 主仓或 App 侧消费 `contracts/opl_domain_manifest_registration.json` 与 `contracts/app_workbench_projection.json`，留下真实 registry discovery receipt、App render / screenshot / runtime drilldown receipt。消费结果只能展示 refs/status/receipt/blocker，不能写 target truth 或默认 promotion。

4. `real_blocked_target_patch_loop`
   对一个真实 blocked target 执行带 AHE 四字段的 developer patch work order：Codex 只改 allowed editable surfaces，重跑 target repo verification，记录 target runtime/read-model consumption、workspace environment proof、no-forbidden-write proof、owner receipt、patch absorption 和 cleanup closeout。完成后再扩展到 RCA / 新 Foundry Agent 等更多目标。

5. `script_to_pack_hygiene`
   把仍在 scripts 中增长的 agent-building 规则优先迁入 declarative pack 或 contracts；保留脚本必须能指向 `runtime/authority_functions`、smoke action、fixture/proof helper 或 developer work-order materializer，并持续证明不持有 OPL generic runtime、target domain truth 或 default promotion authority。

6. `standard_target_agent_handoff_convergence`
   把 MAS/MAG/RCA 这类目标 agent 的 production/live acceptance、Agent Lab handoff、owner-route refs、required-return-shapes、editable-surface policy 和 verification refs 收敛到同一 target-agent contract vocabulary。验收口径是 OMA 不新增 domain-specific command，Agent Lab 不新增 domain-specific suite kind，目标 agent 自己声明兼容性。

## 当前不能写成

- 不能写成 `opl-meta-agent` 是 OPL Framework 内置模块。
- 不能写成 sample bootstrap / testing takeover / external-suite improvement 等于真实线上 agent package delivery。
- 不能写成 generated surface proof、registration readiness 或 App projection readiness 等于 domain ready、quality verdict、App live rendering 或 default promotion。
- 不能写成 Agent Lab suite pass、mechanism patch proposal 或 online-learning candidate 等于默认 agent promotion。
- 不能写成 Agent Lab 支持 MAS/MAG-specific suite，或 OMA 提供 MAS/MAG-specific command family；正确口径是目标 agent 提供标准 handoff，Agent Lab / OMA 消费通用接口。
- 不能把 `scripts/bootstrap-sample-agent.ts` 或 `scripts/lib/meta-agent-loop.ts` 写成 generic runtime owner；它们只是 minimal authority function implementation refs 或 smoke action targets。
- 不能写目标 domain truth、memory body、artifact body、quality/export verdict 或 owner receipt authority。
- 不能把 README、目录存在性或 prose 章节当作 OPL pack compiler required semantic path。

## 验证口径

- 文档维护使用 `git diff --check`。
- 结构口径用 `npm test`、OPL scaffold validation 和 `opl agents interfaces --repo-dir <repo> --json` 验证。
- 测试只固定 machine-readable contracts、stage/action refs、authority function refs、generated interface readiness、Agent Lab receipts 和 no-forbidden-write boundary；不固定文档措辞。
