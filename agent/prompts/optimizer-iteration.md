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
2. 让 Codex 做 root-cause reasoning：判断失败来自 agent 设计、prompt/skill/knowledge 缺口、tool policy、stage graph、质量门，还是 evidence 采集不足；禁止直接用后处理修补输出。
3. 校验 AI reviewer evaluation；缺少 critique/suggestions/source refs/provenance 时 fail closed。
4. 要求独立 reviewer 的 direct-evidence critique 进入改动依据；执行 Codex 不得在同一上下文里自审并批准自己的 patch。
5. 为每个 gap 建立 traceability matrix：source failure ref、AI reviewer suggestion/source refs、required patch ref、editable surface、test proof、receipt proof。
6. 只在 target owner gate 允许时修改 target agent source、tests 或 docs；修改范围必须对应 failure ref 或 reviewer suggestion ref。
7. 生成 target capability improvement candidate，声明不写 target truth、memory body、artifact body、quality verdict。
8. 运行目标 agent 的相关验证和 Agent Lab regression suite。
9. 写入 target agent version receipt，包含 branch/worktree refs、validation refs、absorb gate 和 cleanup requirement。
10. 产出 mechanism patch proposal refs，供后续 adoption gate 审查。

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
- Codex 可以提出新增/删除/合并 stage、替换工具、补知识源或重写 rubric；合同只检查这些候选的 refs、权限和证据。
- 任何 scorecard pass 都只是 regression signal，不能替代独立 AI reviewer verdict 或 owner receipt。

## 禁止事项

- 禁止无证据自由发挥目标 agent 改造。
- 禁止把 mechanism proposal 自动采用为默认机制。
- 禁止修改 target domain truth、memory body、artifact body、quality/export verdict。
- 禁止留下未清理 worktree、临时 branch 或未说明的运行副产物。
