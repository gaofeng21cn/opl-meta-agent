# 2026-06-07 OMA reviewer evidence projection currentness closeout

Owner: `opl-meta-agent`
Purpose: `oma_reviewer_evidence_projection_currentness_closeout`
State: `history_provenance`
Machine boundary: Human-readable closeout. Current App/workbench projection, scaleout required refs, developer work-order shape, reviewer validation, owner gates and production evidence remain owned by contracts, source, tests, OPL work-order primitive refs, target owner receipts and typed blockers.

## Scope

This lane fixes a stale interface between landed developer work orders and the App/workbench / scaleout contracts. Developer patch work orders already carry independent reviewer evidence and provenance fields, but the projection contracts still exposed only the original patch-loop machine closeout refs.

This lane does not generate a new independent reviewer attempt, write target agent source, write target truth, produce owner receipt bodies, claim App live rendering, close target owner gates, or authorize production readiness.

## SSOT

- `contracts/app_workbench_projection.json` owns App/workbench developer-work-order drilldown fields.
- `contracts/real_target_agent_scaleout_evidence.json` owns blocked-suite evidence class required refs.
- `tests/support/external-suite-fixtures.ts` owns the shared expected projection field lists.
- `tests/external-suite-patch-loop-projection.test.ts` owns the regression guard that App/workbench and scaleout required refs stay aligned.
- Developer work-order reviewer field validation remains in source/tests such as `scripts/lib/work-order-validation.ts` and `tests/external-suite-developer-work-order.test.ts`.

## Changes

- Added reviewer evidence/provenance refs to App/workbench developer-work-order projection fields.
- Added the same reviewer evidence/provenance refs to blocked-suite scaleout required refs.
- Split the shared test fixture into patch-loop machine refs and reviewer projection refs so actual `machine_closeout_refs` semantics stay unchanged.
- Refreshed OMA status and active gap wording from `11-field projection` to `patch-loop machine refs plus reviewer evidence/provenance projection`.

## Classification

| Surface | Classification | Outcome |
| --- | --- | --- |
| App/workbench developer work-order projection missing reviewer fields | `conflicts_with_ssot` | Closed by adding `ai_reviewer_evaluation_ref`, reviewer source/direct evidence refs, verdict, predicted impact, independence, provenance and reviewer refs. |
| Blocked-suite scaleout required refs missing reviewer fields | `conflicts_with_ssot` | Closed with the same required refs as App/workbench projection. |
| Actual developer work-order machine closeout refs | `covered_by_ssot` | Kept unchanged; reviewer evidence stays on dedicated work-order fields, not inside `machine_closeout_refs`. |
| Independent reviewer direct evidence sample | `out_of_scope` | Still requires real invocation/context/trace/receipt and direct evidence samples before evidence-tail closure. |

## Verification

Run from `/Users/gaofeng/workspace/opl-meta-agent`:

```bash
rtk node --test tests/external-suite-patch-loop-projection.test.ts tests/external-suite-developer-work-order.test.ts tests/external-suite-reviewer-gates.test.ts
rtk git diff --check
rtk rg -n "^(<<<<<<<|=======|>>>>>>>)" contracts tests docs
rtk /Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json
```

## Remaining Scope

The projection interface is current, but OMA still needs future real target cohorts, actual source patch / rerun proof, target owner receipt or typed blocker proof, no-forbidden-write proof, runtime-read-model consumption, workspace proof, cleanup, Agent Lab re-evaluation, App/OPL live consumption and real independent reviewer attempt evidence before any broader readiness claims.
