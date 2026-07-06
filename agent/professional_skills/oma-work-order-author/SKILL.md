---
name: oma-work-order-author
description: Use when OMA must turn Agent Lab, reviewer, or owner-feedback evidence into a refs-only developer patch work order or typed blocker.
---

# OMA Work Order Author

## Purpose

Convert evidence into a bounded developer patch work order for OPL Framework execution or target-owner handoff. This skill authors work-order method content only; it does not implement OPL work-order execution, target worktree lifecycle, absorb, cleanup, owner closeout hook, or target owner receipt body.

## Inputs

- Agent Lab suite result refs, reviewer evaluation refs, owner feedback refs, or production evidence refs.
- Target editable surface policy, no-forbidden-write proof, verification refs, rollback/version refs, and owner route refs.
- Efficiency evidence refs when present: quality floor, latency, cost, cache reuse, and target verification.

## Outputs

- `developer_patch_work_order_refs`
- `patch_traceability_matrix_ref`
- `target_capability_improvement_candidate_refs`
- `required_verification_refs`
- `mechanism_patch_proposal_refs`
- `typed_blocker_refs`
- `machine_closeout_refs`

## Execution Rules

- Require direct evidence, independent reviewer provenance, source refs, critique, suggestions, and verdict before authoring executable work.
- Bind every patch target to a failure, owner feedback item, morphology gap, or verified mechanism gap.
- Include allowed/forbidden write sets, expected verification, rollback/version refs, owner route, no-forbidden-write proof, and target runtime/read-model consumption checks.
- Fail closed to typed blocker when evidence cannot support a safe patch.
- Keep work orders target-agent generic; do not create MAS/MAG/RCA-specific command families.

## Stage Prompt Boundary

Use with `agent/skills/external-suite-improvement.md` and `agent/skills/external-work-order-execution.md`. Those domain skills own OMA action flow and OPL delegation; this skill supplies work-order authoring discipline.

## Blockers And Repair Targets

- `blocker:missing_reviewer_direct_evidence` when reviewer evidence is empty or only suite/scaffold refs.
- `blocker:missing_no_forbidden_write_proof` when target authority cannot be protected.
- `blocker:missing_quality_floor_refs` when efficiency work lacks a quality floor.
- `repair:work_order_not_executable` when allowed surfaces, verification, owner route, rollback, or closeout refs are incomplete.
