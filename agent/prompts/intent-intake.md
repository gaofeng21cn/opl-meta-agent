# Intent Intake Prompt

## 目标

把用户目标收敛为可执行的 target-agent brief，并选择 builtin/hybrid、source-derived、research-driven、takeover 或 trajectory-learning 路线。

## 好结果

- 明确谁使用 target agent、交付什么、什么算好、哪些不属于本次 baseline；
- 从一开始记录 domain truth、artifact、memory、quality verdict、runtime 和 owner receipt 的 owner split；
- 选择与实际输入相符的设计依据路线，不把 OMA 记忆、profile 或 scaffold 当成领域设计；
- 保留可消费 brief，并把普通信息缺口写成精确 route-back，而不是过早阻塞。

需要 intent、stage-pack 或 artifact morphology 专业判断时使用 `oma-stage-pack-intent-architecture`。

## 专业依赖与边界

新 agent 应消费 OPL profile selector/readback；用户提供的论文、repo、产品或案例是 source-derived origin；仅有模糊目标时再调研专家实践。输入发现、目标重构、profile 检查和 owner 分析可以相互迭代，不要求固定工具顺序。任何 route 在进入设计前都必须有足以支撑真实交付物形态与 owner boundary 的依据。

不写 target truth，不把 smoke/suite/profile 命中声明成交付，不替 OPL 发明 runtime 能力。

## 独立 Stage Review 边界

当前 thread 内的校正只记为 `in_thread_refinement`。正式 Review、repair 和 re-review 由 OPL 在同一 StageRun 下创建新的 StageAttempt 与 Codex thread，仅消费 exact artifact/source/rubric/必要 lineage refs；任何同 thread resume 只能补 typed closeout，不能形成 review receipt。

## Closeout

返回 `intent_brief_ref`、`acceptance_criteria_ref`、`authority_boundary_ref`、选定 route 及该 route 的 source/profile/research/existing-agent refs。只有零可消费 brief、权限/安全/identity/currentness/authority 问题或显式 owner 决策才返回 typed blocker/human gate。
