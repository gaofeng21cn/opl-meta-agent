# Skill: Trajectory Learning Intake

## 用途

当 OMA 需要从历史执行轨迹、Agent Lab result、owner feedback 或 target patch-loop closeout 中提炼机制学习候选时，使用本 skill。它把 xskill 的 trajectory atomization / AtomTask / candidate buffer / canary signal 结构转成 OMA refs-only semantic pack。

## 输入

- `trajectory_refs` 或 `stage_attempt_refs`
- `agent_lab_result_refs`
- `owner_feedback_refs`
- `redaction_proof_refs`
- `team_sync_policy_refs`
- `ux_canary_signal_refs`
- `output_dir` 或 candidate/proposal sink ref

## 流程

1. 读取 OMA boundary policy 与 trajectory learning policy。
2. 校验每个输入是否有 source owner、redaction proof、allowed consumer 和 no-forbidden-write boundary。
3. 将轨迹拆成 single-intent AtomTask refs；每个 AtomTask 只包含 intent summary、locator、evidence refs、used policy refs 和 share boundary refs。
4. 对 AtomTask 进行机制归因：prompt gap、skill gap、stage-policy gap、quality gate gap、tool policy gap、suite policy gap、redaction gap、team sync gap 或 evidence gap。
5. 将 AtomTask 放入 candidate buffer，按目标 surface 聚合，并标注 evidence strength、UX/canary signal、risk、reviewer-needed 和 owner route。
6. 当 buffer 足以支持机制候选时，生成 skill / prompt / stage-policy proposal refs；证据不足时生成 `review_pending` / `completed_with_quality_debt` 并继续，零/损坏/不可读 candidate 则物化 no-output/failure diagnostic。只有 executor unavailable、安全/权限/authority、wrong-target identity/currentness、不可逆动作或显式 human decision 才 typed blocker。
7. 为每个 proposal 写明 Agent Lab gate、independent reviewer direct-evidence requirement、rollback/version refs、canary signal refs 和 redaction/team sync boundary refs。

## 输出

- `trajectory_atom_refs`
- `atom_task_buffer_refs`
- `candidate_buffer_refs`
- `skill_policy_proposal_refs`
- `prompt_policy_proposal_refs`
- `stage_policy_proposal_refs`
- `trajectory_learning_typed_blocker_refs`

## 质量门槛

- AtomTask 是单意图、可定位、可审阅、可脱敏的 refs-only evidence slice。
- candidate buffer 不包含 target domain artifact body、memory body、truth body 或 raw private transcript。
- proposal 只能改 OMA 机制面，或向 target owner 交付 refs-only work order；不能自行写 target owner authority 输出。
- UX / canary 只作为 evidence signal，必须等待 independent reviewer、Agent Lab 或 owner gate。
- team sync 只同步 redacted summaries、proposal refs、source ownership 和 rollback / withdraw refs。

## 禁止事项

- 禁止引入 xskill daemon、watcher、server、registry、team sync 或 skill repository lifecycle。
- 禁止把权重、UX 分、canary 胜出或候选数量写成质量结论。
- 禁止跨 AtomTask 合并不同用户意图来制造强证据。
- 禁止在缺 redaction proof 或 owner-route proof 时共享 candidate。
