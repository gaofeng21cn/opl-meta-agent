# Gate: External Suite Self-Evolution

## 适用范围

用于判断 external Agent Lab suite 的 blocked/failed evidence 是否可以进入 target agent capability improvement 流程。

## 必需证据

- suite path 和 suite result ref。
- failure taxonomy 或 rubric gap refs。
- target agent repo locator。
- 独立 Codex/AI reviewer evaluation ref，包含 no shared context、不同 execution/review attempt refs、critique、suggestions、source refs、direct evidence refs、verdict 和 provenance。
- patch traceability matrix。
- developer patch work order ref。
- developer work order completeness：reviewer refs、executor aperture、target verification refs、owner route refs、no-forbidden-write proof、canary refs、rollback refs 和 version refs。
- 若存在效率证据，必须提供通用 target-agent `efficiency_non_regression_refs`：`quality_floor_refs`、`latency_baseline_refs`、`usage_cost_refs`、`cache_reuse_refs`、`target_verification_refs`。
- machine closeout refs：blocked suite、developer work order、patch traceability、target verification、runtime/read-model consumption、workspace proof、no-forbidden-write、target owner receipt or typed blocker、patch absorption、worktree cleanup 和 Agent Lab re-evaluation。
- regression result refs。

## 通过标准

- 每个 required patch 都有 source failure ref。
- reviewer direct evidence 不能只有 suite/scaffold refs，必须指向真实 contract、artifact、receipt、scorecard、diff、ledger 或 owner feedback。
- developer work order 显式声明 Codex/executor-first aperture，并把可写面限制到 target owner gate 允许的 source、tests、docs、prompt/skill/stage/quality-gate policy。
- editable surfaces 限定在 target owner gate 允许的 source、tests、docs 或 mechanism policy。
- patch traceability、target verification、owner route、no-forbidden-write proof、rollback/canary/version refs 和 machine closeout refs 同时存在，才允许执行或 promotion。已有可消费 work order/candidate 时，缺项记录为 `completed_with_quality_debt` 并继续到 owner review/下一 OMA stage；只有零可消费输出或 authority/identity/human gate 问题才 typed blocker。
- 效率 work order 保持 target-agent generic，只消费标准 suite / production evidence refs；latency、usage cost、cache reuse 或 target verification 证据必须和 quality floor refs 一起进入 work order、completeness 与 closeout 投影。
- regression 覆盖原 failure、forbidden writes 和 runtime/read-model consumption。
- version receipt 声明 branch/worktree、absorb gate 和 cleanup state。

## 拒绝标准

- patch work order 没有证据来源。
- reviewer evaluation 缺 direct evidence、verdict、provenance、no-shared-context proof 或独立 attempt refs。
- developer work order 缺 reviewer refs、executor aperture、patch traceability、target verification、owner route、no-forbidden-write proof、canary、rollback 或 version refs。
- developer work order 缺 target owner receipt or typed blocker、patch absorption、worktree cleanup 或 Agent Lab re-evaluation closeout ref。
- efficiency evidence 缺 `quality_floor_refs`，或 reviewer direct evidence 缺失。
- 为效率优化新增 domain 专用 command family，而非消费标准 target handoff/evidence refs。
- 通过启发式后处理绕过真实机制缺口。
- 修改 target truth、memory body、artifact body 或 quality verdict。
- regression 只证明本地单元测试，无法证明目标 runtime 消费。
