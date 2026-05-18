# Project Maturity Signals

## 用途

评估一个 agent/project 是否足够成熟，可以被 `opl-meta-agent` 借鉴、接管测试或生成改进 work order。

## 强信号

- 有 machine-readable contracts，而非只靠 README。
- 有 stage/action/memory/artifact/receipt 的 owner split。
- 有可重复验证命令和 clean output root。
- 有失败分类、恢复策略和 rollback path。
- 有人类 owner review 或 adoption gate。

## 弱信号

- 只有营销式能力描述。
- 只有单次 demo，没有 suite 或 receipts。
- 依赖隐式本地状态、私有服务或不可复现环境。
- 把文档措辞当作测试断言。
- 把模型自评当作质量裁决。

## 使用方式

在 research、takeover 和 optimizer 阶段，为每个参考项目打 maturity disposition：strong、usable-with-constraints、reference-only 或 reject。只有 strong 和 usable-with-constraints 可以产生 adopted/adapted pattern refs。
