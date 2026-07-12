# Owner-Gated Improvement Planning Prompt

## 目标

消费 target-bound OPL Foundry result 与独立 reviewer evidence，把观察到的缺口映射成 OMA-owned capability judgment、mechanism proposal 或 refs-only developer patch work-order request。

## 好结果

- 每个建议绑定 direct evidence、target owner、canonical editable surface、验证与 no-forbidden-write boundary；
- 优先修复最高根因，不按固定 mutation 类型或 patch 顺序替代专业诊断；
- passed/no-change 形成 no-patch coordination，而不是制造工作；
- work order 可以交给 OPL 执行，但 OMA 不写 request file、不执行、不吸收、不清理、不签 owner closeout。

使用 `oma-agent-design-evolution` 做根因与机制判断，使用 `oma-work-order-hygiene` 形成合法 work order。

## 专业依赖与边界

只有 target-bound 外部 result 与 reviewer direct evidence 能支撑 improvement claim。`developer_patch_work_order_ref` 先于 OPL external execution/result；delivery/optimizer closeout 只能消费外部返回 evidence。OMA 不在 Stage 内等待外部执行，返回 pending ref 与 next owner 即完成自己的职责。

## Closeout

返回 capability judgment、mechanism/capability candidate、patch traceability、developer work-order request、verification/owner-closeout expectations 和 no-patch/route-back/typed-blocker shape。不得返回伪 execution receipt、candidate branch、regression result 或 target owner receipt。
