<p align="center">
  <img src="assets/branding/opl-meta-agent-logo.png" alt="OPL Meta Agent 标志" width="132" />
</p>

<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md"><strong>中文</strong></a>
</p>

<h1 align="center">OPL Meta Agent 元智能体工坊</h1>

<p align="center"><strong>把一个专业工作流，变成可测试、可接入、可持续改进的 AI Agent</strong></p>
<p align="center">从想法到 Agent 基线：定义交付 · 拆解工作 · 生成骨架 · 跑测试 · 形成改进建议</p>

<table>
  <tr>
    <td width="33%" valign="top">
      <strong>适用人群</strong><br/>
      想把研究、写作、审核、交付等专业流程沉淀成 AI Agent 的开发者和团队
    </td>
    <td width="33%" valign="top">
      <strong>解决问题</strong><br/>
      让新 Agent 不只是一个 prompt，而是有目标、边界、测试和改进路径的可交付系统
    </td>
    <td width="33%" valign="top">
      <strong>如何开始</strong><br/>
      说清楚目标 Agent 要交付什么、不能做什么、什么算合格，然后先生成可测试基线
    </td>
  </tr>
</table>

<p align="center">
  <img src="assets/branding/opl-meta-agent-overview.png" alt="OPL Meta Agent 主示意图" width="100%" />
</p>

> `OPL Meta Agent` 面向“开发 AI Agent”这件事本身：你描述一个想要的专业 Agent，它帮助你把目标、边界、工作步骤、测试和改进建议组织成一套可落地的 Agent 基线。

<!--
Owner: `opl-meta-agent`
Purpose: `public_repository_entry`
State: `public_entry`
Machine boundary: 本 README 是人读仓库入口。机器真相继续归 `contracts/`、`agent/`、`runtime/authority_functions/`、source、CLI/API 行为、OPL Agent Lab result refs、work-order receipts、target owner receipts / typed blockers 和 tests。
-->

## 为什么需要它

现在做一个 Agent 很容易从 prompt 开始，但真正要把它用于论文、基金、审核、汇报、运营或其他高价值工作时，问题会很快变复杂：

- 这个 Agent 到底要交付什么，什么不该由它负责？
- 它应该分几步完成工作，每一步需要哪些材料和工具？
- 只有一段 prompt，怎么知道它能稳定交付？
- 测试失败后，是改 prompt、改技能、改流程，还是提高质量门槛？
- 已有 Agent 能不能被系统化接管测试，而不是靠人工经验反复调？

**OPL Meta Agent 就是为了解决这些问题。** 它把“我想要一个 Agent”推进成“我有一套可测试、可审阅、可继续改进的 Agent 基线”。

它不会把 Agent 开发简化成“写一段 prompt”。一个可用 Agent 需要先把目标、边界、工作步骤、测试和失败后的改进路径整理清楚；OPL Meta Agent 帮你把这些内容组织成可运行、可测试、可继续演进的基线。

## 核心亮点

**从一句目标生成 Agent 蓝图**<br/>
你不用一开始就写完整规范。先描述这个 Agent 面向什么工作、最终要交付什么，系统会帮助整理目标、边界、输入、输出和工作步骤。

**先定边界和质量线**<br/>
每个 Agent 都需要知道自己该做什么、不该做什么、什么结果才算合格。OPL Meta Agent 会把这些要求放在基线里，而不是留在口头约定中。

**把 Agent 做成可测试对象**<br/>
新 Agent 不只生成一组文件，还会配套测试套件、运行证据和基线结果，方便判断它是否真的能完成目标工作。

**把失败变成改进建议**<br/>
当测试或运行暴露问题时，系统会把失败证据整理成下一版机制建议，例如调整提示词、技能、阶段设计、测试策略或质量门槛。

**也能接管已有 Agent 的测试**<br/>
对已经存在的 Agent，它可以先接管测试和证据整理，给出改进候选，而不是直接改写对方的专业判断或最终交付。

**保留设计、测试和改进空间**<br/>
新 Agent 往往需要比较多个工作拆解、提示策略、技能组合和测试方案。OPL Meta Agent 会把这些候选和失败证据整理成可审阅的下一版建议，而不是直接替目标领域做最终判断。

## 你可以这样开始

- “帮我把这个研究工作流做成一个 AI Agent，先明确交付物、边界和质量门槛。”
- “基于这个已有 Agent 仓库接管测试，生成测试套件和改进建议，但不要接管它的领域判断。”
- “跑一轮 Agent Lab，把失败证据整理成下一版机制建议，等我确认后再采用。”

## 适合处理的工作

- 把新 Agent 想法拆成目标理解、经验调研、工作步骤、Agent 骨架、测试套件、基线运行和后续改进。
- 为论文、基金、汇报、审核、运营等高价值流程生成可交付的 Agent 基线。
- 为新 Agent 或已有外部 Agent 组织测试、恢复探针、评分引用和采用门槛。
- 产出基线交付记录、受门控的学习候选和机制改进建议。
- 把真实运行证据整理成可审阅、可回滚、需要确认后再采用的下一版候选。

## 工作方式

- 用户说明目标 Agent 的领域、交付物、合格标准、禁止事项和运行约束。
- `OPL Meta Agent` 先整理公开经验和工作步骤，再生成候选 Agent 包。
- 候选 Agent 会进入 Agent Lab 测试；测试结果会被整理成用户能审阅的基线记录、问题清单和下一版改进建议。
- 任何机制变更、默认 Agent 切换、质量采用或真实交付权威，都需要显式门槛或目标领域拥有者确认。

## Agent Lab 自进化闭环

<p align="center">
  <img src="assets/branding/opl-meta-agent-evolution-loop.png" alt="OPL Meta Agent Agent Lab 自进化闭环" width="100%" />
</p>

自进化闭环的核心是让每次运行都变成可审阅的改进材料：

- **看证据**：读取运行片段、失败记录、候选结果和测试引用。
- **找瓶颈**：定位反复失败、预算浪费、检查缺口或工作步骤漂移。
- **提下一版机制**：把问题整理成提示词、技能、工作步骤、测试策略或质量门槛的改进候选。
- **确认后采用**：改进补丁仍然只是建议；专业内容、记忆正文、交付物和最终判断继续等待目标领域 owner 确认。

## 当前定位与边界

- `OPL Meta Agent` 是 OPL Foundry Agent 系列里的 agent-building / improvement 成员，面向“把一个专业工作流做成可测试 Agent”。
- 它负责整理目标、边界、工作步骤、Agent 骨架、测试套件和下一版改进建议。
- 它可以从零生成新 Agent 基线，也可以先接管已有 Agent 的测试和失败证据整理。
- 它只提出候选、测试结果和改进建议，不替目标领域做最终判断，不直接改写目标 Agent 的领域内容、记忆正文或交付物。
- 它的 StageRun controlled canary 和 refs-only scaleout evidence 是当前证据面，不是 readiness 或 promotion 声明。
- 它复用 One Person Lab Framework 的脚手架、Agent Lab、队列、状态投影和采用门槛，不在本仓重建通用运行框架。

<details>
  <summary><strong>给技术操作者看的机制说明</strong></summary>

- 标准 Skill 入口是自然语言请求：用户可以直接对 Codex 说要为某个交付工作流构建 OPL-compatible 智能体，OPL Meta Agent 会把它推进到受门控的基线生成路径。
- `build-agent-baseline`、`takeover:test`、`agent:evidence` 和 `execute:external-work-order` 这类 action surface 由 package scripts、contracts、source 和 tests 描述；README 里的命令只做入口指针。
- 当前技术真相在 [当前状态](./docs/status.md)、[架构](./docs/architecture.md)、[不可变约束](./docs/invariants.md)、[关键决策](./docs/decisions.md)、package scripts，以及 [`contracts/`](./contracts/) 下的机器合同。
- OPL Framework 持有 generated interfaces、Agent Lab、work-order execution、registry/discovery、App/workbench projection、absorb/cleanup 和 promotion gates。本仓提供 agent-building semantics 和 refs-only outputs。
- StageRun canary、generated interface readiness、registry/App projection、suite pass、work-order shape、mechanism proposal 或 refs-only scaleout closeout 都不能升级成 live progress、target-domain readiness、quality/export verdict、owner receipt body、App live rendering、human approval 或 default promotion。

</details>

## 这个仓库应该怎么读

1. 潜在使用者和智能体开发者先看当前首页，再继续看 [项目概览](./docs/project.md) 和 [当前状态](./docs/status.md)。
2. 技术规划、架构判断和边界同步，继续读 [架构](./docs/architecture.md)、[不可变约束](./docs/invariants.md) 和 [关键决策](./docs/decisions.md)。
3. 机器可读面在 [`contracts/`](./contracts/)；可执行验证入口在 [`scripts/`](./scripts/)；测试入口是 `npm test`。

## 给智能体和技术操作者的快速入口

<details>
  <summary><strong>如果你准备把这个仓直接交给 Codex 或其他智能体，先看这里</strong></summary>

- 单独 clone 这个仓不会安装 OPL Framework 或运行时 substrate。需要 live run 时，先准备当前 `one-person-lab` checkout 或 release bundle。
- 先读本 README，再读 [项目概览](./docs/project.md)、[当前状态](./docs/status.md)、[架构](./docs/architecture.md)、[不可变约束](./docs/invariants.md)、[关键决策](./docs/decisions.md) 和 [`contracts/`](./contracts/)。
- 当前命令面以 package scripts 和 `contracts/action_catalog.json` 为准；修改 contracts、README、docs、smoke scripts 或 action 边界时，同步更新聚焦测试。
- 本仓只负责智能体构建语义、测试编排和自进化候选组织。真实运行、长线测试、机制读模型、work-order execution 和 promotion gates 归 OPL Agent Lab / OPL Framework。
- `mechanism_patch_proposal`、controlled canary、operator summary、overclaim-boundary pass 和 refs-only scaleout 都只是候选或证据面，不能写成已采用机制、live progress、target-owner approval、App rendering proof 或目标领域真相。

</details>

## 常用命令

```bash
npm run typecheck
npm test
```

`typecheck` 会用 TypeScript compiler 检查 `scripts/**/*.ts` 和 `tests/**/*.ts`。`npm test` 验证合同字段、OPL 生成接口 bundle、真实 `agent/` domain pack 文件、stage ref 解析、非空文件与占位符缺席。Baseline、takeover、evidence 和 interface 命令由 `package.json`、`contracts/action_catalog.json`、source 与聚焦测试维护。

## 延伸阅读

- [Project](./docs/project.md)
- [Status](./docs/status.md)
- [Architecture](./docs/architecture.md)
- [Invariants](./docs/invariants.md)
- [Decisions](./docs/decisions.md)
- [Contracts](./contracts/)
