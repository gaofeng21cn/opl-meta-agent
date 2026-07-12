---
name: oma-eval-takeover-review
description: Use when OMA must design Foundry evaluation intent or review existing target-agent takeover evidence without turning evaluation evidence into target quality authority.
---

# OMA Eval Takeover Review

## Purpose

Design thin Foundry evaluation requests for baseline, takeover, and external evaluation; review existing OPL-compatible target agents; and convert findings into task intents, work-order candidates, mechanism proposals, route-back, or typed blocker shape. OPL Foundry Lab alone compiles and executes suite plans. Suite pass/fail remains evidence input, not target quality verdict.

## AI-First / Contract-Light Boundary

- Use AI judgment here for suite realism, failure taxonomy, takeover gap severity, evidence sufficiency, independent-review quality, and whether findings should become a work order, mechanism proposal, route-back, or blocker.
- Use AI judgment here to decide whether AI reviewer evidence is substantive enough for baseline/takeover delivery: provenance must point to a real independent review, `source_refs` and `direct_evidence_refs` must cover the actual target-agent work, and critique/suggestions must name actionable gaps rather than restating suite status.
- Use AI judgment here to interpret baseline and delivery gates: distinguish runnable evidence, generated-interface readiness, owner-route proof, no-forbidden-write proof, no-patch coordination, typed blocker shape, and target-domain acceptance. Gate scripts can fail closed on missing refs, but this skill decides whether present refs are meaningful.
- Use AI judgment here to assess target source morphology: native source format, artifact body owner, sharding/extent, asset custody, thin assembler boundary, and realistic target task fit. The delivery gate only checks that morphology refs exist; this skill decides whether those refs are meaningful.
- Use AI judgment here to classify Agent Lab and FeedbackOps findings into the next owner path: suite repair, stage-route repair, specialist-skill work order, tool-connector work order, quality-gate work order, read-model/currentness route-back, authority-boundary blocker, or target-owner decision.
- Treat Agent Lab results, contracts, and `contracts/capability_map.json` as evidence and routing inputs only; they cannot turn a passing suite into target quality authority or readiness.
- Keep evaluation contracts light: probe the few risks that would actually break takeover, and return blocked-suite repair targets rather than padding happy-path checks.

## Inputs

- Candidate package refs, target external agent descriptor/contracts, target stage/action/memory/artifact/owner receipt refs.
- Acceptance criteria, quality gate refs, artifact morphology brief, realistic target task refs, existing Agent Lab result refs, and owner feedback refs.
- Required normal, failure, recovery, source morphology, and no-forbidden-write evidence.

## Workflow

1. Verify OPL-compatible contracts before writing evaluation intent or improvement candidates.
2. Map each task to acceptance criteria, stage contract, artifact morphology risk, recovery risk, or authority boundary.
3. Include probes for silent scope downgrade, missing native source, missing shards, code-string artifact bodies, missing asset custody, and thin assembler violations.
4. Classify takeover gaps as contract, capability, evidence, environment, morphology, owner-route, or gate gaps.
5. Fold delivery-gate semantics back into reviewer judgment: distinguish deterministic missing refs from weak evidence, false owner-route claims, generated-surface-only proof, provider-completion-as-domain-completion, and suite-pass-overclaim.
6. Route evidence to the smallest work-order family: stage-route when the wrong stage or owner handled the work; specialist-skill when open-ended judgment is missing; tool-connector when an external/helper capability is absent or miswired; quality-gate when evidence is present but interpreted falsely; read-model/currentness when projections are stale; authority-boundary when a forbidden owner claim appears.
7. Return blocked evaluation designs with repair targets and the smallest next owner action; do not mask missing evidence with happy-path tasks.
8. Convert repairable findings into evaluation task intents, work-order candidates, mechanism proposals, route-back, or typed blocker shape. Do not author OPL-owned probes, scorecard observations, suite results, or receipts. Trajectory or FeedbackOps learning stays proposal-only until an owner-gated work order adopts it.

## Forbidden Authority

- Do not write target truth, memory body, artifact body, owner receipt body, quality/export verdict, App-live readiness, promotion gate state or default promotion.
- Do not patch target source unless a separate developer work order and owner gate authorize it.
- Do not let execution attempt self-review close an independent quality gate.

## Legacy Redirects

The old `oma-agent-lab-suite-designer` and `oma-takeover-reviewer` entries redirect here.
