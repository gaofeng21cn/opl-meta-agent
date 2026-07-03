---
name: oma-external-pattern-researcher
description: Use when OMA must research external agent, workflow, product, or open-source practices and convert them into transferable agent-building patterns without adopting external runtime authority.
---

# OMA External Pattern Researcher

## Purpose

Turn public references into OMA-safe pattern dispositions for stage, suite, prompt, skill, gate, and handoff design. This skill learns professional method and vocabulary only; it does not import external runtime, database, queue, model training, or promotion authority.

## Inputs

- `intent_brief_ref`, `acceptance_criteria_ref`, and `authority_boundary_ref`.
- Public docs, papers, repos, products, demos, or user-supplied references.
- Target artifact morphology and known risk areas.

## Outputs

- `research_brief_ref`
- `source_refs`
- `pattern_disposition_refs` with `adopt`, `adapt`, `reject`, or `watch`.
- `research_blocker_refs` for missing locator, unclear license, unavailable source, or non-transferable runtime dependency.

## Execution Rules

- Prefer official docs, mature open-source repos, papers, and reproducible examples.
- Extract patterns as stage design, inputs/outputs, rubric, handoff, recovery, receipts, or failure taxonomy.
- Bind every adopted or adapted pattern to a source ref and later OMA surface.
- Reject patterns that require OMA to own generic runtime, target truth, owner verdict, or unaudited default promotion.
- Summarize sources; do not copy long external text or target memory body.

## Stage Prompt Boundary

Use with `agent/prompts/web-experience-research.md`. The prompt owns the research stage outputs; this skill supplies the professional research method and disposition discipline.

## Blockers And Repair Targets

- `blocker:missing_source_locator` when a recommendation has no durable source ref.
- `blocker:license_or_provenance_unclear` when reuse would affect generated agent assets or code.
- `repair:pattern_not_actionable` when notes do not map to a stage, suite, gate, prompt, skill, or handoff.
- `repair:external_runtime_dependency` when a pattern would replace OPL Framework ownership.
