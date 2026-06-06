# 2026-06-06 OMA registry/App evidence-tail SSOT closeout

Owner: `opl-meta-agent`
Purpose: `oma_registry_app_evidence_tail_docs_governance_closeout`
State: `history_provenance`
Machine boundary: Human-readable closeout ledger. Current registry/App truth stays in OMA contracts, OPL generated-interface/read-model output, App/OPL receipts, and tests.

## Snapshot

- Repo: `/Users/gaofeng/workspace/opl-meta-agent`
- Semantic theme: `registry/App evidence tail versus generated surface readiness claims`
- Governance mode: SSOT-first content-level audit. Separate refs-only registration/projection readiness from OPL/App live consumption, production readiness, App live rendering, and default promotion.

## Single Source Of Truth

Machine SSOT:

- `contracts/opl_domain_manifest_registration.json`
  - owns OMA domain registry metadata refs, `registry_owner = one-person-lab`, discovery receipt shape, safe action route refs, and blocked claims.
- `contracts/app_workbench_projection.json`
  - owns App/workbench projection sections, drilldown readiness receipt shape, blocker/receipt fields, and `live_rendering_status = not_claimed_by_contract`.
- `contracts/generated_surface_handoff.json`
  - owns generated-surface handoff refs, generated surface owner, registry/App receipt refs, and generated surface descriptors.
- `contracts/production_acceptance/meta-agent-production-acceptance.json`
  - owns production-consumption refs-only follow-through, historical typed blocker provenance, future cohort evidence refs, and no-readiness authority boundary.
- `tests/contracts-generated-surfaces.test.ts` and `tests/contracts-production-acceptance.test.ts`
  - prove the contracts stay refs-only, OPL/App-owned, and forbidden from claiming target truth, quality/export verdict, App live rendering, production/domain readiness, or default promotion.
- OPL live read-model / CLI evidence:
  - `bin/opl runtime oma-production-consumption list --json`
  - `bin/opl agents interfaces --repo-dir /Users/gaofeng/workspace/opl-meta-agent --json`

Human-doc owners:

- `docs/active/opl-meta-agent-ideal-state-gap-plan.md`
  - single Active Truth owner for completion/gap/prompt, including registry/App evidence tail and generated-surface no-overclaim wording.
- `docs/status.md`
  - current active summary.
- `docs/architecture.md`
  - owner split and registration / product projection explanation.
- `docs/docs_portfolio_consolidation.md`
  - lifecycle and no-overclaim rules.

## Peer Docs Classification

| Document / section | Classification | Action |
| --- | --- | --- |
| `docs/active/opl-meta-agent-ideal-state-gap-plan.md` / current conclusion, progress rows, evidence gaps, next prompt | `covered_by_ssot` active plan | Already separates generated interface / registry / App projection input from App live rendering, production/domain readiness, future cohorts, long-soak, and owner receipt evidence. No edit. |
| `docs/status.md` / Generated registry App projection, evidence tail, forbidden claims | `covered_by_ssot` current summary | Already points to contracts and says registry/App shell/live rendering remain OPL/App owner surfaces. No edit. |
| `docs/architecture.md` / Registration And Product Projection and Generated Interfaces | `covered_by_ssot` support explanation | Already states registration/App projection are refs-only input, not landing completion proof, and live consumption must come from OPL/App receipts. No edit. |
| `docs/docs_portfolio_consolidation.md` / lifecycle rules | `covered_by_ssot` lifecycle guard | Already forbids upgrading generated interface, registry readiness, App projection readiness, or OPL refs-only consumption into production/domain/App live/default-promotion claims. No edit. |
| `README.md`, `README.zh-CN.md` technical/operator sections | `more_specific_detail` | Public/operator entries mention contracts as refs-only consumption inputs and forbid App live/default promotion overclaims. They do not own the evidence tail. No edit. |
| `docs/active/opl-private-implementation-migration-inventory.md` / registry App migration candidate notes | `more_specific_detail` | Keeps script/private implementation boundaries and OPL/App owner split. It does not own registry/App consumption completion. No edit. |
| `docs/history/process/*.md` prior process records | `history_or_provenance` | Dated process records are provenance only; current status returns to active/core docs and contracts. |

No conflicts with the SSOT were found. This lane closed as a verification-and-ledger lane rather than a rewrite lane.

## Live Evidence Read

Commands run from `/Users/gaofeng/workspace/one-person-lab`:

```bash
rtk bin/opl runtime oma-production-consumption list --json
rtk bin/opl agents interfaces --repo-dir /Users/gaofeng/workspace/opl-meta-agent --json
```

Observed current evidence:

- `oma-production-consumption` returns `receipt_count = 2`; both receipts have `receipt_status = verified`; authority boundary is `refs_only = true`, `can_claim_domain_ready = false`, and `can_claim_production_ready = false`.
- Generated interface bundle returns `status = ready`, `owner = one-person-lab`, `generated_surface_owner = one-person-lab`, `domain_repo_can_own_generated_surface = false`, `source_contract_consumption.status = ready`, and `blocker_reasons = []`.
- Generated interface authority boundary says it cannot write domain truth, memory body, quality/export verdict, or artifacts; `provider_completion_is_domain_ready = false`.

## Modifications

- Added this closeout under `docs/history/process/`.
- Updated `docs/history/process/README.md` to index this closeout.

No current active/core/support doc was edited because peer docs already align to the machine SSOT and live OPL read-model output.

## Verification

Commands run from `/Users/gaofeng/workspace/opl-meta-agent` unless noted:

```bash
rtk rg -n "registry|registration|App|workbench|drilldown|generated surface|generated interface|projection|live rendering|render|production ready|production readiness|readiness|ready_for_app|discovery_receipt|app_drilldown|production_consumption|long_soak|domain ready|default promotion" README* docs/**/*.md
rtk /Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json
```

Result:

- Targeted scan found the relevant active/core/public wording guarded by refs-only, owner-boundary, no-overclaim, or evidence-tail statements; no current doc claims OMA owns registry/App shell, App live rendering, production ready, domain ready, quality/export verdict, owner receipt, or default promotion.
- `opl-doc-doctor` result should remain a preflight risk map only; current truth comes from contracts, tests, and OPL live read-model output above.

## Remaining Scope

This lane covers only the registry/App evidence-tail wording boundary. It does not complete full OMA docs governance.

Carry forward:

- Real target patch-loop scaleout, independent reviewer evidence, standard target-agent handoff convergence, and script-to-pack hygiene remain active OMA lanes.
- Future App live rendering / screenshot / runtime drilldown evidence must be produced by OPL/App owner surfaces and folded back into the active plan without turning generated interface readiness into production readiness.
- Any future doc that treats `discovery_receipt_ready`, `drilldown_readiness_receipt_ready`, generated-interface `ready`, or OPL refs-only production-consumption receipt as App live rendering, domain ready, production ready, owner receipt, quality/export verdict, or default promotion must be rewritten or tombstoned.

## Next Write Scope

Recommended next OMA lane:

- Semantic theme: `real target patch-loop evidence versus work-order shape proof`
- Candidate SSOT owner: `contracts/real_target_agent_scaleout_evidence.json`, `contracts/production_acceptance/meta-agent-production-acceptance.json`, `tests/external-suite-*.test.ts`, OPL work-order execution receipts, and target owner receipt / typed blocker refs.
- Peer docs: `docs/active/opl-meta-agent-ideal-state-gap-plan.md`, `docs/status.md`, `docs/architecture.md`, `README*`, and `docs/history/process/*.md`.
