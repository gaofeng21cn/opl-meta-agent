# Skill: OPL Meta Agent Domain Skill

## 用途

当用户要把一个高价值知识交付流程做成 OPL-compatible Foundry Agent 时，使用本 skill 驱动从 intent intake 到 baseline delivery 的完整 domain pack 构建。OMA 是 OPL Foundry Agent 系列里的 agent-building / improvement 成员，复用 MAS/MAG/RCA 同一 canonical OPL agent lifecycle、generic slots、stage sections、closeout shape 和 authority invariants。OMA 自身不维护 repo-owned generic plugin wrapper；目标 agent 必须生成 OPL Agent Package manifest sidecar，并由 OPL generated skill / Codex plugin carrier surface 对外投影。面向 Codex 的默认入口是用户自然语言，例如“帮我做一个能交付 X 的智能体”；本 skill 负责把自然语言归一成 `build-agent-baseline` 的目标 agent 字段。

## 输入

- 目标 agent 的领域、交付物、质量门槛和禁止事项。
- 可选已有 workflow、repo、文档、论文/PDF、公开参考、案例系统或失败样例。
- OPL binary locator、输出 workspace locator 和 stage-decomposition runner 设置。
- 由 Codex 从用户话语抽取的 `domain_id`、`domain_label`、`delivery_domain`、`target_brief`、可选 `reference_design_source_refs`、`reference_design_pattern_notes` 和 `reference_design_pattern_packet_refs`。

## 流程

1. 执行 `intent-intake`，冻结目标、边界和 acceptance criteria，并把自然语言需求归一为 target-agent descriptor 字段。
2. 执行 `web-experience-research`、用户提供参考设计读取，或消费 OPL source ingest / Codex extraction 形成的 canonical refs-only pattern packet。外部 packet 必须是 `opl.reference_design_pattern_packet.v1`，只在 packet 本地目录解引用 semantic JSON-pointer refs；raw/opaque source 不得伪造成已提炼 workflow。只吸收可迁移模式，不复制外部 runtime、私有数据或领域 truth。若用户提供论文/PDF/repo/案例系统，参考来源是设计来源，seed library/profile/catalog 只作为 fallback、secondary 或 OPL conformance 下限。
3. 执行 `stage-decomposition` Codex stage attempt，产出 typed closeout packet。设计对象与 morphology 可相互迭代，但 source/research evidence 先于其 claim、admission 先于物化、`AgentBuildReceipt` 绑定物化后 bytes。`StageDecompositionSubpacketSet` 保存 provenance/boundary refs；每个 source workflow step 有 adopt/adapt/merge/stage-internal/reject disposition，不要求独立 Stage。
4. 执行 `agent-skeleton-build`，只校验并物化 closeout 中的 candidate package，再跑 scaffold/interface validation；scaffold 只是物理骨架，不是目标 agent 设计来源。
5. 执行 `eval-suite-build` 和 `baseline-run`，生成 thin evaluation request 与 target-bound Foundry evaluation work order；不在 OMA 内编译或执行 Agent Lab suite。
6. 对 existing target agent 可执行 takeover producer，生成 takeover evaluation request、Foundry evaluation work order 和 proposal-only candidate refs；不生成 suite plan、suite result 或 takeover receipt。
7. 由 OPL Foundry Lab 编译并执行 evaluation work order。只有外部返回的 suite result / execution receipt 才能进入 `improve:external-suite`，生成 target capability judgment、developer patch work order、no-source-patch judgment 或 expected blocker ref。
8. 实际 target patch、verification、Agent Lab re-evaluation、absorb/cleanup 和 owner closeout 由 OPL / target owner 执行；OMA 只消费返回 refs 并维持 no-forbidden-write boundary。
9. 只有 OPL evaluation、independent review、self-evolution 与 target-owner closeout evidence 齐全后，才通过 downstream `baseline-delivery` gate；producer action 本身只交付 candidate Agent Pack、AgentBuildReceipt 和 Foundry handoff。

## 输出

- OPL-compatible agent package refs。
- OPL Agent Package manifest sidecar ref。
- stage/action/memory/artifact/gate refs。
- AgentBuildReceipt、baseline/takeover evaluation request 与 Foundry evaluation work-order refs。
- optional OPL-returned takeover / external suite result 与 execution-receipt refs。
- structured AI reviewer evaluation refs。
- external-suite capability judgment、target capability candidate、developer patch work order / expected typed-blocker refs。
- 后续 optimizer 或 online-learning candidate refs。

## 质量门槛

- 用户自然语言能追溯到 `target_brief`；字段缺失时只回问会改变交付物或 owner boundary 的问题。
- reference/research route 必须保留安全 design-basis packet、TransferMap、AgentPackPlan、morphology 与 DesignAdmissionReceipt refs。`StageDecompositionSubpacketSet` v2 将其作为无序对象集合；dependency edges 只守 source/safe packet、admission/materialization、bytes/build-receipt 的真实因果关系。上述 refs 不成为 target truth、runtime dependency、owner receipt 或 quality verdict。
- 所有 stage 都有 prompt、tools/action、knowledge、handoff、quality gate declaration 和 independent gate policy。
- free text closeout、partial refs、缺 independent gate policy、缺 quality gate declaration 或 self-review 在已有可消费 agent-pack artifact 时记录 `completed_with_quality_debt` 和 route-back；它们阻止交付完成、promotion 与 ready 声明，不阻止 stage transition。
- generated interfaces 从 contracts 派生，不新增私有 wrapper。
- domain truth、memory body、artifact body、quality verdict owner 明确。
- scaffold/interface validation 不能单独构成交付完成；完整 baseline handoff 必须包含 Agent Lab takeover/external-suite evidence、independent reviewer evidence 和 self-evolution closeout。
- reviewer 或 Agent Lab 发现的缺口必须进入 developer patch work order、owner-gated improvement loop 或 typed blocker；不能只在聊天或 README 中记录。

## 禁止事项

- 禁止把本 skill 用作 generic runtime。
- 禁止替目标 domain owner 写最终事实或质量裁决。
- 禁止跳过 Agent Lab baseline/takeover/external-suite evidence、independent reviewer evidence 或 self-evolution closeout 直接交付。
