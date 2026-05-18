# Gate: External Suite Self-Evolution

## 适用范围

用于判断 external Agent Lab suite 的 blocked/failed evidence 是否可以进入 target agent capability improvement 流程。

## 必需证据

- suite path 和 suite result ref。
- failure taxonomy 或 rubric gap refs。
- target agent repo locator。
- patch traceability matrix。
- developer patch work order ref。
- regression result refs。

## 通过标准

- 每个 required patch 都有 source failure ref。
- editable surfaces 限定在 target owner gate 允许的 source、tests、docs 或 mechanism policy。
- regression 覆盖原 failure、forbidden writes 和 runtime/read-model consumption。
- version receipt 声明 branch/worktree、absorb gate 和 cleanup state。

## 拒绝标准

- patch work order 没有证据来源。
- 通过启发式后处理绕过真实机制缺口。
- 修改 target truth、memory body、artifact body 或 quality verdict。
- regression 只证明本地单元测试，无法证明目标 runtime 消费。
