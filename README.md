# meta-agent

`meta-agent` is an OPL-based Foundry Agent for building other OPL-compatible high-value knowledge-work agents.

It is a standalone domain agent repo. OPL Framework owns the generic runtime, Agent Lab, scaffolding, queue, attempt ledger, observability, optimizer candidate refs, and promotion gates. This repo owns the agent-building domain semantics: intent interpretation, research synthesis, stage decomposition, agent package generation policy, baseline acceptance, and online-learning review policy.

## Scope

- Understand the user's target agent goal, delivery bar, authority boundary, and non-goals.
- Research public patterns for the target domain and record source refs.
- Produce OPL-compatible descriptor, stage, action, memory, artifact, quality, sidecar, and receipt contracts.
- Build an agent skeleton or candidate repo using OPL scaffold surfaces.
- Build Agent Lab eval suites and recovery probes.
- Run baseline evaluation through OPL Agent Lab.
- Generate prompt, skill, stage-policy, tool-policy, few-shot, and rubric-gap candidates.
- Deliver a versioned baseline agent package and runbook.
- Convert real trajectories into reviewed future candidate refs.

## Boundary

`meta-agent` does not own OPL Framework runtime, Agent Lab, model training, weight deployment, or ungated default-agent promotion. It consumes OPL refs and returns agent-building receipts, candidate package refs, typed blockers, and review records.

## Verification

```bash
npm test
```
