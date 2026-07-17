# Architecture

Owner: `oma`
Purpose: `architecture`
State: `active_truth`
Machine boundary: Human-readable ownership and protocol flow. Machine truth lives in OMA contracts and agent files plus the OPL-owned Foundry schemas and validators.

OMA is a pure semantic provider behind the OPL Foundry Kernel.

```text
engineer-agent(DesignRequest)
  -> OPL FoundryRun
  -> OMA design -> AgentBlueprint + EvalSpec
  -> OPL materialize -> evaluate -> EvidenceBundle
  -> OMA diagnose -> EvolutionProposal -> next AgentBlueprint
  -> OPL re-materialize -> re-evaluate -> qualify/canary/activate
```

The cross-boundary protocol consists only of `DesignRequest`, `AgentBlueprint`, `EvidenceBundle`, and `EvolutionProposal`. Owner decisions remain OPL authority receipts outside the OMA protocol.

OPL is the sole schema and validator authority. OMA keeps four refs-only conformance fixtures in `contracts/fixtures/foundry-protocol/`; they prove URI, identity, digest-lineage, and forbidden-field expectations but do not redefine the schemas.

OMA's eight internal Stages are grouped into design and diagnosis routes. They express open semantic judgments; OPL performs deterministic work and owns every lifecycle transition.

OPL retries or fails platform errors before diagnosis. When completed evidence yields no admissible semantic change, OMA returns the exact current blueprint with `semantic_diff=[]`; OPL terminates without another materialization, evaluation, or version.
