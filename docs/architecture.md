# Architecture

Owner: `oma`
Purpose: `architecture`
State: `active_truth`
Machine boundary: Human-readable ownership and protocol flow. Machine truth lives in OMA contracts and agent files plus OPL-owned Foundry schemas and validators.

## Ownership

OMA owns the Agent-engineering semantics: intent interpretation, design basis,
`AgentBlueprint`, `EvalSpec`, evidence diagnosis, and `EvolutionProposal`.

This includes interpreting multilingual intent and recommending Profile requirements
from the mission and admitted design evidence. Framework's `profiles select` only
routes explicit Profile refs or exact canonical signals, or preserves a supplied
reference-design route. Free text alone returns `semantic_profile_selection_required`;
the existing `engineer-agent` design flow owns that judgment. Catalog Profiles are
lower-bound conformance guardrails, not universal design templates. Profile lookup,
ABI validation, capability resolution, and execution remain Framework responsibilities.

Design-basis admission ends when consequential choices have support or explicit
gaps and the next semantic decision can proceed. Additional research must resolve
a named judgment that could change the design. This keeps source review from
turning into repeated runtime exploration or byte-attestation work; provenance
and unresolved limitations travel with the usable basis.

For human-Agent collaboration, OMA considers standard MCP Apps during Stage
architecture and carries the decision into blueprint authoring and evaluation.
Status, artifact review, differences, and approval generally reuse the shared
OPL contribution host. Tool-only responses and standalone applications remain
appropriate for their respective interaction needs. The selection method and
reuse boundaries live in
[Transferable Agent Practices](../agent/knowledge/transferable-agent-practices.md).
OMA specifies the semantic contracts and acceptance obligations; Framework and
the target owner implement, render, execute, and qualify them.

The [OPL Agent App standard](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/policies/agent-native-app-policy.md)
and [development guide](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/mcp-apps/development.md)
are the shared design authority. OMA maps the chosen surface, connection needs
and owner handoff into existing capability, tool-content, action/artifact schema
and memory-policy fields. It does not introduce a MiniApp manifest. Connection
design names the provider capability, required or optional use, trusted installed
consumer and repair route; deployment grants and credentials remain external.

The packaged [Photo](../contracts/fixtures/agent-apps/photo/agent-blueprint.json)
and [Relay](../contracts/fixtures/agent-apps/relay/agent-blueprint.json) examples
adapt two existing consumers: a shared plan-difference view and the dedicated
mail editor. Both reference the exact same collaboration Skill and owner-result
schema. Photo retains its local library owner; Relay reuses the installed
`opl-relay` connection consumer. Private knowledge is a source requirement, not
packaged content. The examples are source design inputs, not replacement packages
or an activated deployment.

Run [`tests/integration/agent-app-materialization.test.mjs`](../tests/integration/agent-app-materialization.test.mjs) against a Framework checkout (`OPL_FRAMEWORK_ROOT=/path/to/one-person-lab`) or an installed distribution (`OPL_FRAMEWORK_MODE=installed`) to exercise Foundry protocol compilation, action routing, and synthetic Stage execution. Synthetic wiring passes do not execute live mailbox/photo operations or establish model generation, domain acceptance, or production grants; public `EvalSpec` cases still require owner execution and host evidence.

OPL Foundry owns the run and lifecycle: materialization, evaluation execution,
evidence persistence, versions, qualification, canary, activation, and
rollback. Target Owners retain target-domain truth, protected tests, and
production acceptance.

## Knowledge Design

OMA designs knowledge requirements without becoming their runtime source owner.
The shared [knowledge source and memory policy](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/policies/knowledge-source-and-memory-policy.md)
defines product, owner, topic and project scopes independently of content kind,
source location and access. Existing personal or team libraries and ordinary
workspace Markdown support the same model and may be combined in one project.

Design-basis admission establishes the owner and applicability of needed context.
Stage architecture records required or optional use, freshness, derived-source
dependencies, writeback acceptance and action-critical constraints. Blueprint
authoring carries these semantics in the OPL-owned memory-policy contract;
evaluation design adds the corresponding source, isolation and lifecycle cases.
Private source coordinates and bodies stay outside generated product content.

Framework resolves authorized bindings and exact snapshots, and provides shared
mechanical writeback primitives. The knowledge owner accepts meaning and retains
the canonical editable body. OMA's own product methods use the same versioned
catalog; their delivery does not establish the truth of target-specific content.

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

The Codex Plugin is a carrier projection (`carriers/codex-sync`) generated from
root [opl-package.json](../opl-package.json) (`opl.package.v2`). It exposes the
canonical OMA Skill and package metadata without becoming Package identity or
lifecycle owner. [opl-package.json](../opl-package.json) declares `identity`,
`dependencies`, `provides`, `distribution`, and `host_hints.codex`. Their rationale
lives in [Decisions](./decisions.md); publication and installed currentness require
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

## Hosted Work-Item Registration

A work-item Agent needs the same domain identity at launch, continuation and
inventory readback. During design, specify which actions operate on an existing
work item, which request fields identify it, who maintains its inventory, and
which Stage consumes the owner's answer. Carry those obligations into the
action input schemas and the `EvalSpec` using the current Blueprint fields.

Before qualifying a work-item Package, verify the target owner's source
declarations and one representative hosted workflow.

1. In the target's `contracts/action_catalog.json`, declare
   `execution_scope: { "kind": "work_item", "alias_fields": [...] }` for actions
   that act on an existing item, including a continuation action when it resumes
   that item. Each alias starts with a field declared by that action. Declare an
   inventory in the target's `contracts/domain_descriptor.json` under
   `standard_agent_interface.inventory_projection`. Use a workspace-relative
   JSON path, an items pointer, the required field mappings and a work-item
   root template tied to the same identity field. [Standard Agent contract](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/specs/standard-agent-interface.md)
2. Validate the owner Package with `opl pack inspect <agent_repo> --json`.
   Confirm the installed native carrier exposes the matching descriptor with
   `opl pack inspect <package_id> --json`. Bind an isolated
   workspace to that Agent and use one existing inventory row and its physical
   work-item directory. [Domain admission contract](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/specs/opl-domain-onboarding-contract.md)
3. Start the hosted run with `opl runway start --workspace <workspace_id> --title <title> --goal <action> --json`.
   Verify the StageRun scopes to that item, the intended knowledge sources bind,
   and the owner's answer resumes the same item when the action supports
   continuation. Check the same identity in workspace and app state readbacks via
   `opl workspace inspect <workspace_id> --json` (or `opld` `app.state.get`).
   Exercise missing or conflicting identities and confirm that the runtime rejects them.

The current Blueprint schema and compiler leave both declarations to the
target Package source. For direct owner packaging, add the declarations there
and build a revision for the installed-carrier and launch checks above.
Automatic delivery through Foundry requires support in the Framework Blueprint
protocol and candidate compiler. Preserve the bytes of any activated candidate
and repeat acceptance on a new revision. Record construction, hosted execution
and domain-owner acceptance from their respective readbacks.
[Candidate construction boundary](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/delivery/foundry-package-construction-acceptance.md)

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
