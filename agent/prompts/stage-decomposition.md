# Stage Decomposition Prompt

Professional skill route: use
`agent/professional_skills/oma-stage-pack-intent-architecture/SKILL.md` for
stage-pack architecture method. This prompt keeps the stage closeout shape and
OMA/OPL owner boundary; the professional skill does not add runtime authority
or target owner authority.

## 目标

把 intake 和 research 结果转成目标 agent 的 declarative domain pack：stage control plane、action catalog、memory descriptor、artifact locator 和 gate refs。

## 输入

- `intent_brief_ref`、`acceptance_criteria_ref`、`authority_boundary_ref`。
- `profile_selection_mode`、可选 `selected_opl_profile_refs`、`profile_selection_rationale`、`profile_requirement_refs` 和 profile requirements；内置 profile / hybrid 路线必须来自 OPL `profiles select/inspect` readback，source-derived 路线必须来自 source-derived design receipt、reference design pattern packet refs、`ReferenceDesignPacket`、`TransferMap`、`AgentPackPlan`、`DesignAdmissionReceipt`、`StageDecompositionSubpacketSet` 和物化后的 `AgentBuildReceipt` / `build_receipt`；research-driven 路线必须来自 research-driven design receipt、`research_source_refs`、`expert_practice_notes`、`research_synthesis_refs`、`ResearchSynthesisPacket`、`TransferMap`、`AgentPackPlan`、`DesignAdmissionReceipt`、`StageDecompositionSubpacketSet` 和物化后的 `AgentBuildReceipt` / `build_receipt`。
- `research_brief_ref`、`source_refs`、`pattern_disposition_refs`、`reference_design_source_refs`、`reference_design_pattern_notes`、`reference_design_pattern_packet_refs`、`research_source_refs`、`expert_practice_notes` 和 `research_synthesis_refs`。
- OPL-compatible Foundry Agent 的合同边界：stage-led、refs-only handoff、domain-owned truth。
- 用户或 source 声明的目标交付物形态、体量、开放式正文范围、外部资产来源和真实目标任务样例；缺失时必须在 closeout 中写成 route-back / blocker，不能静默缩小交付物。

## 步骤

1. 列出目标 agent 从 intake 到 delivery 的最小 stage sequence，避免把多个 owner 的责任塞进同一 stage。
2. 让 Codex 先给出候选 stage graph 与反例：哪些 stage 太机械、哪些 stage 会限制 AI executor、哪些 stage 需要合并/拆分/删除。
3. 判断 stage 大小：一个 top-level stage 只承载一个主要开放语义判断；确定性生成、校验、文件物化、helper receipt 和 readback 留在 stage 内。若两个判断需要不同 owner、知识源、quality gate、handoff recipient 或失败路由，拆成不同 stage；若只是同一判断的机械步骤，合并或删除。刻意保留的大 stage 必须在 stage 内暴露 typed subpacket / gate，例如 `StageDecompositionSubpacketSet`，不能藏成私有子流程，也不能把 subpacket 升级成 OPL runtime stage。
4. 采用 Progress-First admission：validator、schema 或 materializer 发现缺口时，先区分 `repairable_projection_or_ref_drift` 与 `semantic_or_authority_failure`。可由已声明设计对象、target refs、stage graph 或 authority boundary 确定推导的投影、ref、stage input / requires / expected receipt ref 缺口，必须作为本 stage 内的有界 materialization/admission 修正继续推进；不得直接产出 terminal blocker，也不得把修正步骤升级为新的 runtime stage。核心设计对象为空、来源模式缺失、owner 决策缺失、forbidden claim、target truth 越权或无法推导的语义缺口，才输出 route-back / typed blocker / human gate。
5. 把 active profile selection mode 映射进真实 stage graph：内置 profile requirements 的 required stage archetypes 进入 stage_contract requires，reference pack / source freshness / provenance requirements 进入 knowledge refs，tool connector requirements 进入 tool refs，quality/evaluation requirements 进入 quality gate。source-derived route 的固定语义顺序是 `source extraction -> OPL refs-only ReferenceDesignPatternPacket -> safe local JSON-pointer resolution -> OMA ReferenceDesignPacket -> TransferMap -> per-step AgentPackPlan -> DesignAdmissionReceipt -> target pack materialization -> AgentBuildReceipt`；每个 admitted workflow step 必须在 `stage_control_plane.stages` 中成为独立 stage，并带自己的 prompt、skill、knowledge 和 quality-gate refs，不能只存在于 plan。每个声明的 reference source 都必须有 typed packet 覆盖；存在用户 typed packet 时 seed 只作 context，不得扩张 active stage graph。research-driven route 仍是 `ResearchSynthesisPacket -> TransferMap -> AgentPackPlan -> DesignAdmissionReceipt` 后物化。两条路线都用 `StageDecompositionSubpacketSet` 证明 design-basis、transfer-planning、agent-pack-planning、design-admission、build-verification 顺序；文件物化只是 projection。
6. OPL external packet 只接受 `opl.reference_design_pattern_packet.v1` refs envelope，不接受 OMA 自造的 content-rich external packet shape。只在 packet 所在目录内解引用 `pattern_summary_ref`、`transferable_pattern_refs`、`non_transferable_constraint_refs`、`authority_boundary_notes_ref`；越界 path、opaque ref、缺 pointer、缺 semantic object、source-material mismatch 或 authority/non-claims 不合法时 fail closed。OMA seed library 可直接提供 content-rich `transferable_workflow_steps`，但用户 paper/packet 是 primary design origin，seed 只能 fallback/secondary，并显式记录 adopt/adapt/reject。每个 workflow step 必须保留 source anchors 与 `source_derived|internal_synthesis` provenance；quality/evaluation source 不能伪装成 direct workflow source。`TransferMap` 使用 pattern/step id、`source_anchor_ref`、`target_stage_or_capability_slot`、`transfer_rationale`、`known_limits`、`disposition`；`AgentPackPlan` 每个 workflow step 生成独立稳定 stage，不能全部落到 `agent-output-draft`。
7. 为每个 stage 明确 goal、inputs、prompt refs、tools/action refs、knowledge refs、outputs、handoff 和 quality gate。
8. 对每个 stage 写清 AI executor autonomy：Codex 可在哪些范围内自主规划、调用工具、要求补充 source、route-back、重写策略。
9. 设计 action catalog，只保留 domain authority function 或 smoke CLI；generic CLI/MCP/Skill/product-entry 交给 OPL generated interface。
10. 形成语言中立的 implementation plan：Agent identity 固定为 Markdown/JSON Standard Agent Pack；先判断是否真的需要程序 helper。新建 baseline 默认物化 pack-only implementation profile。只有 target repo 已经存在且通过审计的 helper root 才能进入 profile；尚未实现的 helper need 必须作为 AgentPackPlan / capability requirement / developer work order ref，记录建议 role、language 与验证边界，不能伪造成已落地 implementation。Python/TypeScript 只能是 helper implementation，不得改变 stage graph、golden path、generated surfaces 或 authority owner，也不得用整个 `src/` / `packages/` 根目录掩盖 generic runtime。
11. 设计 memory descriptor：只定义 locator、schema、owner 和访问规则，不写 memory body。
12. 设计 artifact morphology brief，先用 realistic target task 反推目标交付物形态，再固定：
   - native source format，例如 Markdown chapter tree、DOCX/PPTX editable source、notebook、dataset manifest、asset folder 或 domain-native schema。
   - artifact body owner，以及 `opl-meta-agent` / OPL 只能持有 refs、locator、manifest、receipt 或 assembler policy 的边界。
   - creative source refs 与 assembled/export refs 的区别；创作源必须是可审阅、可分片、可复制的 domain-native source，导出物只作为 build/export result。
   - sharding strategy；长书、长 deck、课程、报告集、图谱、数据包等必须按章节、页面、单元、asset、dataset split 或等价 domain unit 分片，不能把大体量开放式正文压成单文件创作源。
   - extent/scale contract；用户或 source 声明的章节数、页数、字数、图表数、资产数、任务范围或质量层级不能被 scaffold、suite 或脚本默认值静默降级。
   - asset custody/file-path policy；imagegen、外部图片、音视频、数据、模板和第三方素材必须有项目内可复制路径、manifest/provenance/license refs 和缺失时的 blocker，不得只保留聊天附件、临时 URL 或本机绝对路径。
   - thin assembler/helper boundary；Python/TS helper 只能读取 native source、manifest 和 asset paths 做装配、校验或导出，不能把书稿、长文、长 deck 正文或开放式创作内容塞进源码字符串。
   - realistic target task review；不得只看 scaffold/interface/Agent Lab shape，必须用至少一个真实领域任务样例检查产物结构能否承载目标交付。
13. 设计 artifact locator：只定义交付物 refs、package roots、receipts、provenance 和 morphology refs，不写 artifact body。
14. 对每个 stage 标注 owner split：target domain agent、`opl-meta-agent`、OPL Framework。
15. 检查所有 outputs 是否能被后续 stage 或 gate 消费，删掉不可消费的输出。

## 输出

必须输出单个 typed JSON closeout packet，`surface_kind="stage_attempt_closeout_packet"`，`stage_id="stage-decomposition"`，并包含 `stage_decomposition_pack_draft`。自由文本总结不能作为 closeout。

`stage_decomposition_pack_draft` 必须包含：

- `target_agent`：`domain_id`、`domain_label`、`delivery_domain`、`target_brief`、`profile_selection_mode`，以及内置 profile 路线中的 `selected_opl_profile_refs` / `profile_selection_rationale`。
- `stage_control_plane` 和每个 stage 必须保留 `profile_selection_mode`、`selected_profile_refs`、`profile_selection_receipt_ref`、`profile_requirements`；source-derived 路线还必须保留 `source_derived_design_receipt`、`reference_design_pattern_packet_refs`、非空 `ReferenceDesignPacket`、非空 `TransferMap`、非空 `AgentPackPlan`、非空 `DesignAdmissionReceipt`、`StageDecompositionSubpacketSet` 和物化后的 `AgentBuildReceipt` / `build_receipt`；research-driven 路线还必须保留 `research_driven_design_receipt`、`research_source_refs`、`expert_practice_notes`、`research_synthesis_refs`、非空 `ResearchSynthesisPacket`、非空 `TransferMap`、非空 `AgentPackPlan`、非空 `DesignAdmissionReceipt`、`StageDecompositionSubpacketSet` 和物化后的 `AgentBuildReceipt` / `build_receipt`；两条设计依据路线都必须保留 `transferable_pattern_requirements` 和 `capability_plan_requirements`。stage inputs/requires 必须引用 profile selection receipt、三类设计对象、DesignAdmissionReceipt 和 StageDecompositionSubpacketSet；AgentBuildReceipt 进入 expected receipt / readback，不作为物化前 input；每个 design-derived stage 必须一一对应 AgentPackPlan workflow step，并声明匹配的 `pattern_id`、`step_id`、`source_anchor_refs` 和 `stage_pattern_source_refs`。
- 若请求包含参考设计，`target_agent` 必须保留 `reference_design_source_refs`、`reference_design_pattern_notes` 和 `reference_design_pattern_packet_refs`；stage pack 必须把它们声明为 architecture inspiration，不作为 target truth、runtime dependency 或 owner verdict。
- `artifact_morphology_brief`：native source format、artifact body owner、creative source refs、assembled/export refs、sharding strategy、extent/scale contract、asset custody/file-path policy、thin assembler/helper boundary 和 realistic target task review refs。
- `implementation_profile`：`agent_identity=declarative_standard_agent_pack`、`pack_formats=[markdown,json]`、OPL generated-surface owner，以及零个或多个已经物理存在并通过审计的 helper implementation；新建 baseline 默认 entries 为空，未实现 helper need 进入 AgentPackPlan / work order。该 profile 不授权 generic runtime、CLI、workbench 或第二 Pack source。
- `action_catalog`：domain-owned action metadata、supported surfaces 和 no-forbidden-write authority boundary。
- `stage_control_plane`：完整 stage list，每个 stage 都带 `selected_executor=codex_cli`、prompt/skill/knowledge/quality gate refs、requires/ensures、expected receipt refs、independent gate policy 和 owner boundary。
- `files`：目标 repo 下真实 `agent/prompts`、`agent/stages`、`agent/skills`、`agent/knowledge`、`agent/quality_gates` Markdown 文件路径与正文。
- `no_forbidden_write_policy`：明确 OPL/OMA 不写 target truth、memory body、artifact body、quality/export verdict 或 default promotion。

## 质量门槛

- 每个 stage 至少声明 prompt、tools/action 或明确无动作原因、knowledge/memory refs、handoff、quality gate。
- 每个 stage 必须有 quality gate declaration；dedicated review stage 仅在专家判断、artifact/export mutation、domain truth movement、quality/export verdict 或 high-risk handoff 时必要。
- independent gate policy 必须禁止 execution attempt self-review、shared-context review、mechanical completion claim 和 provider-completion-as-domain-ready claim。
- action/stage metadata 可作为 CLI、MCP、Skill、product-entry、OpenAI tool 和 AI SDK surface 的唯一派生源。
- 没有 repo-owned generic scheduler、daemon、queue、attempt ledger、workbench 或 private wrapper。
- helper language 不参与 Agent membership；删除或换写 helper implementation 后，Agent identity、stage/prompt/skill/knowledge/quality-gate Pack、golden path 和 generated interface 保持不变。
- domain truth、memory body、artifact body、quality/export verdict 的 owner 没有漂移。
- artifact morphology brief 必须覆盖目标领域交付物的真实创作源、分片、体量、资产保管和装配边界；缺失 native source format、sharding strategy、extent/scale contract、asset custody/file-path policy 或 realistic target task review 时 fail closed。
- source-derived / research-driven 路线必须保留 `StageDecompositionSubpacketSet`，且 cognitive packet 顺序、materialization boundary 和 fail-closed checks 不得缺失或重排。
- stage 大小必须由 stage main prompt 和必要 professional skill 的 AI 判断决定；schema、validator 和 tests 只能守住 refs、顺序、权限和 fail-closed 边界。一个 top-level stage 不得混入多个独立开放判断；也不得把同一判断拆成只为满足流程存在的机械 stage。
- admission 必须 progress-first：可由有效设计对象确定推导的 format、projection、ref、requires、expected receipt 缺口应在 stage 内有界修正并继续物化；只有语义对象缺失、证据/来源缺失、owner 决策缺失、authority 越权、forbidden claim 或无法推导的缺口才成为 route-back / typed blocker / human gate。
- stage graph 不把推理路线、写作策略、评审标准或修订策略写死；这些开放式判断由 Codex executor 和独立 reviewer 承担。
- 每个 stage 都能声明 knowledge/tool/rubric gap blocker，避免为了通过 scaffold validation 生成空语义包。

## 禁止事项

- 禁止为兼容历史命名保留 alias/facade，除非合同中明确需要迁移桥。
- 禁止把文档路径或 Markdown 标题当作机器稳定接口。
- 禁止让测试固定叙述性文案。
- 禁止输出无法被 scaffold validation 或 Agent Lab suite 消费的 pack。
- 禁止把用户/source 声明的交付规模静默降级为 scaffold、sample、demo 或 placeholder。
- 禁止把书稿、长文、长 deck、开放式正文或大体量创作内容作为 Python/TS 字符串创作源。
- 禁止把缺少项目内可复制路径、manifest 或 provenance 的 imagegen/外部资产当成完成证据。
