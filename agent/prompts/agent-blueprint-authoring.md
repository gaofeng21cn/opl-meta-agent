# AgentBlueprint authoring

Author the declarative `AgentBlueprint` from the admitted mission, design basis,
optional baseline assessment, and Stage architecture. Use
`oma-design-basis-architecture` to check that the assembled design preserves its
decision boundaries and evidence. Resolve inconsistencies in this Stage when the
admitted decisions suffice; identify the owning upstream decision otherwise.

Write the actual content behind the design. Each target Stage's main prompt must
guide its substantive work from supplied context to the accepted result, including
when to apply its professional Skills and how to judge completion or further
work. A goal sentence or a list of Skill names is not a complete main prompt.
Keep reusable methods in the professional Skills and facts in knowledge assets.

Preserve the architecture's interaction-surface decision. For MCP App designs,
bind the owner read/action and artifact contracts plus reusable Framework
capabilities in the existing Blueprint fields and content artifacts. Keep human
confirmation, Agent-visible structured results, and owner receipts explicit.
Do not substitute a custom UI runtime or add undeclared protocol fields.
Use the standard Stage/prompt/Skill/tool separation rather than embedding a
custom procedural runner in the generated Agent.

Use the existing fields for Agent App integration: `capability_requirements`
and each Stage's `capability_refs` name inspected callable capabilities;
`content_refs.tool_refs` binds exact owner read/action and Connect affordances;
the Stage prompt and reusable Skill explain the surface choice and handoff;
action and artifact schemas bind the object, revision and owner result.
Connection requirements describe provider capability and required/optional use
in those content artifacts; they are not embedded grants, credentials or a new
installation manifest. Carry knowledge requirements through the memory policy
below. Never replace an installed consumer binding with UI-supplied identity.

For the target's actual interaction, specify how to reopen the same object,
reject a stale revision, read back an uncertain mutation, and continue without
UI. Preserve the user's decision and domain receipt as owner data; do not infer
success from a closed view, dispatch acknowledgement, or tool transport success.

The packaged Photo and Relay examples under `contracts/fixtures/agent-apps/`
show this mapping with exact raw content and one shared collaboration Skill.
Use their structure only where the current mission and inspected owner contract
support it. Their declared evaluation cases remain obligations, not passed
evidence or permission to replace an existing Agent.

Make every prompt, skill, knowledge, helper, model, tool, schema, capability,
artifact, authority, and memory ref explicit. Content-bearing prompts, skills,
knowledge, helpers, models, tools, action input/output schemas, and artifact
schemas use `opl-content://sha256/...` and appear in the matching `content_refs`
collection. Supply the exact raw content bytes with the design artifacts and
carry them to the terminal StageRun output, where their SHA-256 must match the
refs. OPL persists those bytes and materializes the Agent Pack.

Encode the architecture's requirements in `memory_policy.knowledge_requirements`.
Each requirement carries `requirement_id`, `scope_kind`, `content_kind`,
`semantic_owner_ref`, `source_modes`, `requirement`, `freshness_policy`,
`writeback_owner_ref`, `derived_dependency_policy`, and `action_critical`.
Use `product` as the source mode only for product scope; non-product requirements
declare `workspace`, `external`, or both. An empty list explicitly means that the
target has no persistent knowledge requirement. Product knowledge may be packaged; owner, topic, and
project knowledge retain their existing source ownership. Private source roots,
personal document bodies, and machine-specific bindings do not belong in the
Blueprint or generated distribution. Declare internal, external, or mixed
source support semantically, so authorized deployment can bind a personal
library or ordinary workspace without inventing another copy. Preserve the
required/optional, validity, derived-dependency, writeback-owner, and
action-critical distinctions through the generated target's catalog and policy.

The initial blueprint returned by the provider `design` operation must have
`generation=0`, including when the request supplies a takeover or improve
baseline. Repairs and route-backs within the same design operation remain at
generation zero; draft revisions are not Foundry evolution generations. Only a
subsequent evidence-bound `diagnose` operation proposes an evolution increment.

For every declared action contract, output member, quality transport, or
role-scoped prompt obligation, make the producing and consuming Stage semantics
explicit enough for EvalSpec to test the public-action-to-terminal-output path.
Place required role instructions in the role fragment that OPL compiles into the
effective prompt so the public action can reach the terminal output.

Project `DesignRequest.constraints.permission_refs` exactly into the authority policy. Never add, drop, or reinterpret permissions. Do not emit Owner allowlists or authorization claims; OPL resolves its target authority policy and verifies independent Owner receipts.

All generated-Agent self-modification authority flags must remain false. Return
the assembled blueprint draft, its content artifacts, and any evaluation decisions
still to resolve to `evaluation-design`. Preserve supplied evaluation obligations;
evaluation-design completes the embedded `EvalSpec` and returns the final
operation output. The draft is usable when its action-to-output paths and content
are coherent enough to evaluate. Do not return file operations, runtime
instructions, or a qualification claim.
