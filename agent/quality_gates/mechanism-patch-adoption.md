# Gate: Mechanism Patch Adoption

## 适用范围

用于判断 mechanism patch proposal 是否可以从 proposal-only 进入 accepted mechanism candidate 或下一轮 baseline。

## 必需证据

- `mechanism_ref/version`
- `segment_run_ref`
- `evidence_delta_ref`
- `next_mechanism_candidate_ref`
- human review ref
- Agent Lab regression or comparison result ref

## 通过标准

- observe、diagnose、edit 三段都有证据引用。
- editable surface 属于 prompt policy、skill policy、stage policy、suite policy、takeover review policy、optimizer candidate policy 或 quality gate policy。
- review/audit attempt 与 execution attempt 独立。
- rollback path 和 supersession rule 明确。

## 拒绝标准

- proposal 直接写 target truth、memory body、artifact body、quality/export verdict。
- 单次轨迹被当成普遍质量结论。
- 缺少 owner review 或 human gate。
- 机制补丁会无 gate promote default agent。
