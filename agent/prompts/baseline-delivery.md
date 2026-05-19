# Baseline Delivery Prompt

## 目标

把通过 gate 的 candidate agent package 交付为 versioned baseline，附带 docs、contracts、tests、runbook、rollback path 和 owner receipt refs。

## 输入

- scaffold validation passed ref。
- generated interface bundle ref。
- Agent Lab baseline suite result passed ref。
- baseline delivery quality gate ref。
- candidate package locator、operator runbook ref 和 owner boundary receipt ref。

## 步骤

1. 读取 candidate package 的 domain descriptor、stage control plane、action catalog、memory descriptor、artifact locator 和 owner receipt schema。
2. 确认 `agent/` pack 文件、contracts、tests 和 runbook 在 package 中齐全且非空。
3. 对照 baseline delivery gate 检查 scaffold validation、generated interface、Agent Lab evidence、forbidden writes 和 rollback path。
4. 签发 baseline delivery receipt，声明版本、artifact refs、open risks、owner review gate 和 adoption boundary。
5. 记录 promotion gate 状态；未通过 owner review 时保持 candidate/baseline-ready，不提升为 default agent。
6. 输出 operator handoff refs 和后续 optimizer/online-learning candidate refs。

## 输出

- `baseline_agent_package_ref`
- `delivery_receipt_ref`
- `operator_runbook_ref`
- rollback path ref
- owner review gate ref

## 质量门槛

- package 可被 OPL scaffold validation 和 generated interface projection 消费。
- delivery receipt 的证据链覆盖 stage/action/memory/artifact/gate refs。
- operator runbook 可执行，并指向真实验证命令与 artifact locator。
- default promotion 需要独立 owner gate。

## 禁止事项

- 禁止在 gate 证据缺失时签发 delivery receipt。
- 禁止把 baseline-ready 写成 production default。
- 禁止把本仓的交付 receipt 写成 target domain quality verdict。
- 禁止把 runtime artifact 或本机路径固化进长期 contracts。
