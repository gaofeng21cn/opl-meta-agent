# OPL Meta Agent

[English](./README.md) | [中文](./README.zh-CN.md)

<!--
Owner: `oma`
Purpose: `public_repository_entry`
State: `public_entry`
Machine boundary: Human-readable entry. Machine truth lives in `contracts/`, `agent/`, and repository verification output; Foundry run and lifecycle truth remain in OPL.
-->

OPL Meta Agent (OMA) turns an Agent engineering objective into a reviewable semantic design. It helps create a new Agent, take over an existing one, or improve one from independent evidence without mixing design judgment with execution authority.

OMA provides:

- an `AgentBlueprint` with the Agent's identity, authority, stages, capabilities, and embedded `EvalSpec`;
- evidence-bound diagnosis and an `EvolutionProposal` for the next design;
- explicit safeguards against leaking file patches, protected test bodies, execution coordinates, or release decisions into semantic output.

The public entry is `engineer-agent`, with `create`, `takeover`, and `improve` modes:

```bash
opl agents run --domain oma --action engineer-agent --workspace /absolute/workspace --payload-file request.json
```

The result is an OPL-owned `FoundryRun`. OPL materializes and evaluates candidate bytes, records evidence and versions, and controls qualification, canary, activation, and rollback. OMA only supplies the semantic decisions used inside that run.

## For Codex / Agents

The Codex Plugin carrier and the OPL Package are intentionally separate. The
carrier makes the repository bundle discoverable and installable in Codex; the
Package remains `oma`, with OPL as the owner of materialization, evaluation,
versions, and activation.

In the Codex App, add this repository root as a local marketplace source in
Plugins, then install **OPL Meta Agent** from the `opl-meta-agent` marketplace.
Start a new task after installation so Codex loads the installed
`opl-meta-agent` Skill. Its only public action is `engineer-agent`.

From the repository root, the equivalent Codex CLI flow is:

```bash
codex plugin marketplace add /absolute/path/to/opl-meta-agent --json
codex plugin marketplace list --json
codex plugin add opl-meta-agent@opl-meta-agent --json
codex plugin list --marketplace opl-meta-agent --available --json
codex plugin remove opl-meta-agent@opl-meta-agent --json
codex plugin marketplace remove opl-meta-agent --json
```

The marketplace add/list and plugin install/list commands prove that the Codex
carrier can be discovered and installed from this source. They do not prove a
complete OPL Package runtime, Foundry qualification, activation, target-owner
acceptance, or production adoption.

For the separate OPL Package status readback, use:

```bash
opl packages status --package-id oma --json
```

This is a read-only status surface. It does not create, restore, or confer
Package transaction or receipt authority; complete runtime readiness remains
dependent on OPL-owned materialization, evaluation, and the applicable owner
evidence.

<details>
<summary>Agent and operator boundary</summary>

- `design` and `diagnose` are internal provider operations invoked by OPL, not public commands or generated tools.
- OMA owns intent interpretation, design basis, evaluation semantics, evidence diagnosis, and evolution proposals.
- OPL Foundry Kernel owns run state, materialization, evaluation execution, evidence persistence, versions, qualification, canary, activation, and rollback.
- Provider completion is not Agent qualification, activation, target-owner acceptance, or production adoption.

</details>

Machine truth lives in [`contracts/`](./contracts/) and [`agent/`](./agent/). Validate the repository with:

```bash
scripts/verify.sh full
```

Start with the [documentation guide](./docs/README.md). Current status, gaps, and the next development baton live in the [Active Truth plan](./docs/active/oma-ideal-state-gap-plan.md).
