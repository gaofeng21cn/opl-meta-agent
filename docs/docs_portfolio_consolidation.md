# opl-meta-agent 文档组合治理

Owner: `opl-meta-agent`
Purpose: `docs_lifecycle_governance`
State: `active_support`
Machine boundary: 本文是人读治理入口和 coverage ledger。当前机器真相继续归 `contracts/`、`agent/`、`runtime/authority_functions/`、source、CLI/API 行为、OPL Agent Lab result refs、developer work-order receipts、owner receipts、candidate refs 和 tests。

## 当前结论

`opl-meta-agent` 采用轻量 OPL-compatible repo 文档形态：root `README*` 和 `docs/` 核心文档持有当前入口、项目事实、架构、硬约束、决策、目标态、active gap plan 与私有实现迁移台账。`agent/*/README.md` 是 domain pack 支撑索引，不作为 machine-required pack path；机器 pack 真相由 `contracts/pack_compiler_input.json`、`contracts/stage_control_plane.json`、`agent/` 真实文件和 tests 验证。

当前 single Active Truth owner 是 `docs/active/opl-meta-agent-ideal-state-gap-plan.md`。North-star 目标态只读 `docs/references/opl-meta-agent-ideal-state.md`；私有实现、script hygiene、default-caller tail 和 OPL 上收边界只读 `docs/active/opl-private-implementation-migration-inventory.md`；核心当前事实继续回到 `docs/project.md`、`docs/status.md`、`docs/architecture.md`、`docs/invariants.md` 和 `docs/decisions.md`。

本仓暂不为了空目录对齐创建 `public/product/runtime/delivery/source/policies/specs/history` 目录。未来出现长期 public、product、runtime、delivery、source、policy、spec 或 history 材料时，先判断唯一 owner、purpose、state 和 machine boundary，再按 OPL-family canonical taxonomy 增加对应目录和索引。

## 目录职责

| 目录 / 文档组 | 当前职责 | Machine boundary |
| --- | --- | --- |
| `README.md`, `README.zh-CN.md` | 公开 / 双语仓库入口，解释 OMA 是 agent-building Foundry Agent | 不作为 generated interface、runtime、Agent Lab 或 App owner |
| `docs/README.md` | 文档入口和分层索引 | 指向核心 docs、active plan、target-state reference 和 private inventory |
| `docs/project.md`, `docs/status.md`, `docs/architecture.md`, `docs/invariants.md`, `docs/decisions.md` | 当前项目角色、状态、架构、硬约束和决策 | 机器真相归 contracts、agent pack、runtime authority refs、tests 和 OPL read models |
| `docs/active/opl-meta-agent-ideal-state-gap-plan.md` | single Active Truth owner：完成进度、功能/结构 gap、证据 gap、下一轮 Agent prompt | 不保存 dated process log；不把 conformance / suite pass / generated surface proof 升级为 readiness |
| `docs/active/opl-private-implementation-migration-inventory.md` | 私有实现分类、script hygiene、default-caller tail、上收候选和退役门 | 不能把 scripts/materializers 写成 generic runtime、Agent Lab runner、promotion gate、workbench 或 target truth writer |
| `docs/references/opl-meta-agent-ideal-state.md` | north-star / target-state reference | 当前状态和完成顺序回到 active plan |
| `agent/*/README.md` | domain pack 支撑索引 | 真实 pack required paths 由 contracts/tests 验证；README 不作为 machine-required pack path |

## 规则

- `README*` 与 `docs/**` 是人读材料；机器消费者读取 contracts、source、tests、CLI/API 行为或语义化 refs。
- Generated interface readiness、registry readiness、App projection readiness、suite pass、schema completeness、contract completeness、work-order shape 或 OPL refs-only consumption 不能写成 target domain ready、quality verdict、artifact readiness、owner receipt、App live rendering、production ready 或 default promotion。
- Agent Lab / OMA 是 standard target-agent consumer，不是 MAS/MAG/RCA 的专用兼容层。目标 agent 名称只可作为 target refs、owner routes、fixtures、receipt refs 或 provenance 出现。
- Active docs 只保留当前计划、差距和迁移门。过程 proof、dated closeout、历史路线和本治理记录只留在本 ledger、OPL family ledger、提交历史或未来 history/provenance 语境。

## Coverage Ledger

### Current OMA Coverage State

Last semantic refresh: `2026-05-28T22:28:01+0800`.

This ledger records the current OMA README/docs portfolio state directly instead of appending repeated no-drift process packets. Prior dated tranches are folded into the compact history table below; their durable result is the current coverage state in this section.

Fresh live truth inputs:

- Repo guidance and taste: `AGENTS.md`, `TASTE.md`.
- Public/docs surface: root `README.md`, root `README.zh-CN.md`, `docs/README.md`, core five docs, active gap plan, private implementation inventory, ideal-state reference, and this governance ledger.
- Support README surface: `agent/knowledge/README.md`, `agent/prompts/README.md`, `agent/quality_gates/README.md`, `agent/skills/README.md`, and `agent/stages/README.md`.
- Machine refs: `contracts/functional_privatization_audit.json`, `contracts/default_caller_deletion_evidence.json`, `contracts/pack_compiler_input.json`, `contracts/stage_control_plane.json`, `contracts/opl_domain_manifest_registration.json`, `contracts/app_workbench_projection.json`, production-acceptance contracts, `runtime/authority_functions/meta-agent-authority-functions.json`, source, tests, package scripts, OPL Doc Governance doctor output, and `npm test`.
- OPL consumption read models: `opl agents interfaces --repo-dir /Users/gaofeng/workspace/opl-meta-agent --json` returned generated interface bundle `status=ready` with OPL-owned CLI/MCP/Skill/product-entry/tool descriptors; `opl runtime oma-production-consumption list --json` returned two verified refs-only ledger receipts, one long-soak ref and one historical typed-blocker provenance ref.

Current exact human-doc inventory:

| Group | Paths |
| --- | --- |
| Root entries | `README.md`, `README.zh-CN.md` |
| Docs index/current truth | `docs/README.md`, `docs/project.md`, `docs/status.md`, `docs/architecture.md`, `docs/invariants.md`, `docs/decisions.md` |
| Active/support owner docs | `docs/active/opl-meta-agent-ideal-state-gap-plan.md`, `docs/active/opl-private-implementation-migration-inventory.md`, `docs/references/opl-meta-agent-ideal-state.md`, `docs/docs_portfolio_consolidation.md` |
| Agent pack support indexes | `agent/knowledge/README.md`, `agent/prompts/README.md`, `agent/quality_gates/README.md`, `agent/skills/README.md`, `agent/stages/README.md` |

Current semantic result:

- The current exact inventory has one active truth owner, one ideal-state reference, one private implementation inventory, one docs lifecycle owner, one docs entry index, and five domain-pack support indexes. No duplicate active plan, stale current-truth path, or unsupported support README path is open.
- `contracts/functional_privatization_audit.json` and `contracts/default_caller_deletion_evidence.json` still report `source_shape=landed`, `functional_structure_gap_count=0`, and `domain_repo_retained_generic_surface_count=0`. This proves only the current source-shape boundary; it does not authorize target domain ready, App live rendering, owner receipt body, artifact readiness, production ready, quality verdict, or default promotion.
- Remaining tail kinds are still `opl_generated_default_caller_consumption_tail`, `domain_refs_only_adapter_thinning`, `script_to_pack_hygiene`, and `evidence_tail`.
- `contracts/pack_compiler_input.json` keeps `agent/` as the canonical semantic pack root and lists only non-README pack files in `required_domain_pack_paths`; support README files are human indexes, not machine-required pack paths.
- OPL registry/App projection contracts remain refs-only handoff material owned by OPL/App for generated/discovery/workbench surfaces; they do not close App live render/runtime drilldown, long-soak, target owner receipt, or promotion gates.
- Fresh OPL read-model consumption remains consistent with that boundary: interface generation is ready and OMA production-consumption ledger receipts are verified, but both surfaces keep `refs_only=true`, cannot write target truth, cannot create owner receipts, cannot claim domain/production ready, and cannot promote defaults without a gate.

Reviewed documents / sections:

| Repo | Reviewed docs / sections | Current owner |
| --- | --- | --- |
| `opl-meta-agent` | Current role/currentness read of all root `README*`, all `docs/**/*.md`, tracked `agent/*/README.md`, active truth plan, ideal-state reference, private inventory, and machine refs listed above. | `docs/docs_portfolio_consolidation.md` |

Archived / tombstoned / deleted docs:

- none. The current OMA human-doc inventory has legitimate long-term roles as public entry, docs index, current truth, active plan, active inventory, target-state reference, docs lifecycle ledger, or domain-pack support index.

Unreviewed docs:

- `opl-meta-agent`: none for current repo-root `README*`, `docs/**/*.md`, or tracked `agent/*/README.md` support indexes.
- Agent pack non-README semantic files remain machine truth / pack body refs. They were used to validate README support-index boundaries but are not separate prose-doc governance targets.

Remaining stale / retire candidates:

- OMA doc-path retirement remains empty for the current exact inventory.
- Evidence/hygiene tails remain active: OPL registry/App live consumption receipts, repeat long-soak, more real target patch-loop owner receipt or typed blocker samples, independent Codex reviewer direct-evidence samples, standard target-agent handoff convergence, domain refs-only adapter thinning, and script-to-pack / OPL primitive hygiene.
- Future prose that upgrades refs-only generated/registration/App projection, suite pass, schema completeness, work-order shape, source-shape conformance, support README indexes, or OPL refs-only consumption into target-domain readiness, App live rendering, owner receipt, artifact readiness, production ready, quality verdict, default promotion, or global OPL-series completion is stale pollution.

Next tranche write scope:

- Continue OPL series coverage on repos with newly changed README/docs surfaces or stale-lane fallout after branch/worktree hygiene.
- For OMA specifically, only reopen this ledger when the exact human-doc inventory changes, support README boundaries drift, active truth wording gains a new readiness claim, or machine refs contradict the current source-shape / evidence-tail statements.
- App body docs remain deferred while dirty/recent App lanes are unsafe for generic docs-governance absorb.

### Folded Tranche History

| Date | Durable result | Current foldback |
| --- | --- | --- |
| 2026-05-27 repo-local ledger bootstrap | Brought prior OPL-family OMA README/docs coverage into this repo and confirmed root `README*` plus `docs/**/*.md` had unique long-term roles. | Folded into Current OMA Coverage State. |
| 2026-05-27 agent pack README lifecycle | Added owner / purpose / state / machine boundary to five `agent/*/README.md` support indexes and confirmed they are not machine-required pack paths. | Folded into current support README inventory and boundary statement. |
| 2026-05-28 no-drift revalidations | Confirmed no new OMA human-doc path, no duplicate active truth owner, and no new readiness claim after OPL-series hygiene. | Replaced by this compact current-state ledger. |
| 2026-05-28 22:28 CST full-body refresh | Re-read all current root `README*`, all `docs/**/*.md`, tracked `agent/*/README.md` support indexes, core contracts, source/test inventory, package scripts, doctor output, generated interface read model, and OMA production-consumption ledger. | Folded into Current OMA Coverage State; no doc-path retirements or readiness wording changes were needed. |
