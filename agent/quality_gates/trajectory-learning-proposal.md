# Gate: Trajectory Learning Proposal

## 适用范围

用于判断 trajectory atom / candidate buffer 是否可以进入 OMA skill、prompt、stage policy 或 mechanism patch proposal。

## 必需证据

- `redacted_trajectory_ref`
- `redaction_proof_ref`
- `source_provenance_ref`
- `trajectory_atom_refs`
- `atom_boundary_rationale_refs`
- `candidate_buffer_ref`
- `candidate_weight_evidence_refs`
- independent AI reviewer direct-evidence receipt ref
- Agent Lab promotion gate ref
- no-forbidden-write proof ref

## 通过标准

- atom 切分按用户意图而不是工具调用、文件路径或 agent 内部步骤切分。
- candidate buffer 聚合多个可审计证据，单 atom 不直接 promotion。
- UX score、canary evidence 和 team sync signal 只作为 evidence signal；最终 adoption 依赖 independent review、Agent Lab gate 和 owner review。
- proposal editable surface 仅限 `agent/prompts`、`agent/skills`、`agent/stages`、quality gate policy 或 mechanism patch proposal refs。
- no-forbidden-write proof 说明没有写 target truth、memory body、artifact body、quality/export verdict 或 user-scope skill install path。

## 拒绝标准

- redaction proof 缺失或轨迹仍含 secret/private key/token。
- atom 混合多个独立用户意图。
- candidate weight evidence 无直接证据。
- UX/canary 被用作质量裁决或默认 promotion 权威。
- 引入 xskill daemon、team server、generic scheduler、user-scope skill installer 或外部 runtime 依赖。
