# Skill: OPL Meta Agent Domain Skill

## 用途

当用户要把一个高价值知识交付流程做成 OPL-compatible Foundry Agent 时，使用本 skill 驱动从 intent intake 到 baseline delivery 的完整 domain pack 构建。面向 Codex 的默认入口是用户自然语言，例如“帮我做一个能交付 X 的智能体”；本 skill 负责把自然语言归一成 `build-agent-baseline` 的目标 agent 字段。

## 输入

- 目标 agent 的领域、交付物、质量门槛和禁止事项。
- 可选已有 workflow、repo、文档、公开参考或失败样例。
- OPL binary locator 和输出 workspace locator。
- 由 Codex 从用户话语抽取的 `domain_id`、`domain_label`、`delivery_domain` 和 `target_brief`。

## 流程

1. 执行 `intent-intake`，冻结目标、边界和 acceptance criteria，并把自然语言需求归一为 target-agent descriptor 字段。
2. 执行 `web-experience-research`，只吸收可迁移模式。
3. 执行 `stage-decomposition`，生成 stage/action/memory/artifact/gate pack。
4. 执行 `agent-skeleton-build`，生成 candidate package 并跑 scaffold/interface validation。
5. 执行 `eval-suite-build` 和 `baseline-run`，获得 Agent Lab evidence。
6. 通过 `baseline-delivery` gate 后签发 package/runbook/receipt。

## 输出

- OPL-compatible agent package refs。
- stage/action/memory/artifact/gate refs。
- baseline delivery receipt refs。
- 后续 optimizer 或 online-learning candidate refs。

## 质量门槛

- 用户自然语言能追溯到 `target_brief`；字段缺失时只回问会改变交付物或 owner boundary 的问题。
- 所有 stage 都有 prompt、tools/action、knowledge、handoff 和 gate。
- generated interfaces 从 contracts 派生，不新增私有 wrapper。
- domain truth、memory body、artifact body、quality verdict owner 明确。

## 禁止事项

- 禁止把本 skill 用作 generic runtime。
- 禁止替目标 domain owner 写最终事实或质量裁决。
- 禁止跳过 Agent Lab baseline evidence 直接交付。
