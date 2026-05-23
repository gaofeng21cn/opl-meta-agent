# Skill: Trajectory Learning Intake

## 用途

当需要从历史 coding-agent 轨迹中沉淀可复用 agent-building 机制时，使用本 skill。它把 xskill 风格的 trajectory atom、candidate buffer 和 canary evidence 转译为 OMA-native refs-only proposal，而不是运行外部学习 runtime。

## 输入

- redacted trajectory refs 与 redaction proof
- source provenance、workspace boundary、agent/runtime refs
- existing prompt/skill/stage policy refs
- independent reviewer refs 或 owner feedback refs

## 流程

1. 先校验隐私与 provenance，缺 redaction proof 时停止。
2. 切分 single-intent atom，保留 atom boundary rationale。
3. 搜索已有 policy refs，优先复用已有 candidate buffer，避免为近义经验创建重复 proposal。
4. 给 atom 写 candidate weight evidence；弱证据进入 watch 或 typed blocker，不刷阈值。
5. 聚合 candidate buffer，形成 skill/prompt/stage policy candidate 或 mechanism patch proposal。
6. 把 UX/canary 作为 evidence signal 交给 independent AI reviewer 与 Agent Lab gate。
7. 输出 proposal refs、owner review refs、no-forbidden-write proof 和 typed blocker refs。

## 质量门槛

- 每个 atom 只有一个主用户意图。
- 每个 candidate 都能回溯到 atom refs、review refs 和 source provenance。
- UX/canary 信号必须标注为 evidence-only。
- proposal 不替代 owner verdict，不写 target domain truth、memory body、artifact body 或 quality/export verdict。

## 禁止事项

- 禁止安装或覆盖 `~/.agents/skills`、`~/.codex/skills` 或其他用户级 skill discovery path。
- 禁止把外部 `SKILL.md` 直接作为 OMA domain truth。
- 禁止在缺 independent review 或 Agent Lab promotion gate 时 promote candidate。
