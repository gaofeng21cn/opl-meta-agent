# Gate: Baseline Delivery

## 适用范围

用于判断 candidate agent package 是否可以作为 baseline delivery 交给 operator 或 target owner。

## 必需证据

- scaffold validation passed ref。
- generated interface bundle ref。
- Agent Lab baseline suite result passed ref。
- 结构化 AI reviewer evaluation ref/path，包含非空 critique、非空 suggestions、非 suite/scaffold-only source refs 和 review provenance。
- stage/action/memory/artifact/gate refs 完整。
- owner boundary receipt。
- operator runbook ref。

## 通过标准

- package 能被 OPL 识别为 Foundry Agent domain pack。
- 所有 machine-readable contracts 可被 OPL generated interfaces 消费。
- baseline suite 覆盖 happy path、failure path、recovery probe 和 forbidden writes。
- baseline receipt acceptance gates 明确 AI reviewer critique、suggestions、source refs 和 provenance 已通过校验。
- delivery receipt 声明版本、rollback path、open risks 和 owner review gate。

## 拒绝标准

- 缺少 stage prompt、handoff 或 gate。
- 缺少 AI reviewer evaluation，或 critique/suggestions 为空。
- AI reviewer source refs 只有 suite/scaffold refs，无法证明 reviewer 读过真实 review/evidence/scorecard。
- 需要 repo-private generic wrapper 才能运行。
- Agent Lab result blocked/failed 且未进入 optimizer work order。
- package 写入 target truth、memory body、artifact body 或 quality verdict。
