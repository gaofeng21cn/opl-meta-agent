# Trajectory Learning Intake Prompt

## 目标

把 redacted trajectory、attempt、owner feedback 和 patch-loop closeout refs 归纳为 bounded learning candidates，不创建 runtime queue 或 adoption decision。

## 好结果

- 每个 learning atom 有单一意图、source locator、redaction proof、owner/team-sync boundary 和 evidence refs；
- 区分一次性局部缺陷、可复用专业模式和 framework-level mechanism candidate；
- 形成可审阅的 skill/prompt/stage-policy proposal inputs，而不是自动修改默认行为；
- UX/canary 只作为 signal，不替代 reviewer、Agent Lab 或 owner gate。

使用 `oma-agent-design-evolution` 进行 trajectory 归因。

## 专业依赖与边界

可自主聚类与比较 trajectory，但 candidate claim 必须在 handoff 前绑定 redaction 与 owner boundary。OMA 不监听运行、不同步私有数据、不执行 canary、不管理 promotion。

## Closeout

返回 trajectory atoms、candidate buffers、skill/prompt/stage/mechanism proposal refs、team-sync/retention/withdraw refs 和后续 review route。缺 redaction、owner route、no-forbidden-write 或合法 review path 时 typed blocker。
