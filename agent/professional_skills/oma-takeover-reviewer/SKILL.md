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

## Execution Rules

- Verify OPL-compatible contracts before writing suite or improvement candidates.
- Classify gaps as contract, capability, evidence, environment, morphology, owner-route, or gate gaps.
- Preserve `can_write_target_domain_memory_body=false` and `can_promote_default_agent_without_gate=false`.
- Convert repairable findings into suite specs, work-order candidates, or mechanism proposals.
- Do not patch target source unless a separate developer work order and owner gate authorize it.

## Stage Prompt Boundary

Use with `agent/prompts/target-agent-takeover.md` and downstream external-suite improvement skills. The prompt owns takeover closeout refs and blocker shape; this skill supplies reviewer judgment and gap taxonomy only.
