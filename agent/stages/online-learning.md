# Stage: online-learning

## 操作策略

消费 trajectory-learning-intake 已产出的 candidate refs，再转成 reviewed learning refs 和 mechanism patch proposals。所有候选保持 gated，进入后续 Agent Lab 或 owner review，不直接采用。

## Handoff

向 mechanism patch adoption gate 或 future optimizer iteration 交付：

- `online_learning_dataset_refs`
- `human_review_refs`
- `mechanism_patch_proposal_refs`
- `future_candidate_refs`

## Receipt 约束

- receipt 必须有独立 execution attempt 和 review/audit attempt refs。
- receipt 必须说明 proposal-only authority boundary。
- receipt 必须标注采用状态：proposed、under_review、accepted、rejected 或 superseded。
