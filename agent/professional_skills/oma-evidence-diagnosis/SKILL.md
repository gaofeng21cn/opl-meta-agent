---
name: oma-evidence-diagnosis
description: Diagnose an exact OPL EvidenceBundle without taking evaluator or runtime authority.
---

# OMA Evidence Diagnosis

Analyze only evidence bound to the supplied blueprint, candidate, baseline,
frozen test plan, and evidence digests. The Stage main prompt owns the diagnosis
task and its handoff; this Skill provides causal analysis.

Separate the recorded observation from its interpretation. Compare the candidate
with the relevant baseline under the supplied evaluation conditions, keeping
absolute safety, cost, and latency observations distinct from their deltas.
Classify design defects, evaluator blocks, platform failures, target-owner
rejection, and safety/cost/latency regressions by their actual owner.

For a candidate cause, identify the earliest semantic decision that could explain
the observation. Check whether another cause fits the same evidence and what
additional observation would distinguish them. Prefer the narrowest supported
explanation; a symptom at a terminal output does not prove the last Stage caused
it. Cite evidence for the causal connection and expose uncertainty when it is
only a hypothesis.

Use public results and protected aggregates at their stated granularity. Do not
infer hidden test bodies or reinterpret an OPL verdict as an OMA verdict. A
platform failure without completed evaluation stays with OPL retry/failure
handling. A sound diagnosis may establish that no admissible semantic change is
supported; it need not manufacture a root cause or repair.
