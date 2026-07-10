# Baseline Evaluation Handoff Prompt

## 目标

把 candidate Agent Pack、AgentBuildReceipt 和 independent reviewer evidence 组织成 declarative Agent Lab suite seed 与 target-bound OPL Foundry Lab evaluation work order。OMA 不执行 suite，也不生成 suite result、execution receipt、owner receipt、learning ledger 或 promotion result。

## 输入

- candidate Agent Pack ref、target descriptor ref 与 AgentBuildReceipt ref。
- declarative baseline suite seed、scorecard spec、recovery probe spec 和 promotion-gate request refs。
- independent AI reviewer evaluation 与 artifact morphology evidence refs。
- OPL Foundry Lab evaluation work-order contract。

## 步骤

1. 确认 suite seed 只携带 declarative specs 与 refs，不含 `observed_status`、`passed`、`gate_status` 或伪 result/receipt。
2. 校验 target identity 同时包含 `domain_id`、`target_agent_ref` 和 `descriptor_ref`，suite/task identity 与 target 一致。
3. 将 source、reviewer 和 candidate provenance refs 去重排序并绑定到稳定 work-order identity。
4. 校验 `consumer_dependency.status=available`、execution owner 为 `one-person-lab/OPL Foundry Lab`，action 为 `opl agent-lab evaluation-work-order execute --work-order <work-order.json> --output <dir>`。
5. 输出 suite seed、Foundry evaluation work order 和 expected result ref；若没有 OPL 返回的 evaluation observations，保持 pending/typed-blocker route，不生成结果。
6. 只有显式 OPL suite result 与 execution receipt 返回后，才把它们交给 `improve:external-suite --suite-result` 和后续 owner-gated closeout。

## 输出

- `agent_lab_suite_seed_ref`
- `foundry_lab_evaluation_work_order_ref`
- `expected_evaluation_result_ref`
- optional externally returned suite-result / execution-receipt refs

## 质量门槛

- work-order identity 对 target、suite/task 与 canonical provenance 稳定绑定。
- refs 顺序或重复不改变 identity，任何语义身份变化都会改变 identity。
- suite seed 不包含 observations、pass/fail verdict 或 hosted ledger body。
- producer 状态只能声明 ready for OPL Foundry Lab evaluation，不能声明 delivered、domain ready、production ready 或 promoted。

## 禁止事项

- 禁止 OMA 本地执行 Agent Lab suite。
- 禁止伪造 suite result、Foundry execution receipt、target owner receipt、typed-blocker body、learning ledger 或 promotion result。
- 禁止把 AgentBuildReceipt 当成 target owner acceptance。
- 禁止把 work-order ready 当成 evaluation complete 或 baseline delivery。
