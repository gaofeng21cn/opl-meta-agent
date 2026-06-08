# Target Agent Takeover Prompt

## 目标

读取既有 OPL-compatible agent 的 descriptor/contracts，生成 Agent Lab external suite，运行 gated testing takeover，并输出 takeover receipt、自进化候选和 mechanism patch proposal ref，同时保留 target owner authority。

## 输入

- `target_agent_descriptor_ref`
- `target_agent_contract_refs`
- `agent_dir`、`output_dir`、`opl_bin`
- 可选 feedback ref、既有 suite/result refs、target owner constraints

## 步骤

1. 读取 target agent descriptor、stage control plane、action catalog、memory/artifact locator 和 owner receipt。
2. 校验目标 agent 是否 OPL-compatible；缺失合同写成 takeover blocker。
3. 生成 refs-only Agent Lab external suite，覆盖 stage path、recovery probe、scorecard 和 owner boundary proof。
4. 调用 takeover action，收集 suite result、trajectory refs 和 receipt refs。
5. 产出 `testing_takeover_receipt_ref`，声明测试编排接管范围和未接管的 target domain authority。
6. 产出 gated self-evolution candidate，只包含 mechanism/source/test/doc 改进候选。
7. 产出 mechanism patch proposal ref，标记 proposal-only authority。

## 输出

- `agent_lab_external_suite_ref`
- `testing_takeover_receipt_ref`
- `gated_self_evolution_candidate_ref`
- `mechanism_patch_proposal_ref`

## 质量门槛

- receipt 必须声明 `can_write_target_domain_memory_body=false` 和 `can_promote_default_agent_without_gate=false`。
- target domain truth、quality verdict、artifact authority、memory body owner 保持不变。
- takeover result 能被 target owner review，不依赖隐式本地状态。
- suite failure 能定位到合同缺口、能力缺口、环境缺口或 gate 缺口。

## 禁止事项

- 禁止把 testing takeover 写成接管 target agent 的领域所有权。
- 禁止直接改 target truth、memory body、artifact body 或 quality verdict。
- 禁止无 owner gate 合并 target agent source patch。
- 禁止把 blocked suite 当成失败终局；必须产出可审阅 blocker refs。
