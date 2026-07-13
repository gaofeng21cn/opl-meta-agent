# OMA Stage Quality Cycle Roles

Stage manifest 的主提示词定义专业任务，quality rubric 定义好结果。OPL 为每个角色创建新的 StageAttempt；角色切换不得 resume 其他角色的 Codex thread。

## Route Contract

所有路由输出都放在 `route_impact`。终局 decisive Attempt 只返回一个 `stage_route_decision`；非终局 Attempt 最多返回一个 `stage_route_recommendation`。两者都使用 `decision_kind=advance|skip|repeat|reverse|route_back|complete`、除 `complete` 外必须指向 declared `target_stage_id`，并提供非空 `evidence_refs`；recommendation 还必须提供 `reason`。不得同时返回两者，也不得使用旧 `route_back_stage_ref`、`selected_next_stage_ref`、`next_stage_ref` 或 `workflow_complete`。

## Producer

产出当前 Stage 最好的 agent-building artifact。同 thread 校正只记为非权威 `in_thread_refinement`。Closeout 返回 exact artifact refs/hash、source refs 与必要 lineage，供独立 reviewer 消费。Formal Review StageRun 中 producer 只可返回 `route_impact.stage_route_recommendation`；primary-only StageRun 中 producer 是 decisive Attempt，返回 `route_impact.stage_route_decision`。`baseline-delivery` 是显式 primary-only handoff Stage：producer 只组织已经审过且 immutable 的 refs/hash 为 `baseline_handoff_candidate_ref`，成功 handoff 用 `decision_kind=complete`，refs/hash/version 漂移则 route-back 到 declared owning Stage；不得修改 target package 或签发 owner acceptance、ready、promotion、delivery-complete verdict。

## Reviewer

在新 thread 中只审 exact artifact bytes、Stage rubric、source 与必要 lineage。只返回稳定 findings：每项包含 `finding_id`、`severity`、`required`、`evidence_refs` 和 `repair_expectation`。Reviewer 不产 repair map，不修改 artifact，不读取 producer conversation。`repair_required` reviewer 是非终局 Attempt，只可返回 `route_impact.stage_route_recommendation`；terminal reviewer 返回 `route_impact.stage_route_decision`，必要时以证据 route-back 到最窄 declared owning Stage。Reviewer closeout 只返回 receipt 所需审阅字段，正式 Review receipt 由 StageRunController 物化。

## Repairer

在新 thread 中只消费被审 artifact、accepted finding refs、source/rubric 与必要 lineage，在 owning Stage 边界内修复。逐 `finding_id` 返回含 `repair_status`、`changed_artifact_refs` 和 `repair_evidence_refs` 的 repair map，并返回 exact changed hashes 与 lineage。Repairer 不关闭 findings、不做终局 Stage 判断，只可返回 `route_impact.stage_route_recommendation`，不得返回 `stage_route_decision`，也不得写 target truth、artifact body authority、owner receipt 或 OPL runtime state。

## Re Reviewer

在另一个新 thread 中，消费 prior findings 与 repair map，用同一 source/rubric 对 exact changed artifact refs/hash 逐条关闭 accepted findings。返回 re-review closure refs、remaining quality-debt refs 与 `pass`、`repair_required`、`quality_debt` 或 `hard_stop`；不得继承 repair rationale，也不得按 repairer 自述关闭 finding。`repair_required` re-reviewer 只可返回 `route_impact.stage_route_recommendation`；terminal re-reviewer 返回 `route_impact.stage_route_decision`，其 closeout 字段由 StageRunController 物化为正式 Review receipt。
