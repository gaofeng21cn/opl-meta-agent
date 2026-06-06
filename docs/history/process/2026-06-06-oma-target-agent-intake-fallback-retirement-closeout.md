# OMA target-agent intake fallback retirement closeout

Owner: `opl-meta-agent`
Purpose: `target_agent_intake_fallback_retirement_closeout`
State: `historical_closeout`
Machine boundary: 本文只记录 `readTargetAgent` fallback identity synthesis 和 docs-prose 测试锁定退役的范围、证据和 no-resurrection 规则。当前机器真相继续归 `contracts/domain_descriptor.json` target-agent contract、`scripts/lib/meta-agent-loop-io.ts`、takeover / external-suite callers、contract tests 和 repo-native verification。

## Retired surfaces

- Retired: `readTargetAgent(targetAgentDir, fallback)` fallback identity interface.
- Retired fallback identities:
  - `domain_id: path.basename(targetAgentDir)`
  - `domain_label: path.basename(targetAgentDir)`
  - `delivery_domain: external_opl_compatible_agent`
- Retired test shape: `tests/contracts-generated-surfaces.test.ts` assertions that locked exact prose in `docs/references/opl-meta-agent-ideal-state.md`.

## Replacement owner surfaces

- Target-agent identity now comes only from `<target-agent>/contracts/domain_descriptor.json`.
- Missing descriptor fails closed before suite, receipt, candidate or work-order artifacts are written.
- Missing `domain_id` fails closed before suite, receipt, candidate or work-order artifacts are written.
- Target-agent generic vocabulary remains machine-checked through `contracts/foundry_agent_series.json` and source/action-surface scans, not by pinning reference-doc wording.

## Why retired

OMA target-agent intake is a contract boundary. Synthesizing a target identity from the directory basename or `external_opl_compatible_agent` preserved a compatibility path that could make a non-conforming target look admissible. The descriptor contract is the source of truth, so missing identity must stop intake rather than create a best-effort identity.

Reference docs are human-readable support material. Locking exact prose in tests made wording act like a machine contract and conflicted with the repo rule that contracts, schemas, source behavior and generated outputs carry stable assertions.

## Changed surfaces

- `scripts/lib/meta-agent-loop-io.ts` now exposes `readTargetAgent(targetAgentDir)` and requires `contracts/domain_descriptor.json` plus non-empty `domain_id`.
- `scripts/takeover-agent.ts` and `scripts/improve-from-agent-lab-suite.ts` call `readTargetAgent` without fallback identity inputs.
- `tests/takeover-loop.test.ts` covers missing descriptor and missing `domain_id` fail-closed behavior before takeover artifacts are written.
- `tests/external-suite-reviewer-gates.test.ts` covers missing descriptor and missing `domain_id` fail-closed behavior before developer work-order or candidate artifacts are written.
- `tests/contracts-generated-surfaces.test.ts` now asserts machine-readable target-agent generic vocabulary policy fields instead of matching ideal-state prose.

## No-resurrection rule

Do not restore a fallback parameter on `readTargetAgent`, and do not synthesize target-agent identity from path basename, suite refs, handoff policy, or `external_opl_compatible_agent`. New target-agent intake callers must read `contracts/domain_descriptor.json` and fail closed when the descriptor or `domain_id` is absent.

Do not reintroduce tests that pin exact prose from `docs/references/opl-meta-agent-ideal-state.md`. Stable assertions should target contracts, schemas, source behavior, generated surfaces, CLI/API output or artifact structure.

## Verification

Run from the OMA repo root after this lane:

```bash
rtk scripts/run-with-repo-temp-env.sh node --test tests/takeover-loop.test.ts tests/external-suite-reviewer-gates.test.ts tests/external-suite-developer-work-order.test.ts tests/contracts-generated-surfaces.test.ts
rtk npm run typecheck
rtk npm test
rtk git diff --check
rtk rg -n "^(<<<<<<<|=======|>>>>>>>)" .
```

Expected behavior: target-agent intake without `contracts/domain_descriptor.json` or without `domain_id` exits non-zero / throws before writing takeover suite, takeover receipt, developer patch work order or capability candidate artifacts.

Result:

- Focused Node tests passed: `16` tests, `0` failed.
- `npm run typecheck` passed.
- `npm test` passed: `76` tests, `0` failed.
- `git diff --check` passed.
- Conflict-marker scan found no matches.
