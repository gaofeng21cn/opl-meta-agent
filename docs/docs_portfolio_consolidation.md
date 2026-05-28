# opl-meta-agent 文档组合治理

Owner: `opl-meta-agent`
Purpose: `docs_lifecycle_governance`
State: `active_support`
Machine boundary: 本文是人读治理入口和 coverage ledger。当前机器真相继续归 `contracts/`、`agent/`、`runtime/authority_functions/`、source、CLI/API 行为、OPL Agent Lab result refs、developer work-order receipts、owner receipts、candidate refs 和 tests。

## 当前结论

`opl-meta-agent` 采用轻量 OPL-compatible repo 文档形态：root `README*` 和 `docs/` 核心文档持有当前入口、项目事实、架构、硬约束、决策、目标态、active gap plan 与私有实现迁移台账。`agent/*/README.md` 是 domain pack 支撑索引，不作为 machine-required pack path；机器 pack 真相由 `contracts/pack_compiler_input.json`、`contracts/stage_control_plane.json`、`agent/` 真实文件和 tests 验证。

当前 single Active Truth owner 是 `docs/active/opl-meta-agent-ideal-state-gap-plan.md`。North-star 目标态只读 `docs/references/opl-meta-agent-ideal-state.md`；私有实现、script hygiene、default-caller tail 和 OPL 上收边界只读 `docs/active/opl-private-implementation-migration-inventory.md`；核心当前事实继续回到 `docs/project.md`、`docs/status.md`、`docs/architecture.md`、`docs/invariants.md` 和 `docs/decisions.md`。

本仓暂不为了空目录对齐创建 `public/product/runtime/delivery/source/policies/specs/history` 目录。未来出现长期 public、product、runtime、delivery、source、policy、spec 或 history 材料时，先判断唯一 owner、purpose、state 和 machine boundary，再按 OPL-family canonical taxonomy 增加对应目录和索引。

## 目录职责

| 目录 / 文档组 | 当前职责 | Machine boundary |
| --- | --- | --- |
| `README.md`, `README.zh-CN.md` | 公开 / 双语仓库入口，解释 OMA 是 agent-building Foundry Agent | 不作为 generated interface、runtime、Agent Lab 或 App owner |
| `docs/README.md` | 文档入口和分层索引 | 指向核心 docs、active plan、target-state reference 和 private inventory |
| `docs/project.md`, `docs/status.md`, `docs/architecture.md`, `docs/invariants.md`, `docs/decisions.md` | 当前项目角色、状态、架构、硬约束和决策 | 机器真相归 contracts、agent pack、runtime authority refs、tests 和 OPL read models |
| `docs/active/opl-meta-agent-ideal-state-gap-plan.md` | single Active Truth owner：完成进度、功能/结构 gap、证据 gap、下一轮 Agent prompt | 不保存 dated process log；不把 conformance / suite pass / generated surface proof 升级为 readiness |
| `docs/active/opl-private-implementation-migration-inventory.md` | 私有实现分类、script hygiene、default-caller tail、上收候选和退役门 | 不能把 scripts/materializers 写成 generic runtime、Agent Lab runner、promotion gate、workbench 或 target truth writer |
| `docs/references/opl-meta-agent-ideal-state.md` | north-star / target-state reference | 当前状态和完成顺序回到 active plan |
| `agent/*/README.md` | domain pack 支撑索引 | 真实 pack required paths 由 contracts/tests 验证；README 不作为 machine-required pack path |

## 规则

- `README*` 与 `docs/**` 是人读材料；机器消费者读取 contracts、source、tests、CLI/API 行为或语义化 refs。
- Generated interface readiness、registry readiness、App projection readiness、suite pass、schema completeness、contract completeness、work-order shape 或 OPL refs-only consumption 不能写成 target domain ready、quality verdict、artifact readiness、owner receipt、App live rendering、production ready 或 default promotion。
- Agent Lab / OMA 是 standard target-agent consumer，不是 MAS/MAG/RCA 的专用兼容层。目标 agent 名称只可作为 target refs、owner routes、fixtures、receipt refs 或 provenance 出现。
- Active docs 只保留当前计划、差距和迁移门。过程 proof、dated closeout、历史路线和本治理记录只留在本 ledger、OPL family ledger、提交历史或未来 history/provenance 语境。

## Coverage Ledger

### 2026-05-28 OPL-series no-drift revalidation follow-up

本轮在 OPL series fresh hygiene 后重新核对 `opl-meta-agent` 当前 README/docs lifecycle 状态。目标是确认 2026-05-27 / 2026-05-28 repo-local coverage ledger 仍覆盖当前 exact inventory，并用 fresh machine truth / test evidence 证明没有新开 doc path 或 stale wording 需要正文重写。本轮不改 active truth，不新增 readiness claim，不关闭 OPL series 全局 `/goal`。

Fresh live truth inputs:

- OMA `AGENTS.md`, `TASTE.md`, root `README.md`, `docs/README.md`, `docs/project.md`, `docs/status.md`, `docs/architecture.md`, `docs/invariants.md`, `docs/decisions.md`, active gap plan, ideal-state reference, and this governance ledger.
- Exact current inventory over repo-root `README*`, `docs/**/*.md`, and support README files:
  - `README.md`
  - `README.zh-CN.md`
  - `docs/README.md`
  - `docs/active/opl-meta-agent-ideal-state-gap-plan.md`
  - `docs/active/opl-private-implementation-migration-inventory.md`
  - `docs/architecture.md`
  - `docs/decisions.md`
  - `docs/docs_portfolio_consolidation.md`
  - `docs/invariants.md`
  - `docs/project.md`
  - `docs/references/opl-meta-agent-ideal-state.md`
  - `docs/status.md`
  - `agent/knowledge/README.md`
  - `agent/prompts/README.md`
  - `agent/quality_gates/README.md`
  - `agent/skills/README.md`
  - `agent/stages/README.md`
- Machine refs: `contracts/functional_privatization_audit.json`, `contracts/pack_compiler_input.json`, `contracts/opl_domain_manifest_registration.json`, `contracts/app_workbench_projection.json`, `contracts/production_acceptance/oma-production-consumption-long-soak-typed-blocker.json`, `package.json`, OPL Doc Governance doctor output, and `npm test`.

Fresh semantic result:

- The exact README/docs/support-README inventory has not gained a new ungoverned doc path since the prior ledger entries.
- OPL Doc Governance doctor still reports `finding_count=0` and active truth `pass` for `docs/active/opl-meta-agent-ideal-state-gap-plan.md`. This remains a shape signal only; semantic currentness is anchored in live contracts, pack files, tests, and current docs.
- `contracts/functional_privatization_audit.json` still reports `source_shape=landed`, `functional_structure_gap_count=0`, `domain_repo_retained_generic_surface_count=0`, and remaining tails `opl_generated_default_caller_consumption_tail`, `domain_refs_only_adapter_thinning`, `script_to_pack_hygiene`, and `evidence_tail`. This is source-shape evidence only, not target readiness or default promotion.
- `contracts/pack_compiler_input.json` still uses `canonical_semantic_pack_root=agent/` and `canonical_semantic_pack_role=repo_source_declarative_meta_agent_pack`; `required_domain_pack_paths` remains non-README pack files only.
- `contracts/opl_domain_manifest_registration.json` still declares OPL as registry owner and refs-only registration metadata; `contracts/app_workbench_projection.json` still declares OPL App/workbench as projection owner with refs/status/receipts/candidates/blockers only.
- `contracts/production_acceptance/oma-production-consumption-long-soak-typed-blocker.json` still marks the long-soak blocker active. No long-soak, App live rendering, target domain ready, owner receipt body, artifact readiness, production ready, quality verdict or default promotion claim is closed by this docs tranche.
- `npm test` passed with `47` tests and `0` failures, covering contracts, generated interfaces, source purity, external work-order delegation, external-suite/self-evolution, stage-decomposition, and takeover loop surfaces.

Reviewed documents / sections:

| Repo | Reviewed docs / sections | Edited docs this tranche |
| --- | --- | --- |
| `opl-meta-agent` | Fresh role/currentness read of root `README.md`, `docs/README.md`, core five, active gap plan, ideal-state reference, this ledger, current exact inventory, and machine refs listed above. | `docs/docs_portfolio_consolidation.md` |

Archived / tombstoned / deleted docs:

- none. No duplicate active truth owner, stale current-truth path or unsupported support README path was found in this tranche.

Unreviewed docs:

- `opl-meta-agent`: none newly opened for repo-root `README*`, `docs/**/*.md`, or tracked `agent/*/README.md` support indexes. This tranche revalidated coverage status rather than rereading every line of every already-covered document body.
- Agent pack non-README semantic files remained machine truth refs, not prose-doc governance targets.

Remaining stale / retire candidates:

- OMA doc-path retirement remains empty for the current exact inventory.
- Evidence/hygiene tails remain active: OPL registry/App live consumption receipts, repeat long-soak, more real target patch-loop owner receipt or typed blocker samples, independent Codex reviewer direct-evidence samples, standard target-agent handoff convergence, and script-to-pack / OPL primitive hygiene.
- Any future prose that upgrades refs-only generated/registration/App projection, suite pass, schema completeness, work-order shape, source-shape conformance or OPL refs-only consumption into target-domain readiness or promotion remains stale pollution and must be rewritten.

Next tranche write scope:

- Continue OPL series coverage on repos with newly changed README/docs surfaces or stale lane fallout after branch/worktree hygiene.
- App body docs remain deferred while the dedicated `full-first-run-stable-gate` lane is dirty/active and not safe for generic docs governance absorb.

### 2026-05-27 repo-local ledger bootstrap tranche

本轮为 `opl-meta-agent` 新增 repo-local docs governance ledger。目标是把此前记录在 OPL family ledger 的 OMA full README/docs coverage 回写成本仓可审计入口，并让当前 exact inventory 可以在 OMA 本仓自证。本轮不改 active truth，不新增 readiness claim，不关闭 OPL series 全局 `/goal`。

Fresh live truth inputs:

- OMA `AGENTS.md`, `TASTE.md`, root `README.md`, `README.zh-CN.md`, `docs/README.md`, core five, `docs/active/opl-meta-agent-ideal-state-gap-plan.md`, `docs/active/opl-private-implementation-migration-inventory.md`, and `docs/references/opl-meta-agent-ideal-state.md`.
- Machine refs: `contracts/functional_privatization_audit.json`, `contracts/default_caller_deletion_evidence.json`, `contracts/production_acceptance/meta-agent-production-acceptance.json`, `contracts/production_acceptance/oma-production-consumption-long-soak-typed-blocker.json`, `runtime/authority_functions/meta-agent-authority-functions.json`, `package.json`, `tests/contracts.test.ts`, and `tests/source-purity.test.ts`.
- OPL family ledger prior OMA coverage: `oma-readme-docs-full-coverage` and `oma-ai-first-baseline-delta-coverage`.
- Current OMA exact inventory over repo-root `README*` plus `docs/**/*.md`:
  - `README.md`
  - `README.zh-CN.md`
  - `docs/README.md`
  - `docs/active/opl-meta-agent-ideal-state-gap-plan.md`
  - `docs/active/opl-private-implementation-migration-inventory.md`
  - `docs/architecture.md`
  - `docs/decisions.md`
  - `docs/docs_portfolio_consolidation.md`
  - `docs/invariants.md`
  - `docs/project.md`
  - `docs/references/opl-meta-agent-ideal-state.md`
  - `docs/status.md`
- Support README role read: `agent/knowledge/README.md`, `agent/prompts/README.md`, `agent/quality_gates/README.md`, `agent/skills/README.md`, and `agent/stages/README.md`.

Fresh semantic result:

- OMA docs already have one active truth owner, one ideal-state reference, one private implementation inventory, and one docs entry index. No duplicate active plan or stale current-truth doc path was found in the current exact inventory.
- Current live contracts still read `functional_structure_gap_count=0`, `domain_repo_retained_generic_surface_count=0`, and `remaining_tail_kinds=[opl_generated_default_caller_consumption_tail, domain_refs_only_adapter_thinning, script_to_pack_hygiene, evidence_tail]`. This is structural/source-shape evidence only; it does not authorize target domain ready, quality verdict, App live rendering, production ready, owner receipt body, artifact readiness or default promotion.
- Production-consumption long-soak remains explicitly blocked by `typed_blocker_ref://opl-meta-agent/production-consumption/long-soak-pending`; contract presence and OPL refs-only consumption are not App live closeout or production ready.
- Agent pack README files are support indexes only. The machine-required pack files remain the non-README markdown files listed by `contracts/pack_compiler_input.json` and verified by tests.
- No OMA prose body rewrite was needed. This tranche adds the missing repo-local governance ledger and exact coverage accounting only.

Reviewed documents / sections:

| Repo | Reviewed docs / sections | Edited docs this tranche |
| --- | --- | --- |
| `opl-meta-agent` | First-screen / role read of all current repo-root `README*`, `docs/**/*.md`, agent pack README support files, active truth plan, ideal-state reference, private inventory and live contracts/tests listed above. | `docs/docs_portfolio_consolidation.md` |

Archived / tombstoned / deleted docs:

- none. The reviewed OMA paths already have legitimate long-term roles as public entry, docs index, current truth, active plan, active inventory, target-state reference or domain-pack support index.

Unreviewed docs:

- `opl-meta-agent`: none for current repo-root `README*` and `docs/**/*.md` inventory once this ledger is counted. Future README/docs files, or substantive edits after this tranche, must be covered by a new ledger entry.
- Agent pack non-README semantic files under `agent/` were used as contract/test support surfaces; they are not full prose-doc governance targets in this tranche.

Remaining stale / retire candidates:

- OMA: remaining work is evidence/hygiene, not doc-path retirement: repeat long-soak / App live render-runtime drilldown evidence, more real target patch-loop owner receipt or typed blocker samples, standard target-agent handoff convergence, and continued script-to-pack / OPL primitive hygiene.
- Future prose that treats generated-surface proof, registry readiness, App projection readiness, suite pass, schema completeness, OPL refs-only consumption, work-order shape, script materializer presence or source-shape conformance as target domain ready, quality verdict, App live rendering, owner receipt, artifact readiness, production ready or default promotion is stale pollution.
- Future scripts/materializers must stay limited to authority implementation refs, smoke helpers, fixture/proof helpers or developer work-order materializers. Growth toward private Agent Lab runner, promotion gate, workbench, generated shell, target truth writer, owner receipt body writer, scheduler, queue or attempt ledger reopens the active plan.

Next tranche write scope:

- Start App docs only when release / GUI dirty lanes are safe or explicitly handed to this governance goal.
- If App remains unsafe, continue only with newly reopened exact-inventory tails in OPL/MAS/MAG/RCA/OMA caused by later edits.

### 2026-05-27 agent pack README lifecycle tranche

本轮治理 `agent/*/README.md` 这组 exact README/docs scope 外的长期 support README。目标是补齐每个长期文档的 owner / purpose / state / machine boundary，并保持 README 作为人读索引，不把它们写成 machine-required pack path。本轮不改 active truth，不新增 readiness claim，不关闭 OPL series 全局 `/goal`。

Fresh live truth inputs:

- OMA `AGENTS.md`, `TASTE.md`, `docs/README.md`, `docs/status.md`, `docs/architecture.md`, `docs/docs_portfolio_consolidation.md`, and `docs/active/opl-meta-agent-ideal-state-gap-plan.md`.
- Agent pack support READMEs: `agent/knowledge/README.md`, `agent/prompts/README.md`, `agent/quality_gates/README.md`, `agent/skills/README.md`, and `agent/stages/README.md`.
- Machine refs: `contracts/pack_compiler_input.json`, `contracts/stage_control_plane.json`, `tests/contracts.test.ts`, and current tracked `agent/**/*.md` files.

Fresh semantic result:

- The five support README file lists already matched tracked non-README pack files under their directories.
- `contracts/pack_compiler_input.json` `required_domain_pack_paths` already matched every tracked non-README `agent/**/*.md` file and excluded all README files.
- This tranche therefore only adds lifecycle metadata and preserves the existing support-index role.

Reviewed documents / sections:

| Repo | Reviewed docs / sections | Edited docs this tranche |
| --- | --- | --- |
| `opl-meta-agent` | `agent/knowledge/README.md`, `agent/prompts/README.md`, `agent/quality_gates/README.md`, `agent/skills/README.md`, `agent/stages/README.md`, plus machine refs listed above. | The five agent pack README files and `docs/docs_portfolio_consolidation.md` |

Archived / tombstoned / deleted docs:

- none. These README files remain legitimate support indexes for domain pack maintainers.

Unreviewed docs:

- `opl-meta-agent`: none for current repo-root `README*`, `docs/**/*.md`, or tracked `agent/*/README.md` support indexes once this tranche is counted.
- Agent pack non-README semantic files were used as machine truth refs for file-list and boundary checks; they remain pack body files, not separate docs-governance targets in this tranche.

Remaining stale / retire candidates:

- OMA doc-path retirement remains empty for the currently reviewed root README/docs and agent-pack README surface.
- Future stale pollution remains the evidence/hygiene class already listed above: App live render/runtime drilldown evidence, repeat long-soak, real target patch-loop owner receipts or typed blockers, standard target-agent handoff convergence, and script-to-pack / OPL primitive hygiene.

Next tranche write scope:

- Start App body docs only when release / GUI dirty lanes are safe or explicitly handed to this governance goal.
- If App remains unsafe, continue only with newly reopened exact-inventory tails or tracked support README lifecycle gaps in OPL/MAS/MAG/RCA/OMA caused by later edits.

### 2026-05-28 fresh no-drift revalidation tranche

本轮在 OPL series hygiene 后重新核对 `opl-meta-agent` 的 README/docs lifecycle 状态。目标是确认 2026-05-27 的 repo-local coverage ledger 仍覆盖当前 exact inventory，并把本轮 fresh machine-truth 读数写回本 ledger。本轮不改 active truth，不新增 readiness claim，不关闭 OPL series 全局 `/goal`。

Fresh live truth inputs:

- OMA `AGENTS.md`, `TASTE.md`, root `README.md`, `docs/README.md`, `docs/project.md`, `docs/status.md`, `docs/active/opl-meta-agent-ideal-state-gap-plan.md`, `docs/references/opl-meta-agent-ideal-state.md`, and this governance ledger.
- Exact current inventory over repo-root `README*`, `docs/**/*.md`, and support README files:
  - `README.md`
  - `README.zh-CN.md`
  - `docs/README.md`
  - `docs/active/opl-meta-agent-ideal-state-gap-plan.md`
  - `docs/active/opl-private-implementation-migration-inventory.md`
  - `docs/architecture.md`
  - `docs/decisions.md`
  - `docs/docs_portfolio_consolidation.md`
  - `docs/invariants.md`
  - `docs/project.md`
  - `docs/references/opl-meta-agent-ideal-state.md`
  - `docs/status.md`
  - `agent/knowledge/README.md`
  - `agent/prompts/README.md`
  - `agent/quality_gates/README.md`
  - `agent/skills/README.md`
  - `agent/stages/README.md`
- Machine refs: `contracts/functional_privatization_audit.json`, `contracts/pack_compiler_input.json`, `contracts/opl_domain_manifest_registration.json`, `contracts/app_workbench_projection.json`, `contracts/production_acceptance/oma-production-consumption-long-soak-typed-blocker.json`, `package.json`, and OPL Doc Governance doctor output.

Fresh semantic result:

- OPL Doc Governance doctor still reports `finding_count=0` and `active_truth_health.status=pass` for `docs/active/opl-meta-agent-ideal-state-gap-plan.md`. This is only a shape signal; the current truth remains anchored in live contracts, pack files, source, tests and OPL read-model receipts.
- The exact README/docs/support-README inventory has not gained a new ungoverned doc path since the 2026-05-27 ledger entries.
- `contracts/functional_privatization_audit.json` still reports `source_shape=landed`, `functional_structure_gap_count=0`, `domain_repo_retained_generic_surface_count=0`, and remaining tails `opl_generated_default_caller_consumption_tail`, `domain_refs_only_adapter_thinning`, `script_to_pack_hygiene`, and `evidence_tail`. This remains source-shape evidence only.
- `contracts/pack_compiler_input.json` still uses `canonical_semantic_pack_root=agent/` and `canonical_semantic_pack_role=repo_source_declarative_meta_agent_pack`; `required_domain_pack_paths` remains non-README pack files only.
- `contracts/opl_domain_manifest_registration.json` still declares OPL as registry owner and refs-only registration metadata; `contracts/app_workbench_projection.json` still declares OPL App/workbench as projection owner with refs/status/receipts/candidates/blockers only. Neither contract authorizes App live rendering, target domain ready, quality/export verdict, owner receipt body, artifact readiness, production ready or default promotion.
- `contracts/production_acceptance/oma-production-consumption-long-soak-typed-blocker.json` still blocks `long_soak_refs` via `typed_blocker_ref://opl-meta-agent/production-consumption/long-soak-pending`; no long-soak gate is closed by this docs tranche.

Reviewed documents / sections:

| Repo | Reviewed docs / sections | Edited docs this tranche |
| --- | --- | --- |
| `opl-meta-agent` | Fresh role/currentness read of root `README.md`, `docs/README.md`, `docs/project.md`, `docs/status.md`, active gap plan, ideal-state reference, this ledger, current exact inventory, and machine refs listed above. | `docs/docs_portfolio_consolidation.md` |

Archived / tombstoned / deleted docs:

- none. No duplicate active truth owner, stale current-truth path or unsupported support README path was found in this tranche.

Unreviewed docs:

- `opl-meta-agent`: none newly opened for repo-root `README*`, `docs/**/*.md`, or tracked `agent/*/README.md` support indexes. This tranche revalidated coverage status rather than rereading every section of every already-covered document body.
- Agent pack non-README semantic files remained machine truth refs, not prose-doc governance targets.

Remaining stale / retire candidates:

- OMA doc-path retirement remains empty for the current exact inventory.
- Evidence/hygiene tails remain active: OPL registry/App live consumption receipts, repeat long-soak, more real target patch-loop owner receipt or typed blocker samples, independent Codex reviewer direct-evidence samples, standard target-agent handoff convergence, and script-to-pack / OPL primitive hygiene.
- Any future prose that upgrades refs-only generated/registration/App projection, suite pass, schema completeness, work-order shape, source-shape conformance or OPL refs-only consumption into target-domain readiness or promotion remains stale pollution and must be rewritten.

Next tranche write scope:

- Continue OPL series coverage on repos with newly changed README/docs surfaces or stale lane fallout after branch/worktree hygiene.
- App body docs remain deferred while the dedicated `full-first-run-stable-gate` lane is dirty/conflicting and not safe for generic docs governance absorb.
