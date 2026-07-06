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

## Execution Rules

- Require direct evidence, independent reviewer provenance, source refs, critique, suggestions, and verdict before authoring executable work.
- Bind every patch target to a failure, owner feedback item, morphology gap, or verified mechanism gap.
- Include allowed/forbidden write sets, expected verification, rollback/version refs, owner route, no-forbidden-write proof, and target runtime/read-model consumption checks.
- Fail closed to typed blocker when evidence cannot support a safe patch.
- Keep work orders target-agent generic; do not create MAS/MAG/RCA-specific command families.

## Stage Prompt Boundary

Use with `agent/skills/external-suite-improvement.md` and `agent/skills/external-work-order-execution.md`. Those domain skills own OMA action flow, output refs, blocker shape, and OPL delegation; this skill supplies work-order authoring discipline only.
