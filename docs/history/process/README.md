# OMA Process History

Owner: `oma`
Purpose: `process_history_index`
State: `historical_archive_index`
Machine boundary: Human-readable destructive-cutover provenance. Current machine truth lives in contracts, agent files, tests, and OPL protocol validation.

The 2026-07-16 hard cutover replaced OMA's repo-local execution facade with a pure semantic provider. This directory records only why old surfaces cannot be resurrected.

Historical records may establish that a surface existed or was retired. They cannot establish current protocol conformance, FoundryRun progress, evaluation results, qualification, activation, rollback, or production adoption.

Use [`retired-surface-provenance.md`](./retired-surface-provenance.md) for the owner migration. Use current contracts and verification output for all present-tense claims.
