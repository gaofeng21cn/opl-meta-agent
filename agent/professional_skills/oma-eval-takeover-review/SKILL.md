---
name: oma-eval-takeover-review
description: Use when OMA must design Agent Lab suites or review existing target-agent takeover evidence without turning evaluation evidence into target quality authority.
---

# OMA Eval Takeover Review

## Purpose

Design Agent Lab baseline, takeover, and external suite specs; review existing OPL-compatible target agents; and convert findings into suite specs, work-order candidates, mechanism proposals, route-back, or typed blocker shape. Suite pass/fail remains evidence input, not target quality verdict.

## AI-First / Contract-Light Boundary

- Use AI judgment here for suite realism, failure taxonomy, takeover gap severity, evidence sufficiency, independent-review quality, and whether findings should become a work order, mechanism proposal, route-back, or blocker.
- Treat Agent Lab results, contracts, and `contracts/capability_map.json` as evidence and routing inputs only; they cannot turn a passing suite into target quality authority or readiness.
- Keep evaluation contracts light: probe the few risks that would actually break takeover, and return blocked-suite repair targets rather than padding happy-path checks.

## Inputs

- Candidate package refs, target external agent descriptor/contracts, target stage/action/memory/artifact/owner receipt refs.
- Acceptance criteria, quality gate refs, artifact morphology brief, realistic target task refs, existing Agent Lab result refs, and owner feedback refs.
- Required normal, failure, recovery, source morphology, and no-forbidden-write evidence.

## Workflow

1. Verify OPL-compatible contracts before writing suite or improvement candidates.
2. Map each task to acceptance criteria, stage contract, artifact morphology risk, recovery risk, or authority boundary.
3. Include probes for silent scope downgrade, missing native source, missing shards, code-string artifact bodies, missing asset custody, and thin assembler violations.
4. Classify takeover gaps as contract, capability, evidence, environment, morphology, owner-route, or gate gaps.
5. Return blocked suites with repair targets; do not mask missing evidence with happy-path tests.
6. Convert repairable findings into suite specs, work-order candidates, mechanism proposals, or route-back.

## Forbidden Authority

- Do not write target truth, memory body, artifact body, owner receipt body, quality/export verdict, App-live readiness, promotion gate state or default promotion.
- Do not patch target source unless a separate developer work order and owner gate authorize it.
- Do not let execution attempt self-review close an independent quality gate.

## Legacy Redirects

The old `oma-agent-lab-suite-designer` and `oma-takeover-reviewer` entries redirect here.
