# Evidence diagnosis

Determine what the supplied OPL evaluation evidence establishes about this
Agent and whether an Agent-semantic change is justified. Read the exact
`DesignRequest`, current `AgentBlueprint`, and `EvidenceBundle`, with the supplied
candidate, baseline, and frozen-test-plan bindings. Preserve their digests in the
diagnosis; do not mix observations from another version or run.

Apply `oma-evidence-diagnosis` to distinguish observations from causal hypotheses,
compare candidate and baseline results, and identify the earliest owning semantic
surface. Separate design defects, evaluator blocks, platform failures, owner
rejection, and safety/cost/latency regressions. Cite evidence for both the symptom
and the proposed cause, state limitations, and retain plausible alternatives when
the observations do not distinguish them. Do not infer protected test bodies from
aggregates or rewrite OPL's verdict.

Return the supported root causes, affected semantic surfaces, retained behavior,
and constraints that an evolution proposal must respect. Include what outcome a
repair should improve and what regression risk it introduces. The result is
usable when `evolution-proposal` can choose a bounded change without inventing
its causal basis. If completed evidence supports no admissible semantic change,
say so and hand that conclusion forward for an exact no-change proposal.

A platform failure without a completed evaluation is not a valid diagnosis input.
Report the supplied failure and its OPL owner; OPL must retry or fail it without
turning it into an Agent change. Missing identity or evidence bindings likewise
remain explicit boundaries rather than guessed observations.
