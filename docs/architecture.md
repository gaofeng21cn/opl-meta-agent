# opl-meta-agent 架构

`opl-meta-agent` 是 OPL-based Foundry Agent，不是 OPL Framework 内置模块。

## Owner Split

- `opl-meta-agent` owns：agent-building semantics、intent brief、research brief、stage decomposition、candidate agent package policy、Agent Lab suite specs、baseline delivery receipt、online learning review policy 和 mechanism patch proposal 记录。
- `opl-meta-agent` owns as candidate author：每个 stage 的 `stage_executor_policy_candidate`，用于描述可试验的 executor / model / provider / capability / receipt 组合；这些 candidate 只是 refs-only policy proposal。
- `opl-meta-agent` owns as domain pack：`agent/knowledge`、`agent/prompts`、`agent/quality_gates`、`agent/skills`、`agent/stages` 下的领域引用文件，以及 `contracts/` 中声明这些文件、阶段、动作、handoff 和 authority boundary 的机器合同。
- `opl-meta-agent` can consume standard target-agent handoff：既有 OPL-compatible agent 的测试编排、自进化候选组织、developer patch work order、mechanism patch proposal 产出和 takeover receipt。
- `OPL Framework` owns：generic runtime、Agent Lab、standard scaffold、queue、attempt ledger、provider receipt、observability projection、optimizer/RL transition refs、stage executor policy read model、stage executor policy gate、work order execution / absorb / cleanup 和 promotion gates。
- target domain agent owns：domain truth、quality verdict、artifact authority、memory body、owner receipt，并负责提供 Agent Lab / OMA 可消费的标准 descriptor、handoff、owner-route、owner closeout hook、receipt、verification 和 no-forbidden-write refs。

## Stage Executor Policy Boundary

Codex CLI 仍是 OMA 每个 stage 的 first-class default executor。`selected_executor` 保持 `codex_cli`；stage-level executor policy candidate 不等于 executor 切换，也不等于质量等价声明。

OMA 只声明和生成 `stage_executor_policy_candidate`：例如为 `eval-suite-build` 提出 `antigravity_cli` / `gemini-3.5-flash` / `high` / `google` 的 HTML suite authoring candidate，或为 `web-experience-research` 提出 `claude_code` reviewer-diversity candidate。非默认 executor candidate 必须带显式 adapter / binding / receipt；缺 `executor_binding_ref` 时 fail closed 为 `blocker:missing_non_default_executor_binding_ref`，不能启动试验。

OPL / Agent Lab 负责执行试验、记录 stage executor policy read model、运行 policy gate、签发 executor / stage attempt receipts，并决定是否进入后续 promotion gate。OMA 不复制 Agent Lab runner、queue、attempt ledger、executor adapter 或 provider binding；OMA 也不能直接切换默认 executor、不能绕过 gate promote 默认 executor、不能把 suite pass / candidate completeness 写成质量等价。

## Standard Consumer Boundary

Agent Lab 与 `opl-meta-agent` 是标准消费者。目标 agent 兼容它们，而不是它们分别兼容每个目标 agent。

- Agent Lab 消费 `agent_lab_external_suite`、`agent_production_evidence_suite`、recovery probes、scorecard refs、promotion gate refs、mechanism evolution refs 和 production evidence gate refs。Agent Lab 不持有 MAS/MAG/RCA 专用 suite kind，也不签发目标 domain verdict。
- OMA 消费目标 agent 的 production/live acceptance、Agent Lab handoff、generated-surface handoff、owner receipt contract、editable surface policy、verification command refs 和 no-forbidden-write proof refs。OMA 产出 target-agent generic work order / candidate / proposal / blocker，不维护 MAS/MAG/RCA 私有 command family。
- 目标 agent 可以在 owner routes、receipt refs、artifact refs 或 smoke fixture 中出现自己的 domain id；这些 domain refs 不能反向污染 Agent Lab / OMA 的顶层 contract vocabulary。

## Self-Evolution Responsibility Split

自进化闭环的 owner split 固定为三段：

1. `OPL Agent Lab`：运行 suite，归并 evidence / root cause / targeted fix / predicted impact / next-run falsification refs，比较 variant candidates，执行 risk-tiered promotion gate，并输出 refs-only App/workbench read model。
2. `opl-meta-agent`：消费 Agent Lab result 与目标 agent handoff，生成 developer patch work order、target capability improvement candidate、mechanism patch proposal 或 typed blocker；work order 必须说明 allowed editable surfaces、target repo file hints、required verification refs、rollback/version refs、owner route refs、no-forbidden-write proof 和 target runtime/read-model consumption verification。
3. `target domain agent`：通过 target-domain owner closeout hook 签发 owner receipt 或 typed blocker，持有 domain truth、quality verdict、artifact authority、memory body 和最终 owner acceptance。

因此，OMA 的 self-evolution 不是“自己判断并推广目标 agent”，而是把可审计证据转成受限 patch loop。Codex 只能在 work order 授权的文件范围内修改目标仓；目标验证和 owner receipt 回填后，下一轮仍回到 Agent Lab 做 evidence delta、falsification 和 promotion gate 评估。

## Runtime

本仓只保留 `runtime/authority_functions/` 下的最小 authority refs。长期运行、唤醒、排队、恢复、attempt ledger、sidecar/projection dispatch、status read model 和 operator workbench 由 OPL Framework 生成或托管。

## Codex-Attempt-Native Landing

当前 usable landing 机器面已经从 contract-ready 推进到 developer work order / patch-loop 控制面。`opl-meta-agent` 的 `improve:external-suite` 与 `agent:evidence` 以真实 target agent handoff 为输入，读取 allowed editable surfaces、blocked evidence、verification refs、owner route、no-forbidden-write refs 和 rollback/version refs，输出 stage attempt refs、developer patch work order、mechanism proposal 或 typed blocker。developer work order 必须包含 AHE-style failure evidence、root cause、targeted fix、predicted impact 四字段，以及 target repo file hints、required verification refs、rollback/version refs、owner route refs、no-forbidden-write proof 和 target runtime/read-model consumption verification。Codex 可以在 developer work order 授权的文件范围内实施 patch，但不能越权写 target truth、memory body、artifact body、quality/export verdict 或 owner receipt。

Executor-first work order bundle 的必需 refs 固定为 `executor_lease_ref`、`reviewer_pool_refs`、`patch_execution_bundle_ref` 和 `target_closeout_refs`。这些 refs 来自或回填到 OPL work-order execute primitive、Agent Lab re-evaluation 和 target owner 控制面：executor lease 说明 selected executor 的工具、网络、sandbox、worktree、subagent、预算、TTL、risk lane 和 expected receipt 边界；reviewer pool 说明独立 Codex reviewer attempt 的 direct evidence、source refs、critique/suggestion/verdict 和 no-shared-context provenance；patch bundle 说明受限 patch traceability；target closeout refs 说明目标验证、owner receipt / typed blocker、no-forbidden-write、cleanup 和 Agent Lab re-evaluation。缺任何关键 refs 时只能输出 typed blocker，不能输出 executable work order。

Efficiency non-regression 是同一 target-agent generic work order 的一个证据投影，而不是新的 domain command family。`improve:external-suite` 与 `agent:evidence` 只消费标准 suite / production evidence handoff 中的 `quality_floor_refs`、`latency_baseline_refs`、`usage_cost_refs`、`cache_reuse_refs`、`target_verification_refs`，以及 refs-only `*_efficiency_handoff_projection`，并把它们投影到 developer work order、completeness、machine closeout 和 required verification refs。缺 quality floor refs 或缺 reviewer direct evidence 时 fail closed typed blocker；OMA 不能为了效率优化写 target truth、memory body、artifact body、quality/export verdict 或 owner receipt。

Patch-loop closeout 现在固定为 11 个 refs：blocked suite result、developer patch work order、patch traceability matrix、target repo verification、target runtime/read-model consumption、workspace environment proof、no-forbidden-write proof、target owner receipt or typed blocker、patch absorption、worktree cleanup 和 Agent Lab re-evaluation。target owner receipt or typed blocker 可由 OPL 在 absorb 后调用 target-domain owner closeout hook 获得；OMA 只在 delegation receipt 中记录 `owner_closeout_hook_delegated=true`、`target_owner_closeout_owner=target-domain via OPL` 和 `oma_can_write_owner_receipt=false`。MAG smoke 已证明真实 target agent 可以 refs-only 消费这些 refs 并输出 target-owner closeout projection；这证明的是 OMA -> target owner handoff shape，不是 MAG grant readiness 或 OMA default promotion authority。

独立 Codex reviewer attempt 是采用门槛的一部分。reviewer 必须基于 direct evidence、无共享执行上下文、带 reviewer provenance、source refs、critique/suggestions/verdict 和 rollback/canary/version refs；generated surface proof、suite pass、schema completeness 或 contract completeness 只能作为输入证据，不能替代 reviewer / owner verdict。

## Registration And Product Projection

`contracts/opl_domain_manifest_registration.json` 是 OPL domain registry / discovery 的 refs-only 输入。它汇总 descriptor、stage/action contracts、pack compiler input、generated surface handoff、authority function refs、owner receipt、App workbench projection 和 scaleout evidence contract。registry owner 仍是 OPL Framework；本仓只提供 registration metadata refs。

`contracts/app_workbench_projection.json` 是 OPL App/workbench 的 refs-only projection contract。它允许展示 target brief、candidate package、Agent Lab results、developer work order、mechanism patch proposal 和 scaleout evidence 的 refs/status/receipt/blocker。App shell、workbench runtime state 和 drilldown rendering 由 OPL Framework / OPL App 持有；`opl-meta-agent` 不写 target domain truth、memory body、artifact body、quality/export verdict 或默认 agent promotion。

上述 registration / App projection 是 landing 的消费输入，不是 landing 完成证明。完成证明必须来自 OPL 主仓或 App 侧的 registry discovery receipt、App render / screenshot / runtime drilldown receipt，以及目标 agent owner receipt。

`contracts/real_target_agent_scaleout_evidence.json` 定义真实目标 agent delivery 与多目标 scaleout 的 evidence gate。当前它只声明必须收集的 target repo ref、candidate package ref、Agent Lab result ref、owner receipt ref、promotion gate ref、no-forbidden-write proof ref 和 cleanup closeout ref；它不把 sample bootstrap、testing takeover smoke、suite pass 或 mechanism patch proposal 升级成真实线上交付完成。

## Generated Interfaces

CLI、MCP、Skill、product-entry、OpenAI tool 和 AI SDK 描述由 OPL Framework 通过 `opl agents interfaces --repo-dir <repo>` 从 `contracts/action_catalog.json` 与 `contracts/stage_control_plane.json` 统一生成。本仓不实现私有 MCP server、通用 CLI wrapper、product-entry shell 或 Skill 包装层；仓内脚本只作为领域 smoke / minimal authority action 的可调用目标。生成接口的权限上限写入 `contracts/pack_compiler_input.json` 与 `contracts/generated_surface_handoff.json`：它可以 invoke/project 已声明 action、registration refs、App projection refs、scaleout evidence refs 与 minimal authority function，不能写 domain truth、memory body、artifact body、quality/export verdict，也不能成为 generated surface owner。

## Domain Pack Structure

`agent/` 当前是可验证 domain pack，而不是占位目录。`contracts/pack_compiler_input.json` 通过 `canonical_semantic_pack_root="agent/"` 和 `canonical_semantic_pack_role="repo_source_declarative_meta_agent_pack"` 指向 canonical semantic pack；`required_domain_pack_paths` 只列真实 prompts、stage policies、skills、quality gates 和 knowledge policies，不把 README 当作机器 required path。`tests/contracts.test.ts` 校验这些文件非空、无占位，并校验 `stage_control_plane` 的 prompt、skill、knowledge、evaluation refs 解析到真实 `agent/` pack 文件。

## Optimization

`opl-meta-agent` 可以生成 prompt、skill、stage-policy、tool-policy、few-shot、rubric-gap candidate refs。候选进入 OPL Agent Lab gates 后才能成为 baseline 变更。

## Self-Learning Loop

当前 repo-local smoke 闭环按以下顺序运行：

1. `agent-skeleton-build`：调用 OPL `agents scaffold` 生成 `sample-brief-agent`。
2. `eval-suite-build`：写入 `agent-lab-suite.json`，只包含 refs、recovery probes、scorecard refs 和 promotion gate。
3. `baseline-run`：调用 OPL `agent-lab run --suite`，由 OPL Agent Lab 返回 suite result。
4. `baseline-delivery`：消费结构化 AI reviewer evaluation，写入 `baseline-delivery-receipt.json`，只声明 baseline package refs、review provenance 和 acceptance gates；缺 reviewer evaluation、空 critique/suggestions 或 source refs 只有 suite/scaffold refs 时 fail closed。
5. `online-learning`：写入 `online-learning-candidate.json` 与 `mechanism-patch-proposal.json`，候选保持 gated，不自动推广默认 agent、不训练或部署模型权重。

自举闭环还会调用 `opl agents interfaces --repo-dir <sample-agent>`，证明由 `OPL Meta Agent` 生成的目标智能体也能被 OPL 统一投影出 CLI / MCP / Skill / product-entry 接口包。

## External Agent Testing Takeover

`external-agent-takeover` 读取目标 agent repo/package 的 descriptor/contracts，生成 `agent_lab_external_suite`，调用 OPL `agent-lab run`，再写入 `testing_takeover_self_evolution_receipt`、gated online-learning candidate 和 mechanism patch proposal。

`improve-from-external-agent-lab-suite` 读取目标 domain 的 Agent Lab suite/result，并消费与 baseline delivery 相同 schema 的 AI reviewer evaluation。reviewer critique、suggestions、source refs 和 provenance 会进入 target capability improvement candidate、developer patch work order 和 mechanism patch proposal refs；可识别 suggestion 会映射到 `patch_traceability_matrix` 的 required patch refs、editable surfaces 和 target repo file hints。

`agent:evidence` 读取目标 agent 的 standard production evidence handoff，生成 `agent_production_evidence_suite`、Agent Lab run result、developer patch work order、target capability improvement candidate、mechanism patch proposal 或 typed blocker。MAS/MAG 等目标 agent 只通过 domain refs 出现在输入与 owner route 中；命令、suite kind、输出文件和 OMA surface kind 保持 target-agent generic。

Usable landing 的首个真实 target patch-loop smoke 已由 MAG closeout projection 落证：blocked suite / OMA work order / patch traceability / target verification / runtime read-model consumption / workspace proof / no-forbidden-write / owner receipt or typed blocker / absorption / cleanup / Agent Lab re-evaluation 都有 refs-only closeout shape。后续证据要求是把同一 shape 扩展到更多真实 target 与更多真实 patch / rerun 样本。work order、generated-surface readiness、suite pass 或单次 smoke 仍只能算消费面 proof，不能写成 target domain ready、quality verdict、artifact readiness 或 default promotion。

OMA 侧执行入口保持薄委托：`execute:external-work-order` 读取已经生成的 developer patch work order，只校验 refs-only shape 与 authority boundary，然后调用 OPL Framework 的 `opl work-order execute --work-order <path> --json`。target worktree lifecycle、generic runner、queue、attempt ledger、absorb、cleanup、post-absorb owner closeout hook invocation 和 execution receipt 均由 OPL Framework primitive / target owner 控制面持有；Agent Lab 只消费 re-evaluation refs；OMA 不在本仓实现第二套执行器、worktree 管理或 owner receipt writer。

该 takeover 只覆盖测试接管和候选生成。target domain truth、quality verdict、artifact body、memory body、默认 agent promotion authority 继续由目标 domain owner 持有；receipt 和 candidate 必须显式声明 `can_write_target_domain_memory_body=false`、`can_promote_default_agent_without_gate=false`。

## Mechanism Patch Proposal

Mechanism patch proposal 是 self-learning / takeover loop 的 proposal-only 输出。它把一次 Agent Lab segment run 转成三个受控段：

1. `observe`：引用 `segment_run_ref` 与 suite/receipt/candidate source refs。
2. `diagnose`：引用 `evidence_delta_ref`，说明本轮证据变化。
3. `edit`：引用 `next_mechanism_candidate_ref` 与 candidate 的 proposed change refs。

可编辑面只允许是 agent-building 机制面，例如 prompt policy、skill policy、stage policy、Agent Lab suite policy、takeover review policy、optimizer candidate policy 或 quality gate policy。proposal 不能直接写 target truth、memory body、artifact body、quality/export verdict，也不能绕过 explicit promotion gate。
