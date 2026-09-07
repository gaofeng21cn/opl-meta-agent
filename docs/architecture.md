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
The [Package manifest](../contracts/opl_agent_package_manifest.json) declares
the carrier, executor route, and publication locator. Their rationale lives in
[Decisions](./decisions.md); publication and installed currentness require
their own readbacks.

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
`EvolutionProposal`. OPL owns their schemas and validators; OMA keeps
[design](../contracts/foundry_protocol_fixture_manifest.json) and
[improve](../contracts/foundry_protocol_improve_fixture_manifest.json) fixture
sets for the same four objects. The eight Stages express semantic decisions, while
OPL executes deterministic work and lifecycle transitions.

When evidence yields no admissible semantic change, OMA returns the current
blueprint with `semantic_diff=[]` and OPL ends the run without another version.

## Provider Scope And Review

The initial blueprint returned by `design` has generation zero, including
takeover or improve requests with a baseline. Draft repairs and upstream
route-backs remain inside that operation. Only an evidence-bound `diagnose`
proposal introduces the next generation; exact no-change output preserves it.
The request's privacy category strings and permission refs retain their exact
identities, as defined by the [authoring prompt](../agent/prompts/agent-blueprint-authoring.md)
and [output gate](../agent/quality_gates/foundry-provider-output.md).

The Framework Foundry provider adapter supplies an operation-scoped output
contract to StageRun. Its immutable reviewer snapshot contains the raw protocol
object and all referenced content bytes; a review report cannot replace those
artifacts. OMA declares review dimensions and dependency edges in
[`epistemic_review_adoption.json`](../contracts/epistemic_review_adoption.json).
Framework evaluates generic currentness and manages review attempts. Exact
hashes locate transport bytes; only semantic dependency changes invalidate
affected reviews. These source contracts do not establish live model acceptance.
