# opl-meta-agent 状态

当前状态：已创建独立 OPL-compatible Foundry Agent repo，命名为 `opl-meta-agent`，并通过 OPL standard domain-agent scaffold validation、self-learning loop smoke 与 mechanism patch proposal smoke。

已落地：

- 标准目录：`agent/`、`contracts/`、`runtime/`、`docs/`。
- 可验证 domain pack：`agent/knowledge/`、`agent/prompts/`、`agent/quality_gates/`、`agent/skills/`、`agent/stages/` 下的分项语义文件均为当前合同列出的真实 pack 文件；README 只作为人读入口，不作为 `required_domain_pack_paths`。测试会检查这些 required files 存在、非空、无占位。
- 合同：descriptor、stage control plane、action catalog、memory descriptor、artifact locator、owner receipt、functional privatization audit。
- OPL generated interface 合同：pack compiler input、generated surface handoff、private functional surface policy。
- OPL domain manifest registration 合同：`contracts/opl_domain_manifest_registration.json` 把 domain descriptor、stage/action contracts、pack compiler input、generated surface handoff、authority function refs、App workbench projection 和 scaleout evidence contract 汇成 refs-only registration surface；OPL domain registry / discovery / generated interface bundle 是消费方，本仓不持有 registry owner 或 generated surface owner。
- App/workbench projection 合同：`contracts/app_workbench_projection.json` 只投影 target brief、candidate package、Agent Lab result、developer work order、mechanism patch proposal、scaleout evidence 的 refs/status/receipt/blocker；OPL App/workbench 持有展示 shell，本仓不能写 App runtime state、target truth、memory body、artifact body、quality/export verdict 或默认 promotion。
- Real target agent scaleout evidence 合同：`contracts/real_target_agent_scaleout_evidence.json` 定义真实目标 agent delivery、blocked suite -> developer work order、多目标 scaleout 的必需 refs 和 no-forbidden-write proofs；当前状态是 contract-ready，不把 sample smoke、testing takeover smoke 或 suite pass 写成真实线上交付完成。
- Production acceptance evidence：`contracts/production_acceptance/meta-agent-production-acceptance.json` 已把 `production_live_soak_not_claimed_by_conformance` / `domain_ready_not_claimed_by_conformance` 收口为 external-agent takeover/improve loop 的 domain-owned acceptance receipt。它记录 structural/physical conformance 已通过、intake/test handoff/proposal materializer/review-audit receipt chain 已存在、promotion 仍受 gate 约束，并要求默认生成的新 agent 携带 morphology/conformance fixture。
- `stage_control_plane` 路径解析：当前每个 stage 的 prompt、skill、knowledge、evaluation refs 都指向 repo-tracked `agent/prompts/*.md`、`agent/skills/*.md`、`agent/knowledge/*.md`、`agent/quality_gates/*.md` 文件；测试会确认每个 locator 指向真实文件。
- 十阶段 meta-agent plan：intent intake、web experience research、stage decomposition、agent skeleton build、eval suite build、baseline run、external agent takeover、optimizer iteration、baseline delivery、online learning。
- 最小 repo-local test：`npm test`。
- 自举闭环脚本：`npm run bootstrap:sample -- --output-dir <dir> --opl-bin <opl> --ai-reviewer-evaluation <reviewer-eval.json>`；baseline delivery 缺少结构化 AI reviewer evaluation 时 fail closed，不签 baseline delivery receipt。
- 外部 agent 测试接管脚本：`npm run takeover:test -- --agent-dir <existing-agent-dir> --output-dir <dir> --opl-bin <opl>`。
- 外部 Agent Lab suite 自进化入口：`npm run improve:external-suite -- --suite <suite.json> --target-agent-dir <agent-dir> --output-dir <dir> --opl-bin <opl> --ai-reviewer-evaluation <reviewer-eval.json>`；用于把目标 domain 的 blocked suite 与同一结构化 AI reviewer evaluation 转为 developer patch work order、机制补丁、online-learning candidate 和目标 agent capability improvement candidate。`opl-meta-agent` 可以据此作为开发者修改目标 agent 的源码、测试和文档，但不能写目标 domain truth、quality verdict、memory body 或 artifact body。
- OPL 统一接口投影：`opl agents interfaces --repo-dir <this-repo> --json` 可从本仓 contracts 生成 CLI、MCP、Skill、product-entry、OpenAI tool 和 AI SDK 描述；本仓不持有私有通用入口包装层。
- 生成接口权限边界：`pack_compiler_input` 与 `generated_surface_handoff` 明确 domain pack 只供应领域 refs，OPL Framework 生成接口只负责 invoke/project，不写 domain truth、memory body、artifact body、quality/export verdict，也不能由本仓声明 generated surface ownership。
- Registration / App / evidence handoff：`generated_surface_handoff`、`action_catalog` 和 `functional_privatization_audit` 已引用 domain manifest registration、App workbench projection 与 real target agent scaleout evidence contract，作为后续 OPL registration、product projection 和 evidence review 的稳定消费面。
- Self-learning loop smoke：生成 `sample-brief-agent`，补齐最小 action/stage domain pack，调用 OPL scaffold validate，调用 `opl agents interfaces --repo-dir <sample-agent>` 生成统一接口包，写入 Agent Lab external suite，通过 `opl agent-lab run --suite` 得到 `passed`，再产出 baseline delivery receipt、gated online-learning candidate 与 `mechanism-patch-proposal.json`。
- Testing takeover smoke：读取既有 OPL-compatible agent descriptor/contracts，生成 `agent_lab_external_suite`，调用 OPL Agent Lab，通过后产出 `testing_takeover_self_evolution_receipt`、gated self-evolution online-learning candidate 与 `takeover-mechanism-patch-proposal.json`；不写 target memory body，不接管 target domain truth / quality / artifact authority，不无 gate promote default agent。
- External-suite self-evolution smoke：读取目标 domain 已生成的 Agent Lab suite，调用 OPL Agent Lab，若 suite blocked 则产出 `meta-agent-improvement-receipt.json`、`online-learning-candidate.json`、`mechanism-patch-proposal.json`、`mas-capability-improvement-candidate.json` 与 `developer-patch-work-order.json`；该 work order 管理目标 agent 源码补丁、测试、文档、吸收回主线和临时 worktree 清理要求，同时保持 domain truth / quality / artifact authority 不越权。
- Developer work-order traceability：blocked suite 的 rubric gap 会被映射为 `patch_traceability_matrix`，包含 source failure refs、required patch refs、editable surfaces、目标仓文件提示、测试/receipt/禁止写入证明、runtime/read-model consumption verification 和版本 closeout 要求，避免 self-evolution 退化成泛泛 proposal 或前台开发者自由发挥。
- AI reviewer evaluation consumption：baseline delivery 和 external-suite improvement 共用结构化 reviewer evaluation schema，要求 reviewer_kind、model_or_provider、run_ref、critique、suggestions、source_refs、verdict、provenance；空 critique/suggestions 或 source_refs 只有 suite/scaffold refs 时 fail closed。
- Reviewer suggestion traceability：external-suite improvement 会把 AI reviewer critique/suggestions/source refs 投影到 target capability improvement candidate 与 developer patch work order，`patch_traceability_matrix` 为可识别 reviewer suggestion 标注对应 required patch refs、editable surfaces 和 target repo file hints。
- Workspace environment consumption proof：当目标 agent 修复依赖 runtime extras、workspace lock/profile 或 owner-entry 环境迁移时，developer work order 会要求 `target_workspace_environment_verification`、dependency lock/profile migration proof、owner-entry redrive proof 和 repo hygiene proof，避免只在源码测试通过而真实 study runtime 没有消费到新能力。
- Mechanism patch proposal：记录 `mechanism_ref/version`、`editable_surfaces`、`observe/diagnose/edit`、`segment_run_ref`、`evidence_delta_ref`、`next_mechanism_candidate_ref` 和 proposal-only authority boundary。
- Physical source morphology：`agent/` 是 agent-building semantic pack，`contracts/` 是 registration / generated handoff / App projection / scaleout evidence 机器面，`runtime/authority_functions/` 是最小 authority refs，`scripts/` 只是 authority implementation refs、smoke helpers、fixture/proof helper 或 developer work-order materializer。本仓不持有 generic runtime、registry owner、App shell、Agent Lab execution、promotion gate 或 target domain truth。

未完成：

- OPL domain manifest registration 的 OPL registry 侧接入与实测 discovery receipt；本仓 machine contract 已落地。
- App/workbench projection 的 OPL App 侧实际渲染与 drilldown receipt；本仓 projection contract 已落地。
- 真实线上目标领域 agent package delivery；当前完成的是可直接运行的 Foundry Agent baseline build、testing takeover、external-suite improvement、proposal-only mechanism loop，以及 external-agent takeover/improve loop production acceptance evidence。该 evidence 关闭的是 conformance 后的本仓 acceptance tail，不授权默认 promotion。
