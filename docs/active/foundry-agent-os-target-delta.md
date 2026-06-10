# OMA Foundry Agent OS 目标差异页

Owner: `opl-meta-agent`
Purpose: `foundry_agent_os_target_delta`
State: `active_support`
Machine boundary: 本文是人读 target delta。机器真相继续归 `contracts/`、`agent/`、`runtime/authority_functions/`、source、OPL Agent Lab result refs、developer work-order receipts、target owner receipts / typed blockers、candidate refs、tests，以及 OPL family `foundry_agent_os_standard` 合同。

## 读法

本文只回答 OMA 在 OPL family `Foundry Agent OS` 目标形态下“哪些上收到 OPL，哪些保留为 OMA authority kernel”。当前完成口径、证据门和执行顺序仍回到 [opl-meta-agent 理想目标态差距与完善计划](./opl-meta-agent-ideal-state-gap-plan.md)；script-to-pack、default-caller tail 和私有实现退役门回到 [opl-meta-agent 私有实现与 OPL 迁移台账](./opl-private-implementation-migration-inventory.md)。

目标形态固定为：

```text
OPL Agent OS
  + Declarative Agent-Building Pack
  + Agent-Building Authority Kernel
  + Improvement Capability Registry
```

OMA 不是 OPL Framework 内置模块，也不是第二 Agent Lab。它是一个 Foundry Agent，用来生成、接管、修复和改进 OPL-compatible target agents；OPL Framework 持有 generic runtime、Agent Lab、generated interfaces、work-order execute / absorb / cleanup 和 promotion gate。

## 上收到 OPL

| 上收域 | OPL owner | OMA 侧保留 |
| --- | --- | --- |
| Agent Lab runtime / suite execution / promotion gate | Foundry Lab / Runway | suite seed refs、review policy refs、candidate / mechanism proposal refs |
| scaffold generator / generated interfaces / registry | Pack / Connect / Atlas | Declarative Agent-Building Pack、target-agent descriptor refs、registration input refs |
| work-order execute / absorb / cleanup | Runway / Vault / Console | developer work-order materialization、allowed editable surfaces、no-forbidden-write proof requirements |
| target owner closeout hook invocation | Runway / target owner | owner route refs、expected target owner receipt / typed blocker return shape |
| App/workbench drilldown / status projection | Console / Connect | refs-only projection input、candidate / work-order / blocker summaries |
| queue / attempt ledger / provider receipt | Runway / Vault | stage decomposition closeout refs、baseline delivery refs、typed blocker refs |
| capability catalog / ABI / use policy | Atlas / Pack / Stagecraft | agent-building capability declarations、mechanism candidate policy、script-to-pack retirement gates |

OPL 只能持有 refs、execution primitive、generated interface、promotion shell、worktree lifecycle 和 projection。OPL / Agent Lab / Vault / Console / Runway / Pack / Capability Registry 都不能写 target domain truth、target artifact body、target memory body、target quality/export verdict、target owner receipt body 或 default promotion authority。

## 保留为 OMA Authority Kernel

OMA 必须保留：

- 用户意图理解、target brief、agent-building semantics 和 stage decomposition；
- candidate agent package materialization policy、Agent Lab suite seed policy、baseline delivery receipt policy；
- developer patch work order materialization，包括 AHE failure/root-cause/fix/impact refs、allowed editable surfaces、required verification refs、rollback/canary/version refs、owner route refs 和 no-forbidden-write proof；
- target capability improvement candidate、mechanism patch proposal 和 online-learning candidate；
- independent reviewer evidence requirements、direct-evidence verdict schema 和 provenance requirements；
- script-to-pack / materializer hygiene policy、typed blocker materialization 和 route-back evidence；
- OMA-owned typed blocker：当缺 target owner route、editable surface policy、reviewer evidence、executor lease、no-forbidden-write proof、verification refs 或 OPL primitive receipt 时返回 blocker。

这些 surface 不能被 suite pass、schema completeness、generated surface readiness、contract completeness、source-shape conformance、App projection readiness 或 refs-only scaleout closeout 替代。

## 默认读根

OMA 的 OPL-hosted / App-facing 默认读根必须是 `current_owner_delta`：

```text
current owner -> current agent-building delta -> accepted answer shape -> hard gate / typed blocker
```

默认 operator view 不应从 raw Agent Lab result list、work-order count、generated interface readiness、registry discovery 或 conformance pass 推导 target-agent 改进完成。只有当前 owner delta 明确要求某个 route-required ref，且缺失会影响 target owner route、editable surface identity、forbidden write、irreversible mutation、reviewer / promotion hard gate 或 target owner closeout 时，才升级为 OMA-owned typed blocker。其他 capability / evidence 缺口进入 advisory 或 audit，不阻断 agent-building 主线。

## 实施门

OMA 后续落地按下面的 gate 收口：

| Gate | 关闭条件 |
| --- | --- |
| Pack compile parity | OPL generated surfaces 能从 `agent/`、stage control、action catalog、work-order policy 和 OMA contracts 生成同一 descriptor / command / status shape。 |
| Agent Lab delegation parity | OMA 只生成 suite seed、candidate、work-order 或 blocker；suite execution、promotion gate、worktree lifecycle、absorb/cleanup 和 closeout hook 由 OPL / target owner 执行并返回 refs。 |
| No forbidden authority | OMA / OPL generated surface / Agent Lab / Vault / Console / Runway 不能写 target truth、artifact body、memory body、quality/export verdict、owner receipt body 或 default promotion authority。 |
| Script-to-pack thinning | 保留脚本必须被 machine gate 分类为 authority implementation、smoke/proof helper、thin delegation 或 developer work-order materializer；稳定 policy 迁入 `agent/`、contracts 或 OPL primitive。 |
| Production evidence | registry discovery receipt、App render / runtime drilldown receipt、repeat target cohorts、real source patch / rerun / owner receipt samples、independent reviewer direct evidence 和 no-active-legacy-caller scan 形成真实证据。 |

## 禁止声明

- 不把 `Foundry Agent OS` target delta 写成 target-agent domain ready、quality/export ready、App live rendering ready、human approval、default promotion 或 family production ready。
- 不把 suite pass、generated interface readiness、contract completeness、source-shape conformance、work-order shape、schema completeness 或 refs-only scaleout closeout 写成 target owner verdict。
- 不把 capability registry 写成 Agent Lab runner、promotion gate 或 target owner authority，也不把 optional capability ref 缺失写成默认 blocker。
- 不把 `current_owner_delta` projection 写成 owner answer；owner answer 必须来自 OMA authority kernel、OPL primitive receipt 或 target owner receipt / typed blocker。
