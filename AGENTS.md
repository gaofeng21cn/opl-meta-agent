# opl-meta-agent 仓库协作规范

你始终用中文回复。

## 定位

`opl-meta-agent` 是基于 OPL Framework 的独立 Foundry Agent，面向“开发新的 OPL-compatible 高价值知识交付智能体”。

用户级 `~/.codex/TASTE.md` 记录 OPL family 共享维护开发偏好；进行架构、代码、文档、测试、review、cleanup 和 closeout 判断时，先按用户级 taste 校准，再读取本仓事实、contracts、docs 与源码。

本仓持有 agent-building domain semantics：用户意图理解、公开经验调研、阶段拆解、agent skeleton / contracts / prompt / skill / quality gate 生成策略、baseline 验收、optimizer candidate 组织和在线学习审阅策略。

OPL Framework 持有通用 runtime、Agent Lab、queue、stage attempt ledger、provider receipt、observability、optimizer/RL transition refs、scaffold generator、generated interface bundle 和 promotion gate。`opl-meta-agent` 只消费这些能力，不在本仓实现第二套 generic runtime 或私有通用入口包装层。

`agent/primary_skill/SKILL.md` 是标准 OPL Agent 的 canonical rich primary skill；`plugins/<agent>/skills/<agent>/SKILL.md` 是 Codex plugin 安装要求的 materialized full-skill carrier mirror。该关系以 `contracts/capability_map.json` 中的 `carrier_projection_contract` 为机器权威；两者字节相同表示同步健康，不表示应删除重复，mirror 漂移才是问题。

OPL canonical id 固定为 `oma`；`opl-meta-agent`、包名和 plugin slug 只作为 repo/package/carrier locator，不改变 domain canonical id。

## Skill 目录语义

- `agent/skills/*.md` 是 OMA domain skill declarations：供 `agent/stages/manifest.json`、OPL generated surface、stage prompt 或 domain action flow 引用。它不是 Codex-style 专业方法 Skill 目录。
- `agent/professional_skills/<skill-id>/SKILL.md` 是 OMA repo-local Codex-style 专业方法 Skill：供 stage prompt 按需路由 intent architecture、external pattern research、stage-pack architecture、Agent Lab suite design、takeover review、work-order authoring、agent evolution 和 trajectory learning 等开放式专家判断。
- 不要为了“统一目录”把 `agent/professional_skills/*/SKILL.md` 降成 `agent/skills/*.md`，除非同时有明确的 OPL generated Skill surface、capability map source/projection 更新、Codex discovery 等价证据和 no-authority 边界说明。
- `method_skill` / `professional_skill` 是能力语义；`SKILL.md` 目录是 Codex discovery 物理形态。OMA 可以把专业方法能力标为 `method_skill`，但不应牺牲一等 Skill source 形态。

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
scripts/verify.sh
```

`npm test` / `npm run test:smoke` 是默认轻量合同与 source-purity 入口；`npm run test:behavior` 覆盖 bootstrap、external-suite、work-order、owner-chain 等 fixture-oracle/behavior tests；`npm run test:full` 是完整 Node test suite。`scripts/verify.sh cleanup` 才执行 repo hygiene fix，默认验证只检查不删除本地 ignored 产物。

<!-- OPL_FLOW_MANAGED_START -->
OPL Flow managed surface: repo_agent_instructions
Plugin: opl-flow
Plugin version: 0.1.7
Profile pointer: contracts/opl-native-profile.json
本块只声明 OPL Flow 工作流 profile 指针；repo-specific 规则、项目事实、contracts、source、tests 和 runtime 输出继续归本仓既有 owner。
请只通过 OPL Flow repo_profile sync 更新本块；本块外内容由目标 repo 自己维护。
<!-- OPL_FLOW_MANAGED_END -->

<!-- CODEGRAPH_START -->
## CodeGraph

- 本仓库使用本地 `.codegraph/` 索引；该目录不得纳入 Git。
- 定义、调用、影响范围和代码路径等结构检索优先使用 CodeGraph；字面文本检索使用 `rg`。
- 索引缺失或过期时运行 `codegraph init .` 或 `codegraph sync .`。
<!-- CODEGRAPH_END -->
