# 2026-06-06 OMA pack support-index SSOT closeout

Owner: `opl-meta-agent`
Purpose: `oma_pack_support_index_docs_governance_closeout`
State: `history_provenance`
Machine boundary: Human-readable closeout ledger. Current domain pack truth stays in `contracts/pack_compiler_input.json`, `contracts/stage_control_plane.json`, real non-README `agent/` pack files, and tests.

## Snapshot

- Repo: `/Users/gaofeng/workspace/opl-meta-agent`
- Semantic theme: `domain pack README support indexes versus machine-required pack paths`
- Governance mode: SSOT-first content-level audit. Start from machine-required pack paths, then classify human support indexes.

## Single Source Of Truth

Machine SSOT:

- `contracts/pack_compiler_input.json`
  - owns `canonical_semantic_pack_root = "agent/"`, `canonical_semantic_pack_role = "repo_source_declarative_meta_agent_pack"`, and `required_domain_pack_paths`.
- `contracts/stage_control_plane.json`
  - owns stage prompt, skill, knowledge, and evaluation refs.
- Real non-README `agent/**/*.md` files
  - own the domain-owned pack bodies.
- `tests/contracts-domain-pack.test.ts`
  - proves `required_domain_pack_paths` equals actual non-README `agent/` Markdown files, forbids README entries in required paths, and checks every required pack file is usable.

Human-doc owners:

- `agent/*/README.md`
  - support indexes only; not machine-required pack paths.
- `docs/docs_portfolio_consolidation.md`
  - lifecycle role map for the support-index class.
- `docs/architecture.md`, `docs/status.md`, `docs/project.md`, `docs/invariants.md`, `docs/decisions.md`, and `docs/active/opl-meta-agent-ideal-state-gap-plan.md`
  - current human summaries that point back to contracts, real pack files, and tests.

## Peer Docs Classification

| Document / section | Classification | Action |
| --- | --- | --- |
| `agent/knowledge/README.md` | `covered_by_ssot` support index | Already states it is human-readable and not `required_domain_pack_paths`; no edit. |
| `agent/prompts/README.md` | `covered_by_ssot` support index with bounded detail | Keeps a prompt-ref reading list while declaring machine truth belongs to contracts, non-README prompt files, and tests; no edit. |
| `agent/quality_gates/README.md` | `covered_by_ssot` support index | Already forbids treating README as quality verdict, gate receipt, or required path; no edit. |
| `agent/skills/README.md` | `covered_by_ssot` support index | Already separates domain skill bodies from generated Skill surface/runtime tool contract; no edit. |
| `agent/stages/README.md` | `covered_by_ssot` support index | Already separates stage operation notes from stage attempt ledger/runtime receipt and required pack paths; no edit. |
| `docs/docs_portfolio_consolidation.md` | `covered_by_ssot` lifecycle map | Already records `agent/*/README.md` as support indexes and names contracts/tests as machine truth; no edit. |
| `docs/architecture.md` / Domain Pack Structure | `covered_by_ssot` current summary | Already points to `pack_compiler_input`, `stage_control_plane`, real pack files, and tests; no edit. |
| `docs/status.md` / Domain pack row | `covered_by_ssot` current summary | Already says README only indexes and is not `required_domain_pack_paths`; no edit. |
| `docs/project.md`, `docs/invariants.md`, `docs/decisions.md` | `covered_by_ssot` current boundary | Already require real resolvable pack file refs rather than heading/prose-only refs; no edit. |
| `README.md`, `README.zh-CN.md` test wording | `more_specific_detail` | Public/operator entry says tests verify real `agent/` domain pack files and stage refs. It does not own the pack path list; no edit. |
| `docs/history/process/*` prior coverage records | `history_or_provenance` | Previous dated records are provenance only; durable boundary already folded into current support indexes and portfolio map. |

No conflicts with the SSOT were found. The audit closed as a verification-and-ledger lane rather than a rewrite lane.

## Modifications

- Added this closeout under `docs/history/process/`.
- Updated `docs/history/process/README.md` to index this closeout.

No active support README or current core doc was changed because they already align with the machine SSOT and do not carry a duplicate required-pack-path owner.

## Verification

Commands run from `/Users/gaofeng/workspace/opl-meta-agent`:

```bash
rtk node - <<'NODE'
const fs=require('fs'); const cp=require('child_process');
const pack=JSON.parse(fs.readFileSync('contracts/pack_compiler_input.json','utf8'));
const actual=cp.execSync('find agent -type f -name "*.md" | sort',{encoding:'utf8'}).trim().split('\n').filter(Boolean).filter(p=>!p.endsWith('/README.md'));
console.log(JSON.stringify({required_count:pack.required_domain_pack_paths.length, actual_count:actual.length, equal:JSON.stringify(pack.required_domain_pack_paths)===JSON.stringify(actual), readme_in_required:pack.required_domain_pack_paths.filter(p=>p.endsWith('/README.md'))},null,2));
NODE
rtk rg -n "README.*required|required.*README|machine-required|required_domain_pack_paths|prompt_refs|skill_refs|knowledge_refs|quality_gate_refs" docs/**/*.md agent/*/README.md README.md README.zh-CN.md
```

Result:

- Pack path sanity output: `required_count = 38`, `actual_count = 38`, `equal = true`, `readme_in_required = []`.
- Targeted scan confirms all current/support references either point to the machine SSOT or explicitly state README files are human support indexes, not machine-required paths.

## Remaining Scope

This lane covers only the domain pack README support-index boundary. It does not complete full OMA docs governance.

Carry forward:

- Registry/App consumption evidence tail, real target patch-loop evidence, independent reviewer evidence, target-agent handoff convergence, and script-to-pack hygiene remain active OMA lanes.
- Public README narrative, generated interface consumption, production acceptance evidence, and real target scaleout can be audited separately.
- If any `agent/*/README.md` is added to `required_domain_pack_paths`, or a support README becomes a second pack list owner, reopen this lane and restore machine-checkable non-README repo file refs.

## Next Write Scope

Recommended next OMA lane:

- Semantic theme: `registry/App evidence tail versus generated surface readiness claims`
- Candidate SSOT owner: `contracts/opl_domain_manifest_registration.json`, `contracts/app_workbench_projection.json`, OPL generated interface read model, App/OPL consumption receipts, and `docs/active/opl-meta-agent-ideal-state-gap-plan.md`.
- Peer docs: `README*`, `docs/status.md`, `docs/architecture.md`, `docs/docs_portfolio_consolidation.md`, `docs/history/process/*.md`.
