# opl-meta-agent 过程历史

Owner: `opl-meta-agent`
Purpose: `process_history_index`
State: `historical_archive_index`
Machine boundary: 本目录只记录人读治理过程、覆盖 ledger、退役 provenance 和 no-resurrection 说明；机器真相继续归 contracts、agent pack、runtime authority refs、source、tests、OPL read models 和 target owner receipts。

## 读法

本文件是 OMA process / coverage / cleanup provenance 的压缩索引。历史过程只保留主题级 provenance，不保留逐日 closeout 长清单。若某条历史结论仍有当前规则价值，先折回 `docs/docs_portfolio_consolidation.md`、核心五件套、active gap plan、private inventory、contracts、authority refs、source 或 tests，再把过程记录压缩在本目录。

## Single Source Of Truth

| Theme | Current owner |
| --- | --- |
| 当前完成口径、功能/结构差距、测试/证据差距、下一轮 prompt | `docs/active/opl-meta-agent-ideal-state-gap-plan.md` |
| north-star / target-state | `docs/references/opl-meta-agent-ideal-state.md` |
| 文档生命周期、目录职责、inventory groups、reopening conditions | `docs/docs_portfolio_consolidation.md` |
| 私有实现分类、script hygiene、上收候选、退役门 | `docs/active/opl-private-implementation-migration-inventory.md` |
| 当前状态和 evidence tail 摘要 | `docs/status.md` |
| 硬边界和 forbidden claims | `docs/invariants.md` |
| 仍有效决策 | `docs/decisions.md` |
| 退役 surface no-resurrection provenance | [`retired-surface-provenance.md`](./retired-surface-provenance.md) |

## Compressed Provenance

| Provenance group | Current read |
| --- | --- |
| Docs lifecycle and coverage | Root `README*`, all `docs/**/*.md`, and tracked `agent/*/README.md` have one clear role each. Future coverage records stay topic-level here; machine truth remains in contracts/source/tests. |
| Target-agent field / takeover retirement | Old `external_agent_allowed`, `external_opl_compatible_agents_allowed`, `external-agent-takeover`, `takeover:test --fixture`, implicit fixture graph and field-only closeout files are folded into `retired-surface-provenance.md` and machine no-resurrection tests. |
| External-suite / external-work-order vocabulary | `external-suite` and external work-order remain active Agent Lab external-suite and OPL work-order delegation semantics. They are not stale takeover aliases and should not be retired without replacement machine truth. |
| Script-to-pack hygiene | Detailed script/materializer classification SSOT is `docs/active/opl-private-implementation-migration-inventory.md` plus `runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy/script_to_pack_retirement_gates` and `tests/source-purity.test.ts`. |
| Evidence-tail currentness | Registry/App consumption, production-consumption, patch-loop, independent reviewer and target-agent handoff evidence tails return to active plan, status, contracts, OPL read model and tests. Dated proof transcripts are not current truth. |

## Coverage Snapshot

2026-06-09 OPL Doc series tranche:

- Scope reviewed: root `README*`, `docs/*.md`, `docs/active/*.md`, `docs/references/*.md`, `docs/history/*.md`, `docs/history/process/*.md`, tracked `agent/{knowledge,prompts,quality_gates,skills,stages}/README.md`, package scripts and runtime authority surfaces that define docs truth.
- SSOT decision: `docs/active/opl-meta-agent-ideal-state-gap-plan.md` remains the single Active Truth owner; `docs/active/opl-private-implementation-migration-inventory.md` owns script/source-purity detail; `docs/references/opl-meta-agent-ideal-state.md` owns north-star; this file only keeps compressed provenance.
- Content-level consolidation: prior script-to-pack, README/docs coverage, external-suite/work-order audit, target-agent takeover identifier/field retirement and process-history compression entries were folded into the provenance groups above. Durable no-resurrection rules remain in `retired-surface-provenance.md`; current rules remain in owner docs and machine surfaces.
- Retired / guarded: no source, contract, test, workflow, package or CLI surface changed in this tranche. Guarded retired surfaces remain target-agent old fields, external-agent takeover identifiers, `takeover:test --fixture`, implicit fixture graph, direct graph compatibility, generic `external_agent/*` patch-ref fallback, compatibility facades and repo-owned generic runtime/wrapper/App/registry/Agent Lab/promotion surfaces.
- Remaining OMA scope under the parent OPL series goal: registry/App live consumption, additional target cohorts, real source patch-loop, independent reviewer direct evidence, standard target-agent handoff convergence and actual script-to-pack source reductions remain open under the active gap plan.
- Next write scope: after fresh intake, prefer evidence-tail or script-to-pack work that changes active plan / private inventory / contracts / tests only when live machine truth changes. Do not reopen `external-suite` / external-work-order as stale vocabulary without replacement machine truth.
