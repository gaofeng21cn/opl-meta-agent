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
| Foundry Agent OS target delta | `contracts/foundry-agent-os-domain-kernel-manifest.json` for machine truth; `docs/active/foundry-agent-os-target-delta.md` for human-readable owner split |
| 文档生命周期、目录职责、inventory groups、reopening conditions | `docs/docs_portfolio_consolidation.md` |
| 私有实现分类、script hygiene、上收候选、退役门 | `docs/active/opl-private-implementation-migration-inventory.md` |
| 当前状态和 evidence tail 摘要 | `docs/status.md` |
| 硬边界和 forbidden claims | `docs/invariants.md` |
| 仍有效决策 | `docs/decisions.md` |
| 退役 surface no-resurrection provenance | [`retired-surface-provenance.md`](./retired-surface-provenance.md) |

## Compressed Provenance

| Provenance group | Current read |
| --- | --- |
| Docs lifecycle and coverage | Root `README*`, every tracked `docs/**/*.md`, and tracked `agent/*/README.md` were rechecked as the complete OMA human-doc portfolio. Each file keeps one role under `docs/docs_portfolio_consolidation.md`; future coverage records stay topic-level here, and machine truth remains in contracts/source/tests. |
| Foundry Agent OS target-delta foldback | The active support doc `docs/active/foundry-agent-os-target-delta.md` is now part of the lifecycle map and inventory. Its machine SSOT is `contracts/foundry-agent-os-domain-kernel-manifest.json`; peer docs keep only pointers, boundary summaries, or forbidden-claim rules. |
| Target-agent field / takeover retirement | Old `external_agent_allowed`, `external_opl_compatible_agents_allowed`, `external-agent-takeover`, `takeover:test --fixture`, implicit fixture graph and field-only closeout files are folded into `retired-surface-provenance.md` and machine no-resurrection tests. |
| External-suite / external-work-order vocabulary | `external-suite` and external work-order remain active Agent Lab external-suite and OPL work-order delegation semantics. They are not stale takeover aliases and should not be retired without replacement machine truth. |
| Script-to-pack hygiene | Detailed script/materializer classification SSOT is `docs/active/opl-private-implementation-migration-inventory.md` plus `runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy/script_to_pack_retirement_gates` and source-purity tests. Active plan and private inventory now keep compact owner/readback boundaries instead of copying field-level machine guard prose; duplicate per-script classification rows are folded back to one owner row per surface. |
| Evidence-tail currentness | Registry/App consumption, production-consumption, patch-loop, independent reviewer and target-agent handoff evidence tails return to active plan, status, contracts, OPL read model and tests. Dated proof transcripts are not current truth. |
| Paper/PDF reference-design intake | The reusable route is `OPL source ingest -> MinerU/Codex parse-once -> canonical refs-only pattern packet -> OMA design objects and stage pack -> OPL Foundry evaluation`. OPL owns custody/hash/receipt, the extractor owns extraction evidence, OMA owns transferable design semantics, and OPL Pack/Foundry owns generated/evaluation surfaces. Raw PDF parsing is not a second OMA/OPL runtime or a `--reference-design-file` baseline shortcut; exact current example evidence remains summarized in `docs/status.md`. |
| Zoller current-ABI E2E | [2026-07-11 evidence](./zoller-reference-design-e2e-20260711.md) records the current producer/scaffold repair, six controlled StageRun closeouts, target package checks, no-observation blocker, and synthetic target-bound Foundry result. It is historical ABI evidence, not clinical or owner authority. |
| Active decision compression | The old decisions page carried a long incremental decision ledger for generated surfaces, developer work orders, typed closeouts, stage-native artifacts, State Index, StageRun, executor policy, Progress-First and clean-room intake. It is now folded into theme-level durable decisions in `docs/decisions.md`; detailed current mechanics remain in architecture, invariants, active plan, private inventory and machine contracts. |
| Private inventory retired-tail compression | The active private implementation inventory now keeps current script classifications and migration gates only. Retired surface itemization lives in `retired-surface-provenance.md` plus source-purity / script-morphology machine guards. |

## Coverage Summary

This section keeps topic-level OPL Doc coverage only. It is not a dated closeout
ledger, proof transcript, or completion claim for the parent seven-repo OPL
series goal.

- Current portfolio scope: root `README*`, `docs/*.md`,
  `docs/active/*.md`, `docs/references/*.md`, `docs/history/*.md`,
  `docs/history/process/*.md`, and tracked
  `agent/{knowledge,prompts,quality_gates,skills,stages}/README.md`.
  This is the complete tracked OMA human-doc inventory for this tranche.
- Current SSOT decision: `docs/active/opl-meta-agent-ideal-state-gap-plan.md`
  remains the single Active Truth owner; `docs/active/opl-private-implementation-migration-inventory.md`
  owns script/source-purity detail; `docs/references/opl-meta-agent-ideal-state.md`
  owns north-star; `contracts/foundry-agent-os-domain-kernel-manifest.json`
  owns the Foundry Agent OS domain-kernel machine split, with
  `docs/active/foundry-agent-os-target-delta.md` as its human support doc.
  This file only keeps compressed provenance.
- Content-level consolidation: script-to-pack, README/docs coverage,
  Foundry Agent OS target-delta foldback, external-suite/work-order audit,
  target-agent takeover identifier/field retirement, active decision
  compression and process-history compression entries are folded into the
  provenance groups above. Durable no-resurrection rules remain in
  `retired-surface-provenance.md`; current rules remain in owner docs and
  machine surfaces.
- Current recheck scope: all OMA human docs were rechecked against the active
  plan, private inventory, docs lifecycle map, ideal-state reference, core docs,
  Foundry Agent OS domain-kernel manifest, package scripts, pack compiler input,
  authority function policy, source-purity tests and tracked
  `agent/*/README.md` support indexes. No source, contract, test, workflow,
  package or CLI surface changed in this tranche.
- Current private-inventory compression: active inventory retired-tail detail was
  reduced to a pointer plus migration gate rule; the itemized no-resurrection
  list remains in `retired-surface-provenance.md` and machine guards.
- Retired / guarded: target-agent old fields, external-agent takeover
  identifiers, `takeover:test --fixture`, implicit fixture graph, direct graph
  compatibility, generic `external_agent/*` patch-ref fallback, compatibility
  facades and repo-owned generic runtime/wrapper/App/registry/Agent
  Lab/promotion surfaces remain retired or guarded.
- Remaining OMA scope under the parent OPL series goal: registry/App live
  consumption, additional target cohorts, real source patch-loop, independent
  reviewer direct evidence, standard target-agent handoff convergence and actual
  script-to-pack source reductions remain open under the active gap plan.
- Next write scope: after fresh intake, prefer evidence-tail or script-to-pack
  work that changes active plan / private inventory / contracts / tests only
  when live machine truth changes. Do not reopen `external-suite` /
  external-work-order as stale vocabulary without replacement machine truth.
