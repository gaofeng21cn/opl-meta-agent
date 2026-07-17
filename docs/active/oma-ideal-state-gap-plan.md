# OMA Ideal State Gap Plan

Owner: `oma`
Purpose: `single_active_truth_plan`
State: `active_truth_owner`
Machine boundary: Human-readable development baton. Machine truth lives in `contracts/`, `agent/`, tests, repository verification output, and OPL Foundry readbacks.

This is OMA's only Active Truth owner. It is rewritten from current repository truth; it is not a run log, release record, qualification verdict, activation record, or owner receipt.

## Ideal-State Reference

OMA is a pure semantic provider for OPL-compatible Agent engineering. One public `engineer-agent` action covers create, takeover, and improve. OMA decides design and evaluation semantics through `DesignRequest`, `AgentBlueprint`, `EvidenceBundle`, and `EvolutionProposal`; OPL alone owns execution and lifecycle state.

The durable target and boundaries are defined by [Project](../project.md), [Architecture](../architecture.md), and [Invariants](../invariants.md). This plan only derives current state, current gaps, and the next execution prompt from those owners.

## Current State Summary

- `contracts/action_catalog.json` exposes only `engineer-agent`.
- `contracts/foundry_provider.json` exposes internal `design` and `diagnose` operations and keeps them out of public projections.
- `agent/stages/manifest.json` binds eight semantic Stages to the design and diagnosis routes.
- `contracts/foundry_protocol_fixture_manifest.json` keeps four refs-only fixtures under OPL schema and validator authority.
- Contract tests cover the public/internal boundary, stage topology, digest lineage, forbidden fields, and exact no-change semantics.
- Current docs now have one purpose per surface, one Active Truth owner, and explicit history/no-resurrection boundaries.

## Current State vs Ideal Gaps

No confirmed functional or structural gap is open in the current repository snapshot. Live Foundry execution, qualification, activation, rollback, target-owner acceptance, release, and production adoption are OPL or target-owner evidence lanes, not OMA repository gaps.

Any future gap must be established from fresh contract, agent, test, OPL validator, or Foundry readback evidence. A doctor warning, prose preference, or missing live run alone is not authority to add a second runtime or compatibility surface.

## Next-Round Agent Prompt

```text
Task: run the next OMA development audit from the single Active Truth plan.
Cwd: /Users/gaofeng/workspace/opl-meta-agent
Goal: preserve OMA as the pure Agent-engineering semantic provider and identify only fresh, evidence-backed functional or structural gaps.
Write scope: contracts/**, agent/**, tests/**, README*.md, docs/**, and scripts/verify.sh only when the chosen gap requires them.
Non-goals: do not add OPL runtime, materialization/evaluation executors, evidence/version stores, activation/rollback machinery, target-domain truth, protected test bodies, retired public surfaces, or generated public operations for design or diagnose.
Live truth inputs: AGENTS.md, contracts/**, agent/**, tests/**, scripts/verify.sh, OPL Foundry protocol schemas/validator output, and this plan.
Required actions: fresh-check branch, remote, dirty worktrees, and owner write sets; build an authority-aware matrix; select a 3-7 item safe batch or return no_safe_batch_matrix; implement against the semantic owner; rewrite this plan to remove closed gaps and retain only current gaps.
Verification commands: scripts/verify.sh full; git diff --check; OPL Doc doctor as a read-only risk map; relative Markdown link scan.
Completion gate: land verified bytes on main, push and read back the remote ref, remove task worktrees/branches, and keep runtime/qualification/activation/release/owner/production claims fail-closed without their own evidence.
Foldback target: docs/active/oma-ideal-state-gap-plan.md
```

## Coverage Ledger

- Current governed owners: both root READMEs; all six canonical docs; this Active Truth plan; the history index; and the process-history index.
- Historical/tombstone coverage: the destructive-cutover record remains necessary no-resurrection provenance.
- Uncovered Markdown under `README*` and `docs/**/*.md`: none.
- Remaining stale or retirement candidates: none established by current live truth.
