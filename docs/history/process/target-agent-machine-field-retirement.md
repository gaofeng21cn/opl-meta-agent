# OMA Target Agent Machine Field Retirement

Owner: `opl-meta-agent`
Purpose: `target_agent_machine_field_retirement_closeout`
State: `historical_provenance`
Machine boundary: 本文是人读 OPL Doc / source-contract-test tranche closeout。当前机器接口真相继续归 `contracts/`、source、tests、CLI/API/read-model 和 OPL generated interface output；当前完成口径、gap 与下一轮 prompt 继续归 `docs/active/opl-meta-agent-ideal-state-gap-plan.md`；私有实现与 script hygiene 继续归 `docs/active/opl-private-implementation-migration-inventory.md`。

## Semantic Theme

本轮治理主题是 `active external_agent machine-field retirement -> target_agent acceptance/policy field migration`。后续 `target-agent takeover identifier retirement` tranche 已把同一接管语义中的 hyphenated action/stage/generated-interface 标识迁到 target-agent 口径；本文只作为较早 field-only closeout provenance 读取。

OMA 的理想态和 current active docs 已把目标对象定义为 generic `target_agent`。Fresh scan 显示 active takeover receipt / policy payload 仍暴露 `external_agent_allowed` 和 `external_opl_compatible_agents_allowed` 两个 machine fields。本轮只迁移这两个 active fields；`external-suite` / `external work-order` 仍表示 Agent Lab external suite / OPL work-order delegation action family，不在本 lane 中重命名。

## Single Source Of Truth

| Theme | SSOT owner | Why it wins |
| --- | --- | --- |
| Takeover receipt acceptance gate vocabulary | `contracts/owner_receipt_contract.json` plus `tests/contracts-action-authority.test.ts` | Owner receipt contract and tests define accepted machine gates. |
| Takeover result policy payload | `scripts/takeover-agent.ts` plus `tests/takeover-loop.test.ts` | Source emits the runtime payload; tests assert the new field and reject old keys. |
| Broader target-agent vocabulary policy | `contracts/foundry_agent_series.json`, active gap plan, private implementation inventory, later target-agent takeover identifier retirement tranche | These surfaces define OMA as a target-agent generic consumer rather than a domain-specific compatibility layer. |
| Historical provenance / no-resurrection context | `docs/history/process/target-agent-machine-field-retirement.md` and focused negative assertions | Old machine fields remain only as no-resurrection assertions or history/provenance. |

## Coverage Snapshot

| Scope | Result |
| --- | --- |
| Reviewed human docs | Root `README*`, `docs/**/*.md`, `agent/*/README.md`, relevant `agent/prompts`, `agent/stages`, `agent/skills`, and `agent/quality_gates` references containing external / target agent vocabulary. |
| Edited contracts | `contracts/owner_receipt_contract.json`. |
| Edited source | `scripts/takeover-agent.ts`. |
| Edited tests | `tests/contracts-action-authority.test.ts`, `tests/takeover-loop.test.ts`. |
| Edited history | `docs/history/process/README.md`, this closeout. |
| Intentionally not edited in this field-only tranche | `external-suite`, `execute:external-work-order`, and then-active `external-agent-takeover` stage/action ids and associated Stage Native refs; they required a separate source/contract/generated-interface lane because they were active action/stage identifiers, not just two payload fields. |

## Edit Decision

- Renamed `testing_takeover_acceptance_gates.external_agent_allowed` to `target_agent_allowed`.
- Renamed takeover result `takeover_policy.external_opl_compatible_agents_allowed` to `target_opl_compatible_agents_allowed`.
- Added no-resurrection assertions so the old owner receipt gate and takeover policy field cannot return as compatibility aliases.

## Unreviewed Docs

This tranche did not re-audit the whole OMA docs portfolio from scratch. It reviewed the semantic peer set for active `external_agent` machine fields and the directly affected source/contract/test surfaces. The parent OPL series `/goal` remains open until every repo ledger has no unreviewed docs or unresolved stale/retire candidates.

## Remaining Stale Or Retire Candidates

- `external-suite` and `external work-order` wording remains active where it describes Agent Lab external suite input or OPL work-order delegation. It is not retired by this field-only lane.
- `external-agent-takeover` stage/action ids were later retired by a synchronized source/contract/generated-interface lane across `contracts/stage_control_plane.parts/**`, aggregate generation, action catalog, agent prompt/stage paths, generated interface tests and Stage Native refs.
- `external_agent` with underscore is allowed only in no-resurrection tests/history after this lane.

## Verification

Verification was performed in the isolated worktree `codex/oma-target-agent-vocab-20260608` based on fresh `origin/main`.

- Focused tests passed: `node --test tests/takeover-loop.test.ts tests/contracts-action-authority.test.ts tests/source-purity.test.ts tests/contracts-generated-surfaces.test.ts tests/contracts-production-acceptance.test.ts` with `20/20` passing.
- Active old-field scan found no active `external_agent_allowed` or `external_opl_compatible_agents_allowed`; remaining matches are explicit no-resurrection assertions.
- Final repo-native verification is recorded in the OPL series tranche ledger after this closeout.

## Next Write Scope

Next safe scope should either continue OMA target-agent vocabulary retirement for action/stage identifiers with a full generated-interface migration, or choose another clean repo semantic lane from the current six-repo inventory. Do not treat this closeout as completion of the six-repo docs lifecycle goal.
