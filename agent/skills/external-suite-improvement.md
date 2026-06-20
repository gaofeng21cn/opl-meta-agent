# Skill: External Suite Improvement

## 用途

当已有目标 agent 的 Agent Lab suite blocked 或 failed，需要把证据转成开发者 patch work order、机制补丁候选和回归验证时，使用本 skill。

## 输入

- `suite_path`
- `target-agent-dir`
- `output_dir`
- `opl_bin`
- `ai_reviewer_evaluation`
- 可选 `feedback_ref`

## 流程

1. 读取 suite result、rubric gaps、trajectory refs、receipts 和结构化 AI reviewer evaluation。
2. 校验 AI reviewer critique、suggestions、source refs、direct evidence refs、verdict、provenance、no shared context 和独立 attempt refs；缺失、为空或只有 suite/scaffold refs 时 fail closed。
3. 分类 failure，并把 AI reviewer suggestions 映射进 patch traceability matrix。
4. 若 suite 或 production evidence 出现效率证据，提取通用 target-agent efficiency non-regression refs：`quality_floor_refs`、`latency_baseline_refs`、`usage_cost_refs`、`cache_reuse_refs` 和 `target_verification_refs`；缺 `quality_floor_refs` 时 fail closed 到 typed blocker。
5. 判断可编辑面：source、tests、docs、prompt policy、skill policy、stage policy、suite policy 或 quality gate policy。
6. 生成 developer work order completeness：reviewer refs、Codex/executor-first aperture、patch traceability、target verification、owner route、no-forbidden-write proof、canary、rollback、version refs 和 efficiency non-regression refs。
6. 在 target owner gate 允许时执行最小源码/测试/文档补丁。
7. 运行目标 agent 验证和 Agent Lab regression。
8. 写入 developer patch work order、target version receipt、online-learning candidate 和 mechanism patch proposal。

## Advisory Boundary

- Suite results, external learning notes, scorecards, regression pass/fail, efficiency telemetry, and optimizer candidates are evidence inputs for Codex and reviewer reasoning. They do not by themselves authorize target quality, target readiness, default promotion, App-live readiness, export verdict, owner receipt, or typed blocker.
- A pass can support `no_patch_needed` or `candidate_ready_for_owner_review` only with owner route, direct evidence, independent reviewer provenance, no-forbidden-write proof, and target verification refs.
- Missing optional advisory learning should become a work-order gap or route-back. It hard-blocks only when the current output claims patch completeness, promotion readiness, target ready, or owner acceptance.

## 输出

- `developer_patch_work_order_refs`
- `target_capability_improvement_candidate_refs`
- `regression_result_refs`
- `target_agent_version_receipt_refs`
- `mechanism_patch_proposal_refs`
- `typed_blocker_refs`
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
- 修复被目标 runtime/read-model 消费，而不仅是源码测试通过。

## 禁止事项

- 禁止无 gate 改目标 agent。
- 禁止只产出泛泛建议，不给可执行 work order。
- 禁止把 regression pass 写成 target quality verdict。
- 禁止把 suite pass、scorecard、external learning memory、optimizer signal 或 promotion hint 写成 target owner verdict、default promotion、App-live readiness 或 export/quality verdict。
- 禁止在缺 quality floor refs 时把效率优化证据升级成 executable work order。
- 禁止在缺 direct evidence、reviewer provenance 或 work order completeness 字段时产出 patch proposal；必须 fail closed 到 typed blocker。
