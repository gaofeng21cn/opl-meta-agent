# opl-meta-agent 状态

当前状态：已创建独立 OPL-compatible Foundry Agent repo，命名为 `opl-meta-agent`，并通过 OPL standard domain-agent scaffold validation、self-learning loop smoke 与 mechanism patch proposal smoke。

已落地：

- 标准目录：`agent/`、`contracts/`、`runtime/`、`docs/`。
- 合同：descriptor、stage control plane、action catalog、memory descriptor、artifact locator、owner receipt、functional privatization audit。
- OPL generated interface 合同：pack compiler input、generated surface handoff、private functional surface policy。
- 九阶段 meta-agent plan：intent intake、web research、stage decomposition、agent skeleton build、eval suite build、baseline run、optimizer iteration、baseline delivery、online learning。
- 最小 repo-local test：`npm test`。
- 自举闭环脚本：`npm run bootstrap:sample -- --output-dir <dir> --opl-bin <opl>`。
- 外部 agent 测试接管脚本：`npm run takeover:test -- --agent-dir <existing-agent-dir> --output-dir <dir> --opl-bin <opl>`。
- 外部 Agent Lab suite 自进化入口：`npm run improve:external-suite -- --suite <suite.json> --target-agent-dir <agent-dir> --output-dir <dir> --opl-bin <opl>`；用于把目标 domain 的 blocked suite 转为 developer patch work order、机制补丁、online-learning candidate 和目标 agent capability improvement candidate。`opl-meta-agent` 可以据此作为开发者修改目标 agent 的源码、测试和文档，但不能写目标 domain truth、quality verdict、memory body 或 artifact body。
- OPL 统一接口投影：`opl agents interfaces --repo-dir <this-repo> --json` 可从本仓 contracts 生成 CLI、MCP、Skill、product-entry、OpenAI tool 和 AI SDK 描述；本仓不持有私有通用入口包装层。
- Self-learning loop smoke：生成 `sample-brief-agent`，补齐最小 action/stage domain pack，调用 OPL scaffold validate，调用 `opl agents interfaces --repo-dir <sample-agent>` 生成统一接口包，写入 Agent Lab external suite，通过 `opl agent-lab run --suite` 得到 `passed`，再产出 baseline delivery receipt、gated online-learning candidate 与 `mechanism-patch-proposal.json`。
- Testing takeover smoke：读取既有 OPL-compatible agent descriptor/contracts，生成 `agent_lab_external_suite`，调用 OPL Agent Lab，通过后产出 `testing_takeover_self_evolution_receipt`、gated self-evolution online-learning candidate 与 `takeover-mechanism-patch-proposal.json`；不写 target memory body，不接管 target domain truth / quality / artifact authority，不无 gate promote default agent。
- External-suite self-evolution smoke：读取目标 domain 已生成的 Agent Lab suite，调用 OPL Agent Lab，若 suite blocked 则产出 `meta-agent-improvement-receipt.json`、`online-learning-candidate.json`、`mechanism-patch-proposal.json`、`mas-capability-improvement-candidate.json` 与 `developer-patch-work-order.json`；该 work order 管理目标 agent 源码补丁、测试、文档、吸收回主线和临时 worktree 清理要求，同时保持 domain truth / quality / artifact authority 不越权。
- Developer work-order traceability：blocked suite 的 rubric gap 会被映射为 `patch_traceability_matrix`，包含 source failure refs、required patch refs、editable surfaces、目标仓文件提示、测试/receipt/禁止写入证明、runtime/read-model consumption verification 和版本 closeout 要求，避免 self-evolution 退化成泛泛 proposal 或前台开发者自由发挥。
- Mechanism patch proposal：记录 `mechanism_ref/version`、`editable_surfaces`、`observe/diagnose/edit`、`segment_run_ref`、`evidence_delta_ref`、`next_mechanism_candidate_ref` 和 proposal-only authority boundary。

未完成：

- OPL domain manifest registration。
- App/workbench projection。
- 真实线上目标领域 agent package delivery。
