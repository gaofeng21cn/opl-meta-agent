---
name: opl-meta-agent
description: Use when Codex should operate OPL Meta Agent to design, baseline, take over, or improve OPL-compatible Foundry Agents.
---

# OPL Meta Agent

## 用途

使用 OPL Meta Agent 创建、接管测试、修复或持续改进 OPL-compatible Foundry Agent。OMA 读取用户自然语言、目标领域材料、用户提供的论文/资料/外部参考设计、已有 agent repo、Agent Lab evidence 和 reviewer evidence，产出 target-agent brief、stage pack、quality gates、Agent Lab suite seed、baseline receipt、developer patch work order、mechanism proposal、target capability candidate 或 typed blocker。

OMA 是 agent-building domain owner，不是 OPL Framework、Agent Lab、App registry、workbench、queue、attempt ledger、generic runtime 或 target domain owner。

## 普通入口

- 用户说“帮我做一个能交付 X 的智能体”“把这个流程做成 OPL Agent”“为这个 agent 补 baseline / suite / takeover / improvement loop”时，先用 OMA。
- 先把自然语言收敛成 target agent 的 `domain_id`、`domain_label`、`delivery_domain`、`target_brief`、acceptance criteria、non-goals 和 owner boundary。
- 新建 target agent 时，必须先消费 OPL Framework 的 profile selector / readback（`opl profiles select --intent ... --json`，命中内置 profile 时再 `opl profiles inspect ... --json`）。命中内置 profile 时由 OMA/Codex 明确选择 profile ref 并补齐 stage、capability、knowledge、tool 和 evaluation requirements；没有内置匹配但用户提供论文/PDF/repo/产品案例等参考设计时，消费 `profile_selection_mode=source_derived_design` receipt，先形成 `ReferenceDesignPacket -> TransferMap -> AgentPackPlan -> BuildReceipt`，再把 source refs / pattern packet refs 提炼成 stage graph、grounding、tool orchestration、rubric、validation、handoff 和 failure taxonomy。不要靠 OMA 记忆猜测 OPL 基座能力，也不要强行套用现有模板。
- 若用户提供论文、PDF、GitHub repo、产品文档或案例系统作为参考，记录为 `reference_design_source_refs`、`reference_design_pattern_notes` 或由 OPL source ingest / Codex extraction 形成的 `reference_design_pattern_packet_refs`；只消费 refs 和可迁移的架构、工作流、grounding、评估、handoff、failure taxonomy 模式，不读取 packet body，不把外部系统 runtime、私有数据或领域结论复制成目标 agent truth。source-derived stage pack 必须暴露非空四类设计对象 refs，并为每个 source-derived stage 标注来自参考设计的 `stage_pattern_source_refs`；`BuildReceipt` 必须证明 source-derived stage refs、target-only requirements、rejected source patterns、forbidden claims 和 refs-only authority boundary。只有 raw source ref 或 target-only owner gate 都不能替代参考设计消费证明。
- 若问题只是在某个已存在 target domain 的 truth、artifact body、quality verdict 或 owner receipt 内部，转回对应 target domain owner，不用 OMA 接管。

## Agent Lab And Target-Agent Handoff

OMA 输出 target-agent semantics、profile selection mode、selected OPL profile receipt 或 source-derived design receipt、ReferenceDesignPacket、TransferMap、AgentPackPlan、BuildReceipt，以及 refs-only handoff；OPL Framework / Agent Lab 执行 scaffold、generated interface、profile conformance、suite run、promotion gate、work-order execute / absorb / cleanup 和 App / registry projection。

Target agent handoff 必须保留：

- target agent descriptor、profile selection mode、selected OPL profile refs 或 source-derived design receipt、ReferenceDesignPacket、TransferMap、AgentPackPlan、BuildReceipt、profile requirements、stage control plane、action catalog、quality gates 和 capability map refs；
- reference design source refs、pattern notes、pattern packet refs 和 external-learning provenance；
- Agent Lab baseline / takeover / external-suite evidence refs；
- independent AI reviewer critique、suggestions、direct evidence refs 和 provenance；
- no-forbidden-write proof、owner route、source morphology refs 和 generated surface consumption refs；
- target owner receipt、typed blocker、human gate、route-back 或 owner-gated continuation shape。

## New-Agent Delivery Gate

创建新 target agent 时，不能把 scaffold、interface projection、contract validation、suite pass 或 provider completion 当成完成。完整 baseline handoff 至少需要：

1. target repo scaffold validation 和 OPL generated interface projection；
2. Agent Lab baseline、takeover 或 external-suite result；
3. structured independent AI reviewer evaluation，包含非空 critique、suggestions、direct evidence refs、run provenance 和独立 attempt refs；
4. OMA self-evolution pass，消费 Agent Lab result 与 reviewer evidence；
5. delivery receipt、no-patch coordination receipt / work order、developer patch work order 或 typed blocker 四者之一；
6. owner route、no-forbidden-write proof、source morphology、generated surface consumption、private residue decision 和 accepted owner-answer shape。

缺任一项时返回 typed blocker 或 owner-gated next step，不声明 target agent delivered、domain ready、production ready、quality verdict、App live ready 或 default promotion。

## Authority Boundary

- OMA 可以写 agent-building semantics、declarative pack、suite seed、developer work-order policy、target capability candidate、mechanism proposal 和 typed blocker shape。
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
