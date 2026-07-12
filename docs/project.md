# opl-meta-agent

Owner: `opl-meta-agent`
Purpose: `opl_based_agent_builder_foundry_agent`
State: `real_target_delivery_minimum_and_codex_first_pack_ready`
Machine boundary: 本文是人读项目概览。机器真相归 `contracts/`、运行 receipts、OPL Agent Lab result refs 和未来 delivery receipts。

`opl-meta-agent` 是基于 OPL Framework 的独立 Foundry Agent，也是 OPL Foundry Agent 系列成员。OPL 的 `foundry-agent-series-policy` public consumer 提供 canonical lifecycle、stage pack、closeout、projection 和 authority policy；`contracts/foundry_agent_series.json` 只保存 release pin、canonical refs、OMA identity 与 `domain_specific_profile`，不复制 Framework policy body。OMA 的 agent-building / improvement 差异写在 domain delta、stage/action contracts 和 authority refs 中，输入是 target agent specs 与 evidence refs，输出是 candidate package、developer work order、target capability candidate、mechanism patch proposal 或 typed blocker。

OPL family `Foundry Agent OS` target delta 维护在 [OMA Foundry Agent OS 目标差异页](./active/foundry-agent-os-target-delta.md)。OMA 在该目标下不是第二 Agent Lab，也不是 OPL Framework 内置模块；它保留 agent-building authority kernel，OPL 持有 generic execution、generated interface、work-order primitive、promotion/canary/rollback shell、App/workbench 和 capability registry ABI。

本仓持有 agent-building domain semantics：用户意图理解、公开经验调研、阶段拆解、agent skeleton / prompt / skill / contract 生成策略、Agent Lab suite 组织、baseline 验收、optimizer candidate、在线学习审阅策略和 mechanism patch proposal 记录。

`agent/` 是本仓 domain pack 的 repo-tracked 入口。当前必须保持 `knowledge/`、`prompts/`、`quality_gates/`、`skills/`、`stages/` 的可解析文件存在、非空且无占位；`agent/stages/manifest.json` 是 OPL Pack 唯一 repo-tracked domain-owned declarative stage source，并把 policy、prompt、knowledge、quality gate、action 与 transition refs 绑定到真实文件和 catalog。Hosted `family_stage_control_plane` 由 OPL Framework 编译和持有。

OPL Framework 持有通用 runtime、Agent Lab、queue、stage attempt ledger、provider receipt、observability、optimizer/RL transition refs、standard scaffold 和 promotion gate。

Agent Lab 与 `opl-meta-agent` 的长期关系是标准消费者关系：OPL Agent Lab 提供通用 refs-only evaluation / mechanism / evidence control plane；`opl-meta-agent` 提供通用 target-agent foundry / repair / takeover 语义。标准 OPL Agent 通过 descriptor、stage/action refs、Agent Lab handoff、owner receipt contract、production/live acceptance、owner route refs、required return shapes、no-forbidden-write proof 和 verification refs 兼容它们。MAS、MAG、RCA 等 domain 名称只应作为目标 agent refs、owner routes、fixtures 或 provenance 出现，不能成为 Agent Lab 或 OMA 的顶层设计中心。

`skillnerds/xskill` 仅作为 clean-room pattern source 进入本仓决策。当前吸收的是 skill evolution 组织经验：trajectory atomization、candidate buffer、per-skill version / canary evidence、team redaction / sync refs。它们只影响 OMA 的 agent-building policy、candidate / work-order / proposal 表达和 reviewer 证据要求，不引入 xskill daemon/runtime、generic scheduler、skill installer 或 team server。

在智能体自进化任务上，Agent Lab 判断“证据、根因、候选、变体、风险和 promotion gate 是否成立”；`opl-meta-agent` 判断“如何把这些 refs 和目标 handoff 变成可执行 developer work order / target capability candidate / mechanism patch proposal / typed blocker”。本仓不能复制 Agent Lab runner、promotion gate、queue、attempt ledger 或 App/workbench runtime，也不能把 work order、suite pass、proposal 或 generated-surface proof 写成目标 domain ready、quality verdict、artifact readiness 或默认 agent promotion。

`improve:external-suite` 与 `agent:evidence` 已落地 executor-first reviewer work order 机器面：work order 串起 independent reviewer provenance、executor aperture、patch traceability、target verification、owner route、no-forbidden-write proof、rollback/canary/version refs、typed blocker return shape 和 patch-loop closeout refs。`contracts/real_target_agent_scaleout_evidence.json` 当前把 MAS/MAG 两个真实目标折回为 refs-only scaleout closeout。`blocked_suite_result_ref`、`developer_patch_work_order_ref`、`patch_traceability_matrix_ref`、`target_repo_verification_refs`、`target_runtime_read_model_consumption_ref`、`workspace_environment_proof_ref`、`no_forbidden_write_proof_ref`、`target_owner_receipt_or_typed_blocker_ref`、`patch_absorption_ref`、`worktree_cleanup_ref` 与 `agent_lab_re_evaluation_ref` 是 handoff / closeout / scaleout 证据；它们不授权 target domain ready、quality verdict、artifact readiness、owner receipt body 或 default promotion。

`execute:external-work-order` 是 OMA 对 OPL `work-order execute` primitive 的薄委托入口。它可以声明 post-absorb target-domain owner closeout hook 已委托给 OPL，并记录 `target_owner_closeout_owner=target-domain via OPL`；它不能直接调用 hook，不能把 OPL result 转写成 owner receipt body，也不能写 target truth、memory body、artifact body 或 quality/export verdict。

CLI、MCP、Skill、product-entry 和 tool 描述不是本仓私有实现；它们由 OPL Framework 从本仓标准 action / stage contracts 统一生成。OMA 不维护 repo-owned generic plugin wrapper；OMA 自身的 Codex plugin 只是 `agent/primary_skill/SKILL.md` 的 repo-local full-copy carrier，新目标 agent 采用 OPL Agent Package manifest sidecar 作为 package 管理语义。本仓只保留智能体构建语义、refs-only Agent Lab suite 组织和 minimal authority outputs。生成接口可以调用已声明的 minimal authority functions 和 smoke action，但权限保持为投影、回执、blocker、候选引用，不升级为领域事实、记忆正文、产物正文、质量/导出裁决或默认 agent promotion。

当前最小 producer 闭环由 `build-agent-baseline` 承载：Codex Skill 收敛 target identity/brief 并形成 design-basis、transfer、pack、morphology 和 admission refs；`StageDecompositionSubpacketSet` v2 把它们记录为无序设计对象集合，仅用 dependency edges 固定 source/safe packet、admission/materialization、bytes/build-receipt 的真实因果关系。脚本消费 OPL ordered StageRun route readbacks，校验 stage graph/file plan 与 skeleton file bodies，再委托 OPL scaffold 负责路径安全、文件 IO、digest 和最终 `AgentBuildReceipt`。

Producer 随后生成 thin `foundry_evaluation_request` 与 canonical Foundry evaluation work order。request 只声明 domain-owned task intent 与 refs；work order 才绑定 `domain_id + target_agent_ref + descriptor_ref`、request/suite/task identity 和 canonical source/reviewer/candidate provenance，并交给 `opl agent-lab evaluation-work-order execute --work-order <work-order.json> --output <dir>`。OPL 是唯一 suite-plan compiler；OMA 不本地执行 suite，不生成 suite plan、suite result、Foundry execution receipt、target owner receipt、learning/scaleout ledger、promotion result 或 target-domain blocker body；只有 OPL 返回的 target-bound result / receipt 才能进入 `improve:external-suite --suite-result` 与 downstream owner closeout。参考设计来源、PDF/论文 pattern packet 和调研综合 refs 只作为架构、工作流、grounding、评估和 failure taxonomy inspiration，不是 target truth、runtime dependency、owner receipt 或 quality verdict。

Mechanism patch proposal 记录 `mechanism_ref/version`、`editable_surfaces`、`observe/diagnose/edit`、`segment_run_ref`、`evidence_delta_ref` 与 `next_mechanism_candidate_ref`。它只表达可进入 gate 的机制补丁建议，不写 target truth、memory body、artifact body、quality verdict，也不无 gate promote default agent。

当前 semantic pack 明确采用 executor-first / Codex-first：Codex 负责专家判断、问题重构、反例搜索、工具与知识缺口识别、stage graph 取舍和机制改进判断；合同只固定 owner boundary、权限、安全、receipt、projection 和 fail-closed 条件，不能把 scorecard、suite pass 或 contract completeness 写成质量裁决。
