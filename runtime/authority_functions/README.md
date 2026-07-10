# OMA Authority Functions

Owner: `opl-meta-agent`
Purpose: `minimal_authority_function_support_index`
State: `active_support`
Machine boundary: This file is a support index for OPL Pack consumption. Machine truth remains in `meta-agent-authority-functions.source.json` and its source parts; `meta-agent-authority-functions.json` is the generated consumer aggregate.

OMA authority functions may build candidate Agent Packs and proposal-only mechanism refs within the declared agent-building boundary. They do not own a generic runner, queue, attempt ledger, target worktree lifecycle, target domain truth, target artifact or memory bodies, target quality/export verdicts, or target owner receipts.

Maintenance commands:

- `npm run authority-functions:write`
- `npm run authority-functions:check`
