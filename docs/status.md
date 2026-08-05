# Status

Owner: `oma`
Purpose: `current_status`
State: `active_truth`
Machine boundary: Human-readable current summary. Machine truth lives in `contracts/`, `agent/`, tests, and repository verification output; live Foundry state remains in OPL.

The repository currently declares:

- Package / Agent identity `agent_id/package_id=oma` and domain identity
  `domain_id=agent_engineering`; current `carrier_slug=opl-meta-agent` is only a
  carrier locator, not Package identity, installed truth, or executor identity;
- one public `engineer-agent` action with `create`, `takeover`, and `improve` modes;
- internal `design` and `diagnose` provider operations;
- eight skill-bound semantic Stages and four professional methods;
- four refs-only fixtures for the OPL-owned Foundry protocol;
- one domain-owned memory descriptor that exposes policy, locator, and receipt refs without materializing a memory body;
- no repo-local materialization, evaluation executor, evidence store, version store, activation path, or rollback layer.

## Package composition migration

The accepted target is for OMA to remain a complete
`OPL Package(kind=agent)` with owner-controlled identity, Agent-engineering
capabilities, task semantics, and optional typed views. Its owner independently
publishes complete bytes to the OMA GHCR `latest-stable`; Codex remains the
current executor and its Plugin is only a carrier projection.

The owner marketplace now exposes the repository root to the configured Codex
Plugin Manager carrier, so one native installation contains both the OMA Skill
and the owner contracts and Agent runtime. The nested Plugin remains a local
developer shortcut, not an ordinary install or currentness path. Ordinary
Package currentness is per-Package owner OCI `latest-stable` to native carrier
to fresh installed and callable readback.

Installed locks, payloads, materializers, Package lifecycle receipts, LKG,
rollback, and durable Package transactions are compatibility-to-delete and are
not valid inputs to ordinary lifecycle, currentness, or hosted runtime. OMA's
Foundry and domain evidence contracts remain owner truth; this cutover does not
delete or reinterpret them.

The migration must retain the public `engineer-agent` behavior, all Foundry
semantic outputs, work-item continuity, preferences, dependency state, and
typed views. OMA protocol digests continue to bind exact domain inputs and
evidence; they do not become Package dependency locks. Cross-repository
implementation and deletion status is owned by the
[Framework platform composition migration SSOT](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/active/opl-package-platform-composition-migration.md).

The current source release line is `0.4.7`; it must stay synchronized across
`package.json`, `package-lock.json`, `contracts/opl_agent_package_manifest.json`,
root `opl-package.json`, and both Codex plugin manifests. Active status does not
retain a historical commit or transport snapshot as current proof. A Git tag
and remote ref readback prove
only source transport; owner publication currentness still requires fresh
owner-channel and exact-byte readback. Source declarations and tests alone do
not prove publication.

`scripts/verify.sh full` checks repository contracts and fixtures. Passing it proves the checked repository bytes are internally consistent; it does not prove a live Foundry run, qualification, activation, target-owner acceptance, release, or production adoption.

Runtime completion, qualification, activation, and rollback status must be read from OPL Foundry Kernel, not inferred from this repository.
The memory descriptor does not let OPL write a memory body, accept or reject writeback, own a memory verdict, or infer live-soak or domain-ready status.
