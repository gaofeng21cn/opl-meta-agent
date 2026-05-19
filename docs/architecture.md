# opl-meta-agent 架构

`opl-meta-agent` 是 OPL-based Foundry Agent，不是 OPL Framework 内置模块。

## Owner Split

- `opl-meta-agent` owns：agent-building semantics、intent brief、research brief、stage decomposition、candidate agent package policy、Agent Lab suite specs、baseline delivery receipt、online learning review policy 和 mechanism patch proposal 记录。
- `opl-meta-agent` owns as domain pack：`agent/knowledge`、`agent/prompts`、`agent/quality_gates`、`agent/skills`、`agent/stages` 下的领域引用文件，以及 `contracts/` 中声明这些文件、阶段、动作、handoff 和 authority boundary 的机器合同。
- `opl-meta-agent` can take over：既有 OPL-compatible agent 的测试编排、自进化候选组织、mechanism patch proposal 产出和 takeover receipt。
- `OPL Framework` owns：generic runtime、Agent Lab、standard scaffold、queue、attempt ledger、provider receipt、observability projection、optimizer/RL transition refs、promotion gates。
- target domain agent owns：domain truth、quality verdict、artifact authority、memory body、owner receipt。

## Runtime

本仓只声明 thin sidecar/projection adapter。长期运行、唤醒、排队、恢复、attempt ledger 和 operator workbench 由 OPL Framework 提供。

## Registration And Product Projection

`contracts/opl_domain_manifest_registration.json` 是 OPL domain registry / discovery 的 refs-only 输入。它汇总 descriptor、stage/action contracts、pack compiler input、generated surface handoff、authority function refs、owner receipt、App workbench projection 和 scaleout evidence contract。registry owner 仍是 OPL Framework；本仓只提供 registration metadata refs。

`contracts/app_workbench_projection.json` 是 OPL App/workbench 的 refs-only projection contract。它允许展示 target brief、candidate package、Agent Lab results、developer work order、mechanism patch proposal 和 scaleout evidence 的 refs/status/receipt/blocker。App shell、workbench runtime state 和 drilldown rendering 由 OPL Framework / OPL App 持有；`opl-meta-agent` 不写 target domain truth、memory body、artifact body、quality/export verdict 或默认 agent promotion。

`contracts/real_target_agent_scaleout_evidence.json` 定义真实目标 agent delivery 与多目标 scaleout 的 evidence gate。当前它只声明必须收集的 target repo ref、candidate package ref、Agent Lab result ref、owner receipt ref、promotion gate ref、no-forbidden-write proof ref 和 cleanup closeout ref；它不把 sample bootstrap、testing takeover smoke、suite pass 或 mechanism patch proposal 升级成真实线上交付完成。

## Generated Interfaces

CLI、MCP、Skill、product-entry、OpenAI tool 和 AI SDK 描述由 OPL Framework 通过 `opl agents interfaces --repo-dir <repo>` 从 `contracts/action_catalog.json` 与 `contracts/stage_control_plane.json` 统一生成。本仓不实现私有 MCP server、通用 CLI wrapper、product-entry shell 或 Skill 包装层；仓内脚本只作为领域 smoke / minimal authority action 的可调用目标。生成接口的权限上限写入 `contracts/pack_compiler_input.json` 与 `contracts/generated_surface_handoff.json`：它可以 invoke/project 已声明 action、registration refs、App projection refs、scaleout evidence refs 与 minimal authority function，不能写 domain truth、memory body、artifact body、quality/export verdict，也不能成为 generated surface owner。

## Domain Pack Structure

`agent/` 当前是可验证 domain pack，而不是占位目录。`contracts/pack_compiler_input.json` 通过 `canonical_semantic_pack_root="agent/"` 和 `canonical_semantic_pack_role="repo_source_declarative_meta_agent_pack"` 指向 canonical semantic pack；`required_domain_pack_paths` 只列真实 prompts、stage policies、skills、quality gates 和 knowledge policies，不把 README 当作机器 required path。`tests/contracts.test.mjs` 校验这些文件非空、无占位，并校验 `stage_control_plane` 的 prompt、skill、knowledge、evaluation refs 解析到真实 `agent/` pack 文件。

## Optimization

`opl-meta-agent` 可以生成 prompt、skill、stage-policy、tool-policy、few-shot、rubric-gap candidate refs。候选进入 OPL Agent Lab gates 后才能成为 baseline 变更。

## Self-Learning Loop

当前 repo-local smoke 闭环按以下顺序运行：

1. `agent-skeleton-build`：调用 OPL `agents scaffold` 生成 `sample-brief-agent`。
2. `eval-suite-build`：写入 `agent-lab-suite.json`，只包含 refs、recovery probes、scorecard refs 和 promotion gate。
3. `baseline-run`：调用 OPL `agent-lab run --suite`，由 OPL Agent Lab 返回 suite result。
4. `baseline-delivery`：写入 `baseline-delivery-receipt.json`，只声明 baseline package refs 和 acceptance gates。
5. `online-learning`：写入 `online-learning-candidate.json` 与 `mechanism-patch-proposal.json`，候选保持 gated，不自动推广默认 agent、不训练或部署模型权重。

自举闭环还会调用 `opl agents interfaces --repo-dir <sample-agent>`，证明由 `OPL Meta Agent` 生成的目标智能体也能被 OPL 统一投影出 CLI / MCP / Skill / product-entry 接口包。

## External Agent Testing Takeover

`external-agent-takeover` 读取目标 agent repo/package 的 descriptor/contracts，生成 `agent_lab_external_suite`，调用 OPL `agent-lab run`，再写入 `testing_takeover_self_evolution_receipt`、gated online-learning candidate 和 mechanism patch proposal。

该 takeover 只覆盖测试接管和候选生成。target domain truth、quality verdict、artifact body、memory body、默认 agent promotion authority 继续由目标 domain owner 持有；receipt 和 candidate 必须显式声明 `can_write_target_domain_memory_body=false`、`can_promote_default_agent_without_gate=false`。

## Mechanism Patch Proposal

Mechanism patch proposal 是 self-learning / takeover loop 的 proposal-only 输出。它把一次 Agent Lab segment run 转成三个受控段：

1. `observe`：引用 `segment_run_ref` 与 suite/receipt/candidate source refs。
2. `diagnose`：引用 `evidence_delta_ref`，说明本轮证据变化。
3. `edit`：引用 `next_mechanism_candidate_ref` 与 candidate 的 proposed change refs。

可编辑面只允许是 agent-building 机制面，例如 prompt policy、skill policy、stage policy、Agent Lab suite policy、takeover review policy、optimizer candidate policy 或 quality gate policy。proposal 不能直接写 target truth、memory body、artifact body、quality/export verdict，也不能绕过 explicit promotion gate。
