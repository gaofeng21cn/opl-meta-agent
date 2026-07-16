# OPL Meta Agent

OPL Meta Agent (OMA) is the semantic engineering provider for OPL-compatible Agents.

OMA owns intent interpretation, design basis, `AgentBlueprint`, embedded `EvalSpec`, evidence diagnosis, and `EvolutionProposal`. The OPL Foundry Kernel exclusively owns run state, deterministic materialization, independent evaluation, evidence persistence, versions, canary, activation, and rollback.

The only public OMA action is `engineer-agent`, with `create`, `takeover`, and `improve` modes:

```bash
opl agents run --domain oma --action engineer-agent --workspace /absolute/workspace --payload-file request.json
```

`design` and `diagnose` are internal provider operations invoked by OPL. They are not public commands or generated tools. OMA outputs protocol objects, never execution instructions, file patches, protected test bodies, or release decisions.

Machine truth lives in [`contracts/`](./contracts/) and [`agent/`](./agent/). Validate the repository with:

```bash
scripts/verify.sh full
```

See [`docs/architecture.md`](./docs/architecture.md), [`docs/invariants.md`](./docs/invariants.md), and [`docs/decisions.md`](./docs/decisions.md).
