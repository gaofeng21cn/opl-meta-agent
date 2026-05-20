# Gate: Mechanism Patch Adoption

## 适用范围

用于判断 mechanism patch proposal 是否可以从 proposal-only 进入 accepted mechanism candidate 或下一轮 baseline。

## 必需证据

- `mechanism_ref/version`
- `segment_run_ref`
- `evidence_delta_ref`
- `next_mechanism_candidate_ref`
- independent AI reviewer direct-evidence receipt ref 或 human/owner review ref
- Agent Lab regression or comparison result ref
- no-shared-context proof between execution attempt and review attempt
- rollback / canary / version ledger refs for promoted mechanism changes

## 通过标准

- observe、diagnose、edit 三段都有证据引用。
- editable surface 属于 prompt policy、skill policy、stage policy、suite policy、takeover review policy、optimizer candidate policy 或 quality gate policy。
- review/audit attempt 与 execution attempt 独立，并且 reviewer critique 直接引用运行轨迹、失败 ref、diff ref 或 owner feedback ref。
- rollback path 和 supersession rule 明确。
- proposed change 保留 Codex executor 的开放式专家判断空间；没有把路线选择、审稿判断、写作策略或机制诊断固化成封闭脚本。
- scorecard、schema completeness、contract completeness 或 suite pass 只作为 evidence，不作为 adoption verdict。

## 拒绝标准

- proposal 直接写 target truth、memory body、artifact body、quality/export verdict。
- 单次轨迹被当成普遍质量结论。
- 缺少 owner review 或 human gate。
- 缺少独立 AI reviewer direct-evidence receipt 或 no-shared-context proof。
- 机制补丁会无 gate promote default agent。
- 机制补丁通过 checklist 或后处理规则替代 Codex/owner 的专家判断。
