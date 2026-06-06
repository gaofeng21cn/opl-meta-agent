# OMA takeover fixture alias parser-tail retirement closeout

Owner: `opl-meta-agent`
Purpose: `takeover_fixture_alias_parser_tail_retirement`
State: `historical_closeout`
Machine boundary: 本文只记录 `takeover:test --fixture` 专门 parser tail 的物理退役范围、验证和 no-resurrection 规则。当前 takeover truth 继续归 `scripts/takeover-agent.ts`、`tests/takeover-loop.test.ts`、`runtime/authority_functions/meta-agent-authority-functions.json`、active plan 和 private inventory。

## Retired Surface

Retired from active source:

- `scripts/takeover-agent.ts#parseTakeoverAgentArgs` no longer has a dedicated `--fixture` branch.
- `tests/takeover-loop.test.ts` no longer asserts a retired-alias-specific error message.
- `runtime/authority_functions/meta-agent-authority-functions.json#source_purity_scan_receipt.generic_script_materializer_scan.retired_materializer_tails` no longer lists `takeover_fixture_alias` as an active retained retired tail.

Current behavior:

- `takeover:test` accepts only `--agent-dir`, `--output-dir`, and `--opl-bin`.
- `--fixture` fails closed through the ordinary unknown-argument path.
- Historical docs may mention `takeover:test --fixture` only as provenance.

## No-Resurrection Rule

Do not restore a special `--fixture` parser branch, public package script, compatibility alias, fixture materialization route, or alias-specific error wording for `takeover:test`.

Explicit target-agent intake remains `npm run takeover:test -- --agent-dir <existing-agent-dir> --output-dir <dir> --opl-bin <opl>`.

## Verification

Run from the OMA repo root after this lane:

```bash
rtk node --test tests/takeover-loop.test.ts tests/source-purity.test.ts
rtk npm run typecheck
rtk git diff --check
rtk /Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json
```

Expected behavior:

- `--fixture` is rejected as `Unknown argument: --fixture`.
- Source-purity materializer tails no longer include `takeover_fixture_alias`.
- TypeScript accepts the parser and test changes.
- Doc doctor reports no lifecycle or taxonomy findings.

Result:

- `rtk node --test tests/takeover-loop.test.ts tests/source-purity.test.ts`: passed, `12` tests, `0` failed.
- `rtk npm run typecheck`: passed.
- `rtk npm test`: passed, `80` tests, `0` failed.
- `rtk git diff --check`: passed.
- Conflict-marker scan over touched source, test, contract and docs files: no matches.
- `rtk /Users/gaofeng/.local/bin/opl-doc-doctor doctor . --format json`: passed, `finding_count = 0`, `markdown_doc_count = 31`.
- Active scan for `takeover_fixture_alias`, `--fixture alias`, and alias-specific parser wording leaves only history/provenance and no-resurrection context.
