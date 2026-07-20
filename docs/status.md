# Status

Owner: `oma`
Purpose: `current_status`
State: `active_truth`
Machine boundary: Human-readable current summary. Machine truth lives in `contracts/`, `agent/`, tests, and repository verification output; live Foundry state remains in OPL.

The repository currently declares:

- identity `agent_id/package_id=oma`, `domain_id=agent_engineering`, and `carrier_slug=opl-meta-agent`;
- one public `engineer-agent` action with `create`, `takeover`, and `improve` modes;
- internal `design` and `diagnose` provider operations;
- eight skill-bound semantic Stages and four professional methods;
- four refs-only fixtures for the OPL-owned Foundry protocol;
- one domain-owned memory descriptor that exposes policy, locator, and receipt refs without materializing a memory body;
- no repo-local materialization, evaluation executor, evidence store, version store, activation path, or rollback layer.

The current source release line is `0.4.2`. It includes owner-proof baseline `fcd31988ef224edd5d211c69eaeaf81c7b71814c` and the canonical refs-only memory descriptor. The synchronized carriers are `package.json`, `package-lock.json`, `contracts/opl_agent_package_manifest.json`, and the Codex plugin manifest. An annotated Git tag plus HTTPS and SSH:443 remote readback is the release transport receipt; source version declarations and tests alone do not prove publication.

`scripts/verify.sh full` checks repository contracts and fixtures. Passing it proves the checked repository bytes are internally consistent; it does not prove a live Foundry run, qualification, activation, target-owner acceptance, release, or production adoption.

Runtime completion, qualification, activation, and rollback status must be read from OPL Foundry Kernel, not inferred from this repository.
The memory descriptor does not let OPL write a memory body, accept or reject writeback, own a memory verdict, or infer live-soak or domain-ready status.
