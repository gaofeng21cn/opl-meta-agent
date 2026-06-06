# OMA policy contract test retirement closeout

Owner: `opl-meta-agent`
Purpose: `policy_contract_test_projection_helper_dependency_retirement`
State: `historical_closeout`
Machine boundary: 本文只记录测试层对 script policy projection helper 直接依赖的退役范围、保留边界、验证和 no-resurrection 规则。当前 policy truth 继续归 `contracts/developer_work_order_policy.json`、`contracts/standard_foundry_policies.json`、runtime authority refs、production helper active callers 和 repo-native tests。

## Retired test dependency

Retired from OMA tests:

- `tests/source-purity.test.ts` importing `scripts/lib/work-order-policy-constants.ts` to prove developer work-order policy truth.
- `tests/source-purity.test.ts` importing `scripts/lib/standard-foundry-policies.ts` to prove standard Foundry policy truth.
- `tests/target-improvement-policy.test.ts` importing `scripts/lib/work-order-policy-constants.ts` for expected forbidden target surfaces.

Replacement:

- Tests now read `contracts/developer_work_order_policy.json` and `contracts/standard_foundry_policies.json` directly when asserting stable policy truth.
- `tests/source-purity.test.ts` includes a no-import guard so test files do not restore direct imports from the two script policy projection helpers.
- Tests still verify that the projection helper scripts are classified as retained contract projections in `runtime/authority_functions/meta-agent-authority-functions.json`.

## Retained production helpers

The projection helpers remain in source because they still have active production callers:

- `scripts/lib/work-order-policy-constants.ts` is consumed by target-improvement policy, work-order builders, work-order refs and agent evidence materialization helpers.
- `scripts/lib/standard-foundry-policies.ts` is consumed by stage-decomposition pack draft builder and validator.

These helpers may continue projecting contract JSON for active callers. They do not own policy truth, and tests must not import them as the expected policy body.

## No-Resurrection Rule

Do not restore test imports from `scripts/lib/work-order-policy-constants.ts` or `scripts/lib/standard-foundry-policies.ts` as policy truth assertions. New tests that need stable policy defaults must read the relevant contract JSON directly and assert contract shape, authority boundary and projection classification.

Do not delete the script projection helpers while active production callers remain. Helper retirement requires fresh no-active-caller evidence plus a separate tombstone or provenance closeout.

## Verification

Run from the OMA repo root after this lane:

```bash
rtk node --test tests/source-purity.test.ts tests/target-improvement-policy.test.ts
rtk npm run typecheck
rtk git diff --check
rtk /Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json
```

Expected behavior:

- Focused policy tests pass without importing the script policy projection helpers.
- TypeScript still accepts the retained production helper imports used by active callers.
- Diff whitespace check passes.
- Doc doctor reports no lifecycle or taxonomy findings.

Result:

- `rtk node --test tests/source-purity.test.ts tests/target-improvement-policy.test.ts`: passed, `10` tests, `0` failed.
- `rtk npm run typecheck`: passed after a temporary ignored `node_modules/` install; `node_modules/` was removed after verification.
- `rtk git diff --check`: passed.
- `rtk /Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json`: passed, `finding_count = 0`, `markdown_doc_count = 30`.
- Test import scan for `../scripts/lib/work-order-policy-constants.ts` and `../scripts/lib/standard-foundry-policies.ts`: no active matches under `tests/`.
