<p align="center">
  <img src="assets/branding/opl-meta-agent-logo.png" alt="OPL Meta Agent logo" width="132" />
</p>

<p align="center"><strong>English</strong> | <a href="./README.zh-CN.md">中文</a></p>

<h1 align="center">OPL Meta Agent</h1>

OPL Meta Agent helps agent developers turn a working goal into a design they can review and evaluate. It can also take over an existing agent and propose improvements based on real run evidence.

## Design for evaluation

When you start a new agent, OMA puts the goal, authority, stages, and evaluation criteria into a blueprint. For an existing agent, it looks at specific outcomes from a run and returns its diagnosis and a proposed revision for review. Existing knowledge and project documents stay with their owners.

Maintainers define the behavior they want and the criteria they will use to accept it. OMA delivers a blueprint or an improvement proposal. OPL Foundry builds a candidate from that design, runs an independent evaluation, and records the evidence maintainers need to decide whether to activate the candidate or revise it again. [Design and execution responsibilities](docs/architecture.md)

## Start with an agent

> “Take over this agent we already use. From this run, identify where it diverged from the goal and propose an improvement with evaluation criteria that will show whether it worked.”

Install **OPL Meta Agent** from the OPL Software Center. Use `engineer-agent` to create, take over, or improve an agent. The example uses a request file you prepare and returns a Foundry run you can inspect.

```bash
opl runway start --workspace <workspace_id> --title "Engineer agent" --goal engineer-agent
```

[Documentation](docs/README.md) · [Acceptance progress](docs/active/oma-ideal-state-gap-plan.md)
