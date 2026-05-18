# OPL Boundary Policy

## 核心边界

`opl-meta-agent` 是 OPL-based Foundry Agent，持有 agent-building domain semantics。OPL Framework 持有 runtime/control-plane/generated-interface 能力。Target domain agent 持有自己的 truth、memory body、artifact authority 和 quality verdict。

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
