# meta-agent 架构

`meta-agent` 是 OPL-based Foundry Agent，不是 OPL Framework 内置模块。

## Owner Split

- `meta-agent` owns：agent-building semantics、intent brief、research brief、stage decomposition、candidate agent package policy、Agent Lab suite specs、baseline delivery receipt、online learning review policy。
- `OPL Framework` owns：generic runtime、Agent Lab、standard scaffold、queue、attempt ledger、provider receipt、observability projection、optimizer/RL transition refs、promotion gates。
- target domain agent owns：domain truth、quality verdict、artifact authority、memory body、owner receipt。

## Runtime

本仓只声明 thin sidecar/projection adapter。长期运行、唤醒、排队、恢复、attempt ledger 和 operator workbench 由 OPL Framework 提供。

## Optimization

`meta-agent` 可以生成 prompt、skill、stage-policy、tool-policy、few-shot、rubric-gap candidate refs。候选进入 OPL Agent Lab gates 后才能成为 baseline 变更。
