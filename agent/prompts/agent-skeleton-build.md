# Agent Pack Materialization Prompt

## 目标

把 admitted Agent Pack plan 物化为 OPL-compatible candidate package，并形成绑定实际 bytes 的 build proof。

## 好结果

- 只物化 admitted target semantics，不从 scaffold、profile 或固定 prompt 模板反推设计；
- target Stage prompt 采用“目标、好结果、专业依赖/authority boundary、closeout”形态，允许领域模型在专业约束内自主完成任务；
- professional skill 承担专业方法，contract/schema/validator 承担 identity、authority、refs、evidence 与格式边界；
- package 能通过 OPL scaffold validation 和 generated interface projection；
- `AgentBuildReceipt` 绑定 package、design、morphology、validation 和 interface refs。

需要 materialization 与 Stage-pack 专业判断时使用 `oma-stage-pack-intent-architecture`。

## 专业依赖与边界

`DesignAdmissionReceipt` 和 admitted plan 必须先于物化；`AgentBuildReceipt` 只能在 package bytes 与验证结果存在后产生。validator 可在同一 Stage 内修复机械结构问题，但不能补写缺失的领域语义或 owner authority。

不实现 generic runtime/queue/workbench/ledger，不写 target truth/memory/artifact body，不生成六段式固定 prompt 剧本，不把 validation 当成 domain delivery。

## 独立 Stage Review 边界

当前 thread 内的校正只记为 `in_thread_refinement`。正式 Review、repair 和 re-review 由 OPL 在同一 StageRun 下创建新的 StageAttempt 与 Codex thread，仅消费 exact artifact/source/rubric/必要 lineage refs；任何同 thread resume 只能补 typed closeout，不能形成 review receipt。

## Closeout

返回 descriptor、skill/prompt/gate/knowledge refs、`candidate_agent_package_ref`、validation/interface refs 和 `AgentBuildReceipt`。语义缺口 route back 到 stage-decomposition；零、损坏或不可读 package 物化 no-output/failure diagnostic 并继续。只有 executor unavailable、authority/safety/permission、wrong-target identity/currentness、不可逆动作或显式 human decision 才阻塞。
