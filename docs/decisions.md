# opl-meta-agent 决策

Owner: `opl-meta-agent`
Purpose: `active_decision_record`
State: `active_truth`
Machine boundary: 本文是人读有效决策记录。机器真相继续归 `contracts/`、`agent/`、`runtime/authority_functions/`、source、CLI/API 行为、OPL Agent Lab result refs、work-order receipts、target owner receipts / typed blockers 和 tests。历史增量、proof snapshot、dated closeout 和退役 surface provenance 只从 `docs/history/process/` 或 git history 追溯。

## 读法

本文只保留仍会影响后续维护判断的 durable decisions。当前完成口径、gap 和下一轮 prompt 归 [`docs/active/opl-meta-agent-ideal-state-gap-plan.md`](./active/opl-meta-agent-ideal-state-gap-plan.md)；私有实现、script hygiene、default-caller tail 和退役门归 [`docs/active/opl-private-implementation-migration-inventory.md`](./active/opl-private-implementation-migration-inventory.md)；owner split 和机制细节归 [`docs/architecture.md`](./architecture.md)；硬约束归 [`docs/invariants.md`](./invariants.md)。

## 当前有效决策

### OMA 接入 OPL Family Foundry Agent OS target pattern

- 决策：OMA 采用 family-level `OPL Agent OS + Declarative Agent-Building Pack + Agent-Building Authority Kernel + Improvement Capability Registry` 目标形态，target delta 维护在 [`docs/active/foundry-agent-os-target-delta.md`](./active/foundry-agent-os-target-delta.md)。
- 决策：`contracts/foundry-agent-os-domain-kernel-manifest.json` 是 W4 domain-kernel manifest 的机器合同入口，固定 OMA retained authority kernel、OPL upcollect surfaces、`current_owner_delta` 默认读根、domain signer surfaces、target-agent forbidden authority 和 false-authority flags。
- 理由：MAS/MAG/RCA/OMA 应共享同一 Agent OS pattern，避免 OMA 复制 Agent Lab、work-order runner、generated interface、promotion shell、App/workbench 或 capability registry；agent-building semantics、candidate package、developer work order、mechanism proposal 和 route-back evidence 仍由 OMA kernel 持有。
- 影响：默认读根必须是 `current_owner_delta`；Capability Registry 只能是 Atlas/Pack/Stagecraft 的 catalog / ABI / use-policy，不是 Agent Lab runner、promotion gate 或 target owner authority；OPL/Agent Lab/Vault/Console/Runway/Pack 不能写 target truth、artifact body、memory body、quality/export verdict、owner receipt body 或 default promotion authority。该决策与 manifest 不声明 target-agent ready、App live ready、human approval、default promotion 或 production-ready。

### OMA 是独立 Foundry Agent，不是 OPL Framework 内置模块

- 决策：`opl-meta-agent` 采用 OPL standard domain-agent scaffold，长期形态是 `Declarative Agent-Building Pack + OPL generated/hosted surfaces + minimal agent-building authority functions`。
- 理由：Agent-building semantics、candidate package、developer work order、mechanism proposal 和 typed blocker 是 OMA 的 domain value；generic runtime、Agent Lab、registry、generated interfaces、queue、attempt ledger、App/workbench 和 promotion gate 属于 OPL Framework / App。
- 影响：本仓不实现 repo-local generic CLI/MCP/Skill/product-entry wrapper、sidecar/status/workbench shell、scheduler、queue、attempt ledger、registry/App shell、Agent Lab runner、promotion engine 或 target worktree lifecycle。

### `agent/` 是 repo-tracked declarative pack root

- 决策：`agent/` 下的 prompts、stages、skills、quality gates 和 knowledge files 是机器可验证 pack source；README 与文档章节只做人读索引。
- 理由：标准 OPL Agent 需要 contracts/tests 能解析真实 pack path，避免把 prose heading、目录存在性或 README 当成 semantic pack truth。
- 影响：`contracts/pack_compiler_input.json`、`contracts/stage_control_plane.json` 和 pack tests 必须指向非 README 的真实文件；新增 stage/action/quality gate 先进入 pack/contracts，再同步人读说明。

### OPL 持有 generated surfaces，OMA 只提供 refs-only inputs

- 决策：CLI、MCP、Skill、product-entry、OpenAI tool 与 AI SDK descriptors 由 OPL Framework 从 action/stage contracts 生成或托管；OMA 可以暴露 declared minimal authority actions，但不拥有 generated surface。
- 理由：generated interface 是 family-level projection/invocation surface，不能变成 domain repo 的第二 runtime 或第二 truth owner。
- 影响：generated interface readiness、registry/App projection readiness、suite pass、schema completeness、contract completeness 或 source-shape conformance 不能声明 target-domain ready、quality/export verdict、App live rendering、human approval、owner receipt body 或 default promotion。

### OMA 和 Agent Lab 是标准 target-agent consumers

- 决策：OMA 消费标准 target-agent handoff、production/live acceptance、owner route、editable surface policy、verification refs、no-forbidden-write proof 和 owner receipt / typed blocker refs；不得为 MAS/MAG/RCA 或任何单一 target agent 增加 OMA 专用 command family、suite kind 或 compatibility layer。
- 理由：标准 OPL Agent 应兼容统一 consumer boundary；target domain 名称只应作为 refs、owner routes、fixtures、receipts 或 provenance 出现。
- 影响：target-agent patch loop 只能输出 target-agent generic developer work order、capability candidate、mechanism proposal 或 typed blocker；target truth、memory body、artifact body、quality/export verdict 和 default promotion authority 保留给 target owner。

### Developer work order 是受限 patch loop，不是目标 owner

- 决策：OMA 可以把 blocked Agent Lab evidence 转成 developer patch work order，但 work order 必须包含 executor-first aperture、independent reviewer provenance、AHE failure/root-cause/fix/impact refs、patch traceability、target verification、runtime/read-model consumption、workspace environment proof、no-forbidden-write proof、rollback/canary/version refs、owner route refs、target owner receipt or typed blocker return shape 和 machine closeout refs。
- 理由：source patch 必须可审计、可验证、可回滚，并且不能把质量判断或 owner acceptance 转交给 OMA 或 foreground developer。
- 影响：缺少 direct reviewer evidence、source refs、patch traceability、target verification、owner route、no-forbidden-write proof、closeout refs 或 target owner receipt / typed blocker 时，只能返回 typed blocker。target domain truth、memory body、artifact body、quality/export verdict、owner receipt body 和 default promotion 仍不可写。

### 外部 work-order execution 与 post-absorb closeout 委托给 OPL

- 决策：`execute:external-work-order` 只是 OMA 对 OPL `work-order execute` primitive 的 shape validation / thin delegation entry。post-absorb target owner closeout hook 若存在，也由 OPL 调用，OMA 只记录 delegation proof。
- 理由：worktree lifecycle、runner、absorb、cleanup、owner closeout hook invocation、execution receipt 和 Agent Lab re-evaluation 是 OPL / target owner 控制面。
- 影响：OMA 必须保持 `owner_closeout_hook_delegated=true`、`target_owner_closeout_owner=target-domain via OPL`、`oma_can_write_owner_receipt=false` 的边界；不得实现 generic runner、queue、attempt ledger、absorb/cleanup loop 或 owner receipt writer。

### `build-agent-baseline` 的默认输入 authority 是 Codex stage-decomposition typed closeout

- 决策：baseline materialization 必须来自 live Codex `stage-decomposition` attempt 或显式 typed closeout packet；旧 direct script-authored graph 没有 compatibility path。`fixture` runner 只能消费显式 proof/test typed closeout，用于 deterministic validation。
- 理由：OMA 的核心价值在 AI-first stage decomposition 和 owner-gated pack generation，固定脚本图会把 domain reasoning 退化为 fallback materializer。
- 影响：free-text closeout、partial refs、缺 independent gate policy、缺 quality gate declaration、缺 no-forbidden-write policy 或 self-review 都 fail closed；不得恢复 no-`--domain-id` implicit fixture smoke、direct graph compatibility 或 fallback materialization route。

### Stage-native artifact、State Index 和 StageRun 只按 refs-only adoption 读取

- 决策：OMA 可以在 stage contracts、generated target packs、Agent Lab suites、developer work orders 和 typed blockers 中 materialize stage-native artifact refs、state-index refs、StageRun canary refs、operator summary 和 conformance refs；真实 physical stage folder lifecycle、SQLite sidecar index、runtime state、queue、attempt ledger、workbench consumption 和 promotion gate 归 OPL/App。
- 理由：OMA 需要生成可被 OPL 消费的 contract/ref templates，但不能创建 runtime state、owner promotion state、target owner receipt body 或 workbench state。
- 影响：controlled canary、operator summary、legacy residue guard 或 conformance pass 只证明 repo-local shape 可消费；不能升级为 live domain progress、target-agent readiness、production readiness、quality/export verdict、App live rendering、human approval 或 default promotion。

### Stage executor policy 是 candidate，不是 executor switch

- 决策：Codex CLI 是 OMA stage 的 first-class default executor。OMA 只能提出 `stage_executor_policy_candidate`；非默认 executor 需要 adapter / binding / receipt refs，缺失时 fail closed。
- 理由：executor binding、trial、policy read model、gate、receipt 和 default promotion 是 OPL / Agent Lab 职责。
- 影响：不得把 non-default executor candidate、suite pass 或 candidate completeness 写成 executor switch、runner implementation、quality equivalence 或 default-executor promotion。

### Progress-First accounting 使用 OPL family canonical fields

- 决策：developer work orders 必须使用 `progress_delta_classification`、`deliverable_progress_delta`、`platform_repair_delta` 和 `target_progress_accounting_ref`；退役 OMA-specific aliases 不再被 emitted 或 accepted。
- 理由：target-agent deliverable progress、platform/interface repair、typed blocker、human gate 和 stop-loss 必须能被 OPL family read model 统一理解。
- 影响：platform repair、cleanup、absorption、Agent Lab re-evaluation、currentness repair 和 refs-only ledger 不能计为 target-agent substantive deliverable progress；typed blocker 必须带 lineage、repeat budget、next allowed action、next forced delta 和 escalation/dead-letter refs。

### Clean-room pattern intake 只吸收 agent-building 模式

- 决策：`skillnerds/xskill` 等外部经验只作为 clean-room pattern source，用于 trajectory atomization、candidate buffer、per-skill version/canary refs 和 team redaction/sync refs。
- 理由：OMA 可以学习 agent-building organization，但不能引入 alternate runtime、installer、server 或 execution plane。
- 影响：不得导入 xskill daemon/runtime、generic scheduler、skill installer、team server、storage authority 或 generated interface owner；xskill-derived 内容只能进入 refs-only proposal、developer work order、typed blocker、reviewer evidence 或 declarative policy。

## Superseded 决策入口

以下旧口径只作为 history/provenance 读，不再承担 current owner：

- 旧 direct script-authored graph、no-`--domain-id` implicit fixture smoke、`takeover:test --fixture` parser branch 和 direct graph compatibility path。
- 旧 active machine fields `external_agent_allowed`、`external_opl_compatible_agents_allowed`、external-agent takeover identifiers 和 OMA-specific Progress-First aliases。
- Repo-local plugin / Skill wrapper、sidecar/status/workbench shell、registry owner、Agent Lab runner、promotion gate、generic worktree lifecycle 和 compatibility facade。
- 逐条 proof/coverage/closeout 决策流水。当前结论折回本文、active plan、private inventory、contracts、source/tests；过程只保留在 `docs/history/process/`。
