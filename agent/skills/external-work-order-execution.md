# Skill: External Work Order Execution

## 用途

当 OMA 已生成或接收到 `opl_meta_agent_developer_patch_work_order`，并且需要进入实际执行阶段时，使用本 skill 把 work order 委托给 OPL Agent Lab。

## 输入

- `work_order_path`
- `opl_bin`
- 可选 `output_path`
- 可选 Agent Lab passthrough args

## 流程

1. 读取 developer patch work order。
2. 校验 work order 是 OMA 可委托的 refs-only developer patch work order，并确认禁止写 target truth、memory body、artifact body、quality/export verdict 和 default promotion。
3. 调用 `opl agent-lab execute-work-order --work-order <work_order_path> --json`，把 passthrough args 原样交给 OPL Agent Lab。
4. 写入 delegation receipt，记录 OMA 只做薄委托，target worktree lifecycle、queue、attempt ledger、absorb、cleanup、post-absorb target-domain owner closeout hook 调用和 execution receipt 均由 OPL Agent Lab / target owner 控制面持有。

## 输出

- `external_work_order_execution_delegation_ref`
- `opl_agent_lab_execution_result_ref`
- `no_oma_target_worktree_lifecycle_proof_ref`
- `owner_closeout_hook_delegated_ref`
- `no_oma_owner_receipt_write_proof_ref`

## 质量门槛

- OMA 入口只能形成命令委托和 delegation receipt。
- 命令必须保持 target-agent generic，不新增 MAS、MAG、RCA 或其他 domain 专用 command family。
- passthrough args 只能追加给 OPL Agent Lab，不能在 OMA 内解释成 runner、queue、worktree 或 absorb 行为。
- delegation receipt 必须声明 OMA 不拥有 target worktree lifecycle。
- delegation receipt 必须声明 `owner_closeout_hook_delegated=true`、`target_owner_closeout_owner=target-domain via OPL` 和 `oma_can_write_owner_receipt=false`。

## 禁止事项

- 禁止在 OMA 内实现 generic runner、worktree lifecycle、queue、attempt ledger、absorb 或 cleanup。
- 禁止写 target truth、memory body、artifact body、quality/export verdict 或 owner receipt body。
- 禁止在 OMA 内直接调用 target owner closeout hook；hook 调用只能由 OPL Agent Lab 在 absorb 后转交 target-domain owner action。
- 禁止把 OPL execution result 写成 target quality verdict 或 default promotion。
