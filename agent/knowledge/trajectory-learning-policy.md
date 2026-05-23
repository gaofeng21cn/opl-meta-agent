# Trajectory Learning Policy

## 策略

外部项目 `skillnerds/xskill` 只作为 clean-room pattern source。`opl-meta-agent` 吸收的是轨迹原子化、candidate buffer、per-skill version/canary evidence 和 team redaction/sync 的结构，不吸收 xskill daemon、team server、用户级 skill installer、generic scheduler 或 canary verdict authority。

## 可迁移对象

- Redacted trajectory refs：进入共享学习前必须有 redaction proof、source provenance 和 workspace boundary。
- Single-intent atom：一段 atom 只覆盖一个用户意图，保留 atom boundary rationale、raw evidence ref 和后续否定/接受信号。
- Candidate buffer：单个 atom 不能直接改 prompt、skill 或 stage policy；必须先形成 candidate buffer ref、weight evidence refs 和 independent review refs。
- Proposal materialization：candidate buffer 只能产出 skill policy candidate、prompt policy candidate、stage policy candidate 或 mechanism patch proposal ref。
- Evidence signal：UX score、canary result、usage pattern 和 team sync 命中只作为 evidence signal，不是 quality verdict、owner receipt 或 default promotion。

## Owner 边界

OPL Framework 持有 trajectory ingest runtime、sync runtime、queue、attempt ledger、generated interface、Agent Lab promotion gate 和 workbench projection。OMA 持有 agent-building 语义：如何把 redacted trajectory atoms 转成 candidate buffer、proposal 或 typed blocker。目标 domain owner 持有 domain truth、memory body、artifact body、quality/export verdict 和最终 owner receipt。

## Fail Closed

缺 redaction proof、atom boundary rationale、candidate weight evidence、independent AI review、Agent Lab promotion gate 或 no-forbidden-write proof 时，trajectory learning intake 只能输出 typed blocker。任何把 UX/canary 分数写成质量裁决、把单次 atom 直接 promotion、或写用户级 skill install surface 的行为都必须 fail closed。
