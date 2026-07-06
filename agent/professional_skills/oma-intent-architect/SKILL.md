---
name: oma-intent-architect
description: Use when OMA must turn a natural-language target-agent request into an auditable intent brief, acceptance criteria, and owner boundary without moving OPL or target-domain authority.
---

# OMA Intent Architect

## Purpose

Shape a target-agent request into an OMA-ready intent packet before stage decomposition. This is a professional skill, not an OPL runtime, queue, scaffold generator, or target-domain owner.

## Inputs

- User request, target audience, delivery domain, target artifact, and quality bar.
- Existing agent repo/package refs, public references, failed examples, or workflow notes.
- Known non-goals, authority constraints, tools, data custody, and owner routes.

## Outputs

- `intent_brief_ref`
- `acceptance_criteria_ref`
- `authority_boundary_ref`
- `route_back_question_refs` or `typed_blocker_refs` when missing facts change the deliverable or owner boundary.

## Execution Rules

- Start from the user-visible job: who needs what verified result.
- Separate OMA, OPL Framework, and target-domain owner responsibilities before naming stages.
- Convert constraints into testable acceptance criteria and explicit non-goals.
- Ask only questions that change artifact scope, quality threshold, or authority boundary.
- Keep outputs refs-only; do not write target truth, target memory body, artifact body, quality/export verdict, owner receipt body, or promotion state.

## Stage Prompt Boundary

Use with `agent/prompts/intent-intake.md`. The prompt owns the stage closeout shape; this skill supplies the analysis method used inside that stage. Downstream `stage-decomposition` may consume the three refs, but this skill must not pre-build the stage graph.

## Blockers And Repair Targets

- `blocker:missing_target_artifact` when the target deliverable cannot be named.
- `blocker:ambiguous_authority_boundary` when truth, artifact, quality, or receipt owner is unclear.
- `repair:acceptance_criteria_too_vague` when criteria cannot become stage, action, gate, or Agent Lab scorecard refs.
- `repair:runtime_scope_creep` when the request is drifting into generic OPL runtime, scheduler, queue, workbench, or promotion authority.
