# Status

Owner: `oma`
Purpose: `current_status`
State: `active_truth`
Machine boundary: Human-readable summary. Machine truth lives in `contracts/`, `agent/`, tests, and repository verification output; live Foundry state remains in OPL.

## Current Repository

- Package and Agent identity: `oma`; domain: `agent_engineering`; carrier locator: `opl-meta-agent`.
- Public action: `engineer-agent`, with `create`, `takeover`, and `improve` modes.
- Internal provider operations: `design` and `diagnose`.
- Eight semantic Stages and four professional methods are defined in `agent/`.
- Four refs-only Foundry protocol fixtures are mapped in `contracts/`.
- The memory descriptor exposes policy and receipt references; the memory body remains domain-owned.
- The repository contains no materializer, evaluator, evidence store, version store, activation, or rollback implementation.

## Package And Carrier

OMA is an `OPL Package(kind=agent)` with Codex CLI as its current executor and
the Codex Plugin as its carrier projection. The owner publication target and
cross-repository migration sequence are recorded in [Decisions](./decisions.md)
and the [Framework migration SSOT](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/active/opl-package-platform-composition-migration.md).

The current source release line is `0.4.9`; it is declared in the package
manifests and checked by the contract tests.

## Verification Boundary

Run `scripts/verify.sh full` to check repository contracts, refs, fixtures, and
carrier projections. A passing run establishes consistency of these bytes. It
does not establish a live Foundry run, qualification, activation, release, or
production adoption; those facts come from OPL and the target owner.
