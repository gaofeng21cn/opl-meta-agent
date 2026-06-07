# OMA Stage-Decomposition Pack Draft Barrel Retirement Closeout

Owner: `opl-meta-agent`
Purpose: `stage_decomposition_pack_draft_barrel_reexport_retirement_closeout`
State: `history_provenance`
Machine boundary: 本文记录一次物理退役过程；当前机器真相继续归 source imports、`runtime/authority_functions/meta-agent-authority-functions.json`、contracts 和 tests。

## Closeout

`scripts/lib/stage-decomposition-pack-draft.ts` 只是 builder、materializer、validator 和 shared type 的 barrel re-export。当前 active callers 已能直接 import concrete owner modules，因此该 barrel 不再承担 materializer、validator 或 shared policy owner 职责。

本次变更物理删除该 barrel，并把 `build-agent-baseline`、`stage-decomposition-runner` 和 stage-decomposition tests 改为直接 import:

- `scripts/lib/stage-decomposition-pack-draft-parts/builder.ts`
- `scripts/lib/stage-decomposition-pack-draft-parts/materializer.ts`
- `scripts/lib/stage-decomposition-pack-draft-parts/shared.ts`
- `scripts/lib/stage-decomposition-pack-draft-parts/validator.ts`

`runtime/authority_functions/meta-agent-authority-functions.json`、`contracts/stage_artifact_kernel_adoption.json` 和 `contracts/production_acceptance/new_agent_consumption_evidence.json` 同步移除 retired barrel source ref，并把它记录为 `retired-tail:opl-meta-agent/stage-decomposition-pack-draft/barrel-reexport-facade`。

## No-Resurrection Rule

不要恢复 `scripts/lib/stage-decomposition-pack-draft.ts`，也不要新增等价 barrel、compatibility import path 或 public export entry。保留的 stage-decomposition helpers 必须继续作为 concrete parts 存在；整组 helper 只有在 OPL primitive parity、no-active-caller、no-forbidden-write 和 tombstone/provenance refs 成立后才能继续退役。
