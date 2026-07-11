# Target Agent Takeover Prompt

## 目标

读取既有 OPL-compatible agent 的 descriptor/contracts 和 independent reviewer evidence，生成 thin takeover evaluation request 与 canonical OPL Foundry Lab evaluation work order，同时保留 target owner authority。OMA 不运行 gated takeover，不签 takeover receipt。

## 输入

- `target_agent_descriptor_ref`
- `target_agent_contract_refs`
- `ai_reviewer_evaluation_ref`
- `agent_dir`、`output_dir`
- artifact morphology brief / locator refs；缺失时记录 route-back 或 candidate gap ref。
- 可选 feedback、既有 OPL suite-result 和 target owner constraint refs。

## 步骤

1. 读取 target descriptor、stage control plane、action catalog、memory/artifact locator 和 owner route refs。
2. 校验 work order target identity 具有 `domain_id`、`target_agent_ref`、`descriptor_ref`，且 descriptor 与 request task intent 一致。
3. 校验 independent reviewer evidence 和 artifact morphology evidence；缺 source/direct evidence 时 fail closed。
4. 生成 refs-only declarative takeover evaluation request，覆盖 stage path、owner boundary、artifact-shape 和 quality refs；OPL 编译 recovery probes、scorecard、environment 与 completion policy。
5. 生成 canonical Foundry evaluation work order，绑定 target、suite/task、source/reviewer/candidate provenance，且 `consumer_dependency.status=available`。
6. 返回 gated self-evolution candidate ref 与 mechanism candidate ref，均为 proposal-only；不写 hosted candidate ledger。
7. 将 work order 交给 OPL Foundry Lab 执行；只有外部返回的 suite result / execution receipt 才能进入后续 `improve:external-suite` 与 target-owner closeout。

## 输出

- `foundry_evaluation_request_ref`
- `foundry_lab_evaluation_work_order_ref`
- `artifact_morphology_gap_refs`
- `gated_self_evolution_candidate_ref`
- `mechanism_candidate_ref`

## 质量门槛

- request 不含 target identity、environment、probe、scorecard spec、completion policy、observed status、passed、gate status、suite plan 或 result/receipt body。
- work order 使用 canonical OPL owner/action，且 stable identity 绑定完整 target 与 provenance。
- target truth、quality verdict、artifact authority、memory body 和 owner closeout owner 保持不变。
- producer 只声明 ready for OPL Foundry Lab evaluation，不声明 takeover passed、delivered 或 domain ready。

## 禁止事项

- 禁止本地执行 Agent Lab 或生成 takeover receipt。
- 禁止直接改 target truth、memory body、artifact body 或 quality verdict。
- 禁止无 owner gate 合并 target source patch。
- 禁止把 work-order ready 或 declarative evaluation request 当成测试通过。
- 禁止伪造 suite result、execution receipt、target owner receipt、typed-blocker body、learning ledger 或 promotion result。
