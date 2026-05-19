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
2. 校验 AI reviewer critique、suggestions、source refs 和 provenance；缺失或为空时 fail closed。
3. 分类 failure，并把 AI reviewer suggestions 映射进 patch traceability matrix。
4. 判断可编辑面：source、tests、docs、prompt policy、skill policy、stage policy、suite policy 或 quality gate policy。
5. 在 target owner gate 允许时执行最小源码/测试/文档补丁。
6. 运行目标 agent 验证和 Agent Lab regression。
7. 写入 developer patch work order、target version receipt、online-learning candidate 和 mechanism patch proposal。

## 输出

- `developer_patch_work_order_refs`
- `target_capability_improvement_candidate_refs`
- `regression_result_refs`
- `target_agent_version_receipt_refs`
- `mechanism_patch_proposal_refs`

## 质量门槛

- 每个 patch 都追溯到 suite failure 或 owner feedback。
- 每个 AI reviewer suggestion 都保留 source refs/provenance，并映射到 developer work order 或明确说明不产生 patch。
- receipt 证明目标 domain truth、memory body、artifact body、quality verdict 未被写入。
- 修复被目标 runtime/read-model 消费，而不仅是源码测试通过。

## 禁止事项

- 禁止无 gate 改目标 agent。
- 禁止只产出泛泛建议，不给可执行 work order。
- 禁止把 regression pass 写成 target quality verdict。
