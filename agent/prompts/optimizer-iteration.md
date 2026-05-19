# Optimizer Iteration Prompt

## 目标

把 Agent Lab blocked/failed evidence 转成 gated improvement candidates、developer patch work orders、target version receipts 和 regression result refs。

## 输入

- External Agent Lab suite/result refs。
- Failure taxonomy、rubric gaps、trajectory refs、receipt refs。
- 结构化 AI reviewer evaluation ref/path：critique、suggestions、source_refs、verdict、provenance。
- Target agent source repo locator、owner gate constraints、allowed editable surfaces。
- `improve-from-external-agent-lab-suite` action inputs：`suite_path`、`agent_dir`、`output_dir`、`opl_bin`、`ai_reviewer_evaluation`、可选 `feedback_ref`。

## 步骤

1. 分类失败：contract gap、prompt gap、skill gap、stage-policy gap、tool-policy gap、quality gate gap、workspace environment gap。
2. 校验 AI reviewer evaluation；缺少 critique/suggestions/source refs/provenance 时 fail closed。
3. 为每个 gap 建立 traceability matrix：source failure ref、AI reviewer suggestion/source refs、required patch ref、editable surface、test proof、receipt proof。
4. 只在 target owner gate 允许时修改 target agent source、tests 或 docs；修改范围必须对应 failure ref 或 reviewer suggestion ref。
5. 生成 target capability improvement candidate，声明不写 target truth、memory body、artifact body、quality verdict。
6. 运行目标 agent 的相关验证和 Agent Lab regression suite。
7. 写入 target agent version receipt，包含 branch/worktree refs、validation refs、absorb gate 和 cleanup requirement。
8. 产出 mechanism patch proposal refs，供后续 adoption gate 审查。

## 输出

- `improvement_candidate_refs`
- `target_capability_improvement_candidate_refs`
- `mechanism_patch_proposal_refs`
- `developer_patch_work_order_refs`
- `target_agent_version_receipt_refs`
- `candidate_branch_refs`
- `regression_result_refs`

## 质量门槛

- 每个 patch 都能追溯到 suite failure 或 owner feedback ref。
- AI reviewer suggestions 必须进入 target capability improvement candidate 和 developer patch work order 的 traceability。
- regression 证明覆盖原 failure、边界禁止写入、runtime/read-model consumption 和 repo hygiene。
- target owner patch gate 与 version absorb gate 在 receipt 中明确。
- 没有用 heuristic post-processing 掩盖 stage/prompt/skill/gate 根因。

## 禁止事项

- 禁止无证据自由发挥目标 agent 改造。
- 禁止把 mechanism proposal 自动采用为默认机制。
- 禁止修改 target domain truth、memory body、artifact body、quality/export verdict。
- 禁止留下未清理 worktree、临时 branch 或未说明的运行副产物。
