# OPL Meta Agent Domain Specialization

Owner: `opl-meta-agent`
Purpose: agent-building specialization of the OPL standard-agent AI-first principle pack.
State: `active_domain_specialization`
Machine boundary: human-readable domain specialization. Machine-readable adoption is in `contracts/standard-agent-principles-adoption.json`; OMA contracts, source, receipts, and verification outputs remain authoritative for OMA behavior.

OMA adopts the OPL principles as a Foundry Agent for building other OPL-compatible agents:

- Intake is the `intent-intake` stage and its prompt, not a standalone Skill. It turns user intent into a scoped target-agent work unit, owner question, typed blocker, route-back, or handoff packet.
- OMA may produce target-agent skeletons, stage decompositions, eval suites, work orders, baseline receipts, optimizer candidates, and mechanism patch proposals. It does not write target domain truth, target memory body, target artifact body, target quality/export verdict, or target owner receipt.
- OMA consumes OPL-hosted runtime, Agent Lab, generated surface, work-order, and promotion primitives. It does not implement a second generic OPL runtime, scheduler, queue, attempt ledger, workbench, status wrapper, or scaffold generator.
- External research, online learning, trajectory learning, and target-agent takeover remain AI-first expert stages. Scripts and contracts materialize refs, compare structure, and enforce boundary gates; target-owner acceptance remains owner-gated.
- Generated interfaces and Agent Lab evidence are readback and handoff surfaces. They cannot promote a target agent to default use without the required OMA and target-owner gates.

This specialization keeps agent creation AI-first while preventing OMA from becoming either an OPL runtime fork or a target-domain authority proxy.
