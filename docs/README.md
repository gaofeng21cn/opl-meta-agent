# opl-meta-agent 文档索引

Owner: `opl-meta-agent`
Purpose: `docs_entry_index`
State: `active_index`
Machine boundary: 本文是人读文档入口。机器真相继续归 `contracts/`、`agent/`、`runtime/authority_functions/`、CLI/API 行为、OPL Agent Lab result refs、work-order receipts 和测试。

这个目录是 `opl-meta-agent` 的开发与维护文档入口。仓库首页说明公开角色；本索引只负责导航当前 truth、架构、约束、决策、目标态、差距、私有实现迁移台账和历史过程。文档生命周期、目录职责、inventory 和 reopening conditions 的 SSOT 是 [文档组合治理](./docs_portfolio_consolidation.md)。

## 先读这里

| 需求 | 入口 |
| --- | --- |
| 项目定位与当前角色 | [项目概览](./project.md) |
| 当前能力、已落地面和未完成证据 | [当前状态](./status.md) |
| Owner split、Agent Lab / OMA / target agent 边界 | [架构](./architecture.md) |
| 不可破坏的 authority 与 generated-surface 边界 | [硬约束](./invariants.md) |
| 仍有效的设计决策 | [决策记录](./decisions.md) |
| 目标态 | [opl-meta-agent 理想目标态](./references/opl-meta-agent-ideal-state.md) |
| 当前差距与完善顺序 | [opl-meta-agent 理想目标态差距与完善计划](./active/opl-meta-agent-ideal-state-gap-plan.md) |
| 私有实现迁移台账 | [opl-meta-agent 私有实现与 OPL 迁移台账](./active/opl-private-implementation-migration-inventory.md) |
| 文档生命周期与唯一职责 | [文档组合治理](./docs_portfolio_consolidation.md) |
| 历史过程与 provenance | [历史索引](./history/README.md) |

## OPL 系列分层

`opl-meta-agent` 是 OPL-compatible Foundry Agent，用于开发新的 OPL-compatible 高价值知识交付智能体。它不是 OPL Framework 内置模块，也不是 MAS/MAG/RCA 这类当前 active domain truth owner。

OPL Framework 持有通用 runtime、Agent Lab、queue、stage attempt ledger、provider receipt、observability、generated interface bundle、work-order execute primitive、absorb/cleanup 和 promotion gate。`opl-meta-agent` 只持有 agent-building semantics、目标 agent handoff 消费、developer work order / mechanism proposal / typed blocker materialization，以及最小 authority refs。

MAS、MAG、RCA 等目标 agent 只应作为 target-agent refs、owner routes、fixtures、receipt refs 或 provenance 出现在本仓文档中；不能成为 OMA 顶层设计中心，也不能让 OMA 写 target-domain truth、memory body、artifact body、quality/export verdict 或 owner receipt body。

## 文档规则

- `README*` 与 `docs/**` 是人读材料；机器消费者应读取 contracts、source、tests、CLI/API 行为或语义化 refs。
- 长期文档必须能说明 owner、purpose、state 和 machine boundary。
- Active 文档只保留当前计划、差距和迁移门；过程 proof、dated closeout 和历史路线应进入 history/provenance 语境后再保留。
- Lifecycle role map、inventory、目录职责和 reopening conditions 只在 [文档组合治理](./docs_portfolio_consolidation.md) 维护；本索引不复制目录 taxonomy 或 dated coverage ledger。
- Generated interface readiness、suite pass、schema completeness、App projection readiness、work-order shape 或 refs-only scaleout closeout 不能写成 target domain ready、quality verdict、artifact readiness、owner receipt body 或 default promotion。
