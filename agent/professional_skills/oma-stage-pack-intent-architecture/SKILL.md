---
name: oma-stage-pack-intent-architecture
description: Use when OMA must turn user intent, external patterns, and owner boundaries into a target-agent stage pack and declarative architecture.
---

# OMA Stage Pack Intent Architecture

## Purpose

Shape a target-agent request into an auditable intent packet, research disposition, stage sequence, action catalog, artifact morphology brief, and no-forbidden-write policy. The result stays refs-only and declarative; OPL owns generated interfaces and runtime, while target owners keep domain truth.

## AI-First / Contract-Light Boundary

- Use AI judgment here for user-intent reframing, external-pattern transfer, stage decomposition, acceptance criteria, artifact morphology, non-goals, and owner split.
- Use AI judgment here for stage sizing. One top-level stage should own one major open semantic judgment; deterministic generation, validation, file materialization, helper receipts, and closeout readbacks stay inside that stage unless they introduce an independent open judgment.
- Split stages when two decisions need different owners, knowledge sources, quality gates, handoff recipients, or failure routes. Merge or delete stages that are only mechanical wrappers around the same judgment.
- When a large stage is intentionally kept, expose typed subpacket or gate boundaries inside the stage, such as `StageDecompositionSubpacketSet`, instead of hiding a private sub-workflow or promoting those subpackets into runtime stages.
- Let the stage main prompt own top-level decomposition and closeout shape; call professional skills only for stage-internal specialist method judgments. Contracts and schemas record selected stage graphs, refs, subpackets, gates, and forbidden authority, but they do not decide stage size.
- Design stage admission as progress-first. Validator, schema, and materializer feedback may repair projection, ref, stage input, `requires`, or expected receipt drift inside the same stage when the correction is mechanically derivable from valid design objects and authority refs; it must not become a terminal blocker, a new top-level stage, or a private control plane. Missing semantic objects, missing source evidence, owner-decision gaps, forbidden claims, target-truth writes, and non-derivable design gaps still route to typed blocker, route-back, or human gate.
- Use AI judgment here to name the target-agent handoff vocabulary: baseline packet, suite seed, owner route, work-order candidate, typed blocker, route-back, no-patch coordination, or human gate. Contracts may store the selected labels; they do not decide which label fits the intent.
- Use AI judgment here to keep modularity at the operational layer: stage-route, specialist-skill, tool-connector, quality-gate, read-model/currentness, and authority-boundary are routing surfaces for later work orders, while the Skill layer keeps flexible professional judgment.
- Treat `contracts/capability_map.json`, stage control contracts, and generated-interface refs as a compact index and safety boundary; they record the selected architecture, but they do not discover it.
- Prefer the smallest declarative stage pack that preserves owner handoffs. Do not create compatibility aliases, runtime wrappers, or schema detail to avoid making an architectural judgment.

## Inputs

- User request, target audience, delivery domain, target artifact, quality bar, non-goals, tools, data custody, and owner routes.
- OPL profile selector / inspect receipts for the target-agent intent. Builtin/hybrid receipts provide selected profile refs and requirements as framework capability inputs; source-derived design receipts provide source refs, pattern packet refs, `ReferenceDesignPacket`, `TransferMap`, `AgentPackPlan`, `DesignAdmissionReceipt`, `StageDecompositionSubpacketSet`, transferable pattern requirements, and capability plan requirements when no builtin profile matches but the user supplied a reference design; research-driven design receipts provide research source refs, expert practice notes, research synthesis refs, `ResearchSynthesisPacket`, `TransferMap`, `AgentPackPlan`, `DesignAdmissionReceipt`, `StageDecompositionSubpacketSet`, transferable pattern requirements, and capability plan requirements when the user only has a vague idea. `AgentBuildReceipt` / `build_receipt` is post-materialization build proof.
- Public docs, papers, PDFs, repos, products, demos, or user-supplied references, recorded as reference design source refs, short transfer-pattern notes, refs-only pattern packets, research source refs, expert practice notes, or research synthesis refs distilled by source ingest / Codex extraction / web research.
- Existing agent repo/package refs, acceptance criteria, source refs, and authority boundary refs.

## Workflow

1. Start from the user-visible job: who needs what verified result.
2. Separate OMA, OPL Framework, and target-domain owner responsibilities before naming stages.
3. Preserve the active profile selection mode in the target descriptor, capability map, stage control plane, generated stage prompt, knowledge policy, and quality gate. For builtin/hybrid mode, preserve selected OPL profile refs, profile selection rationale, and profile requirements. For source-derived design mode, preserve source-derived design receipt refs, reference design pattern packet refs, `ReferenceDesignPacket`, `TransferMap`, `AgentPackPlan`, `DesignAdmissionReceipt`, `StageDecompositionSubpacketSet`, transferable pattern requirements, capability plan requirements, and the no-runtime/no-truth-import authority boundary. For research-driven design mode, preserve research-driven design receipt refs, research source refs, expert practice notes, research synthesis refs, `ResearchSynthesisPacket`, `TransferMap`, `AgentPackPlan`, `DesignAdmissionReceipt`, `StageDecompositionSubpacketSet`, transferable pattern requirements, capability plan requirements, and the public-research-is-not-target-truth boundary. Preserve `AgentBuildReceipt` / `build_receipt` as build proof after materialization.
4. Convert constraints into baseline acceptance criteria, gate interpretation notes, and explicit non-goals. State what a passing gate can prove and which owner receipt or target-domain verdict it cannot prove.
5. Extract transferable external patterns as stage design, inputs/outputs, grounding source shape, route/mode selection, rubric, validation design, handoff, recovery, receipts, or failure taxonomy; prefer pattern packet / research synthesis refs when present, require non-empty `ReferenceDesignPacket` or `ResearchSynthesisPacket` plus `TransferMap` / `AgentPackPlan`, mark every design-derived stage with `stage_pattern_source_refs`, require `StageDecompositionSubpacketSet` to preserve ordered design-basis / transfer-planning / agent-pack-planning / design-admission / build-verification refs, require `DesignAdmissionReceipt` to name design-derived stage refs, target-only requirements, rejected source patterns, forbidden claims, and refs-only authority boundary, and reject runtime, private data, target truth, domain verdict, or promotion authority imports.
6. Build the smallest stage sequence that preserves distinct owners and handoffs; every stage output should map to one next owner action, not to a private OMA runtime obligation.
7. Name where future Agent Lab / FeedbackOps evidence should route: stage-route, specialist-skill, tool-connector, quality-gate, read-model/currentness, authority-boundary, or target-owner route-back. Do this as handoff vocabulary, not as new runtime machinery.
8. Define artifact morphology from realistic target tasks: native source format, sharding, extent/scale contract, asset custody, assembler boundary, and export refs.
9. Delete orphan outputs and compatibility aliases unless a contract explicitly needs a migration bridge.

## Reference Design Intake Protocol

When the user supplies a PDF, paper, repo, product document, or comparable design reference:

1. Ingest the original file through `opl workspace source ingest` and retain its sha256-addressed source material ref, stored-file ref, and workspace receipt ref. OPL owns source custody and fingerprinting, not semantic interpretation.
2. Extract the source once with the available document-extraction capability, normally `mineru-document-extractor` / `mineru-open-api` for PDFs. Record the extractor, extraction attempt or receipt ref, extracted artifact locator, and extracted artifact sha256. Reuse this extraction unless the source bytes or extraction method change.
3. Use Codex/OMA judgment to distill local semantic artifacts for pattern summary, transferable workflow steps, non-transferable constraints, source anchors, and authority notes. Keep the source body outside contracts and do not treat extracted prose as target truth.
4. Assemble the canonical OPL refs-only `reference-design-pattern-packet.v1` envelope. Its semantic refs must resolve inside the packet directory, its source fingerprint must match the ingested source, and its authority/non-claim flags must remain false. Do not invent an OMA-owned external packet ABI.
5. Route the validated packet into source-derived design. Materialize a content-rich OMA `ReferenceDesignPacket`, then `TransferMap`, `AgentPackPlan`, `DesignAdmissionReceipt`, and `StageDecompositionSubpacketSet` before target pack materialization. After materialization, retain `AgentBuildReceipt` and OPL scaffold/profile/generated-interface readbacks.
6. Hand the declarative suite seed and canonical evaluation work order to `opl agent-lab evaluation-work-order execute`. First verify that omitting observations returns a target-bound OPL platform typed blocker without a suite result. A synthetic observation packet may then verify ABI compatibility, but must be labeled non-authoritative and must not produce a promotable or target-ready claim.
7. Record an evidence inventory containing the OMA and OPL commit ids, source/extraction/packet hashes, target pack identity, stage manifest, work-order id, blocker or result id, execution receipt ref, provenance bindings, consumer judgment, verification commands, and remaining target-owner closeout. Ephemeral paths are locators, not durable evidence by themselves.

Fail closed before target pack materialization when source bytes are unavailable, the extraction receipt cannot be bound to them, semantic refs escape the packet directory, required semantic artifacts are empty, source anchors do not support a claimed workflow step, or authority/non-claim fields are invalid. Do not hide these failures behind a default stage graph, generic pattern note, or fixed packet template.

## Forbidden Authority

- Do not create generic scheduler, daemon, queue, workbench, private runtime, compatibility facade, target owner authority, or generated-surface ownership.
- Do not write target truth, memory body, artifact body, quality/export verdict, owner receipt body, typed blocker body or promotion state.
- Do not copy long external text or target memory body into OMA pack files.

## Legacy Redirects

The old `oma-intent-architect`, `oma-external-pattern-researcher`, and `oma-stage-pack-architect` entries redirect here.
