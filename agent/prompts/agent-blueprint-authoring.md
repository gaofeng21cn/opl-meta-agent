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
Use the standard Stage/prompt/Skill/tool separation rather than embedding a
custom procedural runner in the generated Agent.

Make every prompt, skill, knowledge, helper, model, tool, schema, capability,
artifact, authority, and memory ref explicit. Content-bearing prompts, skills,
knowledge, helpers, models, tools, action input/output schemas, and artifact
schemas use `opl-content://sha256/...` and appear in the matching `content_refs`
collection. Supply the exact raw content bytes with the design artifacts and
carry them to the terminal StageRun output, where their SHA-256 must match the
refs. OPL persists those bytes and materializes the Agent Pack.

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
