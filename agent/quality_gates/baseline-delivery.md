# Gate: Baseline Delivery

## 适用范围

用于判断 candidate agent package 是否可以作为 baseline delivery 交给 operator 或 target owner。

## 必需证据

- scaffold validation passed ref。
- generated interface bundle ref。
- Agent Lab baseline suite result passed ref。
- OMA takeover / Agent Lab external suite result passed ref。
- external-suite self-evolution receipt ref，必须证明 OMA 已消费 Agent Lab result 和 independent AI reviewer evidence。
- target capability candidate ref。
- developer patch work order、no-patch coordination work order 或 typed blocker ref。
- 结构化 AI reviewer evaluation ref/path，包含非空 critique、非空 suggestions、非 suite/scaffold-only source refs 和 review provenance。
- artifact morphology brief ref，覆盖 native source format、artifact body owner、creative source/export refs、sharding strategy、extent/scale contract、asset custody/file-path policy、thin assembler/helper boundary 和 realistic target task review refs。
- artifact morphology reviewer evidence ref/path；source refs 必须指向真实 target task、artifact locator、native source/shard/asset refs、diff/receipt 或 owner feedback，不能只有 scaffold/interface/suite refs。
- stage/action/memory/artifact/gate refs 完整。
- owner boundary receipt。
- operator runbook ref。

## 通过标准

- package 能被 OPL 识别为 Foundry Agent domain pack。
- 所有 machine-readable contracts 可被 OPL generated interfaces 消费。
- baseline suite 覆盖 happy path、failure path、recovery probe 和 forbidden writes。
- baseline receipt acceptance gates 明确 AI reviewer critique、suggestions、source refs 和 provenance 已通过校验。
- takeover / external suite 通过，且 self-evolution receipt 显式记录 `passed_no_mechanism_patch_required`、`no_patch_required`、可执行 developer work order 或 typed blocker。
- baseline、takeover 或 external suite 至少一个 evidence path 覆盖 artifact morphology 风险，并能发现目标体量降级、开放式正文入源码字符串、缺分片、外部资产无 custody、assembler/helper 越界或缺 realistic target task review。
- 若 reviewer 或 Agent Lab 发现缺口，缺口必须映射到 target capability candidate 和 developer patch work order，并在 owner gate 或 typed blocker 中收口。
- delivery receipt 声明版本、rollback path、open risks 和 owner review gate。

## 拒绝标准

- 缺少 stage prompt、handoff 或 gate。
- 缺少 AI reviewer evaluation，或 critique/suggestions 为空。
- AI reviewer source refs 只有 suite/scaffold refs，无法证明 reviewer 读过真实 review/evidence/scorecard。
- 缺少 artifact morphology brief、morphology reviewer evidence、realistic target task review 或 morphology refs 未进入 delivery receipt。
- reviewer / suite evidence 只覆盖 scaffold、generated interface 或 Agent Lab runner shape，未覆盖目标交付物形态风险。
- 缺少 takeover suite result、external-suite self-evolution receipt、target capability candidate 或 work order / typed blocker。
- Agent Lab 或 reviewer evidence 指出可修复缺口，但没有进入 improvement loop、developer work order 或 typed blocker。
- 需要 repo-private generic wrapper 才能运行。
- Agent Lab result blocked/failed 且未进入 optimizer work order。
- package 写入 target truth、memory body、artifact body 或 quality verdict。
