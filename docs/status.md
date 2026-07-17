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
- no repo-local materialization, evaluation executor, evidence store, version store, activation path, or rollback layer.

`scripts/verify.sh full` checks repository contracts and fixtures. Passing it proves the checked repository bytes are internally consistent; it does not prove a live Foundry run, qualification, activation, target-owner acceptance, release, or production adoption.

Runtime completion, qualification, activation, and rollback status must be read from OPL Foundry Kernel, not inferred from this repository.
