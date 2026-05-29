<p align="center">
  <img src="assets/branding/opl-meta-agent-logo.png" alt="OPL Meta Agent logo" width="132" />
</p>

<p align="center">
  <a href="./README.md"><strong>English</strong></a> | <a href="./README.zh-CN.md">中文</a>
</p>

<h1 align="center">OPL Meta Agent</h1>

<p align="center"><strong>A Foundry Agent for building, testing, and delivering new high-value knowledge-work agents on OPL Framework</strong></p>
<p align="center">Agent Building · Agent Lab Evaluation · Mechanism Evolution</p>

<table>
  <tr>
    <td width="33%" valign="top">
      <strong>Who It Serves</strong><br/>
      Developers, maintainers, and operators who want to turn a high-value knowledge workflow into an OPL-compatible domain agent
    </td>
    <td width="33%" valign="top">
      <strong>What It Organizes</strong><br/>
      User intent, public patterns, stage plans, agent skeletons, Agent Lab suites, baseline receipts, and mechanism patch proposals
    </td>
    <td width="33%" valign="top">
      <strong>How To Start</strong><br/>
      Describe the target agent deliverable, authority boundary, quality bar, and runtime constraints, then generate a tested baseline
    </td>
  </tr>
</table>

<p align="center">
  <img src="assets/branding/opl-meta-agent-overview.png" alt="OPL Meta Agent overview" width="100%" />
</p>

> `opl-meta-agent` is an independent OPL-compatible domain agent. It owns agent-building domain semantics; OPL Framework owns the generic runtime, Agent Lab, scaffold surface, queue, attempt ledger, observability, optimizer / RL transition refs, and promotion gates.

## One-Sentence Quick Start

You can start with prompts like:

- "Turn this high-value knowledge workflow into an OPL-compatible agent, and first define the deliverable, boundary, and quality bar."
- "Take over testing for this existing agent repo, generate an Agent Lab suite, takeover receipt, and self-evolution candidate, but keep its domain truth with the owner."
- "After an Agent Lab run, convert the failure evidence into a mechanism patch proposal and wait for an explicit gate before adopting it."

## What It Helps With

- Decomposing a new agent idea into intent analysis, public-pattern research, stage planning, agent skeletons, eval suites, baseline runs, delivery, and online learning.
- Generating OPL-compatible descriptors, stage/action metadata, memory/artifact locators, quality gates, and owner receipts through OPL scaffold surfaces.
- Building Agent Lab external suites, recovery probes, scorecard refs, and promotion gates for new or existing external agents.
- Producing baseline delivery receipts, gated online-learning candidates, and mechanism patch proposals.
- Turning real Agent Lab evidence into reviewable, rollback-friendly, gate-controlled next mechanism candidates.

## How It Works

- The user provides the target domain, deliverable, quality bar, non-goals, and runtime constraints.
- `opl-meta-agent` organizes public patterns, decomposes stages, generates a candidate agent package, and runs suites through OPL Agent Lab.
- Agent Lab returns refs-only suite results; this repo turns them into baseline receipts, online-learning candidates, and mechanism patch proposals.
- Mechanism changes, default-agent promotion, quality adoption, and real delivery authority require an explicit gate or the target domain owner.

## Agent Lab Self-Evolution Loop

<p align="center">
  <img src="assets/branding/opl-meta-agent-evolution-loop.png" alt="OPL Meta Agent Agent Lab self-evolution loop" width="100%" />
</p>

The loop does not directly rewrite final answers. It turns each run into an auditable mechanism-improvement object:

- `observe`: read Agent Lab segment runs, trajectory refs, failure refs, and candidate refs.
- `diagnose`: produce an `evidence_delta_ref` for repeated failures, wasted budget, validator gaps, or stage drift.
- `edit`: emit only a `next_mechanism_candidate_ref` covering prompt policy, skill policy, stage policy, Agent Lab suite policy, takeover review policy, optimizer candidate policy, or quality gate policy.
- `gate`: mechanism patches remain proposal-only surfaces. They cannot write target truth, memory bodies, artifact bodies, quality verdicts, or bypass explicit promotion gates.

## Current Position And Boundary

- `opl-meta-agent` is an agent-building `Foundry Agent`: an independent domain agent that turns target-agent requirements into a tested, deliverable, continuously improvable baseline agent package.
- The design has moved from contract-ready to a Codex-attempt-native usable landing plan: the next target is to launch a real stage contract, run an independent Codex reviewer attempt against direct evidence, have OPL registry / App consume the projection, drive a real blocked target through patch -> rerun -> owner receipt, and keep script-to-pack hygiene by moving growing agent-building rules back into the pack or explicit authority refs.
- `agent/` is the real domain pack entry for this repo. `knowledge/`, `prompts/`, `quality_gates/`, `skills/`, and `stages/` must expose resolvable, non-empty, placeholder-free domain-owned files, and `contracts/stage_control_plane.json` stage prompt, skill, knowledge, and evaluation refs must resolve to those files.
- `opl-meta-agent` is an OPL-compatible package built on OPL Framework. It consumes OPL scaffold, Agent Lab, queue/projection, and promotion gates without rebuilding generic runtime.
- CLI, MCP, Skill, product-entry, and tool descriptors are generated by OPL Framework from this repo's action / stage contracts; this repo does not own a private generic wrapper layer.
- Generated interfaces may invoke declared minimal authority functions and domain smoke actions, but they only project refs, receipts, blockers, and candidates. They cannot write domain truth, memory bodies, artifact bodies, quality/export verdicts, or promote a default agent without a gate.
- Existing generated-surface, registration, and App projection proof only shows OPL-consumable surfaces. It does not mean the target domain is ready, a quality verdict has been signed, App live rendering has happened, or a generated target agent can become default.
- OPL Framework owns generic runtime, Agent Lab, standard scaffold, queue, attempt ledger, provider receipts, observability, optimizer/RL transition refs, and promotion gates.
- The target domain agent owns its own domain truth, quality verdict, artifact authority, memory body, and owner receipt.
- For agents that were not created by `opl-meta-agent`, this repo can still take over testing orchestration and self-evolution candidate generation. It still only emits Agent Lab suites, takeover receipts, gated candidates, and mechanism patch proposals.
- This repo does not train or deploy model weights, promote default agents without gates, or write target memory bodies, artifact bodies, quality/export verdicts, or domain truth.

<details>
  <summary><strong>Technical boundary for operators</strong></summary>

- The standard Skill entry is natural language: a user can ask Codex to build an OPL-compatible agent for a named delivery workflow. Codex maps that request to `domain_id`, `domain_label`, `delivery_domain`, `target_brief`, `output_dir`, `opl_bin`, stage-decomposition runner settings, and `ai_reviewer_evaluation`, then invokes the `build-agent-baseline` action.
- The default `build-agent-baseline` path launches or consumes a Codex `stage-decomposition` typed closeout. That closeout is the source of the target stage graph, action refs, pack files, independent gate policy, and quality gate declarations; scripts only validate, materialize, run scaffold/Agent Lab, and record receipts.
- The parameterized action implementation is `npm run build-agent-baseline -- --output-dir <dir> --opl-bin <opl> --ai-reviewer-evaluation <reviewer-eval.json> [--stage-runner fixture|live] [--stage-decomposition-closeout <closeout.json>] --domain-id <domain-id> --domain-label <label> --delivery-domain <delivery-domain> --target-brief <brief>`: generate the requested target agent repo from the typed stage-decomposition packet, call OPL scaffold validation, generate an Agent Lab external suite, run `opl agent-lab run --suite`, consume a structured AI reviewer evaluation, and write a baseline receipt, real-target delivery receipt, scaleout evidence ledger, online-learning candidate, and `mechanism-patch-proposal.json`.
- Free text closeouts, partial refs, missing independent gate policy, missing quality gate declaration, or self-review fail closed before a baseline receipt is signed.
- `--domain-id` is required. The retired implicit fixture smoke is no longer a materialization path, and real-target evidence is emitted for the explicit target agent only.
- The takeover path is `npm run takeover:test -- --agent-dir <existing-agent-dir> --output-dir <dir> --opl-bin <opl>`: read target agent descriptors/contracts, generate a takeover suite, run Agent Lab, and write a takeover receipt, gated self-evolution candidate, and `takeover-mechanism-patch-proposal.json`.
- The unified interface path is `opl agents interfaces --repo-dir <this-repo> --json`: OPL reads the standard contracts and emits CLI, MCP, Skill, product-entry, OpenAI tool, and AI SDK descriptors.
- The Agent evidence takeover path is `npm run agent:evidence -- --agent-repo <agent-repo> --output-dir <dir> --opl-bin <opl> [--ai-reviewer-evaluation <reviewer-eval.json>]`: read target production acceptance, Agent Lab handoff, generated-surface handoff, and owner-receipt contracts, generate `agent-lab-suite.json` with `suite_kind=agent_production_evidence_suite`, run `opl agent-lab run --suite`, and emit refs-only developer work order, domain agent capability candidate, mechanism patch proposal, or a typed blocker when reviewer evaluation is missing.
- The usable landing verification path is not another waiting phase for contracts. It should trigger blocked evidence in a real target repo, materialize a developer patch work order, let Codex patch only the allowed surfaces, rerun target verification, and collect the owner receipt. The independent reviewer attempt must carry direct evidence, no shared context, and rollback/version refs.
- A mechanism patch proposal records `mechanism_ref/version`, `editable_surfaces`, `observe/diagnose/edit`, `segment_run_ref`, `evidence_delta_ref`, `next_mechanism_candidate_ref`, and proposal-only authority flags.
- OPL Agent Lab's mechanism surface is a refs-only control plane. It can expose `opl agent-lab mechanism --json` and `opl agent-lab evolve --suite <suite.json> --json`, but it cannot upgrade suite pass, mechanism candidate, or evolution segment into a domain verdict.

</details>

## How To Read This Repository

1. Start here, then continue to [Project](./docs/project.md) and [Status](./docs/status.md).
2. Technical readers should read [Architecture](./docs/architecture.md), [Invariants](./docs/invariants.md), and [Decisions](./docs/decisions.md).
3. Machine-readable surfaces live under [`contracts/`](./contracts/), smoke scripts live under [`scripts/`](./scripts/), and the test entry is `npm test`.

## Agent And Operator Quick Start

<details>
  <summary><strong>Start here if you are handing this repo to Codex or another agent</strong></summary>

- Read this README plus [Project](./docs/project.md), [Status](./docs/status.md), [Architecture](./docs/architecture.md), [Invariants](./docs/invariants.md), and [Decisions](./docs/decisions.md).
- When changing contracts, README, docs, or smoke scripts, update `tests/*.test.ts` so boundary flags still prove proposal-only / refs-only behavior.
- This repo owns agent-building semantics and testing/self-evolution orchestration. Use OPL Agent Lab for real runs, longline suites, mechanism read models, and evolution segments.
- Do not treat `mechanism_patch_proposal` as an adopted mechanism. It is only a candidate that may enter a gate.
- Do not treat takeover as ownership of the target agent's domain truth, memory body, artifact authority, or quality verdict.

</details>

## Commands

```bash
npm run typecheck
npm test
```

`typecheck` runs TypeScript's compiler gate over `scripts/**/*.ts` and `tests/**/*.ts`. The test suite verifies contract fields, the OPL-generated interface bundle, real `agent/` domain pack files, stage prompt/skill/knowledge/evaluation ref path resolution, non-empty files, and placeholder absence.

```bash
npm run build-agent-baseline -- --output-dir /Users/gaofeng/workspace/research-workbench-agent --opl-bin /Users/gaofeng/workspace/one-person-lab/bin/opl --ai-reviewer-evaluation /tmp/reviewer-eval.json --domain-id research-workbench-agent --domain-label "Research Workbench Agent" --delivery-domain research_workbench --target-brief "Create an OPL-compatible research workbench agent that turns a user research question into a scoped plan, evidence ledger, and owner-gated brief."
```

```bash
npm run takeover:test -- --agent-dir /tmp/opl-meta-agent-demo/research-workbench-agent --output-dir /tmp/opl-meta-agent-takeover --opl-bin /Users/gaofeng/workspace/one-person-lab/bin/opl
```

```bash
npm run agent:evidence -- --agent-repo /Users/gaofeng/workspace/med-autoscience --output-dir /tmp/opl-meta-agent-agent-evidence --opl-bin /Users/gaofeng/workspace/one-person-lab/bin/opl --ai-reviewer-evaluation /tmp/mas-reviewer-eval.json
```

```bash
/Users/gaofeng/workspace/one-person-lab/bin/opl agents interfaces --repo-dir . --json
```

## Further Reading

- [Project](./docs/project.md)
- [Status](./docs/status.md)
- [Architecture](./docs/architecture.md)
- [Invariants](./docs/invariants.md)
- [Decisions](./docs/decisions.md)
- [Contracts](./contracts/)
