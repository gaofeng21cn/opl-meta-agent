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
| [History](./history/README.md) | Retained migration provenance, excluded from current instructions |

## Lifecycle

Write current behavior into its existing owner in the same change as the
contract or consumer. The two root READMEs are language peers, so their product
and operator guidance must stay aligned. `agent/` Markdown is an input to the
Agent, not an alternative developer guide: Stage definitions own their decision,
prompts own invocation instructions, professional Skills own methods, and gates
own acceptance criteria. Update carrier copies through their canonical source.

An active plan contains only unresolved work with a concrete owner and closure
condition. Remove closed items instead of appending milestones, recurring audit
prompts, coverage claims, or release logs. Delete an empty plan and repair its
navigation and `contracts/opl-native-profile.json` entry when the last item closes.

Preserve a completed record only when it explains a still-relevant decision or
prevents a retired surface from being restored. Transfer current instructions
to their owner before archiving; otherwise Git history is sufficient. History
does not provide compatibility entrypoints or establish current readiness.

Before moving or deleting a page, repair Markdown links and structured document
refs together. Validate links, referenced files, metadata, and exact generated
copies mechanically; assess meaning against contracts and consumers. A passing
test or a self-reported coverage list does not establish semantic correctness.
