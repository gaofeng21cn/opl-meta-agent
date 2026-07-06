---
name: oma-agent-evolution
description: Use when OMA must diagnose Agent Lab, FeedbackOps, work-order, or App projection failures and route them to an owner-gated agent design/source patch.
---

# OMA Agent Evolution

## Purpose

Turn Agent Lab, FeedbackOps, owner-feedback, work-order validation, and refs-only App/workbench projection evidence into an OMA-owned agent-evolution decision: patch target-agent design/source surfaces, return a typed blocker, or route back to OPL / target owner. This skill is owned by `opl-meta-agent`; it is not MAS ScholarSkills and it does not hold target-domain truth.

## Diagnosis Router

Classify one primary `failure_class` before authoring a work order:

- `stage-route`: stage graph, closeout packet, owner route, next-stage transition, or stage policy mismatch.
- `specialist-skill`: prompt, professional skill, rubric, domain pack, candidate package, or target-agent source design gap.
- `tool-connector`: CLI, MCP, connector, affordance catalog, scaffold/generator invocation, or tool binding failure.
- `quality-gate`: Agent Lab suite, independent reviewer, regression, quality gate, or promotion gate evidence gap.
- `read-model-currentness`: stale route ledger, status/read-model projection, generated interface, or currentness proof mismatch.
- `authority-boundary`: missing no-forbidden-write proof, forbidden target truth/artifact/memory/quality write, owner receipt boundary, or promotion authority violation.
- `app-observability`: refs-only App/workbench projection, drilldown, evidence display, or operator readback gap.

## Patch Playbook

1. Read evidence refs: Agent Lab result, reviewer direct evidence, target handoff, owner route, no-forbidden-write proof, and current work-order policy.
2. Pick `failure_class`; if evidence spans classes, choose the class that owns the first repairable boundary and list secondary refs in `failure_evidence_refs`.
3. Bind target edit scope to target-owned `capability_map` or explicit work-order policy. Do not infer patch targets from MAS, MAG, RCA, owner receipt, package, or typed-blocker keywords.
4. Emit or validate these work-order fields: `agent_evolution_decision_ref`, `failure_class`, `target_owner_route`, `target_editable_surface_refs`, `forbidden_surfaces`, `expected_behavior_delta`, `verification_refs`, and `owner_closeout_readback`.
5. Patch only agent design/source surfaces authorized by the work order. Never write target truth, memory body, artifact body, quality/export verdict, owner receipt body, typed blocker body, App runtime state, or default promotion.
6. Require focused target verification plus owner closeout readback: target owner receipt or typed blocker, no-forbidden-write proof, target runtime/read-model consumption, patch absorption, cleanup, and Agent Lab re-evaluation refs.

## Route Back

- OPL / Agent Lab owns runner, queue, attempt ledger, generated interface, promotion gate, work-order execute, absorb, cleanup, App/workbench runtime, and observability backend.
- Target domain owner owns domain truth, artifact body, memory body, quality/export verdict, owner receipt, typed blocker, human gate, and final owner acceptance.
- OMA owns agent-building diagnosis, source/design patch proposal, work-order materialization, mechanism proposal, and typed blocker shape only.
