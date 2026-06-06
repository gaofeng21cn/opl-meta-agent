# OMA policy projection helper physical retirement closeout

Owner: `opl-meta-agent`
Purpose: `policy_projection_helper_physical_retirement`
State: `historical_closeout`
Machine boundary: 本文只记录 OMA standalone policy projection helper 的物理退役范围、替代 owner、验证和 no-resurrection 规则。当前 policy truth 继续归 `contracts/developer_work_order_policy.json`、`contracts/standard_foundry_policies.json`、runtime authority refs、source owner helpers 和 repo-native tests。

## Retired source

Physically retired:

- `scripts/lib/work-order-policy-constants.ts`
- `scripts/lib/standard-foundry-policies.ts`

These files no longer provide an active import path, projection surface, compatibility facade or test oracle.

## Replacement owner

- `contracts/developer_work_order_policy.json` remains the developer work-order policy truth; `scripts/lib/work-order-refs.ts` is now the active owner helper that reads the contract for current materializer callers.
- `contracts/standard_foundry_policies.json` remains the standard Foundry policy truth; `scripts/lib/stage-decomposition-pack-draft-parts/shared.ts` is now the active owner helper that reads the contract for stage-decomposition builder / validator callers.
- `runtime/authority_functions/meta-agent-authority-functions.json` no longer classifies or scans the retired standalone helper files; it records contract refs on the active consumer helpers instead.

## No-resurrection rule

Do not restore `scripts/lib/work-order-policy-constants.ts`, `scripts/lib/standard-foundry-policies.ts`, or an equivalent standalone policy projection facade. New policy defaults must stay in `contracts/` and be consumed by the concrete owner helper that needs them.

## Verification

Run from the OMA repo root after this lane:

```bash
rtk node --test tests/source-purity.test.ts tests/target-improvement-policy.test.ts tests/stage-decomposition-materializer.test.ts
rtk npm run typecheck
rtk npm test
rtk git diff --check
rtk /Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json
```

Expected behavior:

- Focused source-purity and adjacent behavior tests pass.
- TypeScript accepts the direct contract consumers.
- No active source, test, contract, runtime authority ref or current doc imports the retired helper paths.
- Doc doctor reports no lifecycle or taxonomy findings.
