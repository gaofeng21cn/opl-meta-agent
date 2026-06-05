# 2026-06-05 OMA active progress 与 retired fixture 审计

Owner: `opl-meta-agent`
Purpose: `process_coverage_and_retirement_audit`
State: `history_provenance`
Machine boundary: 本文只记录本次 OPL series automation tranche 的人读覆盖、退役审计和验证口径。当前 truth 继续归 `docs/active/opl-meta-agent-ideal-state-gap-plan.md`、`docs/status.md`、`docs/active/opl-private-implementation-migration-inventory.md`、contracts、runtime authority refs、source 和 tests。

## Scope

本次覆盖 OMA active progress owner shape 与一个具体退役 surface family：

- Active owner shape：`docs/active/opl-meta-agent-ideal-state-gap-plan.md` 必须显式承载当前完成进度、当前差距和下一轮 Agent prompt。
- 文档 lifecycle：`docs/docs_portfolio_consolidation.md` 继续只持有 role map / reopening conditions；dated coverage 不追加回该文件。
- Retirement candidate audit：`takeover:test --fixture` legacy alias / retired fixture materialization tail。

## Reviewed surfaces

- `README.md`、`README.zh-CN.md`、`docs/status.md`、`docs/architecture.md`、`docs/docs_portfolio_consolidation.md`、`docs/active/opl-meta-agent-ideal-state-gap-plan.md`、`docs/active/opl-private-implementation-migration-inventory.md`。
- `package.json#scripts`。
- `scripts/takeover-agent.ts#parseTakeoverAgentArgs`。
- `tests/takeover-loop.test.ts#takeover parser rejects retired fixture alias`。
- `tests/contracts.test.ts#bootstrap:sample absence` and StageRun / retired surface guards.
- `tests/stage-decomposition-materializer.test.ts#build-agent-baseline rejects implicit fixture closeout materialization`.
- `tests/source-purity.test.ts#script morphology` and `runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy`.
- `contracts/default_caller_deletion_evidence.json`、`contracts/functional_privatization_audit.json`、`contracts/stage_run_kernel_profile.json`。

## Active progress foldback

`docs/active/opl-meta-agent-ideal-state-gap-plan.md` 原本已在正文和 `已落地` 表中承载完成证据，但 OPL Doc doctor 无法识别专门的 current completion progress section。Active owner 现在新增显式 `当前完成进度` 表，分开承载：

- done surfaces：standard domain pack、Foundry Agent identity、generated interface inputs、work-order materialization、StageRun canary 和 source-shape guard。
- guarded retirement：legacy alias / wrapper tails 已退役并被 guard，不是 public active surface。
- open evidence tails：registry/App consumption、repeat target cohorts、long-soak、independent reviewer 和 owner receipt samples。

这只是 docs lifecycle 修正；不新增 production readiness、App live rendering、target domain readiness、human approval、owner receipt body、quality/export verdict、default promotion 或 physical deletion authority 声明。

## Retirement candidate audit

Candidate: `takeover:test --fixture` legacy alias / fixture materialization tail.

当前证据：

- `package.json` exposes `takeover:test` as `node --experimental-strip-types scripts/takeover-agent.ts`; no package script exposes a fixture alias.
- Public command examples in README use `npm run takeover:test -- --agent-dir <existing-agent-dir> --output-dir <dir> --opl-bin <opl>`.
- `scripts/takeover-agent.ts#parseTakeoverAgentArgs` accepts `--agent-dir`, `--output-dir` and `--opl-bin`; `--fixture` throws a retired-alias error before any materialization path.
- `tests/takeover-loop.test.ts` asserts `--fixture` fails closed.
- `runtime/authority_functions/meta-agent-authority-functions.json#source_purity_scan_receipt` lists `takeover_fixture_alias` as a retired materializer tail guarded by `tests/takeover-loop.test.ts`.
- Related retired public/materialization surface `bootstrap:sample` remains absent from `package.json`, and no-closeout fixture graph materialization remains guarded by `tests/stage-decomposition-materializer.test.ts`.

结果：

- No active public caller remains for `takeover:test --fixture`.
- Replacement owner / surface is explicit target-agent intake through `--agent-dir` plus OPL Agent Lab takeover refs.
- No physical source delete was safe or needed in this tranche because the only source reference is the fail-closed parser guard that prevents resurrection.
- Retained refs are limited to negative tests, machine no-resurrection guards, active inventory tombstone wording and this history provenance.
- No compatibility alias, fallback route, facade, wrapper or second materialization path was added.

## Verification

本 tranche 是 docs-only；未修改 source、contracts 或 tests。验证口径为：

- `git diff --check` over edited docs.
- conflict-marker scan over `README*`, `docs/**/*.md` and `agent/*/README.md`.
- OPL Doc doctor to confirm the active owner shape.
- `npm run typecheck` and `npm test` were already run before the OMA clean-ahead push in this heartbeat; rerun only if later source/contracts/tests change.
