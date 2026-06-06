# 2026-06-07 OMA docs index lifecycle SSOT closeout

Owner: `opl-meta-agent`
Purpose: `docs_index_lifecycle_ssot_closeout`
State: `history_provenance`
Machine boundary: 本文只记录本次 SSOT-first 文档治理的范围、分类、改动和验证。当前 truth 继续归 `docs/docs_portfolio_consolidation.md`、核心 docs、contracts、source、tests 和 OPL read models。

## Snapshot

- `RUN_SNAPSHOT_TS`: `2026-06-06T17:02:45Z`
- Repo: `/Users/gaofeng/workspace/opl-meta-agent`
- Semantic theme: `docs entry index versus lifecycle role map`
- Governance mode: 先确定 lifecycle SSOT，再把入口索引收薄回导航职责。

## Single Source Of Truth

- Lifecycle owner: `docs/docs_portfolio_consolidation.md`
  - owns lifecycle role map, current human-doc inventory groups, document rules, archived coverage policy and reopening conditions.
- Index owner: `docs/README.md`
  - owns reading order and navigation to current truth, architecture, invariants, decisions, active gap plan, private inventory and history.

## Peer Docs Classification

| Document / section | Classification | Action |
| --- | --- | --- |
| `docs/docs_portfolio_consolidation.md` / current conclusion, lifecycle roles, inventory, rules, reopening conditions | `covered_by_ssot` | No edit; remains the detailed lifecycle governance owner. |
| `docs/README.md` / first paragraph | `more_specific_detail` | Kept as navigation, but added an explicit pointer to the lifecycle SSOT. |
| `docs/README.md` / `目录职责` section | `covered_by_ssot` duplicate | Removed directory-role table and taxonomy prose from the index. |
| `docs/README.md` / `文档规则` section | `covered_by_ssot` duplicate with index role | Kept only high-level reading rules and pointed lifecycle map / inventory / reopening conditions to the SSOT. |
| `docs/history/process/README.md` | `history_or_provenance_index` | Indexed this closeout. |

## Modifications

- `docs/README.md`
  - Clarified that the file is a navigation index, not the lifecycle role-map owner.
  - Removed duplicated directory responsibility table and lightweight taxonomy prose.
  - Pointed lifecycle role map, inventory, directory duties and reopening conditions to `docs/docs_portfolio_consolidation.md`.
- `docs/history/process/README.md`
  - Indexed this closeout.

## Verification

Commands run from the governance worktree root:

```bash
rtk git diff --check
rtk rg -n "^(<<<<<<<|=======|>>>>>>>)" README* docs agent/*/README.md
rtk /Users/gaofeng/workspace/opl-doc/scripts/opl_doc_doctor.py doctor . --format json
```

Result:

- `git diff --check`: pass.
- Conflict-marker scan over `README*`, `docs` and `agent/*/README.md`: pass, no matches.
- OPL Doc doctor: pass, `finding_count = 0`, active truth owner `docs/active/opl-meta-agent-ideal-state-gap-plan.md`, `markdown_doc_count = 26`.

No source, contract, package, workflow or test surface changed in this lane.

## Remaining Scope

This lane only covers `docs/README.md` versus `docs/docs_portfolio_consolidation.md`. It does not close the global OMA evidence tails: registry/App live consumption, future target cohorts, independent reviewer direct evidence, real source patch-loop samples or script-to-pack primitive parity remain open in the active gap plan.
