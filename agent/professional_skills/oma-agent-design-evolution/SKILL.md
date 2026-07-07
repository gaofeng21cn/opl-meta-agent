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
- Use AI judgment here to review target-agent evolution trajectories: separate one-off execution noise from reusable design learning, baseline drift from real capability drift, target-owner dissatisfaction from OMA pack defects, and App/read-model visibility gaps from source behavior gaps.
- Use AI judgment here to turn Agent Lab and FeedbackOps evidence into the smallest correct work-order class: `stage-route`, `specialist-skill`, `tool-connector`, `quality-gate`, `read-model-currentness`, `authority-boundary`, or owner route-back. The class is a routing decision, not a contract enum to expand.
- Treat `contracts/capability_map.json`, target capability maps, and work-order policies as lightweight locators and authority guards only; they bind allowed refs and forbidden surfaces, not the design diagnosis itself.
- Do not encode evolution reasoning into token maps, scorecards, App projections, generated descriptors, or work-order schemas. If the evidence cannot support a design decision, return a typed blocker.

## Inputs

- Agent Lab result refs, independent reviewer evidence, owner feedback refs, work-order closeout refs, App/workbench projection refs, or redacted trajectory refs.
- Target capability map refs, editable surface policy, no-forbidden-write proof, owner route, rollback/version refs, and closeout readback refs.
- Existing OMA prompt, stage, skill, quality gate, and tool policy refs.

## Workflow

1. Classify the first repairable boundary: `stage-route`, `specialist-skill`, `tool-connector`, `quality-gate`, `read-model-currentness`, `authority-boundary`, `app-observability`, `trajectory-policy`, `redaction`, `team-sync`, or `owner-route`.
2. Split trajectory evidence into single-intent slices before proposing reusable learning.
3. Interpret baseline/gate movement before patch selection: a new failure, stale read model, missing owner receipt, suite-pass overclaim, or changed target expectation can route to different owners even when the same contract field is involved.
4. Bind any patch target to target-owned `capability_map`, explicit work-order policy, or OMA-owned source policy. Do not infer patch targets from package, owner-receipt, typed-blocker, or domain keywords.
5. For Agent Lab / FeedbackOps evidence, choose the owner before the patch: stage routing errors go to stage-pack / route policy; missing professional method goes to specialist-skill work order; missing materialization affordance goes to tool-connector; false pass/fail goes to quality gate; stale projection goes to read-model/currentness; authority leaks go to authority-boundary or owner route-back.
6. Emit one outcome: source/design patch work order, skill/prompt/stage-policy proposal, mechanism proposal, route-back, or typed blocker shape.
7. Keep trajectory learning proposal-only: it may create mechanism proposals, skill/prompt/stage-policy proposals, or route-back records, but it must not promote defaults, change target authority, or silently install runtime behavior.
8. Require independent reviewer, Agent Lab gate, rollback/version ref, no-forbidden-write proof, and owner closeout readback before adoption.

## Forbidden Authority

- Do not write target truth, memory body, artifact body, quality/export verdict, owner receipt body, typed blocker body, App runtime state, provider attempt, runtime queue or default promotion.
- Do not install or run trajectory daemons, team sync, registry services, or promotion machinery.
- Do not treat UX signal, canary side, suite pass, or App projection as adoption verdict.

## Legacy Redirects

The old `oma-agent-evolution` and `oma-trajectory-learning-analyst` entries redirect here.
