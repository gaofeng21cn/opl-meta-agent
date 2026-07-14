---
name: opl-meta-agent
description: Use when Codex should operate OPL Meta Agent to design, baseline, take over, or improve OPL-compatible Foundry Agents.
---

# OPL Meta Agent

## 用途

使用 OPL Meta Agent 创建、接管测试、修复或持续改进 OPL-compatible Foundry Agent。OMA 读取用户自然语言、目标领域材料、用户提供的论文/资料/外部参考设计、已有 agent repo、Agent Lab evidence 和 reviewer evidence，产出 target-agent brief、stage pack、quality gates、AgentBuildReceipt、evaluation/developer-patch semantics、canonical work-order materialization request、mechanism proposal、target capability candidate 或 typed blocker ref/shape。

OMA 是 agent-building domain owner，不是 OPL Framework、Agent Lab、App registry、workbench、queue、attempt ledger、generic runtime 或 target domain owner。

## 普通入口

- 用户说“帮我做一个能交付 X 的智能体”“把这个流程做成 OPL Agent”“为这个 agent 补 baseline / suite / takeover / improvement loop”时，先用 OMA。
- 先把自然语言收敛成 target agent 的 `domain_id`、`domain_label`、`delivery_domain`、`target_brief`、acceptance criteria、non-goals 和 owner boundary。
- 新建 target agent 时先收敛 intake route：`builtin_profile/hybrid`、`source_derived_design`、`research_driven_design` 或既有 agent takeover/improvement。命中内置 profile 时消费 OPL Framework profile selector/readback；用户提供论文/PDF/repo/产品案例时把它作为 source-derived design origin；只有模糊想法且没有 primary reference 时再调研专家实践。设计依据、transfer、pack plan、admission 与 morphology 可以相互校正，但 source evidence/safe packet 必须先于其 claim，design admission 必须先于 materialization，`AgentBuildReceipt` 只能证明物化后的 bytes。`StageDecompositionSubpacketSet` 保留这些对象和边界的可追溯 refs，不规定固定认知子包执行顺序。不要靠 OMA 记忆猜测 OPL 基座能力，也不要强行套用现有模板。
- 用户提供 typed reference-design packet 时，每个声明 source 都必须有 packet 覆盖；用户 packet 是 active design origin，seed 只作 context。每个 admitted workflow step 必须在 target pack 中有可追溯 disposition，但只有独立开放判断、owner、knowledge、quality gate、handoff 或 failure route 才需要独立 Stage；同一判断内的机械步骤应合并或留在 Stage 内。
- 若用户提供论文、PDF、GitHub repo、产品文档或案例系统，标准链路是 `source extraction -> OPL refs-only ReferenceDesignPatternPacket -> OMA ReferenceDesignPacket -> TransferMap -> AgentPackPlan -> DesignAdmissionReceipt -> target pack materialization -> AgentBuildReceipt`。OPL packet 必须符合 `opl.reference_design_pattern_packet.v1`，只携带 source/material/anchor/semantic JSON-pointer refs；OMA 只在 packet 本地目录内安全解引用这些 refs，再归一为 content-rich、逐 workflow step 的 OMA 设计对象。raw source、短 note、opaque packet ref、缺 steps 或缺 anchors 本身是可消费 intake/extraction artifact：记录质量债并由 Codex 继续 extraction、route-back 或进入其他 declared stage，但不能伪造“已提炼”内容，也不能声明 source-derived design admitted/materialized。只有不可读、路径越界、安全/权限、authority、identity/currentness 或显式人工决策才硬停。
- 普通用户只需给出目标和本地文件/附件路径，不需要预先制作 packet、pattern notes 或 CLI 参数。OMA 应复用或建立该 target agent 的持久 OPL workspace，先用 `opl workspace source ingest --workspace <workspace> --file <file> --role reference_design` 保管原始文件并取得 SHA-bound refs，再调用当前可用的文档提取能力 parse once，把提取结果整理成 canonical pattern packet 后进入上述标准链路。重复迭代默认复用同一 workspace、source receipt 和已提取资产；只有源文件 bytes、提取方法或用户要求的设计范围变化时才重新提取。一次性临时目录只用于用户明确的一次性试验，不能作为可继续迭代的 agent 项目默认位置。
- `build-agent-baseline` 只通过 OPL hosted `stage_binding` 进入 StageRun；OPL 负责 attempt/query/readback、identity/currentness、route recommendation 校验和 transition materialization，OMA 不接收 raw StageRun query、不计算 next stage/current pointer。需要完整设计或文件正文时，`stage-decomposition` 与 `agent-skeleton-build` 分别产出 OMA-owned `stage_attempt_closeout_packet` artifact ref，后续 Stage 只消费这两个 domain packet；OPL ledger 只运输 refs，不持有或改写 OMA domain payload。repo-local developer proof 只能消费 exact domain packet 与 OPL-produced proof receipt，不得自行 spawn OPL/Codex、启动 attempt 或伪造 receipt。
- `contracts/expert_workflow_pattern_library.json` 是 content-rich 专家工作流 seed library，不是模板库或 OPL external packet ABI。用户提供的 paper/packet 永远是 design origin；seed 只能 fallback/secondary，并显式记录 adopted/adapted/rejected。`ReferenceDesignPacket` 保留真实 steps、source anchors、provenance 与适用限制；`TransferMap` 记录每个 source pattern/step 在 target capability、Stage 或 Stage-internal method 中的 disposition。不得把所有开放判断折叠成 generic output stage，也不得因为 source 有编号步骤就机械复制成一一对应的 target Stage。
- 若用户只有模糊想法，记录 `research_source_refs`、`expert_practice_notes` 和 `research_synthesis_refs`；这些只作为专家实践设计依据，不是 target truth。research-driven stage pack 必须暴露非空 `ResearchSynthesisPacket`、`TransferMap`、`AgentPackPlan`、`DesignAdmissionReceipt` 和 `StageDecompositionSubpacketSet` refs，并为 stage 标注来自调研综合的 `stage_pattern_source_refs`；物化后保留 `AgentBuildReceipt` / `build_receipt`。
- OMA 设计 stage 大小时，默认由 stage 主提示词承担 top-level decomposition，由 repo-local professional skill 承担 stage 内专业方法判断。一个 top-level stage 只应承载一个主要开放语义判断；确定性生成、校验、文件物化、helper receipt 和 readback 留在 stage 内。若需要不同 owner、知识源、quality gate、handoff 或失败路由，就拆 stage；若只是同一判断的机械步骤，就合并或删除。刻意保留的大 stage 必须用 typed subpacket / gate 暴露内部边界，不能用 schema 或 validator 替代语义拆分判断。validator/schema/materializer 发现的可机械推导 format、projection、ref 或 expected receipt 缺口，应在同一 stage 内有界修正并继续推进；语义、source/evidence、reviewer、损坏/不可读输出或零输出缺口都记录质量债、no-output/failure diagnostic 与 route-back input，阻止 accepted/delivery/promotion/ready 声明但继续 stage transition。Codex 可 advance、skip、repeat、reverse 或 route-back 到任一 declared stage。只有 executor 不可用、显式 owner/human 决策、安全/权限/authority、不可逆动作或 wrong-target identity/currentness 才 typed blocker / human gate。
- 若问题只是在某个已存在 target domain 的 truth、artifact body、quality verdict 或 owner receipt 内部，转回对应 target domain owner，不用 OMA 接管。

## Agent Lab And Target-Agent Handoff

OMA 输出 target-agent semantics、profile selection mode、selected OPL profile receipt、source-derived design receipt 或 research-driven design receipt、ReferenceDesignPacket 或 ResearchSynthesisPacket、TransferMap、AgentPackPlan、DesignAdmissionReceipt、StageDecompositionSubpacketSet、AgentBuildReceipt / build_receipt，以及 refs-only handoff；OPL Framework / Agent Lab 执行 scaffold、generated interface、profile conformance、suite run、promotion gate、work-order execute / absorb / cleanup 和 App / registry projection。

`build-agent-baseline`、`takeover:test` 和 `agent:evidence` 的 producer 终点是 thin Foundry evaluation request 与 canonical Foundry Lab evaluation work order；request 只声明 domain-owned task intent 与 refs，work order 才绑定完整 `domain_id + target_agent_ref + descriptor_ref`、suite/task identity 与 canonical provenance。它们不本地编译或执行 suite，不写 Agent Lab result、Foundry execution receipt、target owner receipt、learning ledger 或 promotion result。OPL 通过 `opl agent-lab evaluation-work-order execute --work-order <work-order.json> --output <dir>` 编译唯一 suite plan 并执行；只有 OPL 返回的 target-bound result / execution receipt 才能作为 `improve:external-suite --suite-result` 的输入；缺失时保持 work-order pending 或 external typed blocker，不得由 OMA 自填结果或 receipt。

Target agent handoff 必须保留：

- target agent descriptor、profile selection mode、selected OPL profile refs、source-derived design receipt 或 research-driven design receipt、ReferenceDesignPacket 或 ResearchSynthesisPacket、TransferMap、AgentPackPlan、DesignAdmissionReceipt、StageDecompositionSubpacketSet、AgentBuildReceipt / build_receipt、profile requirements、stage control plane、action catalog、quality gates 和 capability map refs；
- reference design source refs、pattern notes、pattern packet refs 和 external-learning provenance；
- evaluation/developer-patch semantic request / canonical work-order materialization request refs，以及由 OPL 外部返回的 canonical work order、suite plan、baseline / takeover / external-suite result 与 execution-receipt refs；
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

缺任一项时记录质量债、owner-gated next step、route-back 或 no-output diagnostic，继续 evaluation、review、自进化或后续 declared stage；只是不声明 target agent delivered、domain ready、production ready、quality verdict、App live ready 或 default promotion。仅真实 authority/safety/permission/identity/currentness/不可逆动作/显式 human decision 才返回 hard-stop typed blocker 或 human gate。
Producer action 自身的 `candidate_package_materialized_ready_for_opl_foundry_lab_evaluation` 表示 OMA domain artifact 已物化并可交给 OPL evaluation；`takeover_semantic_request_ready_for_opl_foundry_lab_materialization` 只表示内存中的 takeover semantic request 已就绪。二者都不是 new-agent delivery gate readback，也不是上述完成条件。

## Authority Boundary

- OMA 可以写 agent-building semantics、declarative pack、evaluation/developer-patch semantic request、canonical work-order materialization request、target capability candidate、mechanism proposal 和 OMA-owned blocker shape/ref；不得分配 work-order identity、管理 lease/worktree/lifecycle，也不得代写 target-domain 或 OPL runtime blocker body。
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

完成声明必须绑定到 target-agent handoff evidence、Agent Lab / reviewer evidence、self-evolution closeout、owner route 和明确 closeout outcome。缺 owner authority 时输出质量债、human gate、route-back 或 owner-gated continuation并继续可逆工作；typed blocker 只用于真正硬停边界。
