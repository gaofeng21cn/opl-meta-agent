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
