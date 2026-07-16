# Decisions

## 2026-07-16: OMA becomes a pure Foundry semantic provider

Accepted.

- Replace the previous multi-action execution facade with one `engineer-agent` action.
- Keep only `design` and `diagnose` as internal provider operations.
- Use the four OPL-owned canonical protocol schemas.
- Move all execution, evidence, version, activation, and rollback authority to OPL Foundry Kernel.
- Keep platform failures out of OMA diagnosis and represent semantic no-change with an exact unchanged blueprint plus an empty diff.
- Make the change as a hard pre-1.0 ABI break at OMA `0.4.0`; no compatibility adapter is retained.
