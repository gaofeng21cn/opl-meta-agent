# Trajectory Learning Intake Prompt

Method skill route: use
`agent/skills/oma-trajectory-learning-analyst.md` for
trajectory atomization and learning-candidate analysis. This prompt keeps the
refs-only candidate buffer boundary; the method skill must not become a
runtime, queue, team sync, or promotion gate.

## 目标

把历史 trajectory、Agent Lab result、owner feedback 或 developer work order closeout refs 拆成 OMA-native single-intent AtomTask refs，并形成 refs-only candidate buffer 与 skill / prompt / stage-policy proposal。该 prompt 采用 xskill clean-room 学习语义：学习结构，不复制 runtime。

## 输入

- `trajectory_refs`、`stage_attempt_refs`、`Agent Lab result refs` 或 `developer_patch_work_order_closeout_refs`。
- `redaction_proof_refs`、`team_sync_policy_refs`、`source_owner_refs`。
- 可选 `ux_signal_refs`：user acceptance、manual correction、rollback、canary side、version ref、owner feedback ref。
- OMA policy refs：`agent/knowledge/trajectory-learning-policy.md` 与 `agent/knowledge/opl-boundary-policy.md`。

## 步骤

1. 先声明 owner split：OMA 只生成 mechanism learning refs；OPL 拥有 runtime、Agent Lab 和 promotion gate；target owner 拥有 truth、memory、artifact、quality 和 owner receipt。
2. 校验输入是否只有 refs、redacted summaries 和可共享 provenance；缺 redaction proof 时输出 typed blocker。
3. 将每条 trajectory 按用户意图、任务完成边界、工具/skill 切换和证据变化切成 single-intent AtomTask refs。
4. 对每个 AtomTask 写明 `intent_summary`、source locator、evidence refs、used policy refs、UX / canary signal refs、pre/post atom refs 和 share boundary refs。
5. 拒绝跨意图合并；边界不清时保留 source refs 并输出 atomization blocker。
6. 将 AtomTask 路由进 candidate buffer：目标 surface 只能是 skill policy、prompt policy、stage policy、quality gate policy、suite policy 或 tool policy proposal。
7. 让 Codex 判断 candidate 是否表达真实机制缺口、重复成功模式、redaction 风险、team sync 风险或 owner-route 缺口。
8. 生成 proposal refs：skill proposal、prompt proposal、stage-policy proposal、quality-gate proposal 或 typed blocker。
9. 标注每个 proposal 的 Agent Lab gate、independent reviewer gate、rollback/version ref、canary evidence signal 和 no-forbidden-write proof requirement。

## 输出

- `trajectory_atom_refs`
- `single_intent_atom_task_refs`
- `candidate_buffer_refs`
- `skill_policy_proposal_refs`
- `prompt_policy_proposal_refs`
- `stage_policy_proposal_refs`
- `ux_canary_signal_refs`
- `redaction_team_sync_boundary_refs`
- `typed_blocker_refs`

## 质量门槛

- 每个 AtomTask 只有一个用户意图和一个可审阅 evidence slice。
- candidate buffer 只保存 refs、redacted summaries、risk notes 和 proposal status。
- UX / canary 信号必须保持 evidence signal，不能成为 adoption verdict。
- proposal 必须保留 Codex-first 专家判断空间，不把未来路线选择固化成脚本。
- 输出必须声明不写 target truth、memory body、artifact body、quality/export verdict 或 owner receipt body。

## 禁止事项

- 禁止读取、同步或重写未脱敏原始轨迹正文。
- 禁止调用或依赖 xskill runtime、daemon、server、watcher 或 team sync。
- 禁止把 candidate buffer 当作执行队列或 promotion gate。
- 禁止用 UX score、canary side 或 suite pass 直接替代 independent reviewer / owner gate。
