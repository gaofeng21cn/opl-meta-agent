# 2026-06-06 OMA standard target-agent handoff vocabulary SSOT closeout

Owner: `opl-meta-agent`
Purpose: `oma_standard_target_agent_handoff_vocabulary_docs_governance_closeout`
State: `history_provenance`
Machine boundary: Human-readable closeout ledger. Current target-agent vocabulary truth stays in `contracts/foundry_agent_series.json`, action / suite contracts, tests, and active/core docs.

## Snapshot

- Repo: `/Users/gaofeng/workspace/opl-meta-agent`
- Semantic theme: `standard target-agent handoff convergence versus domain-specific vocabulary`
- Governance mode: SSOT-first content-level audit. Separate target-agent generic top-level vocabulary from MAS/MAG/RCA references used only as target-agent refs, owner routes, fixtures, receipt provenance, or real-target smoke evidence.

## Single Source Of Truth

Machine SSOT:

- `contracts/foundry_agent_series.json`
  - owns `target_agent_generic_vocabulary_policy`.
  - top-level OMA command families and suite kinds must remain `target_agent_generic_only`.
  - allowed top-level suite kinds are `agent_lab_external_suite` and `agent_production_evidence_suite`.
  - forbidden top-level domain-specific suite kind prefixes include `mas`, `mag`, `rca`, `med_autoscience`, `med_autogrant`, and `redcube_ai`.
  - domain names may appear only as `target_agent_id`, `target_agent_ref`, `owner_route_ref`, `fixture_ref`, `receipt_provenance_ref`, or `real_target_smoke_evidence_ref`.
  - OMA must not add a target-domain compatibility layer.
- `contracts/action_catalog.json`
  - owns OMA action surfaces as target-agent generic actions rather than MAS/MAG/RCA command families.
- `tests/contracts-foundry-series.test.ts`
  - asserts the exact Foundry-series target-agent generic vocabulary policy.
- `tests/contracts-generated-surfaces.test.ts`
  - proves generated top-level OMA commands and materializers stay target-agent generic.
- `tests/external-suite-owner-receipt-behavior.test.ts`
  - proves owner-receipt wording in a standard suite stays target-agent generic.

Human-doc owners:

- `docs/architecture.md`
  - owns the standard consumer boundary and explains that target agents adapt to Agent Lab / OMA standard handoff, not the reverse.
- `docs/invariants.md`
  - owns the durable prohibition against target-domain-specific Agent Lab suite kinds, OMA command families, or top-level OMA surface kinds.
- `docs/status.md`
  - owns the current evidence-tail readout for ongoing handoff convergence.
- `docs/active/opl-meta-agent-ideal-state-gap-plan.md`
  - owns the active gap / reopen trigger / next prompt for keeping MAS/MAG/RCA and new Foundry Agents on the same vocabulary.

## Peer Docs Classification

| Document / section | Classification | Action |
| --- | --- | --- |
| `contracts/foundry_agent_series.json` / `target_agent_generic_vocabulary_policy` | `covered_by_ssot` machine owner | Already owns the exact top-level vocabulary policy. No edit. |
| `tests/contracts-foundry-series.test.ts` | `covered_by_ssot` machine guard | Already asserts the exact policy, including allowed suite kinds, forbidden prefixes, allowed domain-name roles, and no compatibility layer. No edit. |
| `docs/architecture.md` / Standard Consumer Boundary and `agent:evidence` wording | `covered_by_ssot` current architecture owner | Already states Agent Lab / OMA consume target-agent generic handoff and do not maintain MAS/MAG/RCA private command families. No edit. |
| `docs/invariants.md` | `covered_by_ssot` hard constraint | Already forbids target-domain-specific Agent Lab suite kinds, OMA command families, and top-level OMA surface kinds. No edit. |
| `docs/status.md` / `standard_target_agent_handoff_convergence` | `covered_by_ssot` current evidence tail | Already keeps convergence open on the target-agent side while forbidding domain-specific OMA / Agent Lab command families. No edit. |
| `docs/active/opl-meta-agent-ideal-state-gap-plan.md` / current conclusion, reopen triggers, evidence gap, next prompt | `covered_by_ssot` active plan | Already says MAS/MAG/RCA names entering top-level OMA command family, suite kind, or long-term contract vocabulary reopens the standard consumer boundary gap. No edit. |
| `docs/README.md`, `docs/project.md`, `docs/docs_portfolio_consolidation.md` | `more_specific_detail` | Keep reading-order, role, and lifecycle summaries that restrict MAS/MAG/RCA to target refs, owner routes, fixtures, receipts, or provenance. No edit. |
| `README.md`, `README.zh-CN.md` | `more_specific_detail` public entry | Public/operator examples use generic action surfaces and route technical truth to core docs/contracts. No edit. |
| `agent/*/README.md` | `out_of_scope` support indexes | Pack support indexes do not define OMA top-level command or suite vocabulary. No edit. |
| `docs/history/process/*.md` prior closeouts | `history_or_provenance` | Prior MAS/MAG/RCA mentions are dated provenance or refs-only evidence context; current truth returns to machine contracts and active/core docs. |

No conflicts with the SSOT were found. This lane closed as a verification-and-ledger lane rather than a rewrite lane.

## Content-Level Consolidation

- The top-level vocabulary owner remains `contracts/foundry_agent_series.json`; active/core docs only summarize the boundary.
- MAS/MAG/RCA may appear in current docs as target refs, owner routes, fixtures, receipt refs, real-target evidence refs, or historical provenance.
- MAS/MAG/RCA may not become OMA command families, Agent Lab suite kind prefixes, top-level OMA surface kinds, or a target-domain compatibility layer.
- Because peer docs already follow this split, no active/current doc needed another wording pass.

## Verification

Commands run from `/Users/gaofeng/workspace/opl-meta-agent` after this edit:

```bash
rtk git diff --check
rtk rg -n "^(<<<<<<<|=======|>>>>>>>)" README* docs agent/*/README.md
rtk /Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json
rtk rg -n "MAS .*command family|MAG .*command family|RCA .*command family|mas_.*suite|mag_.*suite|rca_.*suite|domain-specific suite|专用 suite|专用 command|兼容层|target-agent generic|standard target-agent|standard consumer|suite kind|command family" README* docs/**/*.md agent/*/README.md contracts tests package.json
rtk rg -n "[[:blank:]]$" docs/history/process/2026-06-06-oma-standard-target-agent-handoff-vocabulary-ssot-closeout.md
rtk rg -n "(mas|mag|rca|med_autoscience|med_autogrant|redcube_ai)[-_](agent_lab_external_suite|agent_production_evidence_suite|suite|command|cmd|work_order)|\"suite_kind\"\s*:\s*\"(mas|mag|rca|med_autoscience|med_autogrant|redcube_ai)|\"command_family\"\s*:\s*\"(mas|mag|rca|med_autoscience|med_autogrant|redcube_ai)" README* docs/**/*.md agent/*/README.md contracts tests package.json
```

Result:

- `git diff --check` passed.
- Conflict-marker scan found no matches.
- OPL Doc doctor passed with `finding_count = 0`; doctor remains a preflight risk map, not semantic truth.
- Targeted vocabulary scan returned only allowed current-boundary statements, machine policy/tests, history/provenance, or target-agent refs. No MAS/MAG/RCA-specific OMA command family, Agent Lab suite kind prefix, top-level OMA surface kind, or compatibility layer was found.
- The new closeout file had no trailing whitespace.
- Narrow forbidden top-level vocabulary scan returned no matches.

## Remaining Scope

This lane covers only OMA top-level target-agent vocabulary and standard handoff wording. It does not complete full OMA docs governance or the OPL series goal.

Carry forward:

- Target agents still need to keep emitting the same standard handoff vocabulary over future MAS/MAG/RCA and new Foundry Agent cohorts.
- Future App/OPL live consumption, independent reviewer evidence, real source patch / rerun samples, and script-to-pack hygiene remain separate OMA lanes.
- If any doc or contract adds a MAS/MAG/RCA-specific OMA command family, suite kind, long-term top-level vocabulary, or compatibility layer, reopen this lane and restore target-agent generic vocabulary.

## Next Write Scope

Recommended next OPL series lane:

- Semantic theme: `one-person-lab-app release cohort evidence versus release-ready claims`.
- Candidate SSOT owner: App release evidence owner docs/contracts, release scripts, updater/Homebrew boundary docs, generated artifacts, and App active gap plan.
- Peer docs: App `README*`, `docs/release/**`, `docs/user-guides/**`, `docs/active/app-ideal-state-gap-plan.md`, `docs/docs_portfolio_consolidation.md`, and history/process closeouts.
