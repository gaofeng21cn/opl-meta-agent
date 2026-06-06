# OMA target improvement policy fallback retirement closeout

Owner: `opl-meta-agent`
Purpose: `target_improvement_policy_fallback_retirement_closeout`
State: `historical_closeout`
Machine boundary: 本文只记录 `target-improvement-policy` generic default change-ref fallback 退役范围、typed blocker replacement、证据和 no-resurrection 规则。当前机器真相继续归 `scripts/lib/target-improvement-policy.ts`、`scripts/improve-from-agent-lab-suite.ts`、`scripts/lib/external-suite-materializer.ts`、target-owned handoff / production-acceptance contracts、external-suite tests 和 repo-native verification。

## Retired surfaces

- Retired: implicit `external_agent/*` generic improvement fallback in `scripts/lib/target-improvement-policy.ts`.
- Retired: `generic_patch_refs_only` traceability status.
- Retired: developer patch work-order generation for blocked external suites that have no target-owned proposed change refs or patch traceability matrix.

## Replacement owner surfaces

- `targetImprovementPolicy(targetAgentDir)` reads change refs, triggers, mappings, patch-surface hints, external-learning refs and runtime expectations from target-owned handoff / production-acceptance contracts.
- Missing target-owned improvement policy now leaves `defaultChangeRefs` empty.
- `inferProposedChangeRefs(...)` no longer falls back to generic source-patch refs when no explicit trigger, mapping or owner-receipt signal matches.
- Forbidden target writes and runtime expectation defaults remain shared work-order guardrails, because they constrain OMA authority and do not claim target patch ownership.
- Blocked suites with missing target-owned proposed change refs now write:
  - `target-capability-improvement-candidate.json`
  - `typed-blocker.json` with `surface_kind: opl_meta_agent_target_improvement_policy_typed_blocker`
  - `agent-lab-run-result.json`
- That branch returns `status: blocked_target_improvement_policy_missing` and sets `authority_boundary.no_executable_work_order_issued: true`.
- That branch does not write `developer-patch-work-order.json`, `mechanism-patch-proposal.json`, `meta-agent-improvement-receipt.json` or `online-learning-candidate.json`.

## Still Allowed

- Explicit target-owned `external_suite_improvement_policy.default_change_refs`, `change_ref_mappings`, `patch_surface_hints` and runtime expectation refs remain valid.
- Owner-receipt / live-acceptance / production-acceptance semantics still produce target-agent owner receipt refs.
- Existing efficiency quality-floor typed blocker remains distinct and still fires before target-policy blocker when efficiency evidence lacks required quality-floor refs.

## No-Resurrection Rule

Do not restore a generic default source-patch policy for arbitrary external target agents. New target-agent improvement refs must come from target-owned contracts, production-acceptance records, explicit handoff refs, owner-receipt semantics, or traceable mappings in the suite / reviewer evidence. Generic failure taxonomy wording alone must not create source patch refs, editable surfaces or executable developer patch work orders.

Do not restore `generic_patch_refs_only`. A blocked suite without target-owned traceability must surface a typed blocker and required input refs, not a weakly traceable work order.

## Verification

Run from the OMA repo root after this lane:

```bash
rtk scripts/run-with-repo-temp-env.sh node --test tests/target-improvement-policy.test.ts tests/external-suite-reviewer-gates.test.ts tests/external-suite-developer-work-order.test.ts tests/external-suite-owner-receipt-behavior.test.ts tests/external-suite-efficiency-behavior.test.ts
rtk npm run typecheck
rtk npm test
rtk git diff --check
rtk rg -n "^(<<<<<<<|=======|>>>>>>>)" .
rtk rg -n "GENERIC_IMPROVEMENT_POLICY|generic_patch_refs_only|external_agent/failure_taxonomy_to_mechanism_candidate|writeEfficiencyBlockerArtifacts" scripts tests docs contracts
```

Expected behavior:

- Generic external target policy test: no synthesized `external_agent/*` change refs.
- Missing target-owned policy reviewer-gate test: process exits successfully with `blocked_target_improvement_policy_missing`, writes `typed-blocker.json`, and does not write `developer-patch-work-order.json`.
- MAS developer work-order, owner-receipt no-patch and efficiency typed-blocker tests still pass with explicit target-owned policies or owner-receipt semantics.

Result:

- Focused Node tests passed: `13` tests, `0` failed.
- `npm run typecheck` passed.
- `npm test` passed: `79` tests, `0` failed.
- `npm run verify` passed: `79` tests, `0` failed.
- `git diff --check` passed.
- Conflict-marker scan found no matches.
- Source/test/contract no-resurrection scan for `GENERIC_IMPROVEMENT_POLICY`, `generic_patch_refs_only`, `external_agent/failure_taxonomy_to_mechanism_candidate` and `writeEfficiencyBlockerArtifacts` found no active matches outside this historical closeout.
