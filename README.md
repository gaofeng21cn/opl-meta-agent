<p align="center">
  <img src="assets/branding/opl-meta-agent-logo.png" alt="OPL Meta Agent logo" width="132" />
</p>

<p align="center">
  <a href="./README.md"><strong>English</strong></a> | <a href="./README.zh-CN.md">中文</a>
</p>

<h1 align="center">OPL Meta Agent</h1>

<p align="center"><strong>Turn a professional workflow into a testable, OPL-ready AI agent that can keep improving</strong></p>
<p align="center">From idea to tested baseline: define delivery · map the work · generate the skeleton · run tests · propose improvements</p>

<table>
  <tr>
    <td width="33%" valign="top">
      <strong>Who It Serves</strong><br/>
      Developers and teams who want to turn research, writing, review, delivery, or operations workflows into AI agents
    </td>
    <td width="33%" valign="top">
      <strong>Problem It Solves</strong><br/>
      A new agent needs more than a prompt: it needs a goal, a boundary, tests, and a path for improvement
    </td>
    <td width="33%" valign="top">
      <strong>How To Start</strong><br/>
      Describe what the target agent should deliver, what it must not do, and what counts as good enough, then generate a tested baseline
    </td>
  </tr>
</table>

<p align="center">
  <img src="assets/branding/opl-meta-agent-overview.png" alt="OPL Meta Agent overview" width="100%" />
</p>

> `OPL Meta Agent` is built for the work of building AI agents. Describe the professional agent you want, and it turns the goal, boundary, working steps, tests, and improvement candidates into a practical baseline.

<!--
Owner: `opl-meta-agent`
Purpose: `public_repository_entry`
State: `public_entry`
Machine boundary: This README is a human-facing repository overview. Machine truth remains in `contracts/`, `agent/`, `runtime/authority_functions/`, source, CLI/API behavior, OPL Agent Lab result refs, work-order receipts, target owner receipts / typed blockers, and tests.
-->

## Why It Exists

It is easy to start an agent with a prompt. It is much harder to make that agent useful for papers, grants, reviews, presentations, operations, or other high-value work.

- What exactly should this agent deliver, and what should remain outside its scope?
- How should the work be broken down, and what inputs or tools does each step need?
- If all you have is a prompt, how do you know the agent can deliver reliably?
- When tests fail, should you change the prompt, skills, workflow, or quality bar?
- Can an existing agent be tested systematically without rewriting its domain judgment?

**OPL Meta Agent is designed for that gap.** It moves from "I want an agent" to "I have a testable, reviewable, improvable baseline."

It does not reduce agent building to "write a prompt." A useful agent needs a clear goal, boundary, working steps, tests, and a path for improvement after failures. OPL Meta Agent helps turn those pieces into a runnable, testable, improvable baseline.

## Core Highlights

**Generate an agent blueprint from a plain-language goal**<br/>
You do not need a full spec on day one. Describe the work, the desired deliverable, and the constraints; the system helps organize goals, boundaries, inputs, outputs, and working steps.

**Set the boundary and quality bar first**<br/>
Every agent needs to know what it should do, what it should not do, and what "good enough" means. OPL Meta Agent puts those rules into the baseline instead of leaving them as informal notes.

**Make the agent testable**<br/>
The output is not just a bundle of files. It comes with test suites, run evidence, and a baseline result so you can judge whether the agent can actually do the job.

**Turn failures into improvement proposals**<br/>
When a run exposes a weakness, the system turns the evidence into next-version suggestions, such as prompt policy, skill strategy, workflow design, test strategy, or quality-gate changes.

**Take over testing for existing agents**<br/>
For an existing agent, it can organize tests and evidence first, then propose improvements without taking over that agent's professional judgment or final delivery.

**Room For Design, Testing, And Improvement**<br/>
A new agent often needs multiple work decompositions, prompt strategies, skill combinations, and test plans to be compared. OPL Meta Agent turns candidates and failure evidence into reviewable next-version proposals instead of taking over the target domain's final judgment.

## How To Start

- "Turn this research workflow into an AI agent, and first define the deliverable, boundary, and quality bar."
- "Take over testing for this existing agent repo and propose improvements, but keep its domain judgment with the owner."
- "Run an Agent Lab pass and turn the failure evidence into next-version mechanism proposals for review."

## What It Helps With

- Turning a new agent idea into intent analysis, public-pattern research, working steps, an agent skeleton, test suites, baseline runs, and improvement candidates.
- Creating practical agent baselines for papers, grants, presentations, reviews, operations, and other high-value workflows.
- Organizing tests, recovery probes, scorecard refs, and adoption gates for new agents or existing target agents.
- Producing baseline delivery records, gated learning candidates, and mechanism improvement proposals.
- Turning real run evidence into reviewable, rollback-friendly next-version candidates that still require approval before adoption.

## How It Works

- The user provides the target domain, deliverable, quality bar, non-goals, and runtime constraints.
- `OPL Meta Agent` organizes public patterns and working steps, then generates a candidate agent package.
- The candidate agent goes through Agent Lab testing; the results are organized into reviewable baseline records, issue lists, and next-version improvement proposals.
- Mechanism changes, default-agent promotion, quality adoption, and real delivery authority require an explicit gate or the target domain owner.

## Agent Lab Self-Evolution Loop

<p align="center">
  <img src="assets/branding/opl-meta-agent-evolution-loop.png" alt="OPL Meta Agent Agent Lab self-evolution loop" width="100%" />
</p>

The loop turns each run into reviewable improvement material:

- **Read evidence**: inspect run segments, failure records, candidate outputs, and test refs.
- **Find bottlenecks**: identify repeated failures, wasted budget, validation gaps, or work-step drift.
- **Propose the next mechanism**: turn findings into prompt, skill, work-step, test, or quality-bar improvement candidates.
- **Adopt with approval**: patches remain proposals; professional content, memory bodies, deliverables, and final judgment still require target-domain owner approval.

## Current Position And Boundary

- `opl-meta-agent` is the agent-building / improvement member of the OPL Foundry Agent series. It is for turning a professional workflow into a testable agent.
- In the OPL family, OMA is the agent-building Foundry package: OMA keeps agent-building semantics, while OPL owns generic runtime, package carrier, generated interfaces, Agent Lab execution, registry/discovery, and promotion gates.
- It organizes goals, boundaries, working steps, agent skeletons, test suites, and next-version improvement proposals.
- It can generate a new agent baseline from scratch, and it can also take over testing and failure-evidence organization for an existing agent.
- It emits candidates, test results, and improvement proposals only. It does not make the target domain's final judgment or directly rewrite that agent's domain content, memory body, or deliverables.
- Its StageRun controlled canary and refs-only scaleout evidence are current evidence surfaces, not readiness or promotion claims.
- It reuses One Person Lab Framework scaffold, Agent Lab, queue/projection, and promotion gates instead of rebuilding generic runtime in this repo.

<details>
  <summary><strong>Technical boundary for operators</strong></summary>

- The standard Skill entry is natural language: a user can ask Codex to build an OPL-compatible agent for a named delivery workflow, and OPL Meta Agent turns that request into a gated baseline-building path.
- Action surfaces such as `build-agent-baseline`, `takeover:test`, `agent:evidence`, and `execute:external-work-order` are described by package scripts, contracts, source, and tests; README command mentions are only entry pointers.
- Current technical truth lives in [Status](./docs/status.md), [Architecture](./docs/architecture.md), [Invariants](./docs/invariants.md), [Decisions](./docs/decisions.md), package scripts, and the machine-readable contracts under [`contracts/`](./contracts/).
- OPL Framework owns generated interfaces, Agent Lab, work-order execution, registry/discovery, App/workbench projection, absorb/cleanup, and promotion gates. This repo supplies agent-building semantics and refs-only outputs.
- StageRun canary, generated interface readiness, registry/App projection, suite pass, work-order shape, mechanism proposals, or refs-only scaleout closeout cannot become live progress, target-domain readiness, quality/export verdict, owner receipt body, App live rendering, human approval, or default promotion.

</details>

## How To Read This Repository

1. Start here, then continue to [Project](./docs/project.md) and [Status](./docs/status.md).
2. Technical readers should read [Architecture](./docs/architecture.md), [Invariants](./docs/invariants.md), and [Decisions](./docs/decisions.md).
3. Machine-readable surfaces live under [`contracts/`](./contracts/), smoke scripts live under [`scripts/`](./scripts/), and the default test entry is `npm test` / `npm run test:smoke`.

## Agent And Operator Quick Start

<details>
  <summary><strong>Start here if you are handing this repo to Codex or another agent</strong></summary>

- Cloning this repo does not install OPL Base. OPL install/update/package lifecycle owns the Framework link; for a developer checkout, run `npm install` and then `opl connect agent-packages link-framework --agent-root "$PWD" --json`.
- Read this README, then [Project](./docs/project.md), [Status](./docs/status.md), [Architecture](./docs/architecture.md), [Invariants](./docs/invariants.md), [Decisions](./docs/decisions.md), and the contracts under [`contracts/`](./contracts/).
- Use package scripts and `contracts/action_catalog.json` for current command surfaces; update focused tests when changing contracts, README, docs, smoke scripts, or action boundaries.
- This repo owns agent-building semantics and testing/self-evolution orchestration. OPL Agent Lab owns real runs, longline suites, mechanism read models, work-order execution, and promotion gates.
- Treat `mechanism_patch_proposal`, controlled canary output, operator summaries, overclaim-boundary passes, and refs-only scaleout as proposal or evidence surfaces only, not adopted mechanisms, live progress, target-owner approval, App rendering proof, or target-domain truth.

</details>

## Commands

```bash
npm run typecheck
npm test
npm run test:behavior
npm run test:full
```

`typecheck` runs TypeScript's compiler gate over `scripts/**/*.ts` and `tests/**/*.ts`. `npm test` aliases `npm run test:smoke`, the default lightweight contract/source-purity lane. `npm run test:behavior` covers bootstrap, external-suite, work-order, owner-chain, and live-progress fixture-oracle behavior tests. `npm run test:full` runs the full Node test suite. Baseline, takeover, evidence, and interface commands are maintained in `package.json`, `contracts/action_catalog.json`, source, and focused tests.

`npm install` installs only OMA's development toolchain. OMA keeps no npm dependency on `opl-framework`; `scripts/run-with-repo-temp-env.sh` performs the read-only OPL `link-framework --check` prerequisite before verification and prints the OPL-owned repair command when the link is absent or stale.

## Further Reading

- [Project](./docs/project.md)
- [Status](./docs/status.md)
- [Architecture](./docs/architecture.md)
- [Invariants](./docs/invariants.md)
- [Decisions](./docs/decisions.md)
- [Contracts](./contracts/)
