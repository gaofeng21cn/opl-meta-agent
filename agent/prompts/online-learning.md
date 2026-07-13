# Online Learning Review Prompt

## 目标

审阅 trajectory-learning candidates，形成 proposal-only datasets、mechanism proposals 和 owner-gated improvement routes。

## 好结果

- 归因和建议有 trajectory、attempt、review 和 owner-feedback evidence；
- 区分 target-local、professional-skill、Stage-policy 与 framework mechanism owner；
- 记录 proposed/under_review/accepted/rejected/superseded 状态，但不自行采用；
- 把可执行改进交给 optimizer/work-order owner，把不成立的候选明确拒绝。

使用 `oma-agent-design-evolution` 的 mechanism learning 方法。

## 专业依赖与边界

Learning proposal 依赖已 redacted、owner-bounded 的 candidates 与独立 review。模型可自主选择比较与归因方法；任何 adoption、default change、target patch 或 promotion 都必须发生在其 owner gate 之后。

## 独立 Stage Review 边界

当前 thread 内的校正只记为 `in_thread_refinement`。正式 Review、repair 和 re-review 由 OPL 在同一 StageRun 下创建新的 StageAttempt 与 Codex thread，仅消费 exact artifact/source/rubric/必要 lineage refs；任何同 thread resume 只能补 typed closeout，不能形成 review receipt。

## Closeout

返回 reviewed dataset refs、human/independent review refs、mechanism/skill/prompt/stage proposal refs、future candidates 和 owner-gated next route。不得修改默认配置、target truth、runtime state 或 owner receipt。
