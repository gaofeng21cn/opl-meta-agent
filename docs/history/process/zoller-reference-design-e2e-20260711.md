# Zoller Reference-Design E2E (2026-07-11)

Owner: `opl-meta-agent`
Purpose: `historical_reference_design_e2e_evidence`
State: `historical_controlled_fixture_evidence`
Machine boundary: 本文记录一次可复核的 PDF-to-agent ABI evidence。机器行为仍以 OMA source/tests、OPL CLI/readback、target package artifacts 和 target owner receipt 为准；本文不是临床验证、target-domain truth、owner receipt、promotion 或 release authority。

## Scope

输入是用户提供的 Zoller 等 2026 年血液病 case-grounded AI 论文。目标是验证其可迁移的设计模式能被 OMA 转成肠癌手术风险决策支持 target Agent 的结构化 pack，而不迁入血液病知识、患者数据、模型权重、临床阈值、性能结论、runtime 或临床 authority。

本次只保留源指纹，不把 PDF、全文、患者数据或生成的 target package 纳入仓库：

| Evidence | SHA-256 / identity |
| --- | --- |
| Source PDF | `0cb414a420c3aaf11c02871c99fd068d6ab471b1ebdfc82f58995546235bc8a5` |
| OPL pattern packet | `cb26ce9fc3084615f8c8047b64f0e3c7ef50f1f16799569fdafc43ac259f9a42` |
| Pattern notes | `27e2a9e893057f72b6e6e10e2e0db069b2fb52e5846cba5f6ba3e7cd243dbc1b` |
| OMA producer source | `7a8f0968104d6a7dc2cfdaea35ff9903f9a7b532` |
| OMA package compatibility pin | `f0a543e1728f8c1d35b2c5f2e035a6551a521507` |
| OPL exact checkout used for E2E readback | `610aef704ccf92c5f373256c9f494e949a402abe` |
| OPL canonical SHA after final recheck | `c71c9357d1b5d4a602cb8716d4554f2b4fa870ff` |

`f0a543e...` 是 OMA `package.json` 与 lockfile 所持有的 shared-package compatibility pin；`610aef...` 只标识本次 CLI ABI E2E 所用 source checkout；`c71c935...` 是其后完成同一 target scaffold/interfaces/no-observation readback 的 OPL canonical SHA。三者职责不同，后两者都不能写成 OMA dependency pin、public install authority 或 target owner acceptance。

## Current ABI Repair

旧 StageRun payload 的 `foundry_agent_series.shared_release_pin_strategy` 落后于 OPL scaffold ABI，缺少：

```json
{
  "owner_managed_latest_stable_channel_required": true,
  "lockfile_resolved_commit_receipt_required": true,
  "consumer_exact_commit_equality_gate": false
}
```

修复后的 OMA producer 在 `scripts/lib/stage-decomposition-pack-draft/builder.ts` 生成完整节点；`scripts/build-agent-baseline.ts` 在 OPL scaffold validation 返回后、interfaces/work-order 前要求 `validation.status === "passed"`。任何 `blocked` 或 malformed response 都直接失败，不能返回 `candidate_package_materialized_ready_for_opl_foundry_lab_evaluation`，也不能写 suite seed/work order。回归覆盖在 `tests/bootstrap-loop.test.ts`、`tests/contracts-foundry-series.test.ts` 和 `tests/stage-decomposition-materializer.test.ts`。

## Controlled StageRun Evidence

为避免把旧 closeout 当成新 producer evidence，本轮使用隔离 `OPL_STATE_DIR` 重新创建并以 OPL `family-runtime attempt fixture-run` 关闭整条 route。它是 control-plane / ABI 证据，非已配置 Temporal 的生产执行。

| Stage | Attempt | Closeout |
| --- | --- | --- |
| `intent-intake` | `sat_6521255ad05e0cade21309e7` | `oma-zoller-current-abi-v6-intent-intake-closeout` |
| `stage-decomposition` | `sat_3e3bd09cdcea1d2ab7c5c71a` | `oma-zoller-current-abi-v6-stage-decomposition-closeout` |
| `agent-skeleton-build` | `sat_fe68248623073984396f34f1` | `oma-zoller-current-abi-v6-agent-skeleton-build-closeout` |
| `eval-suite-build` | `sat_a4413d6311406ed5813374d4` | `oma-zoller-current-abi-v6-eval-suite-build-closeout` |
| `baseline-run` | `sat_5975ccb5b245684be48baa0f` | `oma-zoller-current-abi-v6-baseline-run-closeout` |
| `baseline-delivery` | `sat_e5f8b318f68f0e22292c7f0e` | `oma-zoller-current-abi-v6-baseline-delivery-closeout` |

每个 attempt readback 都是 `completed + accepted_typed_closeout`，且后一个 envelope 精确消费前一个 `opl://stage_attempts/.../closeouts/...` ref。每个 OMA domain payload 使用 `domain_owned_stage_output_ref` v1、同 ref SHA-256 metadata，并放在 attempt workspace root 内。

重跑时应先由 OPL 按 route 创建 attempts，再由外部 executor 或控制性 fixture 写入 domain-owned closeout payload；OMA baseline 只消费 query readbacks，不启动自己的 stage runner：

```bash
opl family-runtime attempt create \
  --domain opl-meta-agent \
  --stage <route-stage> \
  --action build-agent-baseline \
  --provider temporal \
  --workspace-locator '{"workspace_root":"<workspace>"}' \
  --executor-kind codex_cli \
  --task <task-id>

opl family-runtime attempt fixture-run <attempt-id> \
  --closeout-packet-file <opl-abi-shaped-envelope.json>

opl family-runtime attempt query <attempt-id> --json
```

`stage-decomposition` payload 使用 `buildFixtureStageDecompositionCloseout`，`agent-skeleton-build` 使用 `buildFixtureAgentSkeletonBuildCloseout`，两者均来自 OMA source；真实执行时由对应 domain executor 产生同一 ABI shape，而不是由 baseline CLI 伪造。

## Materialization Readback

这条 paper-derived route 的 target identity 为 `domain-agent:colorectal-surgery-risk`，`profile_selection_mode=source_derived_design`。它保留：

`ReferenceDesignPacket -> TransferMap -> AgentPackPlan -> DesignAdmissionReceipt -> AgentBuildReceipt`

生成了 9 个 source-derived stages 和 1 个 target-only owner gate。target package 结果：

| Check | Readback |
| --- | --- |
| OPL scaffold | `validated`, `validation.status=passed`, blockers `[]` |
| Generated interfaces | `ready` |
| Package manifest validation | `valid` |
| Source-derived profile conformance | `passed` |
| Foundry work order | `oma_foundry_lab_work_order_4c1ed2e086ea`, `ready_for_opl_foundry_lab_evaluation` |

Artifact hashes for exact evidence bytes:

| Artifact | SHA-256 |
| --- | --- |
| Stage route evidence | `0850531b8e4ffa414f5e3a6d29c8d1da31caba62a1d4137df0577ac9fc08e1ca` |
| Candidate handoff | `6e9955007845582d7999ea29b33bdde4135339848433ad136aa9eca395144df4` |
| Scaffold validation | `af144964f2e3c62f5a63ed36f33614e5632c5f22814b289c9686e6c4a83ac4bb` |
| Generated interfaces | `a06429b39a09608239e9ffa78afc4d5bf4cc8da2dd4e225aeac620b3cb0c1227` |
| Stage manifest | `0ec0e1d654f4816c0f6f4c709f78b25e1f61416c9ca7d87ed5f117aa3379fa60` |
| AgentBuildReceipt | `3810d5a3f21a317874f7f1cfa2a614d2343b4a4645f083dd511ee510cc3236c8` |

## Final Readback Manifest

最终 local evidence bundle 的 `final-readback-manifest.json` SHA-256 为
`ec7339432f458608f4f7fea10324c3fb7d98f50ff6f3509197e16076bcf93272`。
该 manifest 绑定 exact OMA canonical、package compatibility pin、OPL E2E source、OPL final recheck 和下列 artifact bytes；本表是 historical digest index，不替代 OPL runtime/readback、target owner receipt 或任何 clinical authority。

| Artifact | SHA-256 |
| --- | --- |
| `stage-route-evidence.json` | `0850531b8e4ffa414f5e3a6d29c8d1da31caba62a1d4137df0577ac9fc08e1ca` |
| `build-agent-baseline.json` | `6e9955007845582d7999ea29b33bdde4135339848433ad136aa9eca395144df4` |
| `scaffold-validation.json` | `af144964f2e3c62f5a63ed36f33614e5632c5f22814b289c9686e6c4a83ac4bb` |
| `generated-interfaces.json` | `a06429b39a09608239e9ffa78afc4d5bf4cc8da2dd4e225aeac620b3cb0c1227` |
| `foundry-evaluation-no-observation.json` | `020e2c3d6f85e4c0df759d2a03f5047870264ddedad3cb9d20b70fda9e798e87` |
| `synthetic-abi-observation-packet.json` | `663e11673a21244870fb229ecba71fa53f86bfc75da0149224231a0ccc128992` |
| `foundry-evaluation-synthetic-abi.json` | `1a31d4c5c03b6c1f5a7a7d7a2d06b00dea18b5e0fef40a0e65429284723226a4` |
| `current-opl-c71-scaffold-validation.json` | `af144964f2e3c62f5a63ed36f33614e5632c5f22814b289c9686e6c4a83ac4bb` |
| `current-opl-c71-generated-interfaces.json` | `a06429b39a09608239e9ffa78afc4d5bf4cc8da2dd4e225aeac620b3cb0c1227` |
| `current-opl-c71-foundry-no-observation.json` | `a4f2a42689a7778428af770a4d269b14c69585baf9196ec79a02e6358587aca9` |

标准 materialization command shape：

```bash
node --experimental-strip-types scripts/build-agent-baseline.ts \
  --output-dir <target-output> \
  --opl-bin <opl-bin> \
  --ai-reviewer-evaluation <reviewer-evidence.json> \
  --stage-run-readback <intent-query.json> \
  --stage-run-readback <decomposition-query.json> \
  --stage-run-readback <skeleton-query.json> \
  --stage-run-readback <eval-query.json> \
  --stage-run-readback <baseline-query.json> \
  --stage-run-readback <delivery-query.json> \
  --domain-id colorectal-surgery-risk \
  --domain-label 'Colorectal Surgery Risk' \
  --delivery-domain clinical_decision_support \
  --target-brief '<target brief>' \
  --reference-design-source 'source-material:sha256:<pdf-sha256>' \
  --reference-design-pattern <pattern-notes-ref> \
  --reference-design-pattern-packet <pattern-packet-ref>
```

## Foundry Boundary Tests

OPL execution without `--observations` correctly returned `blocked_missing_evaluation_observations`, platform blocker `ofleb_3a070f16c8f637b1d5a64adf`, receipt output, and `suite_result_ref=null`. This is an OPL platform blocker; it is not a colorectal target-domain blocker or owner receipt.

一个明确标为 `synthetic_abi_only_fixture` 的 target-bound observation packet 产生了 OPL suite result `oals_3bffc4cb9d6c3a6144ccd241` 和 execution receipt `oflewr_d7e01a07ba8e94e67efcdb0e`。结果有 7 个 provenance bindings，但仍为 `blocked`：`promotion_gate_blocked`、independent-review/promotion/rollback/canary receipt 缺失，`promotable_candidate_count=0`。因此 synthetic packet 只证明 ABI/provenance binding，不证明临床有效性、evaluation completion、promotion、target owner acceptance 或 production readiness。

可重复执行面：

```bash
opl agent-lab evaluation-work-order execute \
  --work-order <target-output>/foundry-lab-work-order.json \
  --output <no-observation-output> \
  --json

opl agent-lab evaluation-work-order execute \
  --work-order <target-output>/foundry-lab-work-order.json \
  --observations <target-bound-observation-packet.json> \
  --output <observed-output> \
  --json
```

## Legitimate Stop

本轮证明的是可执行的 paper-to-agent architecture transfer、current OPL scaffold ABI compatibility、target-bound Foundry handoff，以及 missing/synthetic observation boundary。下一步只能由肠癌手术风险 target-domain owner 提供真实、合规的临床 workflow/evidence observations，完成独立评审、风险模型适用性与 target owner closeout，并返回 owner receipt 或 typed blocker。没有这些输入，任何 `clinical_validated`、`domain_ready`、`production_ready`、default promotion 或 owner accepted 声明都是越权。
