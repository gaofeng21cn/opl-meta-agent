import fs from 'node:fs';
import path from 'node:path';
import {
  buildReferenceDesignAspects,
  buildReferenceDesignPacketContent,
  buildWorkflowStagePlans,
  buildWorkflowTransferMappings,
  resolveReferenceDesignPatterns as resolveReferenceDesignWorkflowPatterns,
} from './reference-design-workflow.ts';

export type JsonObject = Record<string, any>;

type DomainPackRefsField =
  | 'prompt_policy_refs'
  | 'stage_policy_refs'
  | 'skill_policy_refs'
  | 'quality_gate_refs'
  | 'knowledge_policy_refs';

type DomainPackSection = {
  section: string;
  dir: string;
  refsField: DomainPackRefsField;
  refKind: string;
};

type DomainPackFileSummary = {
  section: string;
  path: string;
  ref: string;
  byte_length: number;
  non_empty: true;
};

export type DomainPackSummary = {
  status: 'ready';
  domain_id: string;
  pack_root: 'agent';
  required_section_count: number;
  required_file_count: number;
  verified_file_count: number;
  required_files: DomainPackFileSummary[];
  section_file_counts: Record<string, number>;
  prompt_policy_refs: string[];
  stage_policy_refs: string[];
  skill_policy_refs: string[];
  quality_gate_refs: string[];
  knowledge_policy_refs: string[];
};

export type DomainPackReceiptFields = {
  domain_pack_status: DomainPackSummary['status'];
  prompt_policy_refs: string[];
  skill_policy_refs: string[];
  quality_gate_refs: string[];
  knowledge_policy_refs: string[];
};

export type MinimalTargetAgent = {
  domain_id: string;
  domain_label?: string | null;
  target_brief?: string | null;
  intent_signals?: string[] | null;
  selected_opl_profile_refs?: string[] | null;
  profile_selection_rationale?: string | null;
  profile_requirement_refs?: string[] | null;
  reference_design_source_refs?: string[] | null;
  reference_design_pattern_notes?: string[] | null;
  reference_design_pattern_packet_refs?: string[] | null;
  research_source_refs?: string[] | null;
  expert_practice_notes?: string[] | null;
  research_synthesis_refs?: string[] | null;
};

export type ProfileSelectionMode = 'builtin_profile' | 'source_derived_design' | 'research_driven_design' | 'hybrid';

export type AgentPackPlanOptions = {
  stageId?: string;
  actionId?: string;
  promptPath?: string;
  skillPath?: string;
  knowledgePath?: string;
  toolPath?: string;
  qualityGatePath?: string;
};

const DOMAIN_PACK_SECTIONS: DomainPackSection[] = [
  {
    section: 'prompts',
    dir: 'agent/prompts',
    refsField: 'prompt_policy_refs',
    refKind: 'prompt_policy_ref',
  },
  {
    section: 'stages',
    dir: 'agent/stages',
    refsField: 'stage_policy_refs',
    refKind: 'stage_policy_ref',
  },
  {
    section: 'skills',
    dir: 'agent/skills',
    refsField: 'skill_policy_refs',
    refKind: 'skill_policy_ref',
  },
  {
    section: 'quality_gates',
    dir: 'agent/quality_gates',
    refsField: 'quality_gate_refs',
    refKind: 'quality_gate_ref',
  },
  {
    section: 'knowledge',
    dir: 'agent/knowledge',
    refsField: 'knowledge_policy_refs',
    refKind: 'knowledge_policy_ref',
  },
];

const placeholderPattern = new RegExp(`\\b(?:TO${'DO'}|T${'BD'})\\b`, 'i');

export const EVIDENCE_GROUNDED_DECISION_AGENT_PROFILE_REF =
  'opl-profile:evidence_grounded_decision_agent_profile.v1';

const LEGACY_EVIDENCE_GROUNDED_DECISION_AGENT_PROFILE_REF =
  'contracts/opl-framework/evidence-grounded-decision-agent-profile.json';

export const SOURCE_DERIVED_DESIGN_PROFILE_ROUTE_REF =
  'opl-profile-route:source_derived_design_profile_route.v1';

const SOURCE_DERIVED_DESIGN_PROFILE_ROUTE_ID =
  'source_derived_design_profile_route.v1';

export const RESEARCH_DRIVEN_DESIGN_PROFILE_ROUTE_REF =
  'opl-profile-route:research_driven_design_profile_route.v1';

const RESEARCH_DRIVEN_DESIGN_PROFILE_ROUTE_ID =
  'research_driven_design_profile_route.v1';

const EVIDENCE_GROUNDED_PROFILE_REQUIREMENTS = {
  required_stage_archetypes: [
    'material_or_case_intake',
    'structured_extraction',
    'enrichment',
    'mode_routing',
    'evidence_and_tool_execution',
    'synthesis',
    'independent_review_or_human_gate',
    'decision_support_artifact_with_evidence_trace',
  ],
  required_capability_kinds: [
    'stage_prompt',
    'tool_connector',
    'reference_pack',
    'contract_module',
  ],
  required_surface_roles: [
    'stage_prompt',
    'tool_connector',
    'knowledge_pack',
    'quality_gate',
    'eval_suite',
  ],
  required_evidence_objects: [
    'WorkItem',
    'StructuredInput',
    'ModeRoutingReceipt',
    'RetrievalPacket',
    'ToolResultEnvelope',
    'EvidencePacket',
    'SynthesisPacket',
    'IndependentReviewReceipt',
    'DecisionSupportArtifact',
    'HumanGateDecision',
    'UnsupportedEvidenceBlocker',
  ],
  required_reference_pack_roles: [
    'guideline_or_reference_pack',
    'evidence_source_freshness_policy',
    'provenance_and_scope_policy',
  ],
};

const SOURCE_DERIVED_DESIGN_PROFILE_REQUIREMENTS = {
  required_stage_archetypes: [
    'source_material_intake',
    'reference_design_pattern_extraction',
    'transferable_pattern_mapping',
    'capability_plan_synthesis',
    'authority_boundary_review',
  ],
  required_capability_kinds: [
    'stage_prompt',
    'tool_connector',
    'reference_pack',
    'contract_module',
  ],
  required_surface_roles: [
    'stage_prompt',
    'tool_connector',
    'knowledge_pack',
    'quality_gate',
    'eval_suite',
  ],
  required_reference_pack_roles: [
    'reference_design_source',
    'reference_design_pattern_packet',
    'transferable_pattern_map',
  ],
};

const RESEARCH_DRIVEN_DESIGN_PROFILE_REQUIREMENTS = {
  required_stage_archetypes: [
    'intent_clarification',
    'expert_practice_research',
    'research_synthesis',
    'transferable_pattern_mapping',
    'capability_plan_synthesis',
    'authority_boundary_review',
  ],
  required_capability_kinds: [
    'stage_prompt',
    'tool_connector',
    'reference_pack',
    'contract_module',
  ],
  required_surface_roles: [
    'stage_prompt',
    'tool_connector',
    'knowledge_pack',
    'quality_gate',
    'eval_suite',
  ],
  required_reference_pack_roles: [
    'research_source_ref',
    'expert_practice_note',
    'research_synthesis_packet',
    'transferable_pattern_map',
  ],
};

function stringList(value: string[] | null | undefined): string[] {
  return Array.isArray(value) ? value.filter((entry) => entry.trim()).map((entry) => entry.trim()) : [];
}

function hasReferenceDesignInput(targetAgent: MinimalTargetAgent): boolean {
  return stringList(targetAgent.reference_design_source_refs).length > 0
    || stringList(targetAgent.reference_design_pattern_notes).length > 0
    || stringList(targetAgent.reference_design_pattern_packet_refs).length > 0;
}

function hasResearchDrivenDesignInput(targetAgent: MinimalTargetAgent): boolean {
  return stringList(targetAgent.research_source_refs).length > 0
    || stringList(targetAgent.expert_practice_notes).length > 0
    || stringList(targetAgent.research_synthesis_refs).length > 0;
}

function referenceDesignObjectRefs(targetAgent: MinimalTargetAgent): JsonObject | null {
  if (!hasReferenceDesignInput(targetAgent)) {
    return null;
  }
  return {
    reference_design_packet_ref: `reference-design-packet:opl-meta-agent/${targetAgent.domain_id}`,
    transfer_map_ref: `transfer-map:opl-meta-agent/${targetAgent.domain_id}`,
    agent_pack_plan_ref: `agent-pack-plan:opl-meta-agent/${targetAgent.domain_id}`,
  };
}

function researchSynthesisObjectRefs(targetAgent: MinimalTargetAgent): JsonObject | null {
  if (!hasResearchDrivenDesignInput(targetAgent)) {
    return null;
  }
  return {
    research_synthesis_packet_ref: `research-synthesis-packet:opl-meta-agent/${targetAgent.domain_id}`,
    transfer_map_ref: `transfer-map:opl-meta-agent/${targetAgent.domain_id}`,
    agent_pack_plan_ref: `agent-pack-plan:opl-meta-agent/${targetAgent.domain_id}`,
  };
}

function designObjectRefs(targetAgent: MinimalTargetAgent): JsonObject | null {
  const referenceRefs = referenceDesignObjectRefs(targetAgent);
  if (referenceRefs) {
    return {
      ...referenceRefs,
      design_basis_kind: 'source_derived_design',
      design_basis_ref: referenceRefs.reference_design_packet_ref,
    };
  }
  const researchRefs = researchSynthesisObjectRefs(targetAgent);
  return researchRefs
    ? {
        ...researchRefs,
        design_basis_kind: 'research_driven_design',
        design_basis_ref: researchRefs.research_synthesis_packet_ref,
      }
    : null;
}

function expertPracticeNoteRef(targetAgent: MinimalTargetAgent, index: number): string {
  return `expert-practice-note:${targetAgent.domain_id}/${index + 1}`;
}

function researchSourcePatternRef(targetAgent: MinimalTargetAgent, index: number): string {
  return `research-source-ref:${targetAgent.domain_id}/${index + 1}`;
}

function referenceDesignPatternInputs(targetAgent: MinimalTargetAgent): JsonObject[] {
  const patterns = resolveReferenceDesignWorkflowPatterns(targetAgent);
  const userPatterns = patterns.filter((pattern) => pattern.pattern_origin === 'user_typed_pattern_packet');
  return userPatterns.length > 0 ? userPatterns : patterns;
}

function researchDrivenPatternInputs(targetAgent: MinimalTargetAgent): JsonObject[] {
  return [
    ...stringList(targetAgent.research_synthesis_refs).map((synthesisRef, index) => ({
      pattern_id: `research-synthesis-${index + 1}`,
      source_pattern_ref: synthesisRef,
      source_kind: 'research_synthesis_packet',
      pattern_summary_ref: synthesisRef,
      transferable_workflow_steps: [{
        step_id: `research-synthesis-${index + 1}`,
        expert_question: `What expert workflow is supported by ${synthesisRef}?`,
        stage_archetype: 'expert_practice_synthesis',
        provenance_kind: 'internal_synthesis',
        source_anchor_refs: [synthesisRef],
      }],
    })),
    ...stringList(targetAgent.expert_practice_notes).map((note, index) => ({
      pattern_id: `expert-practice-note-${index + 1}`,
      source_pattern_ref: expertPracticeNoteRef(targetAgent, index),
      source_kind: 'expert_practice_note',
      pattern_summary: note,
      transferable_workflow_steps: [{
        step_id: `expert-practice-note-${index + 1}`,
        expert_question: note,
        stage_archetype: 'expert_practice_synthesis',
        provenance_kind: 'internal_synthesis',
        source_anchor_refs: [expertPracticeNoteRef(targetAgent, index)],
      }],
    })),
    ...stringList(targetAgent.research_source_refs).map((sourceRef, index) => ({
      pattern_id: `research-source-${index + 1}`,
      source_pattern_ref: researchSourcePatternRef(targetAgent, index),
      source_kind: 'research_source_ref',
      source_ref: sourceRef,
      pattern_summary_ref: sourceRef,
      transferable_workflow_steps: [{
        step_id: `research-source-${index + 1}`,
        expert_question: `What expert workflow evidence can be synthesized from ${sourceRef}?`,
        stage_archetype: 'expert_practice_synthesis',
        provenance_kind: 'internal_synthesis',
        source_anchor_refs: [researchSourcePatternRef(targetAgent, index)],
      }],
    })),
  ];
}

function activeDesignPatternInputs(targetAgent: MinimalTargetAgent): JsonObject[] {
  return hasReferenceDesignInput(targetAgent)
    ? referenceDesignPatternInputs(targetAgent)
    : researchDrivenPatternInputs(targetAgent);
}

function buildExtractableDesignAspects(
  refs: JsonObject,
  patterns: JsonObject[],
): JsonObject[] {
  return buildReferenceDesignAspects(refs, patterns);
}

export function buildReferenceDesignPacket(targetAgent: MinimalTargetAgent): JsonObject | null {
  const refs = referenceDesignObjectRefs(targetAgent);
  return refs ? buildReferenceDesignPacketContent(targetAgent, refs) : null;
}

export function buildResearchSynthesisPacket(targetAgent: MinimalTargetAgent): JsonObject | null {
  const refs = researchSynthesisObjectRefs(targetAgent);
  if (!refs) {
    return null;
  }
  const transferableDesignPatterns = researchDrivenPatternInputs(targetAgent);
  return {
    surface_kind: 'opl_meta_agent_research_synthesis_packet',
    version: 'opl-meta-agent.research-synthesis-packet.v1',
    packet_ref: refs.research_synthesis_packet_ref,
    target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
    intent_signals: stringList(targetAgent.intent_signals),
    research_source_refs: stringList(targetAgent.research_source_refs),
    expert_practice_notes: stringList(targetAgent.expert_practice_notes),
    research_synthesis_refs: stringList(targetAgent.research_synthesis_refs),
    transferable_design_patterns: transferableDesignPatterns,
    extractable_design_aspects: buildExtractableDesignAspects(refs, transferableDesignPatterns),
    non_transferable_constraints: [
      'researched_public_practice_is_not_target_domain_truth',
      'external_runtime_or_scheduler_not_importable',
      'external_private_data_not_importable',
      'external_owner_receipt_or_promotion_authority_not_importable',
    ],
    source_body_policy: {
      refs_only: true,
      source_bodies_copied: false,
      research_bodies_copied: false,
      synthesis_body_required_for_target_truth: false,
      extracted_pattern_refs_required: true,
      route_back_when_expert_practice_synthesis_is_missing: true,
    },
  };
}

export function buildTransferMap(
  targetAgent: MinimalTargetAgent,
  options: AgentPackPlanOptions = {},
): JsonObject | null {
  const refs = designObjectRefs(targetAgent);
  if (!refs) {
    return null;
  }
  const fallbackStageId = options.stageId ?? 'agent-output-draft';
  const actionId = options.actionId ?? 'draft-agent-output';
  return {
    surface_kind: 'opl_meta_agent_transfer_map',
    version: 'opl-meta-agent.transfer-map.v1',
    transfer_map_ref: refs.transfer_map_ref,
    reference_design_packet_ref: refs.reference_design_packet_ref ?? null,
    research_synthesis_packet_ref: refs.research_synthesis_packet_ref ?? null,
    design_basis_ref: refs.design_basis_ref,
    design_basis_kind: refs.design_basis_kind,
    target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
    mappings: buildWorkflowTransferMappings({
      targetAgent,
      patterns: activeDesignPatternInputs(targetAgent),
      fallbackStageId,
      actionId,
    }),
  };
}

export function buildAgentPackPlan(
  targetAgent: MinimalTargetAgent,
  options: AgentPackPlanOptions = {},
): JsonObject | null {
  const refs = designObjectRefs(targetAgent);
  const transferMap = buildTransferMap(targetAgent, options);
  if (!refs || !transferMap) {
    return null;
  }
  const stageId = options.stageId ?? 'agent-output-draft';
  const actionId = options.actionId ?? 'draft-agent-output';
  const toolPath = options.toolPath ?? 'agent/tools/domain_affordances.md';
  const withStageFiles = (stage: JsonObject): JsonObject => ({
    ...stage,
    prompt_ref: `agent/prompts/${stage.stage_id}.md`,
    stage_path: `agent/stages/${stage.stage_id}.md`,
    skill_ref: `agent/skills/${stage.stage_id}-skill.md`,
    knowledge_refs: [`agent/knowledge/${stage.stage_id}-knowledge.md`],
    tool_refs: [toolPath],
    quality_gate_refs: [`agent/quality_gates/${stage.stage_id}-quality-gate.md`],
  });
  const sourcePatternStageRefs = buildWorkflowStagePlans(targetAgent, activeDesignPatternInputs(targetAgent))
    .map(withStageFiles);
  const ownerGateStage = withStageFiles({
    stage_id: `${stageId}-owner-gate`,
    stage_ref: `stage:${targetAgent.domain_id}/${stageId}-owner-gate`,
    stage_archetype: 'owner_handoff_gate',
    stage_goal: 'Route the candidate Agent Pack to the target owner without claiming target quality, readiness, or acceptance.',
    origin: 'target_only_requirement',
    target_only_requirement_ref:
      `target-only-requirement:${targetAgent.domain_id}/owner-gated-closeout`,
  });
  const plannedStages = [...sourcePatternStageRefs, ownerGateStage];
  return {
    surface_kind: 'opl_meta_agent_agent_pack_plan',
    version: 'opl-meta-agent.agent-pack-plan.v1',
    plan_ref: refs.agent_pack_plan_ref,
    reference_design_packet_ref: refs.reference_design_packet_ref ?? null,
    research_synthesis_packet_ref: refs.research_synthesis_packet_ref ?? null,
    design_basis_ref: refs.design_basis_ref,
    design_basis_kind: refs.design_basis_kind,
    transfer_map_ref: refs.transfer_map_ref,
    target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
    planned_stage_refs: plannedStages,
    planned_control_refs: [
      'contracts/stage_control_plane.json',
      'contracts/action_catalog.json',
      'contracts/artifact_morphology_contract.json',
      'contracts/stage_native_artifact_contract.json',
      `contracts/schemas/${actionId}.input.schema.json`,
      `contracts/schemas/${actionId}.output.schema.json`,
    ],
    planned_capability_refs: [
      'contracts/capability_map.json#/primary_skill_capability',
      `action-ref:${actionId}`,
      ...plannedStages.map((stage) => `domain-skill-ref:${stage.skill_ref}`),
    ],
    planned_knowledge_refs: plannedStages.flatMap((stage) => stage.knowledge_refs),
    planned_tool_refs: [toolPath],
    planned_quality_gate_refs: plannedStages.flatMap((stage) => stage.quality_gate_refs),
    source_pattern_ref_requirements: [
      refs.design_basis_ref,
      refs.transfer_map_ref,
      refs.agent_pack_plan_ref,
    ],
  };
}

export function buildDesignAdmissionReceipt(
  targetAgent: MinimalTargetAgent,
  options: AgentPackPlanOptions = {},
): JsonObject | null {
  const sourceDerivedDesignReceipt = buildSourceDerivedDesignReceipt(targetAgent);
  const researchDrivenDesignReceipt = buildResearchDrivenDesignReceipt(targetAgent);
  const referenceDesignPacket = buildReferenceDesignPacket(targetAgent);
  const researchSynthesisPacket = buildResearchSynthesisPacket(targetAgent);
  const transferMap = buildTransferMap(targetAgent, options);
  const agentPackPlan = buildAgentPackPlan(targetAgent, options);
  const designReceipt = sourceDerivedDesignReceipt ?? researchDrivenDesignReceipt;
  const designPacket = referenceDesignPacket ?? researchSynthesisPacket;
  if (!designReceipt || !designPacket || !transferMap || !agentPackPlan) {
    return null;
  }
  const designBasisKind = sourceDerivedDesignReceipt ? 'source_derived_design' : 'research_driven_design';
  const designBasisObject = sourceDerivedDesignReceipt ? 'ReferenceDesignPacket' : 'ResearchSynthesisPacket';
  const mappings = Array.isArray(transferMap.mappings) ? transferMap.mappings as JsonObject[] : [];
  const plannedStages = Array.isArray(agentPackPlan.planned_stage_refs)
    ? agentPackPlan.planned_stage_refs as JsonObject[]
    : [];
  const designDerivedStageRefs = plannedStages
    .filter((stage) => stage.origin === 'source_pattern_ref')
    .map((stage) => ({
      stage_id: stage.stage_id,
      stage_ref: stage.stage_ref,
      pattern_id: stage.pattern_id,
      step_id: stage.step_id,
      provenance_kind: stage.provenance_kind,
      ...(typeof stage.source_authority_tier === 'string' && stage.source_authority_tier.trim()
        ? { source_authority_tier: stage.source_authority_tier.trim() }
        : {}),
      source_pattern_ref: stage.source_pattern_ref,
      source_anchor_refs: stage.source_anchor_refs,
      ...(Array.isArray(stage.resolved_source_anchors) && stage.resolved_source_anchors.length > 0
        ? { resolved_source_anchors: stage.resolved_source_anchors }
        : {}),
    }));
  const selectedProfileRefs = stringList(targetAgent.selected_opl_profile_refs);
  return {
    surface_kind: 'opl_meta_agent_design_admission_receipt',
    version: 'opl-meta-agent.design-admission-receipt.v1',
    receipt_id: `design-admission-receipt:opl-meta-agent/${targetAgent.domain_id}`,
    receipt_ref: `design-admission-receipt-ref:opl-meta-agent/${targetAgent.domain_id}`,
    target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
    design_basis_kind: designBasisKind,
    profile_selection_mode: buildProfileSelectionMode(targetAgent),
    selected_profile_refs: selectedProfileRefs,
    lower_bound_opl_profile_refs: selectedProfileRefs.length > 0
      ? selectedProfileRefs
      : [String(designReceipt.route_ref)],
    source_derived_design_receipt_ref: sourceDerivedDesignReceipt?.receipt_ref ?? null,
    research_driven_design_receipt_ref: researchDrivenDesignReceipt?.receipt_ref ?? null,
    reference_design_packet_ref: referenceDesignPacket?.packet_ref ?? null,
    research_synthesis_packet_ref: researchSynthesisPacket?.packet_ref ?? null,
    design_basis_ref: designPacket.packet_ref,
    transfer_map_ref: transferMap.transfer_map_ref,
    agent_pack_plan_ref: agentPackPlan.plan_ref,
    required_design_objects: [
      designBasisObject,
      'TransferMap',
      'AgentPackPlan',
    ],
    required_admission_receipts: ['DesignAdmissionReceipt'],
    design_derived_stage_refs: designDerivedStageRefs,
    source_derived_stage_refs: designDerivedStageRefs,
    target_only_requirement_refs: plannedStages
      .filter((stage) => stage.origin === 'target_only_requirement')
      .map((stage) => String(stage.target_only_requirement_ref))
      .filter((entry) => entry.trim()),
    rejected_source_pattern_refs: mappings
      .filter((mapping) => mapping.disposition === 'reject')
      .map((mapping) => String(mapping.source_anchor_ref))
      .filter((entry) => entry.trim()),
    pattern_dispositions: referenceDesignPacket?.pattern_dispositions ?? [],
    transferable_pattern_requirements: buildTransferablePatternRequirements(targetAgent),
    capability_plan_requirements: buildCapabilityPlanRequirements(targetAgent),
    forbidden_claims: [
      'target_domain_ready',
      'production_ready',
      'owner_accepted',
      'quality_or_export_approved',
      'runtime_live_promoted',
    ],
    authority_boundary: {
      refs_only: true,
      oma_role: 'design_admission_gate_refs_only',
      target_domain_owner_keeps_truth_quality_artifact_authority: true,
      can_copy_external_runtime: false,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_create_target_owner_receipt: false,
      can_promote_live_or_default_agent: false,
    },
  };
}

export function buildAgentBuildReceipt(
  targetAgent: MinimalTargetAgent,
  options: AgentPackPlanOptions = {},
): JsonObject | null {
  const sourceDerivedDesignReceipt = buildSourceDerivedDesignReceipt(targetAgent);
  const researchDrivenDesignReceipt = buildResearchDrivenDesignReceipt(targetAgent);
  const referenceDesignPacket = buildReferenceDesignPacket(targetAgent);
  const researchSynthesisPacket = buildResearchSynthesisPacket(targetAgent);
  const transferMap = buildTransferMap(targetAgent, options);
  const agentPackPlan = buildAgentPackPlan(targetAgent, options);
  const designAdmissionReceipt = buildDesignAdmissionReceipt(targetAgent, options);
  const designReceipt = sourceDerivedDesignReceipt ?? researchDrivenDesignReceipt;
  const designPacket = referenceDesignPacket ?? researchSynthesisPacket;
  if (!designReceipt || !designPacket || !transferMap || !agentPackPlan || !designAdmissionReceipt) {
    return null;
  }
  const selectedProfileRefs = stringList(targetAgent.selected_opl_profile_refs);
  return {
    surface_kind: 'opl_meta_agent_build_receipt',
    receipt_kind: 'AgentBuildReceipt',
    version: 'opl-meta-agent.agent-build-receipt.v1',
    receipt_id: `build-receipt:opl-meta-agent/${targetAgent.domain_id}`,
    receipt_ref: buildAgentBuildReceiptRef(targetAgent),
    target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
    build_source_kind: sourceDerivedDesignReceipt ? 'source_derived_design' : 'research_driven_design',
    build_mode: sourceDerivedDesignReceipt ? 'source_derived_design' : 'research_driven_design',
    profile_selection_mode: buildProfileSelectionMode(targetAgent),
    selected_profile_refs: selectedProfileRefs,
    lower_bound_opl_profile_refs: selectedProfileRefs.length > 0
      ? selectedProfileRefs
      : [String(designReceipt.route_ref)],
    source_derived_design_receipt_ref: sourceDerivedDesignReceipt?.receipt_ref ?? null,
    research_driven_design_receipt_ref: researchDrivenDesignReceipt?.receipt_ref ?? null,
    design_admission_receipt_ref: designAdmissionReceipt.receipt_ref,
    reference_design_packet_ref: referenceDesignPacket?.packet_ref ?? null,
    research_synthesis_packet_ref: researchSynthesisPacket?.packet_ref ?? null,
    design_basis_ref: designPacket.packet_ref,
    transfer_map_ref: transferMap.transfer_map_ref,
    agent_pack_plan_ref: agentPackPlan.plan_ref,
    required_design_objects: designAdmissionReceipt.required_design_objects,
    required_admission_receipts: ['DesignAdmissionReceipt'],
    design_derived_stage_refs: designAdmissionReceipt.design_derived_stage_refs,
    source_derived_stage_refs: designAdmissionReceipt.design_derived_stage_refs,
    target_only_requirement_refs: designAdmissionReceipt.target_only_requirement_refs,
    rejected_source_pattern_refs: designAdmissionReceipt.rejected_source_pattern_refs,
    pattern_dispositions: designAdmissionReceipt.pattern_dispositions,
    transferable_pattern_requirements: buildTransferablePatternRequirements(targetAgent),
    capability_plan_requirements: buildCapabilityPlanRequirements(targetAgent),
    forbidden_claims: designAdmissionReceipt.forbidden_claims,
    authority_boundary: {
      refs_only: true,
      oma_role: 'agent_build_receipt_author_refs_only',
      target_domain_owner_keeps_truth_quality_artifact_authority: true,
      can_copy_external_runtime: false,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_create_target_owner_receipt: false,
      can_promote_live_or_default_agent: false,
    },
  };
}

export function buildAgentBuildReceiptRef(targetAgent: MinimalTargetAgent): string {
  return `build-receipt-ref:opl-meta-agent/${targetAgent.domain_id}`;
}

export function buildStageDecompositionSubpacketSet(
  targetAgent: MinimalTargetAgent,
  options: AgentPackPlanOptions = {},
): JsonObject | null {
  const referenceDesignPacket = buildReferenceDesignPacket(targetAgent);
  const researchSynthesisPacket = buildResearchSynthesisPacket(targetAgent);
  const transferMap = buildTransferMap(targetAgent, options);
  const agentPackPlan = buildAgentPackPlan(targetAgent, options);
  const designAdmissionReceipt = buildDesignAdmissionReceipt(targetAgent, options);
  const designBasisPacket = referenceDesignPacket ?? researchSynthesisPacket;
  if (!designBasisPacket || !transferMap || !agentPackPlan || !designAdmissionReceipt) {
    return null;
  }
  const designBasisKind = referenceDesignPacket ? 'source_derived_design' : 'research_driven_design';
  const designBasisObject = referenceDesignPacket ? 'ReferenceDesignPacket' : 'ResearchSynthesisPacket';
  const designBasisPacketRef = String(designBasisPacket.packet_ref);
  const transferMapRef = String(transferMap.transfer_map_ref);
  const agentPackPlanRef = String(agentPackPlan.plan_ref);
  const designAdmissionReceiptRef = String(designAdmissionReceipt.receipt_ref);
  const buildReceiptRef = buildAgentBuildReceiptRef(targetAgent);
  return {
    surface_kind: 'opl_meta_agent_stage_decomposition_subpacket_set',
    version: 'opl-meta-agent.stage-decomposition-subpacket-set.v1',
    packet_set_ref: `stage-decomposition-subpacket-set:opl-meta-agent/${targetAgent.domain_id}`,
    stage_id: 'stage-decomposition',
    target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
    profile_selection_mode: buildProfileSelectionMode(targetAgent),
    design_basis_kind: designBasisKind,
    design_basis_object: designBasisObject,
    design_basis_packet_ref: designBasisPacketRef,
    reference_design_packet_ref: referenceDesignPacket?.packet_ref ?? null,
    research_synthesis_packet_ref: researchSynthesisPacket?.packet_ref ?? null,
    transfer_map_ref: transferMapRef,
    agent_pack_plan_ref: agentPackPlanRef,
    design_admission_receipt_ref: designAdmissionReceiptRef,
    build_receipt_ref: buildReceiptRef,
    cognitive_step_packets: [
      {
        step_id: 'design-basis',
        packet_kind: designBasisObject,
        packet_ref: designBasisPacketRef,
        open_judgment_owned_by: 'codex_cli',
        machine_validation: 'non_empty_transferable_patterns_and_extractable_design_aspects',
      },
      {
        step_id: 'transfer-planning',
        packet_kind: 'TransferMap',
        packet_ref: transferMapRef,
        open_judgment_owned_by: 'codex_cli',
        machine_validation: 'non_empty_adopt_adapt_reject_mappings',
      },
      {
        step_id: 'agent-pack-planning',
        packet_kind: 'AgentPackPlan',
        packet_ref: agentPackPlanRef,
        open_judgment_owned_by: 'codex_cli',
        machine_validation: 'planned_stage_refs_and_capability_refs_present',
      },
      {
        step_id: 'design-admission',
        packet_kind: 'DesignAdmissionReceipt',
        packet_ref: designAdmissionReceiptRef,
        open_judgment_owned_by: 'validator',
        machine_validation: 'design_refs_stage_refs_rejected_patterns_forbidden_claims_boundary',
      },
      {
        step_id: 'build-verification',
        packet_kind: 'AgentBuildReceipt',
        packet_ref: buildReceiptRef,
        open_judgment_owned_by: 'validator',
        machine_validation: 'post_materialization_trace_to_design_admission',
      },
    ],
    materialization_boundary: {
      packet_set_is_materialization_source_of_truth: true,
      generated_files_are_projection_surface: true,
      ai_freeform_file_bodies_are_design_source_of_truth: false,
      final_files_must_trace_to_agent_pack_plan: true,
      build_receipt_is_post_materialization_proof: true,
    },
    fail_closed_checks: [
      'design_basis_packet_present',
      'transfer_map_present',
      'agent_pack_plan_present',
      'design_admission_receipt_present_before_materialization',
      'agent_build_receipt_present_after_materialization',
      'generated_files_trace_to_agent_pack_plan',
    ],
  };
}

function buildReferenceDesignBoundary(targetAgent: MinimalTargetAgent): JsonObject {
  const refs = designObjectRefs(targetAgent);
  return {
    source_refs: stringList(targetAgent.reference_design_source_refs),
    pattern_notes: stringList(targetAgent.reference_design_pattern_notes),
    pattern_packet_refs: stringList(targetAgent.reference_design_pattern_packet_refs),
    research_source_refs: stringList(targetAgent.research_source_refs),
    expert_practice_notes: stringList(targetAgent.expert_practice_notes),
    research_synthesis_refs: stringList(targetAgent.research_synthesis_refs),
    reference_design_packet_ref: refs?.reference_design_packet_ref ?? null,
    research_synthesis_packet_ref: refs?.research_synthesis_packet_ref ?? null,
    design_basis_ref: refs?.design_basis_ref ?? null,
    design_basis_kind: refs?.design_basis_kind ?? null,
    transfer_map_ref: refs?.transfer_map_ref ?? null,
    agent_pack_plan_ref: refs?.agent_pack_plan_ref ?? null,
    design_admission_receipt_ref: refs
      ? `design-admission-receipt-ref:opl-meta-agent/${targetAgent.domain_id}`
      : null,
    hard_gate_required: refs !== null,
    role: 'external_architecture_or_research_inspiration_not_target_domain_truth',
    may_inform_stage_graph: true,
    may_inform_quality_gate_design: true,
    may_inform_foundry_evaluation_request: true,
    can_copy_external_runtime: false,
    can_write_target_domain_truth: false,
    can_replace_target_owner_judgment: false,
  };
}

function hasSourceDerivedDesign(targetAgent: MinimalTargetAgent): boolean {
  return hasReferenceDesignInput(targetAgent);
}

export function buildProfileSelectionMode(targetAgent: MinimalTargetAgent): ProfileSelectionMode {
  const hasBuiltinProfile = stringList(targetAgent.selected_opl_profile_refs).length > 0;
  const hasSourceDesign = hasSourceDerivedDesign(targetAgent);
  const hasResearchDesign = hasResearchDrivenDesignInput(targetAgent);
  if (hasBuiltinProfile && (hasSourceDesign || hasResearchDesign)) {
    return 'hybrid';
  }
  if (hasSourceDesign) {
    return 'source_derived_design';
  }
  if (hasResearchDesign) {
    return 'research_driven_design';
  }
  return 'builtin_profile';
}

export function buildTransferablePatternRequirements(targetAgent: MinimalTargetAgent): string[] {
  if (hasSourceDerivedDesign(targetAgent)) {
    return [
      'preserve_reference_design_packet_transfer_map_and_agent_pack_plan_refs',
      'extract_transferable_stage_graph_inputs_outputs_grounding_evaluation_handoff_failure_taxonomy',
      'reject_external_runtime_private_data_domain_truth_verdict_or_promotion_authority_imports',
    ];
  }
  return hasResearchDrivenDesignInput(targetAgent)
    ? [
        'preserve_research_synthesis_packet_transfer_map_and_agent_pack_plan_refs',
        'synthesize_expert_practice_research_into_stage_graph_grounding_evaluation_handoff_failure_taxonomy',
        'reject_public_research_as_target_truth_owner_verdict_or_promotion_authority',
      ]
    : [];
}

export function buildCapabilityPlanRequirements(targetAgent: MinimalTargetAgent): string[] {
  if (hasSourceDerivedDesign(targetAgent)) {
    return [
      'map_transferable_patterns_into_stage_control_plane_prompt_knowledge_quality_gate_and_foundry_evaluation_request',
      'mark_each_planned_stage_as_source_pattern_ref_or_target_only_requirement',
      'preserve_owner_boundary_and_refs_only_source_design_receipt',
      'route_back_when_reference_design_packet_is_insufficient_for_target_agent_design',
    ];
  }
  return hasResearchDrivenDesignInput(targetAgent)
    ? [
        'map_researched_expert_practice_into_stage_control_plane_prompt_knowledge_quality_gate_and_foundry_evaluation_request',
        'mark_each_planned_stage_as_research_pattern_ref_or_target_only_requirement',
        'preserve_owner_boundary_and_refs_only_research_design_receipt',
        'route_back_when_research_synthesis_is_insufficient_for_target_agent_design',
      ]
    : [];
}

export function buildSourceDerivedDesignReceipt(targetAgent: MinimalTargetAgent): JsonObject | null {
  if (!hasSourceDerivedDesign(targetAgent)) {
    return null;
  }
  const refs = referenceDesignObjectRefs(targetAgent);
  return {
    surface_kind: 'opl_meta_agent_source_derived_design_receipt',
    version: 'opl-meta-agent.source-derived-design-receipt.v1',
    route_id: SOURCE_DERIVED_DESIGN_PROFILE_ROUTE_ID,
    route_ref: SOURCE_DERIVED_DESIGN_PROFILE_ROUTE_REF,
    receipt_id: `source-derived-design-receipt:opl-meta-agent/${targetAgent.domain_id}`,
    receipt_ref: `source-derived-design-receipt-ref:opl-meta-agent/${targetAgent.domain_id}`,
    target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
    source_refs: stringList(targetAgent.reference_design_source_refs),
    pattern_notes: stringList(targetAgent.reference_design_pattern_notes),
    reference_design_pattern_packet_refs: stringList(targetAgent.reference_design_pattern_packet_refs),
    reference_design_packet_ref: refs?.reference_design_packet_ref,
    transfer_map_ref: refs?.transfer_map_ref,
    agent_pack_plan_ref: refs?.agent_pack_plan_ref,
    design_admission_receipt_ref: `design-admission-receipt-ref:opl-meta-agent/${targetAgent.domain_id}`,
    required_design_objects: [
      'ReferenceDesignPacket',
      'TransferMap',
      'AgentPackPlan',
    ],
    required_admission_receipts: ['DesignAdmissionReceipt'],
    required_machine_objects: [
      'ReferenceDesignPacket',
      'TransferMap',
      'AgentPackPlan',
    ],
    profile_requirements: SOURCE_DERIVED_DESIGN_PROFILE_REQUIREMENTS,
    transferable_pattern_requirements: buildTransferablePatternRequirements(targetAgent),
    capability_plan_requirements: buildCapabilityPlanRequirements(targetAgent),
    source_readback_refs: [
      'opl profiles select --intent <target-agent-intent> --reference-source <source-ref> --json',
    ],
    refs_only: true,
    authority_boundary: {
      oma_role: 'source_design_pattern_consumer_and_target_pack_author',
      target_domain_owner_keeps_truth_quality_artifact_authority: true,
      can_copy_external_runtime: false,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_replace_target_owner_judgment: false,
    },
  };
}

export function buildResearchDrivenDesignReceipt(targetAgent: MinimalTargetAgent): JsonObject | null {
  if (!hasResearchDrivenDesignInput(targetAgent)) {
    return null;
  }
  const refs = researchSynthesisObjectRefs(targetAgent);
  return {
    surface_kind: 'opl_meta_agent_research_driven_design_receipt',
    version: 'opl-meta-agent.research-driven-design-receipt.v1',
    route_id: RESEARCH_DRIVEN_DESIGN_PROFILE_ROUTE_ID,
    route_ref: RESEARCH_DRIVEN_DESIGN_PROFILE_ROUTE_REF,
    receipt_id: `research-driven-design-receipt:opl-meta-agent/${targetAgent.domain_id}`,
    receipt_ref: `research-driven-design-receipt-ref:opl-meta-agent/${targetAgent.domain_id}`,
    target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
    research_source_refs: stringList(targetAgent.research_source_refs),
    expert_practice_notes: stringList(targetAgent.expert_practice_notes),
    research_synthesis_refs: stringList(targetAgent.research_synthesis_refs),
    research_synthesis_packet_ref: refs?.research_synthesis_packet_ref,
    transfer_map_ref: refs?.transfer_map_ref,
    agent_pack_plan_ref: refs?.agent_pack_plan_ref,
    design_admission_receipt_ref: `design-admission-receipt-ref:opl-meta-agent/${targetAgent.domain_id}`,
    required_design_objects: [
      'ResearchSynthesisPacket',
      'TransferMap',
      'AgentPackPlan',
    ],
    required_admission_receipts: ['DesignAdmissionReceipt'],
    required_machine_objects: [
      'ResearchSynthesisPacket',
      'TransferMap',
      'AgentPackPlan',
    ],
    profile_requirements: RESEARCH_DRIVEN_DESIGN_PROFILE_REQUIREMENTS,
    transferable_pattern_requirements: buildTransferablePatternRequirements(targetAgent),
    capability_plan_requirements: buildCapabilityPlanRequirements(targetAgent),
    source_readback_refs: [
      'web research / source ingest for expert practice refs',
      'opl profiles select --intent <target-agent-intent> --research-source <source-ref> --json',
    ],
    refs_only: true,
    authority_boundary: {
      oma_role: 'expert_practice_research_consumer_and_target_pack_author',
      target_domain_owner_keeps_truth_quality_artifact_authority: true,
      public_research_is_not_target_truth: true,
      can_copy_external_runtime: false,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_replace_target_owner_judgment: false,
    },
  };
}

function isEvidenceGroundedDecisionProfileRef(ref: string): boolean {
  return ref === EVIDENCE_GROUNDED_DECISION_AGENT_PROFILE_REF
    || ref === 'evidence_grounded_decision_agent_profile.v1'
    || ref === LEGACY_EVIDENCE_GROUNDED_DECISION_AGENT_PROFILE_REF
    || ref.includes('evidence-grounded-decision-agent-profile');
}

function defaultProfileRequirementRefs(selectedProfileRefs: string[]): string[] {
  return selectedProfileRefs.some(isEvidenceGroundedDecisionProfileRef)
    ? [
        'profile-requirement:evidence_grounded_mode_routing.v1',
        'profile-requirement:refs_only_evidence_grounding.v1',
        'profile-requirement:decision_support_human_gate.v1',
        'profile-mode:risk_or_priority_stratification',
      ]
    : [];
}

function mergeRequirementRecords(...records: JsonObject[]): JsonObject {
  const merged: JsonObject = {};
  for (const record of records) {
    Object.entries(record).forEach(([key, value]) => {
      merged[key] = Array.isArray(value)
        ? [
            ...new Set([
              ...stringList(merged[key] as string[] | null | undefined),
              ...stringList(value as string[] | null | undefined),
            ]),
          ]
        : value;
    });
  }
  return merged;
}

export function buildProfileRequirements(targetAgent: MinimalTargetAgent): JsonObject {
  const selectedProfileRefs = stringList(targetAgent.selected_opl_profile_refs);
  return mergeRequirementRecords(
    selectedProfileRefs.some(isEvidenceGroundedDecisionProfileRef)
      ? EVIDENCE_GROUNDED_PROFILE_REQUIREMENTS
      : {},
    hasSourceDerivedDesign(targetAgent)
      ? SOURCE_DERIVED_DESIGN_PROFILE_REQUIREMENTS
      : {},
    !hasSourceDerivedDesign(targetAgent) && hasResearchDrivenDesignInput(targetAgent)
      ? RESEARCH_DRIVEN_DESIGN_PROFILE_REQUIREMENTS
      : {},
  );
}

export function buildProfileSelectionReceipt(targetAgent: MinimalTargetAgent): JsonObject {
  const selectedProfileRefs = stringList(targetAgent.selected_opl_profile_refs);
  const rationale = targetAgent.profile_selection_rationale?.trim() ?? '';
  const sourceDerivedDesignReceipt = buildSourceDerivedDesignReceipt(targetAgent);
  const researchDrivenDesignReceipt = buildResearchDrivenDesignReceipt(targetAgent);
  const referenceDesignPacket = buildReferenceDesignPacket(targetAgent);
  const researchSynthesisPacket = buildResearchSynthesisPacket(targetAgent);
  const transferMap = buildTransferMap(targetAgent);
  const agentPackPlan = buildAgentPackPlan(targetAgent);
  const designAdmissionReceipt = buildDesignAdmissionReceipt(targetAgent);
  const expectedBuildReceiptRef = sourceDerivedDesignReceipt || researchDrivenDesignReceipt
    ? buildAgentBuildReceiptRef(targetAgent)
    : null;
  const stageDecompositionSubpacketSet = buildStageDecompositionSubpacketSet(targetAgent);
  if (selectedProfileRefs.length === 0 && !sourceDerivedDesignReceipt && !researchDrivenDesignReceipt) {
    throw new Error('profile_selection_required:selected_opl_profile_refs_or_design_basis_refs_missing');
  }
  if (selectedProfileRefs.length > 0 && !rationale) {
    throw new Error('profile_selection_required:profile_selection_rationale_missing');
  }
  const profileRequirementRefs = stringList(targetAgent.profile_requirement_refs);
  const profileSelectionMode = buildProfileSelectionMode(targetAgent);
  return {
    surface_kind: 'opl_meta_agent_profile_selection_receipt',
    version: 'opl-meta-agent.profile-selection-receipt.v1',
    receipt_id: `profile-selection-receipt:opl-meta-agent/${targetAgent.domain_id}`,
    receipt_ref: `profile-selection-receipt-ref:opl-meta-agent/${targetAgent.domain_id}`,
    target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
    profile_selection_mode: profileSelectionMode,
    selected_profile_refs: selectedProfileRefs,
    profile_selection_rationale: rationale
      || (researchDrivenDesignReceipt
        ? 'No builtin OPL profile or supplied reference design matched; OMA must research expert practice and derive the target pack from a research synthesis packet.'
        : 'No builtin OPL profile matched; OMA must derive the target pack from supplied source-derived design refs.'),
    profile_requirement_refs: profileRequirementRefs.length > 0
      ? profileRequirementRefs
      : defaultProfileRequirementRefs(selectedProfileRefs),
    profile_requirements: buildProfileRequirements(targetAgent),
    source_derived_design_receipt: sourceDerivedDesignReceipt,
    source_derived_design_receipt_ref: sourceDerivedDesignReceipt?.receipt_ref ?? null,
    research_driven_design_receipt: researchDrivenDesignReceipt,
    research_driven_design_receipt_ref: researchDrivenDesignReceipt?.receipt_ref ?? null,
    reference_design_packet: referenceDesignPacket,
    reference_design_packet_ref: referenceDesignPacket?.packet_ref ?? null,
    research_synthesis_packet: researchSynthesisPacket,
    research_synthesis_packet_ref: researchSynthesisPacket?.packet_ref ?? null,
    transfer_map: transferMap,
    transfer_map_ref: transferMap?.transfer_map_ref ?? null,
    agent_pack_plan: agentPackPlan,
    agent_pack_plan_ref: agentPackPlan?.plan_ref ?? null,
    design_admission_receipt: designAdmissionReceipt,
    design_admission_receipt_ref: designAdmissionReceipt?.receipt_ref ?? null,
    expected_build_receipt_ref: expectedBuildReceiptRef,
    stage_decomposition_subpacket_set: stageDecompositionSubpacketSet,
    stage_decomposition_subpacket_set_ref: stageDecompositionSubpacketSet?.packet_set_ref ?? null,
    stage_decomposition_subpacket_set_refs: stageDecompositionSubpacketSet?.packet_set_ref
      ? [stageDecompositionSubpacketSet.packet_set_ref]
      : [],
    reference_design_pattern_packet_refs: stringList(targetAgent.reference_design_pattern_packet_refs),
    research_source_refs: stringList(targetAgent.research_source_refs),
    expert_practice_notes: stringList(targetAgent.expert_practice_notes),
    research_synthesis_refs: stringList(targetAgent.research_synthesis_refs),
    transferable_pattern_requirements: buildTransferablePatternRequirements(targetAgent),
    capability_plan_requirements: buildCapabilityPlanRequirements(targetAgent),
    profile_catalog_refs: [
      EVIDENCE_GROUNDED_DECISION_AGENT_PROFILE_REF,
      LEGACY_EVIDENCE_GROUNDED_DECISION_AGENT_PROFILE_REF,
      SOURCE_DERIVED_DESIGN_PROFILE_ROUTE_REF,
      RESEARCH_DRIVEN_DESIGN_PROFILE_ROUTE_REF,
      'opl profiles select --intent <target-agent-intent> [--intent-signal <canonical-signal>] --json',
      'opl profiles select --intent <target-agent-intent> --reference-source <source-ref> --json',
      'opl profiles select --intent <target-agent-intent> --research-source <source-ref> --json',
      'opl profiles inspect evidence_grounded_decision_agent_profile.v1 --json',
    ],
    source_readback_refs: [
      LEGACY_EVIDENCE_GROUNDED_DECISION_AGENT_PROFILE_REF,
      'src/modules/pack/evidence-grounded-decision-agent-profile.ts',
      'opl profiles inspect evidence_grounded_decision_agent_profile.v1 --json',
    ],
    refs_only: true,
    authority_boundary: {
      opl_profile_owner: 'one-person-lab',
      oma_role: 'profile_selection_consumer_and_target_pack_author',
      target_domain_owner_keeps_truth_quality_artifact_authority: true,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_create_target_owner_receipt: false,
    },
  };
}

function referenceDesignMarkdown(targetAgent: MinimalTargetAgent): string[] {
  const sourceRefs = stringList(targetAgent.reference_design_source_refs);
  const patternNotes = stringList(targetAgent.reference_design_pattern_notes);
  const patternPacketRefs = stringList(targetAgent.reference_design_pattern_packet_refs);
  if (sourceRefs.length === 0 && patternNotes.length === 0 && patternPacketRefs.length === 0) {
    return [];
  }
  const refs = referenceDesignObjectRefs(targetAgent);
  return [
    '## Reference Design Inputs',
    '',
    'OMA recorded these external refs as design inspiration only; they are not target-domain truth, owner acceptance, or runtime dependencies.',
    ...(refs
      ? [
          `- ReferenceDesignPacket: ${refs.reference_design_packet_ref}`,
          `- TransferMap: ${refs.transfer_map_ref}`,
          `- AgentPackPlan: ${refs.agent_pack_plan_ref}`,
        ]
      : []),
    ...sourceRefs.map((ref) => `- Source ref: ${ref}`),
    ...patternNotes.map((note) => `- Transfer pattern: ${note}`),
    ...patternPacketRefs.map((ref) => `- Pattern packet ref: ${ref}`),
    'Extract transferable architecture, workflow, rubric, handoff, evaluation, and failure-taxonomy patterns into ReferenceDesignPacket -> TransferMap -> AgentPackPlan, pass DesignAdmissionReceipt before materialization, preserve StageDecompositionSubpacketSet, then preserve AgentBuildReceipt after materialization.',
    'Do not copy external runtime ownership, private data, domain verdicts, owner receipts, or promotion authority.',
    '',
  ];
}

function researchSynthesisMarkdown(targetAgent: MinimalTargetAgent): string[] {
  const sourceRefs = stringList(targetAgent.research_source_refs);
  const expertPracticeNotes = stringList(targetAgent.expert_practice_notes);
  const synthesisRefs = stringList(targetAgent.research_synthesis_refs);
  if (sourceRefs.length === 0 && expertPracticeNotes.length === 0 && synthesisRefs.length === 0) {
    return [];
  }
  const refs = researchSynthesisObjectRefs(targetAgent);
  return [
    '## Research-Driven Design Inputs',
    '',
    'OMA recorded these research refs as expert-practice design inspiration only; they are not target-domain truth, owner acceptance, or runtime dependencies.',
    ...(refs
      ? [
          `- ResearchSynthesisPacket: ${refs.research_synthesis_packet_ref}`,
          `- TransferMap: ${refs.transfer_map_ref}`,
          `- AgentPackPlan: ${refs.agent_pack_plan_ref}`,
        ]
      : []),
    ...sourceRefs.map((ref) => `- Research source ref: ${ref}`),
    ...expertPracticeNotes.map((note) => `- Expert practice note: ${note}`),
    ...synthesisRefs.map((ref) => `- Research synthesis ref: ${ref}`),
    'Synthesize expert practice into ResearchSynthesisPacket -> TransferMap -> AgentPackPlan, pass DesignAdmissionReceipt before materialization, preserve StageDecompositionSubpacketSet, then preserve AgentBuildReceipt after materialization.',
    'Do not treat public research, examples, external runtime ownership, domain verdicts, owner receipts, or promotion authority as target truth.',
    '',
  ];
}

function profileSelectionMarkdown(targetAgent: MinimalTargetAgent): string[] {
  const receipt = buildProfileSelectionReceipt(targetAgent);
  const selectedProfileRefs = receipt.selected_profile_refs as string[];
  const sourceReceipt = receipt.source_derived_design_receipt as JsonObject | null;
  const researchReceipt = receipt.research_driven_design_receipt as JsonObject | null;
  return [
    '## OPL Profile Selection',
    '',
    'OMA must consume the OPL profile catalog/readback before generating this target agent. If no builtin profile matches and reference design refs are supplied, derive the target pack from the source-derived pattern packet; if the user only has a vague idea, research expert practice and derive the target pack from a research synthesis packet instead of forcing an existing template.',
    `- Profile selection mode: ${receipt.profile_selection_mode}`,
    ...(selectedProfileRefs.length > 0
      ? selectedProfileRefs.map((ref) => `- Selected profile ref: ${ref}`)
      : [`- Selected profile ref: none; ${researchReceipt ? 'research-driven design refs' : 'source-derived design refs'} are the active design input.`]),
    `- Rationale: ${receipt.profile_selection_rationale}`,
    ...((receipt.profile_requirement_refs as string[]).map((ref) => `- Required capability: ${ref}`)),
    ...(sourceReceipt ? [`- Source-derived design receipt: ${sourceReceipt.receipt_ref}`] : []),
    ...(researchReceipt ? [`- Research-driven design receipt: ${researchReceipt.receipt_ref}`] : []),
    ...(receipt.reference_design_packet_ref ? [`- ReferenceDesignPacket ref: ${receipt.reference_design_packet_ref}`] : []),
    ...(receipt.research_synthesis_packet_ref ? [`- ResearchSynthesisPacket ref: ${receipt.research_synthesis_packet_ref}`] : []),
    ...(receipt.transfer_map_ref ? [`- TransferMap ref: ${receipt.transfer_map_ref}`] : []),
    ...(receipt.agent_pack_plan_ref ? [`- AgentPackPlan ref: ${receipt.agent_pack_plan_ref}`] : []),
    ...(receipt.design_admission_receipt_ref ? [`- DesignAdmissionReceipt ref: ${receipt.design_admission_receipt_ref}`] : []),
    ...(receipt.expected_build_receipt_ref
      ? [`- Expected AgentBuildReceipt ref after materialization: ${receipt.expected_build_receipt_ref}`]
      : []),
    ...(receipt.stage_decomposition_subpacket_set_ref
      ? [`- StageDecompositionSubpacketSet ref: ${receipt.stage_decomposition_subpacket_set_ref}`]
      : []),
    ...((receipt.reference_design_pattern_packet_refs as string[]).map((ref) => `- Pattern packet ref: ${ref}`)),
    ...((receipt.research_source_refs as string[]).map((ref) => `- Research source ref: ${ref}`)),
    ...((receipt.research_synthesis_refs as string[]).map((ref) => `- Research synthesis ref: ${ref}`)),
    ...((receipt.transferable_pattern_requirements as string[]).map((requirement) =>
      `- Transferable pattern requirement: ${requirement}`
    )),
    ...((receipt.capability_plan_requirements as string[]).map((requirement) =>
      `- Capability plan requirement: ${requirement}`
    )),
    '',
  ];
}

const targetPrimarySkillRef = 'agent/primary_skill/SKILL.md';

function policyRef({
  domainId,
  refKind,
  relPath,
}: {
  domainId: string;
  refKind: string;
  relPath: string;
}): string {
  return `${refKind}:${domainId}/${relPath}`;
}

export function readDomainPackSummary(
  repoDir: string,
  { domainId }: { domainId?: string } = {},
): DomainPackSummary {
  const resolvedRepoDir = path.resolve(repoDir);
  const resolvedDomainId = domainId ?? path.basename(resolvedRepoDir);
  const summary: DomainPackSummary = {
    status: 'ready',
    domain_id: resolvedDomainId,
    pack_root: 'agent',
    required_section_count: DOMAIN_PACK_SECTIONS.length,
    required_file_count: 0,
    verified_file_count: 0,
    required_files: [],
    section_file_counts: {},
    prompt_policy_refs: [],
    stage_policy_refs: [],
    skill_policy_refs: [],
    quality_gate_refs: [],
    knowledge_policy_refs: [],
  };

  for (const section of DOMAIN_PACK_SECTIONS) {
    const dirPath = path.join(resolvedRepoDir, section.dir);
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Domain pack directory is missing: ${section.dir}`);
    }
    const relPaths = fs.readdirSync(dirPath)
      .filter((entry) => entry.endsWith('.md'))
      .sort()
      .map((entry) => path.join(section.dir, entry));
    if (relPaths.length === 0) {
      throw new Error(`Domain pack directory has no markdown files: ${section.dir}`);
    }
    summary.section_file_counts[section.section] = relPaths.length;
    summary.required_file_count += relPaths.length;

    for (const relPath of relPaths) {
      const filePath = path.join(resolvedRepoDir, relPath);
      const body = fs.readFileSync(filePath, 'utf8');
      if (!body.trim()) {
        throw new Error(`Domain pack file is empty: ${relPath}`);
      }
      if (placeholderPattern.test(body)) {
        throw new Error(`Domain pack file contains placeholder marker: ${relPath}`);
      }
      const ref = policyRef({
        domainId: resolvedDomainId,
        refKind: section.refKind,
        relPath,
      });
      summary.required_files.push({
        section: section.section,
        path: relPath,
        ref,
        byte_length: Buffer.byteLength(body),
        non_empty: true,
      });
      summary[section.refsField].push(ref);
      summary.verified_file_count += 1;
    }
  }

  return summary;
}

export function domainPackReceiptFields(summary: DomainPackSummary): DomainPackReceiptFields {
  return {
    domain_pack_status: summary.status,
    prompt_policy_refs: summary.prompt_policy_refs,
    skill_policy_refs: summary.skill_policy_refs,
    quality_gate_refs: summary.quality_gate_refs,
    knowledge_policy_refs: summary.knowledge_policy_refs,
  };
}

export function buildTargetAgentPrimarySkillMarkdown(targetAgent: MinimalTargetAgent): string {
  const domainId = targetAgent.domain_id;
  const domainLabel = targetAgent.domain_label ?? domainId;
  const targetBrief = targetAgent.target_brief
    ?? `Create an owner-gated ${domainLabel} delivery from declared workspace refs.`;
  return [
    '---',
    `name: ${domainId}`,
    `description: Use when Codex should operate ${domainLabel} as an OPL-compatible target agent.`,
    '---',
    '',
    `# ${domainLabel}`,
    '',
    '## Purpose',
    '',
    `Use this primary skill to operate the OPL-compatible ${domainLabel} target agent. The target job is: ${targetBrief}`,
    '',
    '## Entry',
    '',
    '- Start from the user-visible requested deliverable, source refs, quality bar, non-goals, and owner boundary.',
    '- Route work through this target agent primary skill before invoking narrower prompt, stage, quality gate, or method refs.',
    '- Keep OPL generated interfaces as carrier and runtime projection surfaces, not as target truth or quality verdicts.',
    '',
    '## Agent Lab And Owner Handoff',
    '',
    '- Preserve descriptor, action catalog, stage control plane, quality gate, capability map, and owner route refs.',
    '- Return Agent Lab evidence, independent reviewer evidence, no-forbidden-write proof, and owner-facing closeout refs.',
    '- When the target cannot proceed without authority, return typed blocker, human gate, route-back, or owner-gated continuation.',
    '',
    ...profileSelectionMarkdown(targetAgent),
    ...referenceDesignMarkdown(targetAgent),
    ...researchSynthesisMarkdown(targetAgent),
    '## Delivery Gate',
    '',
    '- Scaffold exists is not completion.',
    '- Generated interface readiness is not completion.',
    '- Contract or manifest validation is not completion.',
    '- Suite pass is not completion.',
    '- Provider completion is not domain completion.',
    '- Complete delivery requires owner-routable evidence and one accepted closeout outcome: owner receipt, typed blocker, human gate, route-back, or owner-gated continuation.',
    '',
    '## Authority Boundary',
    '',
    '- OPL owns standard runtime, generated / hosted surfaces, package validation, Agent Lab execution, registry / App projection, and work-order lifecycle.',
    '- OPL Meta Agent generated this candidate primary skill and capability sidecar, but does not own final target truth.',
    '- The target domain owner owns domain truth, memory body, artifact body, quality/export verdict, owner receipt, human gate, and default promotion authority.',
    '',
  ].join('\n');
}

function buildTargetAgentPrimarySkillCapability(targetAgent: MinimalTargetAgent): JsonObject {
  const domainId = targetAgent.domain_id;
  const profileSelectionReceipt = buildProfileSelectionReceipt(targetAgent);
  const selectedProfileRefs = profileSelectionReceipt.selected_profile_refs as string[];
  return {
    capability_id: `${domainId}.primary-skill.codex_entry`,
    surface_role: 'primary_skill',
    capability_kind: 'primary_skill',
    canonical_owner: domainId,
    physical_source_ref: { ref_kind: 'repo_path', ref: targetPrimarySkillRef, role: 'primary_skill_source' },
    profile_selection_mode: profileSelectionReceipt.profile_selection_mode,
    ...(selectedProfileRefs[0] ? { profile_ref: selectedProfileRefs[0] } : {}),
    profile_selection_receipt_ref: 'contracts/capability_map.json#/profile_selection_receipt',
    source_derived_design_receipt_ref: profileSelectionReceipt.source_derived_design_receipt_ref,
    research_driven_design_receipt_ref: profileSelectionReceipt.research_driven_design_receipt_ref,
    reference_design_packet_ref: profileSelectionReceipt.reference_design_packet_ref,
    research_synthesis_packet_ref: profileSelectionReceipt.research_synthesis_packet_ref,
    transfer_map_ref: profileSelectionReceipt.transfer_map_ref,
    agent_pack_plan_ref: profileSelectionReceipt.agent_pack_plan_ref,
    design_admission_receipt_ref: profileSelectionReceipt.design_admission_receipt_ref,
    expected_build_receipt_ref: profileSelectionReceipt.expected_build_receipt_ref,
    stage_decomposition_subpacket_set_ref: profileSelectionReceipt.stage_decomposition_subpacket_set_ref,
    reference_design_pattern_packet_refs: profileSelectionReceipt.reference_design_pattern_packet_refs,
    research_source_refs: profileSelectionReceipt.research_source_refs,
    research_synthesis_refs: profileSelectionReceipt.research_synthesis_refs,
    transferable_pattern_requirements: profileSelectionReceipt.transferable_pattern_requirements,
    capability_plan_requirements: profileSelectionReceipt.capability_plan_requirements,
    reference_design_boundary: buildReferenceDesignBoundary(targetAgent),
    canonical_paths: [targetPrimarySkillRef],
    improvement_tokens: ['primary skill', 'agent entry', 'owner handoff', 'delivery gate'],
    failure_token_registry_ref: `failure-token-registry:${domainId}/primary-skill`,
    verification_refs: [
      'git diff --check',
      'opl agents scaffold --validate <target-agent-dir> --json',
      'opl connect agent-packages validate-manifest --manifest-url <sidecar> --json',
    ],
    forbidden_surfaces: [
      'target domain truth',
      'target memory body',
      'target artifact body',
      'target owner receipt body',
      'target typed blocker body',
      'quality/export verdict',
      'promotion gate state',
    ],
    runtime_projection_refs: [{
      ref_kind: 'contract_ref',
      ref: 'contracts/opl_agent_package_manifest.json#/codex_surface/primary_skill_ref',
      role: 'package_primary_skill_ref',
    }],
    sync_policy: 'oma_generated_candidate_refs_only',
    externalization_reason: 'standard generated target agent primary Codex entry; OPL owns generated carrier projection and package validation',
    authority_boundary: {
      can_write_domain_truth: false,
      can_write_memory_body: false,
      can_mutate_artifact_body: false,
      can_sign_owner_receipt: false,
      can_create_typed_blocker: false,
      can_authorize_quality_or_export: false,
      can_claim_domain_ready: false,
      can_claim_production_ready: false,
    },
    exposure_layer: 'codex_default_primary_skill',
    codex_default_exposure: true,
    allowed_exposure_scopes: ['codex_default_entry', 'opl_generated_plugin_carrier'],
    codex_visibility_policy: 'registered_as_primary_codex_skill_entry',
    exposure_owner: domainId,
    canonical_target_paths: [targetPrimarySkillRef],
  };
}

export function buildTargetAgentCapabilityMapProjection(
  targetAgent: MinimalTargetAgent,
  buildReceipt: JsonObject | null,
): JsonObject {
  const profileSelectionReceipt = buildProfileSelectionReceipt(targetAgent);
  const buildReceiptRef = buildReceipt?.receipt_ref ?? null;
  if (
    buildReceipt
    &&
    profileSelectionReceipt.expected_build_receipt_ref
    && buildReceiptRef !== profileSelectionReceipt.expected_build_receipt_ref
  ) {
    throw new Error('Target capability map requires the post-materialization AgentBuildReceipt.');
  }
  const selectedProfileRefs = profileSelectionReceipt.selected_profile_refs as string[];
  return {
    profile_selection_mode: profileSelectionReceipt.profile_selection_mode,
    selected_profile_refs: selectedProfileRefs,
    profile_requirements: profileSelectionReceipt.profile_requirements,
    profile_selection_receipt: profileSelectionReceipt,
    source_derived_design_receipt: profileSelectionReceipt.source_derived_design_receipt,
    research_driven_design_receipt: profileSelectionReceipt.research_driven_design_receipt,
    reference_design_packet: profileSelectionReceipt.reference_design_packet,
    reference_design_packet_ref: profileSelectionReceipt.reference_design_packet_ref,
    reference_design_packet_refs: profileSelectionReceipt.reference_design_packet_ref
      ? [profileSelectionReceipt.reference_design_packet_ref]
      : [],
    research_synthesis_packet: profileSelectionReceipt.research_synthesis_packet,
    research_synthesis_packet_ref: profileSelectionReceipt.research_synthesis_packet_ref,
    research_synthesis_packet_refs: profileSelectionReceipt.research_synthesis_packet_ref
      ? [profileSelectionReceipt.research_synthesis_packet_ref]
      : [],
    transfer_map: profileSelectionReceipt.transfer_map,
    transfer_map_ref: profileSelectionReceipt.transfer_map_ref,
    transfer_map_refs: profileSelectionReceipt.transfer_map_ref ? [profileSelectionReceipt.transfer_map_ref] : [],
    agent_pack_plan: profileSelectionReceipt.agent_pack_plan,
    agent_pack_plan_ref: profileSelectionReceipt.agent_pack_plan_ref,
    agent_pack_plan_refs: profileSelectionReceipt.agent_pack_plan_ref ? [profileSelectionReceipt.agent_pack_plan_ref] : [],
    design_admission_receipt: profileSelectionReceipt.design_admission_receipt,
    design_admission_receipt_ref: profileSelectionReceipt.design_admission_receipt_ref,
    design_admission_receipt_refs: profileSelectionReceipt.design_admission_receipt_ref
      ? [profileSelectionReceipt.design_admission_receipt_ref]
      : [],
    expected_build_receipt_ref: profileSelectionReceipt.expected_build_receipt_ref,
    ...(buildReceipt ? {
      build_receipt: buildReceipt,
      build_receipt_ref: buildReceiptRef,
      build_receipt_refs: [buildReceiptRef],
    } : {}),
    stage_decomposition_subpacket_set: profileSelectionReceipt.stage_decomposition_subpacket_set,
    stage_decomposition_subpacket_set_ref: profileSelectionReceipt.stage_decomposition_subpacket_set_ref,
    stage_decomposition_subpacket_set_refs: profileSelectionReceipt.stage_decomposition_subpacket_set_ref
      ? [profileSelectionReceipt.stage_decomposition_subpacket_set_ref]
      : [],
    reference_design_source_refs: stringList(targetAgent.reference_design_source_refs),
    reference_design_pattern_packet_refs: profileSelectionReceipt.reference_design_pattern_packet_refs,
    research_source_refs: profileSelectionReceipt.research_source_refs,
    expert_practice_notes: profileSelectionReceipt.expert_practice_notes,
    research_synthesis_refs: profileSelectionReceipt.research_synthesis_refs,
    transferable_pattern_requirements: profileSelectionReceipt.transferable_pattern_requirements,
    capability_plan_requirements: profileSelectionReceipt.capability_plan_requirements,
    primary_skill_capability: buildTargetAgentPrimarySkillCapability(targetAgent),
    resolver_index: {
      profile_selection_mode: profileSelectionReceipt.profile_selection_mode,
      profile_refs: selectedProfileRefs,
      profile_requirement_refs: profileSelectionReceipt.profile_requirement_refs,
      profile_selection_receipt_refs: ['contracts/capability_map.json#/profile_selection_receipt'],
      source_derived_design_receipt_refs: profileSelectionReceipt.source_derived_design_receipt_ref
        ? [profileSelectionReceipt.source_derived_design_receipt_ref]
        : [],
      research_driven_design_receipt_refs: profileSelectionReceipt.research_driven_design_receipt_ref
        ? [profileSelectionReceipt.research_driven_design_receipt_ref]
        : [],
      reference_design_packet_refs: profileSelectionReceipt.reference_design_packet_ref
        ? [profileSelectionReceipt.reference_design_packet_ref]
        : [],
      research_synthesis_packet_refs: profileSelectionReceipt.research_synthesis_packet_ref
        ? [profileSelectionReceipt.research_synthesis_packet_ref]
        : [],
      transfer_map_refs: profileSelectionReceipt.transfer_map_ref ? [profileSelectionReceipt.transfer_map_ref] : [],
      agent_pack_plan_refs: profileSelectionReceipt.agent_pack_plan_ref ? [profileSelectionReceipt.agent_pack_plan_ref] : [],
      design_admission_receipt_refs: profileSelectionReceipt.design_admission_receipt_ref
        ? [profileSelectionReceipt.design_admission_receipt_ref]
        : [],
      build_receipt_refs: buildReceiptRef ? [buildReceiptRef] : [],
      stage_decomposition_subpacket_set_refs: profileSelectionReceipt.stage_decomposition_subpacket_set_ref
        ? [profileSelectionReceipt.stage_decomposition_subpacket_set_ref]
        : [],
      reference_design_pattern_packet_refs: profileSelectionReceipt.reference_design_pattern_packet_refs,
      research_source_refs: profileSelectionReceipt.research_source_refs,
      research_synthesis_refs: profileSelectionReceipt.research_synthesis_refs,
      primary_skill_refs: ['contracts/capability_map.json#/primary_skill_capability'],
    },
  };
}

export function buildTargetAgentPackageManifest(targetAgent: MinimalTargetAgent): JsonObject {
  const domainId = targetAgent.domain_id;
  const domainLabel = targetAgent.domain_label ?? domainId;
  return {
    surface_kind: 'opl_agent_package_manifest.v1',
    agent_id: domainId,
    package_id: domainId,
    display_name: domainLabel,
    publisher: 'one-person-lab',
    version: '0.1.0',
    source: 'oma_generated_target_agent',
    carrier_source_role: 'codex_plugin_default_carrier_not_package_truth',
    schema_ref: 'contracts/opl-framework/agent-package-manifest.schema.json',
    machine_boundary: 'OMA generates this package sidecar for OPL App/package management. Codex consumes the projected .codex-plugin carrier; this sidecar does not write target truth, owner receipts, runtime queues, or quality/export verdicts.',
    package_core: {
      core_kind: 'opl_agent_package_core',
      identity_fields: ['package_id', 'agent_id', 'version'],
      content_identity_fields: [
        'manifest_sha256',
        'payload_digest_ref',
        'required_skill_pack_lock_refs',
        'package_lock_ref',
      ],
      dependency_source: 'manifest_declared_capability_dependencies',
      lock_owner: 'opl_connect_agent_package_registry',
      lifecycle_receipt_owner: 'opl_connect_agent_package_registry',
      exposure_owner: 'opl_connect_agent_package_registry',
    },
    codex_surface: {
      plugin_id: domainId,
      standalone_distribution: 'generated_carrier_surface',
      required_skill_ids: [domainId],
      primary_skill_ref: targetPrimarySkillRef,
      primary_skill_capability_ref: 'contracts/capability_map.json#/primary_skill_capability',
      bundled_capability_package_ids: [],
      user_install_action_count: 1,
    },
    carrier_adapters: [{
      adapter_kind: 'codex_plugin_carrier',
      carrier: 'codex_plugin',
      source_surface: 'codex_surface',
      projection_role: 'package_carrier_adapter',
      owns_package_core: false,
      owns_domain_truth: false,
    }],
    opl_managed_surface: {
      package_shape: 'thin_agent_package',
      dependency_resolution: 'managed_dependency_graph',
      dependency_update_policy: 'independent_package_target',
      developer_mode_dependency_policy: 'source_checkout_when_authorized_else_pull_request',
    },
    capability_dependencies: [],
  };
}
