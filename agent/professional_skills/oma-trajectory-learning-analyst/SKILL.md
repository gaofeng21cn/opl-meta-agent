---
name: oma-trajectory-learning-analyst
description: Use when OMA must atomize historical trajectory evidence into refs-only learning candidates, skill/prompt/stage-policy proposals, or typed blockers.
---

# OMA Trajectory Learning Analyst

## Purpose

Analyze redacted trajectory, Agent Lab, owner feedback, or work-order closeout refs into OMA mechanism learning candidates. This skill adopts clean-room trajectory-learning method only; it does not use xskill runtime, daemon, watcher, registry, team sync, or promotion machinery.

## Inputs

- `trajectory_refs`, `stage_attempt_refs`, Agent Lab result refs, owner feedback refs, or work-order closeout refs.
- Redaction proof refs, source owner refs, team sync policy refs, and allowed consumer refs.
- UX/canary signal refs, rollback/version refs, and OMA policy refs.

## Outputs

- `trajectory_atom_refs`
- `single_intent_atom_task_refs`
- `candidate_buffer_refs`
- `skill_policy_proposal_refs`
- `prompt_policy_proposal_refs`
- `stage_policy_proposal_refs`
- `ux_canary_signal_refs`
- `redaction_team_sync_boundary_refs`
- `typed_blocker_refs`

## Execution Rules

- Split each evidence slice into one user intent and one reviewable evidence delta.
- Store refs, redacted summaries, risk notes, proposal status, and owner route only.
- Classify gaps as prompt, skill, stage-policy, quality-gate, tool-policy, suite-policy, redaction, team-sync, evidence, or owner-route gaps.
- Treat UX score, canary side, suite pass, and candidate count as evidence signals, not adoption verdicts.
- Require independent reviewer, Agent Lab gate, rollback/version, and no-forbidden-write proof before proposal adoption.

## Stage Prompt Boundary

Use with `agent/prompts/trajectory-learning-intake.md` and `agent/skills/trajectory-learning-intake.md`. The prompt and domain skill own output shape; this skill supplies atomization and learning-analysis method.

## Blockers And Repair Targets

- `blocker:missing_redaction_proof` when source material cannot be safely shared.
- `blocker:atom_boundary_ambiguous` when multiple user intents are mixed.
- `repair:candidate_buffer_becoming_queue` when proposals are treated as execution or promotion state.
- `repair:owner_route_missing` when a proposed mechanism change lacks review, rollback, or owner gate.
