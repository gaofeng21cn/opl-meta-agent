---
name: opl-meta-agent
description: Use only when the current request explicitly asks to create, take over, assess, or improve an OPL-compatible Agent.
---

# OPL Meta Agent

OMA supplies Agent-engineering semantics to the OPL Foundry Kernel. OPL owns execution, candidate bytes, evaluation runs, versions, activation, and rollback.

## Admission

- Admit OMA when the current request names a target Agent and an explicit Agent-engineering objective that maps to `create`, `takeover`, or `improve`.
- An OMA mention or shortcut is context, not an engineering request. Keep unrelated deliverables with their owner unless the user makes the Agent change explicit.

## Action Routing

Use the single public action `engineer-agent` through the installed OPL-generated interface:

- `create`: design a new target Agent.
- `takeover`: assess an exact existing target version and define its OPL qualification obligations.
- `improve`: evolve an exact existing target version from evidence or an explicit improvement objective.

The ordinary hosted entry is `opl agents run --domain oma --action engineer-agent`. OPL Foundry Kernel may invoke the internal provider operations `design` and `diagnose`; they are not public actions or user tools.

## Default Workflow

1. Build one `DesignRequest` with the exact mode, target identity/version, objective, acceptance criteria, non-goals, source refs, constraints, and delivery policy.
2. Invoke `engineer-agent` once and keep all subsequent design, evidence, diagnosis, and evolution objects in the same OPL FoundryRun lineage.
3. Let `design` return one complete `AgentBlueprint` with an embedded `EvalSpec`; let OPL materialize candidate bytes and execute independent evaluation.
4. When OPL supplies an exact `EvidenceBundle`, let `diagnose` return one complete `EvolutionProposal` and the next full blueprint.
5. Leave qualification, canary, activation, rollback, and protected-test handling to OPL and the target owner.

## Quality And Hard Stops

- Bind every diagnosis to the exact evidence digest. Return the current blueprint with an empty semantic diff when no admissible Agent-semantic change exists.
- Preserve `constraints.permission_refs` and existing evaluation obligations. OMA may raise risk or add tests, but it cannot expand permissions, lower OPL risk, remove tests, or inspect protected test bodies.
- Use `opl-content://sha256/...` refs for content-bearing prompts, Skills, knowledge, helpers, models, tools, and schemas. Their exact bytes must be available as SHA-bound StageRun artifacts.
- Stop on missing target identity/version for `takeover` or `improve`, missing owner authorization for protected changes, or an authority/safety boundary.

## Output Expectations

- Return the OPL FoundryRun ref plus the admitted mode, exact target, scoped objective, and acceptance criteria.
- Treat `AgentBlueprint`, `EvalSpec`, and `EvolutionProposal` as semantic protocol objects, not implementation instructions or proof of qualification.
- Never emit a developer work order, repository patch, or execution instruction,
  including for professional Skill maintenance. OMA may describe the Agent
  semantics and evaluation obligations only; OPL and authorized repository
  developers own implementation routes.
- State explicitly that provider completion means only that a protocol object was produced. Only OPL evidence and target-owner receipts can establish qualification or adoption.

## References

- `contracts/action_catalog.json`
- `contracts/foundry_provider.json`
- `contracts/foundry_protocol_fixture_manifest.json`
- `contracts/stage_quality_cycle_policy.json`
- `agent/stages/manifest.json`
