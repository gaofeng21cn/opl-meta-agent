# opl-meta-agent 理想目标态

Owner: `opl-meta-agent`
Purpose: `north_star_reference`
State: `active_support`
Machine boundary: 本文是人读目标态参考。机器真相继续归 `contracts/`、`runtime/authority_functions/`、OPL Agent Lab result refs、owner receipts、candidate refs 和未来 delivery receipts。

## 文档读法

- 本文只写 `opl-meta-agent` 的 north-star 目标态和长期 owner boundary；当前差距、完善顺序和证据缺口回到 [opl-meta-agent 理想目标态差距与完善计划](../active/opl-meta-agent-ideal-state-gap-plan.md)。
- 本文不冻结 run date、branch、worktree、commit SHA、receipt id、动态 counts、read-model 输出或 closeout 流程；dated refs 只作为 provenance，当前 completion/gap/prompt 回到 active plan 和 live machine truth。
- `opl-meta-agent` 是 OPL-compatible Foundry Agent，不是 OPL Framework 内置模块。OPL Framework 持有 runtime、Agent Lab、standard scaffold、generated interface bundle、queue、attempt ledger、provider receipt、observability、optimizer / RL transition refs 和 promotion gate。
- Agent Lab 与 `opl-meta-agent` 都是标准消费者，不是为 MAS、MAG、RCA 或任一单仓定制的兼容层。标准 OPL Agent 必须提供可被 Agent Lab / OMA 消费的 handoff、evaluation request、owner route、receipt、no-forbidden-write 和 patch-work-order 输入；OPL Foundry Lab 是唯一 suite-plan compiler，不能把叙事写成 Agent Lab 或 OMA 为每个 agent 单独实现一套能力。
- 目标态优先于当前脚本形态。仓内脚本可以作为 domain smoke 或 minimal authority function implementation refs 存在，但不能变成 repo-owned generic runtime、generic CLI/MCP/Skill/product-entry wrapper、generic scheduler、queue、attempt ledger、operator workbench 或默认 promotion engine。

## 目标结论

理想状态下，`opl-meta-agent` 是“构建、接管、修复和持续改进 OPL-compatible 高价值知识交付智能体”的 Foundry Agent。它读取用户意图、目标领域材料和目标 agent 的标准 handoff surface，形成可审计的 agent brief、stage plan、domain pack、quality gates、thin Foundry evaluation request、baseline receipt、developer patch work order、online-learning candidate 和 mechanism patch proposal。

`opl-meta-agent` 的理想形态是：

```text
Declarative Agent-Building Pack
  + OPL generated/hosted surfaces
  + minimal agent-building authority functions
```

它的领域价值是 agent-building semantics：目标理解、外部经验调研、stage 分解、pack 生成策略、标准 Agent Lab suite 组织、baseline 验收、外部 agent testing takeover、developer work order、机制补丁候选和在线学习审阅。它不拥有目标 domain 的 truth、memory body、artifact body、quality/export verdict，也不绕过目标 domain owner 的 receipt / promotion gate。

## 标准消费者与目标 Agent 接口

目标态的方向是“标准 OPL Agent 兼容 Agent Lab / OMA”，不是“Agent Lab / OMA 兼容每个具体 agent”。这条边界决定了命名、合同和文档口径：

- `OPL Agent Lab` 是 framework-level refs-only eval / mechanism / evidence control plane。它只运行标准 suite、投影 suite result、gate result、ref summary、mechanism evolution segment 和 promotion-safety refs；它不持有 MAS/MAG/RCA 这类 domain-specific suite 语义。
- `opl-meta-agent` 是 standard target-agent foundry / repair / takeover consumer。它读取目标 agent 提供的标准 contracts 和 handoff，生成 candidate package、developer patch work order、target capability improvement candidate、mechanism patch proposal 或 typed blocker；它不为每个目标 agent 维护私有命令族或专用 evidence runtime。
- 标准 OPL Agent 负责声明自己的 Agent Lab / OMA 消费面，包括 descriptor、stage/action contract、generated-surface handoff、owner receipt contract、Agent Lab handoff、production acceptance / live acceptance surface、owner route refs、required return shapes、no-forbidden-write proof refs、editable surface limits 和 verification command refs。
- MAS、MAG、RCA 等名字只能出现在目标 agent 自己的 domain id、owner route、fixture、example、receipt provenance 或真实 smoke evidence 中；不能出现在 OPL Agent Lab 或 OMA 的顶层 surface kind、公开命令名、长期 contract vocabulary 或 design center 叙事里。

因此，`agent:evidence`、external-suite improvement 和 testing takeover 都应产出 target-agent generic artifacts：`agent-lab-suite.json`、`agent-lab-run-result.json`、`developer-patch-work-order.json`、`target-capability-improvement-candidate.json`、`mechanism-patch-proposal.json` 和 `typed-blocker.json`。如果目标 agent 是 MAS 或 MAG，输出里的 domain refs 可以指向 MAS/MAG owner surfaces；输出机制本身仍是通用 target-agent mechanism。

## Codex-Attempt-Native Usable Landing

理想态不是 contract-ready 后继续观望，而是让 OMA 能直接发起真实可用闭环：

1. `stage launch contract`：从真实 target agent 的 handoff 读取 target repo、stage refs、allowed editable surfaces、blocked evidence refs、verification refs、owner route、no-forbidden-write refs 和 rollback/version refs。
2. `independent Codex reviewer attempt`：由独立 Codex reviewer 基于 direct evidence 评审，不共享执行上下文，输出 critique、suggestions、source refs、verdict、provenance 和 rollback/canary/version refs。
3. `registry/App consumption`：OPL 主仓或 App 消费 registration / App projection surface，留下 discovery receipt、render / screenshot / runtime drilldown receipt，只展示 refs/status/receipt/blocker。
4. `real blocked target patch loop`：developer patch work order 授权 Codex 修改目标仓 allowed editable surfaces，随后重跑目标验证，目标 owner 签 receipt，并保留 no-forbidden-write proof、patch absorption 和 cleanup closeout。
5. `script-to-pack hygiene`：把可声明的 agent-building policy 持续迁回 `agent/`、`contracts/` 或 explicit authority refs，让 `scripts/` 保持 implementation/proof/materializer 角色。

generated surface proof、registration readiness、App projection readiness、suite pass、scorecard、schema completeness 或 contract completeness 都只是输入证据。它们不能替代 independent reviewer verdict、target owner receipt、App live consumption proof 或默认 promotion gate。

## 长期 Owner 边界

`opl-meta-agent` 持有：

- Agent-building intent brief、目标 agent 任务边界、适用/不适用场景和 baseline acceptance policy。
- Declarative agent-building pack：`agent/prompts/`、`agent/stages/`、`agent/skills/`、`agent/quality_gates/`、`agent/knowledge/` 下的真实语义文件。
- Agent skeleton / contract / prompt / skill / quality gate 生成策略。
- Thin Foundry evaluation request、blocked external-suite intake 和 developer patch work order policy；OPL Foundry Lab owns suite spec、scorecard refs、recovery probes 与 compiled suite plan。
- Baseline delivery receipt、testing takeover receipt、online-learning candidate refs 和 mechanism patch proposal refs。
- Minimal authority functions：candidate agent package builder 和 mechanism patch proposal authorizer。

OPL Framework 持有：

- Generic runtime、stage attempt ledger、queue、provider receipt、wakeup/resume、observability、Agent Lab execution 和 promotion gate。
- Standard scaffold、generated CLI/MCP/Skill/product-entry/tool descriptors、functional harness cases 和 App/workbench shell。
- Optimizer / RL transition refs 和 mechanism candidate gating transport。

目标 domain agent 持有：

- 目标领域 truth、memory body、artifact body、quality/export verdict、artifact authority、owner receipt 和默认 agent promotion authority。
- 目标 agent 对 Agent Lab / OMA 的标准 handoff surface：evaluation request / external-suite intake、owner route refs、receipt refs、required return shapes、no-forbidden-write proof refs、editable surface policy 和 closeout gate。

## Pack 与 Generated Surface 形状

`agent/` 是 canonical repo-source semantic pack。`contracts/pack_compiler_input.json` 必须使用 `canonical_semantic_pack_root="agent/"` 和 `canonical_semantic_pack_role="repo_source_declarative_meta_agent_pack"`；旧 `domain_pack_root`、`canonical_repo_source_semantic_pack_root` 或 `canonical_repo_source_semantic_pack` 不再作为机器接口。

`required_domain_pack_paths` 只列真实 pack 语义文件：prompts、stages、skills、quality gates 和 knowledge。README 只能是人读入口或目录说明，不能作为 required semantic pack path。OPL scaffold validation 应能证明每个 required path 存在、非空、无占位，并且 stage prompt / skill / knowledge / evaluation refs 都解析到真实 repo 文件。

CLI、MCP、Skill、product-entry、OpenAI tool 和 AI SDK 描述由 OPL Framework 从 action / stage contracts 生成或托管。`opl-meta-agent` 只暴露 domain handler target、refs-only action output、minimal authority function refs、owner receipt 和 typed blocker；它不能声明 generated surface owner。

## Minimal Authority Functions

当前 repo-local scripts 的长期角色必须落在 `runtime/authority_functions/meta-agent-authority-functions.json` 这类 explicit authority refs 上：

| Authority function | Implementation refs | 允许输出 | 禁止事项 |
| --- | --- | --- | --- |
| `candidate_agent_package_builder` | `scripts/build-agent-baseline.ts`, `scripts/lib/meta-agent-loop-receipts.ts` | candidate agent package ref、owner receipt ref | generic runtime owner、target truth write、target quality/export verdict |
| `mechanism_patch_proposal_authorizer` | `scripts/lib/meta-agent-loop-receipts.ts` | mechanism patch proposal ref、owner receipt ref | target memory body write、artifact body write、default promotion |

这些函数可以持有 agent-building semantics，但只能以 refs-only / receipt / blocker 方式工作。它们不能成为第二套 OPL runtime，也不能替目标 domain owner 作 truth、memory、artifact、quality/export 或 promotion 决策。

理想物理源码形态应让这条边界在目录层面可见：`agent/` 保存 agent-building prompts、stages、skills、knowledge 和 quality gates；`contracts/` 保存 registration、generated surface handoff、App projection、scaleout evidence 和 no-forbidden-write contracts；`runtime/authority_functions/` 保存 authority manifest；`scripts/` 只保存 authority implementation refs、smoke action targets、fixture/proof helper 或 developer work-order materializer。随着功能成熟，可声明的 agent-building policy 应迁回 `agent/` 或 `contracts/`，不让 scripts 增长成私有 meta-runtime、promotion engine、registry owner 或 App/workbench shell。

## 理想完成门槛

- `agent/` pack、`agent/stages/manifest.json`、`contracts/pack_compiler_input.json` 和 `contracts/generated_surface_handoff.json` 全部采用 OPL standard pack shape，并由 OPL scaffold validation 通过。
- 所有 generated interface surface 均由 OPL Framework 生成或托管；本仓不实现 repo-owned generic wrapper。
- 所有 retained scripts 都能归类为 domain smoke、minimal authority function implementation ref、fixture/proof helper 或历史 provenance；不能归类的脚本必须上收 OPL、收薄成 refs-only adapter 或退役。
- Agent Lab suite、baseline delivery、testing takeover、external suite self-evolution、target-agent evidence takeover 和 mechanism patch proposal 都返回 owner receipt / typed blocker / candidate refs，不写目标 domain truth。
- 至少一个真实 blocked target 完成 patch -> rerun -> owner receipt -> cleanup closeout loop，并保留 no-forbidden-write proof。
- 独立 Codex reviewer attempt 基于 direct evidence、无共享上下文和 reviewer provenance 输出 verdict；该 verdict 与目标 owner receipt 共同约束机制采用。
- OPL registry / App 真实消费本仓 projection，留下 discovery、render/screenshot 或 runtime drilldown receipt。
- App/workbench projection 只展示 refs、status、candidate、receipt 和 blocker，不把 proposal、suite pass 或 generated surface proof 写成默认 promotion。

## 当前差距入口

当前功能/结构差距、测试/证据差距、完善顺序和禁止误写口径由 [opl-meta-agent 理想目标态差距与完善计划](../active/opl-meta-agent-ideal-state-gap-plan.md) 维护。本文不双写 active plan。
