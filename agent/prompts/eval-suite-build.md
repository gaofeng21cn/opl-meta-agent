# Eval Suite Build Prompt

Method skill route: use
`agent/skills/oma-agent-lab-suite-designer.md` for suite
design method. This prompt keeps the Agent Lab output refs and gate boundary;
the method skill must not turn suite evidence into target quality,
owner receipt, App-live readiness, or promotion authority.

## 目标

为 candidate 或 external agent 创建 OPL Agent Lab suite，包含 task manifests、recovery probes、scorecard refs 和 promotion gates。

## 输入

- candidate agent package refs 或 target external agent descriptor/contracts。
- acceptance criteria、stage/action refs、quality gate refs。
- artifact morphology brief refs：native source format、artifact body owner、creative source/export refs、sharding strategy、extent/scale contract、asset custody/file-path policy 和 realistic target task review refs。
- 需要覆盖的正常路径、失败路径、恢复路径和 owner boundary proof。

## 步骤

1. 从目标 agent contracts 读取 stage、action、memory 和 artifact locator；缺失时记录 suite blocker。
2. 为每个关键 stage 设计 task manifest，输入使用 refs，不复制 target memory body 或 artifact body。
3. 增加 artifact-shape probes：目标体量是否被静默降级、native creative source 是否存在、长书/长文/长 deck/数据包是否分片、开放式正文是否被塞进 Python/TS 字符串、imagegen/外部资产是否有项目内可复制路径和 manifest/provenance。
4. 用 realistic target task review 设计至少一个任务样例，检查 suite 是否能反推出真实交付物结构，而不是只证明 scaffold、interface 或 Agent Lab runner shape。
5. 增加 recovery probes：中断恢复、缺失输入、失败 receipt、权限越界、不可 promote 候选。
6. 设计 scorecard refs：baseline delivery、takeover、external suite self-evolution、mechanism patch adoption 和 artifact morphology risk。
7. 设计 promotion gates：owner review、人类确认、target owner patch gate、version absorb gate。
8. 写入 suite metadata：target agent dir、suite version、source refs、expected receipts、forbidden writes 和 morphology refs。
9. 检查 suite 可以由 `opl agent-lab run --suite` 消费。

## 输出

- `agent_lab_task_manifest_refs`
- `scorecard_refs`
- `promotion_gate_refs`
- `artifact_morphology_probe_refs`
- `agent_lab_external_suite_ref` when target is external

## 质量门槛

- suite 的所有输入和输出都是 refs、schema 或 receipt locator。
- 每条测试都映射到 acceptance criteria 或 authority boundary。
- suite 必须覆盖 artifact morphology 风险；缺 morphology refs、realistic target task review 或 artifact-shape probes 时只能返回 blocked suite。
- promotion gate 明确阻止无 gate default agent promotion。
- blocked suite 也能形成可行动 failure taxonomy，而不是只给文本评价。

## 禁止事项

- 禁止把 Agent Lab 结果直接升级成目标 domain quality verdict。
- 禁止在 suite 中写入 target memory body、artifact body 或 truth body。
- 禁止只测 happy path。
- 禁止只测 scaffold/interface/runner shape 而不检查目标交付物形态。
- 禁止把人工 owner review 替换为模型自评。
