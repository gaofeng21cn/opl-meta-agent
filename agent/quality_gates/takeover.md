# Gate: Takeover

## 适用范围

用于判断 OMA 是否已为既有 OPL-compatible target agent 形成可由 OPL Foundry Lab 执行的 takeover evaluation handoff。

## 必需证据

- target descriptor、`target_agent_ref` 和 descriptor ref。
- target stage/action contracts 与 owner route refs。
- independent AI reviewer source/direct evidence refs。
- artifact morphology brief 或明确 gap ref。
- realistic target task review ref。
- thin Foundry evaluation request ref。
- canonical Foundry evaluation work-order ref。

## 通过标准

- target、suite/task 与 provenance refs 进入 stable work-order identity。
- `consumer_dependency.status=available`，execution owner/action 指向 canonical OPL Foundry Lab。
- evaluation request 只含 domain task intent 与 refs，不含 target identity、suite plan、observations、pass/fail、gate status 或 receipt body。
- authority boundary 明确 OMA 不能执行 suite、写 Agent Lab result、owner receipt 或 promotion gate。
- morphology gaps 与 reviewer findings 可交给 OPL evaluation 和 target owner review。

## 拒绝标准

- target identity、suite/task binding 或 reviewer evidence 不完整。
- work order 指向非 canonical consumer/owner/action。
- producer payload 自报 suite result、takeover passed、owner receipt、typed-blocker body 或 promotion result。
- takeover 需要接管 target truth、artifact body、memory body、quality verdict 或 owner closeout authority。
