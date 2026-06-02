# opl-meta-agent 仓库协作规范

你始终用中文回复。

## 定位

`opl-meta-agent` 是基于 OPL Framework 的独立 Foundry Agent，面向“开发新的 OPL-compatible 高价值知识交付智能体”。

根层 `TASTE.md` 记录 OPL family 共享维护开发偏好；进行架构、代码、文档、测试、review、cleanup 和 closeout 判断时，先按 `TASTE.md` 校准 taste，再读取本仓事实、contracts、docs 与源码。

本仓持有 agent-building domain semantics：用户意图理解、公开经验调研、阶段拆解、agent skeleton / contracts / prompt / skill / quality gate 生成策略、baseline 验收、optimizer candidate 组织和在线学习审阅策略。

OPL Framework 持有通用 runtime、Agent Lab、queue、stage attempt ledger、provider receipt、observability、optimizer/RL transition refs、scaffold generator、generated interface bundle 和 promotion gate。`opl-meta-agent` 只消费这些能力，不在本仓实现第二套 generic runtime 或私有通用入口包装层。

## 边界

- 不把 `opl-meta-agent` 写成 OPL Framework 内置模块。
- 不在本仓实现 generic scheduler、daemon、queue、attempt ledger、generic transition runner、memory transport、artifact lifecycle shell、operator workbench 或 observability backend。
- 不在本仓实现 repo-owned generic CLI、MCP、Skill、product-entry、sidecar、status 或 workbench wrapper；统一接口由 OPL Framework 从标准合同生成或托管。
- 不训练或部署模型权重。
- 不无 gate 修改默认 agent 配置。
- 不替目标 domain owner 写 truth、memory body、artifact body、quality verdict 或 export verdict。

## 文档

- `docs/project.md`：项目定位。
- `docs/architecture.md`：边界与依赖。
- `docs/status.md`：当前状态。
- `docs/invariants.md`：硬约束。
- `docs/decisions.md`：有效决策。

## 验证

默认验证入口：

```bash
npm run typecheck
npm test
```

<!-- OPL_FLOW_MANAGED_START -->
OPL Flow managed surface: repo_agent_instructions
Plugin: opl-flow
Plugin version: 0.1.0
Profile pointer: contracts/opl-native-profile.json
本块只声明 OPL Flow 工作流 profile 指针；repo-specific 规则、项目事实、contracts、source、tests 和 runtime 输出继续归本仓既有 owner。
请只通过 OPL Flow repo_profile sync 更新本块；本块外内容由目标 repo 自己维护。
<!-- OPL_FLOW_MANAGED_END -->
