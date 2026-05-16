# opl-meta-agent 架构

`opl-meta-agent` 是 OPL-based Foundry Agent，不是 OPL Framework 内置模块。

## Owner Split

- `opl-meta-agent` owns：agent-building semantics、intent brief、research brief、stage decomposition、candidate agent package policy、Agent Lab suite specs、baseline delivery receipt、online learning review policy。
- `OPL Framework` owns：generic runtime、Agent Lab、standard scaffold、queue、attempt ledger、provider receipt、observability projection、optimizer/RL transition refs、promotion gates。
- target domain agent owns：domain truth、quality verdict、artifact authority、memory body、owner receipt。

## Runtime

本仓只声明 thin sidecar/projection adapter。长期运行、唤醒、排队、恢复、attempt ledger 和 operator workbench 由 OPL Framework 提供。

## Optimization

`opl-meta-agent` 可以生成 prompt、skill、stage-policy、tool-policy、few-shot、rubric-gap candidate refs。候选进入 OPL Agent Lab gates 后才能成为 baseline 变更。

## Self-Learning Loop

当前 repo-local smoke 闭环按以下顺序运行：

1. `agent-skeleton-build`：调用 OPL `agents scaffold` 生成 `sample-brief-agent`。
2. `eval-suite-build`：写入 `agent-lab-suite.json`，只包含 refs、recovery probes、scorecard refs 和 promotion gate。
3. `baseline-run`：调用 OPL `agent-lab run --suite`，由 OPL Agent Lab 返回 suite result。
4. `baseline-delivery`：写入 `baseline-delivery-receipt.json`，只声明 baseline package refs 和 acceptance gates。
5. `online-learning`：写入 `online-learning-candidate.json`，候选保持 gated，不自动推广默认 agent、不训练或部署模型权重。
