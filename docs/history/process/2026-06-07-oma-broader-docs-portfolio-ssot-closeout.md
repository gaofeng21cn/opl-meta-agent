# 2026-06-07 OMA broader docs portfolio SSOT closeout

Owner: `opl-meta-agent`
Purpose: `broader_docs_portfolio_ssot_closeout`
State: `history_provenance`
Machine boundary: 本文只记录本次 OPL Doc SSOT-first 文档组合治理的范围、分类、判断和验证。当前 truth 继续归核心 docs、`docs/active/`、`docs/docs_portfolio_consolidation.md`、contracts、agent pack、runtime authority refs、source、tests 和 OPL read models。

## Snapshot

- `RUN_SNAPSHOT_TS`: `2026-06-06T19:26:46Z`
- Repo: `/Users/gaofeng/workspace/opl-meta-agent`
- HEAD before edits: `a9b6747`
- Semantic theme: `broader docs portfolio owner split and stale-surface retirement coverage`
- Governance mode: 先按语义主题确定 Single Source of Truth，再做内容级分类；本轮没有发现需要改写 current docs 的冲突，因此只新增 history closeout 和 process index。

## Single Source Of Truth

| Theme | Current owner | Why this owner wins |
| --- | --- | --- |
| Completion, current gaps and next prompt | `docs/active/opl-meta-agent-ideal-state-gap-plan.md` | 唯一声明 `single Active Truth owner`，并持有完成口径、功能/结构差距、测试/证据差距和下一轮 Agent prompt；doctor 只作为风险图，不作为 truth。 |
| Docs lifecycle, document roles and reopening conditions | `docs/docs_portfolio_consolidation.md` | 持有 lifecycle role map、human-doc inventory、规则、archived coverage 和 reopen conditions；`docs/README.md` 只做导航。 |
| Project role and current public boundary | `README.md`、`README.zh-CN.md`、`docs/project.md`、`docs/status.md` | README 持有公开入口；project/status 持有当前角色、能力状态和 evidence-tail 摘要；动态 receipt/count/currentness 回到 live contracts/read models。 |
| Architecture, invariants and durable decisions | `docs/architecture.md`、`docs/invariants.md`、`docs/decisions.md` | 这些文档分别持有 owner split、forbidden claims 和仍有效决策，不保存 per-file process log。 |
| North-star target state | `docs/references/opl-meta-agent-ideal-state.md` | 只读目标态参考，不冻结当前完成顺序或动态 evidence。 |
| Private implementation, script hygiene and retirement gates | `docs/active/opl-private-implementation-migration-inventory.md` plus `runtime/authority_functions/meta-agent-authority-functions.json` and `tests/source-purity.test.ts` | active inventory 持有人读 per-script 分类；machine gates 持有 morphology、no-resurrection、retirement/retention evidence；不能用 prose 直接声明脚本已退役或已被 OPL 接管。 |
| Domain pack support indexes | `contracts/pack_compiler_input.json`、`contracts/stage_control_plane.json`、真实 `agent/` 非 README pack files and tests | `agent/*/README.md` 只做人读索引；machine-required pack paths 不包含 README。 |
| Generated, registry and App projection | OPL Framework / App contracts and OPL generated-interface read model | OMA provides refs-only registration/projection inputs；generated surface owner、registry owner、App/workbench owner 均不在本仓。 |
| History/provenance | `docs/history/README.md` and `docs/history/process/README.md` | 只索引 dated process、tombstone、no-resurrection provenance；不承载当前 readiness 或 active truth。 |

## Peer Docs Classification

| Document / section group | Classification | Action |
| --- | --- | --- |
| `README.md`, `README.zh-CN.md` | `more_specific_detail` for public entry | No edit. They explain user-facing value, current boundary, and operator technical pointers without owning machine truth. |
| `docs/README.md` | `active_index` | No edit. It points to current truth owners and no longer duplicates lifecycle taxonomy. |
| `docs/project.md`, `docs/status.md`, `docs/architecture.md`, `docs/invariants.md`, `docs/decisions.md` | `covered_by_ssot` with distinct current-truth roles | No edit. Each retains one durable role and routes dynamic or machine truth to contracts/read models/tests. |
| `docs/active/opl-meta-agent-ideal-state-gap-plan.md` | `single_active_truth_owner` | No edit. It already keeps current progress/gaps/prompt and compresses dated proof into history/provenance pointers. |
| `docs/active/opl-private-implementation-migration-inventory.md` | `active_inventory` | No edit. It owns script/private implementation classification, active callers, retained authority, OPL migration candidates and retirement gates. |
| `docs/references/opl-meta-agent-ideal-state.md` | `north_star_support` | No edit. It owns target state only and routes current gaps back to active plan. |
| `docs/docs_portfolio_consolidation.md` | `docs_lifecycle_governance` | No edit. It already owns lifecycle role map, inventory, rules and reopen conditions. |
| `agent/*/README.md` | `active_support` | No edit. They explicitly say machine truth remains in contracts, non-README pack files and tests. |
| `docs/history/**` | `history_or_provenance` | Indexed this closeout only. Prior dated ledgers remain process history, not current truth. |

## Stale Surface Review

Targeted scans covered stale or overclaim terms including `fallback`, `alias`, `facade`, `wrapper`, `compatibility`, `production ready`, `domain ready`, `quality verdict`, `export verdict`, `App live`, `default promotion`, `owner receipt body`, `target truth`, `memory body`, `artifact body`, `Agent Lab runner`, `promotion gate`, `queue`, `attempt ledger`, `registry owner` and `workbench shell`.

Current findings:

- Active/current docs use these terms as forbidden claims, no-resurrection rules, owner-boundary descriptions or open evidence tails.
- Retired `bootstrap:sample`, no-closeout implicit fixture graph, `takeover:test --fixture`, `scripts/lib/meta-agent-loop.ts` facade and generic `external_agent/*` patch-ref fallback are already recorded as retired / negative-guard / provenance tails.
- No current doc section was found that presents a retired module, interface, test, workflow or entrypoint as active compatibility surface.
- No active doc needed deletion or merge in this tranche; the broader portfolio already routes semantic themes to one current owner each.

## Modifications

- `docs/history/process/2026-06-07-oma-broader-docs-portfolio-ssot-closeout.md`
  - Added this no-rewrite SSOT closeout for broader docs portfolio coverage.
- `docs/history/process/README.md`
  - Indexed this closeout as process history.

No source, contract, package, workflow, test, current-truth doc, README or agent pack support index changed in this lane.

## Verification

Commands run from `/Users/gaofeng/workspace/opl-meta-agent`:

```bash
rtk git diff --check
rtk rg -n "^(<<<<<<<|=======|>>>>>>>)" README* docs agent/*/README.md
rtk rg -n "production ready|domain ready|quality verdict|export verdict|App live rendering|default promotion|compatibility alias|fallback route|facade|wrapper|owner receipt body" README* docs/*.md docs/active/*.md docs/references/*.md agent/*/README.md
rtk opl-doc-doctor doctor /Users/gaofeng/workspace/opl-meta-agent --format json
rtk /Users/gaofeng/workspace/one-person-lab/bin/opl agents interfaces --repo-dir . --json
```

Result:

- `git diff --check`: pass.
- Conflict-marker scan over `README*`, `docs` and `agent/*/README.md`: pass, no matches.
- Targeted stale/overclaim scan: matches are boundary prohibitions, negative guards, history/provenance, or open evidence tails; no active compatibility surface found.
- OPL Doc doctor: pass, `finding_count = 0`, active truth owner `docs/active/opl-meta-agent-ideal-state-gap-plan.md`.
- OPL generated interface read model: generated interface owner remains `one-person-lab`; OMA repo cannot own generated surface, domain truth, memory body, quality/export verdict or default promotion authority.

## Remaining Scope

This lane closes only the OMA broader docs portfolio coverage tranche. It does not close OMA's functional or evidence tails:

- OPL/App registry discovery, App render/screenshot, live runtime drilldown and repeat long-soak evidence remain open.
- More target cohorts, real source patch / rerun / owner receipt samples and independent Codex reviewer direct-evidence attempts remain open.
- Script-to-pack hygiene continues through private inventory and machine gates; no additional physical script/module retirement was authorized by this docs-only tranche.

For OPL series global governance, fold this closeout back into the OPL family ledger and continue with the remaining repo/document sections until the six-repo coverage list is empty.
