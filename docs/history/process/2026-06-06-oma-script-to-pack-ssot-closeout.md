# 2026-06-06 OMA script-to-pack SSOT closeout

Owner: `opl-meta-agent`
Purpose: `script_to_pack_docs_governance_closeout`
State: `history_provenance`
Machine boundary: 本文只记录本次 SSOT-first 文档治理的范围、分类、改动和验证。当前 truth 继续归 `docs/active/opl-private-implementation-migration-inventory.md`、`runtime/authority_functions/meta-agent-authority-functions.json`、contracts、source、tests 和 OPL read models。

## Snapshot

- `RUN_SNAPSHOT_TS`: `2026-06-06T07:28:54Z`
- Repo: `/Users/gaofeng/workspace/opl-meta-agent`
- Semantic theme: `script-to-pack hygiene and wrapper no-resurrection`
- Governance mode: 按语义主题确定 SSOT，再做内容级合并与长清单压缩；不是按文件逐个润色。

## Single Source Of Truth

### Machine truth

- `runtime/authority_functions/meta-agent-authority-functions.json`
  - `script_morphology_policy.allowed_classes`
  - `script_morphology_policy.forbidden_roles`
  - `script_morphology_policy.script_to_pack_retirement_gates`
  - `source_purity_scan_receipt`
- `contracts/functional_privatization_audit.json`
  - `functional_structure_gap_count = 0`
  - `domain_repo_retained_generic_surface_count = 0`
  - forbidden active surface claims
  - OPL-owned replacement surfaces
- `contracts/default_caller_deletion_evidence.json`
  - generated surface owner stays `one-person-lab`
  - domain repo cannot restore local default wrappers, sidecars, workbench or compatibility facade
- `tests/source-purity.test.ts`
  - every `scripts/**/*.ts` must have explicit script-to-pack retirement or retention gate
  - forbidden wrapper/runtime/workbench/materializer roles must stay absent
  - retired materializer tails remain guarded by negative tests
- `package.json`
  - no `bin`, `main` or `exports`
  - active npm scripts remain action/smoke/materializer entries, not generated shell owners

### Human-doc owner

- `docs/active/opl-private-implementation-migration-inventory.md` owns per-script classification, active caller, retained authority, OPL migration domain, retirement gates and no-resurrection rules.
- `docs/active/opl-meta-agent-ideal-state-gap-plan.md` owns current progress/gap/prompt only.
- `docs/status.md` owns concise current status and evidence-tail summary only.
- `docs/docs_portfolio_consolidation.md` owns document roles and reopening conditions.

## Peer Docs Classification

| Document / section | Classification | Action |
| --- | --- | --- |
| `docs/active/opl-private-implementation-migration-inventory.md` | `covered_by_ssot` | No content edit; it remains the detailed human owner for script classifications and retirement gates. |
| `docs/active/opl-meta-agent-ideal-state-gap-plan.md` / current conclusion and source-purity notes | `covered_by_ssot` duplicate with active-plan role | Compressed repeated script-to-pack details into a pointer to private inventory + machine gates; preserved current gap and no-upgrade boundary. |
| `docs/status.md` / current status source-purity paragraph | `covered_by_ssot` duplicate with status-summary role | Compressed detailed script-to-pack explanation into concise current status; preserved SSOT pointer and no compatibility-surface guard. |
| `docs/docs_portfolio_consolidation.md` | `covered_by_ssot` for docs lifecycle | No edit; already states private inventory is the owner for script hygiene and migration gates. |
| `docs/architecture.md`, `docs/invariants.md`, `docs/decisions.md` | `more_specific_detail` | No edit; each keeps durable owner-split / no-resurrection / route-decision language without competing per-script inventory. |
| `README.md`, `README.zh-CN.md` | `out_of_scope` | No edit; public/technical entry wording remains high-level and does not carry per-script classification. |
| `docs/history/process/2026-06-05-oma-active-progress-and-retired-fixture-audit.md` | `history_or_provenance` | No edit; prior `takeover:test --fixture` audit remains single-surface provenance, not current SSOT. |

No physical module/interface/test/workflow deletion was authorized in this lane. Script retirement still requires the machine gate evidence named above.

## Modifications

- `docs/status.md`
  - Replaced a detailed script-to-pack paragraph with a concise SSOT pointer and no-upgrade rule.
- `docs/active/opl-meta-agent-ideal-state-gap-plan.md`
  - Compressed duplicated current-conclusion bullets for `functional_structure_gap_count=0` and script-to-pack gates.
  - Kept the active plan focused on current progress, open gaps and next prompt.
- `docs/history/process/README.md`
  - Indexed this closeout.

## Verification

Commands run from `/Users/gaofeng/workspace/opl-meta-agent`:

```bash
rtk git diff --check
rtk rg -n "^(<<<<<<<|=======|>>>>>>>)" README* docs agent/*/README.md
rtk rg -n "script-to-pack|script_to_pack|functional_structure_gap_count|repo-owned generic runtime|compatibility surface|已由 OPL 接管|已退役" docs/status.md docs/active/opl-meta-agent-ideal-state-gap-plan.md docs/active/opl-private-implementation-migration-inventory.md docs/docs_portfolio_consolidation.md
rtk /Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json
```

Result:

- `git diff --check`: pass.
- Conflict-marker scan over `README*`, `docs`, and `agent/*/README.md`: pass.
- Targeted scan confirms `docs/status.md` and the active plan now point to private inventory plus machine gates instead of carrying a second per-script owner map; private inventory remains the detailed SSOT for script hygiene.
- `opl-doc-doctor`: pass, `finding_count = 0`, active truth owner `docs/active/opl-meta-agent-ideal-state-gap-plan.md`, `markdown_doc_count = 17`.

## Remaining Scope

This lane covers only script-to-pack hygiene wording and no-resurrection currentness. It does not complete all OMA docs governance.

Carry forward:

- `registry_app_consumption` and App/workbench live evidence still need OPL/App-side receipts.
- `new_agent_consumption_scaleout`, real target patch-loop scaleout and independent reviewer attempts remain evidence tails.
- `agent/*/README.md` support indexes still deserve a separate pack-boundary lane.
- `README*` public narrative can be audited separately for OMA user-facing clarity after current technical lanes settle.

## Next Write Scope

Recommended next OMA lane:

- Semantic theme: `domain pack README support indexes versus machine-required pack paths`
- Candidate SSOT owner: `contracts/pack_compiler_input.json`, `contracts/stage_control_plane.json`, `agent/` real pack files and `tests/contracts-domain-pack.test.ts`.
- Peer docs: `agent/*/README.md`, `docs/README.md`, `docs/docs_portfolio_consolidation.md`, `README*`, `docs/active/opl-meta-agent-ideal-state-gap-plan.md`.
