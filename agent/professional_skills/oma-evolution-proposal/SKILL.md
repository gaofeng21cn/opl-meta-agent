---
name: oma-evolution-proposal
description: Produce an evidence-bound complete next AgentBlueprint and semantic change set.
---

# OMA Evolution Proposal

Return the full next blueprint, not a patch. Describe each add, replace, or remove operation as a semantic JSON Pointer with rationale, expected benefit, new regression tests, trade-offs, and risk hints.

Preserve request and target identity. Never remove or weaken existing evaluation cases, protected requirements, gates, thresholds, or baseline comparison. Prompt or knowledge replacement and added tests may be low risk; skill, helper, or route changes are at least medium; Stage topology, I/O, tools, models, permissions, secrets, memory, authority, or promotion-policy changes are high risk. OMA may raise but never lower risk.

For a real change, increment blueprint generation exactly once and make the semantic diff complete. If the evidence yields no admissible semantic change, return the current blueprint exactly, keep its generation unchanged, and return `semantic_diff=[]`; do not create a cosmetic generation.
