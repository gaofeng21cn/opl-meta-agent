# OPL Meta Agent

[English](./README.md) | [中文](./README.zh-CN.md)

<!--
Owner: `oma`
Purpose: `public_repository_entry`
State: `public_entry`
Machine boundary: 人读公开入口。机器真相位于 `contracts/`、`agent/` 与仓库验证输出；Foundry 运行及生命周期真相归 OPL。
-->

OPL Meta Agent（OMA）把智能体工程目标转成可审阅的语义设计。它可以新建、接管或基于独立证据改进智能体，同时让设计判断与执行权限保持分离。

OMA 提供：

- 描述身份、权限、Stages、能力和内嵌 `EvalSpec` 的 `AgentBlueprint`；
- 绑定证据的诊断和下一版 `EvolutionProposal`；
- 明确的输出边界，避免把文件补丁、保护测试正文、执行坐标或发布决策混入语义结果。

公开入口是 `engineer-agent`，统一承载 `create`、`takeover` 和 `improve` 三种模式：

```bash
opl agents run --domain oma --action engineer-agent --workspace /absolute/workspace --payload-file request.json
```

命令返回 OPL 持有的 `FoundryRun`。候选字节物化、独立评测、证据和版本记录、qualification、canary、激活与回滚都由 OPL 执行；OMA 只提供其中的语义判断。

## 安装

通过 OPL 的标准软件包入口安装：

```bash
opl packages install oma --json
opl packages status --package-id oma --json
```

正式发布渠道为 `ghcr.io/gaofeng21cn/one-person-lab-packages/oma`，不可变版本用于精确引用，`latest-stable` 指向当前版本。OPL 与原生插件管理器负责安装和更新；不通过独立 GitHub Release 页面或附件分发。

安装后新建任务以加载专业技能。软件包安装、运行可用性和领域验收分别记录；具体边界见[待完成验收](./docs/active/oma-ideal-state-gap-plan.md)。

<details>
<summary>智能体和操作者边界</summary>

- `design` 与 `diagnose` 是 OPL 内部调用的 provider operation，不是公开命令或生成工具。
- OMA 持有目标理解、设计依据、评测语义、证据诊断与演化提案。
- OPL Foundry Kernel 持有运行状态、物化、评测执行、证据持久化、版本、qualification、canary、激活与回滚。
- provider 完成不等于智能体通过评测、激活、目标 owner 接受或 production adoption。

</details>

机器真相位于 [`contracts/`](./contracts/) 与 [`agent/`](./agent/)。完整验证：

```bash
scripts/verify.sh full
```

从[文档导览](./docs/README.md)开始阅读。[未完成验收](./docs/active/oma-ideal-state-gap-plan.md)区分仓库一致性、Foundry 运行与目标 owner 接受证据。
