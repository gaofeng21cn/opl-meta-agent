# Eval Suite Build Prompt

Professional skill route: use `agent/professional_skills/oma-eval-takeover-review/SKILL.md` for suite design method. This prompt defines declarative evaluation inputs and the Foundry handoff boundary; suite evidence cannot become target quality, owner receipt, App-live readiness, or promotion authority.

## 目标

为 candidate 或 existing target agent 创建薄 `foundry_evaluation_request`，只声明 domain-owned task intent 与 refs，并形成 canonical Foundry evaluation work-order input。OPL Foundry Lab 是唯一 suite plan compiler。

## 输入

- candidate Agent Pack refs 或 target agent descriptor/contracts。
- acceptance criteria、stage/action refs、quality gate refs。
- artifact morphology brief refs：native source format、artifact body owner、creative source/export refs、sharding strategy、extent/scale contract、asset custody/file-path policy 和 realistic target task review refs。
- 需要覆盖的正常路径、失败路径、恢复路径和 owner boundary proof。

## 步骤

1. 从 target contracts 读取 stage、action、memory 与 artifact locator；缺失语义或 owner refs 时形成 route-back/blocker ref。
2. 为关键 stage 形成 task intent，输入使用 domain refs，不复制 target truth、memory body 或 artifact body。
3. 将 artifact-shape 风险、realistic target task、quality gate 和 improvement intent 表达为 refs；不生成 recovery probes、environment、trajectory plan、scorecard spec 或 completion policy。
4. 将 target identity、source/reviewer/candidate provenance 交给 canonical Foundry evaluation work order；request 不能携带 target identity。
5. producer 不填写 observations、pass/fail、gate status、suite plan、result 或 receipt body。
7. 检查 work order 可由 `opl agent-lab evaluation-work-order execute --work-order <work-order.json> --output <dir>` 消费。

## 输出

- `foundry_evaluation_request_ref`
- domain task-intent refs
- quality-gate / improvement-candidate refs
- `foundry_lab_evaluation_work_order_ref`

## 质量门槛

- request 只含 refs、schema 和 domain task intent。
- 每条 task intent 映射到 acceptance criterion、artifact morphology risk 或 authority boundary。
- target `domain_id + target_agent_ref + descriptor_ref` 只进入 work order；request 只绑定 request/suite/task identity。
- producer payload 不含 target identity、environment、probe、scorecard spec、completion policy、`observed_status`、`passed`、`gate_status`、suite plan、result 或 receipt body。

## 禁止事项

- 禁止 OMA 执行 suite 或签 result/receipt。
- 禁止把 quality-gate ref 写成 target quality verdict。
- 禁止在 request 中写入 target truth、memory body、artifact body或 framework-owned suite plan。
- 禁止只测 happy path 或 scaffold/interface/runner shape。
- 禁止把人工 owner review 替换为模型自评。
