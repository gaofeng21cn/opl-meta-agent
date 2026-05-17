# opl-meta-agent

Owner: `opl-meta-agent`
Purpose: `opl_based_agent_builder_foundry_agent`
State: `self_learning_mechanism_patch_smoke_passed`
Machine boundary: 本文是人读项目概览。机器真相归 `contracts/`、运行 receipts、OPL Agent Lab result refs 和未来 delivery receipts。

`opl-meta-agent` 是基于 OPL Framework 的独立 Foundry Agent。它面向“开发新的 OPL-compatible 高价值知识交付智能体”，交付物是达到 baseline 要求的 agent package / repo。

本仓持有 agent-building domain semantics：用户意图理解、公开经验调研、阶段拆解、agent skeleton / prompt / skill / contract 生成策略、Agent Lab suite 组织、baseline 验收、optimizer candidate、在线学习审阅策略和 mechanism patch proposal 记录。

OPL Framework 持有通用 runtime、Agent Lab、queue、stage attempt ledger、provider receipt、observability、optimizer/RL transition refs、standard scaffold 和 promotion gate。

CLI、MCP、Skill、product-entry 和 tool 描述不是本仓私有实现；它们由 OPL Framework 从本仓标准 action / stage contracts 统一生成。本仓只保留智能体构建语义、refs-only Agent Lab suite 组织和 minimal authority outputs。

当前最小闭环是 `scripts/bootstrap-sample-agent.mjs`：`opl-meta-agent` 生成一个 `sample-brief-agent` baseline package，补齐最小 action / stage domain pack，调用 OPL scaffold validate 和 `opl agents interfaces --repo-dir`，生成 Agent Lab external suite，交给 `opl agent-lab run --suite` 运行，再把 suite result 转成 baseline delivery receipt、gated online-learning candidate refs 和 mechanism patch proposal refs。

Mechanism patch proposal 记录 `mechanism_ref/version`、`editable_surfaces`、`observe/diagnose/edit`、`segment_run_ref`、`evidence_delta_ref` 与 `next_mechanism_candidate_ref`。它只表达可进入 gate 的机制补丁建议，不写 target truth、memory body、artifact body、quality verdict，也不无 gate promote default agent。
