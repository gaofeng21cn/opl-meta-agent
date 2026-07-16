# Foundry provider output gate

- The output matches the operation's exact target identity and bound input digests.
- Design output is a complete `AgentBlueprint` with a complete `EvalSpec`.
- Diagnosis output is a complete `EvolutionProposal` with a full next blueprint.
- Every content-addressed prompt, skill, knowledge, or helper ref resolves to an exact terminal raw artifact with the same SHA-256; OMA does not choose candidate paths or materialize the Agent Pack.
- Every semantic claim is traceable to admitted design evidence or the supplied `EvidenceBundle`.
- Existing public cases, protected requirements, gates, thresholds, and baseline comparison are not removed, weakened, or rewritten.
- A changed blueprint increments generation exactly once; a no-change proposal preserves the exact blueprint and has an empty semantic diff.
- No repository path, command, queue, lease, attempt, patch, work order, promotion record, protected-test body, qualification, activation, or ready claim appears.
