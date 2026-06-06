# 2026-06-06 OMA target patch-loop scaleout SSOT closeout

Owner: `opl-meta-agent`
Purpose: `oma_target_patch_loop_scaleout_docs_governance_closeout`
State: `history_provenance`
Machine boundary: Human-readable closeout ledger. Current patch-loop and scaleout truth stays in contracts, tests, OPL work-order primitive refs, Agent Lab result refs, and target owner receipt / typed blocker refs.

## Snapshot

- Repo: `/Users/gaofeng/workspace/opl-meta-agent`
- Semantic theme: `real target patch-loop evidence versus work-order shape proof`
- Governance mode: SSOT-first content-level audit. Separate current refs-only MAS/MAG scaleout closeout from future cohort evidence, source patch / rerun proof, owner gates, readiness, and promotion.

## Single Source Of Truth

Machine SSOT:

- `contracts/real_target_agent_scaleout_evidence.json`
  - owns the real-target delivery and multi-target scaleout gate.
  - current status is `closed_by_two_real_target_refs_only_receipts` with `target_agent_count = 2`.
  - current target refs are MAS and MAG delivery receipt refs, owner receipt / typed blocker refs, Agent Lab result refs, no-forbidden-write proof refs, and cleanup closeout refs.
  - forbidden shortcuts include implicit fixture bootstrap, testing takeover smoke, suite pass, mechanism patch proposal, and developer work order without target owner receipt.
- `contracts/production_acceptance/meta-agent-production-acceptance.json`
  - owns production acceptance / owner-delta gate boundaries, work-order followthrough output classes, and no-readiness authority boundary.
- `contracts/app_workbench_projection.json`
  - owns App/workbench developer-work-order projection fields and the same 11 machine refs for patch-loop drilldown readiness.
- `tests/external-suite-developer-work-order.test.ts`
  - proves blocked Agent Lab suite -> developer patch work order shape, AHE fields, independent reviewer refs, owner route refs, OPL primitive refs, no-forbidden-write proof, runtime/workspace verification refs, and machine closeout refs.
- `tests/external-suite-owner-receipt-behavior.test.ts`
  - proves target owner receipt suites can become no-patch coordination records while preserving target-agent generic vocabulary and no target source writes.
- `tests/external-suite-patch-loop-projection.test.ts`
  - proves App/workbench and scaleout contracts expose only target patch-loop machine refs.
- `tests/execute-external-work-order.test.ts`
  - proves OMA delegates execution and lifecycle to OPL `work-order execute`, rejects stale currentness and non-Codex leases, and does not own target worktree lifecycle or owner receipt writing.

Human-doc owners:

- `docs/active/opl-meta-agent-ideal-state-gap-plan.md`
  - single Active Truth owner for completion/gap/prompt, including the difference between current closed refs-only scaleout gate and future evidence tails.
- `docs/status.md`
  - current active summary.
- `docs/architecture.md`
  - owner split and Codex-attempt-native landing explanation.
- `docs/project.md` and `docs/README.md`
  - entry-level boundary statements.
- `docs/docs_portfolio_consolidation.md`
  - lifecycle guard against readiness overclaims.

## Peer Docs Classification

| Document / section | Classification | Action |
| --- | --- | --- |
| `docs/active/opl-meta-agent-ideal-state-gap-plan.md` / current conclusion, progress row, evidence gap, next scope | `conflicts_with_ssot` and `covered_by_ssot` | Rewrote current patch-loop state from broad open tail to `current_refs_only_scaleout_gate_closed_with_future_cohort_tail`; kept future source-patch / reviewer / App consumption evidence as tail. |
| `docs/status.md` / current evidence tail | `conflicts_with_ssot` | Rewrote `real_blocked_target_patch_loop_scaleout` to point to current MAS/MAG two-target refs-only closeout and future cohort limits. |
| `docs/architecture.md` / Codex-attempt-native landing, real-target scaleout contract, external takeover | `conflicts_with_ssot` | Replaced older single-MAG smoke wording and "only declares required refs" wording with current closed-by-two-target refs-only gate. |
| `docs/project.md` / executor-first reviewer work order machine surface | `covered_by_ssot` with missing specificity | Added current `contracts/real_target_agent_scaleout_evidence.json` two-target closeout and clarified owner receipt body is not authorized. |
| `docs/README.md` / docs rule | `covered_by_ssot` with wording risk | Added refs-only scaleout closeout to the no-overclaim list and clarified owner receipt body. |
| `README.md`, `README.zh-CN.md` / public operator technical sections | `more_specific_detail` | Already describe work-order / evidence takeover as refs-only and proposal-only; no edit in this tranche. |
| `docs/decisions.md`, `docs/invariants.md`, `docs/README.md` / delegated work-order and no-overclaim rules | `covered_by_ssot` | Existing rules already align with OPL delegation and 11 machine refs; no further edit beyond docs README wording. |
| `docs/history/process/*.md` prior process records | `history_or_provenance` | Dated process records remain provenance only and do not own current patch-loop truth. |

## Content-Level Consolidation

- Current truth now has one owner: `contracts/real_target_agent_scaleout_evidence.json` for current scaleout status and `docs/active/opl-meta-agent-ideal-state-gap-plan.md` for human completion/gap/prompt.
- Active docs no longer preserve a parallel long-list reading that treats the MAS/MAG refs-only closeout as still open.
- Future work is narrowed to future cohorts, actual source patch / rerun proof, independent reviewer direct evidence, App/OPL live consumption, repeat long-soak, and target owner gates.
- Overclaim wording stays explicit: refs-only scaleout closeout, work-order shape, generated-surface readiness, suite pass, or mechanism proposal cannot become domain ready, quality/export verdict, owner receipt body, App live rendering, or default promotion.

## Verification Plan

Run after this edit:

```bash
rtk git diff --check
rtk rg -n "^(<<<<<<<|=======|>>>>>>>)" README* docs agent/*/README.md
rtk /Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json
```

Targeted machine truth inputs read in this tranche:

```bash
rtk sed -n '1,260p' contracts/real_target_agent_scaleout_evidence.json
rtk sed -n '1,260p' contracts/production_acceptance/meta-agent-production-acceptance.json
rtk sed -n '1,260p' contracts/app_workbench_projection.json
rtk sed -n '1,260p' tests/external-suite-developer-work-order.test.ts
rtk sed -n '1,240p' tests/external-suite-owner-receipt-behavior.test.ts
rtk sed -n '1,220p' tests/execute-external-work-order.test.ts
rtk sed -n '1,180p' tests/external-suite-patch-loop-projection.test.ts
```

## Remaining Scope

This lane covers only OMA target patch-loop / scaleout wording. It does not complete full OMA docs governance or the OPL series goal.

Carry forward:

- Future real target cohorts with actual source patch / rerun / owner receipt or typed blocker proof.
- Independent Codex reviewer attempts with direct evidence and no shared context.
- OPL/App registry discovery, App render/screenshot/runtime drilldown, repeat long-soak, and future target owner gate evidence.
- Standard target-agent handoff convergence across MAS/MAG/RCA and new Foundry Agents.
- Script-to-pack hygiene and default-caller consumption tails.

## Next Write Scope

Recommended next OMA lane:

- Semantic theme: `public README narrative and operator technical details versus active truth`.
- Candidate SSOT owner: `README.md`, `README.zh-CN.md`, `docs/project.md`, `docs/status.md`, active gap plan, generated-surface/readiness contracts, and README narrative discipline.
- Peer docs: root README pair, `docs/README.md`, `docs/project.md`, `docs/status.md`, `docs/architecture.md`, and relevant history/process closeouts.
