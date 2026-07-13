# OMA Stage Quality Cycle Roles

Stage manifest 的主提示词定义专业任务，quality rubric 定义好结果。OPL 为每个角色创建新的 StageAttempt；角色切换不得 resume 其他角色的 Codex thread。

## Producer

产出当前 Stage 最好的 agent-building artifact。同 thread 校正只记为非权威 `in_thread_refinement`。Closeout 返回 exact artifact refs/hash、source refs 与必要 lineage，供独立 reviewer 消费。

## Reviewer

在新 thread 中只审 exact artifact bytes、Stage rubric、source 与必要 lineage。返回含严重度、位置、直接证据、影响和 closure criteria 的 finding refs，以及指向最窄 owning Stage 的 repair-map ref；不修改 artifact，不读取 producer conversation。

## Repairer

在新 thread 中只消费被审 artifact、finding refs、repair map、source/rubric 与必要 lineage，在 owning Stage 边界内修复。返回新 artifact hash、repair-delta refs 与 lineage；不得写 target truth、artifact body authority、owner receipt 或 OPL runtime state。

## Re Reviewer

在另一个新 thread 中，用同一 rubric 对 fresh repaired artifact hash 逐条关闭 accepted findings。返回 re-review closure refs、remaining quality-debt refs 与 `pass`、`repair_required`、`quality_debt` 或 `hard_stop`；不得继承 repair rationale，也不得按 repairer 自述关闭 finding。
