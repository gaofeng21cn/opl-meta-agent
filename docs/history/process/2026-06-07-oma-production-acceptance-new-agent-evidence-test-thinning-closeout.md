# OMA production acceptance new-agent evidence test thinning closeout

Owner: `opl-meta-agent`
Purpose: `production_acceptance_new_agent_evidence_test_owner_thinning`
State: `historical_closeout`
Machine boundary: 本文只记录 OMA production acceptance 测试收薄的范围、替代测试 owner、验证和 no-resurrection 规则。当前 production acceptance truth 继续归 `contracts/production_acceptance/meta-agent-production-acceptance.json`、`contracts/production_acceptance/new_agent_consumption_evidence.json` 和 repo-native tests。

## Retired duplicate assertions

Retired from `tests/contracts-production-acceptance.test.ts`:

- Direct body assertions for `contracts/production_acceptance/new_agent_consumption_evidence.json` stage-pack v2 details.
- Direct body assertions for new-agent consumed surfaces, AI reviewer verdict, historical fixture lane and forbidden claims.
- Authority-boundary body assertions for new-agent consumption evidence inside the production acceptance aggregate test.

Those assertions duplicated a sibling evidence contract while making the production acceptance test a second owner of new-agent evidence semantics.

## Replacement owner

- `tests/contracts-production-acceptance.test.ts` now validates production acceptance refs, receipt chain, generated-agent requirement refs and repo source-ref existence.
- `tests/new-agent-consumption-evidence.test.ts` owns `new_agent_consumption_evidence.json` body semantics, including stage-pack v2 conformance, repeat current-scaffold cohorts, no-readiness upgrade, historical fixture lane and forbidden-authority boundary.
- `contracts/production_acceptance/meta-agent-production-acceptance.json` remains the aggregate acceptance receipt. It may reference the new-agent evidence contract, but it must not duplicate that contract's detailed body assertions in production acceptance tests.

## No-resurrection rule

Do not restore detailed `new_agent_consumption_evidence.json` body assertions to `tests/contracts-production-acceptance.test.ts`. New assertions about that evidence body belong in `tests/new-agent-consumption-evidence.test.ts` or a narrower evidence-owner test.

Production acceptance tests may still read the evidence contract to resolve `source_refs` and prove that acceptance refs point at an existing current source.

## Verification

Run from the OMA repo root after this lane:

```bash
rtk node --test tests/contracts-production-acceptance.test.ts tests/new-agent-consumption-evidence.test.ts
rtk npm test
rtk npm run typecheck
rtk git diff --check
rtk /Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json
```

Expected behavior:

- Production acceptance focused tests pass while only owning acceptance aggregate and ref-link semantics.
- New-agent consumption evidence focused tests pass while owning the detailed evidence body and no-readiness boundary.
- TypeScript accepts the test owner split.
- Diff whitespace check passes.
- Doc doctor reports no lifecycle or taxonomy findings.
