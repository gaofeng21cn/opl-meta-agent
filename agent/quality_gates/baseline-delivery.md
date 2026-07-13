# Gate: Baseline Delivery

## 适用范围

用于判断 immutable candidate agent package refs 是否足以形成 `baseline_handoff_candidate_ref` 并交给 target owner review。本 gate 不授予 baseline quality acceptance。只要已有可消费 package，缺少部分证据应形成 `completed_with_quality_debt` 并继续，不得阻断 refs-only artifact handoff；但不得声明 owner acceptance、baseline accepted、quality ready、production ready、delivery complete 或默认 promotion。

## 必需证据

- scaffold validation passed ref。
- generated interface bundle ref。
- OPL Foundry Lab 返回的 target-bound baseline / takeover suite result 与 execution receipt refs。
- external-suite capability judgment ref，必须证明 OMA 已显式消费 suite result 和 independent AI reviewer evidence。
- target capability candidate ref。
- developer patch work order、no-patch coordination work order 或 typed blocker ref。
- 结构化 AI reviewer evaluation ref/path，包含非空 critique、非空 suggestions、非 suite/scaffold-only source refs 和 review provenance。
- artifact morphology brief ref，覆盖 native source format、artifact body owner、creative source/export refs、sharding strategy、extent/scale contract、asset custody/file-path policy、thin assembler/helper boundary 和 realistic target task review refs。
- artifact morphology reviewer evidence ref/path；source refs 必须指向真实 target task、artifact locator、native source/shard/asset refs、diff/receipt 或 owner feedback，不能只有 scaffold/interface/suite refs。
- standard implementation profile ref，必须证明 Agent identity 来自 Markdown/JSON Pack，helper language 只存在于受限 helper declarations，generated surfaces 继续归 OPL。
- stage/action/memory/artifact/gate refs 完整。
- owner boundary contract/ref 与 expected downstream target-owner receipt locator；不得把 OMA handoff closeout 当成 owner acceptance receipt。
- operator runbook ref。

## 通过标准

- package 能被 OPL 识别为 Foundry Agent domain pack。
- 所有 machine-readable contracts 可被 OPL generated interfaces 消费。
- baseline suite 覆盖 happy path、failure path、recovery probe 和 forbidden writes。
- baseline receipt acceptance gates 明确 AI reviewer critique、suggestions、source refs 和 provenance 已通过校验。
- takeover / external suite evidence 由 OPL 返回，且 external-suite judgment 显式记录 `no_source_patch_required`、可执行 developer work order 或 expected blocker ref。
- baseline、takeover 或 external suite 至少一个 evidence path 覆盖 artifact morphology 风险，并能发现目标体量降级、开放式正文入源码字符串、缺分片、外部资产无 custody、assembler/helper 越界或缺 realistic target task review。
- helper replacement test 成立：替换 Python/TypeScript helper implementation 不需要修改 Agent identity、stage/golden path、generated interface 或 owner boundary；没有 helper need 时 target 保持 pack-only。
- implementation profile 中的每个 helper root 已物理存在并通过 target-repo 审计；尚未实现的 helper need 只出现在 AgentPackPlan / developer work order，不得伪装成已落地 helper。
- 若 reviewer 或 Agent Lab 发现缺口，缺口必须映射到 target capability candidate 和 developer patch work order，并在 owner gate 或 typed blocker 中收口。
- handoff candidate 绑定 immutable package refs/hash，并声明版本、rollback path、open risks 和 owner review gate。
- `baseline_delivery_receipt`、owner acceptance、quality/ready、promotion 与 delivery-complete verdict 均由 downstream target owner 持有，本 Stage 不签发或推断。

## 质量债务与硬停

- 下列缺口在已有可消费 package 时记录为质量债务，进入 optimizer、owner review 或后续 declared stage，不回滚或终止 stage graph。
- 零、损坏或不可读 package 物化为 no-output/failure diagnostic 并继续后续 declared stage。只有 unavailable executor、权限/凭据/安全、显式 human decision、authority violation、不可逆动作或 identity/currentness mismatch 才硬停。
- 所有拒绝项继续阻止 owner acceptance、baseline accepted、quality/ready 和 promotion，不再自动阻止 refs-only artifact handoff candidate。

## 拒绝标准

- 缺少 stage prompt、handoff 或 gate。
- 缺少 AI reviewer evaluation，或 critique/suggestions 为空。
- AI reviewer source refs 只有 suite/scaffold refs，无法证明 reviewer 读过真实 review/evidence/scorecard。
- 缺少 artifact morphology brief、morphology reviewer evidence、realistic target task review 或 morphology refs 未进入 handoff candidate。
- reviewer / suite evidence 只覆盖 scaffold、generated interface 或 Agent Lab runner shape，未覆盖目标交付物形态风险。
- 缺少 OPL-returned takeover result/execution receipt、external-suite judgment、target capability candidate 或 work order / expected blocker ref。
- Agent Lab 或 reviewer evidence 指出可修复缺口，但没有进入 improvement loop、developer work order 或 typed blocker。
- 需要 repo-private generic wrapper 才能运行。
- helper language、repo main language 或 implementation root 被写成 Agent membership/type，或 helper profile 把整个 `src/`/`packages/` 私有平台合法化。
- implementation profile 声明了不存在的 helper root，或把 helper requirement/candidate 当成已落地 implementation。
- Agent Lab result blocked/failed 且未进入 optimizer work order。
- package 写入 target truth、memory body、artifact body 或 quality verdict。
