# Eval Suite Build Prompt

Professional skill route: use `agent/professional_skills/oma-eval-takeover-review/SKILL.md` for suite design method. This prompt defines declarative evaluation inputs and the Foundry handoff boundary; suite evidence cannot become target quality, owner receipt, App-live readiness, or promotion authority.

## 目标

为 candidate 或 existing target agent 创建 OPL Agent Lab suite seed，包含 task manifests、recovery probe specs、scorecard specs、improvement candidate seeds 和 promotion-gate requests，并形成 canonical Foundry evaluation work-order input。

## 输入

- candidate Agent Pack refs 或 target agent descriptor/contracts。
- acceptance criteria、stage/action refs、quality gate refs。
- artifact morphology brief refs：native source format、artifact body owner、creative source/export refs、sharding strategy、extent/scale contract、asset custody/file-path policy 和 realistic target task review refs。
- 需要覆盖的正常路径、失败路径、恢复路径和 owner boundary proof。

## 步骤

1. 从 target contracts 读取 stage、action、memory 与 artifact locator；缺失语义或 owner refs 时形成 route-back/blocker ref。
2. 为关键 stage 设计 declarative task manifest，输入使用 refs，不复制 target truth、memory body 或 artifact body。
3. 增加 artifact-shape probes，覆盖体量降级、native source 缺失、长体量未分片、正文写入源码字符串、外部资产缺 custody/provenance 和 thin assembler 越界。
4. 加入 realistic target task，确保 suite 能反推真实交付物结构，而不只是 scaffold、interface 或 runner shape。
5. 设计 recovery probe specs、scorecard specs、improvement candidate seeds 和 promotion-gate requests；producer 不填写 observations、pass/fail 或 gate status。
6. 将 suite/task identity、target identity、source/reviewer/candidate refs交给 canonical Foundry evaluation work order。
7. 检查 work order 可由 `opl agent-lab evaluation-work-order execute --work-order <work-order.json> --output <dir>` 消费。

## 输出

- `agent_lab_suite_seed_ref`
- `agent_lab_task_manifest_refs`
- `scorecard_spec_refs`
- `promotion_gate_request_refs`
- `artifact_morphology_probe_refs`
- `foundry_lab_evaluation_work_order_ref`

## 质量门槛

- suite seed 的输入和输出均为 refs、schema 或 declarative spec。
- 每条 task 映射到 acceptance criterion、artifact morphology risk 或 authority boundary。
- target `domain_id + target_agent_ref + descriptor_ref`、suite id 和 task id 一致且进入 stable identity。
- producer payload 不含 `observed_status`、`passed`、`gate_status`、suite result 或 receipt body。

## 禁止事项

- 禁止 OMA 执行 suite 或签 result/receipt。
- 禁止把 declarative scorecard spec 写成 target quality verdict。
- 禁止在 suite 中写入 target truth、memory body 或 artifact body。
- 禁止只测 happy path 或 scaffold/interface/runner shape。
- 禁止把人工 owner review 替换为模型自评。
