# OMA meta-agent-loop facade retirement closeout

Owner: `opl-meta-agent`
Purpose: `meta_agent_loop_reexport_facade_retirement_closeout`
State: `historical_closeout`
Machine boundary: 本文只记录 `scripts/lib/meta-agent-loop.ts` re-export facade 退役的范围、证据和 no-resurrection 规则。当前机器真相继续归 source imports、`runtime/authority_functions/meta-agent-authority-functions.json`、`contracts/functional_privatization_audit.json`、production acceptance contracts 和 `tests/source-purity.test.ts`。

## Retired surface

- Retired: `scripts/lib/meta-agent-loop.ts`
- Replacement owner surfaces:
  - `scripts/lib/meta-agent-loop-io.ts` owns OPL CLI invocation, stable id, JSON read/write and target-agent descriptor reads.
  - `scripts/lib/meta-agent-loop-ai-reviewer.ts` owns AI reviewer evaluation loading, validation, receipt fields and acceptance gates.
  - `scripts/lib/meta-agent-loop-receipts.ts` owns Agent Lab suite, owner receipt, learning candidate, mechanism proposal, real-target delivery receipt and scaleout ledger builders.
- Authority-function implementation refs now point to `scripts/build-agent-baseline.ts` and `scripts/lib/meta-agent-loop-receipts.ts`; IO/reviewer helpers remain direct helpers, not minimal authority owners.

## Why retired

The facade only re-exported the three real helper modules. After all active callers imported the concrete helpers directly, keeping the facade would preserve a compatibility import path with no independent authority boundary. OMA's current source-purity policy prefers explicit authority refs and direct retained helpers over aggregate compatibility surfaces.

## Changed surfaces

- Source imports in action and helper scripts now target `meta-agent-loop-io.ts`, `meta-agent-loop-ai-reviewer.ts` and `meta-agent-loop-receipts.ts` directly.
- `runtime/authority_functions/meta-agent-authority-functions.json` removed the facade from script classifications, scanned script refs and retention gates; it records `meta_agent_loop_reexport_facade` as a retired materializer tail.
- `contracts/functional_privatization_audit.json` and `contracts/production_acceptance/meta-agent-production-acceptance.json` replaced current facade refs with the concrete helper refs.
- `tests/source-purity.test.ts` now guards that the retired facade path is absent.
- `docs/active/opl-private-implementation-migration-inventory.md` and `docs/references/opl-meta-agent-ideal-state.md` describe direct helper ownership as the current state.

## No-resurrection rule

Do not restore `scripts/lib/meta-agent-loop.ts` or a new aggregate re-export facade for compatibility. New callers must import the concrete helper whose responsibility they need. Stable policy or vocabulary should move to `agent/`, `contracts/`, `runtime/authority_functions/` or an OPL primitive instead of a new aggregate helper.

## Verification

Run from the OMA repo root after this lane:

```bash
rtk npm run typecheck
rtk node --test tests/source-purity.test.ts
rtk npm test
rtk rg -n "from './lib/meta-agent-loop\\.ts'|from './meta-agent-loop\\.ts'|from '../meta-agent-loop\\.ts'|scripts/lib/meta-agent-loop.ts" scripts tests contracts runtime docs README.md package.json
rtk git diff --check
```

Expected scan result: only this closeout, retired-tail contract/test guard, and no-resurrection docs may mention `scripts/lib/meta-agent-loop.ts`; no source import may target the retired facade.
