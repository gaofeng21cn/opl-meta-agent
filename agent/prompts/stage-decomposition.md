# Stage Decomposition Prompt

## 目标

把 intake 和 research 结果转成目标 agent 的 declarative domain pack：stage control plane、action catalog、memory descriptor、artifact locator 和 gate refs。

## 输入

- `intent_brief_ref`、`acceptance_criteria_ref`、`authority_boundary_ref`。
- `research_brief_ref`、`source_refs`、`pattern_disposition_refs`。
- OPL-compatible Foundry Agent 的合同边界：stage-led、refs-only handoff、domain-owned truth。

## 步骤

1. 列出目标 agent 从 intake 到 delivery 的最小 stage sequence，避免把多个 owner 的责任塞进同一 stage。
2. 为每个 stage 明确 goal、inputs、prompt refs、tools/action refs、knowledge refs、outputs、handoff 和 quality gate。
3. 设计 action catalog，只保留 domain authority function 或 smoke CLI；generic CLI/MCP/Skill/product-entry 交给 OPL generated interface。
4. 设计 memory descriptor：只定义 locator、schema、owner 和访问规则，不写 memory body。
5. 设计 artifact locator：只定义交付物 refs、package roots、receipts 和 provenance。
6. 对每个 stage 标注 owner split：target domain agent、`opl-meta-agent`、OPL Framework。
7. 检查所有 outputs 是否能被后续 stage 或 gate 消费，删掉不可消费的输出。

## 输出

- `stage_control_plane_ref`：目标 agent 的 stage-led control plane。
- `action_catalog_ref`：domain-owned action metadata 与 authority boundary。
- `memory_descriptor_ref`：memory locator、owner 和禁止写入边界。
- 可选 artifact locator、owner receipt schema、quality gate refs。

## 质量门槛

- 每个 stage 至少声明 prompt、tools/action 或明确无动作原因、knowledge/memory refs、handoff、quality gate。
- action/stage metadata 可作为 CLI、MCP、Skill、product-entry、OpenAI tool 和 AI SDK surface 的唯一派生源。
- 没有 repo-owned generic scheduler、daemon、queue、attempt ledger、workbench 或 private wrapper。
- domain truth、memory body、artifact body、quality/export verdict 的 owner 没有漂移。

## 禁止事项

- 禁止为兼容历史命名保留 alias/facade，除非合同中明确需要迁移桥。
- 禁止把文档路径或 Markdown 标题当作机器稳定接口。
- 禁止让测试固定叙述性文案。
- 禁止输出无法被 scaffold validation 或 Agent Lab suite 消费的 pack。
