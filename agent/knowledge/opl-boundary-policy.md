# OPL Boundary Policy

## 核心边界

`opl-meta-agent` 是 OPL-based Foundry Agent，持有 agent-building domain semantics。OPL Framework 持有 runtime/control-plane/generated-interface 能力。Target domain agent 持有自己的 truth、memory body、artifact authority 和 quality verdict。

## Codex-first 原则

`opl-meta-agent` 的默认执行假设是 executor-first / Codex-first：最强 AI executor 负责开放式专家判断、问题重构、反例搜索、工具与知识缺口识别、路线取舍和修订策略。OPL 合同只固定 owner boundary、权限、安全、receipt、阻塞、恢复、projection 和 fail-closed 条件，不把这些智能行为写成固定评分器或脚本后处理。

每个 stage 都应给 Codex 留出足够的专家作业空间：允许它提出更好的 stage 切分、替换不合适的工具、要求补充知识源、指出目标 agent 不该做的事，并把证据缺口转成 blocker 或 route-back。程序只能检查 ref、schema、权限和证据存在性；不能把 checklist、scorecard pass、contract completeness 或单次 suite pass 升级为质量 verdict。

## 本仓可以做

- 生成目标 agent 的 domain pack。
- 组织 Agent Lab suite、scorecard、recovery probe 和 promotion gate。
- 生成 baseline delivery receipt、takeover receipt、developer patch work order 和 mechanism patch proposal。
- 在 target owner gate 允许时修改 target agent source/tests/docs。

## 本仓不能做

- 实现第二套 generic runtime、queue、scheduler、daemon、attempt ledger 或 workbench。
- 拥有私有 CLI/MCP/Skill/product-entry wrapper。
- 写 target domain truth、memory body、artifact body 或 quality verdict。
- 无 gate promote default agent。
- 训练或部署模型权重。

## 应用规则

所有 prompt、stage、skill 和 gate 都必须先声明 owner split，再声明可写面。发现边界不清时，输出 blocker ref，不继续包装成成功 receipt。

质量、设计方向、机制采用和 agent 能力提升必须由独立 AI reviewer 或 owner gate 基于直接证据判断。执行 attempt 与 reviewer attempt 必须分离；若缺少 reviewer critique、source refs、provenance 或 no-shared-context 证据，则只能产出 typed blocker 或 review_pending candidate。
