# OMA docs lifecycle cleanup

Owner: `opl-meta-agent`
Purpose: `docs_lifecycle_cleanup_process_record`
State: `history_provenance`
Machine boundary: 本文是人读过程记录。当前机器真相继续归 `contracts/`、`agent/`、`runtime/authority_functions/`、source、tests、OPL read models 和 target owner receipts / typed blockers。

本文记录 2026-06-03 docs lifecycle cleanup 的 durable foldback。当前 docs lifecycle truth 以 `docs/docs_portfolio_consolidation.md`、核心五件套、active gap plan、private implementation inventory、contracts/source/tests 为准；本文不作为 current readiness、production ready、quality verdict、App live rendering、owner receipt 或 default promotion 证据。

## Scope

- Reviewed root `README*`, all `docs/**/*.md`, tracked `agent/*/README.md`, repo guidance, taste, OMA skill surface, CodeGraph-indexed tests/scripts, and selected machine refs.
- Write scope stayed within README/docs human-doc surface. Contracts, source and tests were read-only.
- Cleanup focused on lifecycle role clarity, active-path long-list compression, support/history separation, generated-surface boundary, pack compiler boundary, target-agent loop boundary and old process ledger containment.

## Foldback

| Category | Action | Current owner |
| --- | --- | --- |
| Active status evidence long list | Compressed to current status, landed boundary table, evidence tail and forbidden upgrades. | `docs/status.md` |
| Active gap plan | Kept as single active truth owner for completion/gap/next prompt; removed repeated historical evidence detail. | `docs/active/opl-meta-agent-ideal-state-gap-plan.md` |
| Private implementation inventory | Converted per-file long table into owner-boundary inventory, risk-surface gates and dynamic evidence entrypoints. | `docs/active/opl-private-implementation-migration-inventory.md` |
| Docs portfolio governance | Replaced coverage-ledger shape with lifecycle role map, current inventory, rules and reopening conditions. | `docs/docs_portfolio_consolidation.md` |
| History/process indexing | Added this process record and index entry. | `docs/history/process/README.md` |

## Durable Reading Rules

- `docs/docs_portfolio_consolidation.md` is lifecycle governance, not an evidence ledger.
- `docs/history/process/**` records dated process and provenance only.
- `agent/*/README.md` remains human support index; machine-required pack files remain non-README files verified by contracts/tests.
- OMA remains `opl_generated_skill_surface_not_plugin_packaged`; MAS/MAG/RCA plugin-packaged structure does not apply to this repo.
- Generated-surface proof, suite pass, source-shape conformance, App projection readiness or work-order shape cannot become target domain ready, quality verdict, owner receipt, production ready or default promotion.

## Verification Target

Docs-only cleanup should be checked with `rtk git diff --check`, conflict-marker scan over README/docs/agent support indexes, and an inventory sanity command comparing current human-doc files with `docs/docs_portfolio_consolidation.md`.
