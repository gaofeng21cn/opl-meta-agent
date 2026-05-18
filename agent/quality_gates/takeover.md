# Gate: Takeover

## 适用范围

用于判断 `opl-meta-agent` 是否可以接管既有 OPL-compatible agent 的测试编排和自进化候选组织。

## 必需证据

- target agent descriptor ref。
- target stage/action contracts refs。
- memory/artifact/owner receipt refs。
- Agent Lab external suite ref。
- testing takeover receipt ref。

## 通过标准

- target agent owner authority preserved。
- takeover suite 全部使用 refs，不复制 target memory/artifact/truth body。
- receipt 声明 `can_write_target_domain_memory_body=false`。
- receipt 声明 `can_promote_default_agent_without_gate=false`。
- blocker taxonomy 可行动且可交给 target owner review。

## 拒绝标准

- target agent 缺少基本 OPL-compatible contracts 且无法定位 blocker。
- takeover 需要接管 target domain truth 或 quality verdict。
- suite 设计绕过 target owner gate。
- receipt 无法区分测试接管和领域所有权接管。
