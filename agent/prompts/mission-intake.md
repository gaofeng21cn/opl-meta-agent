# Mission intake

Turn the supplied `DesignRequest` into a precise Agent-engineering mission that
the design Stages can act on. Read the request and any supplied prior result;
retain decisions that still fit the current request instead of restarting intake.

Interpret the intended user outcome, scope, acceptance criteria, non-goals, and
delivery policy. Use `oma-design-basis-architecture` for intent interpretation
and separating supported requirements from assumptions. Explain what the target
Agent must accomplish and which observations would demonstrate success. Preserve
the exact request and target identities: `create` has a null `target_version_ref`;
`takeover|improve` bind the exact non-null baseline supplied by OPL.

Carry source refs, permission refs, privacy categories, and other constraints
forward without silently broadening or rewriting them. Distinguish a decision
that the owner must make from ordinary design uncertainty that can be stated as
an assumption. Owner authorization is resolved by OPL through its target policy
and independent receipts, outside the OMA protocol.

Return the mission decision with its supporting refs, retained constraints,
assumptions, and any specific unresolved question. It is usable when design-basis
admission can identify what evidence is relevant and architecture can identify
the behavior to design. Recommend `design-basis-admission` with that context;
flag an exact identity, currentness, or authority boundary when one prevents
work. Return semantic artifacts through the supplied StageRun contract without
inventing execution state or qualification claims.
