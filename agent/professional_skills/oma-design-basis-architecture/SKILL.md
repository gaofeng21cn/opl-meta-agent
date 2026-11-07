---
name: oma-design-basis-architecture
description: Admit design evidence and turn an Agent mission into a coherent Stage and authority architecture.
---

# OMA Design Basis Architecture

Apply the methods relevant to the current Stage's task. The Stage main prompt
owns the objective, deliverable, and continuation decision.

## Intent And Evidence

Interpret the desired user outcome before selecting an implementation. Compare
each proposed requirement with the request, acceptance criteria, non-goals, and
constraints. Distinguish a user requirement from a solution suggested by a source
or by the designer. Preserve request-bound identifiers while explaining intent.

For a source-derived claim, identify its support, limitations, and relevance to
the target. Transfer a practice by the problem it solves and the conditions that
make it work. Explain an adaptation when those conditions differ; label an
unsupported extension as an assumption rather than target-domain truth.

Before an additional search, name the unresolved design judgment and what evidence
could change it. When the supplied material is sufficient to distinguish adopted
requirements, adaptations, assumptions, and consequential gaps, synthesize the
usable design basis and hand it on. Reopening the same sources or expanding into
implementation details without new contradictory evidence adds no design support.
Preserve supplied provenance; byte attestation and runtime diagnosis remain with
Framework. This stopping rule is semantic, not a fixed search count or word limit.

## Profile Fit

Interpret natural-language intent, including negation and multilingual context, before recommending any reusable Profile. An explicitly selected Profile or canonical intent signal is an input to inspect, not evidence that its requirements fit the mission. Treat catalog Profiles as lower-bound conformance guardrails, never universal Agent templates. Preserve reference sources and their transferable-pattern evidence as design sources; justify adopted or rejected requirements in the existing design basis and Blueprint. Framework resolves explicit Profile refs and exact canonical signals and validates their ABI; it does not infer design fit from words in the intent. A `semantic_profile_selection_required` readback calls for this semantic judgment through the existing `engineer-agent` design flow, without adding a separate public action or runtime.

## Stage And Content Design

For human-Agent collaboration, apply the surface-selection and reuse guidance in
the bound Transferable Agent Practices knowledge. Consider the shared standard
MCP App for visual review and approval; retain tool-only or standalone surfaces
when the actual interaction calls for them. Record the rationale, reused owner
capabilities, data/action boundary, and host acceptance needs in the existing
architecture. Reassess an existing Agent's surface during takeover or improvement
when evidence shows repeated navigation or a duplicated approval/state mechanism.

Trace a public action from its input through semantic decisions to the accepted
artifact. Assign each decision an owner and identify the context, output, and
quality judgment required at that boundary. Split when there is a distinct open
judgment or a handoff that needs independent acceptance. Different tools,
knowledge sources, or techniques can serve one Stage; they do not automatically
require separate Stages. Preserve the shared OPL Standard Agent structure.

Test a proposed split by removing it mentally: if the remaining Stage can still
own a coherent decision and accepted result, prefer that simpler design. Keep
deterministic generation and validation as Stage-internal obligations executed
by OPL. Do not replace open semantic judgment with a private procedural runner.

Assess each main prompt by reading it with its declared input context and bound
professional methods. It should let the Agent perform the work and determine
whether the output is usable. Put task-specific orchestration and acceptance in
that prompt, reusable techniques in Skills, and factual context in knowledge.
For blueprint assembly, check both directions: every required artifact has a
producer and consumer, and every referenced content asset supports an admitted
decision. Return semantic designs, never physical execution instructions.
