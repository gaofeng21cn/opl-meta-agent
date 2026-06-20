# OMA Retired Surface Provenance

Owner: `opl-meta-agent`
Purpose: `retired_surface_no_resurrection_provenance`
State: `historical_provenance`
Machine boundary: 本文只压缩记录已退役 surface 的 no-resurrection 规则和 current owner refs。当前机器真相继续归 contracts、runtime authority refs、source imports、tests、OPL read models 和 target owner receipts / typed blockers。

## Current Owner Map

| Theme | Current owner |
| --- | --- |
| script morphology、source-purity scan、retirement gates | `runtime/authority_functions/meta-agent-authority-functions.json` and source-purity tests |
| private implementation classification and script-to-pack gates | `docs/active/opl-private-implementation-migration-inventory.md` |
| active completion / gap / next prompt | `docs/active/opl-meta-agent-ideal-state-gap-plan.md` |
| target improvement policy | target-owned `default_change_refs` / `change_ref_mappings`, `scripts/lib/target-improvement-policy.ts`, external-suite tests |
| developer work-order and standard Foundry policy bodies | `contracts/developer_work_order_policy.json`, `contracts/standard_foundry_policies.json`, concrete source helpers |
| domain pack required paths | `contracts/pack_compiler_input.json`, `contracts/stage_control_plane.json`, non-README `agent/` pack files, pack tests |
| public narrative and technical boundary | root `README*`, `docs/status.md`, `docs/architecture.md`, `docs/invariants.md`, `docs/decisions.md` |

## Retired Surfaces

| Retired surface | Current replacement / evidence | No-resurrection rule |
| --- | --- | --- |
| `scripts/lib/meta-agent-loop.ts` aggregate re-export facade | Direct imports from `meta-agent-loop-io.ts`, `meta-agent-loop-ai-reviewer.ts`, and `meta-agent-loop-receipts.ts`; authority refs point to real helper implementations. | Do not restore an aggregate compatibility import path. New callers import the concrete helper that owns the responsibility. |
| `scripts/lib/stage-decomposition-pack-draft.ts` barrel re-export facade | Direct imports from `stage-decomposition-pack-draft-parts/{builder,materializer,shared,validator}.ts`; source-purity tests guard physical absence. | Do not restore a barrel, public export entry, or compatibility path. Further retirement requires OPL primitive parity plus no-active-caller and no-forbidden-write proof. |
| standalone policy projection helpers `scripts/lib/work-order-policy-constants.ts` and `scripts/lib/standard-foundry-policies.ts` | Policy truth lives in `contracts/developer_work_order_policy.json` and `contracts/standard_foundry_policies.json`; active helpers consume contracts directly. | Do not restore standalone policy helper, test oracle, or facade. New defaults stay in contracts and are read by concrete owner helpers. |
| generic target-improvement `external_agent/*` patch-ref fallback and `generic_patch_refs_only` | Target agents must declare explicit change refs / mappings, or OMA returns a typed blocker. | Do not synthesize source patch refs from generic failure taxonomy or old public paths; missing target-owned traceability blocks executable work orders. |
| basename / `external_opl_compatible_agent` target-agent identity fallback and docs-prose test oracle | Target identity comes from target descriptors/contracts and machine-readable handoff vocabulary. | Do not infer target identity from path basename, and do not use tests to lock prose in reference docs. |
| active machine fields `external_agent_allowed` and `external_opl_compatible_agents_allowed` | `contracts/owner_receipt_contract.json`, `scripts/takeover-agent.ts`, `tests/contracts-action-authority.test.ts`, and `tests/takeover-loop.test.ts` now use `target_agent_allowed` and `target_opl_compatible_agents_allowed`. | Do not restore old field names as compatibility aliases, parser fallbacks, payload mirrors, generated-interface fields, or docs-owned machine truth. |
| active `external-agent-takeover` / `takeover-external-agent-test` takeover identifiers and `external_agent_acceptance_chain` production-acceptance key | Current takeover stage/action/generated-interface/acceptance surfaces are `target-agent-takeover`, `takeover-target-agent-test`, `opl_meta_agent_takeover_target_agent_test`, `opl-meta-agent.takeover-target-agent-test`, and `target_agent_acceptance_chain`; source and tests assert no resurrection. | Do not restore the old takeover identifiers as active action ids, stage ids, generated tool names, skill command contracts, product-entry action keys, production acceptance keys, Stage Native refs, or compatibility aliases. |
| `takeover:test --fixture` parser branch | `takeover:test` accepts explicit `--agent-dir`, `--output-dir`, and `--opl-bin`; unknown arguments fail through the ordinary parser path. | Do not restore a special `--fixture` alias, public package script, alias-specific error wording, or fixture materialization route. |
| direct graph / no-`--domain-id` implicit fixture baseline path | `build-agent-baseline` consumes live or explicit Codex `stage-decomposition` typed closeout; fixture runner is proof/test-only with explicit closeout packet. | Do not restore implicit graph production, direct script-authored stage graph fallback, or compatibility materialization path. |
| OMA-specific Progress-First aliases `substantive_deliverable_delta_refs`, `platform_interface_repair_refs`, and stage policy alias maps | Canonical accounting is `progress_delta_classification`, `deliverable_progress_delta`, `platform_repair_delta`, and `target_progress_accounting_ref`. | Do not accept or emit OMA-specific alias fields, compatibility parsers, or alias maps. |
| repo-local Codex plugin / Skill wrapper, installer, sidecar, status shell, workbench shell, lifecycle placeholder, registry owner, App shell | OPL Framework/App own generated/hosted interfaces, registry/discovery, workbench shell, work-order execute/absorb/cleanup, queue, attempt ledger, and promotion gates. | Do not recreate repo-owned generic CLI/MCP/Skill/product-entry wrapper, sidecar/status/workbench, scheduler, queue, attempt ledger, registry/App shell, or promotion engine. |
| MAS/MAG/RCA-specific OMA command families, suite kinds, or compatibility layers | OMA consumes standard target-agent handoff; MAS/MAG/RCA names may appear only as target refs, owner routes, fixtures, receipts, or provenance. | Do not add target-domain-specific OMA command families, Agent Lab suite prefixes, or top-level surface kinds. |
| production acceptance tests that duplicate new-agent evidence body semantics | Evidence body truth stays in `contracts/production_acceptance/new_agent_consumption_evidence.json`; tests check aggregate acceptance, ref linkage, and source refs. | Do not make tests a second owner of evidence-body prose or contract body semantics. |
| history/process dated closeout files as current truth | Current truth lives in active/core docs, contracts, source, tests, runtime authority refs, and OPL read models; this file keeps compressed provenance. | Do not recreate per-tranche process logs as active docs or link them as readiness, production, App live, owner receipt, quality verdict, or default promotion evidence. |
| standalone `docs/history/process/target-agent-machine-field-retirement.md` closeout file | The field-retirement provenance is folded into `docs/history/process/README.md` and this no-resurrection table. | Do not recreate a single-lane field-retirement closeout file as an active or current-history target; keep current field truth in contracts/source/tests and compressed provenance here. |

## Evidence Boundary

Retired-tail refs can prove absence, replacement owner, no-active-caller direction, and no-resurrection intent. They cannot authorize production readiness, target-domain readiness, quality/export verdict, owner receipt body, App live rendering, human approval, default promotion, or OPL/App/target-owner authority.

When a retired surface is needed again, reopen the relevant current owner doc and machine contract first. Do not reintroduce the path as compatibility, fallback, alias, facade, wrapper, or test-only convenience.
