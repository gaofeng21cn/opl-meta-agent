# Transferable Agent Practices

## 策略

成熟 agent/project 的经验只以可迁移机制进入 `opl-meta-agent`：stage decomposition、artifact locator、quality gates、recovery probes、receipt design、owner review、rollback 和 provenance。外部 runtime、私有服务、模型训练管线和数据库实现不作为默认依赖迁入。

## 可迁移对象

- Stage-led workflow：明确目标、输入、动作、输出、handoff、gate。
- Typed artifacts：descriptor、action catalog、stage plane、memory descriptor、artifact locator、receipt。
- Evidence discipline：运行轨迹、验证命令、Agent Lab result、owner review ref。
- Failure taxonomy：contract gap、environment gap、prompt gap、skill gap、quality gate gap。
- Human gates：baseline delivery、takeover、patch adoption、version absorb。

## 不迁移对象

- 外部 runtime 的 queue、scheduler、daemon、workbench、attempt ledger。
- 目标领域 memory body、truth body、artifact body。
- 不能审计来源的 benchmark claim。
- 无 rollback path 的自动 promotion。

## 使用方式

在 web research 和 optimizer iteration 中，每条经验先形成 source ref，再形成 pattern disposition。只有 adopt/adapt 的 pattern 可以进入 stage/action/gate 设计；reject/watch 保留为限制或后续观察项。
