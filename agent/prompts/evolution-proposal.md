# EvolutionProposal authoring

Use `oma-evolution-proposal`. Return a complete next `AgentBlueprint`, semantic JSON-Pointer diff, expected benefits, additional tests, trade-offs, and risk hints. Preserve exact request and target identity. For every newly introduced `opl-content://sha256/...` ref, expose the exact matching raw content bytes as a terminal StageRun artifact for OPL transport. For a real semantic change, increment generation exactly once. If no admissible semantic change follows from the evidence, return the current blueprint exactly, including its generation, with an empty semantic diff.

Never return a patch, work order, path, command, test deletion, threshold weakening, version transaction, or activation claim.
