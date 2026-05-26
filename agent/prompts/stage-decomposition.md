# Stage Decomposition Prompt

## 目标

把 intake 和 research 结果转成目标 agent 的 declarative domain pack：stage control plane、action catalog、memory descriptor、artifact locator 和 gate refs。

## 输入

- `intent_brief_ref`、`acceptance_criteria_ref`、`authority_boundary_ref`。
- `research_brief_ref`、`source_refs`、`pattern_disposition_refs`。
- OPL-compatible Foundry Agent 的合同边界：stage-led、refs-only handoff、domain-owned truth。

## 步骤

1. 列出目标 agent 从 intake 到 delivery 的最小 stage sequence，避免把多个 owner 的责任塞进同一 stage。
2. 让 Codex 先给出候选 stage graph 与反例：哪些 stage 太机械、哪些 stage 会限制 AI executor、哪些 stage 需要合并/拆分/删除。
3. 为每个 stage 明确 goal、inputs、prompt refs、tools/action refs、knowledge refs、outputs、handoff 和 quality gate。
4. 对每个 stage 写清 AI executor autonomy：Codex 可在哪些范围内自主规划、调用工具、要求补充 source、route-back、重写策略。
5. 设计 action catalog，只保留 domain authority function 或 smoke CLI；generic CLI/MCP/Skill/product-entry 交给 OPL generated interface。
6. 设计 memory descriptor：只定义 locator、schema、owner 和访问规则，不写 memory body。
7. 设计 artifact locator：只定义交付物 refs、package roots、receipts 和 provenance。
8. 对每个 stage 标注 owner split：target domain agent、`opl-meta-agent`、OPL Framework。
9. 检查所有 outputs 是否能被后续 stage 或 gate 消费，删掉不可消费的输出。

## 输出

必须输出单个 typed JSON closeout packet，`surface_kind="stage_attempt_closeout_packet"`，`stage_id="stage-decomposition"`，并包含 `stage_decomposition_pack_draft`。自由文本总结不能作为 closeout。

`stage_decomposition_pack_draft` 必须包含：

- `target_agent`：`domain_id`、`domain_label`、`delivery_domain`、`target_brief`。
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
- stage graph 不把推理路线、写作策略、评审标准或修订策略写死；这些开放式判断由 Codex executor 和独立 reviewer 承担。
- 每个 stage 都能声明 knowledge/tool/rubric gap blocker，避免为了通过 scaffold validation 生成空语义包。

## 禁止事项

- 禁止为兼容历史命名保留 alias/facade，除非合同中明确需要迁移桥。
- 禁止把文档路径或 Markdown 标题当作机器稳定接口。
- 禁止让测试固定叙述性文案。
- 禁止输出无法被 scaffold validation 或 Agent Lab suite 消费的 pack。
