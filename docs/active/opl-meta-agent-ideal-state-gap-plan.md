# opl-meta-agent 理想目标态差距与完善计划

Owner: `opl-meta-agent`
Purpose: `ideal_state_gap_plan`
State: `active_plan`
Machine boundary: 本文是人读 gap / completion plan。机器真相继续归 `contracts/`、`runtime/authority_functions/`、OPL Agent Lab result refs、owner receipts、candidate refs 和未来 delivery receipts。
Date: `2026-05-19`

## 文档读法

- 本文只维护 `opl-meta-agent` 当前定位、owner 边界、功能/结构差距、测试/证据差距和完善顺序。
- North-star 目标态回到 [opl-meta-agent 理想目标态](../references/opl-meta-agent-ideal-state.md)。
- 差距按标准 OPL Agent 目标态判断，不按当前脚本是否能跑判断。通用 runtime、queue、attempt ledger、Agent Lab execution、promotion gate、generated interface wrapper、operator workbench 和 App shell 都归 OPL Framework；`opl-meta-agent` 只保留 declarative agent-building pack、refs-only action outputs 和 minimal authority functions。

## 当前定位

`opl-meta-agent` 是 OPL-compatible Foundry Agent，面向“开发新的 OPL-compatible 高价值知识交付智能体”。它已经具备 sample agent bootstrap、external agent testing takeover、external suite self-evolution、developer work order 和 mechanism patch proposal 的 repo-local smoke loop。

OPL Framework 持有 standard scaffold、Agent Lab、generated interface bundle、runtime / queue / attempt ledger / provider receipt / observability / promotion gate。`opl-meta-agent` 不能把这些能力复制成仓内私有平台。

## 当前功能/结构状态

当前结构收口口径：

- `agent/` 是 canonical repo-source semantic pack，真实存在 `knowledge/`、`prompts/`、`quality_gates/`、`skills/`、`stages/` 文件。
- `contracts/pack_compiler_input.json` 已使用 `canonical_semantic_pack_root="agent/"` 与 `canonical_semantic_pack_role="repo_source_declarative_meta_agent_pack"`，不再使用 `domain_pack_root` 作为机器接口。
- `required_domain_pack_paths` 已过滤 README，只保留真实 pack semantic files。README 可以作为人读入口存在，但不能满足 OPL scaffold required path。
- `contracts/generated_surface_handoff.json` 使用 `canonical_semantic_pack_root="agent/"`，generated interface owner 仍是 `one-person-lab`。
- `candidate_agent_package_builder` 与 `mechanism_patch_proposal_authorizer` 已从裸 scripts 路径归位为 `runtime/authority_functions/meta-agent-authority-functions.json` 中的 explicit authority refs；`contracts/functional_privatization_audit.json` 只把该 contract 作为 code path，把实际 scripts 放在 `implementation_refs`。
- 上述 authority functions 均为 refs-only minimal authority functions，只能签发候选包、owner receipt 或 proposal refs；它们不得成为通用 runtime owner，也显式禁止 generic scheduler、queue、attempt ledger、state-machine runner、CLI/MCP/product wrapper、sidecar、session store、status/workbench owner。

当前新增 product/registration/evidence surface 口径：

- `contracts/opl_domain_manifest_registration.json` 已把 descriptor、stage/action contracts、pack compiler input、generated surface handoff、authority function refs、owner receipt、App workbench projection 和 scaleout evidence contract 汇成 refs-only registration metadata；OPL Framework 仍持有 registry / discovery owner。
- `contracts/app_workbench_projection.json` 已声明 target brief、candidate package、Agent Lab result、developer work order、mechanism patch proposal 和 scaleout evidence 的 App/workbench refs-only projection；OPL App/workbench 持有展示与 runtime state。
- `contracts/real_target_agent_scaleout_evidence.json` 已声明真实目标 agent delivery、blocked suite -> developer work order、多目标 scaleout 的 evidence classes、minimum completion gate 和 no-forbidden-write proof refs；当前状态是 contract-ready，不宣称真实 scaleout 已完成。
- `contracts/production_acceptance/meta-agent-production-acceptance.json` 已把结构/物理 conformance 之后的 `production_live_soak_not_claimed_by_conformance` / `domain_ready_not_claimed_by_conformance` 证据尾巴收口为 external-agent takeover/improve loop acceptance receipt：intake refs、Agent Lab test handoff refs、proposal/materializer refs、review/audit receipt refs 和下一步验证命令 refs 均有稳定 machine surface；promotion 仍是 gated。
- `contracts/generated_surface_handoff.json`、`contracts/action_catalog.json` 与 `contracts/functional_privatization_audit.json` 已引用上述三类 machine surface，后续 OPL registration、product projection 和 evidence review 可从稳定 ref 消费。

2026-05-19 的 physical source morphology 调研把本仓源码目标进一步固定：`agent/` 承载 agent-building semantic pack，`contracts/` 承载 machine handoff / registration / App projection / scaleout evidence，`runtime/authority_functions/` 承载最小 authority refs，`scripts/` 只能是这些 authority refs、smoke helpers 或 fixture/proof implementation。`scripts/bootstrap-sample-agent.ts`、`scripts/lib/meta-agent-loop.ts`、testing takeover 和 external-suite improvement 入口不能被写成 generic runtime、promotion engine、OPL registry、App workbench 或 target-domain owner；真实运行、Agent Lab execution、promotion gate、generated interface 和 workbench 继续归 OPL Framework。

这条目标吸收的是成熟 agent/runtime 项目的分层经验，不引入它们作为依赖。2026-05-19 live check 中，OpenAI Agents SDK 将 Agent 与 Runner / sessions / handoffs / guardrails 分开；LangGraph 将 checkpoint、thread、store、replay 分开；AutoGen 将 agents、tools/workbench、teams 与 state/termination 分开；CrewAI 用声明式 agent role/goal/tools 与 crew/process 承载协作。`opl-meta-agent` 对应落点是：agent-building pack、minimal authority materializer、Agent Lab execution、registry / generated surface、App workbench 和 promotion gate 分离。

本仓的理想物理形态不是把 agent builder 逻辑散落在 scripts 中长期增长，而是逐步把可声明的构建策略回写到 `agent/prompts/`、`agent/stages/`、`agent/skills/`、`agent/knowledge/`、`agent/quality_gates/` 和 `contracts/`；scripts 只保留必要 package materializer、proposal authorizer、receipt writer 或 smoke runner。若未来出现 repo-owned scheduler、queue、attempt ledger、state-machine loop、registry owner、App shell、target truth writer 或 promotion shortcut，应重新打开功能/结构 gap。

当前功能/结构差距以 machine contract 读取为：

`functional_structure_gap_count=0` 的前提是 OPL scaffold validation、generated interface readiness、authority function refs 和 no-forbidden-write tests 同时通过。若未来发现新的 repo-owned generic wrapper、runtime loop、promotion shortcut、target truth writer 或 README-only pack path，应重新打开结构 gap，而不是写成 evidence tail。

## 当前测试/证据差距

以下是结构正确后的证据缺口，不能反向解释成 generic runtime 或 target-domain authority：

- `OPL domain manifest registration` 的本仓 contract 已落地；仍缺 OPL registry 侧接入和实测 discovery receipt。
- App/workbench projection 的本仓 contract 已落地；仍缺 OPL App 实际渲染、drilldown 和 receipt。
- 真实线上目标领域 agent package delivery 仍未完成；当前完成的是 sample baseline、testing takeover、external-suite improvement 和 proposal-only mechanism loop。
- external-agent takeover/improve loop 的 production acceptance evidence 已由 `contracts/production_acceptance/meta-agent-production-acceptance.json` 收口；它不再作为结构标准化缺口统计，也不替代真实线上目标领域 delivery 或默认 promotion gate。
- 真实多目标 agent 的 Agent Lab suite、blocked suite -> developer work order -> patch -> re-run -> owner receipt scaleout 仍需积累。
- Mechanism patch proposal 仍是 proposal-only；需要 promotion gate receipt 才能进入默认 agent 变更。

## 完善顺序

1. `manifest_registration`
   将 `opl-meta-agent` 纳入 OPL domain manifest registration，确保 OPL discovery 不依赖本地路径猜测。本仓已提供 `contracts/opl_domain_manifest_registration.json`，下一步是 OPL registry 消费和 discovery receipt。

2. `app_workbench_projection`
   由 OPL App/workbench 展示 meta-agent 的 target brief、candidate package refs、Agent Lab result refs、developer work order、mechanism patch proposal 和 blocker；展示层不能写 target truth 或默认 promotion。本仓已提供 `contracts/app_workbench_projection.json`，下一步是 App drilldown 消费和渲染证据。

3. `real_target_agent_delivery`
   选择真实目标领域 agent package，跑完整 intent -> research -> skeleton -> Agent Lab -> baseline receipt -> mechanism patch proposal -> gated improvement 的交付链，留下 no-forbidden-write proof。本仓已提供 `contracts/real_target_agent_scaleout_evidence.json` 定义所需 evidence refs。

4. `multi_target_scaleout`
   扩大到多个目标 agent / blocked suite，验证 takeover 和 self-evolution 能稳定生成可执行 developer work order，并通过目标仓测试、docs、receipt 和 cleanup closeout。

5. `physical_source_morphology_hygiene`
   把仍在 scripts 中增长的 agent-building 规则优先迁入 declarative pack 或 contracts；保留脚本必须能指向 `runtime/authority_functions`、smoke action、fixture/proof helper 或 developer work-order materializer，并持续证明不持有 OPL generic runtime、target domain truth 或 default promotion authority。

## 当前不能写成

- 不能写成 `opl-meta-agent` 是 OPL Framework 内置模块。
- 不能写成 sample bootstrap / testing takeover / external-suite improvement 等于真实线上 agent package delivery。
- 不能写成 Agent Lab suite pass、mechanism patch proposal 或 online-learning candidate 等于默认 agent promotion。
- 不能把 `scripts/bootstrap-sample-agent.ts` 或 `scripts/lib/meta-agent-loop.ts` 写成 generic runtime owner；它们只是 minimal authority function implementation refs 或 smoke action targets。
- 不能写目标 domain truth、memory body、artifact body、quality/export verdict 或 owner receipt authority。
- 不能把 README、目录存在性或 prose 章节当作 OPL pack compiler required semantic path。

## 验证口径

- 文档维护使用 `git diff --check`。
- 结构口径用 `npm test`、OPL scaffold validation 和 `opl agents interfaces --repo-dir <repo> --json` 验证。
- 测试只固定 machine-readable contracts、stage/action refs、authority function refs、generated interface readiness、Agent Lab receipts 和 no-forbidden-write boundary；不固定文档措辞。
