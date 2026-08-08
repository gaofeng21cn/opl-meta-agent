# OPL Standard Agent Principles Adoption

Canonical authority: `contracts/opl-framework/standard-agent-principles.json`

OMA adopts the Framework-owned Standard Agent Principle Pack through `contracts/standard-agent-principles-adoption.json`. This repo-local file only projects the canonical reference and OMA specialization; it does not restate or override the Framework principle body.

## OMA Specialization

- Domain: `agent_engineering`.
- Public action: `engineer-agent`.
- Domain intake: `mission-intake`, not a standalone Skill.
- Internal Foundry provider operations: `design` and `diagnose`; they are not public actions.
- OMA owns Agent engineering semantics for `AgentBlueprint` and `EvolutionProposal`. OPL Foundry owns run state, candidate materialization, evaluation execution, versions, activation, and rollback. The target owner retains target-domain truth.

The machine-readable mapping and false-authority boundary are in `contracts/standard-agent-principles-adoption.json`; OMA-specific human guidance remains in `agent/principles/domain-specialization.md`.
