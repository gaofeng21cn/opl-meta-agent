# OPL Meta Agent

<p align="center">
  <a href="./README.md"><strong>English</strong></a> | <a href="./README.zh-CN.md">中文</a>
</p>

**A Foundry Agent for building OPL-compatible high-value knowledge-work agents**

`opl-meta-agent` is an independent OPL-compatible domain agent. It designs, tests, and packages new domain agents while the OPL Framework owns the generic runtime, Agent Lab, scaffold surface, queue, attempt ledger, observability, optimizer transition refs, and promotion gates.

Branding assets are intentionally left for `assets/branding/`. This README does not reference image files until the main thread provides the actual assets.

## What It Helps With

- Turn a target agent idea into OPL-compatible descriptors, stage plans, action metadata, memory locators, artifact locators, quality gates, and owner receipts.
- Generate a baseline agent package through OPL scaffold surfaces.
- Build Agent Lab external suites, recovery probes, scorecard refs, and promotion gates.
- Take over testing for an existing OPL-compatible external agent without taking over its truth, memory, artifacts, quality verdict, or default promotion authority.
- Record gated online-learning candidates and mechanism patch proposals from observed runs.

## Current Boundary

`opl-meta-agent` owns agent-building semantics: intent interpretation, public pattern research, stage decomposition, agent package policy, Agent Lab suite specs, baseline delivery receipts, optimizer candidate organization, online-learning review policy, and mechanism patch proposal records.

It does not implement a second OPL runtime, scheduler, queue, attempt ledger, memory transport, artifact lifecycle shell, operator workbench, model training path, weight deployment path, or ungated default promotion path.

For target agents, it may observe an Agent Lab segment run, diagnose an evidence delta, and propose edits to editable mechanism surfaces. The proposal remains a gated candidate reference. It cannot write target-domain truth, memory body, artifact body, quality/export verdict, or promote a default agent without an explicit OPL gate.

## Commands

```bash
npm test
```

Bootstrap a sample agent and record a baseline receipt, online-learning candidate, and mechanism patch proposal:

```bash
npm run bootstrap:sample -- --output-dir /tmp/opl-meta-agent-demo --opl-bin /Users/gaofeng/workspace/one-person-lab/bin/opl
```

Take over testing for an existing OPL-compatible agent and record the takeover receipt, gated self-evolution candidate, and mechanism patch proposal:

```bash
npm run takeover:test -- --agent-dir /tmp/opl-meta-agent-demo/sample-brief-agent --output-dir /tmp/opl-meta-agent-takeover --opl-bin /Users/gaofeng/workspace/one-person-lab/bin/opl
```

## Mechanism Patch Proposal

Both smoke paths now write `mechanism-patch-proposal.json` surfaces. Each proposal carries:

- `mechanism_ref` and `version`
- `editable_surfaces`
- `observe.segment_run_ref`
- `diagnose.evidence_delta_ref`
- `edit.next_mechanism_candidate_ref`
- top-level `segment_run_ref`, `evidence_delta_ref`, and `next_mechanism_candidate_ref`
- authority flags proving proposal-only behavior

## How To Read This Repository

1. Start with [中文 README](./README.zh-CN.md) for the primary product and operator wording.
2. Technical readers should read [Project](./docs/project.md), [Status](./docs/status.md), [Architecture](./docs/architecture.md), [Invariants](./docs/invariants.md), and [Decisions](./docs/decisions.md).
3. Machine-readable surfaces live under [`contracts/`](./contracts/), while smoke scripts live under [`scripts/`](./scripts/).
