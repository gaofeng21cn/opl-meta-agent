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
- `profile_selection_mode`、可选 `selected_opl_profile_refs`、`profile_selection_rationale`、`profile_requirement_refs` 和 profile requirements；内置 profile / hybrid 路线必须来自 OPL `profiles select/inspect` readback，source-derived 路线必须来自 OPL selector 的 source-derived design receipt 和 reference design pattern packet refs。
- `research_brief_ref`、`source_refs`、`pattern_disposition_refs`、`reference_design_source_refs`、`reference_design_pattern_notes` 和 `reference_design_pattern_packet_refs`。
- OPL-compatible Foundry Agent 的合同边界：stage-led、refs-only handoff、domain-owned truth。
- 用户或 source 声明的目标交付物形态、体量、开放式正文范围、外部资产来源和真实目标任务样例；缺失时必须在 closeout 中写成 route-back / blocker，不能静默缩小交付物。

## 步骤

1. 列出目标 agent 从 intake 到 delivery 的最小 stage sequence，避免把多个 owner 的责任塞进同一 stage。
2. 让 Codex 先给出候选 stage graph 与反例：哪些 stage 太机械、哪些 stage 会限制 AI executor、哪些 stage 需要合并/拆分/删除。
3. 把 active profile selection mode 映射进 stage graph：内置 profile requirements 的 required stage archetypes 进入 stage_contract requires，reference pack / source freshness / provenance requirements 进入 knowledge refs，tool connector requirements 进入 tool refs，quality/evaluation requirements 进入 quality gate；source-derived design route 的 transferable pattern requirements 和 capability plan requirements 必须进入 stage graph、prompt/knowledge/quality gate 和 Agent Lab suite seed。
4. 若输入包含论文/PDF/repo/产品参考设计，优先消费由 source ingest / Codex extraction 产出的 pattern packet refs；没有 packet 时才记录短 pattern notes。两者都只作为架构灵感：输入结构化、route/mode selection、grounding sources、tool orchestration、rubric、validation design、handoff 和 failure taxonomy；拒绝复制外部 runtime、私有数据、领域事实或 promotion authority。
5. 为每个 stage 明确 goal、inputs、prompt refs、tools/action refs、knowledge refs、outputs、handoff 和 quality gate。
6. 对每个 stage 写清 AI executor autonomy：Codex 可在哪些范围内自主规划、调用工具、要求补充 source、route-back、重写策略。
7. 设计 action catalog，只保留 domain authority function 或 smoke CLI；generic CLI/MCP/Skill/product-entry 交给 OPL generated interface。
8. 设计 memory descriptor：只定义 locator、schema、owner 和访问规则，不写 memory body。
9. 设计 artifact morphology brief，先用 realistic target task 反推目标交付物形态，再固定：
   - native source format，例如 Markdown chapter tree、DOCX/PPTX editable source、notebook、dataset manifest、asset folder 或 domain-native schema。
   - artifact body owner，以及 `opl-meta-agent` / OPL 只能持有 refs、locator、manifest、receipt 或 assembler policy 的边界。
   - creative source refs 与 assembled/export refs 的区别；创作源必须是可审阅、可分片、可复制的 domain-native source，导出物只作为 build/export result。
   - sharding strategy；长书、长 deck、课程、报告集、图谱、数据包等必须按章节、页面、单元、asset、dataset split 或等价 domain unit 分片，不能把大体量开放式正文压成单文件创作源。
   - extent/scale contract；用户或 source 声明的章节数、页数、字数、图表数、资产数、任务范围或质量层级不能被 scaffold、suite 或脚本默认值静默降级。
   - asset custody/file-path policy；imagegen、外部图片、音视频、数据、模板和第三方素材必须有项目内可复制路径、manifest/provenance/license refs 和缺失时的 blocker，不得只保留聊天附件、临时 URL 或本机绝对路径。
   - thin assembler/helper boundary；Python/TS helper 只能读取 native source、manifest 和 asset paths 做装配、校验或导出，不能把书稿、长文、长 deck 正文或开放式创作内容塞进源码字符串。
   - realistic target task review；不得只看 scaffold/interface/Agent Lab shape，必须用至少一个真实领域任务样例检查产物结构能否承载目标交付。
10. 设计 artifact locator：只定义交付物 refs、package roots、receipts、provenance 和 morphology refs，不写 artifact body。
11. 对每个 stage 标注 owner split：target domain agent、`opl-meta-agent`、OPL Framework。
12. 检查所有 outputs 是否能被后续 stage 或 gate 消费，删掉不可消费的输出。

## 输出

必须输出单个 typed JSON closeout packet，`surface_kind="stage_attempt_closeout_packet"`，`stage_id="stage-decomposition"`，并包含 `stage_decomposition_pack_draft`。自由文本总结不能作为 closeout。

`stage_decomposition_pack_draft` 必须包含：

- `target_agent`：`domain_id`、`domain_label`、`delivery_domain`、`target_brief`、`profile_selection_mode`，以及内置 profile 路线中的 `selected_opl_profile_refs` / `profile_selection_rationale`。
- `stage_control_plane` 和每个 stage 必须保留 `profile_selection_mode`、`selected_profile_refs`、`profile_selection_receipt_ref`、`profile_requirements`；source-derived 路线还必须保留 `source_derived_design_receipt`、`reference_design_pattern_packet_refs`、`transferable_pattern_requirements` 和 `capability_plan_requirements`。stage inputs/requires 必须引用 profile selection receipt。
- 若请求包含参考设计，`target_agent` 必须保留 `reference_design_source_refs`、`reference_design_pattern_notes` 和 `reference_design_pattern_packet_refs`；stage pack 必须把它们声明为 architecture inspiration，不作为 target truth、runtime dependency 或 owner verdict。
- `artifact_morphology_brief`：native source format、artifact body owner、creative source refs、assembled/export refs、sharding strategy、extent/scale contract、asset custody/file-path policy、thin assembler/helper boundary 和 realistic target task review refs。
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
- domain truth、memory body、artifact body、quality/export verdict 的 owner 没有漂移。
- artifact morphology brief 必须覆盖目标领域交付物的真实创作源、分片、体量、资产保管和装配边界；缺失 native source format、sharding strategy、extent/scale contract、asset custody/file-path policy 或 realistic target task review 时 fail closed。
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
