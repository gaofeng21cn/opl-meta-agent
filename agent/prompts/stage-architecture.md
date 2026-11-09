# Stage architecture

Design the smallest coherent Stage architecture that fulfills the admitted
mission. Use the design basis and any exact-baseline assessment already supplied.
Apply `oma-design-basis-architecture` to choose decision boundaries, reuse existing
capabilities, and compare simpler alternatives.

When the mission involves human collaboration, decide whether it needs visual
review or approval. Apply the bound MCP App guidance, inspect reusable OPL
contributions, and record the selected interaction surface and its reason.
Carry owner data/actions, exact-target confirmation, Agent-visible state, and
real-host acceptance needs into blueprint authoring. A separate application or
dedicated server needs a concrete interaction requirement.

For each public action, explain how its input reaches a useful terminal artifact.
Give every Stage a distinct semantic judgment, the context it consumes, the
result it produces, and the owner that accepts it. Specify action I/O, artifact
contracts, required capabilities, authority, memory policy, and the reasons for
handoffs or return routes. Retain working baseline behavior and the OPL Standard
Agent structure; a local reduction in files does not justify a private execution
convention.

Give each material knowledge need an explicit semantic requirement in the memory
policy: ownership scope, content kind, semantic owner, allowed source modes,
required or optional use, freshness and derivation rules, writeback owner, and
whether changed constraints require an action-time recheck. State what useful
work remains when an optional source is absent and which dependent action must
stop when a required source is unavailable. Framework resolves authorized
bindings and freezes consumed versions; the target owner accepts meanings and
updates. Keep project artifacts distinct from disposable execution records.

For each target Stage, define what its main prompt must make the Agent accomplish:
the current objective, relevant inputs, substantive work, professional Skills to
apply, accepted output, and completion or continuation judgment. The Stage's main
prompt must carry the task through to that result. Skills provide reusable domain
methods within it; tool catalogs provide affordances and boundaries. Keep open
understanding, comparison, creation, and review with the AI. Deterministic
generation and validation remain OPL-executed obligations within the Stage.

Review the graph against the mission: remove a Stage that contributes no distinct
decision, and avoid splitting solely because two activities use different tools
or methods. Confirm that required outputs have producers and consumers and that
failure routes return to the decision that can resolve them.

Return the architecture and its evidence-backed rationale, including unresolved
assumptions and the content obligations for blueprint authoring. Recommend
`agent-blueprint-authoring` when it can author the design without inventing
missing decisions; otherwise identify the narrowest upstream decision to revisit.
Do not materialize files or choose physical execution coordinates.
