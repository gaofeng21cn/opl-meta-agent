---
name: oma-evolution-proposal
description: Produce an evidence-bound complete next AgentBlueprint and semantic change set.
---

# OMA Evolution Proposal

Use the supplied root causes to compare candidate semantic repairs. Prefer
removing an unnecessary requirement or indirection, then simplifying within the
shared OPL architecture, before adding a capability. Estimate which observed
failure each candidate addresses and what retained behavior it could affect.
The Stage main prompt owns the proposal task and terminal output.

Construct the full next blueprint from the current one, preserving unaffected
decisions. Compare the two objects and describe every add, replace, or remove
operation with a semantic JSON Pointer and rationale. Check that the diff covers
the actual change and that each new evaluation case addresses the diagnosed
failure or a concrete regression risk. If a repair changes a Stage prompt or
Skill, author its usable content as part of the design rather than proposing a
title, placeholder, or repository patch.

Preserve request and target identity. Never remove or weaken existing evaluation cases, protected requirements, gates, thresholds, or baseline comparison. Prompt or knowledge replacement and added tests may be low risk; skill, helper, or route changes are at least medium; Stage topology, I/O, tools, models, permissions, secrets, memory, authority, or promotion-policy changes are high risk. OMA may raise but never lower risk.

Weigh expected benefits against safety, cost, latency, and uncertainty using the
available evidence. A speculative improvement does not justify relaxing an
existing obligation. For a real change, increment blueprint generation exactly
once and make the semantic diff complete. If the evidence yields no admissible
semantic change, return the current blueprint exactly, keep its generation
unchanged, and return `semantic_diff=[]`; do not create a cosmetic generation.
