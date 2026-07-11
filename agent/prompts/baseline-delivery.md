# Baseline Delivery Prompt

## 目标

把通过 gate 的 candidate agent package 交付为 versioned baseline，附带 docs、contracts、tests、runbook、rollback path 和 owner receipt refs。

## 输入

- scaffold validation passed ref。
- generated interface bundle ref。
- OPL Foundry Lab 返回的 target-bound baseline/takeover suite result 与 execution receipt refs。
- 结构化 AI reviewer evaluation ref/path，必须包含 reviewer_kind、model_or_provider、run_ref、critique、suggestions、source_refs、verdict 和 provenance。
- artifact morphology brief ref/path，以及覆盖真实目标任务、native source/shard/asset refs、extent/scale contract 和 assembler/helper boundary 的 reviewer evidence。
- baseline delivery quality gate ref。
- candidate package locator、operator runbook ref 和 owner boundary receipt ref。

## 步骤

1. 读取 candidate package 的 domain descriptor、stage control plane、action catalog、memory descriptor、artifact locator 和 owner receipt schema。
2. 确认 `agent/` pack 文件、contracts、tests 和 runbook 在 package 中齐全且非空。
3. 校验 AI reviewer evaluation：critique 和 suggestions 不能为空，source_refs 不能只有 suite/scaffold refs，provenance 必须可追溯。
4. 校验 artifact morphology evidence：不能静默降低用户/source 声明的体量；native creative source、分片策略、项目内资产 custody、creative/export ref split 和 thin assembler/helper boundary 必须可追溯。
5. 对照 baseline delivery gate 检查 scaffold validation、generated interface、OPL-returned Agent Lab evidence、AI reviewer critique/suggestions/source refs、external-suite judgment、morphology refs、forbidden writes、owner closeout 和 rollback path。
6. 签发 baseline delivery receipt，声明版本、artifact refs、morphology refs、review provenance、open risks、owner review gate 和 adoption boundary。
7. 记录 promotion gate 状态；未通过 owner review 时保持 candidate/baseline-ready，不提升为 default agent。
8. 输出 operator handoff refs 和后续 optimizer/online-learning candidate refs。

## 输出

- `baseline_agent_package_ref`
- `delivery_receipt_ref`
- `operator_runbook_ref`
- `artifact_morphology_brief_ref`
- `artifact_morphology_review_ref`
- rollback path ref
- owner review gate ref

## 质量门槛

- package 可被 OPL scaffold validation 和 generated interface projection 消费。
- delivery receipt 的证据链覆盖 stage/action/memory/artifact/gate refs。
- delivery receipt 必须引用 AI reviewer critique、suggestions、source refs 和 provenance。
- delivery receipt 必须引用 artifact morphology brief 和 realistic target task review；长体量/开放式正文/外部资产型交付必须有 native source、shards、asset manifest/provenance 和 assembler/helper boundary refs。
- operator runbook 可执行，并指向真实验证命令与 artifact locator。
- default promotion 需要独立 owner gate。

## 禁止事项

- 禁止在 gate 证据缺失时签发 delivery receipt。
- 禁止在 AI reviewer evaluation 缺失、critique/suggestions 为空或 source refs 只有 suite/scaffold refs 时签发 delivery receipt。
- 禁止在 artifact morphology evidence 缺失、目标体量被降级、正文入源码字符串、缺分片或外部资产无项目内 custody 时签发 delivery receipt。
- 禁止把 baseline-ready 写成 production default。
- 禁止把 AgentBuildReceipt、evaluation request、OPL-generated suite plan 或 Foundry work-order ready 当成 OPL evaluation result 或 delivery evidence。
- 禁止把本仓的交付 receipt 写成 target domain quality verdict。
- 禁止把 runtime artifact 或本机路径固化进长期 contracts。
