# Skill: Agent Baseline Build

## 用途

当目标是从零生成一个可测试的 OPL-compatible agent baseline package 时，使用本 skill 调用 `build-agent-baseline` action 的领域流程。

## 输入

- `output_dir`
- `opl_bin`
- intent、stage、action、memory、artifact 和 quality gate refs。

## 流程

1. 准备 output workspace，确认不会写入 source checkout 的 runtime artifact。
2. 生成 candidate agent package 的标准目录和 contracts。
3. 写入 prompts、skills、stages、quality gates、knowledge policy。
4. 调用 OPL scaffold validation。
5. 调用 OPL generated interface projection。
6. 构造 Agent Lab baseline suite并运行。
7. 根据 gate 输出 delivery receipt 或 failure taxonomy。

## 输出

- `candidate_agent_package_ref`
- scaffold validation ref
- generated interface bundle ref
- baseline suite result ref
- delivery receipt or failure taxonomy ref

## 质量门槛

- package 可以在 clean output root 中重建。
- contract metadata 足以生成 CLI/MCP/Skill/product-entry/OpenAI/AI SDK surface。
- baseline delivery gate 通过前不签发交付。

## 禁止事项

- 禁止把 `output_dir` 内 smoke artifact 当作本仓长期源码。
- 禁止硬编码本机路径进目标 agent contracts。
- 禁止生成空 README 或占位标记作为 agent pack 内容。
