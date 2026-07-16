---
name: opl-meta-agent
description: Design, test, and evolve OPL-compatible Agents through the single OMA engineer-agent entry and the OPL Foundry Kernel.
---

# OPL Meta Agent

OMA turns an Agent engineering objective into a complete semantic design and improves that design from independently produced evidence. OMA does not own execution state, candidate bytes, evaluation runs, versions, activation, or rollback.

## Public Entry

Use `engineer-agent` for all three modes:

- `create`: design a new target Agent.
- `takeover`: assess an existing exact target version and design its OPL qualification obligations.
- `improve`: evolve an existing exact target version from evidence or an improvement signal.

The ordinary hosted entry is `opl agents run --domain oma --action engineer-agent`. The request is a `DesignRequest`; repository paths, commands, queues, leases, attempts, patches, work orders, promotion records, and protected test bodies are not part of this semantic boundary.

## Internal Provider Operations

OPL Foundry Kernel invokes exactly two internal operations. They are not public actions or tools.

- `design` consumes `DesignRequest` and returns one complete `AgentBlueprint` with an embedded `EvalSpec`. Request-owned `owner_authority_refs` are immutable trust anchors; the Blueprint must project them and `constraints.permission_refs` exactly in separate fields and cannot expand either set.
- `diagnose` consumes the exact request, blueprint, and OPL-produced `EvidenceBundle`, then returns one complete `EvolutionProposal` with the next full blueprint.

Content-bearing prompt, skill, knowledge, and helper refs use `opl-content://sha256/...`. The producing terminal Stage exposes the exact raw bytes as SHA-bound StageRun artifacts so OPL can persist and assemble them; OMA never selects candidate filesystem paths or writes version/activation state.

OMA may raise a risk hint but cannot lower OPL's computed risk. OMA may add tests but cannot remove or weaken existing tests and cannot see protected test bodies.

## Design Route

The design route covers mission intake, design-basis admission, optional target assessment, Stage architecture, blueprint authoring, and evaluation design. One top-level Stage owns one major open semantic judgment. Mechanical materialization, validation, execution, evidence persistence, and version transactions remain in OPL.

## Diagnosis Route

Diagnosis binds every root cause to the exact evidence digest and returns semantic changes, expected benefit, new tests, trade-offs, and risk hints. Platform failures remain in OPL retry/failure handling. If no admissible Agent-semantic change exists, OMA returns the exact current blueprint and an empty semantic diff. It never returns a file patch or execution instruction. A generated Agent may emit observations and improvement signals, but it cannot modify its own version, tests, permissions, authority, or activation pointer.

## Completion Boundary

OMA provider completion only means a protocol object was produced. Only OPL FoundryRun evidence can establish qualification, canary, activation, or rollback. Target Owner authority still controls protected tests, domain truth, quality acceptance, permissions, and production adoption.
