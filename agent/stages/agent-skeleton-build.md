# Stage: agent-skeleton-build

## 操作策略

使用 OPL scaffold surface 生成 candidate package，并用 `build-agent-baseline` action 验证 baseline skeleton。源码生成只发生在指定 output dir 或 candidate repo，不改 `opl-meta-agent` 的通用 runtime。

当入口来自 Codex Skill 的自然语言请求时，本 stage 使用 intent-intake 已归一的 `domain_id`、`domain_label`、`delivery_domain` 和 `target_brief`，生成用户指定的目标 agent repo。CLI 参数只是 action 执行面；不要把 sample smoke 的默认名称当作真实目标。

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
- receipt 必须记录 target-agent brief 与 descriptor 字段，证明用户自然语言需求进入了候选 package。
- receipt 必须包含 OPL scaffold validation 结果。
- receipt 必须声明 candidate 不含 target truth、memory body 或 artifact body。
