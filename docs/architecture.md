# Architecture

Owner: `oma`
Purpose: `architecture`
State: `active_truth`
Machine boundary: Human-readable ownership and protocol flow. Machine truth lives in OMA contracts and agent files plus OPL-owned Foundry schemas and validators.

## Ownership

OMA owns the Agent-engineering semantics: intent interpretation, design basis,
`AgentBlueprint`, `EvalSpec`, evidence diagnosis, and `EvolutionProposal`.

OPL Foundry owns the run and lifecycle: materialization, evaluation execution,
evidence persistence, versions, qualification, canary, activation, and
rollback. Target Owners retain target-domain truth, protected tests, and
production acceptance.

## Package Composition

Package identity, publication, carrier, and executor are separate surfaces:

```text
Package     = oma identity + capabilities + dependencies + task/view descriptors
Publication = OMA owner channel
Carrier     = Codex Plugin today
Executor    = Codex CLI today
```

OMA currently declares no Package dependency. Ordinary dependencies use stable
identity presence and callability; exact refs and digests remain available for
release integrity, frozen snapshots, and the Foundry protocol.

The Codex Plugin is a carrier projection. It exposes the canonical OMA Skill
and package descriptors without becoming Package identity or lifecycle owner.
The accepted publication and platform-composition migration is tracked in
[Decisions](./decisions.md) and the [Framework migration SSOT](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/active/opl-package-platform-composition-migration.md).

## Foundry Provider

OMA is a semantic provider behind OPL Foundry:

```text
engineer-agent(DesignRequest)
  -> OPL FoundryRun
  -> OMA design -> AgentBlueprint + EvalSpec
  -> OPL materialize -> evaluate -> EvidenceBundle
  -> OMA diagnose -> EvolutionProposal -> next AgentBlueprint
  -> OPL re-materialize -> re-evaluate -> qualify/canary/activate
```

The protocol contains `DesignRequest`, `AgentBlueprint`, `EvidenceBundle`, and
`EvolutionProposal`. OPL owns their schemas and validators; OMA keeps refs-only
fixtures for conformance. The eight Stages express semantic decisions, while
OPL executes deterministic work and lifecycle transitions.

When evidence yields no admissible semantic change, OMA returns the current
blueprint with `semantic_diff=[]` and OPL ends the run without another version.
