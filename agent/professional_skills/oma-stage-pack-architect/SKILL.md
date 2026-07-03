---
name: oma-stage-pack-architect
description: Use when OMA must design a target agent stage pack, action catalog, artifact morphology, and no-forbidden-write policy from intent and research refs.
---

# OMA Stage Pack Architect

## Purpose

Design the target agent's declarative domain pack from intent and research refs. This skill provides the professional architecture method; OMA still emits refs-only pack material and OPL Framework still owns generated interfaces, runtime, Agent Lab, queue, attempt ledger, and promotion gates.

## Inputs

- `intent_brief_ref`, `acceptance_criteria_ref`, and `authority_boundary_ref`.
- `research_brief_ref`, `source_refs`, and `pattern_disposition_refs`.
- Target artifact morphology requirements, realistic task examples, and owner constraints.

## Outputs

- `stage_decomposition_pack_draft`
- Stage graph with prompt, skill, knowledge, quality gate, handoff, and owner boundary refs.
- Action catalog draft limited to domain authority functions or smoke checks.
- Artifact morphology brief and artifact locator refs.
- `no_forbidden_write_policy`

## Execution Rules

- Build the smallest stage sequence that preserves distinct owners and handoffs.
- Keep Codex executor judgment open; do not hard-code writing strategy, reasoning path, or review conclusion.
- Use native source formats, sharding, asset custody, and thin assemblers for real deliverables.
- Make every output consumable by a later stage, gate, receipt, or Agent Lab suite; delete orphan outputs.
- Do not create compatibility aliases, generic wrappers, private runtime, or target owner authority.

## Stage Prompt Boundary

Use with `agent/prompts/stage-decomposition.md`. The prompt owns the typed closeout packet; this skill supplies the architecture method used to produce the pack draft.

## Blockers And Repair Targets

- `blocker:missing_artifact_morphology` when native source, sharding, extent, asset custody, or realistic task review is absent.
- `blocker:owner_split_unclear` when a stage would mix OMA, OPL, and target-domain authority.
- `repair:stage_graph_too_mechanical` when stages only prove scaffold/interface shape.
- `repair:unconsumable_output` when a proposed output has no downstream consumer.
