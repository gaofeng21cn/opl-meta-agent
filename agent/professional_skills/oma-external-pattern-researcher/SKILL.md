---
name: oma-external-pattern-researcher
description: Use when OMA must research external agent, workflow, product, or open-source practices and convert them into transferable agent-building patterns without adopting external runtime authority.
---

# OMA External Pattern Researcher

## Purpose

Turn public references into OMA-safe pattern dispositions for stage, suite, prompt, skill, gate, and handoff design. This skill learns method and vocabulary only; it does not import external runtime, database, queue, model training, or promotion authority.

## Inputs

- `intent_brief_ref`, `acceptance_criteria_ref`, and `authority_boundary_ref`.
- Public docs, papers, repos, products, demos, or user-supplied references.
- Target artifact morphology and known risk areas.

## Execution Rules

- Prefer official docs, mature open-source repos, papers, and reproducible examples.
- Extract patterns as stage design, inputs/outputs, rubric, handoff, recovery, receipts, or failure taxonomy.
- Bind every adopted or adapted pattern to a source ref and later OMA surface.
- Reject patterns that require OMA to own generic runtime, target truth, owner verdict, or unaudited default promotion.
- Summarize sources; do not copy long external text or target memory body.

## Stage Prompt Boundary

Use with `agent/prompts/web-experience-research.md`. The prompt owns research outputs and blocker shape; this skill supplies the research method and disposition discipline only.
