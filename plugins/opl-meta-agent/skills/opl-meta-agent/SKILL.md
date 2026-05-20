---
name: opl-meta-agent
description: Use when Codex should operate OPL Meta Agent to design, test, improve, or take over testing for OPL-compatible Foundry Agents without owning generic runtime or target domain truth.
---

# OPL Meta Agent App Skill

Use this plugin when a user wants to turn a high-value knowledge workflow into an OPL-compatible Foundry Agent, improve an existing agent through Agent Lab evidence, or take over testing orchestration for an external OPL-compatible agent.

## What This Plugin Owns

- Agent-building intent intake, public pattern research, stage decomposition, prompt and skill references, quality gate references, and baseline package policy.
- Agent Lab suite construction and interpretation for agent-building workflows.
- Mechanism patch proposals, developer work orders, and online-learning candidate refs.

## Boundary

- OPL Framework owns generic runtime, Agent Lab execution, queue, attempt ledger, generated interfaces, observability, and promotion gates.
- Target domain agents own their own domain truth, memory body, artifact body, quality verdicts, export verdicts, and default promotion decisions.
- OPL Meta Agent can produce candidate package refs, receipts, gated improvement refs, and developer patch work orders; it cannot bypass target-owner gates.

## Default Flow

1. Read `docs/project.md`, `docs/architecture.md`, `docs/status.md`, and the relevant contract refs.
2. Freeze the target agent brief, forbidden writes, quality gates, and baseline acceptance criteria.
3. Use the `agent/` pack refs for prompts, stages, skills, quality gates, and knowledge.
4. Generate or inspect candidate package refs, then validate through OPL scaffold/interface and Agent Lab evidence.
5. Emit receipts, mechanism patch proposals, or developer work orders as refs-only outputs.
6. For product-facing use, route through the OPL registry discovery receipt and App drilldown readiness receipt; these are refs-only product consumption surfaces and do not claim live rendering, target truth writes, artifact mutation, or default promotion.

## Useful Commands

- `npm run bootstrap:sample -- --output-dir <dir> --opl-bin <opl-bin>`
- `npm run takeover:test -- --agent-dir <agent-dir> --output-dir <dir> --opl-bin <opl-bin>`
- `npm run improve:external-suite -- --suite <suite.json> --target-agent-dir <agent-dir> --output-dir <dir> --opl-bin <opl-bin>`

Always keep generated interfaces derived from contracts, and do not add repo-owned generic wrappers.
