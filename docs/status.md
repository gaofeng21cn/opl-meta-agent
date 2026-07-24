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

This is not yet an implementation-complete claim. The current Package manifest
still delegates lifecycle to `opl packages`, carries a source version, and
describes the Codex surface. Until fresh cross-repository evidence proves
independent owner publication, complete-runtime carrier readback,
presence/callability composition, and executor-neutral state preservation,
those fields remain compatibility machine truth and must not be inferred away.
No lock, payload, version/ABI solver, atomic Package closure, or shared Release
Set should be added as a new readiness requirement.

The migration must retain the public `engineer-agent` behavior, all Foundry
semantic outputs, work-item continuity, preferences, dependency state, and
typed views. OMA protocol digests continue to bind exact domain inputs and
evidence; they do not become Package dependency locks. Cross-repository
implementation and deletion status is owned by the
[Framework platform composition migration SSOT](https://github.com/gaofeng21cn/one-person-lab/blob/main/docs/active/opl-package-platform-composition-migration.md).

The current source release line is `0.4.3`. It includes owner-proof baseline `fcd31988ef224edd5d211c69eaeaf81c7b71814c` and the canonical refs-only memory descriptor. The synchronized carriers are `package.json`, `package-lock.json`, `contracts/opl_agent_package_manifest.json`, and the Codex plugin manifest. An annotated Git tag plus HTTPS and SSH:443 remote readback is the release transport receipt; source version declarations and tests alone do not prove publication.

`scripts/verify.sh full` checks repository contracts and fixtures. Passing it proves the checked repository bytes are internally consistent; it does not prove a live Foundry run, qualification, activation, target-owner acceptance, release, or production adoption.

Runtime completion, qualification, activation, and rollback status must be read from OPL Foundry Kernel, not inferred from this repository.
The memory descriptor does not let OPL write a memory body, accept or reject writeback, own a memory verdict, or infer live-soak or domain-ready status.
