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
4. 判断可编辑面：source、tests、docs、prompt policy、skill policy、stage policy、suite policy 或 quality gate policy。
5. 生成 developer work order completeness：reviewer refs、Codex/executor-first aperture、patch traceability、target verification、owner route、no-forbidden-write proof、canary、rollback 和 version refs。
6. 在 target owner gate 允许时执行最小源码/测试/文档补丁。
7. 运行目标 agent 验证和 Agent Lab regression。
8. 写入 developer patch work order、target version receipt、online-learning candidate 和 mechanism patch proposal。

## 输出

- `developer_patch_work_order_refs`
- `target_capability_improvement_candidate_refs`
- `regression_result_refs`
- `target_agent_version_receipt_refs`
- `mechanism_patch_proposal_refs`
- `typed_blocker_refs`
- `machine_closeout_refs`

## 质量门槛

- 每个 patch 都追溯到 suite failure 或 owner feedback。
- 每个 AI reviewer suggestion 都保留 source refs/provenance，并映射到 developer work order 或明确说明不产生 patch。
- developer work order 必须同时串起 reviewer refs、executor aperture、patch traceability、target verification、owner route、no-forbidden-write proof、canary、rollback、version refs 和 machine closeout refs。
- machine closeout refs 必须覆盖 blocked suite、developer work order、patch traceability、target verification、runtime/read-model consumption、workspace proof、no-forbidden-write、target owner receipt or typed blocker、patch absorption、worktree cleanup 和 Agent Lab re-evaluation。
- receipt 证明目标 domain truth、memory body、artifact body、quality verdict 未被写入。
- 修复被目标 runtime/read-model 消费，而不仅是源码测试通过。

## 禁止事项

- 禁止无 gate 改目标 agent。
- 禁止只产出泛泛建议，不给可执行 work order。
- 禁止把 regression pass 写成 target quality verdict。
- 禁止在缺 direct evidence、reviewer provenance 或 work order completeness 字段时产出 patch proposal；必须 fail closed 到 typed blocker。
