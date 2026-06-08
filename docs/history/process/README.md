# opl-meta-agent 过程历史

Owner: `opl-meta-agent`
Purpose: `process_history_index`
State: `historical_archive_index`
Machine boundary: 本目录只记录人读治理过程、覆盖 ledger、退役 provenance 和 no-resurrection 说明；机器真相继续归 contracts、agent pack、runtime authority refs、source、tests、OPL read models 和 target owner receipts。

## 读法

本文件是 OMA process / coverage / cleanup provenance 的压缩索引。历史过程只保留主题级 provenance，不保留逐日 closeout 长清单。若某条历史结论仍有当前规则价值，先折回 `docs/docs_portfolio_consolidation.md`、核心五件套、active gap plan、private inventory、contracts、authority refs、source 或 tests，再把过程记录压缩在本目录。

## Single Source Of Truth

| Theme | Current owner |
| --- | --- |
| 当前完成口径、功能/结构差距、测试/证据差距、下一轮 prompt | `docs/active/opl-meta-agent-ideal-state-gap-plan.md` |
| north-star / target-state | `docs/references/opl-meta-agent-ideal-state.md` |
| 文档生命周期、目录职责、inventory groups、reopening conditions | `docs/docs_portfolio_consolidation.md` |
| 私有实现分类、script hygiene、上收候选、退役门 | `docs/active/opl-private-implementation-migration-inventory.md` |
| 当前状态和 evidence tail 摘要 | `docs/status.md` |
| 硬边界和 forbidden claims | `docs/invariants.md` |
| 仍有效决策 | `docs/decisions.md` |
| 退役 surface no-resurrection provenance | [`retired-surface-provenance.md`](./retired-surface-provenance.md) |

## Compressed Provenance

| Provenance group | What remains here | What moved out |
| --- | --- | --- |
| Docs lifecycle and coverage | 本索引只记录当前 SSOT owner、coverage snapshot 和 reopen 入口。 | Dated coverage tranche、doctor transcript、branch/worktree closeout、per-file proof log 不再以单独 Markdown 文件维护。 |
| Retired module/interface/test/workflow/entrypoint tails | `retired-surface-provenance.md` 保留 no-resurrection rules 和 current owner refs。 | 单次 facade / fallback / alias / test-thinning / docs-index closeout 文件已压缩。 |
| Target-agent field-only closeout | 本索引和 `retired-surface-provenance.md` 只保留 `external_agent_allowed` / `external_opl_compatible_agents_allowed` 字段迁移 provenance。 | 旧单次 closeout 文件已删除；当前 takeover vocabulary、contract truth、action ids 和 generated interface truth 回到 contracts/source/tests、active plan、private inventory 和 later process summaries。 |
| Evidence-tail currentness | 当前读法回到 active plan、status、contracts、OPL read model 和 tests。 | registry/App、production-consumption、patch-loop、reviewer projection 的 dated proof transcript 不再作为当前 truth 保存。 |

## Coverage Snapshot

2026-06-08 OMA README/docs lifecycle coverage tranche:

- Theme / SSOT: whole OMA human-doc role coverage for root `README*`, `docs/**/*.md`, and tracked `agent/*/README.md`. Current completion / gap / next prompt remains `docs/active/opl-meta-agent-ideal-state-gap-plan.md`; lifecycle role map remains `docs/docs_portfolio_consolidation.md`; north-star remains `docs/references/opl-meta-agent-ideal-state.md`; script hygiene / private implementation gates remain `docs/active/opl-private-implementation-migration-inventory.md`; retired surface no-resurrection remains `docs/history/process/retired-surface-provenance.md`; machine truth remains contracts, agent pack, runtime authority refs, source and tests.
- Reviewed: root `README.md`, `README.zh-CN.md`, `docs/README.md`, `docs/project.md`, `docs/status.md`, `docs/architecture.md`, `docs/invariants.md`, `docs/decisions.md`, `docs/docs_portfolio_consolidation.md`, `docs/active/opl-meta-agent-ideal-state-gap-plan.md`, `docs/active/opl-private-implementation-migration-inventory.md`, `docs/references/opl-meta-agent-ideal-state.md`, `docs/history/README.md`, this process index, `docs/history/process/retired-surface-provenance.md`, the then-existing field-only closeout, and `agent/{knowledge,prompts,quality_gates,skills,stages}/README.md`.
- Coverage result: OMA's long-lived docs have one clear role each. Root READMEs remain public entries with folded technical boundaries; docs core files retain project / status / architecture / invariants / decisions; active docs retain gap and private-implementation inventory; agent README files remain human support indexes and are not machine-required pack paths; history/process remains compressed provenance only.
- Stale / retire scan result: old `external_agent` machine fields, `external-agent-takeover`, `takeover:test --fixture`, implicit fixture graph, compatibility facade, wrapper, sidecar, workbench, App live / production ready / domain ready / quality verdict / owner receipt overclaims are either absent from current surfaces or present only as forbidden/no-resurrection/history wording. `external-suite` and `external-work-order` remain active Agent Lab external-suite and OPL work-order delegation semantics, so they are not stale-retirement candidates.
- Edited: this process index only. No source, contract, test, active plan, lifecycle map, README or agent pack support index required text changes in this tranche.
- Verification boundary: OPL Doc doctor reported `finding_count=0` and `active_truth_health.status=pass`; a stale/no-resurrection term scan over `README*`, `docs`, and tracked `agent/*/README.md` found no new active stale surface that requires retirement in this tranche. Follow-up verification should still run `git diff --check` and conflict-marker scan before commit.
- Remaining OMA scope under the parent OPL series goal: future work should target live evidence tails from the active plan, especially registry/App consumption, more non-fixture target cohorts, real blocked target patch-loop scaleout, independent Codex reviewer attempt, standard target-agent handoff convergence and script-to-pack hygiene. This tranche does not close those evidence tails and does not close the six-repo docs lifecycle goal.
- Next write scope: continue in clean repos with a concrete SSOT lane. For OMA, prefer evidence-tail or script-to-pack work that changes active plan / private inventory / contracts / tests only after fresh live truth intake; do not reopen `external-suite` / external-work-order as stale vocabulary without replacement machine truth.

2026-06-08 external-suite / external-work-order active-surface audit tranche:

- Reviewed: root `README*`, current docs and history/process entries touching `external-suite` / external work-order vocabulary, `package.json`, `contracts/action_catalog.json`, `contracts/stage_control_plane.parts/stages/optimizer-iteration.json`, generated `contracts/stage_control_plane.json`, registration/App projection safe-action refs, production acceptance refs, `runtime/authority_functions/meta-agent-authority-functions.json`, `scripts/improve-from-agent-lab-suite.ts`, `scripts/execute-external-work-order.ts`, external-suite materializer / work-order helper refs, action-authority tests, stage-control tests, generated-surface tests, source-purity tests, external-suite focused tests, and execute-external-work-order tests.
- Edited: this process index and the earlier target-agent machine-field closeout so the old future-lane note now points to this retained active-surface audit. That single closeout file has since been folded into this process index and retired-surface provenance.
- Retained active machine surfaces: `improve:external-suite`, `improve-from-external-agent-lab-suite`, `execute:external-work-order`, `execute-external-work-order`, `agent/skills/external-suite-improvement.md`, `agent/quality_gates/external-suite-self-evolution.md`, `agent/skills/external-work-order-execution.md`, and `agent/quality_gates/external-work-order-execution.md`.
- SSOT: action/script truth is `package.json` plus `contracts/action_catalog.json`; stage/gate truth is `contracts/stage_control_plane.parts/stages/optimizer-iteration.json` and generated `contracts/stage_control_plane.json`; retention and authority truth is `runtime/authority_functions/meta-agent-authority-functions.json` plus `docs/active/opl-private-implementation-migration-inventory.md`; current completion/gap truth remains `docs/active/opl-meta-agent-ideal-state-gap-plan.md`.
- Coverage result: this vocabulary is current Agent Lab external-suite input and OPL work-order delegation semantics, not stale takeover wording and not a compatibility alias for the retired `external-agent-takeover` surface.
- Retired / guarded in this tranche: no active `external-suite` or external-work-order surface was retired. Focused tests already assert the active action ids, generated surfaces, stage-control refs, no target-domain authority write boundary, and thin OPL delegation boundary.
- Remaining stale / retire candidates: none for this vocabulary after this audit. Any future rename must be a generated-interface-safe machine-contract migration with replacement action/script refs, no-active-caller evidence, no-forbidden-write proof, tombstone/provenance, and focused generated-surface tests; it is not a docs cleanup lane.
- Unreviewed in this tranche: the full OPL series portfolio and unrelated OMA evidence-tail / script-to-pack hygiene items remain open under the parent OPL Doc goal.
- Next write scope: choose another clean sibling-repo semantic lane or continue OMA evidence-tail / script-to-pack hygiene from the active gap plan; do not reopen `external-suite` / external-work-order vocabulary as a stale-retirement candidate without replacement machine truth.

2026-06-08 target-agent takeover identifier retirement tranche:

- Reviewed: root `README*`, current docs and history/process entries touching takeover vocabulary, agent prompt/stage indexes, `contracts/action_catalog.json`, `contracts/stage_control_plane.parts/**`, generated `contracts/stage_control_plane.json`, Stage Native refs, registration/App projection safe-action refs, production acceptance, `scripts/takeover-agent.ts`, generated-interface tests, stage-control tests, action-authority tests, production-acceptance tests, and takeover-loop tests.
- Edited: target-agent takeover prompt/stage paths, action catalog, stage-control source leaves, Stage Native source leaves, generated stage-control aggregate/root/index refs, registration/App projection refs, production acceptance refs/keys, `scripts/takeover-agent.ts`, focused tests, `docs/architecture.md`, `docs/history/process/retired-surface-provenance.md`, this process index, and the previous field-retirement closeout.
- Retired active machine surfaces: `external-agent-takeover`, `takeover-external-agent-test`, `opl_meta_agent_takeover_external_agent_test`, `opl-meta-agent.takeover-external-agent-test`, and `external_agent_acceptance_chain`.
- Replacement surfaces: `target-agent-takeover`, `takeover-target-agent-test`, `opl_meta_agent_takeover_target_agent_test`, `opl-meta-agent.takeover-target-agent-test`, and `target_agent_acceptance_chain`.
- No-resurrection guards: focused action catalog, generated-interface bundle, stage-control aggregate, production acceptance and takeover-loop assertions now fail if the old takeover action/stage/generated-interface/acceptance key returns.
- Not edited by design: `external-suite`, `improve-from-external-agent-lab-suite`, `execute:external-work-order`, and `execute-external-work-order`. They remain separate Agent Lab external-suite / OPL work-order delegation surfaces, not aliases for the retired takeover identifier.
- Later foldback: the external-suite / external-work-order active-surface audit above reviewed that broader vocabulary and retained it as current machine truth. Old takeover identifiers must remain only in history/provenance or no-resurrection assertions.
- Next write scope: after fresh six-repo intake, choose another clean sibling repo semantic lane or a current OMA evidence-tail / script-to-pack hygiene lane; do not reopen `external-agent-takeover` or active external-suite/work-order vocabulary as compatibility.

2026-06-08 target-agent machine-field retirement tranche:

- Reviewed: root `README*`, `docs/**/*.md`, `agent/*/README.md`, related agent prompt/stage/skill/quality-gate references, `contracts/owner_receipt_contract.json`, `scripts/takeover-agent.ts`, takeover/action authority/source-purity/generated-interface tests, and scoped `external_agent` / `target_agent` scans.
- Edited: `contracts/owner_receipt_contract.json`, `scripts/takeover-agent.ts`, `tests/contracts-action-authority.test.ts`, `tests/takeover-loop.test.ts`, `docs/history/process/README.md`, `docs/history/process/target-agent-machine-field-retirement.md`.
- Retired active machine fields: `external_agent_allowed` and `external_opl_compatible_agents_allowed`; replacement fields are `target_agent_allowed` and `target_opl_compatible_agents_allowed`.
- Later foldback: `external-agent-takeover` action/stage identifier migration closed in the target-agent takeover identifier retirement tranche above. `external-suite` and `execute:external-work-order` remain separate active semantics.
- Later foldback: the external-suite / external-work-order active-surface audit above reviewed the broader vocabulary and retained it as current machine truth.
- Later foldback: the standalone `docs/history/process/target-agent-machine-field-retirement.md` closeout was deleted after its durable provenance was folded into this process index and `retired-surface-provenance.md`; current machine truth remains in contracts, source and tests.
- Remaining stale / retire candidates: old underscore fields must remain only in no-resurrection assertions or history. No stale/retire candidate remains for external-suite/work-order vocabulary from this lineage.
- Next write scope: another clean sibling repo semantic lane after fresh six-repo intake, or current OMA evidence-tail / script-to-pack hygiene from the active gap plan.

2026-06-08 OMA process-history compression tranche:

- Reviewed: `README*`, `docs/README.md`, `docs/project.md`, `docs/status.md`, `docs/architecture.md`, `docs/invariants.md`, `docs/decisions.md`, `docs/docs_portfolio_consolidation.md`, `docs/active/opl-meta-agent-ideal-state-gap-plan.md`, `docs/active/opl-private-implementation-migration-inventory.md`, `docs/references/opl-meta-agent-ideal-state.md`, `docs/history/README.md`, previous `docs/history/process/*.md`, `package.json`, `runtime/authority_functions/meta-agent-authority-functions.json`, and source-purity tests that bind retired-tail provenance refs.
- Edited: `docs/history/process/README.md`, `docs/history/process/retired-surface-provenance.md`, `docs/docs_portfolio_consolidation.md`, `runtime/authority_functions/meta-agent-authority-functions.json`, `tests/source-purity.test.ts`.
- Compressed / deleted: previous dated OMA process closeout Markdown files under `docs/history/process/`, after their durable conclusions were folded into the SSOT owners above or into `retired-surface-provenance.md`.
- Unreviewed in this tranche: non-process OMA docs were read only for SSOT alignment; full OPL series coverage across the other five repos remains open under the parent OPL Doc goal.
- Remaining stale / retire candidates in OMA process history: none identified after compression. OMA open work remains the active evidence tails and script-to-pack hygiene already listed in the active gap plan.
- Next write scope: repeat the same SSOT-first compression on the clean sibling repos with long history/process ledgers, while treating `one-person-lab` and `med-autoscience` dirty worktrees as read-only until their concurrent write sets are resolved.
