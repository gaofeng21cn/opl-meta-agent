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
- 它的 StageRun controlled canary 带有 operator 可读摘要，但该摘要只描述 controlled fixture refs 和 closeout shape，不声明 live domain progress、target-agent readiness、production readiness、App live rendering、human approval 或 default promotion。
- 它复用 One Person Lab Framework 的脚手架、Agent Lab、队列、状态投影和采用门槛，不在本仓重建通用运行框架。

<details>
  <summary><strong>给技术操作者看的机制说明</strong></summary>

- 标准 Skill 入口是自然语言请求：用户可以直接对 Codex 说“帮我做一个能交付 X 的 OPL-compatible 智能体，输出到 `<repo-dir>`，质量门槛是 Y，禁止 Z”。Codex 先把这句话归一成 `domain_id`、`domain_label`、`delivery_domain`、`target_brief`、`output_dir`、`opl_bin`、stage-decomposition runner 设置和 `ai_reviewer_evaluation`，再调用 `build-agent-baseline` action。
- 默认 `build-agent-baseline` 主路径会启动 live Codex `stage-decomposition` attempt，或消费一个显式 typed closeout packet。该 closeout 是目标 stage graph、action refs、pack 文件、independent gate policy 和 quality gate declaration 的来源；脚本只负责校验、物化、scaffold/Agent Lab 运行和 receipt 记录。
- stage-decomposition attempt 是开放式认知计算边界：executor 可以自主选择读取哪些参考、生成几个候选、如何比较取舍、是否请求 reviewer 或 typed blocker；action implementation 只负责校验和物化，不承担专家推理。
- 本仓工具目录遵循 Tool Affordance Boundary：声明脚手架、测试、evidence takeover、机制候选和 patch work-order 工具的能力、权限、凭据、可写范围和 forbidden authority；不规定 executor 必须按固定顺序调研、拆 stage、跑测试或生成候选。
- StageRun controlled canary evidence 位于 `contracts/stage_run_canary_evidence.json`。其中 `operator_summary` 只展示 stage refs、strategy refs、terminal owner receipt 或 typed blocker ref、blocked claims 和 next owner delta ref；overclaim boundary 禁止把这些 refs 升级为 live progress、readiness、quality/export verdict、production completion、App rendering、human approval、owner receipt body materialization 或 default-agent promotion。
- legacy runtime residue guard 位于 `contracts/stage_run_kernel_profile.json`。它把 canary 绑定到 functional privatization、default-caller deletion、source-purity scan 和 source-purity test refs；它不能恢复 repo-owned runtime/status/workbench wrapper，不能写 runtime/read-model state，不能授权 closeout，也不能授权物理删除。
- 参数化 action implementation 是 `npm run build-agent-baseline -- --output-dir <dir> --opl-bin <opl> --ai-reviewer-evaluation <reviewer-eval.json> [--stage-runner live|fixture --stage-decomposition-closeout <closeout.json>] --domain-id <domain-id> --domain-label <label> --delivery-domain <delivery-domain> --target-brief <brief>`：根据 typed stage-decomposition packet 生成用户指定的目标 agent repo，调用 OPL 脚手架校验，生成 Agent Lab 外部测试套件，运行 `opl agent-lab run --suite`，消费结构化 AI reviewer evaluation，再写入基线回执、真实目标交付回执、scaleout evidence ledger、后续学习候选和 `mechanism-patch-proposal.json`。
- free text closeout、partial refs、缺 independent gate policy、缺 quality gate declaration 或 self-review 必须在签发 baseline receipt 前 fail closed。
- `--domain-id` 是硬要求。已退役的隐式 fixture smoke 不再作为物化路径存在；`fixture` runner 只消费显式 typed closeout packet，真实目标证据只为显式目标 agent 生成。
- 外部接管入口是 `npm run takeover:test -- --agent-dir <existing-agent-dir> --output-dir <dir> --opl-bin <opl>`：读取目标智能体的描述文件和合同，生成接管测试套件，运行 Agent Lab，再写入接管回执、受门控的自进化候选和 `takeover-mechanism-patch-proposal.json`。
- 统一接口入口是 `opl agents interfaces --repo-dir <this-repo> --json`：OPL 读取本仓标准合同并生成 CLI、MCP、Skill、product-entry、OpenAI tool 和 AI SDK 描述。
- Registry / App 消费入口在 `contracts/opl_domain_manifest_registration.json` 和 `contracts/app_workbench_projection.json`：它们提供 discovery receipt 与 drilldown readiness receipt，只证明 OPL/App 可消费 refs，不宣称 App live rendering、目标事实写入或默认推广已经发生。
- Agent evidence takeover 入口是 `npm run agent:evidence -- --agent-repo <agent-repo> --output-dir <dir> --opl-bin <opl> [--ai-reviewer-evaluation <reviewer-eval.json>]`：读取 target production acceptance、Agent Lab handoff、generated-surface handoff 和 owner-receipt 合同，生成 `suite_kind=agent_production_evidence_suite` 的 `agent-lab-suite.json`，运行 `opl agent-lab run --suite`，再输出 refs-only developer work order、domain agent capability candidate、mechanism patch proposal，或在缺 reviewer evaluation 时输出 typed blocker。
- Usable landing 的验证路径不是再等待合同成熟，而是用真实目标仓触发 blocked evidence、生成 developer patch work order、由 Codex 在允许 surface 内落 patch、重跑目标验证并取得 owner receipt；独立 reviewer attempt 必须带 direct evidence、无共享上下文和可回滚版本引用。
- 机制补丁建议会记录 `mechanism_ref/version`、`editable_surfaces`、`observe/diagnose/edit`、`segment_run_ref`、`evidence_delta_ref`、`next_mechanism_candidate_ref` 和权限边界标记。
- OPL Agent Lab 的机制面是只读引用控制面。它可以暴露 `opl agent-lab mechanism --json` 和 `opl agent-lab evolve --suite <suite.json> --json`，但不能把测试通过、机制候选或演化片段升级成领域裁决。

</details>

## 这个仓库应该怎么读

1. 潜在使用者和智能体开发者先看当前首页，再继续看 [项目概览](./docs/project.md) 和 [当前状态](./docs/status.md)。
2. 技术规划、架构判断和边界同步，继续读 [架构](./docs/architecture.md)、[不可变约束](./docs/invariants.md) 和 [关键决策](./docs/decisions.md)。
3. 机器可读面在 [`contracts/`](./contracts/)；可执行验证入口在 [`scripts/`](./scripts/)；测试入口是 `npm test`。

## 给智能体和技术操作者的快速入口

<details>
  <summary><strong>如果你准备把这个仓直接交给 Codex 或其他智能体，先看这里</strong></summary>

- 不会自动安装。单独 clone 这个仓不会把 OPL Framework 或运行时 substrate 一起装好。要把 OPL Meta Agent 用到能用，先准备好当前的 `one-person-lab` checkout 或 release bundle，然后再运行本仓自己的测试和 baseline 命令。
- 先读本 README、[项目概览](./docs/project.md)、[当前状态](./docs/status.md)、[架构](./docs/architecture.md)、[不可变约束](./docs/invariants.md) 和 [关键决策](./docs/decisions.md)。
- 修改 contracts、README、docs 或 smoke scripts 时，同步更新 `tests/*.test.ts`，确保边界标记仍然证明本仓只产出建议和引用，不直接采用或写入目标领域内容。
- 本仓只负责智能体构建语义、测试编排和自进化候选组织。需要真实运行、长线测试、机制读模型或演化片段时，调用 OPL Agent Lab。
- 不要把 `mechanism_patch_proposal` 当作已采用机制；它只是可进入门槛审查的候选。
- 不要把 controlled canary、operator summary、overclaim-boundary pass 或 legacy residue guard 当成 live progress、production readiness、target-owner approval 或 App rendering proof。
- 不要把测试接管理解成接管目标智能体的领域事实、记忆正文、产物权威或质量裁决。

</details>

## 常用命令

```bash
npm run typecheck
npm test
```

`typecheck` 会用 TypeScript compiler 检查 `scripts/**/*.ts` 和 `tests/**/*.ts`。测试内容包括合同字段、OPL 生成接口 bundle、`agent/` domain pack 文件存在性、stage prompt/skill/knowledge/evaluation refs 真实路径、非空文件与占位符检查。

```bash
npm run build-agent-baseline -- --output-dir /Users/gaofeng/workspace/research-workbench-agent --opl-bin /Users/gaofeng/workspace/one-person-lab/bin/opl --ai-reviewer-evaluation /tmp/reviewer-eval.json --domain-id research-workbench-agent --domain-label "Research Workbench Agent" --delivery-domain research_workbench --target-brief "Create an OPL-compatible research workbench agent that turns a user research question into a scoped plan, evidence ledger, and owner-gated brief."
```

```bash
npm run takeover:test -- --agent-dir /tmp/opl-meta-agent-demo/research-workbench-agent --output-dir /tmp/opl-meta-agent-takeover --opl-bin /Users/gaofeng/workspace/one-person-lab/bin/opl
```

```bash
npm run agent:evidence -- --agent-repo /Users/gaofeng/workspace/med-autoscience --output-dir /tmp/opl-meta-agent-agent-evidence --opl-bin /Users/gaofeng/workspace/one-person-lab/bin/opl --ai-reviewer-evaluation /tmp/mas-reviewer-eval.json
```

```bash
/Users/gaofeng/workspace/one-person-lab/bin/opl agents interfaces --repo-dir . --json
```

## 延伸阅读

- [Project](./docs/project.md)
- [Status](./docs/status.md)
- [Architecture](./docs/architecture.md)
- [Invariants](./docs/invariants.md)
- [Decisions](./docs/decisions.md)
- [Contracts](./contracts/)
