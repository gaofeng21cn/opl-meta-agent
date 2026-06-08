# opl-meta-agent 文档组合治理

Owner: `opl-meta-agent`
Purpose: `docs_lifecycle_governance`
State: `active_support`
Machine boundary: 本文是人读治理入口和 lifecycle role map。当前机器真相继续归 `contracts/`、`agent/`、`runtime/authority_functions/`、source、CLI/API 行为、OPL Agent Lab result refs、developer work-order receipts、owner receipts、candidate refs 和 tests。

## 当前结论

`opl-meta-agent` 采用轻量 OPL-compatible repo 文档形态：root `README*` 和 `docs/` 核心文档持有当前入口、项目事实、架构、硬约束、决策、目标态、active gap plan 与私有实现迁移台账。`agent/*/README.md` 是 domain pack 支撑索引，不作为 machine-required pack path；机器 pack 真相由 `contracts/pack_compiler_input.json`、`contracts/stage_control_plane.json`、`agent/` 真实文件和 tests 验证。

当前 single Active Truth owner 是 `docs/active/opl-meta-agent-ideal-state-gap-plan.md`。North-star 目标态只读 `docs/references/opl-meta-agent-ideal-state.md`；私有实现、script hygiene、default-caller tail 和 OPL 上收边界只读 `docs/active/opl-private-implementation-migration-inventory.md`；核心当前事实继续回到 `docs/project.md`、`docs/status.md`、`docs/architecture.md`、`docs/invariants.md` 和 `docs/decisions.md`。

本仓暂不为了空目录对齐创建 `public/product/runtime/delivery/source/policies/specs` 目录。`docs/history/` 只承接已经从 active paths 移出的 process/provenance ledger，不承担当前 truth。未来出现长期 public、product、runtime、delivery、source、policy 或 spec 材料时，先判断唯一 owner、purpose、state 和 machine boundary，再按 OPL-family canonical taxonomy 增加对应目录和索引。

## Lifecycle Roles

| Path | Role | State | Machine boundary |
| --- | --- | --- | --- |
| `README.md`, `README.zh-CN.md` | 公开 / 双语仓库入口，解释 OMA 是 agent-building Foundry Agent | `public_entry` | 不作为 generated interface、runtime、Agent Lab 或 App owner。 |
| `docs/README.md` | docs entry index and reading order | `active_index` | 只导航，不持有独立 truth。 |
| `docs/project.md` | 项目角色和 domain owner 说明 | `active_truth` | 不替代 contracts、agent pack 或 runtime receipts。 |
| `docs/status.md` | 当前状态、已落地边界和 evidence tail 摘要 | `active_truth` | 不冻结动态 counts、receipt ids 或 dated process logs。 |
| `docs/architecture.md` | owner split、Agent Lab / OMA / target agent 边界 | `active_truth` | 不声明 production ready、quality verdict 或 App live rendering。 |
| `docs/invariants.md` | 禁止破坏的 authority / generated surface / script-purity 边界 | `active_truth` | 行为 truth 仍由 contracts/source/tests 验证。 |
| `docs/decisions.md` | 仍有效的设计决策 | `active_truth_with_history_notes` | 只保 durable decisions，不保存过程流水。 |
| `docs/active/opl-meta-agent-ideal-state-gap-plan.md` | single Active Truth owner：完成口径、gap、近期计划和下一轮 prompt | `active_plan` | 不保存 dated process log；不把 proof 升级为 readiness。 |
| `docs/active/opl-private-implementation-migration-inventory.md` | 私有实现分类、script hygiene、上收候选和退役门 | `active_inventory` | 不能把 scripts/materializers 写成 generic runtime、Agent Lab runner、promotion gate、workbench 或 target truth writer。 |
| `docs/references/opl-meta-agent-ideal-state.md` | north-star / target-state reference | `active_support` | 当前状态和完成顺序回到 active plan。 |
| `docs/docs_portfolio_consolidation.md` | 本 lifecycle map 和 reopening conditions | `active_support` | 不作为 machine evidence ledger。 |
| `docs/history/README.md`, `docs/history/process/README.md` | history / process archive indexes | `historical_archive_index` | 不作为当前 readiness、production ready、default promotion 或 owner receipt 证据。 |
| `docs/history/process/README.md`, `docs/history/process/retired-surface-provenance.md` | 压缩后的 process archive index 与 retired-surface provenance | `historical_archive_index` / `historical_provenance` | 不保留逐日 closeout 长清单；当前 truth 回到 active/core docs、contracts、source 和 tests。 |
| `agent/*/README.md` | domain pack 支撑索引 | `active_support` | 真实 pack required paths 由 contracts/tests 验证；README 不作为 machine-required pack path。 |

## Current Human-Doc Inventory

| Group | Paths |
| --- | --- |
| Root entries | `README.md`, `README.zh-CN.md` |
| Docs index/current truth | `docs/README.md`, `docs/project.md`, `docs/status.md`, `docs/architecture.md`, `docs/invariants.md`, `docs/decisions.md` |
| Active/support owner docs | `docs/active/opl-meta-agent-ideal-state-gap-plan.md`, `docs/active/opl-private-implementation-migration-inventory.md`, `docs/references/opl-meta-agent-ideal-state.md`, `docs/docs_portfolio_consolidation.md` |
| History / provenance | `docs/history/README.md`, `docs/history/process/README.md`, `docs/history/process/retired-surface-provenance.md` |
| Agent pack support indexes | `agent/knowledge/README.md`, `agent/prompts/README.md`, `agent/quality_gates/README.md`, `agent/skills/README.md`, `agent/stages/README.md` |

## Rules

- `README*` 与 `docs/**` 是人读材料；机器消费者读取 contracts、source、tests、CLI/API 行为或语义化 refs。
- Generated interface readiness、registry readiness、App projection readiness、suite pass、schema completeness、contract completeness、work-order shape、source-shape conformance 或 OPL refs-only consumption 不能写成 target domain ready、quality verdict、artifact readiness、owner receipt、App live rendering、production ready 或 default promotion。
- Agent Lab / OMA 是 standard target-agent consumer，不是 MAS/MAG/RCA 的专用兼容层。目标 agent 名称只可作为 target refs、owner routes、fixtures、receipt refs 或 provenance 出现。
- Active docs 只保留当前计划、差距、迁移门和 durable status。过程 proof、dated closeout、历史路线和 coverage tranche 只允许压缩成 `docs/history/process/README.md`、`docs/history/process/retired-surface-provenance.md`、OPL family ledger、machine receipts 或 git history。
- `docs/docs_portfolio_consolidation.md` 不再追加 dated coverage ledger。未来 coverage/run records 应先压缩为主题级 process/provenance；durable conclusions 必须折回 active gap plan、private implementation inventory、核心 docs、contracts、source 或 tests。
- `contracts/functional_privatization_audit.json` 和 `contracts/default_caller_deletion_evidence.json` 只证明当前 source-shape boundary；不能授权 target domain ready、App live rendering、owner receipt body、artifact readiness、production ready、quality verdict 或 default promotion。
- `contracts/pack_compiler_input.json` keeps `agent/` as the canonical semantic pack root and lists only non-README pack files in `required_domain_pack_paths`; support README files are human indexes, not machine-required pack paths.

## Reopen Conditions

重新打开本文治理时，必须同时说明影响的唯一 owner doc 和验证入口：

- root `README*`、`docs/**/*.md` 或 tracked `agent/*/README.md` inventory 变化。
- support README 被加入 machine-required pack paths，或 contracts/tests 与 README 边界不一致。
- active truth wording 新增 readiness、production、quality、App live、owner receipt 或 default promotion claim。
- `contracts/functional_privatization_audit.json`、`contracts/default_caller_deletion_evidence.json`、`runtime/authority_functions/**` 或 source-purity tests 与本文 source-shape / evidence-tail 口径冲突。
- 新增 repo-owned generic wrapper/runtime/App/registry/Agent Lab/promotion/worktree lifecycle surface。
- 旧 `bootstrap:sample`、no-`--domain-id` implicit fixture smoke、no-closeout implicit fixture graph、`takeover:test --fixture` alias、direct graph compatibility wording 或把 stage-decomposition `fixture` runner 写成 fallback/public materialization path 的表述复活。
- 历史/process 文档中的 durable conclusion 需要回收到 active/core docs。

## Archived Coverage

Dated coverage tranches and folded process history are compressed under [process history](./history/process/README.md). This governance file keeps lifecycle roles, current inventory groups, rules and reopening conditions; it does not duplicate ledger names, dated closeouts or coverage history.
