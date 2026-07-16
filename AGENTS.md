# OPL Meta Agent

本仓是 OPL Framework 的 Agent engineering 语义 provider。统一身份为 `agent_id/package_id=oma`、`domain_id=agent_engineering`、`carrier_slug=opl-meta-agent`。

- OMA 只拥有目标理解、设计依据、`AgentBlueprint`、`EvalSpec`、证据诊断和 `EvolutionProposal`。
- OPL Framework 是 `FoundryRun`、物化、评测、证据、版本、canary、激活和回滚的唯一 owner。
- OMA 唯一公开 action 是 `engineer-agent`；`design|diagnose` 仅供 OPL Foundry Kernel 内部调用。
- OMA 不得输出 repo 路径、命令、队列/租约/attempt、文件 patch、执行工单、晋级记录或保护测试正文。
- 机器真相位于 `contracts/`、`agent/` 与验证输出；默认验证入口为 `scripts/verify.sh`。

<!-- CODEGRAPH_START -->
## CodeGraph

- 本仓库使用本地 `.codegraph/` 索引；该目录不得纳入 Git。
- 定义、调用、影响范围和代码路径等结构检索优先使用 CodeGraph；字面文本检索使用 `rg`。
- 索引缺失或过期时运行 `codegraph init .` 或 `codegraph sync .`。
<!-- CODEGRAPH_END -->
