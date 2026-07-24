# Architecture

Owner: `oma`
Purpose: `architecture`
State: `active_truth`
Machine boundary: Human-readable ownership and protocol flow. Machine truth lives in OMA contracts and agent files plus the OPL-owned Foundry schemas and validators.

## Package composition

OMA is an `OPL Package(kind=agent)`. The Package is the executor-neutral owner
unit for its stable identity, Agent-engineering capabilities, dependency
intent, domain task semantics, and optional typed views. OPL App is a
replaceable GUI and deployment carrier; it renders those owner surfaces but
does not redefine them.

Package identity, publication, physical carriage, and execution are separate:

```text
Package     = oma identity + capabilities + dependencies + task/view descriptors
Publication = OMA owner -> GHCR oma:latest-stable
Carrier     = Package-declared runtime adapter + Codex Plugin/config/cache projection
Executor    = Codex CLI today; another adapter only when a real route is needed
```

Base provides only the thin OCI download/verification adapter and hands bytes
to the Package-declared carrier/runtime adapter.

OMA owns the complete official Package bytes and independently advances
`ghcr.io/gaofeng21cn/one-person-lab-packages/oma:latest-stable`. A shared
Release Set may freeze OMA for Full, offline, integration, or QA reproduction;
it is not OMA's ordinary update authority and does not couple an OMA release to
Base, App, or another Package.

Ordinary Package dependencies require only a stable identity that is present
and callable. They do not use version ranges, ABI negotiation, lock files,
payload identities, content digests, atomic cross-Package closure, a shared
Release Set, or central version solving as install or runtime readiness gates.
OMA currently declares no Package dependency. A future breaking capability is
published under a new capability identity or adapted by its owner.

Codex is the only supported executor route today because that is the smallest
useful implementation. The Codex Plugin is a carrier projection, not OMA's
Package identity, complete installed truth, publication authority, or domain
authority. A future executor change must not require reinstalling OMA or lose
Package preferences, Agent-engineering work items, dependency state, or typed
views. Framework may aggregate fresh carrier readback, dependency
presence/callability, and executor-route readiness; it does not own a second
OMA package manager.

Exact refs and digests remain valid for release integrity, one frozen build, or
Full/offline/integration/QA snapshots. Exact `DesignRequest`, blueprint, and
evidence digests also remain part of OMA's domain protocol integrity. Neither
case turns exact identity into ordinary Package composition or a
cross-Package readiness lock.

The repository's current manifests and source remain machine truth during
migration. This target does not prove that independent GHCR publication,
carrier aggregation, or executor-neutral descriptors are implemented. The
cross-repository sequence, compatibility reads, deletion gates, and
no-function-regression evidence live only in the
[Framework platform composition migration SSOT](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/active/opl-package-platform-composition-migration.md).

## Foundry semantic provider

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
