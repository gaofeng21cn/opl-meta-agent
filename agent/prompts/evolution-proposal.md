# EvolutionProposal authoring

Turn the evidence-bound diagnosis into the smallest admissible improvement, or
an exact no-change proposal. Read the supplied request, current blueprint,
`EvidenceBundle`, and root-cause analysis. Use `oma-evolution-proposal` to choose
changes, construct a complete semantic diff, and assess risk and non-regression.

For each proposed change, connect the diagnosed cause to the behavior expected
to improve and the evidence a new evaluation must collect. Compare deletion,
simplification, and replacement within the target's standard architecture before
adding machinery. Preserve working behavior and explain trade-offs; do not
create a change merely to produce another generation.

Author the full next `AgentBlueprint` and any changed content, including complete
Stage main prompts and professional methods where those are the repair. Retain
exact request and target identity, input digest bindings, permissions, public
cases, protected requirements, gates, thresholds, and baseline comparison. Return
an `EvolutionProposal` with the next blueprint, semantic JSON-Pointer diff,
expected benefits, additional tests, trade-offs, and risk hints. A real change
increments generation exactly once. When no admissible semantic change follows
from the evidence, preserve the current blueprint exactly, including generation,
and return an empty semantic diff and no invented new tests.

Check the proposed object against the current blueprint so every semantic change
is explained and every new test corresponds to an added evaluation obligation.
Expose exact raw bytes for each newly introduced `opl-content://sha256/...` ref
as a terminal StageRun artifact with the matching SHA-256. Preserve the existing
content refs and OPL bindings for unchanged content. Apply the provider output
gate to the complete proposal before returning it to OPL for independent
materialization and evaluation. Never return a patch, work order, physical path,
command, test weakening, version transaction, or activation claim.
