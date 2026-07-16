# OPL Meta Agent

OPL Meta Agent（OMA）是 OPL-compatible 智能体的语义工程 provider。

OMA 负责目标理解、设计依据、`AgentBlueprint`、内嵌 `EvalSpec`、证据诊断和 `EvolutionProposal`。OPL Foundry Kernel 独占运行状态、确定性物化、独立评测、证据持久化、版本、canary、激活和回滚。

OMA 唯一公开 action 是 `engineer-agent`，统一承载 `create`、`takeover` 和 `improve` 三种模式：

```bash
opl agents run --domain oma --action engineer-agent --workspace /absolute/workspace --payload-file request.json
```

`design` 与 `diagnose` 是 OPL 内部调用的 provider operation，不投影为公开命令或工具。OMA 只返回协议对象，不返回执行指令、文件 patch、保护测试正文或发布决策。

机器真相位于 [`contracts/`](./contracts/) 与 [`agent/`](./agent/)。完整验证：

```bash
scripts/verify.sh full
```

架构与边界见 [`docs/architecture.md`](./docs/architecture.md)、[`docs/invariants.md`](./docs/invariants.md) 和 [`docs/decisions.md`](./docs/decisions.md)。
