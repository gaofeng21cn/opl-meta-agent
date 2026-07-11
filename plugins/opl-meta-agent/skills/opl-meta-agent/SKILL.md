---
name: opl-meta-agent
description: Use when Codex should operate OPL Meta Agent to design, baseline, take over, or improve OPL-compatible Foundry Agents.
---

# OPL Meta Agent

## 用途

使用 OPL Meta Agent 创建、接管测试、修复或持续改进 OPL-compatible Foundry Agent。OMA 读取用户自然语言、目标领域材料、用户提供的论文/资料/外部参考设计、已有 agent repo、Agent Lab evidence 和 reviewer evidence，产出 target-agent brief、stage pack、quality gates、AgentBuildReceipt、declarative Agent Lab suite seed、OPL Foundry Lab evaluation work order、developer patch work order、mechanism proposal、target capability candidate 或 typed blocker ref/shape。

OMA 是 agent-building domain owner，不是 OPL Framework、Agent Lab、App registry、workbench、queue、attempt ledger、generic runtime 或 target domain owner。

## 普通入口

- 用户说“帮我做一个能交付 X 的智能体”“把这个流程做成 OPL Agent”“为这个 agent 补 baseline / suite / takeover / improvement loop”时，先用 OMA。
- 先把自然语言收敛成 target agent 的 `domain_id`、`domain_label`、`delivery_domain`、`target_brief`、acceptance criteria、non-goals 和 owner boundary。
- 新建 target agent 时，必须先做 intake route：`builtin_profile/hybrid`、`source_derived_design`、`research_driven_design` 或既有 agent takeover/improvement。命中内置 profile 时消费 OPL Framework profile selector / readback（`opl profiles select --intent ... [--intent-signal <canonical-signal>] --json`，再 `opl profiles inspect ... --json`）；非英文或混合语言请求由 OMA 从用户意图提炼 catalog 中存在的 canonical signals 并通过重复 `--intent-signal` 传入，原文仍是目标语义，signals 只用于 lower-bound profile 匹配。没有内置匹配但用户提供论文/PDF/repo/产品案例等参考设计时，消费 `profile_selection_mode=source_derived_design` receipt，先形成 `ReferenceDesignPacket -> TransferMap -> AgentPackPlan -> DesignAdmissionReceipt`；用户只有模糊想法且没有参考设计时，先上网/外部 source 调研专家实践，形成 `ResearchSynthesisPacket -> TransferMap -> AgentPackPlan -> DesignAdmissionReceipt`。两条设计依据路线都必须保留 `StageDecompositionSubpacketSet`，证明 stage-decomposition 内部按设计依据、迁移计划、pack 计划、设计准入和物化后 build proof 顺序执行；物化后保留 `AgentBuildReceipt` / `build_receipt` 作为构建证明。不要靠 OMA 记忆猜测 OPL 基座能力，也不要强行套用现有模板。
- 用户提供 typed reference-design packet 时，每个声明 source 都必须有 packet 覆盖；用户 packet 是 active design origin，seed 只作 context；每个 admitted workflow step 必须实际物化成独立 stage，并带自己的 prompt、skill、knowledge 与 quality gate refs。只生成 AgentPackPlan 或 generic single stage 不算完成。
- 若用户提供论文、PDF、GitHub repo、产品文档或案例系统，标准链路是 `source extraction -> OPL refs-only ReferenceDesignPatternPacket -> OMA ReferenceDesignPacket -> TransferMap -> AgentPackPlan -> DesignAdmissionReceipt -> target pack materialization -> AgentBuildReceipt`。OPL packet 必须符合 `opl.reference_design_pattern_packet.v1`，只携带 source/material/anchor/semantic JSON-pointer refs；OMA 只在 packet 本地目录内安全解引用这些 refs，再归一为 content-rich、逐 workflow step 的 OMA 设计对象。raw source、短 note、opaque packet ref、缺 steps 或缺 anchors 都必须 fail closed 到 typed blocker，不能自动拼固定“已提炼”文案。
- 普通用户只需给出目标和本地文件/附件路径，不需要预先制作 packet、pattern notes 或 CLI 参数。OMA 应复用或建立该 target agent 的持久 OPL workspace，先用 `opl workspace source ingest --workspace <workspace> --file <file> --role reference_design` 保管原始文件并取得 SHA-bound refs，再调用当前可用的文档提取能力 parse once，把提取结果整理成 canonical pattern packet 后进入上述标准链路。重复迭代默认复用同一 workspace、source receipt 和已提取资产；只有源文件 bytes、提取方法或用户要求的设计范围变化时才重新提取。一次性临时目录只用于用户明确的一次性试验，不能作为可继续迭代的 agent 项目默认位置。
- `build-agent-baseline` 不启动 OMA 私有 stage attempt。调用方必须由 OPL 按 action catalog 的 ordered `stage_route` 创建并关闭 StageRun，再把每个 canonical `family-runtime attempt query` JSON 通过重复 `--stage-run-readback` 传入；route 未闭合时 OMA 只返回 typed continuation。需要完整设计或文件正文的 stage 使用 OPL canonical `domain_owned_stage_output_ref` v1，把 `output_ref` 同时列入 closeout refs；OMA 只读取 attempt `workspace_root` 内的 `file://` ref，并要求同 ref 的 SHA-256 metadata，拒绝 bytes drift、路径或符号链接逃逸、stage/closeout identity mismatch。OPL ledger 只运输 refs，不持有或改写 OMA domain payload。
- `contracts/expert_workflow_pattern_library.json` 是 content-rich 专家工作流 seed library，不是模板库或 OPL external packet ABI。用户提供的 paper/packet 永远是 design origin；seed 只能在无用户来源时 fallback，或作为 secondary context，并在 `pattern_dispositions` 中显式记录 adopted/adapted/rejected。`ReferenceDesignPacket` 必须保留真实 steps、source anchors、`source_derived|internal_synthesis` provenance、适用/不可迁移约束；`TransferMap` 按 pattern/step、source anchor、target stage/capability slot、rationale、limits 和 adopt/adapt/reject 映射；`AgentPackPlan` 为每个 workflow step 生成独立稳定 target stage，不能全部折叠到 `agent-output-draft`。
- 若用户只有模糊想法，记录 `research_source_refs`、`expert_practice_notes` 和 `research_synthesis_refs`；这些只作为专家实践设计依据，不是 target truth。research-driven stage pack 必须暴露非空 `ResearchSynthesisPacket`、`TransferMap`、`AgentPackPlan`、`DesignAdmissionReceipt` 和 `StageDecompositionSubpacketSet` refs，并为 stage 标注来自调研综合的 `stage_pattern_source_refs`；物化后保留 `AgentBuildReceipt` / `build_receipt`。
- OMA 设计 stage 大小时，默认由 stage 主提示词承担 top-level decomposition，由 repo-local professional skill 承担 stage 内专业方法判断。一个 top-level stage 只应承载一个主要开放语义判断；确定性生成、校验、文件物化、helper receipt 和 readback 留在 stage 内。若需要不同 owner、知识源、quality gate、handoff 或失败路由，就拆 stage；若只是同一判断的机械步骤，就合并或删除。刻意保留的大 stage 必须用 typed subpacket / gate 暴露内部边界，不能用 schema 或 validator 替代语义拆分判断。validator/schema/materializer 发现的可机械推导 format、projection、ref 或 expected receipt 缺口，应在同一 stage admission 内有界修正并继续推进；语义对象缺失、source/evidence 缺失、owner 决策缺失或 authority 越权才 route-back / typed blocker / human gate。
- 若问题只是在某个已存在 target domain 的 truth、artifact body、quality verdict 或 owner receipt 内部，转回对应 target domain owner，不用 OMA 接管。

## Agent Lab And Target-Agent Handoff

OMA 输出 target-agent semantics、profile selection mode、selected OPL profile receipt、source-derived design receipt 或 research-driven design receipt、ReferenceDesignPacket 或 ResearchSynthesisPacket、TransferMap、AgentPackPlan、DesignAdmissionReceipt、StageDecompositionSubpacketSet、AgentBuildReceipt / build_receipt，以及 refs-only handoff；OPL Framework / Agent Lab 执行 scaffold、generated interface、profile conformance、suite run、promotion gate、work-order execute / absorb / cleanup 和 App / registry projection。

`build-agent-baseline`、`takeover:test` 和 `agent:evidence` 的 producer 终点是 target-bound declarative suite seed 与 canonical Foundry Lab evaluation work order；它们不本地执行 suite，不写 Agent Lab result、Foundry execution receipt、target owner receipt、learning ledger 或 promotion result。work order 必须使用完整 `domain_id + target_agent_ref + descriptor_ref`，绑定 suite/task 与 canonical provenance refs，并通过 `opl agent-lab evaluation-work-order execute --work-order <work-order.json> --output <dir>` 交给 OPL。只有 OPL 返回的 target-bound result / execution receipt 才能作为 `improve:external-suite --suite-result` 的输入；缺失时保持 work-order pending 或 external typed blocker，不得由 OMA 自填结果或 receipt。

Target agent handoff 必须保留：

- target agent descriptor、profile selection mode、selected OPL profile refs、source-derived design receipt 或 research-driven design receipt、ReferenceDesignPacket 或 ResearchSynthesisPacket、TransferMap、AgentPackPlan、DesignAdmissionReceipt、StageDecompositionSubpacketSet、AgentBuildReceipt / build_receipt、profile requirements、stage control plane、action catalog、quality gates 和 capability map refs；
- reference design source refs、pattern notes、pattern packet refs 和 external-learning provenance；
- declarative suite seed / Foundry evaluation work-order refs，以及由 OPL 外部返回的 baseline / takeover / external-suite result 与 execution-receipt refs；
- independent AI reviewer critique、suggestions、direct evidence refs 和 provenance；
- no-forbidden-write proof、owner route、source morphology refs 和 generated surface consumption refs；
- target owner receipt、typed blocker、human gate、route-back 或 owner-gated continuation shape。

## New-Agent Delivery Gate

创建新 target agent 时，不能把 scaffold、interface projection、contract validation、suite pass 或 provider completion 当成完成。完整 baseline handoff 至少需要：

1. target repo scaffold validation 和 OPL generated interface projection；
2. 由 OPL Foundry Lab 对 target-bound work order 返回的 baseline、takeover 或 external-suite result / execution receipt；
3. structured independent AI reviewer evaluation，包含非空 critique、suggestions、direct evidence refs、run provenance 和独立 attempt refs；
4. OMA self-evolution pass，消费 Agent Lab result 与 reviewer evidence；
5. OPL / target owner 返回的 delivery receipt、no-patch coordination、developer patch work order 或 typed blocker 四者之一；
6. owner route、no-forbidden-write proof、source morphology、generated surface consumption、private residue decision 和 accepted owner-answer shape。

缺任一项时返回 typed blocker 或 owner-gated next step，不声明 target agent delivered、domain ready、production ready、quality verdict、App live ready 或 default promotion。
Producer action 自身的 `candidate_package_materialized_ready_for_opl_foundry_lab_evaluation` 或 `takeover_candidate_materialized_ready_for_opl_foundry_lab_evaluation` 只表示 evaluation handoff 已就绪，不是 new-agent delivery gate readback，也不是上述完成条件。

## Authority Boundary

- OMA 可以写 agent-building semantics、declarative pack、suite seed、Foundry evaluation work-order candidate、developer work-order policy、target capability candidate、mechanism proposal 和 OMA-owned blocker shape/ref；不得代写 target-domain 或 OPL runtime blocker body。
- OMA 不写 target domain truth、memory body、artifact body、quality/export verdict、owner receipt body、runtime queue、provider attempt、App state 或 default promotion state。
- OPL owns standard runtime, generated / hosted surfaces, Agent Lab execution, package validation, registry / App projection and work-order lifecycle.
- Target domain owner owns final truth, artifact body, memory body, quality/export verdict, owner receipt, human gate and default promotion authority.

## Professional Skills

默认先用本 primary skill 收敛任务和边界；只有 stage 内需要专门判断时再调用 repo-local professional skills：

- `agent/professional_skills/oma-stage-pack-intent-architecture/SKILL.md`：intent、external pattern research、stage pack、action catalog、artifact morphology 和 no-forbidden-write policy。
- `agent/professional_skills/oma-eval-takeover-review/SKILL.md`：Agent Lab baseline / external suite design、existing target-agent takeover review 和 evaluation boundary。
- `agent/professional_skills/oma-work-order-hygiene/SKILL.md`：refs-only developer patch work order、typed blocker shape、script-to-pack/source-purity hygiene 和 route-back recommendation。
- `agent/professional_skills/oma-agent-design-evolution/SKILL.md`：Agent Lab / FeedbackOps / work-order / App projection / trajectory evidence diagnosis、mechanism learning 和 owner-gated repair route。

这些 active workflow-level professional skills 不是默认全局 Codex entry；旧 9 个细粒度入口仅作 redirect/tombstone，由 OMA stage prompt 或本 primary skill 按需路由到 canonical workflow skill。

## Completion Rules

- Scaffold created is not completion.
- Interface generated is not completion.
- Contract or manifest validation is not completion.
- Suite pass is not completion.
- Provider completion is not completion.
- Candidate package is not owner acceptance.

完成声明必须绑定到 target-agent handoff evidence、Agent Lab / reviewer evidence、self-evolution closeout、owner route 和明确 closeout outcome。缺 owner authority 时输出 typed blocker、human gate、route-back 或 owner-gated continuation。
