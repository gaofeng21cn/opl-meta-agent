<p align="center">
  <img src="assets/branding/opl-meta-agent-logo.png" alt="OPL Meta Agent logo" width="132" />
</p>

<p align="center"><a href="./README.md">English</a> | <strong>中文</strong></p>

<h1 align="center">OPL Meta Agent</h1>

OPL Meta Agent 帮智能体开发者把一个工作目标变成可审阅、可评测的设计，也可以接手既有智能体，依据真实运行证据提出下一版改进。

## 让设计经得起评测

新建智能体时，OMA 把目标、权限、工作阶段和评测条件写进蓝图。改进已有智能体时，它从具体的运行结果找出差距，将判断依据和改进建议交给维护者审阅。既有知识和项目资料继续由原负责人维护。

维护者确定要实现的行为和验收标准。OMA 交付智能体蓝图或改进提案。OPL Foundry 根据设计生成候选实现、执行独立评测并保存结果，给维护者提供决定是否激活或继续修改的依据。[设计和执行的分工](docs/architecture.md)

## 从一个智能体开始

> “接手这个已经在用的智能体。根据这次运行结果，找出它在哪一步偏离目标，给我一版改进提案和能验证它的评测条件。”

在 OPL 软件中心安装 **OPL Meta Agent**。使用 `engineer-agent`，从新建、接手或改进中选择本次目标。下例使用自己准备的请求文件，返回可查询的 Foundry 运行。

```bash
opl agents run --domain oma --action engineer-agent --workspace /absolute/workspace --payload-file request.json
```

[文档导览](docs/README.md) · [当前验收进展](docs/active/oma-ideal-state-gap-plan.md)
