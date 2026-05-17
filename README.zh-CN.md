<p align="center">
  <img src="assets/branding/opl-meta-agent-logo.png" alt="OPL Meta Agent Logo" width="132" />
</p>

<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md"><strong>中文</strong></a>
</p>

<h1 align="center">OPL Meta Agent</h1>

<p align="center"><strong>用 OPL Framework 开发、测试并交付新的高价值知识工作智能体的 Foundry Agent</strong></p>
<p align="center">Agent 构建 · Agent Lab 测试 · 机制自进化</p>

<table>
  <tr>
    <td width="33%" valign="top">
      <strong>适用人群</strong><br/>
      想把一个高价值知识交付流程沉淀成 OPL-compatible domain agent 的开发者、维护者和 operator
    </td>
    <td width="33%" valign="top">
      <strong>组织内容</strong><br/>
      用户意图、公开经验、stage plan、agent skeleton、Agent Lab suite、baseline receipt 和机制补丁建议
    </td>
    <td width="33%" valign="top">
      <strong>如何开始</strong><br/>
      给出目标智能体的交付物、边界、质量门槛和运行约束，系统会生成可测试 baseline
    </td>
  </tr>
</table>

<p align="center">
  <img src="assets/branding/opl-meta-agent-overview.png" alt="OPL Meta Agent 主示意图" width="100%" />
</p>

> `opl-meta-agent` 是独立的 OPL-compatible domain agent。它负责 agent-building domain semantics；OPL Framework 负责通用 runtime、Agent Lab、scaffold、queue、attempt ledger、observability、optimizer / RL transition refs 与 promotion gates。

## 一句话快速启动

你可以直接这样说：

- “帮我把这个高价值知识交付流程做成一个 OPL-compatible agent，先明确交付物、边界和质量门槛。”
- “基于已有 agent repo 接管测试，生成 Agent Lab suite、takeover receipt 和自进化候选，但不要接管它的 domain truth。”
- “跑一轮 Agent Lab 之后，把失败证据转成 mechanism patch proposal，等待显式 gate 再采用。”

## 适合处理的工作

- 把新智能体想法拆成目标理解、经验调研、stage plan、agent skeleton、eval suite、baseline run、delivery 和 online learning。
- 通过 OPL scaffold surfaces 生成 OPL-compatible descriptor、stage/action metadata、memory/artifact locator、quality gate 和 owner receipt。
- 为新智能体或既有外部智能体生成 Agent Lab external suite、recovery probe、scorecard refs 和 promotion gate。
- 产出 baseline delivery receipt、gated online-learning candidate 和 mechanism patch proposal。
- 把 Agent Lab 的真实运行证据整理成可审阅、可回滚、可门控采用的下一版机制候选。

## 工作方式

- 用户提供目标智能体的领域、交付物、质量门槛、禁止事项和运行约束。
- `opl-meta-agent` 组织公开经验、拆解阶段、生成候选 agent package，并通过 OPL Agent Lab 运行 suite。
- Agent Lab 返回 refs-only suite result；本仓将其转成 baseline receipt、online-learning candidate 和 mechanism patch proposal。
- 任何机制变更、默认 agent promotion、质量采用或真实交付权威，都必须经过显式 gate 或目标 domain owner。

## Agent Lab 自进化闭环

<p align="center">
  <img src="assets/branding/opl-meta-agent-evolution-loop.png" alt="OPL Meta Agent Agent Lab 自进化闭环" width="100%" />
</p>

自进化闭环的核心不是让智能体直接改写最终答案，而是把一次运行拆成可审计的机制优化对象：

- `observe`：读取 Agent Lab segment run、trajectory refs、failure refs 和 candidate refs。
- `diagnose`：形成 `evidence_delta_ref`，定位重复失败、预算浪费、validator 漏洞或 stage drift。
- `edit`：只提出 `next_mechanism_candidate_ref`，覆盖 prompt policy、skill policy、stage policy、Agent Lab suite policy、takeover review policy、optimizer candidate policy 或 quality gate policy。
- `gate`：机制补丁仍是 proposal-only surface；不能写 target truth、memory body、artifact body、quality verdict，也不能绕过 explicit promotion gate。

## 当前定位与边界

- `opl-meta-agent` 对外定位为 agent-building `Foundry Agent`：独立 domain agent，负责把目标智能体需求推进成可测试、可交付、可持续优化的 baseline agent package。
- `opl-meta-agent` 是 `built on OPL Framework` 的 OPL-compatible package；它消费 OPL scaffold、Agent Lab、queue/projection 和 promotion gate，不在本仓重建 generic runtime。
- OPL Framework 持有 generic runtime、Agent Lab、standard scaffold、queue、attempt ledger、provider receipt、observability、optimizer/RL transition refs 和 promotion gate。
- 目标 domain agent 持有自己的 domain truth、quality verdict、artifact authority、memory body 和 owner receipt。
- 对第一步不是由 `opl-meta-agent` 开发的智能体，本仓也可以接管测试编排和自进化候选生成；默认仍只产生 Agent Lab suite、takeover receipt、gated candidate 和 mechanism patch proposal，不接管目标 agent 的 truth 或 artifact authority。
- 本仓不训练或部署模型权重，不无 gate promote default agent，不写目标智能体的 memory body、artifact body、quality/export verdict 或 domain truth。

<details>
  <summary><strong>给技术操作者看的机制说明</strong></summary>

- 最小自举入口是 `npm run bootstrap:sample -- --output-dir <dir> --opl-bin <opl>`：生成 `sample-brief-agent`，调用 OPL scaffold validate，生成 Agent Lab external suite，运行 `opl agent-lab run --suite`，再写入 baseline receipt、online-learning candidate 和 `mechanism-patch-proposal.json`。
- 外部接管入口是 `npm run takeover:test -- --agent-dir <existing-agent-dir> --output-dir <dir> --opl-bin <opl>`：读取目标 agent descriptor/contracts，生成 takeover suite，运行 Agent Lab，再写入 takeover receipt、gated self-evolution candidate 和 `takeover-mechanism-patch-proposal.json`。
- Mechanism patch proposal 记录 `mechanism_ref/version`、`editable_surfaces`、`observe/diagnose/edit`、`segment_run_ref`、`evidence_delta_ref`、`next_mechanism_candidate_ref` 和 proposal-only authority flags。
- OPL Agent Lab 的机制面是 refs-only control plane。它可以暴露 `opl agent-lab mechanism --json` 和 `opl agent-lab evolve --suite <suite.json> --json`，但不能把 suite pass、mechanism candidate 或 evolution segment 升级成 domain verdict。

</details>

## 这个仓库应该怎么读

1. 潜在使用者和 agent builder 先看当前首页，再继续看 [项目概览](./docs/project.md) 和 [当前状态](./docs/status.md)。
2. 技术规划、架构判断和边界同步，继续读 [架构](./docs/architecture.md)、[不可变约束](./docs/invariants.md) 和 [关键决策](./docs/decisions.md)。
3. 机器可读面在 [`contracts/`](./contracts/)；可执行 smoke 入口在 [`scripts/`](./scripts/)；测试入口是 `npm test`。

## 给 Agent 和技术操作者的快速入口

<details>
  <summary><strong>如果你准备把这个仓直接交给 Codex 或其他 Agent，先看这里</strong></summary>

- 先读本 README、[项目概览](./docs/project.md)、[当前状态](./docs/status.md)、[架构](./docs/architecture.md)、[不可变约束](./docs/invariants.md) 和 [关键决策](./docs/decisions.md)。
- 修改 contracts、README、docs 或 smoke scripts 时，同步更新 `tests/*.test.mjs`，确保 boundary flags 仍然证明 proposal-only / refs-only。
- 本仓只负责 agent-building semantics 和测试/自进化编排。需要真实运行、长线 suite、机制 read model 或 evolution segment 时，调用 OPL Agent Lab。
- 不要把 `mechanism_patch_proposal` 当作已采用机制；它只是可进入 gate 的候选。
- 不要把 takeover 理解成接管目标 agent 的 domain truth、memory body、artifact authority 或 quality verdict。

</details>

## 常用命令

```bash
npm test
```

```bash
npm run bootstrap:sample -- --output-dir /tmp/opl-meta-agent-demo --opl-bin /Users/gaofeng/workspace/one-person-lab/bin/opl
```

```bash
npm run takeover:test -- --agent-dir /tmp/opl-meta-agent-demo/sample-brief-agent --output-dir /tmp/opl-meta-agent-takeover --opl-bin /Users/gaofeng/workspace/one-person-lab/bin/opl
```

## 延伸阅读

- [Project](./docs/project.md)
- [Status](./docs/status.md)
- [Architecture](./docs/architecture.md)
- [Invariants](./docs/invariants.md)
- [Decisions](./docs/decisions.md)
- [Contracts](./contracts/)
