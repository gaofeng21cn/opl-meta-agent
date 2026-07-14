# OPL Meta Agent

本仓是基于 OPL Framework 的 Foundry Agent，canonical id 为 `oma`。

- OMA 持有 agent intent、stage/pack 设计、materialization、baseline、takeover 和 evolution 语义。
- OPL Framework 持有通用 runtime、Agent Lab、queue、attempt ledger、generated interfaces 与 promotion gate。
- Agent identity 和 authority 由 `agent/` 与 `contracts/` 定义；TypeScript 只实现声明过的 domain helpers。
- `agent/skills/*.md` 是 OPL domain skill declarations；`agent/professional_skills/*/SKILL.md` 是按需使用的 Codex-style 专业方法 Skill。
- primary-skill carrier mirror 的关系以 `contracts/capability_map.json` 为准。

默认验证入口：`scripts/verify.sh`。

<!-- CODEGRAPH_START -->
## CodeGraph

- 本仓库使用本地 `.codegraph/` 索引；该目录不得纳入 Git。
- 定义、调用、影响范围和代码路径等结构检索优先使用 CodeGraph；字面文本检索使用 `rg`。
- 索引缺失或过期时运行 `codegraph init .` 或 `codegraph sync .`。
<!-- CODEGRAPH_END -->
