---
name: oma-stage-pack-intent-architecture
description: Use when OMA must turn user intent, external patterns, and owner boundaries into a target-agent stage pack and declarative architecture.
---

# OMA Stage Pack Intent Architecture

## Purpose

Shape a target-agent request into an auditable intent packet, research disposition, artifact morphology, owner-aware stage graph, action catalog, and no-forbidden-write policy. The result stays refs-only and declarative; OPL owns generated interfaces and runtime, while target owners keep domain truth.

## AI-First / Contract-Light Boundary

- Use AI judgment here for user-intent reframing, external-pattern transfer, stage decomposition, acceptance criteria, artifact morphology, non-goals, and owner split.
- Use AI judgment here for stage sizing. One top-level stage should own one major open semantic judgment; deterministic generation, validation, file materialization, helper receipts, and closeout readbacks stay inside that stage unless they introduce an independent open judgment.
- Split stages when two decisions need different owners, knowledge sources, quality gates, handoff recipients, or failure routes. Merge or delete stages that are only mechanical wrappers around the same judgment.
- When a large stage is intentionally kept, expose typed subpacket or gate boundaries inside the stage, such as `StageDecompositionSubpacketSet`, instead of hiding a private sub-workflow or promoting those subpackets into runtime stages.
- Let the stage main prompt own top-level decomposition and closeout shape; call professional skills only for stage-internal specialist method judgments. Contracts and schemas record selected stage graphs, refs, subpackets, gates, and forbidden authority, but they do not decide stage size.
- Design stage admission as progress-first. Validator, schema, and materializer feedback may repair projection, ref, stage input, `requires`, or expected receipt drift inside the same stage when the correction is mechanically derivable from valid design objects and authority refs; it must not become a terminal blocker, a new top-level stage, or a private control plane. When a consumable design/pack artifact exists, semantic, source-evidence, reviewer, and non-derivable design gaps become quality debt plus route-back and block accepted/delivery/promotion/ready claims only. Zero consumable artifact, corrupt artifact, explicit owner/human decision, forbidden target-truth write, safety/permission/authority/currentness boundaries still route to typed blocker or human gate.
- Use AI judgment here to name the target-agent handoff vocabulary: baseline packet, thin evaluation request, owner route, work-order candidate, typed blocker, route-back, no-patch coordination, or human gate. Contracts may store the selected labels; they do not decide which label fits the intent.
- Use AI judgment here to keep modularity at the operational layer: stage-route, specialist-skill, tool-connector, quality-gate, read-model/currentness, and authority-boundary are routing surfaces for later work orders, while the Skill layer keeps flexible professional judgment.
- Treat `contracts/capability_map.json`, stage control contracts, and generated-interface refs as a compact index and safety boundary; they record the selected architecture, but they do not discover it.
- Prefer the smallest declarative stage pack that preserves owner handoffs. Do not create compatibility aliases, runtime wrappers, or schema detail to avoid making an architectural judgment.

## Inputs

- User request, target audience, delivery domain, target artifact, quality bar, non-goals, tools, data custody, and owner routes.
- OPL profile selector / inspect receipts for the target-agent intent. Builtin/hybrid receipts provide selected profile refs and requirements as framework capability inputs; source-derived design receipts provide source refs, pattern packet refs, `ReferenceDesignPacket`, `TransferMap`, `AgentPackPlan`, `DesignAdmissionReceipt`, `StageDecompositionSubpacketSet`, transferable pattern requirements, and capability plan requirements when no builtin profile matches but the user supplied a reference design; research-driven design receipts provide research source refs, expert practice notes, research synthesis refs, `ResearchSynthesisPacket`, `TransferMap`, `AgentPackPlan`, `DesignAdmissionReceipt`, `StageDecompositionSubpacketSet`, transferable pattern requirements, and capability plan requirements when the user only has a vague idea. `AgentBuildReceipt` / `build_receipt` is post-materialization build proof.
- Public docs, papers, PDFs, repos, products, demos, or user-supplied references, recorded as reference design source refs, short transfer-pattern notes, refs-only pattern packets, research source refs, expert practice notes, or research synthesis refs distilled by source ingest / Codex extraction / web research.
- Existing agent repo/package refs, acceptance criteria, source refs, and authority boundary refs.

## Design Method

- Start from the user-visible job, its representative real task, and the artifact shape needed to carry that task at target scale.
- Establish OMA, OPL Framework, target-domain, artifact, memory, quality, runtime, and owner-receipt responsibilities before naming stages; keep that split active throughout the design.
- Preserve the selected profile/source/research route and its evidence objects. `StageDecompositionSubpacketSet` records the presence and provenance of design-basis, transfer, pack, admission, morphology, and post-materialization build refs; it does not prescribe their cognitive execution order.
- Let artifact morphology and external patterns jointly inform the smallest stage graph. Map every source workflow step to an adopted, adapted, merged, stage-internal, or rejected disposition. Split only for genuinely distinct open judgments, owners, knowledge, gates, handoffs, or failure routes.
- Convert constraints into acceptance criteria, claim boundaries, and explicit non-goals. State what each gate proves and what owner receipt or domain verdict it cannot prove.
- Name future Agent Lab / FeedbackOps routes as handoff vocabulary, not runtime machinery.
- Select helper language only after semantic Stage and affordance design. Changing helper language must not change Agent identity, topology, generated surfaces, or owner authority.
- Remove orphan outputs and compatibility aliases unless a contract explicitly requires a migration bridge.

## Reference Design Intake Protocol

When the user supplies a PDF, paper, repo, product document, or comparable design reference:

1. Ingest the original file through `opl workspace source ingest` and retain its sha256-addressed source material ref, stored-file ref, and workspace receipt ref. OPL owns source custody and fingerprinting, not semantic interpretation.
2. Extract the source once with the available document-extraction capability, normally `mineru-document-extractor` / `mineru-open-api` for PDFs. Record the extractor, extraction attempt or receipt ref, extracted artifact locator, and extracted artifact sha256. Reuse this extraction unless the source bytes or extraction method change.
3. Use Codex/OMA judgment to distill local semantic artifacts for pattern summary, transferable workflow steps, non-transferable constraints, source anchors, and authority notes. Keep the source body outside contracts and do not treat extracted prose as target truth.
4. Assemble the canonical OPL refs-only `reference-design-pattern-packet.v1` envelope. Its semantic refs must resolve inside the packet directory, its source fingerprint must match the ingested source, and its authority/non-claim flags must remain false. Do not invent an OMA-owned external packet ABI.
5. Route the validated packet into source-derived design. Produce content-rich `ReferenceDesignPacket`, `TransferMap`, `AgentPackPlan`, `DesignAdmissionReceipt`, morphology, and `StageDecompositionSubpacketSet` refs through iterative design judgment. Source evidence and the safe packet must precede their claims; design admission must precede target-pack materialization; `AgentBuildReceipt` and OPL validation/interface readbacks are post-materialization proof.
6. Hand the thin evaluation request and canonical evaluation work order to OPL Foundry Lab. Handoff evidence must show that missing external observations remain pending or return the OPL-owned typed route without a suite result, and that any returned result/receipt is bound to the exact target, request, task, and provenance. Synthetic fixtures may test ABI compatibility in the test surface, but are not part of the professional workflow and cannot support promotable or target-ready claims.
7. Record an evidence inventory containing the OMA and OPL commit ids, source/extraction/packet hashes, target pack identity, stage manifest, work-order id, blocker or result id, execution receipt ref, provenance bindings, consumer judgment, verification commands, and remaining target-owner closeout. Ephemeral paths are locators, not durable evidence by themselves.

Fail closed before target pack materialization when source bytes are unavailable, the extraction receipt cannot be bound to them, semantic refs escape the packet directory, required semantic artifacts are empty, source anchors do not support a claimed workflow step, or authority/non-claim fields are invalid. Do not hide these failures behind a default stage graph, generic pattern note, or fixed packet template.

## Forbidden Authority

- Do not create generic scheduler, daemon, queue, workbench, private runtime, compatibility facade, target owner authority, or generated-surface ownership.
- Do not write target truth, memory body, artifact body, quality/export verdict, owner receipt body, typed blocker body or promotion state.
- Do not copy long external text or target memory body into OMA pack files.
- Do not classify target agents as Python Agents or TypeScript Agents. Language is an implementation detail of declared helpers only.

## Legacy Redirects

The old `oma-intent-architect`, `oma-external-pattern-researcher`, and `oma-stage-pack-architect` entries redirect here.
