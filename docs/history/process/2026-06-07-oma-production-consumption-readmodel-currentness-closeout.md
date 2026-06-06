# 2026-06-07 OMA production-consumption read-model currentness closeout

Owner: `opl-meta-agent`
Purpose: `oma_production_consumption_readmodel_currentness_docs_governance_closeout`
State: `history_provenance`
Machine boundary: Human-readable closeout ledger. Current production-consumption truth stays in OPL live read-model output, OMA production-acceptance contracts, source/tests and target owner receipts or typed blockers.

## Snapshot

- Repo: `/Users/gaofeng/workspace/opl-meta-agent`
- Semantic theme: `OPL production-consumption read-model currentness versus active-plan dynamic receipt detail`
- Governance mode: SSOT-first content-level audit. Keep dynamic receipt counts and receipt distribution in machine/read-model surfaces, not in active current-truth prose.

## Single Source Of Truth

Machine SSOT:

- OPL live read-model:
  - `bin/opl runtime oma-production-consumption list --json`
  - owns current `receipt_count`, per-receipt `receipt_status`, refs-only receipt refs and `authority_boundary`.
- OMA production-acceptance contracts:
  - `contracts/production_acceptance/meta-agent-production-acceptance.json`
  - `contracts/production_acceptance/oma-production-consumption-long-soak-typed-blocker.json`
  - own production-consumption follow-through contract shape, historical typed-blocker provenance and no-readiness boundary.
- OPL generated-interface read-model:
  - `bin/opl agents interfaces --repo-dir /Users/gaofeng/workspace/opl-meta-agent --json`
  - owns generated-interface readiness projection and generated-surface authority boundary.

Human-doc owners:

- `docs/active/opl-meta-agent-ideal-state-gap-plan.md`
  - owns current completion/gap/prompt reading, but only as a pointer to live read-model fields and authority boundaries.
- `docs/status.md`
  - owns compact current status summary.
- `docs/history/process/2026-06-06-oma-registry-app-evidence-tail-ssot-closeout.md`
  - remains provenance for the earlier registry/App evidence-tail audit.

## Peer Docs Classification

| Document / section | Classification | Action |
| --- | --- | --- |
| `docs/active/opl-meta-agent-ideal-state-gap-plan.md` / current conclusion | `conflicts_with_ssot` | Removed frozen `2 receipts / 1 long-soak / 1 typed-blocker` wording from active truth. It now points to live `receipt_count`, per-receipt status and authority boundary. |
| `docs/active/opl-meta-agent-ideal-state-gap-plan.md` / production-consumption progress and evidence-tail rows | `covered_by_ssot` | Already states the gate is refs-only and future cohort / App live / reviewer / owner evidence remains open. No further edit. |
| `docs/status.md` / current evidence tail | `covered_by_ssot` | Already keeps production-consumption, App live rendering and independent reviewer evidence as bounded evidence tails. No edit. |
| `docs/architecture.md` / registration, product projection and patch-loop sections | `more_specific_detail` | Keeps owner split and read-model semantics; no dynamic count owner role. No edit. |
| `docs/history/process/2026-06-06-oma-registry-app-evidence-tail-ssot-closeout.md` | `history_or_provenance` | Earlier live evidence values remain dated provenance only, not active currentness. |

## Live Evidence Read

Commands run from `/Users/gaofeng/workspace/one-person-lab`:

```bash
rtk bin/opl runtime oma-production-consumption list --json
rtk bin/opl agents interfaces --repo-dir /Users/gaofeng/workspace/opl-meta-agent --json
```

Observed current evidence:

- OPL production-consumption read-model returns a refs-only ledger with dynamic `receipt_count`, verified receipt statuses and per-receipt authority boundaries.
- Each production-consumption receipt keeps `authority_boundary.refs_only = true`, `can_claim_domain_ready = false`, `can_claim_production_ready = false`, `can_create_domain_owner_receipt = false`, `can_authorize_quality_or_export = false` and `can_promote_default_agent_without_gate = false`.
- Generated-interface read-model returns `status = ready`, `owner = one-person-lab`, `generated_surface_owner = one-person-lab`, `domain_repo_can_own_generated_surface = false`, and source contract consumption `status = ready`.

## Modifications

- Rewrote the active plan's production-consumption currentness sentence so dynamic receipt counts and dated receipt distribution stay with OPL read-model output and history provenance.
- Added this closeout under `docs/history/process/`.
- Updated `docs/history/process/README.md` to index this closeout.

No contracts, source, package scripts, workflows, runtime state, generated surfaces or tests changed.

## Verification

Commands run from `/Users/gaofeng/workspace/opl-meta-agent` unless noted:

```bash
rtk rg -n "输出 2 条 receipt|1 条 verified long-soak|1 条历史 typed-blocker|receipt_count = 2" docs/active docs/status.md docs/architecture.md docs/decisions.md
rtk git diff --check
rtk rg -n "^(<<<<<<<|=======|>>>>>>>)" README* docs agent/*/README.md
rtk /Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json
```

Expected result:

- Active docs no longer freeze production-consumption receipt count or receipt distribution.
- Diff and conflict-marker checks stay clean.
- OPL Doc doctor remains a preflight risk map only; truth comes from the live read-model and contracts above.

## Remaining Scope

This lane only governs production-consumption read-model currentness wording. It does not close:

- OPL/App registry discovery receipt, App render/screenshot, runtime drilldown closeout or repeat long-soak evidence.
- Future target cohorts, true source patch / rerun / owner receipt samples, independent Codex reviewer direct-evidence verdict, or default promotion.
- Full OMA docs portfolio coverage.

## Next Write Scope

Recommended next OMA lane remains:

- Semantic theme: `future cohort evidence tails and independent reviewer direct evidence`
- Candidate SSOT owners: production acceptance contracts, OPL/App live receipts, target-owner receipt / typed blocker refs, reviewer attempt receipts, and external-suite / work-order tests.
- Peer docs: active gap plan, status, architecture, private inventory and process history.
