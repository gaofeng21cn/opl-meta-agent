# opl-meta-agent 理想目标态

Owner: `opl-meta-agent`
Purpose: `north_star_reference`
State: `active_support`
Machine boundary: 本文是人读目标态参考。机器真相继续归 `contracts/`、`runtime/authority_functions/`、OPL Agent Lab result refs、owner receipts、candidate refs 和未来 delivery receipts。
Date: `2026-05-19`

## 文档读法

- 本文只写 `opl-meta-agent` 的 north-star 目标态和长期 owner boundary；当前差距、完善顺序和证据缺口回到 [opl-meta-agent 理想目标态差距与完善计划](../active/opl-meta-agent-ideal-state-gap-plan.md)。
- `opl-meta-agent` 是 OPL-compatible Foundry Agent，不是 OPL Framework 内置模块。OPL Framework 持有 runtime、Agent Lab、standard scaffold、generated interface bundle、queue、attempt ledger、provider receipt、observability、optimizer / RL transition refs 和 promotion gate。
- 目标态优先于当前脚本形态。仓内脚本可以作为 domain smoke 或 minimal authority function implementation refs 存在，但不能变成 repo-owned generic runtime、generic CLI/MCP/Skill/product-entry wrapper、generic scheduler、queue、attempt ledger、operator workbench 或默认 promotion engine。

## 目标结论

理想状态下，`opl-meta-agent` 是“构建新的 OPL-compatible 高价值知识交付智能体”的 domain agent。它读取用户意图和目标领域材料，形成可审计的 agent brief、stage plan、domain pack、quality gates、Agent Lab suite、baseline receipt、online-learning candidate 和 mechanism patch proposal。

`opl-meta-agent` 的理想形态是：

```text
Declarative Agent-Building Pack
  + OPL generated/hosted surfaces
  + minimal agent-building authority functions
```

它的领域价值是 agent-building semantics：目标理解、外部经验调研、stage 分解、pack 生成策略、Agent Lab suite 组织、baseline 验收、外部 agent testing takeover、机制补丁候选和在线学习审阅。它不拥有目标 domain 的 truth、memory body、artifact body、quality/export verdict，也不绕过目标 domain owner 的 receipt / promotion gate。

## 长期 Owner 边界

`opl-meta-agent` 持有：

- Agent-building intent brief、目标 agent 任务边界、适用/不适用场景和 baseline acceptance policy。
- Declarative agent-building pack：`agent/prompts/`、`agent/stages/`、`agent/skills/`、`agent/quality_gates/`、`agent/knowledge/` 下的真实语义文件。
- Agent skeleton / contract / prompt / skill / quality gate 生成策略。
- Agent Lab suite spec、scorecard refs、recovery probes、blocked suite intake 和 developer patch work order policy。
- Baseline delivery receipt、testing takeover receipt、online-learning candidate refs 和 mechanism patch proposal refs。
- Minimal authority functions：candidate agent package builder、mechanism patch proposal authorizer、owner receipt signer、target agent boundary verdict 和 online-learning candidate reviewer。

OPL Framework 持有：

- Generic runtime、stage attempt ledger、queue、provider receipt、wakeup/resume、observability、Agent Lab execution 和 promotion gate。
- Standard scaffold、generated CLI/MCP/Skill/product-entry/tool descriptors、functional harness cases 和 App/workbench shell。
- Optimizer / RL transition refs 和 mechanism candidate gating transport。

目标 domain agent 持有：

- 目标领域 truth、memory body、artifact body、quality/export verdict、artifact authority、owner receipt 和默认 agent promotion authority。

## Pack 与 Generated Surface 形状

`agent/` 是 canonical repo-source semantic pack。`contracts/pack_compiler_input.json` 必须使用 `canonical_semantic_pack_root="agent/"` 和 `canonical_semantic_pack_role="repo_source_declarative_meta_agent_pack"`；旧 `domain_pack_root`、`canonical_repo_source_semantic_pack_root` 或 `canonical_repo_source_semantic_pack` 不再作为机器接口。

`required_domain_pack_paths` 只列真实 pack 语义文件：prompts、stages、skills、quality gates 和 knowledge。README 只能是人读入口或目录说明，不能作为 required semantic pack path。OPL scaffold validation 应能证明每个 required path 存在、非空、无占位，并且 stage prompt / skill / knowledge / evaluation refs 都解析到真实 repo 文件。

CLI、MCP、Skill、product-entry、OpenAI tool 和 AI SDK 描述由 OPL Framework 从 action / stage contracts 生成或托管。`opl-meta-agent` 只暴露 domain handler target、refs-only action output、minimal authority function refs、owner receipt 和 typed blocker；它不能声明 generated surface owner。

## Minimal Authority Functions

当前 repo-local scripts 的长期角色必须落在 `runtime/authority_functions/meta-agent-authority-functions.json` 这类 explicit authority refs 上：

| Authority function | Implementation refs | 允许输出 | 禁止事项 |
| --- | --- | --- | --- |
| `candidate_agent_package_builder` | `scripts/bootstrap-sample-agent.mjs`, `scripts/lib/meta-agent-loop.mjs` | candidate agent package ref、owner receipt ref | generic runtime owner、target truth write、target quality/export verdict |
| `mechanism_patch_proposal_authorizer` | `scripts/lib/meta-agent-loop.mjs` | mechanism patch proposal ref、owner receipt ref | target memory body write、artifact body write、default promotion |

这些函数可以持有 agent-building semantics，但只能以 refs-only / receipt / blocker 方式工作。它们不能成为第二套 OPL runtime，也不能替目标 domain owner 作 truth、memory、artifact、quality/export 或 promotion 决策。

## 理想完成门槛

- `agent/` pack、`contracts/pack_compiler_input.json`、`contracts/generated_surface_handoff.json` 和 `contracts/stage_control_plane.json` 全部采用 OPL standard pack shape，并由 OPL scaffold validation 通过。
- 所有 generated interface surface 均由 OPL Framework 生成或托管；本仓不实现 repo-owned generic wrapper。
- 所有 retained scripts 都能归类为 domain smoke、minimal authority function implementation ref、fixture/proof helper 或历史 provenance；不能归类的脚本必须上收 OPL、收薄成 refs-only adapter 或退役。
- Agent Lab suite、baseline delivery、testing takeover、external suite self-evolution 和 mechanism patch proposal 都返回 owner receipt / typed blocker / candidate refs，不写目标 domain truth。
- 真实线上目标 agent package delivery 产生可追溯 baseline receipt、Agent Lab evidence、candidate package ref、promotion gate ref 和 no-forbidden-write proof。
- App/workbench projection 只展示 refs、status、candidate、receipt 和 blocker，不把 proposal 或 suite pass 写成默认 promotion。

## 当前差距入口

当前功能/结构差距、测试/证据差距、完善顺序和禁止误写口径由 [opl-meta-agent 理想目标态差距与完善计划](../active/opl-meta-agent-ideal-state-gap-plan.md) 维护。本文不双写 active plan。
