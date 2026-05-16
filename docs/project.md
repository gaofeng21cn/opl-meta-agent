# opl-meta-agent

Owner: `opl-meta-agent`
Purpose: `opl_based_agent_builder_foundry_agent`
State: `self_learning_loop_smoke_passed`
Machine boundary: 本文是人读项目概览。机器真相归 `contracts/`、运行 receipts、OPL Agent Lab result refs 和未来 delivery receipts。

`opl-meta-agent` 是基于 OPL Framework 的独立 Foundry Agent。它面向“开发新的 OPL-compatible 高价值知识交付智能体”，交付物是达到 baseline 要求的 agent package / repo。

本仓持有 agent-building domain semantics：用户意图理解、公开经验调研、阶段拆解、agent skeleton / prompt / skill / contract 生成策略、Agent Lab suite 组织、baseline 验收、optimizer candidate 和在线学习审阅策略。

OPL Framework 持有通用 runtime、Agent Lab、queue、stage attempt ledger、provider receipt、observability、optimizer/RL transition refs、standard scaffold 和 promotion gate。

当前最小闭环是 `scripts/bootstrap-sample-agent.mjs`：`opl-meta-agent` 生成一个 `sample-brief-agent` baseline package，调用 OPL scaffold validate，生成 Agent Lab external suite，交给 `opl agent-lab run --suite` 运行，再把 suite result 转成 baseline delivery receipt 和 gated online-learning candidate refs。
