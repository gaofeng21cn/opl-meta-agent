# OPL Meta Agent

<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md"><strong>中文</strong></a>
</p>

**用于构建 OPL-compatible 高价值知识工作智能体的 Foundry Agent**

`opl-meta-agent` 是独立的 OPL-compatible domain agent。它负责把一个新智能体想法推进成可测试、可交付、可接入 OPL 的 agent package；OPL Framework 负责通用 runtime、Agent Lab、scaffold surface、queue、attempt ledger、observability、optimizer transition refs 与 promotion gates。

品牌资产预留在 `assets/branding/`。当前 README 不引用具体图片路径，等主线程生成真实资产后再接入。

## 定位

`opl-meta-agent` 面向“开发新的 OPL-compatible 高价值知识交付智能体”。它持有 agent-building domain semantics，包括用户意图理解、公开经验调研、阶段拆解、agent skeleton / contract / prompt / skill / quality gate 生成策略、Agent Lab suite 组织、baseline 验收、optimizer candidate 组织、在线学习审阅策略和 mechanism patch proposal 记录。

它不是 OPL Framework 内置模块，也不实现第二套 generic runtime。

## 主要优势

- 把新智能体开发拆成可审计阶段：目标理解、经验调研、stage plan、agent skeleton、eval suite、baseline run、delivery、online learning。
- 复用 OPL scaffold 与 Agent Lab，不在本仓重造 runtime。
- 对既有 OPL-compatible agent 可以接管测试编排，生成 external suite、takeover receipt、gated self-evolution candidate。
- 从 observed run 产出 mechanism patch proposal，把 `observe -> diagnose -> edit` 明确记录为 proposal-only surface。
- target agent 的 truth、memory、artifact、quality verdict 与默认 promotion authority 仍归 target domain owner。

## 边界

`opl-meta-agent` 不拥有 generic scheduler、daemon、queue、attempt ledger、transition runner、memory transport、artifact lifecycle shell、operator workbench、observability backend、模型训练或权重部署。

对 target agent，它只能观察 Agent Lab segment run、诊断 evidence delta、提出对可编辑 mechanism surface 的补丁建议。该建议仍需要显式 gate；本仓不能写 target-domain truth、memory body、artifact body、quality/export verdict，也不能无 gate promote default agent。

## 常用命令

```bash
npm test
```

自举 sample agent，并产出 baseline receipt、online-learning candidate 与 mechanism patch proposal：

```bash
npm run bootstrap:sample -- --output-dir /tmp/opl-meta-agent-demo --opl-bin /Users/gaofeng/workspace/one-person-lab/bin/opl
```

接管既有 OPL-compatible agent 的测试，并产出 takeover receipt、gated self-evolution candidate 与 mechanism patch proposal：

```bash
npm run takeover:test -- --agent-dir /tmp/opl-meta-agent-demo/sample-brief-agent --output-dir /tmp/opl-meta-agent-takeover --opl-bin /Users/gaofeng/workspace/one-person-lab/bin/opl
```

## Mechanism Patch Proposal

当前 self-learning / takeover loop 会同时写出 `mechanism-patch-proposal.json` surface。字段包括：

- `mechanism_ref` / `version`
- `editable_surfaces`
- `observe.segment_run_ref`
- `diagnose.evidence_delta_ref`
- `edit.next_mechanism_candidate_ref`
- 顶层 `segment_run_ref`、`evidence_delta_ref`、`next_mechanism_candidate_ref`
- proposal-only authority flags

这些字段只记录“可进入 gate 的机制补丁建议”，不代表已经修改 target truth、memory、artifact、quality verdict 或默认 agent。

## 文档入口

- [Project](./docs/project.md)
- [Status](./docs/status.md)
- [Architecture](./docs/architecture.md)
- [Invariants](./docs/invariants.md)
- [Decisions](./docs/decisions.md)
- [Contracts](./contracts/)
