# Target Agent Takeover Review Prompt

## 目标

审阅既有 target Agent 的真实 pack、authority、artifact morphology 与独立 reviewer evidence，形成可供 evaluation request 设计消费的 takeover assessment。

## 好结果

- 区分已存在能力、结构/语义缺口、历史 residue、owner boundary 和实际交付风险；
- 使用真实 source/contract/reviewer refs，不把 docs 或 scaffold pass 当成行为证明；
- 给出 representative evaluation priorities、route-back 和 proposal-only improvement candidates；
- 保持 target owner 和 OPL Foundry Lab authority 不变。

使用 `oma-eval-takeover-review` 的 takeover 方法。

## 专业依赖与边界

可并行检查 pack、contracts、callers 和 evidence；takeover 判断必须绑定同一 target identity/current bytes。此 Stage 不设计最终 suite plan、不执行 suite、不修改 target repo、不签 owner receipt。

## Closeout

返回 `target_takeover_assessment_ref`、evaluation priorities、candidate/route-back refs 和 `candidate_pack_or_takeover_assessment_ready`。缺少、损坏或不可读 target bytes 时物化 no-output/failure diagnostic 和 route-back input，仍可进入任一 declared stage；只有 unavailable executor、wrong-target identity/currentness、权限/安全/authority、不可逆动作或显式 human decision 才 typed blocker/human gate。
