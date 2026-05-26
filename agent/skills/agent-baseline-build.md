# Skill: Agent Baseline Build

## 用途

当用户用自然语言要求“做一个新的智能体”“把某个高价值知识交付流程沉淀成 OPL-compatible agent”时，使用本 skill 调用 `build-agent-baseline` action 的领域流程。用户不需要直接提供 CLI 参数；Codex 先把用户话语归一成目标 agent 字段，再调用同一个 action。

## 输入

- `output_dir`
- `opl_bin`
- `ai_reviewer_evaluation`
- `domain_id`
- `domain_label`
- `delivery_domain`
- `target_brief`
- intent、stage、action、memory、artifact 和 quality gate refs。

`domain_id`、`domain_label`、`delivery_domain` 和 `target_brief` 来自用户自然语言需求。只有目标 agent 的交付物、authority boundary 或质量门槛不清时才回问；不要要求用户理解底层脚本参数。

## 流程

1. 准备 output workspace，确认不会写入 source checkout 的 runtime artifact。
2. 从自然语言目标生成稳定的 target-agent descriptor 字段和 candidate agent package 路径。
3. 生成 candidate agent package 的标准目录和 contracts。
4. 写入 prompts、skills、stages、quality gates、knowledge policy。
5. 调用 OPL scaffold validation。
6. 调用 OPL generated interface projection。
7. 构造 Agent Lab baseline suite 并运行。
8. 根据 gate 输出 delivery receipt 或 failure taxonomy。

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
