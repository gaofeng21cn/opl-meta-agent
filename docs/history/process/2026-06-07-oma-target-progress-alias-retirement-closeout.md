# OMA target progress alias retirement closeout

Owner: `opl-meta-agent`
Purpose: `retired_surface_closeout`
State: `historical_provenance`
Machine boundary: 本文只记录 OMA target-progress alias 字段与 stage progress alias 映射的退役范围、替代 owner、验证和 no-resurrection 规则。当前机器真相继续归 `contracts/`、source、tests、OPL work-order delegation 和 App projection contracts。

## Retired surface

OMA developer patch work orders no longer emit or accept these compatibility fields under `target_progress_accounting`:

- `substantive_deliverable_delta_refs`
- `platform_interface_repair_refs`

Standard Foundry progress-delta policy contracts and generated stage-control consumer surfaces also no longer expose alias maps:

- `deliverable_delta_aliases`
- `platform_delta_aliases`

## Replacement owner

The canonical Progress-First accounting surface is:

- `target_progress_accounting.progress_delta_classification`
- `target_progress_accounting.deliverable_progress_delta`
- `target_progress_accounting.platform_repair_delta`
- `target_progress_accounting_ref`

`deliverable_progress_delta.refs` and `platform_repair_delta.refs` are the only machine-readable refs used by OMA validation, work-order generation, App projection and stage-control policy. OMA-specific aliases are not retained as compatibility input or generated output.

## Verification boundary

This closeout must be read with these machine guards:

- `scripts/lib/work-order-builders.ts` emits only canonical progress delta fields.
- `scripts/lib/work-order-validation.ts` rejects retired alias fields before delegating to OPL work-order execution.
- `contracts/app_workbench_projection.json`, `contracts/standard_foundry_policies.json`, `contracts/stage_control_plane.parts/stages/*.json` and `contracts/stage_control_plane.json` expose only canonical progress fields.
- `tests/execute-external-work-order.test.ts`, `tests/external-suite-developer-work-order.test.ts`, `tests/external-suite-patch-loop-projection.test.ts`, `tests/external-suite-owner-receipt-behavior.test.ts`, `tests/contracts-stage-control.test.ts`, `tests/stage-decomposition-materializer.test.ts` and `tests/source-purity.test.ts` guard the no-alias surface.

## No resurrection

Do not restore these aliases as a fallback, compatibility parser, App projection field, stage policy alias map, fixture convenience field, wrapper, facade, or documentation-only current surface. If a target agent or downstream consumer needs progress accounting, it must consume the OPL family canonical fields above or return a typed blocker / owner-delta request for its own migration.
