# Skill: External Suite Improvement

## 用途

当已有目标 agent 的 Agent Lab suite blocked 或 failed，需要把证据转成开发者 patch work order、机制补丁候选和回归验证时，使用本 skill。

## 输入

- `suite_path`
- `suite_result_path`
- `target-agent-dir`
- `output_dir`
- `ai_reviewer_evaluation`
- 可选 `feedback_ref`

## 流程

1. 读取 suite result、rubric gaps、trajectory refs、receipts 和结构化 AI reviewer evaluation。
2. 校验 AI reviewer critique、suggestions、source refs、direct evidence refs、verdict、provenance、no shared context 和独立 attempt refs；缺失、为空或只有 suite/scaffold refs 时，在已有 suite/work-order artifact 上记录质量债务与 reviewer route-back，不阻止后续 stage。
3. 分类 failure，并把 AI reviewer suggestions 映射进 patch traceability matrix。
4. 若 suite 或 production evidence 出现效率证据，提取通用 target-agent efficiency non-regression refs：`quality_floor_refs`、`latency_baseline_refs`、`usage_cost_refs`、`cache_reuse_refs` 和 `target_verification_refs`；缺 `quality_floor_refs` 时记录质量债务并禁止 efficiency non-regression / promotion 声明，已有 work-order artifact 继续推进。
5. 判断可编辑面：source、tests、docs、prompt policy、skill policy、stage policy、suite policy 或 quality gate policy。
6. 生成 developer work order completeness：reviewer refs、Codex/executor-first aperture、patch traceability、target verification、owner route、no-forbidden-write proof、canary、rollback、version refs 和 efficiency non-regression refs。
6. 当 declarative inputs 完整时生成 target capability candidate 与 developer patch work order；缺字段时只返回 expected typed-blocker ref，不物化 target-domain blocker body。
7. 将 developer patch work order 交给 `execute:external-work-order` / OPL primitive；OMA 不直接修改 target repo，也不执行 verification、Agent Lab regression、absorb 或 cleanup。
8. 只有 OPL / target owner 返回的 execution、verification、re-evaluation 和 closeout refs 才能进入后续判断；OMA 不写 target version receipt、online-learning ledger 或 promotion result。

## Advisory Boundary

- Suite results, external learning notes, scorecards, regression pass/fail, efficiency telemetry, and optimizer candidates are evidence inputs for Codex and reviewer reasoning. They do not by themselves authorize target quality, target readiness, default promotion, App-live readiness, export verdict, owner receipt, or typed blocker.
- A pass can support `no_patch_needed` or `candidate_ready_for_owner_review` only with owner route, direct evidence, independent reviewer provenance, no-forbidden-write proof, and target verification refs.
- Missing optional advisory learning should become a work-order gap or route-back. It hard-blocks only when the current output claims patch completeness, promotion readiness, target ready, or owner acceptance.

## 输出

- `developer_patch_work_order_refs`
- `target_capability_improvement_candidate_refs`
- optional externally returned regression / target-version refs
- `mechanism_candidate_refs`
- `expected_typed_blocker_refs`
- `machine_closeout_refs`
- `efficiency_non_regression_refs`

## 质量门槛

- 每个 patch 都追溯到 suite failure 或 owner feedback。
- 每个 AI reviewer suggestion 都保留 source refs/provenance，并映射到 developer work order 或明确说明不产生 patch。
- developer work order 必须同时串起 reviewer refs、executor aperture、patch traceability、target verification、owner route、no-forbidden-write proof、canary、rollback、version refs 和 machine closeout refs。
- efficiency work order 是 target-agent generic；只能消费标准 handoff/evidence refs，不新增 RCA、MAS、MAG 或其他 domain 专用 command family。
- 出现 latency / usage cost / cache reuse / target verification 证据时，developer work order、completeness 和 patch traceability / closeout 投影必须保留 `quality_floor_refs`、`latency_baseline_refs`、`usage_cost_refs`、`cache_reuse_refs`、`target_verification_refs`。
- machine closeout refs 必须覆盖 blocked suite、developer work order、patch traceability、target verification、runtime/read-model consumption、workspace proof、no-forbidden-write、target owner receipt or typed blocker、patch absorption、worktree cleanup 和 Agent Lab re-evaluation。
- receipt 证明目标 domain truth、memory body、artifact body、quality verdict 未被写入。
- work order 要求修复被目标 runtime/read-model 消费；producer 不得把 work-order ready 当成该证据已经存在。

## 禁止事项

- 禁止无 gate 改目标 agent。
- 禁止 OMA 直接执行 target patch、Agent Lab regression、absorb/cleanup 或 owner closeout。
- 禁止只产出泛泛建议，不给可执行 work order。
- 禁止把 regression pass 写成 target quality verdict。
- 禁止把 suite pass、scorecard、external learning memory、optimizer signal 或 promotion hint 写成 target owner verdict、default promotion、App-live readiness 或 export/quality verdict。
- 禁止在缺 quality floor refs 时把效率优化证据升级成 executable work order。
- 禁止在缺 direct evidence、reviewer provenance 或 work order completeness 字段时产出 executable work order；只返回 expected typed-blocker ref，不伪造 blocker body。
