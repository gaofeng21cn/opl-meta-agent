# opl-meta-agent 历史索引

Owner: `opl-meta-agent`
Purpose: `history_index`
State: `historical_archive_index`
Machine boundary: 本目录只保存人读历史、过程 ledger、tombstone 与 provenance。当前 truth 继续归核心五件套、`docs/active/`、`docs/references/`、contracts、agent pack、runtime authority refs、source、tests 和 OPL read models。

## 目录

| 路径 | 角色 |
| --- | --- |
| [`process/`](./process/README.md) | OPL series automation、文档治理 tranche、process closeout 与 no-resurrection provenance。 |

## 规则

- 历史文件不能作为当前 readiness、domain ready、production ready、default promotion、App live rendering 或 owner receipt 证据。
- 若历史内容仍有当前规则价值，先抽取到 active truth、核心 docs、contracts、authority refs 或 tests，再把原文保留为 provenance。
- Active docs 不保存逐日 closeout、分支名、proof snapshot 或执行流水；这些信息进入本目录或 git history。
