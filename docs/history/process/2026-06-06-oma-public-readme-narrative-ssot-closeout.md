# 2026-06-06 OMA public README narrative SSOT closeout

Owner: `opl-meta-agent`
Purpose: `oma_public_readme_narrative_docs_governance_closeout`
State: `history_provenance`
Machine boundary: Human-readable closeout ledger. Current README role truth stays in docs lifecycle governance; technical truth stays in core docs, contracts, tests, OPL read models, and receipts.

## Snapshot

- Repo: `/Users/gaofeng/workspace/opl-meta-agent`
- Semantic theme: `public README narrative and operator technical details versus active truth`
- Governance mode: SSOT-first content-level audit. Keep root README files as product/public entry surfaces, not as a second active technical status or contract owner.

## Single Source Of Truth

Machine / core SSOT:

- `docs/docs_portfolio_consolidation.md`
  - owns README lifecycle role: public / bilingual repository entry.
- `docs/status.md`
  - owns current status, evidence tails, and forbidden readiness claims.
- `docs/architecture.md`
  - owns owner split, OPL / OMA / target-agent boundary, generated interface boundary, registration/App projection, and patch-loop explanation.
- `docs/invariants.md` and `docs/decisions.md`
  - own durable authority boundaries and delegated work-order decisions.
- `contracts/`, `agent/`, `runtime/authority_functions/`, source, tests, OPL read models, work-order receipts, and target owner receipt / typed blocker refs
  - own machine truth.

Human-doc owner:

- `README.md` and `README.zh-CN.md`
  - own public narrative, starting points, visible value, entry examples, and a compact operator boundary.

## Peer Docs Classification

| Document / section | Classification | Action |
| --- | --- | --- |
| `README.md` / Current Position And Boundary | `covered_by_ssot` with excess technical specificity | Kept public boundary bullets but replaced canary-specific no-overclaim list with a compact statement that canary and refs-only scaleout are evidence surfaces, not readiness or promotion claims. |
| `README.md` / Technical boundary for operators | `covered_by_ssot` and `stale_or_superseded` as duplicated current truth | Compressed long command/contract/currentness list into four bullets: natural-language Skill entry, action surfaces, canonical technical docs/contracts, OPL owner boundary, and no-overclaim rule. |
| `README.zh-CN.md` / 当前定位与边界 | `covered_by_ssot` with excess technical specificity | Mirrored the English public-boundary compression. |
| `README.zh-CN.md` / 给技术操作者看的机制说明 | `covered_by_ssot` and `stale_or_superseded` as duplicated current truth | Mirrored the English operator-detail compression. |
| `docs/status.md`, `docs/architecture.md`, `docs/invariants.md`, `docs/decisions.md` | `covered_by_ssot` | Remain the current technical owners; no edit in this lane. |
| `docs/project.md`, `docs/README.md`, `docs/docs_portfolio_consolidation.md` | `more_specific_detail` | Already explain repo role, reading order, and README lifecycle role. No edit. |
| `docs/history/process/*.md` prior closeouts | `history_or_provenance` | Remain dated provenance only. |

## Content-Level Consolidation

- Root README files now keep public / product narrative, examples, command entrypoints and compact guardrails.
- Detailed StageRun, build-agent-baseline, registry/App, patch-loop, generated interface, mechanism and execution-boundary current truth no longer lives in README as a parallel technical list.
- Technical readers are routed to `docs/status.md`, `docs/architecture.md`, `docs/invariants.md`, `docs/decisions.md`, and `contracts/`.
- Command examples remain examples only; they do not own current status, receipt fields, or machine contract semantics.

## Verification Plan

Run after this edit:

```bash
rtk git diff --check
rtk rg -n "^(<<<<<<<|=======|>>>>>>>)" README* docs agent/*/README.md
rtk /Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json
```

Targeted scan:

```bash
rtk rg -n "StageRun controlled canary evidence lives|legacy runtime residue guard lives|The parameterized action implementation is|Registry / App 消费入口在|参数化 action implementation 是|legacy runtime residue guard 位于|StageRun controlled canary evidence 位于" README.md README.zh-CN.md
```

## Remaining Scope

This lane covers only root README narrative / operator technical detail role consolidation. It does not complete full OMA docs governance or the OPL series goal.

Carry forward:

- Future target cohorts, independent reviewer direct evidence, App/OPL live consumption, standard target-agent handoff convergence, and script-to-pack hygiene remain evidence / implementation lanes.
- If README needs new technical examples, add only compact entry examples and route current truth back to core docs/contracts.
- Do not re-expand README into a second active plan, contract explainer, readiness ledger, or process closeout list.

## Next Write Scope

Recommended next OMA lane:

- Semantic theme: `standard target-agent handoff convergence versus domain-specific vocabulary`.
- Candidate SSOT owner: `contracts/foundry_agent_series.json`, `contracts/stage_control_plane.json`, `contracts/action_catalog.json`, external-suite tests, `docs/architecture.md`, `docs/invariants.md`.
- Peer docs: `README*`, `docs/project.md`, `docs/status.md`, `docs/architecture.md`, `docs/active/opl-meta-agent-ideal-state-gap-plan.md`, `docs/history/process/*.md`.
