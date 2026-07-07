---
name: oma-agent-design-evolution
description: Use when OMA must diagnose target-agent design failures, absorb trajectory learning, or route owner-gated agent evolution without taking target-domain authority.
---

# OMA Agent Design Evolution

## Purpose

Turn Agent Lab, FeedbackOps, owner feedback, work-order closeout, App projection, and redacted trajectory refs into one OMA-owned design-evolution decision: patch OMA/target-agent source surfaces through an owner-gated work order, propose a skill/prompt/stage-policy change, route back, or return a typed blocker shape.

This skill is not MAS ScholarSkills, not xskill runtime, and not target-domain authority.

## AI-First / Contract-Light Boundary

- Use AI judgment here for root-cause classification, trajectory slice meaning, repair-boundary choice, adoption risk, and whether the next output should be a patch work order, mechanism proposal, route-back, or typed blocker.
- Treat `contracts/capability_map.json`, target capability maps, and work-order policies as lightweight locators and authority guards only; they bind allowed refs and forbidden surfaces, not the design diagnosis itself.
- Do not encode evolution reasoning into token maps, scorecards, App projections, or generated descriptors. If the evidence cannot support a design decision, return a typed blocker.

## Inputs

- Agent Lab result refs, independent reviewer evidence, owner feedback refs, work-order closeout refs, App/workbench projection refs, or redacted trajectory refs.
- Target capability map refs, editable surface policy, no-forbidden-write proof, owner route, rollback/version refs, and closeout readback refs.
- Existing OMA prompt, stage, skill, quality gate, and tool policy refs.

## Workflow

1. Classify the first repairable boundary: `stage-route`, `specialist-skill`, `tool-connector`, `quality-gate`, `read-model-currentness`, `authority-boundary`, `app-observability`, `trajectory-policy`, `redaction`, `team-sync`, or `owner-route`.
2. Split trajectory evidence into single-intent slices before proposing reusable learning.
3. Bind any patch target to target-owned `capability_map`, explicit work-order policy, or OMA-owned source policy. Do not infer patch targets from package, owner-receipt, typed-blocker, or domain keywords.
4. Emit one outcome: source/design patch work order, skill/prompt/stage-policy proposal, mechanism proposal, route-back, or typed blocker shape.
5. Require independent reviewer, Agent Lab gate, rollback/version ref, no-forbidden-write proof, and owner closeout readback before adoption.

## Forbidden Authority

- Do not write target truth, memory body, artifact body, quality/export verdict, owner receipt body, typed blocker body, App runtime state, provider attempt, runtime queue or default promotion.
- Do not install or run trajectory daemons, team sync, registry services, or promotion machinery.
- Do not treat UX signal, canary side, suite pass, or App projection as adoption verdict.

## Legacy Redirects

The old `oma-agent-evolution` and `oma-trajectory-learning-analyst` entries redirect here.
