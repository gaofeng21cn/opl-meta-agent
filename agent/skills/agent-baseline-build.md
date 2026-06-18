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
- stage-decomposition runner settings or explicit `stage_decomposition_closeout`
- intent、stage、action、memory、artifact 和 quality gate refs。

`domain_id`、`domain_label`、`delivery_domain` 和 `target_brief` 来自用户自然语言需求。只有目标 agent 的交付物、authority boundary 或质量门槛不清时才回问；不要要求用户理解底层脚本参数。
`stage_decomposition_closeout` 必须是 Codex `stage-decomposition` typed closeout；如果未显式提供，默认 runner 仍必须产出 typed closeout，不能从自由文本摘要推断 stage graph。

## 流程

1. 准备 output workspace，确认不会写入 source checkout 的 runtime artifact。
2. 从自然语言目标生成稳定的 target-agent descriptor 字段和 candidate agent package 路径。
3. 启动或读取 `stage-decomposition` typed closeout，从其中的 stage graph、action refs、pack file bodies、independent gate policy 和 quality gate declaration 生成 candidate agent package 的标准目录和 contracts。
4. 写入 prompts、skills、stages、quality gates、knowledge policy，并保留 generated-from-closeout proof。
5. 调用 OPL scaffold validation。
6. 调用 OPL generated interface projection。
7. 构造 Agent Lab baseline suite 并运行。
8. 对已生成的 target agent repo 运行 OMA takeover / Agent Lab external suite，生成 takeover receipt、online learning candidate 和 mechanism patch proposal。
9. 消费结构化 independent AI reviewer evaluation，运行 `improve:external-suite` 或等价 action，把 reviewer evidence、Agent Lab result 和 target-agent source refs 转成 external-suite self-evolution receipt、target capability candidate、developer patch work order 或 typed blocker。
10. 若 external-suite / reviewer evidence 暴露可修复缺口，执行 owner-gated improvement loop 并重新跑目标 repo 验证和 Agent Lab re-evaluation；若无 source patch required，也必须记录 no-patch work order / coordination receipt。
11. 根据 gate 输出 delivery receipt、no-patch coordination receipt、developer work order 或 typed blocker。

## 输出

- `candidate_agent_package_ref`
- scaffold validation ref
- generated interface bundle ref
- baseline suite result ref
- takeover suite result ref
- takeover receipt ref
- structured AI reviewer evaluation ref
- external-suite self-evolution receipt ref
- target capability candidate ref
- developer patch work order or typed blocker ref
- delivery receipt, no-patch coordination receipt, or failure taxonomy ref

## 质量门槛

- package 可以在 clean output root 中重建。
- contract metadata 足以生成 CLI/MCP/Skill/product-entry/OpenAI/AI SDK surface。
- stage graph 和 action catalog 来自 typed closeout，而不是脚本内固定 graph。
- free text closeout、partial refs、缺 independent gate policy、缺 quality gate declaration 或 self-review 必须 fail closed。
- baseline delivery gate 通过前不签发交付。
- 新建智能体交付必须包含 Agent Lab takeover / external suite evidence 和 independent AI reviewer evidence；只跑 scaffold validation、generated interface projection 或 baseline suite 不足以完成交付。
- external-suite self-evolution 若返回 developer work order，必须执行或明确转交 owner gate；若返回 no-patch coordination record，必须保留 receipt 和 re-evaluation refs。

## 禁止事项

- 禁止把 `output_dir` 内 smoke artifact 当作本仓长期源码。
- 禁止硬编码本机路径进目标 agent contracts。
- 禁止生成空 README 或占位标记作为 agent pack 内容。
