# Trajectory Learning Policy

## 目的

本策略记录从 `skillnerds/xskill` 可公开观察结构中 clean-room 学到的 agent-building 机制，并把它落到 `opl-meta-agent` 的 OMA-native semantic pack。它只描述如何把历史执行轨迹转成可审阅的机制候选 ref，不迁入 xskill runtime、daemon、watcher、server、skill repo 或同步协议实现。

## Clean-Room 学习对象

xskill 的可迁移结构是：长轨迹先按语义边界拆成单意图 Atom，再把 Atom 路由到 skill 候选缓冲区；候选积累到足够证据后，生成 skill 或 prompt 变更候选，并通过 UX / canary 信号判断新版本是否真的服务用户更好。

OMA 采用这些结构思想，但把所有对象表达为 refs-only domain semantics：

- `trajectory_atom_refs`：指向可审计轨迹片段、offset、来源 receipt 和 redaction proof 的 locator。
- `single_intent_atom_task_refs`：每个 AtomTask 只表达一个用户意图、一个完成边界和一个可独立评审的 evidence slice。
- `candidate_buffer_refs`：按目标 surface 聚合 AtomTask 证据，目标 surface 只能是 skill policy、prompt policy、stage policy、quality gate policy、suite policy 或 tool policy proposal。
- `mechanism_proposal_refs`：从 candidate buffer 派生的 skill / prompt / stage-policy proposal，保持 proposal-only。
- `ux_canary_signal_refs`：来自用户体验、canary、rollback、version 或 owner feedback 的证据信号，只能支持后续 gate 判断，不能直接写成质量 verdict。

## AtomTask 语义

单意图 AtomTask 必须满足：

- 来源轨迹有 `trajectory_ref`、`stage_attempt_ref` 或 `Agent Lab result ref`。
- 片段边界有 offset、message id、turn id 或等价 locator；正文可被 redaction 后引用。
- `intent_summary` 只描述用户意图和完成状态，不写目标 domain truth。
- `evidence_refs` 指向 receipts、diffs、commands、reviewer notes、owner feedback 或 runtime read-model refs。
- `used_policy_refs` 可记录 prompt、skill、stage、tool 或 gate 被触发的证据；不能声称这些 policy 已经正确。
- `pre_atom_ref` 与 `post_atom_ref` 只用于 provenance，不让跨 Atom 上下文污染单意图判断。

若无法建立单意图边界，输出 `typed_blocker_ref:trajectory_atomization_ambiguous`，并保留需要 human / independent reviewer 判定的 source refs。

## Candidate Buffer 规则

candidate buffer 是 evidence staging，不是执行队列。它用于把多个 AtomTask 归并到同一个机制候选上：

- 每条 candidate item 必须有 source AtomTask ref、贡献说明、目标 surface、风险说明和 reviewer-needed 标记。
- 权重或优先级只能表示证据强弱、复现频率或 UX 影响，不是质量分。
- buffer 达到阈值时只能生成 proposal ref，不能直接改默认 agent、不能触发 runtime daemon、不能训练模型。
- 手工 owner feedback 可以进入 buffer，但必须带 owner feedback ref 和 redaction / share boundary ref。
- 被拒绝或 superseded 的 candidate 保留 provenance，用于避免重复学习同一坏模式。

## UX / Canary 信号

UX / canary 是 evidence signal：

- 可记录用户是否继续追问、是否撤销、是否手动修正、是否接受输出、canary side、rollback/version ref、owner feedback ref。
- 可以支持独立 reviewer 判断候选是否值得进入 Agent Lab gate。
- 不能替代 Agent Lab regression、independent AI reviewer direct evidence、owner receipt 或 promotion gate。
- 缺少 quality floor、redaction proof、owner-route proof 或 no-forbidden-write proof 时，canary 信号只能保持 `watch` 或 `review_pending`。

## Redaction 与 Team Sync 边界

跨用户、跨团队或跨工具同步只允许同步 refs 和 redacted summaries：

- 原始轨迹正文、目标 domain artifact body、memory body、truth body 和 quality verdict 不进入 team sync。
- 上传前必须有 redaction proof ref，说明 secret、credential、personal data、customer data 和 target owner restricted content 已处理。
- team sync 只能共享机制候选、skill/prompt/stage-policy proposal refs、UX signal refs 和 provenance refs。
- 每个共享 candidate 必须声明 `source_owner`、`allowed_consumers`、`retention_policy_ref` 和 `rollback_or_withdraw_ref`。

## OMA 边界

OMA 可以生成 trajectory learning intake、candidate buffer、mechanism proposal 和 typed blocker refs。OPL Framework 持有 runtime、Agent Lab、queue、attempt ledger、promotion gate、generated interfaces 和 canary / rollout gate 的执行面。target domain owner 持有 domain truth、memory body、artifact authority、quality verdict 和 owner acceptance。

## 禁止事项

- 禁止引入 xskill runtime、daemon、watcher、server、registry、team sync service 或 skill repo lifecycle 作为 OMA 依赖。
- 禁止把 AtomTask、candidate buffer、UX score、canary win 或 suite pass 写成 target quality verdict。
- 禁止写 target domain truth、memory body、artifact body、owner receipt body 或 export verdict。
- 禁止用启发式后处理修补 prompt、skill、stage-policy 根因。
- 禁止无 Agent Lab gate 或 owner gate promote default agent。
