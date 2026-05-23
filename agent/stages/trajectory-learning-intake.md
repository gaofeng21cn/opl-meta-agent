# Stage: trajectory-learning-intake

## 操作策略

把历史 trajectory 和 patch-loop closeout refs 转成 OMA-native trajectory learning candidates。该 stage 只做 refs-only atomization、candidate buffer 组织和 mechanism proposal intake；运行、监听、同步、canary 分流、Agent Lab gate 与 promotion gate 由 OPL Framework 持有。

## 输入

- `trajectory_refs`
- `stage_attempt_refs`
- `agent_lab_result_refs`
- `owner_feedback_refs`
- `redaction_proof_refs`
- `team_sync_policy_refs`
- `ux_canary_signal_refs`

## Handoff

向 `online-learning`、`optimizer-iteration`、mechanism patch adoption gate 或 target owner review 交付：

- `trajectory_atom_refs`
- `single_intent_atom_task_refs`
- `candidate_buffer_refs`
- `skill_policy_proposal_refs`
- `prompt_policy_proposal_refs`
- `stage_policy_proposal_refs`
- `redaction_team_sync_boundary_refs`
- `ux_canary_signal_refs`
- `trajectory_learning_typed_blocker_refs`

## Receipt 约束

- receipt 必须声明 OMA 只写 mechanism learning refs，不写 target truth、memory body、artifact body、quality/export verdict 或 owner receipt body。
- receipt 必须证明每个 AtomTask 有单意图边界、source locator、redaction proof 和 evidence refs。
- receipt 必须说明 candidate buffer 是 proposal staging，不是 runtime queue、daemon task 或 promotion gate。
- receipt 必须记录 UX / canary 只是 evidence signal，并列出后续 independent reviewer、Agent Lab 或 owner gate。
- receipt 必须保留 team sync boundary：source owner、allowed consumers、retention policy、rollback / withdraw ref 和 no-forbidden-write proof。

## Blocker

缺少 redaction proof、team sync boundary、single-intent locator、owner route、no-forbidden-write proof 或 review path 时，输出 typed blocker，不生成 adoptable proposal。
