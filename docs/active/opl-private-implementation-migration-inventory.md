# opl-meta-agent 私有实现与 OPL 迁移台账

Owner: `opl-meta-agent`
Purpose: `opl_private_implementation_migration_inventory`
State: `active_inventory`
Machine boundary: 本文是 human-readable 迁移治理台账。机器真相继续归 `contracts/`、`runtime/authority_functions/`、scripts 行为、Agent Lab result refs、developer work order refs、candidate refs、owner receipts 和目标 agent owner receipts。
Date: `2026-05-21`

## 当前 clean truth

`opl-meta-agent` 是 OPL-compatible Foundry Agent / builder agent，不是 OPL Framework 内置模块。OPL Framework 持有 standard scaffold、Agent Lab、generated interface bundle、runtime、queue、attempt ledger、provider receipt、observability、registry、App workbench 和 promotion gate。`opl-meta-agent` 只保留 agent-building semantic pack、refs-only action outputs、candidate package / developer work-order / mechanism proposal materialization 和 minimal authority functions。

本轮 scan 发现大型风险面集中在 `scripts/agent-evidence-takeover.ts`、`scripts/improve-from-agent-lab-suite.ts`、`scripts/bootstrap-sample-agent.ts` 和 `scripts/lib/meta-agent-loop.ts`。这些脚本当前可用，但容易继续吸收 policy 并变成私有 runner / promotion engine / workbench。台账口径是：脚本只能作为 authority implementation、smoke helper、fixture/proof helper 或 developer work-order materializer；可声明的策略继续迁回 `agent/`、`contracts/` 或 `runtime/authority_functions/`。

2026-05-21 本轮最小清理已把 `agent:evidence` 与 `improve:external-suite` 共享的 target patch-loop machine refs、runtime/read-model consumption proof、target workspace environment proof、no-patch/source-patch closeout evidence 和默认 forbidden target surfaces 集中到 `scripts/lib/work-order-policy.ts`。随后 `codex/oma-agent-lab-workorder-thinning` 继续把两个脚本内重复的 work-order readiness / executor aperture / target verification / owner route / no-forbidden-write completeness 组装收进同一 helper，并在 work order / typed blocker 中只输出 `required_opl_agent_lab_primitive_refs`。本轮又把 developer patch work-order shape validator 从 `improve:external-suite` 的脚本体迁入同一 helper，并让 `agent:evidence` 复用；缺 reviewer 的 typed-blocker 路径通过 `allowMissingReviewerFields` fail-closed 选项表达。继续推进时，`agent:evidence` 内的 generic refs intake helper、production evidence ref extraction、owner-route normalization、no-forbidden-write proof refs 和 return-shape refs 也已迁入 `work-order-policy.ts`；`agent:evidence` 保留专有 forbidden target surfaces 作为参数传入，避免收薄时放宽 authority boundary。本轮 `codex/oma-workorder-policy-thinning` 又把 external-suite improvement 的 target improvement policy、change-ref mapping、patch traceability matrix、editable surface inference 和 target file-hint lookup 从 `scripts/improve-from-agent-lab-suite.ts` 抽到 `scripts/lib/target-improvement-policy.ts`，使入口脚本降为 external suite consumption 与 candidate/work-order/proposal materializer。随后 `codex/oma-agent-evidence-materializer-thinning` 把 `agent:evidence` 内的 owner receipt refs、target capability candidate、developer work order、mechanism proposal 和 typed blocker 输出组装迁入 `scripts/lib/agent-evidence-materializer.ts`；`scripts/agent-evidence-takeover.ts` 降为 512 行入口，继续只负责 target contract intake、suite 生成、OPL Agent Lab 调用和 artifact 落盘。`scripts/agent-evidence-takeover.ts` 和 `scripts/improve-from-agent-lab-suite.ts` 因此更接近纯 materializer，通用 work-order readiness / validation primitive 继续指向 OPL Agent Lab owner。OMA 只消费 refs 并 materialize target-agent evidence intake 后的 work-order / proposal / blocker。OPL replacement 或 live promotion gate 仍未在本仓声明完成。

同轮 family-retire-legacy-oma 清理已删除无 active caller 的 repo-local Codex plugin/Skill wrapper：`plugins/opl-meta-agent/**`、`scripts/install-codex-plugin.ts`、`tests/codex-plugin.test.ts`；同时删除仅承载占位 README 的 `runtime/sidecar/`、`runtime/projection_builders/`、`runtime/lifecycle_adapters/`。当前 `runtime/` 只允许 `authority_functions/`，OPL generated Skill/product-entry、sidecar/projection dispatch、status read model 和 workbench shell 继续由 OPL Framework 生成或托管。

## Classification

| class | 含义 |
| --- | --- |
| `domain_authority_retained` | agent-building 语义、candidate/work-order/proposal materialization refs；不能写目标 domain truth。 |
| `opl_framework_migration_candidate` | 当前脚本内承担的 registry/App/Agent Lab/promotion/runtime/queue/attempt shell 语义，长期归 OPL。 |
| `already_thin_adapter` | smoke/proof/helper/materializer，仍有 repo-local script caller，但已声明 no generic owner。 |
| `needs_split_before_migration` | 脚本混合 target handoff parsing、policy、work-order generation、Agent Lab invocation 或 proposal assembly，需要先抽出共享 policy / authority helper。 |

## Inventory

| surface | lines | class | current active caller | 当前实际职责 | 为什么属于该分类 | OMA 必须保留的 authority | 可迁往 OPL 的 generic 子域 | 迁移/退役门槛 | 推荐验证入口 |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| `scripts/agent-evidence-takeover.ts` | 512 | `already_thin_adapter` with split pressure | `npm run agent:evidence`、`tests/agent-evidence-takeover.test.ts` | 读取目标 agent production acceptance / handoff，生成 Agent Lab suite，调用 OPL Agent Lab，落盘 developer work order、capability candidate、mechanism proposal 或 typed blocker artifacts | owner receipt refs、capability candidate、developer work order、mechanism proposal 和 typed blocker 输出组装已迁入 `scripts/lib/agent-evidence-materializer.ts`；入口脚本仍调用 OPL Agent Lab 和写 artifact，因此继续保持 split-pressure 观察，不能扩成 generic evidence runner / promotion gate | target-agent production evidence intake 后的 work-order/proposal/blocker refs | Agent Lab suite runner、attempt ledger、promotion gate、work-order readiness primitive、target-owner return primitive、App workbench/registry consumption | stable proposal / blocker vocabulary 继续迁入 pack/contract 或 OPL Agent Lab primitive；script 保持 thin materializer；不得写 target truth / quality / artifact / memory / owner receipt | `npm test`、`npm run typecheck` |
| `scripts/improve-from-agent-lab-suite.ts` | 667 | `already_thin_adapter` with split pressure | `npm run improve:external-suite`、external-suite tests | external suite -> developer patch work order / candidate / proposal materializer | target improvement policy、change-ref mapping、patch traceability matrix、editable surface inference 和 target file hints 已迁入 `scripts/lib/target-improvement-policy.ts`；入口脚本仍调用 OPL Agent Lab 并组装 proposal/receipt，因此继续保持 split-pressure 观察 | developer patch work-order/proposal/blocker materialization refs | Agent Lab runner、promotion gate、target runtime/App read model shell、generic work-order readiness primitive | stable policy text 继续迁入 pack/contract；保持 independent reviewer fail-closed；no domain-specific command family | `npm test`、`npm run typecheck` |
| `scripts/bootstrap-sample-agent.ts` | 746 | `already_thin_adapter` | `npm run bootstrap:sample`、bootstrap loop tests | sample agent / real-target smoke helper、baseline receipt、scaleout ledger | 是 smoke/proof helper，不应变成 product runtime 或 scaffold owner | candidate package refs、baseline receipt refs、scaleout evidence refs | standard scaffold/generator, Agent Lab runner | policy stable 后迁入 `agent/` / `contracts`; script remains smoke target | bootstrap loop tests |
| `scripts/lib/meta-agent-loop.ts` | 729 | `already_thin_adapter` with split pressure | imported by bootstrap/sample and evidence scripts | shared fixture generation, Agent Lab suite helpers, receipt/proposal builders | shared helper 可保留，但不应成为 OPL runtime / Agent Lab implementation | package/work-order/proposal materializer helpers | Agent Lab execution, runtime/queue/attempt ledger | split policy constants from helper; no generic runner ownership | `npm test`、`npm run typecheck` |
| `scripts/lib/work-order-policy.ts` | 566 | `already_thin_adapter` | imported by `agent:evidence` and `improve:external-suite` | 共享 target patch-loop closeout refs、runtime/read-model proof、workspace proof、forbidden target surface defaults、refs-only work-order completeness builder、developer patch work-order validator、generic refs intake / owner-route normalization / evidence refs extraction 和 OPL Agent Lab owned primitive refs builder | 是 repo-local developer work-order materializer helper，不运行 suite、不签 promotion、不持有 target truth；primitive refs 只指向 OPL Agent Lab owner；validator 只做 shape fail-closed，不授权 patch 或 promotion | work-order policy constants、refs-only proof builders、target-agent evidence materializer helpers、shape validation | OPL Agent Lab/App/registry runtime consumption receipts、generic readiness primitive implementation 和 promotion gate | 保持 pure helper；稳定合同文本继续迁入 `agent/`、`contracts/` 或 authority refs | `npm test`、`npm run typecheck` |
| `scripts/lib/agent-evidence-materializer.ts` | 588 | `already_thin_adapter` | imported by `agent:evidence` | owner receipt refs、target capability candidate、developer patch work order、mechanism proposal 和 typed blocker refs-only 输出组装 | 是从 `agent-evidence-takeover.ts` 拆出的 materializer helper；不运行 Agent Lab、不签 target owner receipt、不持有 target truth/verdict/artifact/memory body；仅把 target evidence intake 转为 refs-only work-order/proposal/blocker shape | target-agent evidence intake 后的 work-order/proposal/blocker materialization refs | OPL Agent Lab target work-order readiness primitive、target-owner return primitive、promotion gate 与 App/workbench read model | stable vocabulary 进入 `agent/`、`contracts/` 或 OPL Agent Lab primitive；helper 不扩成 runner / queue / gate | `npm test`、`npm run typecheck` |
| `scripts/lib/target-improvement-policy.ts` | 363 | `already_thin_adapter` | imported by `improve:external-suite` | 从 target handoff / production acceptance 读取 change-ref policy，生成 proposed change refs、patch traceability matrix、editable surface refs 和 target file hints | 是 refs-only target improvement policy helper，不运行 suite、不签 owner receipt、不持有 target verdict；从入口脚本抽出后降低私有 promotion/workbench 聚合风险 | target-agent improvement candidate 的 refs-only mapping / traceability materializer | OPL Agent Lab target work-order policy primitive、patch traceability read model、promotion gate | stable vocabulary 进入 `contracts/` 或 OPL Agent Lab primitive；helper 不扩成 runner / queue / gate | `npm test`、`npm run typecheck` |
| `contracts/app_workbench_projection.json` | n/a | `already_thin_adapter` | contracts tests, OPL App consumption refs | refs/status/receipt/blocker projection contract | 已声明 App/workbench owner is OPL; OMA only supplies refs | OMA work-order/candidate refs | App/workbench display shell | keep refs-only; live App screenshot/evidence from OPL/App side | `tests/contracts.test.ts` |
| `contracts/opl_domain_manifest_registration.json` | n/a | `already_thin_adapter` | contracts tests, OPL registry/discovery refs | registry discovery metadata | registry owner is OPL; OMA supplies registration refs only | domain descriptor/handoff refs | registry/discovery owner | OPL registry receipt required before live claim | `tests/contracts.test.ts` |
| `runtime/authority_functions/meta-agent-authority-functions.json` | n/a | `domain_authority_retained` | contracts tests, authority function refs | explicit authority refs for package builder and proposal authorizer | minimal refs-only authority functions belong OMA, but cannot own runtime | candidate package builder, proposal authorizer refs | none except OPL invocation shell | keep no generic owner flags; scripts must match implementation refs | `tests/contracts.test.ts` |

## Retired Legacy Surfaces

| retired surface | 退役证据 | 替代 owner / surface | 验证入口 |
| --- | --- | --- | --- |
| `plugins/opl-meta-agent/**` | 只由 repo-local installer 和 dedicated plugin test 保活；不在 action/stage contracts、package scripts 或 generated interface test 中作为 active caller | OPL Framework 从 `contracts/action_catalog.json` 与 `contracts/stage_control_plane.json` 生成 Skill/product-entry/tool descriptors | `tests/contracts.test.ts` 的 generated interface 与 no local wrapper 断言 |
| `scripts/install-codex-plugin.ts` | 仅写本仓 `.agents/plugins/marketplace.json`，属于 repo-owned local plugin wrapper materializer；已无 allowed active caller | OPL registry / generated surface handoff | `runtime/authority_functions` script morphology 断言 |
| `tests/codex-plugin.test.ts` | 只测试上述 repo-local wrapper 安装路径，属于兼容测试 | `tests/contracts.test.ts` 验证 OPL generated interfaces 和 manifest registration refs | `npm test` |
| `runtime/sidecar/`, `runtime/projection_builders/`, `runtime/lifecycle_adapters/` | 仅包含占位 README，无 active caller 或 authority function refs | `contracts/generated_surface_handoff.json`、`contracts/app_workbench_projection.json` 与 OPL-hosted runtime surfaces | runtime source shape 断言 |

## Bad-smell flags

- Large script-level policy: `agent-evidence-takeover.ts` 已把 proposal/blocker/work-order 输出组装收薄到 `scripts/lib/agent-evidence-materializer.ts`，入口仍承载 production evidence intake、suite generation、OPL Agent Lab invocation 和 artifact 落盘；`improve-from-agent-lab-suite.ts` 已把 target improvement mapping / patch traceability / editable surface inference 收薄到 helper。后续仍需防止 materializer helper 回长成私有 promotion/workbench。work-order closeout / runtime consumption / workspace proof / readiness completeness / generic refs intake repetition 已收薄到 helper。
- Agent Lab runner leakage: scripts may call OPL Agent Lab but cannot become Agent Lab implementation.
- Promotion shortcut risk: mechanism patch proposal and suite pass remain proposal-only / gated.
- Domain-specific command risk: OMA must not add MAS/MAG/RCA-specific command families; targets provide standard handoff.
- Same executor self-review risk: independent Codex reviewer requires separate invocation/context/task/receipt.
- Tests must not treat suite pass, generated surface proof or contract completeness as default promotion or target domain ready.

## Immediate thinning items

1. `scripts/lib/work-order-policy.ts` 已落地为 pure developer work-order materializer helper，承载 target patch-loop closeout refs、readiness completeness、generic refs intake、developer patch work-order validator 和 OPL Agent Lab owned primitive refs 的共享 helper。
2. `scripts/lib/target-improvement-policy.ts` 已落地为 `improve:external-suite` 的 refs-only target improvement policy helper，入口脚本不再私有承载 change-ref mapping / patch traceability / editable surface inference。
3. `scripts/lib/agent-evidence-materializer.ts` 已落地为 `agent:evidence` 的 refs-only output materializer helper，入口脚本不再私有承载 owner receipt refs、candidate、developer work order、mechanism proposal 或 typed blocker assembly。
4. Keep the scripts as materializers that consume helper policy and target refs.
5. Continue migrating stable AI reviewer gate / capability mapping / proposal policy into `agent/prompts/`, `agent/stages/`, `agent/quality_gates/`, `contracts/` or `runtime/authority_functions/`.
6. Do not add repo-local scheduler, queue, attempt ledger, status/workbench shell, registry owner, Agent Lab runner or promotion gate.

## OPL primitive dependencies

- Agent Lab suite runner and evolution/promotion gate;
- generated interface bundle and standard scaffold generator;
- registry/discovery and App/workbench drilldown live consumption;
- stage attempt ledger, queue, provider receipt and observability;
- target-agent generic handoff vocabulary across MAS/MAG/RCA.

## Forbidden claims

- `opl-meta-agent` work order does not sign target owner receipt.
- suite pass, schema completeness, generated surface readiness or mechanism proposal cannot promote default agent.
- OMA cannot write target domain truth, memory body, artifact body, quality/export verdict or owner receipt authority.
- registration/App projection readiness is not live App rendering evidence.
