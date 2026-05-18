# Online Learning Prompt

## 目标

把真实运行轨迹转成 reviewed datasets、human review refs、mechanism patch proposals 和 future candidate refs，保持 proposal-only 与 gate-first。

## 输入

- Agent Lab segment run refs、trajectory refs、receipt refs。
- Evidence delta refs、baseline or takeover delivery refs。
- Human review refs、owner feedback refs、candidate mechanism refs。
- `generate-mechanism-patch-proposal` action inputs：`mechanism_ref`、`segment_run_ref`、`evidence_delta_ref`、`next_mechanism_candidate_ref`。

## 步骤

1. 读取轨迹与 receipts，只保留 refs、指标摘要和失败分类，不复制 target memory/artifact body。
2. 建立 evidence delta：相对上一版机制，哪些 stage、prompt、skill、gate 或 suite 表现发生变化。
3. 要求 human review 将证据分为 adopt、revise、reject、watch。
4. 生成 online learning dataset refs，标注来源、许可、隐私边界和可重放条件。
5. 生成 mechanism patch proposal：observe、diagnose、edit 三段都必须引用证据。
6. 为 future candidates 标注 gate、owner、验证命令和 rollback path。

## 输出

- `online_learning_dataset_refs`
- `human_review_refs`
- `mechanism_patch_proposal_refs`
- `future_candidate_refs`

## 质量门槛

- proposal 只覆盖 prompt policy、skill policy、stage policy、suite policy、takeover review policy、optimizer candidate policy 或 quality gate policy。
- 每个 edit 都有 segment run ref、evidence delta ref 和 next mechanism candidate ref。
- human review 与 execution attempt 分离，有独立 receipt。
- future candidate 可以进入 Agent Lab gate，而不是直接落入 production default。

## 禁止事项

- 禁止训练或部署模型权重。
- 禁止把自学习结果直接写入 target memory body 或 artifact body。
- 禁止绕过 owner review 采用机制补丁。
- 禁止把单次成功轨迹当作普遍质量结论。
