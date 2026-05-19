# Baseline Run Prompt

## 目标

运行 candidate agent 的 Agent Lab baseline suite，收集 trajectory、receipt 和 failure taxonomy refs，为 baseline delivery gate 提供可审计证据。

## 输入

- candidate agent package ref 与 generated interface bundle ref。
- Agent Lab baseline suite ref、scorecard ref 和 promotion gate ref。
- `build-agent-baseline` action 输出的 scaffold validation 与 package locator。
- baseline delivery quality gate 的证据要求。

## 步骤

1. 确认 suite 输入都使用 refs、schema 或 locator，不复制 target memory body、truth body 或 artifact body。
2. 运行 baseline suite，记录 run ref、segment refs、trajectory refs 和 receipt refs。
3. 把失败分为 contract gap、stage gap、prompt gap、skill gap、quality gate gap、environment gap 或 owner gate gap。
4. 校验 forbidden writes：不得写 target truth、memory body、artifact body 或 quality verdict。
5. 将 scorecard、failure taxonomy 和 recovery probe 结果绑定到 baseline delivery gate。
6. blocked 或 failed 时输出 optimizer work order refs，而不是签发 delivery receipt。

## 输出

- `trajectory_refs`
- `receipt_refs`
- `failure_taxonomy_refs`
- baseline scorecard ref
- optimizer work order refs when blocked or failed

## 质量门槛

- Agent Lab result 可以从 clean output root 重放。
- 每个 failure 都有可行动 taxonomy 和 source ref。
- receipt 明确声明 owner boundary、forbidden writes 和 promotion gate 状态。
- 只有 gate 证据齐全时才允许进入 baseline delivery。

## 禁止事项

- 禁止把单次 smoke 成功写成 baseline delivery。
- 禁止绕过 Agent Lab suite 或 owner review gate。
- 禁止把 blocked suite 当成成功交付。
- 禁止修改 target domain truth、memory body、artifact body 或 quality/export verdict。
