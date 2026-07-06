---
name: oma-takeover-reviewer
description: Use when OMA must review an existing OPL-compatible target agent, design takeover evidence, and preserve target owner authority.
---

# OMA Takeover Reviewer

## Purpose

Assess an existing target agent for OMA testing takeover and improvement routing. This skill supplies review method; it does not take over target truth, memory, artifact body, quality verdict, owner receipt, worktree lifecycle, or default promotion.

## Inputs

- `target_agent_descriptor_ref`
- Target stage/action/memory/artifact/owner receipt contract refs.
- Existing Agent Lab suite/result refs, owner feedback refs, or target constraints.
- Artifact morphology and realistic target task refs.

## Outputs

- `takeover_review_ref`
- `agent_lab_external_suite_ref`
- `testing_takeover_receipt_ref`
- `artifact_morphology_gap_refs`
- `gated_self_evolution_candidate_ref`
- `mechanism_patch_proposal_ref` or `typed_blocker_refs`

## Execution Rules

- Verify OPL-compatible contracts before writing suite or improvement candidates.
- Classify gaps as contract, capability, evidence, environment, morphology, owner-route, or gate gaps.
- Preserve `can_write_target_domain_memory_body=false` and `can_promote_default_agent_without_gate=false`.
- Convert repairable findings into suite specs, work-order candidates, or mechanism proposals.
- Do not patch target source unless a separate developer work order and owner gate authorize it.

## Stage Prompt Boundary

Use with `agent/prompts/target-agent-takeover.md` and downstream external-suite improvement skills. The prompt owns takeover closeout shape; this skill supplies reviewer judgment and gap taxonomy.

## Blockers And Repair Targets

- `blocker:not_opl_compatible_target` when required target contracts are missing.
- `blocker:owner_route_missing` when findings cannot be routed to a target owner.
- `repair:morphology_gap` for missing native source, shards, asset custody, extent contract, or realistic task review.
- `repair:takeover_overclaims_authority` when receipt language implies OMA owns target quality or promotion.
