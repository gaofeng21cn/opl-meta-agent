# Gate: External Work Order Execution

## 适用范围

用于判断 OMA developer patch work order 是否可以交给 OPL Agent Lab `execute-work-order` 执行。

## 必需证据

- developer patch work order path。
- `executor_lease_ref`、`reviewer_pool_refs`、`patch_execution_bundle_ref` 和 `target_closeout_refs`。
- work order completeness 中的 target verification、owner route、no-forbidden-write proof、rollback/canary/version refs。
- authority boundary 明确禁止 target truth、memory body、artifact body、quality/export verdict 和 default promotion 写入。
- OPL Agent Lab execution result ref。
- OMA no-target-worktree-lifecycle proof。

## 通过标准

- OMA 调用形状为 `opl agent-lab execute-work-order --work-order <path> --json`。
- passthrough args 原样追加给 OPL Agent Lab。
- target worktree lifecycle、queue、attempt ledger、absorb、cleanup 和 execution receipt 均由 OPL Agent Lab / target owner 控制面持有。
- 输出只记录 delegation receipt 和 OPL result ref。

## 拒绝标准

- work order 缺 executor-first bundle refs。
- authority boundary 允许写 target truth、memory body、artifact body、quality/export verdict 或 default promotion。
- OMA 入口尝试创建、吸收、清理 target worktree，或实现 generic runner / queue / attempt ledger。
- OPL execution result 被升级为 target quality verdict、artifact readiness、owner receipt body 或 default promotion。
