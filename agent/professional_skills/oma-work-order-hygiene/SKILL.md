---
name: oma-work-order-hygiene
description: Use when OMA must author bounded developer work orders or review script-to-pack/source-purity hygiene without authorizing physical deletion or target-domain writes.
---

# OMA Work Order Hygiene

## Purpose

Convert evidence into bounded refs-only developer patch work orders, typed blocker shapes, script-retention recommendations, OPL absorption candidates, deletion readiness, tombstone/provenance, or route-back. This skill authors and reviews method content only; it does not execute work orders or authorize cleanup actions.

## AI-First / Contract-Light Boundary

- Use AI judgment here for bounded work-order scope, evidence-to-patch traceability, script retention vs deletion readiness, OPL absorption fit, and when hygiene evidence is still too weak to act.
- Use AI judgment here for work-order closeout shape: choose developer patch work order, no-patch coordination, typed blocker, route-back, or owner wait based on evidence quality, owner route, verification path, and whether the change is actually actionable.
- Use AI judgment here for private residue decisions: classify private scripts/helpers as retained authority implementation, refs-only materializer, thin delegation aperture, fixture/proof helper, tombstone candidate, or OPL absorption candidate before any contract or receipt records the decision ref.
- Treat `contracts/capability_map.json`, script-to-pack receipts, source-purity contracts, and work-order schemas as compact authorization and verification indexes; they do not execute, absorb, delete, or close owner routes.
- Do not manufacture cleanup authority through extra contract fields. If active callers, parity, owner closeout, or tombstone evidence is missing, emit a route-back or typed blocker.

## Inputs

- Agent Lab suite result refs, reviewer evaluation refs, owner feedback refs, production evidence refs, script-to-pack readback, source-purity tests, script morphology policy, and private migration inventory refs.
- Target editable surface policy, no-forbidden-write proof, verification refs, rollback/version refs, owner route refs, active caller evidence, and tombstone/provenance refs.

## Workflow

1. Require direct evidence, independent reviewer provenance, source refs, critique, suggestions, and verdict before authoring executable work.
2. Bind each patch target to a failure, owner feedback item, morphology gap, or verified mechanism gap.
3. Include allowed and forbidden write sets, expected verification, rollback/version refs, owner route, no-forbidden-write proof, and target runtime/read-model consumption checks.
4. Classify scripts or helpers as `retain`, `absorb`, `delete`, `tombstone`, `route-back`, or `work-order`.
5. Require real non-self active callers, repo-local source refs, no-forbidden-write evidence, OPL primitive parity or explicit fixture/proof refs, no-active-caller evidence, and tombstone/provenance refs before recommending deletion readiness.
6. Check owner-answer shape before closeout: accepted shapes are owner receipt, typed blocker, human gate, route-back, rejected, completed-and-continue, or completed-and-wait-owner. Anything else routes back instead of being patched into a broader contract.
7. Prefer keep, route, or bounded work order before adding wrappers. `build-agent-baseline` may fail closed on missing refs, but this skill owns the contract-light choice of what those refs mean and which work-order path is justified.

## Forbidden Authority

- Do not execute work-order lifecycle, target worktree lifecycle, absorb, cleanup, owner closeout hook or physical deletion.
- Do not claim script retirement, owner receipt, typed blocker instance, OPL primitive parity, App/generated readiness, target/domain/production readiness, default promotion or target owner acceptance.
- Do not create MAS/MAG/RCA-specific command families.

## Legacy Redirects

The old `oma-work-order-author` and `oma-script-to-pack-hygiene-reviewer` entries redirect here.
