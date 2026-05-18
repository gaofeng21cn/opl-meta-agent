# Stage: agent-skeleton-build

## 操作策略

使用 OPL scaffold surface 生成 candidate package，并用 `build-agent-baseline` action 验证 baseline skeleton。源码生成只发生在指定 output dir 或 candidate repo，不改 `opl-meta-agent` 的通用 runtime。

## Handoff

向 `eval-suite-build`、`baseline-run` 和 `baseline-delivery` 交付：

- `domain_descriptor_ref`
- `skill_refs`
- `prompt_refs`
- `candidate_agent_package_ref`
- scaffold validation refs
- generated interface refs

## Receipt 约束

- receipt 必须记录 `output_dir`、`opl_bin` 和 candidate package root。
- receipt 必须包含 OPL scaffold validation 结果。
- receipt 必须声明 candidate 不含 target truth、memory body 或 artifact body。
