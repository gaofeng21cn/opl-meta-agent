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

| Provenance group | What remains here | What moved out |
| --- | --- | --- |
| Docs lifecycle and coverage | 本索引只记录当前 SSOT owner、coverage snapshot 和 reopen 入口。 | Dated coverage tranche、doctor transcript、branch/worktree closeout、per-file proof log 不再以单独 Markdown 文件维护。 |
| Retired module/interface/test/workflow/entrypoint tails | `retired-surface-provenance.md` 保留 no-resurrection rules 和 current owner refs。 | 单次 facade / fallback / alias / test-thinning / docs-index closeout 文件已压缩。 |
| Evidence-tail currentness | 当前读法回到 active plan、status、contracts、OPL read model 和 tests。 | registry/App、production-consumption、patch-loop、reviewer projection 的 dated proof transcript 不再作为当前 truth 保存。 |

## Coverage Snapshot

2026-06-08 target-agent machine-field retirement tranche:

- Reviewed: root `README*`, `docs/**/*.md`, `agent/*/README.md`, related agent prompt/stage/skill/quality-gate references, `contracts/owner_receipt_contract.json`, `scripts/takeover-agent.ts`, takeover/action authority/source-purity/generated-interface tests, and scoped `external_agent` / `target_agent` scans.
- Edited: `contracts/owner_receipt_contract.json`, `scripts/takeover-agent.ts`, `tests/contracts-action-authority.test.ts`, `tests/takeover-loop.test.ts`, `docs/history/process/README.md`, `docs/history/process/target-agent-machine-field-retirement.md`.
- Retired active machine fields: `external_agent_allowed` and `external_opl_compatible_agents_allowed`; replacement fields are `target_agent_allowed` and `target_opl_compatible_agents_allowed`.
- Unreviewed in this tranche: broader `external-suite`, `execute:external-work-order`, `external-agent-takeover` action/stage identifier migration. Those remain active identifiers and require a separate generated-interface / stage-control lane if renamed.
- Remaining stale / retire candidates: old underscore fields must remain only in no-resurrection assertions or history; broader hyphenated external action/stage vocabulary remains a future semantic lane, not a compatibility alias introduced here.
- Next write scope: generated-interface-safe action/stage vocabulary migration or another clean sibling repo semantic lane after fresh six-repo intake.

2026-06-08 OMA process-history compression tranche:

- Reviewed: `README*`, `docs/README.md`, `docs/project.md`, `docs/status.md`, `docs/architecture.md`, `docs/invariants.md`, `docs/decisions.md`, `docs/docs_portfolio_consolidation.md`, `docs/active/opl-meta-agent-ideal-state-gap-plan.md`, `docs/active/opl-private-implementation-migration-inventory.md`, `docs/references/opl-meta-agent-ideal-state.md`, `docs/history/README.md`, previous `docs/history/process/*.md`, `package.json`, `runtime/authority_functions/meta-agent-authority-functions.json`, and source-purity tests that bind retired-tail provenance refs.
- Edited: `docs/history/process/README.md`, `docs/history/process/retired-surface-provenance.md`, `docs/docs_portfolio_consolidation.md`, `runtime/authority_functions/meta-agent-authority-functions.json`, `tests/source-purity.test.ts`.
- Compressed / deleted: previous dated OMA process closeout Markdown files under `docs/history/process/`, after their durable conclusions were folded into the SSOT owners above or into `retired-surface-provenance.md`.
- Unreviewed in this tranche: non-process OMA docs were read only for SSOT alignment; full OPL series coverage across the other five repos remains open under the parent OPL Doc goal.
- Remaining stale / retire candidates in OMA process history: none identified after compression. OMA open work remains the active evidence tails and script-to-pack hygiene already listed in the active gap plan.
- Next write scope: repeat the same SSOT-first compression on the clean sibling repos with long history/process ledgers, while treating `one-person-lab` and `med-autoscience` dirty worktrees as read-only until their concurrent write sets are resolved.
