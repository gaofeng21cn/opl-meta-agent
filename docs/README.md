# OMA Documentation

This index owns document navigation and lifecycle. Contracts, the semantic pack,
and verification output establish repository behavior; OPL Foundry and target
owners establish execution and acceptance.

| Document | Sole responsibility |
| --- | --- |
| [Repository entry](../README.md) / [中文](../README.zh-CN.md) | Product purpose, installation, public invocation, and verification entry |
| [Architecture](./architecture.md) | Component ownership, Package composition, and protocol flow |
| [Invariants](./invariants.md) | Semantic and authority constraints that changes must preserve |
| [Decisions](./decisions.md) | Rationale for the current architectural choices |
| [Open acceptance work](./active/oma-ideal-state-gap-plan.md) | Unclosed integration and acceptance evidence, its owner, and closure condition |
| [Semantic pack](../agent/README.md) | Entry to the executable Stage, prompt, method, knowledge, and gate assets |

## Lifecycle

Family-wide lifecycle rules live in the [OPL docs lifecycle policy](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/policies/docs-lifecycle-policy.md); this page defines only OMA-specific ownership. Write current behavior into its existing owner in the same change as the contract or consumer. The two root READMEs are language peers, so their product and operator guidance must stay aligned. `agent/` Markdown is an input to the Agent, not an alternative developer guide: Stage definitions own their decision, prompts own invocation instructions, professional Skills own methods, and gates own acceptance criteria. Update carrier copies through their canonical source.

An active plan contains only unresolved work with a concrete owner and closure
condition. Remove closed items instead of appending milestones, recurring audit
prompts, coverage claims, or release logs. Delete an empty plan and repair its
navigation and `contracts/opl-native-profile.json` entry when the last item closes.

Use Git history for historical provenance; keep no tombstone directories,
compatibility pages, or resume paths in the working tree. Record durable
negative guarantees in [Invariants](./invariants.md) and active rationale in
[Decisions](./decisions.md).

Before moving or deleting a page, repair Markdown links and structured document
refs together. Validate links, referenced files, metadata, and exact generated
copies mechanically; assess meaning against contracts and consumers. A passing
test or a self-reported coverage list does not establish semantic correctness.
