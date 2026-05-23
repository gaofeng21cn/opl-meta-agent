# Stage: Trajectory Learning Intake

## 目标

从 redacted trajectory refs 生成 single-intent atom refs、candidate buffer refs 和 gated proposal refs，让历史 coding-agent 经验可被 OMA 学习，同时保持 runtime、sync、queue、attempt ledger、Agent Lab gate 和 generated projection 归 OPL Framework。

## 输入

- `redacted_trajectory_ref`
- `redaction_proof_ref`
- `source_provenance_ref`
- `workspace_ref`
- `existing_skill_prompt_stage_policy_refs`

## 动作

1. 校验 redaction / provenance / workspace boundary。
2. 生成 single-intent trajectory atom refs 和 atom boundary rationale refs。
3. 归类到 candidate buffer，并写入 candidate weight evidence。
4. 触发 independent AI reviewer 审查 candidate buffer。
5. 形成 skill/prompt/stage policy candidate、mechanism patch proposal 或 typed blocker。
6. 将 proposal 交给 Agent Lab promotion gate，不直接 promotion。

## 输出

- `trajectory_atom_refs`
- `candidate_buffer_ref`
- `skill_policy_candidate_ref`
- `prompt_policy_candidate_ref`
- `stage_policy_candidate_ref`
- `mechanism_patch_proposal_ref`
- `typed_blocker_refs`

## 边界

该 stage 不运行 trajectory daemon，不管理 team server，不安装 user-scope skill，不把 UX/canary evidence 当作 quality verdict，也不写 target domain truth、memory body、artifact body、owner receipt 或 default agent promotion。
