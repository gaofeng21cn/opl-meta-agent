# Gate: Trajectory Learning Proposal

## 适用范围

用于判断 trajectory learning intake 产出的 AtomTask、candidate buffer 和 skill / prompt / stage-policy proposal 是否可以进入 Agent Lab、independent reviewer 或 owner review。

## 必需证据

- source `trajectory_ref`、`stage_attempt_ref`、`Agent Lab result ref` 或 owner feedback ref。
- single-intent AtomTask refs，包含 locator、intent summary、evidence refs、pre/post atom refs 和 used policy refs。
- redaction proof refs 与 team sync boundary refs。
- candidate buffer refs，包含目标 surface、贡献说明、risk note、reviewer-needed 标记和 proposal status。
- UX / canary signal refs when present，包含 signal source、side/version/rollback refs 和 quality floor refs when relevant。
- no-forbidden-write proof ref。
- independent AI reviewer direct-evidence receipt ref 或 explicit review_pending blocker ref。

## 通过标准

- 每个 AtomTask 只有一个用户意图，且可追溯到原始 trajectory locator 或 stage attempt receipt。
- raw trajectory、target artifact body、memory body、truth body 和 quality verdict 未被复制到 candidate buffer。
- proposal 的 editable surface 仅限 skill policy、prompt policy、stage policy、quality gate policy、suite policy、tool policy 或 refs-only work order policy。
- UX / canary 信号被标注为 evidence signal，并明确不能替代 quality verdict、owner receipt 或 promotion gate。
- redaction/team sync boundary 写明 source owner、allowed consumers、retention policy 和 rollback / withdraw ref。
- proposal 保留 Codex-first 专家判断空间，并交给 Agent Lab、independent reviewer 或 owner gate 继续判断。

## 拒绝标准

- AtomTask 混合多个用户意图，或缺少可审计 locator。
- candidate buffer 包含未脱敏 raw transcript、target truth、memory body、artifact body 或 quality/export verdict。
- proposal 依赖 xskill runtime、daemon、watcher、server、team sync service 或 skill repo lifecycle。
- UX score、canary side、候选数量、suite pass 或 schema completeness 被写成 adoption verdict。
- 缺 redaction proof、team sync boundary、no-forbidden-write proof 或 independent review path。
- proposal 试图无 gate promote default agent 或修改目标 domain authority 输出。
