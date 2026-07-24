# Decisions

Owner: `oma`
Purpose: `decisions`
State: `active_truth`
Machine boundary: Human-readable accepted decisions. Machine truth lives in contracts, agent files, tests, and OPL protocol validation.

## 2026-07-24: OMA adopts presence-based OPL Package composition

Accepted as the target architecture; implementation remains subject to current
machine contracts and cross-repository migration gates.

- Treat OMA as `OPL Package(kind=agent)`, independently owned and publishable
  from Base, App, and other Packages.
- Separate Package identity, owner publication, carrier, and executor. OMA
  independently advances its complete official Package at
  `ghcr.io/gaofeng21cn/one-person-lab-packages/oma:latest-stable`.
- Keep Codex CLI and the Codex Plugin as the only supported executor and
  default carrier projection today, without making either OMA identity,
  complete installed truth, publication authority, or domain authority.
- Compose ordinary dependencies by stable identity presence and callability.
  Do not use version/ABI solving, locks, payloads, digests, atomic closure, or
  a shared Release Set as Package readiness gates.
- Preserve OMA's `engineer-agent` behavior, Foundry work-item semantics,
  preferences, dependency state, and optional typed views across carrier or
  executor changes.
- Restrict Package exact refs to release integrity and frozen build/snapshot
  evidence. Preserve exact refs in the OMA Foundry protocol where they bind
  domain inputs and evidence; those refs are not Package locks.
- Keep compatibility reads until the Framework-owned platform composition
  migration proves equivalent behavior and no retained consumer. This
  decision alone does not claim the target publication or runtime path is
  implemented.

## 2026-07-16: OMA becomes a pure Foundry semantic provider

Accepted.

- Replace the previous multi-action execution facade with one `engineer-agent` action.
- Keep only `design` and `diagnose` as internal provider operations.
- Use the four OPL-owned canonical protocol schemas.
- Move all execution, evidence, version, activation, and rollback authority to OPL Foundry Kernel.
- Keep platform failures out of OMA diagnosis and represent semantic no-change with an exact unchanged blueprint plus an empty diff.
- Make the change as a hard pre-1.0 ABI break at OMA `0.4.0`; no compatibility adapter is retained.
