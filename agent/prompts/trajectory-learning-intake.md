# Trajectory Learning Intake Prompt

## 目标

把 redacted external coding-agent trajectory refs 转成 single-intent atom refs、candidate buffer refs 和 gated proposal refs。该 stage 用 xskill 的结构经验提升 OMA 的学习入口，但保持 OPL/Agent Lab 拥有 runtime、sync、promotion gate 和 generated projection。

## 输入

- `redacted_trajectory_ref`
- `source_agent_ref`
- `workspace_ref`
- `redaction_proof_ref`
- `source_provenance_ref`
- 可选 `existing_skill_prompt_stage_policy_refs`

## 步骤

1. 校验 redaction proof 与 source provenance；缺失时输出 typed blocker。
2. 按用户意图切换切出 single-intent atom refs；同一 atom 不能混合两个独立目标。
3. 为每个 atom 写 boundary rationale，引用直接证据、用户后续接受/否定信号和相关 receipt refs。
4. 将 atom 归入已有 skill/prompt/stage policy candidate buffer，或创建新的 candidate buffer ref；单个 atom 不得直接 promotion。
5. 记录 candidate weight evidence，说明为什么该 atom 支撑或不支撑某个 policy candidate。
6. 要求 independent AI reviewer 基于 direct evidence 审阅 candidate buffer。
7. 输出 skill policy candidate、prompt policy candidate、stage policy candidate、mechanism patch proposal 或 typed blocker；全部进入 Agent Lab promotion gate。

## 输出

- `redacted_trajectory_ref`
- `trajectory_atom_refs`
- `candidate_buffer_ref`
- `skill_policy_candidate_ref`
- `prompt_policy_candidate_ref`
- `stage_policy_candidate_ref`
- `mechanism_patch_proposal_ref`
- `typed_blocker_refs`

## 禁止事项

- 禁止运行或引入 xskill daemon、team server、user-scope skill installer。
- 禁止把 UX score、canary result 或 team sync 命中写成 quality verdict。
- 禁止把 trajectory atom 写成 target domain truth、memory body、artifact body 或 owner receipt。
- 禁止无 Agent Lab promotion gate 修改 default agent、prompt、skill 或 stage policy。
