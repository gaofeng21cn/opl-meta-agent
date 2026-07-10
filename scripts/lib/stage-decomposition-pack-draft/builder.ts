import { STANDARD_AGENT_PACK_ABI } from 'opl-framework-shared/standard-agent-pack-abi';
import {
  buildAgentPackPlan,
  buildAgentBuildReceiptRef,
  buildCapabilityPlanRequirements,
  buildDesignAdmissionReceipt,
  buildProfileRequirements,
  buildProfileSelectionReceipt,
  buildReferenceDesignPacket,
  buildResearchSynthesisPacket,
  buildStageDecompositionSubpacketSet,
  buildTransferMap,
  buildTransferablePatternRequirements,
  type AgentPackPlanOptions,
  type JsonObject,
} from '../domain-pack.ts';
import type { TargetAgent } from '../meta-agent-loop-io.ts';
import {
  buildStageNativeArtifactContract,
  buildStageNativeArtifactContractBundle,
} from '../stage-native-artifact-contract.ts';
import type {
  AgentSkeletonBuildCloseoutPacket,
  AgentSkeletonBuildFile,
  FixtureStageSpec,
  StageDecompositionCloseoutPacket,
  StageDecompositionFilePlan,
  StageDecompositionPackDraft,
} from './shared.ts';
import {
  AGENT_MEMBERSHIP_PROJECTION_POLICY,
  DEFAULT_STAGE_EXECUTOR_BINDING_REF,
  FORBIDDEN_GENERIC_OWNER_ROLES,
  SERIES_DESIGN_PROFILE,
  SHARED_POLICY_RELEASE,
  STANDARD_PUBLIC_PROJECTION_POLICY,
  STANDARD_STAGE_PACK_CONFORMANCE_VERSION,
  STAGE_COMPLETION_POLICY,
  STAGE_PROGRESS_DELTA_POLICY,
  TYPED_BLOCKER_LINEAGE_POLICY,
  USER_STAGE_LOG_CONTRACT,
  WORKSPACE_TOPOLOGY_PROFILE,
  commandPrefix,
  domainLabelFor,
  ref,
  snakeId,
  stageNativeRefsFor,
  targetBriefFor,
} from './shared.ts';

function authorityBoundary(domainTruthOwner: string) {
  return {
    domain_truth_owner: domainTruthOwner,
    opl_role: 'projection_only',
    can_write_target_domain_truth: false,
    can_write_target_domain_memory_body: false,
    can_mutate_target_domain_artifact_body: false,
    can_authorize_target_domain_quality_or_export: false,
  };
}

function noForbiddenWritePolicy(domainTruthOwner: string) {
  return {
    refs_only: true,
    generated_interface_owner: 'one-person-lab',
    domain_truth_owner: domainTruthOwner,
    can_write_target_domain_truth: false,
    can_write_target_domain_memory_body: false,
    can_mutate_target_domain_artifact_body: false,
    can_authorize_target_domain_quality_or_export: false,
    can_promote_default_agent_without_gate: false,
  };
}

function stringList(value: string[] | null | undefined): string[] {
  return Array.isArray(value) ? value.filter((entry) => entry.trim()).map((entry) => entry.trim()) : [];
}

function buildReferenceDesignBoundary(targetAgent: TargetAgent): JsonObject {
  const receipt = buildProfileSelectionReceipt(targetAgent);
  return {
    source_refs: stringList(targetAgent.reference_design_source_refs),
    pattern_notes: stringList(targetAgent.reference_design_pattern_notes),
    pattern_packet_refs: stringList(targetAgent.reference_design_pattern_packet_refs),
    research_source_refs: stringList(targetAgent.research_source_refs),
    expert_practice_notes: stringList(targetAgent.expert_practice_notes),
    research_synthesis_refs: stringList(targetAgent.research_synthesis_refs),
    reference_design_packet_ref: receipt.reference_design_packet_ref ?? null,
    research_synthesis_packet_ref: receipt.research_synthesis_packet_ref ?? null,
    design_basis_ref: receipt.reference_design_packet_ref ?? receipt.research_synthesis_packet_ref ?? null,
    transfer_map_ref: receipt.transfer_map_ref ?? null,
    agent_pack_plan_ref: receipt.agent_pack_plan_ref ?? null,
    design_admission_receipt_ref: receipt.design_admission_receipt_ref ?? null,
    hard_gate_required: receipt.source_derived_design_receipt !== null
      || receipt.research_driven_design_receipt !== null,
    role: 'external_architecture_or_research_inspiration_not_target_domain_truth',
    may_inform_stage_graph: true,
    may_inform_artifact_morphology: true,
    may_inform_quality_gate_design: true,
    may_inform_agent_lab_suite_seed: true,
    can_copy_external_runtime: false,
    can_copy_external_domain_truth: false,
    can_replace_target_owner_judgment: false,
  };
}

function profileRequirementLines(targetAgent: TargetAgent): string[] {
  const selectedProfileRefs = stringList(targetAgent.selected_opl_profile_refs);
  const profileSelectionReceipt = buildProfileSelectionReceipt(targetAgent);
  const profileRequirements = buildProfileRequirements(targetAgent);
  const transferablePatternRequirements = buildTransferablePatternRequirements(targetAgent);
  const capabilityPlanRequirements = buildCapabilityPlanRequirements(targetAgent);
  const referenceDesignPacketRef = typeof profileSelectionReceipt.reference_design_packet_ref === 'string'
    ? profileSelectionReceipt.reference_design_packet_ref
    : null;
  const researchSynthesisPacketRef = typeof profileSelectionReceipt.research_synthesis_packet_ref === 'string'
    ? profileSelectionReceipt.research_synthesis_packet_ref
    : null;
  const transferMapRef = typeof profileSelectionReceipt.transfer_map_ref === 'string'
    ? profileSelectionReceipt.transfer_map_ref
    : null;
  const agentPackPlanRef = typeof profileSelectionReceipt.agent_pack_plan_ref === 'string'
    ? profileSelectionReceipt.agent_pack_plan_ref
    : null;
  if (
    selectedProfileRefs.length === 0
    && transferablePatternRequirements.length === 0
    && capabilityPlanRequirements.length === 0
  ) {
    return [];
  }
  const requirementLines = Object.entries(profileRequirements)
    .flatMap(([key, value]) => Array.isArray(value)
      ? value.map((entry) => `Profile requirement ${key}: ${entry}`)
      : []);
  return [
    '',
    'OPL builtin profiles are lower-bound guardrails. If no builtin profile matches, source-derived reference design refs or research-driven expert-practice refs become the active design input.',
    `Profile selection mode: ${profileSelectionReceipt.profile_selection_mode}`,
    ...(selectedProfileRefs.length > 0
      ? selectedProfileRefs.map((profileRef) => `Selected OPL profile: ${profileRef}`)
      : ['Selected OPL profile: none; consume source-derived or research-driven design receipt refs.']),
    ...(referenceDesignPacketRef ? [`ReferenceDesignPacket ref: ${referenceDesignPacketRef}`] : []),
    ...(researchSynthesisPacketRef ? [`ResearchSynthesisPacket ref: ${researchSynthesisPacketRef}`] : []),
    ...(transferMapRef ? [`TransferMap ref: ${transferMapRef}`] : []),
    ...(agentPackPlanRef ? [`AgentPackPlan ref: ${agentPackPlanRef}`] : []),
    ...stringList(targetAgent.profile_requirement_refs).map((profileRequirementRef) =>
      `Profile requirement ref: ${profileRequirementRef}`
    ),
    ...requirementLines,
    ...stringList(targetAgent.reference_design_pattern_packet_refs).map((packetRef) =>
      `Reference design pattern packet ref: ${packetRef}`
    ),
    ...stringList(targetAgent.research_source_refs).map((sourceRef) =>
      `Research source ref: ${sourceRef}`
    ),
    ...stringList(targetAgent.research_synthesis_refs).map((synthesisRef) =>
      `Research synthesis ref: ${synthesisRef}`
    ),
    ...transferablePatternRequirements.map((requirement) => `Transferable pattern requirement: ${requirement}`),
    ...capabilityPlanRequirements.map((requirement) => `Capability plan requirement: ${requirement}`),
    'Preserve StageDecompositionSubpacketSet as the ordered internal cognitive packet chain and treat generated files as materializer projections, not as the design source of truth.',
    'For source-derived design, materialize ReferenceDesignPacket -> TransferMap -> AgentPackPlan, pass DesignAdmissionReceipt before target pack materialization, preserve StageDecompositionSubpacketSet, then preserve AgentBuildReceipt as build proof.',
    'For research-driven design, materialize ResearchSynthesisPacket -> TransferMap -> AgentPackPlan, pass DesignAdmissionReceipt before target pack materialization, preserve StageDecompositionSubpacketSet, then preserve AgentBuildReceipt as build proof.',
    'Map builtin profile, source-derived design, and research-driven design requirements into knowledge/tool/evaluation refs before owner handoff.',
  ];
}

function buildArtifactMorphologyContract({
  targetAgent,
  owner,
  stageId,
}: {
  targetAgent: TargetAgent;
  owner: string;
  stageId: string;
}): JsonObject {
  return {
    surface_kind: 'target_domain_artifact_morphology_contract',
    version: 'artifact-morphology.v1',
    contract_id: `${snakeId(targetAgent.domain_id)}_artifact_morphology`,
    target_domain_id: targetAgent.domain_id,
    owner,
    purpose:
      'Require OMA stage decomposition to preserve the target-domain deliverable shape before generating an agent pack.',
    reference_design_boundary: buildReferenceDesignBoundary(targetAgent),
    native_source_policy: {
      required: true,
      native_source_format_refs: [
        `artifact-native-source-format-ref:${targetAgent.domain_id}/${stageId}`,
      ],
      creative_source_must_be_domain_native: true,
      creative_source_must_not_be_generator_code: true,
      generator_code_allowed_roles: [
        'assembly',
        'metrics',
        'validation',
        'export',
        'reporting',
      ],
    },
    artifact_body_policy: {
      target_domain_owns_artifact_body: true,
      oma_can_write_target_artifact_body: false,
      opl_can_infer_artifact_body_shape: false,
      scaffold_or_suite_pass_is_not_artifact_shape_evidence: true,
    },
    sharding_policy: {
      required_for_book_length_or_large_artifacts: true,
      shard_unit_refs: [
        `artifact-shard-unit-ref:${targetAgent.domain_id}/${stageId}`,
      ],
      assembled_output_is_delivery_ref_not_primary_creative_source: true,
      monolithic_creative_source_requires_owner_approval: true,
    },
    target_extent_policy: {
      owner_or_source_declared_extent_is_binding: true,
      silent_extent_downgrade_forbidden: true,
      shortfall_requires_typed_blocker: true,
    },
    asset_custody_policy: {
      project_local_asset_paths_required_for_final_assets: true,
      generated_asset_without_exposed_path_is_typed_blocker: true,
      placeholder_or_chat_only_asset_is_not_final_evidence: true,
    },
    realistic_task_review_policy: {
      required_before_baseline_delivery: true,
      reviewer_must_check_artifact_morphology: true,
      scaffold_interface_or_scorecard_only_review_forbidden: true,
    },
    stage_refs: {
      artifact_morphology_ref: `artifact-morphology-ref:${targetAgent.domain_id}`,
      native_source_format_ref: `artifact-native-source-format-ref:${targetAgent.domain_id}/${stageId}`,
      shard_unit_ref: `artifact-shard-unit-ref:${targetAgent.domain_id}/${stageId}`,
      extent_contract_ref: `target-extent-contract-ref:${targetAgent.domain_id}/${stageId}`,
      asset_custody_ref: `asset-custody-ref:${targetAgent.domain_id}/${stageId}`,
    },
    authority_boundary: {
      oma_can_write_target_domain_truth: false,
      oma_can_write_target_artifact_body: false,
      oma_can_authorize_target_quality_or_export: false,
      target_domain_owner_must_accept_morphology: true,
    },
  };
}

function buildActionCatalog({
  targetAgent,
  actionId,
  owner,
}: {
  targetAgent: TargetAgent;
  actionId: string;
  owner: string;
}): JsonObject {
  const domainId = targetAgent.domain_id;
  const brief = targetBriefFor(targetAgent);
  const actionSummary = actionId === 'draft-agent-output'
    ? `Draft the owner-gated ${owner} delivery from declared workspace refs.`
    : `Run the owner-gated ${owner} stage from declared workspace refs.`;
  return {
    surface_kind: 'family_action_catalog',
    version: 'family-action-catalog.v1',
    catalog_id: `${snakeId(domainId)}_action_catalog`,
    target_domain_id: domainId,
    owner,
    authority_boundary: {
      opl_role: 'generated_interface_projection_only',
      domain_truth_owner: owner,
      opl_can_write_domain_truth: false,
      opl_can_write_memory_body: false,
      opl_can_authorize_quality_or_export: false,
      domain_repo_can_own_generated_surface: false,
    },
    actions: [
      {
        action_id: actionId,
        title: actionId.split('-').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' '),
        summary: actionSummary,
        natural_language_intent: brief,
        reference_design_boundary: buildReferenceDesignBoundary(targetAgent),
        owner,
        effect: 'mutating',
        source_command: {
          command: `${commandPrefix(domainId)} ${commandPrefix(actionId)} --workspace-root <workspace_root>`,
          surface_kind: 'domain_cli',
        },
        input_schema_ref: `contracts/schemas/${actionId}.input.schema.json`,
        output_schema_ref: `contracts/schemas/${actionId}.output.schema.json`,
        workspace_locator_fields: ['workspace_root'],
        human_gate_ids: [`${snakeId(actionId)}_owner_review`],
        supported_surfaces: {
          cli: {
            command: `${commandPrefix(domainId)} ${commandPrefix(actionId)} --workspace-root <workspace_root>`,
            surface_kind: 'domain_cli',
          },
          mcp: {
            tool_name: `${snakeId(domainId)}_${snakeId(actionId)}`,
            surface_kind: 'opl_generated_mcp_descriptor',
            descriptor_only: true,
            public_runtime: false,
          },
          skill: {
            command_contract_id: `${domainId}.${actionId}`,
            surface_kind: 'opl_generated_skill_contract',
          },
          product_entry: {
            action_key: actionId,
            command: `${commandPrefix(domainId)} product ${commandPrefix(actionId)} --workspace-root <workspace_root>`,
            surface_kind: 'domain_product_entry_action',
          },
          openai: {
            tool_name: `${snakeId(domainId)}_${snakeId(actionId)}`,
          },
          ai_sdk: {
            tool_name: `${snakeId(domainId)}_${snakeId(actionId)}`,
          },
        },
        authority_boundary: authorityBoundary(owner),
      },
    ],
    forbidden_generic_owner_roles: [...FORBIDDEN_GENERIC_OWNER_ROLES],
  };
}

function buildStageCompletionPolicy({
  domainId,
  stageId,
}: {
  domainId: string;
  stageId: string;
}): JsonObject {
  return {
    ...STAGE_COMPLETION_POLICY,
    policy_ref: `stage-completion-policy-ref:${domainId}/${stageId}`,
    stage_id: stageId,
    target_domain_id: domainId,
  };
}

const DEFAULT_TOOL_AFFORDANCE_REF = 'agent/tools/domain_affordances.md';

function toolAffordanceRef(role: string): JsonObject {
  return {
    ref_kind: 'repo_path',
    ref: DEFAULT_TOOL_AFFORDANCE_REF,
    role,
  };
}

function buildToolAffordanceBoundary(): JsonObject {
  return {
    catalog_role: 'available_affordance_catalog_not_workflow_script',
    capability_refs: [toolAffordanceRef('tool_capability_boundary')],
    permission_scope_refs: [toolAffordanceRef('tool_permission_scope_boundary')],
    credential_boundary_refs: [toolAffordanceRef('tool_credential_boundary')],
    write_scope_refs: [toolAffordanceRef('tool_write_scope_boundary')],
    side_effect_risk_refs: [toolAffordanceRef('tool_side_effect_risk_boundary')],
    forbidden_authority_refs: [toolAffordanceRef('tool_forbidden_authority_boundary')],
    executor_autonomy: {
      executor_can_choose_tools: true,
      executor_can_skip_tools: true,
      executor_can_substitute_tools_within_boundary: true,
      executor_can_choose_order_and_parallelism: true,
      executor_can_request_missing_context_or_human_gate: true,
      tool_catalog_can_prescribe_tool_sequence: false,
      tool_catalog_can_define_cognitive_strategy: false,
      tool_catalog_can_override_stage_goal: false,
      tool_catalog_can_authorize_forbidden_write: false,
    },
  };
}

function buildAgentPackPlanOptions({
  stageId,
  actionId,
  promptPath,
  skillPath,
  knowledgePath,
  qualityGatePath,
}: Required<FixtureStageSpec>): AgentPackPlanOptions {
  return {
    stageId,
    actionId,
    promptPath,
    skillPath,
    knowledgePath,
    toolPath: DEFAULT_TOOL_AFFORDANCE_REF,
    qualityGatePath,
  };
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function requiredMachineString(value: unknown, field: string): string {
  const parsed = optionalString(value);
  if (!parsed) {
    throw new Error(`stage-decomposition builder ${field} must be a non-empty string.`);
  }
  return parsed;
}

function plannedSourcePatternRefs(agentPackPlan: JsonObject | null): string[] {
  const plannedStageRefs = Array.isArray(agentPackPlan?.planned_stage_refs)
    ? agentPackPlan.planned_stage_refs
    : [];
  return [...new Set(plannedStageRefs
    .map((entry) => optionalString((entry as JsonObject).source_pattern_ref))
    .filter((entry): entry is string => Boolean(entry)))];
}

type StageControlPlaneArgs = Required<FixtureStageSpec> & {
  owner: string;
  artifactMorphologyContract: JsonObject;
};

function buildSingleStageControlPlane({
  targetAgent,
  stageId,
  actionId,
  title,
  summary,
  promptPath,
  skillPath,
  knowledgePath,
  qualityGatePath,
  owner,
  artifactMorphologyContract,
}: StageControlPlaneArgs): JsonObject {
  const domainId = targetAgent.domain_id;
  const stageNativeArtifactContract = buildStageNativeArtifactContract({
    domainId,
    stageId,
    domainTruthOwner: owner,
  });
  const stageNativeRefs = stageNativeRefsFor(domainId, stageId);
  const stageCompletionPolicy = buildStageCompletionPolicy({ domainId, stageId });
  const stageCloseoutPacketRef = `stage-closeout-packet-ref:${domainId}/${stageId}/{stage_attempt_id}`;
  const morphologyRefs = artifactMorphologyContract.stage_refs as JsonObject;
  const referenceDesignBoundary = buildReferenceDesignBoundary(targetAgent);
  const profileSelectionReceipt = buildProfileSelectionReceipt(targetAgent);
  const selectedProfileRefs = stringList(targetAgent.selected_opl_profile_refs);
  const profileRequirementRefs = stringList(targetAgent.profile_requirement_refs);
  const profileRequirements = buildProfileRequirements(targetAgent);
  const sourceDerivedDesignReceipt = profileSelectionReceipt.source_derived_design_receipt;
  const researchDrivenDesignReceipt = profileSelectionReceipt.research_driven_design_receipt;
  const transferablePatternRequirements = buildTransferablePatternRequirements(targetAgent);
  const capabilityPlanRequirements = buildCapabilityPlanRequirements(targetAgent);
  const agentPackPlanOptions = buildAgentPackPlanOptions({
    targetAgent,
    stageId,
    actionId,
    title,
    summary,
    promptPath,
    stagePath: `agent/stages/${stageId}.md`,
    skillPath,
    knowledgePath,
    qualityGatePath,
  });
  const referenceDesignPacket = buildReferenceDesignPacket(targetAgent);
  const researchSynthesisPacket = buildResearchSynthesisPacket(targetAgent);
  const transferMap = buildTransferMap(targetAgent, agentPackPlanOptions);
  const agentPackPlan = buildAgentPackPlan(targetAgent, agentPackPlanOptions);
  const designAdmissionReceipt = buildDesignAdmissionReceipt(targetAgent, agentPackPlanOptions);
  const stageDecompositionSubpacketSet = buildStageDecompositionSubpacketSet(targetAgent, agentPackPlanOptions);
  const referenceDesignPacketRef = optionalString(referenceDesignPacket?.packet_ref);
  const researchSynthesisPacketRef = optionalString(researchSynthesisPacket?.packet_ref);
  const transferMapRef = optionalString(transferMap?.transfer_map_ref);
  const agentPackPlanRef = optionalString(agentPackPlan?.plan_ref);
  const designAdmissionReceiptRef = optionalString(designAdmissionReceipt?.receipt_ref);
  const expectedBuildReceiptRef = designAdmissionReceipt
    ? buildAgentBuildReceiptRef(targetAgent)
    : null;
  const stageDecompositionSubpacketSetRef = optionalString(stageDecompositionSubpacketSet?.packet_set_ref);
  const stagePatternSourceRefs = plannedSourcePatternRefs(agentPackPlan);
  const referenceDesignSourceRefs = stringList(targetAgent.reference_design_source_refs);
  const referenceDesignPatternPacketRefs = stringList(targetAgent.reference_design_pattern_packet_refs);
  const researchSourceRefs = stringList(targetAgent.research_source_refs);
  const expertPracticeNotes = stringList(targetAgent.expert_practice_notes);
  const researchSynthesisRefs = stringList(targetAgent.research_synthesis_refs);
  const referenceDesignInputRefs = [
    ...(referenceDesignSourceRefs.length > 0
      ? [ref('reference_design_source_refs', `reference-design-source-refs:${domainId}`)]
      : []),
    ...(referenceDesignPatternPacketRefs.length > 0
      ? [ref('reference_design_pattern_packet_refs', `reference-design-pattern-packet-refs:${domainId}`)]
      : []),
    ...(researchSourceRefs.length > 0
      ? [ref('research_source_refs', `research-source-refs:${domainId}`)]
      : []),
    ...(expertPracticeNotes.length > 0
      ? [ref('expert_practice_notes', `expert-practice-notes:${domainId}`)]
      : []),
    ...(researchSynthesisRefs.length > 0
      ? [ref('research_synthesis_refs', `research-synthesis-refs:${domainId}`)]
      : []),
    ...(referenceDesignPacketRef ? [ref('reference_design_packet_ref', referenceDesignPacketRef)] : []),
    ...(researchSynthesisPacketRef ? [ref('research_synthesis_packet_ref', researchSynthesisPacketRef)] : []),
    ...(transferMapRef ? [ref('transfer_map_ref', transferMapRef)] : []),
    ...(agentPackPlanRef ? [ref('agent_pack_plan_ref', agentPackPlanRef)] : []),
    ...(designAdmissionReceiptRef ? [ref('design_admission_receipt_ref', designAdmissionReceiptRef)] : []),
    ...(stageDecompositionSubpacketSetRef
      ? [ref('stage_decomposition_subpacket_set_ref', stageDecompositionSubpacketSetRef)]
      : []),
  ];
  const referenceDesignRequiredRefs = [
    ...(referenceDesignSourceRefs.length > 0 ? [`reference-design-source-refs:${domainId}`] : []),
    ...(referenceDesignPatternPacketRefs.length > 0 ? [`reference-design-pattern-packet-refs:${domainId}`] : []),
    ...(researchSourceRefs.length > 0 ? [`research-source-refs:${domainId}`] : []),
    ...(expertPracticeNotes.length > 0 ? [`expert-practice-notes:${domainId}`] : []),
    ...(researchSynthesisRefs.length > 0 ? [`research-synthesis-refs:${domainId}`] : []),
    ...(referenceDesignPacketRef ? [`reference-design-packet-ref:${referenceDesignPacketRef}`] : []),
    ...(researchSynthesisPacketRef ? [`research-synthesis-packet-ref:${researchSynthesisPacketRef}`] : []),
    ...(transferMapRef ? [`transfer-map-ref:${transferMapRef}`] : []),
    ...(agentPackPlanRef ? [`agent-pack-plan-ref:${agentPackPlanRef}`] : []),
    ...(designAdmissionReceiptRef ? [`design-admission-receipt-ref:${designAdmissionReceiptRef}`] : []),
    ...(stageDecompositionSubpacketSetRef
      ? [`stage-decomposition-subpacket-set-ref:${stageDecompositionSubpacketSetRef}`]
      : []),
  ];
  return {
    surface_kind: 'family_stage_control_plane',
    version: 'family-stage-control-plane.v1',
    plane_id: `${snakeId(domainId)}_stage_plane`,
    target_domain_id: domainId,
    owner,
    profile_selection_mode: profileSelectionReceipt.profile_selection_mode,
    selected_profile_refs: selectedProfileRefs,
    profile_selection_receipt_ref: 'contracts/capability_map.json#/profile_selection_receipt',
    profile_requirement_refs: profileRequirementRefs.length > 0
      ? profileRequirementRefs
      : profileSelectionReceipt.profile_requirement_refs,
    profile_requirements: profileRequirements,
    source_derived_design_receipt: sourceDerivedDesignReceipt,
    research_driven_design_receipt: researchDrivenDesignReceipt,
    reference_design_packet: referenceDesignPacket,
    reference_design_packet_ref: referenceDesignPacketRef,
    reference_design_packet_refs: referenceDesignPacketRef ? [referenceDesignPacketRef] : [],
    research_synthesis_packet: researchSynthesisPacket,
    research_synthesis_packet_ref: researchSynthesisPacketRef,
    research_synthesis_packet_refs: researchSynthesisPacketRef ? [researchSynthesisPacketRef] : [],
    transfer_map: transferMap,
    transfer_map_ref: transferMapRef,
    transfer_map_refs: transferMapRef ? [transferMapRef] : [],
    agent_pack_plan: agentPackPlan,
    agent_pack_plan_ref: agentPackPlanRef,
    agent_pack_plan_refs: agentPackPlanRef ? [agentPackPlanRef] : [],
    design_admission_receipt: designAdmissionReceipt,
    design_admission_receipt_ref: designAdmissionReceiptRef,
    design_admission_receipt_refs: designAdmissionReceiptRef ? [designAdmissionReceiptRef] : [],
    expected_build_receipt_ref: expectedBuildReceiptRef,
    stage_decomposition_subpacket_set: stageDecompositionSubpacketSet,
    stage_decomposition_subpacket_set_ref: stageDecompositionSubpacketSetRef,
    stage_decomposition_subpacket_set_refs: stageDecompositionSubpacketSetRef
      ? [stageDecompositionSubpacketSetRef]
      : [],
    reference_design_source_refs: referenceDesignSourceRefs,
    reference_design_pattern_packet_refs: referenceDesignPatternPacketRefs,
    research_source_refs: researchSourceRefs,
    expert_practice_notes: expertPracticeNotes,
    research_synthesis_refs: researchSynthesisRefs,
    transferable_pattern_requirements: transferablePatternRequirements,
    capability_plan_requirements: capabilityPlanRequirements,
    stage_pack_conformance_version: STANDARD_STAGE_PACK_CONFORMANCE_VERSION,
    authority_boundary: {
      domain_truth_owner: owner,
      opl_role: 'stage_runtime_projection_and_generated_interface_owner',
      opl_can_write_domain_truth: false,
      opl_can_write_memory_body: false,
      opl_can_authorize_quality_or_export: false,
    },
    stages: [
      {
        stage_id: stageId,
        stage_kind: 'creation',
        title,
        summary,
        goal: targetBriefFor(targetAgent),
        owner,
        stage_pack_conformance_version: STANDARD_STAGE_PACK_CONFORMANCE_VERSION,
        profile_selection_mode: profileSelectionReceipt.profile_selection_mode,
        selected_profile_refs: selectedProfileRefs,
        profile_selection_receipt_ref: 'contracts/capability_map.json#/profile_selection_receipt',
        profile_requirements: profileRequirements,
        source_derived_design_receipt: sourceDerivedDesignReceipt,
        research_driven_design_receipt: researchDrivenDesignReceipt,
        reference_design_packet: referenceDesignPacket,
        reference_design_packet_ref: referenceDesignPacketRef,
        reference_design_packet_refs: referenceDesignPacketRef ? [referenceDesignPacketRef] : [],
        research_synthesis_packet: researchSynthesisPacket,
        research_synthesis_packet_ref: researchSynthesisPacketRef,
        research_synthesis_packet_refs: researchSynthesisPacketRef ? [researchSynthesisPacketRef] : [],
        transfer_map: transferMap,
        transfer_map_ref: transferMapRef,
        transfer_map_refs: transferMapRef ? [transferMapRef] : [],
        agent_pack_plan: agentPackPlan,
        agent_pack_plan_ref: agentPackPlanRef,
        agent_pack_plan_refs: agentPackPlanRef ? [agentPackPlanRef] : [],
        design_admission_receipt: designAdmissionReceipt,
        design_admission_receipt_ref: designAdmissionReceiptRef,
        design_admission_receipt_refs: designAdmissionReceiptRef ? [designAdmissionReceiptRef] : [],
        expected_build_receipt_ref: expectedBuildReceiptRef,
        stage_decomposition_subpacket_set: stageDecompositionSubpacketSet,
        stage_decomposition_subpacket_set_ref: stageDecompositionSubpacketSetRef,
        stage_decomposition_subpacket_set_refs: stageDecompositionSubpacketSetRef
          ? [stageDecompositionSubpacketSetRef]
          : [],
        stage_pattern_source_refs: stagePatternSourceRefs,
        reference_design_pattern_packet_refs: referenceDesignPatternPacketRefs,
        research_source_refs: researchSourceRefs,
        expert_practice_notes: expertPracticeNotes,
        research_synthesis_refs: researchSynthesisRefs,
        transferable_pattern_requirements: transferablePatternRequirements,
        capability_plan_requirements: capabilityPlanRequirements,
        selected_executor: {
          executor_kind: 'codex_cli',
          default_executor: true,
          executor_binding_ref: DEFAULT_STAGE_EXECUTOR_BINDING_REF,
        },
        domain_stage_refs: [stageId],
        inputs: [
          ref('workspace_scope_ref', `workspace-scope:${stageId}`),
          ref('source_scope_ref', `source-scope:${stageId}`),
          ref('profile_selection_receipt_ref', 'contracts/capability_map.json#/profile_selection_receipt'),
          ...referenceDesignInputRefs,
        ],
        reference_design_boundary: referenceDesignBoundary,
        knowledge_refs: [ref('domain_knowledge_ref', knowledgePath)],
        skills: [ref('domain_skill_ref', skillPath)],
        prompt_refs: [ref('domain_prompt_ref', promptPath)],
        tool_refs: [toolAffordanceRef('tool_affordance_catalog')],
        tool_affordance_boundary: buildToolAffordanceBoundary(),
        allowed_action_refs: [actionId],
        outputs: [
          ref('artifact_ref', `artifact-ref:${stageId}/draft-output`),
          ref('owner_handoff_ref', `owner-handoff-ref:${stageId}`),
        ],
        evaluation: [ref('domain_quality_gate_ref', qualityGatePath)],
        independent_gate_policy: {
          gate_ref: qualityGatePath,
          gate_owner: owner,
          execution_review_separation_required: true,
          mechanical_completion_can_close_stage: false,
          provider_completion_can_claim_domain_ready: false,
          generated_surface_readiness_can_claim_quality_or_export: false,
          dedicated_review_stage_required_when: [
            'expert_judgment',
            'artifact_or_export_mutation',
            'domain_truth_movement',
            'quality_or_export_verdict',
            'high_risk_handoff',
          ],
          lightweight_gate_receipt_allowed_when: [
            'read_only_projection',
            'mechanical_packaging',
            'low_risk_owner_handoff',
          ],
        },
        handoff: {
          next_owner: owner,
          allowed_closure_refs: [
            `independent-gate-receipt-ref:${stageId}`,
            `owner-receipt-ref:${stageId}`,
            `typed-blocker-ref:${stageId}`,
            `route-back-ref:${stageId}`,
          ],
        },
        stage_contract: {
          requires: [
            `stage:${stageId}`,
            String(stageCompletionPolicy.policy_ref),
            stageNativeRefs.artifactNativeContractRef,
            `prompt-ref:${promptPath}`,
            `skill-ref:${skillPath}`,
            `tool-affordance-ref:${DEFAULT_TOOL_AFFORDANCE_REF}`,
            `knowledge-ref:${knowledgePath}`,
            `quality-gate-ref:${qualityGatePath}`,
            `action-ref:${actionId}`,
            String(morphologyRefs.artifact_morphology_ref),
            String(morphologyRefs.native_source_format_ref),
            String(morphologyRefs.shard_unit_ref),
            String(morphologyRefs.extent_contract_ref),
            String(morphologyRefs.asset_custody_ref),
            `workspace-scope-ref:${stageId}`,
            `source-scope-ref:${stageId}`,
            'profile-selection-receipt-ref:contracts/capability_map.json#/profile_selection_receipt',
            ...referenceDesignRequiredRefs,
            'runtime-ref:stage-progress-log-user-stage-log',
          ],
          ensures: [
            `stage-attempt-receipt-ref:${stageId}`,
            `executor-receipt-ref:${stageId}/codex-cli`,
            `boundary-receipt-ref:${stageId}/refs-only`,
            `independent-gate-receipt-ref:${stageId}`,
            `owner-handoff-ref:${stageId}`,
            `stage-user-log-ref:${stageId}`,
            stageNativeRefs.stageFolderContractRef,
            stageNativeRefs.stageJsonRef,
            stageNativeRefs.attemptJsonRef,
            stageNativeRefs.manifestRef,
            stageNativeRefs.receiptRef,
            stageNativeRefs.currentPointerRef,
            stageNativeRefs.canonicalArtifactRef,
            stageNativeRefs.exportRef,
            stageNativeRefs.lineageRef,
            stageNativeRefs.retentionRef,
            stageCloseoutPacketRef,
            stageNativeRefs.physicalKernelLocatorRef,
            stageNativeRefs.conformanceRef,
            stageNativeRefs.workbenchConsumptionRef,
          ],
          expected_receipt_refs: [
            ref('stage_attempt_receipt_ref', `stage-attempt-receipt-ref:${stageId}`),
            ref('stage_completion_policy_ref', String(stageCompletionPolicy.policy_ref)),
            ref('stage_closeout_packet_ref', stageCloseoutPacketRef),
            ref('executor_receipt_ref', `executor-receipt-ref:${stageId}/codex-cli`),
            ref('boundary_receipt_ref', `boundary-receipt-ref:${stageId}/refs-only`),
            ...(designAdmissionReceiptRef ? [ref('design_admission_receipt_ref', designAdmissionReceiptRef)] : []),
            ...(stageDecompositionSubpacketSetRef
              ? [ref('stage_decomposition_subpacket_set_ref', stageDecompositionSubpacketSetRef)]
              : []),
            ...(expectedBuildReceiptRef ? [ref('agent_build_receipt_ref', expectedBuildReceiptRef)] : []),
            ref('independent_gate_receipt_ref', `independent-gate-receipt-ref:${stageId}`),
            ref('user_stage_log_ref', `stage-user-log-ref:${stageId}`),
            ref('artifact_native_contract_ref', stageNativeRefs.artifactNativeContractRef),
            ref('stage_folder_contract_ref', stageNativeRefs.stageFolderContractRef),
            ref('stage_json_ref', stageNativeRefs.stageJsonRef),
            ref('stage_attempt_json_ref', stageNativeRefs.attemptJsonRef),
            ref('stage_manifest_ref', stageNativeRefs.manifestRef),
            ref('stage_attempt_receipt_ref', stageNativeRefs.receiptRef),
            ref('stage_typed_blocker_ref', stageNativeRefs.blockerRef),
            ref('stage_current_pointer_ref', stageNativeRefs.currentPointerRef),
            ref('canonical_artifact_ref', stageNativeRefs.canonicalArtifactRef),
            ref('stage_export_ref', stageNativeRefs.exportRef),
            ref('stage_lineage_ref', stageNativeRefs.lineageRef),
            ref('stage_retention_ref', stageNativeRefs.retentionRef),
            ref('opl_physical_kernel_locator_ref', stageNativeRefs.physicalKernelLocatorRef),
            ref('stage_artifact_conformance_ref', stageNativeRefs.conformanceRef),
            ref('stage_artifact_workbench_consumption_ref', stageNativeRefs.workbenchConsumptionRef),
          ],
          receipt_schema_refs: [
            {
              ref_kind: 'repo_path',
              ref: 'contracts/owner_receipt_contract.json',
              role: 'owner_receipt_schema',
            },
          ],
          authority_function_refs: [
            {
              ref_kind: 'repo_path',
              ref: 'runtime/authority_functions/README.md',
              role: 'minimal_authority_function_inventory',
            },
          ],
          l4_entry_gate: STANDARD_AGENT_PACK_ABI.l4_entry_gate,
          l5_entry_gate: STANDARD_AGENT_PACK_ABI.l5_entry_gate,
          source_scope_refs: [ref('source_scope_ref', `source-scope:${stageId}`)],
          artifact_scope_refs: [ref('artifact_scope_ref', `artifact-scope:${stageId}`)],
          artifact_morphology_contract: artifactMorphologyContract,
          artifact_morphology_refs: [
            ref('artifact_morphology_ref', String(morphologyRefs.artifact_morphology_ref)),
            ref('artifact_native_source_format_ref', String(morphologyRefs.native_source_format_ref)),
            ref('artifact_shard_unit_ref', String(morphologyRefs.shard_unit_ref)),
            ref('target_extent_contract_ref', String(morphologyRefs.extent_contract_ref)),
            ref('asset_custody_ref', String(morphologyRefs.asset_custody_ref)),
          ],
          workspace_scope_refs: [ref('workspace_scope_ref', `workspace-scope:${stageId}`)],
          stage_completion_policy: stageCompletionPolicy,
          stage_native_artifact_contract: stageNativeArtifactContract,
          user_stage_log_contract: USER_STAGE_LOG_CONTRACT,
          progress_delta_policy: STAGE_PROGRESS_DELTA_POLICY,
          typed_blocker_lineage_policy: TYPED_BLOCKER_LINEAGE_POLICY,
        },
        trust_boundary: {
          lane: 'domain_agent',
          static_check_eligible: true,
          effect_boundary: true,
          owner_receipt_required: true,
          runtime_guard_required: true,
        },
        authority_boundary: authorityBoundary(owner),
      },
    ],
  };
}

function stageTitle(value: unknown): string {
  const source = optionalString(value) ?? 'workflow-stage';
  return source
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ');
}

function canonicalizeStageDesignObjects(stage: JsonObject, controlPlane: JsonObject): void {
  [
    'source_derived_design_receipt',
    'research_driven_design_receipt',
    'reference_design_packet',
    'reference_design_packet_ref',
    'reference_design_packet_refs',
    'research_synthesis_packet',
    'research_synthesis_packet_ref',
    'research_synthesis_packet_refs',
    'transfer_map',
    'transfer_map_ref',
    'transfer_map_refs',
    'agent_pack_plan',
    'agent_pack_plan_ref',
    'agent_pack_plan_refs',
    'design_admission_receipt',
    'design_admission_receipt_ref',
    'design_admission_receipt_refs',
    'expected_build_receipt_ref',
    'stage_decomposition_subpacket_set',
    'stage_decomposition_subpacket_set_ref',
    'stage_decomposition_subpacket_set_refs',
  ].forEach((field) => {
    stage[field] = controlPlane[field];
  });
}

function buildStageControlPlane(args: StageControlPlaneArgs): JsonObject {
  const controlPlane = buildSingleStageControlPlane(args);
  const agentPackPlan = controlPlane.agent_pack_plan as JsonObject | null;
  const plannedStages = Array.isArray(agentPackPlan?.planned_stage_refs)
    ? agentPackPlan.planned_stage_refs.filter((entry): entry is JsonObject =>
        typeof entry === 'object'
        && entry !== null
        && !Array.isArray(entry)
        && ['source_pattern_ref', 'target_only_requirement'].includes(String(entry.origin))
      )
    : [];
  if (plannedStages.length === 0) {
    return controlPlane;
  }

  controlPlane.stages = plannedStages.map((plannedStage) => {
    const plannedStageId = requiredMachineString(
      plannedStage.stage_id,
      'agent_pack_plan.planned_stage_refs[].stage_id',
    );
    const plannedStageTitle = stageTitle(plannedStage.step_id ?? plannedStage.stage_archetype ?? plannedStageId);
    const plannedStageSummary = requiredMachineString(
      plannedStage.stage_goal,
      `agent_pack_plan.planned_stage_refs.${plannedStageId}.stage_goal`,
    );
    const stagePlane = buildSingleStageControlPlane({
      ...args,
      stageId: plannedStageId,
      title: plannedStageTitle,
      summary: plannedStageSummary,
      promptPath: requiredMachineString(plannedStage.prompt_ref, `${plannedStageId}.prompt_ref`),
      stagePath: requiredMachineString(plannedStage.stage_path, `${plannedStageId}.stage_path`),
      skillPath: requiredMachineString(plannedStage.skill_ref, `${plannedStageId}.skill_ref`),
      knowledgePath: requiredMachineString(
        (plannedStage.knowledge_refs as unknown[])?.[0],
        `${plannedStageId}.knowledge_refs[0]`,
      ),
      qualityGatePath: requiredMachineString(
        (plannedStage.quality_gate_refs as unknown[])?.[0],
        `${plannedStageId}.quality_gate_refs[0]`,
      ),
    });
    const stage = (stagePlane.stages as JsonObject[])[0];
    canonicalizeStageDesignObjects(stage, controlPlane);
    stage.goal = plannedStageSummary;
    stage.summary = plannedStageSummary;
    stage.stage_origin = plannedStage.origin;
    stage.stage_archetype = plannedStage.stage_archetype;
    if (plannedStage.origin === 'source_pattern_ref') {
      stage.pattern_id = plannedStage.pattern_id;
      stage.step_id = plannedStage.step_id;
      stage.provenance_kind = plannedStage.provenance_kind;
      stage.stage_pattern_source_refs = [plannedStage.source_pattern_ref];
      stage.source_anchor_refs = plannedStage.source_anchor_refs;
    } else {
      stage.stage_pattern_source_refs = [];
      stage.source_anchor_refs = [];
      stage.target_only_requirement_ref = plannedStage.target_only_requirement_ref;
    }
    return stage;
  });
  return controlPlane;
}

function buildFoundryAgentSeriesContract(targetAgent: TargetAgent, stageControlPlane: JsonObject, owner: string): JsonObject {
  const domainId = targetAgent.domain_id;
  return {
    surface_kind: 'opl_foundry_agent_series_contract',
    version: 'foundry-agent-series.v1',
    owner: 'one-person-lab',
    product_layer: 'foundry_agent',
    product_model: 'OPL Framework -> One Person Lab App -> Foundry Agents',
    standard_agent_requirement:
      'foundry_agents_share_identity_stage_authority_progress_currentness_closeout_and_app_projection_packets',
    contract_version_policy: {
      current_version: 'foundry-agent-series.v1',
      domain_contract_ref: 'contracts/foundry_agent_series.json',
      exact_version_pin_required: true,
      compatible_version_range: ['foundry-agent-series.v1'],
      breaking_change_requires_new_version: true,
      domain_descriptor_must_reference_domain_contract: true,
    },
    shared_release_pin_strategy: {
      owner_release_contract_ref: 'contracts/family-release/shared-owner-release.json',
      owner_commit_pin_required: true,
      domain_dependency_pin_required: true,
      supported_pin_sources: [
        'pyproject.toml',
        'uv.lock',
        'package.json',
        'package-lock.json',
      ],
      consumer_alignment_check: 'family:shared-release',
      domain_contract_version_pin_does_not_authorize_domain_truth: true,
    },
    shared_policy_release: SHARED_POLICY_RELEASE,
    agent_membership_projection_policy: AGENT_MEMBERSHIP_PROJECTION_POLICY,
    standard_public_projection_policy: STANDARD_PUBLIC_PROJECTION_POLICY,
    domain_id: domainId,
    foundry_agent_id: domainId,
    domain_label: targetAgent.domain_label ?? domainId,
    domain_aliases: [],
    authority_owner: owner,
    stage_manifest_ref: 'agent/stages/manifest.json',
    stage_control_plane_ref: 'opl-generated:family_stage_control_plane',
    stage_control_plane_target_domain_id: stageControlPlane.target_domain_id,
    app_projection_ref: 'contracts/generated_surface_handoff.json#/product_entry',
    required_identity_fields: [
      'domain_id',
      'foundry_agent_id',
      'product_layer',
      'domain_label',
      'authority_owner',
      'stage_manifest_ref',
      'stage_control_plane_ref',
    ],
    required_stage_packets: [
      'stage_completion_policy',
      'user_stage_log_contract',
      'stage_native_artifact_contract',
      'progress_delta_policy',
      'typed_blocker_lineage_policy',
      'effective_current_context',
      'owner_receipt_or_typed_blocker_closeout',
    ],
    shared_progress_projection_fields: [
      'progress_delta_classification',
      'deliverable_progress_delta',
      'platform_repair_delta',
      'next_forced_delta',
    ],
    domain_progress_aliases: {
      deliverable: ['target_agent_progress', 'foundry_agent_progress', 'agent_build_progress'],
      platform: ['platform_interface_repair', 'agent_lab_or_opl_surface_repair', 'platform_repair_delta'],
    },
    domain_adapter_policy: {
      domain_specific_aliases_only: true,
      no_parallel_progress_schema: true,
      no_parallel_blocker_lineage_schema: true,
      no_domain_runtime_fork: true,
    },
    app_projection_policy: {
      app_consumes_shared_progress_projection_only: true,
      app_can_read_domain_body: false,
      app_can_write_domain_truth: false,
      app_can_claim_quality_or_export: false,
      display_policy: 'classification_only_no_domain_artifact_body',
    },
    authority_boundary: {
      opl_owns_series_contract: true,
      domain_owns_truth_quality_artifact_memory_and_receipts: true,
      app_owns_display_and_user_action_shell: true,
      generated_surface_can_claim_domain_ready: false,
    },
    series_design_profile: SERIES_DESIGN_PROFILE,
    workspace_topology_profile: WORKSPACE_TOPOLOGY_PROFILE,
  };
}

function buildFiles({
  targetAgent,
  stageId,
  actionId,
  title,
  promptPath,
  stagePath,
  skillPath,
  knowledgePath,
  qualityGatePath,
  owner,
}: Required<FixtureStageSpec> & { owner: string }): AgentSkeletonBuildFile[] {
  const brief = targetBriefFor(targetAgent);
  const referenceDesignSourceRefs = stringList(targetAgent.reference_design_source_refs);
  const referenceDesignPatternNotes = stringList(targetAgent.reference_design_pattern_notes);
  const referenceDesignPatternPacketRefs = stringList(targetAgent.reference_design_pattern_packet_refs);
  const researchSourceRefs = stringList(targetAgent.research_source_refs);
  const expertPracticeNotes = stringList(targetAgent.expert_practice_notes);
  const researchSynthesisRefs = stringList(targetAgent.research_synthesis_refs);
  const profileLines = profileRequirementLines(targetAgent);
  const profileSelectionReceipt = buildProfileSelectionReceipt(targetAgent);
  const referenceDesignPacketRef = optionalString(profileSelectionReceipt.reference_design_packet_ref);
  const researchSynthesisPacketRef = optionalString(profileSelectionReceipt.research_synthesis_packet_ref);
  const transferMapRef = optionalString(profileSelectionReceipt.transfer_map_ref);
  const agentPackPlanRef = optionalString(profileSelectionReceipt.agent_pack_plan_ref);
  const referenceDesignLines = referenceDesignSourceRefs.length > 0
    || referenceDesignPatternNotes.length > 0
    || referenceDesignPatternPacketRefs.length > 0
    ? [
        '',
        'Reference design inputs are architecture inspiration only, not target-domain truth or owner acceptance.',
        ...(referenceDesignPacketRef ? [`ReferenceDesignPacket ref: ${referenceDesignPacketRef}`] : []),
        ...(transferMapRef ? [`TransferMap ref: ${transferMapRef}`] : []),
        ...(agentPackPlanRef ? [`AgentPackPlan ref: ${agentPackPlanRef}`] : []),
        ...referenceDesignSourceRefs.map((sourceRef) => `Reference design source: ${sourceRef}`),
        ...referenceDesignPatternNotes.map((note) => `Transfer pattern: ${note}`),
        ...referenceDesignPatternPacketRefs.map((packetRef) => `Pattern packet ref: ${packetRef}`),
        'Extract transferable workflow, grounding, evaluation, handoff, and failure-taxonomy patterns into ReferenceDesignPacket -> TransferMap -> AgentPackPlan, pass DesignAdmissionReceipt before materialization, preserve StageDecompositionSubpacketSet, then preserve AgentBuildReceipt; do not copy external runtime ownership or domain verdicts.',
      ]
    : [];
  const researchDesignLines = researchSourceRefs.length > 0
    || expertPracticeNotes.length > 0
    || researchSynthesisRefs.length > 0
    ? [
        '',
        'Research-driven design inputs are expert-practice inspiration only, not target-domain truth or owner acceptance.',
        ...(researchSynthesisPacketRef ? [`ResearchSynthesisPacket ref: ${researchSynthesisPacketRef}`] : []),
        ...(transferMapRef ? [`TransferMap ref: ${transferMapRef}`] : []),
        ...(agentPackPlanRef ? [`AgentPackPlan ref: ${agentPackPlanRef}`] : []),
        ...researchSourceRefs.map((sourceRef) => `Research source: ${sourceRef}`),
        ...expertPracticeNotes.map((note) => `Expert practice: ${note}`),
        ...researchSynthesisRefs.map((synthesisRef) => `Research synthesis ref: ${synthesisRef}`),
        'Synthesize expert practice into ResearchSynthesisPacket -> TransferMap -> AgentPackPlan, pass DesignAdmissionReceipt before materialization, preserve StageDecompositionSubpacketSet, then preserve AgentBuildReceipt; do not treat public research as target truth or owner verdicts.',
      ]
    : [];
  return [
    {
      path: promptPath,
      body: [
        `# ${title} Prompt`,
        '',
        `Goal: ${brief}`,
        '',
        'Use declared workspace, source, artifact, and owner refs only.',
        ...profileLines,
        ...referenceDesignLines,
        ...researchDesignLines,
        'Keep the work Codex-first: the executor may plan, inspect evidence, request source refs, route back when inputs are incomplete, and choose the reasoning path.',
        'Do not write target domain truth, memory bodies, artifact bodies, quality verdicts, export verdicts, or promotion state.',
        'Close the execution attempt with explicit artifact refs, owner handoff refs, typed blockers, or route-back refs.',
        '',
      ].join('\n'),
    },
    {
      path: stagePath,
      body: [
        `# ${title} Stage`,
        '',
        `Stage id: \`${stageId}\``,
        `Action ref: \`${actionId}\``,
        '',
        'The stage is executed by Codex CLI through OPL stage runtime and remains bounded by refs-only target authority.',
        ...profileLines,
        'The stage may ask for missing source, workspace, artifact, rubric, or owner-gate refs instead of producing a hollow output.',
        '',
      ].join('\n'),
    },
    {
      path: skillPath,
      body: [
        `# ${owner} Domain Skill`,
        '',
        `Run the \`${stageId}\` stage through the domain action \`${actionId}\` while preserving OPL generated-interface boundaries.`,
        ...profileLines,
        'Use OPL-hosted runtime, queue, attempt ledger, generated CLI/MCP/Skill/product-entry surfaces, and owner receipt projection as external framework services.',
        'Return typed blockers when source refs, workspace scope, artifact scope, or owner gate evidence is missing.',
        '',
      ].join('\n'),
    },
    {
      path: DEFAULT_TOOL_AFFORDANCE_REF,
      body: [
        `# ${owner} Tool Affordances`,
        '',
        'This file is an available-affordance catalog, not a workflow script and not a mandatory tool order.',
        'The Codex CLI executor may choose, skip, substitute, order, and parallelize tools within the declared stage boundary.',
        'Allowed roles include repository/context reading, domain skill invocation, evidence inspection, owner handoff creation, and typed blocker routing.',
        'Credential use, write scope, side effects, and forbidden authority remain bounded by the stage contract and no-forbidden-write policy.',
        'The catalog cannot prescribe cognitive strategy, override the stage goal, authorize forbidden writes, or promote generated surfaces.',
        '',
      ].join('\n'),
    },
    {
      path: knowledgePath,
      body: [
        `# ${owner} Boundary Knowledge`,
        '',
        'OPL owns generated interfaces, provider lifecycle, Agent Lab, queue, attempt ledger, and projection.',
        `${owner} owns domain semantics, accepted source refs, artifact authority, quality/export verdicts, memory body decisions, and owner receipts.`,
        ...profileLines,
        ...referenceDesignLines,
        ...researchDesignLines,
        'Mechanical scaffold validation, suite pass, provider completion, generated surface readiness, or scorecard pass is evidence only.',
        'A domain-ready or quality/export-ready claim requires an owner receipt, independent gate receipt, typed blocker closure, or route-back receipt from the declared owner boundary.',
        '',
      ].join('\n'),
    },
    {
      path: qualityGatePath,
      body: [
        `# ${title} Quality Gate`,
        '',
        'Quality gate declaration is required for every generated OPL-compatible stage.',
        'Dedicated review stage is conditional: create one only when the stage performs expert judgment, artifact/export mutation, domain truth movement, quality verdict, or a high-risk handoff.',
        '',
        'Pass conditions:',
        '',
        `- The \`${stageId}\` execution attempt produced explicit refs or an explicit typed blocker.`,
        ...profileLines,
        '- Selected OPL profile requirements are preserved in profile selection receipt, stage inputs, knowledge refs, tool refs, and evaluation refs.',
        '- The reviewer or owner gate reads direct evidence refs rather than shared execution context.',
        '- Mechanical completion, generated surface readiness, provider completion, or suite pass is not treated as a quality/export verdict.',
        '- Handoff is allowed only with an independent gate receipt, owner receipt, typed blocker closure, or route-back receipt.',
        '',
        'Fail-closed conditions:',
        '',
        '- Missing prompt, skill/tool, knowledge, source, artifact, workspace, or quality gate refs.',
        '- Missing both builtin OPL profile refs and source-derived design refs/pattern packet refs.',
        '- Missing research-driven design refs when the user only provides a vague idea and no reference design.',
        '- Missing builtin profile requirements, source-derived transferable pattern requirements, or research-driven expert-practice requirements required by the active profile selection mode.',
        '- Missing independent review path for high-risk outputs.',
        '- Attempt self-review, shared-context review, stale evidence, or missing owner receipt.',
        '- Any request to write target truth, memory body, artifact body, quality/export verdict, or default promotion state from OPL generated surfaces.',
        '',
      ].join('\n'),
    },
  ];
}

function actionSchemaFiles(targetAgent: TargetAgent, actionId: string): AgentSkeletonBuildFile[] {
  const schema = (kind: 'input' | 'output', properties: JsonObject): AgentSkeletonBuildFile => ({
    path: `contracts/schemas/${actionId}.${kind}.schema.json`,
    body: `${JSON.stringify({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: `https://one-person-lab.local/contracts/${targetAgent.domain_id}/actions/${actionId}.${kind}.schema.json`,
      title: `${actionId} ${kind}`,
      type: 'object',
      properties,
      additionalProperties: true,
    }, null, 2)}\n`,
  });
  return [
    schema('input', {
      workspace_root: { type: 'string', minLength: 1 },
    }),
    schema('output', {
      surface_kind: { type: 'string', minLength: 1 },
    }),
  ];
}

function stageFileDrafts({
  targetAgent,
  stageControlPlane,
  actionId,
  owner,
}: {
  targetAgent: TargetAgent;
  stageControlPlane: JsonObject;
  actionId: string;
  owner: string;
}): AgentSkeletonBuildFile[] {
  const files = (stageControlPlane.stages as JsonObject[]).flatMap((stage) => {
    const stageId = requiredMachineString(stage.stage_id, 'stage_control_plane.stages[].stage_id');
    const promptPath = requiredMachineString(
      (stage.prompt_refs as JsonObject[])[0]?.ref,
      `${stageId}.prompt_refs[0].ref`,
    );
    const skillPath = requiredMachineString(
      (stage.skills as JsonObject[])[0]?.ref,
      `${stageId}.skills[0].ref`,
    );
    const knowledgePath = requiredMachineString(
      (stage.knowledge_refs as JsonObject[])[0]?.ref,
      `${stageId}.knowledge_refs[0].ref`,
    );
    const qualityGatePath = requiredMachineString(
      (stage.evaluation as JsonObject[])[0]?.ref,
      `${stageId}.evaluation[0].ref`,
    );
    return buildFiles({
      targetAgent,
      stageId,
      actionId,
      title: requiredMachineString(stage.title, `${stageId}.title`),
      summary: requiredMachineString(stage.summary, `${stageId}.summary`),
      promptPath,
      stagePath: `agent/stages/${stageId}.md`,
      skillPath,
      knowledgePath,
      qualityGatePath,
      owner,
    });
  });
  return [...new Map([
    ...files,
    ...actionSchemaFiles(targetAgent, actionId),
  ].map((file) => [file.path, file])).values()];
}

function stageFilePlans(
  files: AgentSkeletonBuildFile[],
  targetAgent: TargetAgent,
): StageDecompositionFilePlan[] {
  return files.map((file) => ({
    path: file.path,
    materialization_stage_ref: 'agent-skeleton-build',
    body_requirement_refs: [
      `body-requirement-ref:${targetAgent.domain_id}/${file.path}`,
    ],
  }));
}

export function buildFixtureStageDecompositionCloseout(input: FixtureStageSpec): StageDecompositionCloseoutPacket {
  const targetAgent = input.targetAgent;
  const owner = domainLabelFor(targetAgent);
  const stageId = input.stageId ?? 'agent-output-draft';
  const actionId = input.actionId ?? 'draft-agent-output';
  const title = input.title ?? 'Agent Output Draft';
  const summary = input.summary ?? `Draft the owner-gated ${owner} delivery.`;
  const promptPath = input.promptPath ?? 'agent/prompts/agent-output-draft.md';
  const stagePath = input.stagePath ?? 'agent/stages/agent-output-draft.md';
  const skillPath = input.skillPath ?? 'agent/skills/target-agent-domain-skill.md';
  const knowledgePath = input.knowledgePath ?? 'agent/knowledge/target-agent-boundary-policy.md';
  const qualityGatePath = input.qualityGatePath ?? 'agent/quality_gates/agent-output-draft-quality-gate.md';
  const referenceDesignSourceRefs = stringList(targetAgent.reference_design_source_refs);
  const referenceDesignPatternPacketRefs = stringList(targetAgent.reference_design_pattern_packet_refs);
  const researchSourceRefs = stringList(targetAgent.research_source_refs);
  const researchSynthesisRefs = stringList(targetAgent.research_synthesis_refs);
  const spec = {
    targetAgent,
    stageId,
    actionId,
    title,
    summary,
    promptPath,
    stagePath,
    skillPath,
    knowledgePath,
    qualityGatePath,
    owner,
  };
  const artifactMorphologyContract = buildArtifactMorphologyContract({ targetAgent, owner, stageId });
  const stageControlPlane = buildStageControlPlane({ ...spec, artifactMorphologyContract });
  const materializedStageIds = (stageControlPlane.stages as JsonObject[]).map((stage) =>
    requiredMachineString(stage.stage_id, 'stage_control_plane.stages[].stage_id')
  );
  const stageNativeArtifactContract = buildStageNativeArtifactContractBundle({
    domainId: targetAgent.domain_id,
    domainTruthOwner: owner,
    stageIds: materializedStageIds,
  });
  const materializedFiles = stageFileDrafts({
    targetAgent,
    stageControlPlane,
    actionId,
    owner,
  });
  const draft: StageDecompositionPackDraft = {
    surface_kind: 'opl_meta_agent_stage_decomposition_pack_draft',
    version: 'opl-meta-agent.stage-decomposition-pack-draft.v1',
    target_agent: targetAgent,
    owner_boundary: {
      target_domain_owner: owner,
      opl_framework_owner: 'one-person-lab',
      opl_meta_agent_role: 'stage_pack_authoring_refs_only',
      target_owner_keeps_truth_quality_artifact_authority: true,
    },
    no_forbidden_write_policy: noForbiddenWritePolicy(owner),
    artifact_morphology_contract: artifactMorphologyContract,
    action_catalog: buildActionCatalog({ targetAgent, actionId, owner }),
    stage_control_plane: stageControlPlane,
    stage_native_artifact_contract: stageNativeArtifactContract,
    foundry_agent_series: buildFoundryAgentSeriesContract(targetAgent, stageControlPlane, owner),
    stage_decomposition_subpacket_set: stageControlPlane.stage_decomposition_subpacket_set,
    stage_decomposition_subpacket_set_ref: stageControlPlane.stage_decomposition_subpacket_set_ref,
    stage_decomposition_subpacket_set_refs: stageControlPlane.stage_decomposition_subpacket_set_refs,
    file_materialization_plan: {
      surface_kind: 'opl_meta_agent_file_materialization_plan',
      version: 'opl-meta-agent.file-materialization-plan.v1',
      materialization_stage_ref: 'agent-skeleton-build',
      files: stageFilePlans(materializedFiles, targetAgent),
    },
  };
  return {
    surface_kind: 'stage_attempt_closeout_packet',
    stage_id: 'stage-decomposition',
    closeout_id: `stage-decomposition-closeout:${targetAgent.domain_id}`,
    closeout_refs: [
      `receipt:opl-meta-agent/${targetAgent.domain_id}/stage-decomposition-pack-draft`,
      ...materializedStageIds.flatMap((materializedStageId) => [
        `artifact-native-contract-ref:${targetAgent.domain_id}/${materializedStageId}`,
        `stage-folder-contract-ref:${targetAgent.domain_id}/${materializedStageId}`,
      ]),
    ],
    consumed_refs: [`stage-packet:opl-meta-agent/${targetAgent.domain_id}/stage-decomposition-input`],
    consumed_memory_refs: [],
    writeback_receipt_refs: [],
    rejected_writes: [],
    next_owner: 'opl-meta-agent',
    domain_ready_verdict: 'domain_gate_pending',
    user_stage_log: {
      stage_name: 'Stage decomposition pack draft',
      problem_summary: `The ${owner} target agent needs an OPL-compatible declarative domain pack before baseline generation.`,
      stage_goal: 'Produce action, stage, prompt, skill, knowledge, quality-gate, and authority-boundary refs for the target agent.',
      stage_work_done: [
        `Generated the ${stageId} stage pack draft with Codex CLI executor binding, independent gate policy, and owner handoff refs.`,
        'Attached a target-domain artifact morphology contract covering native source format, shard units, target extent, asset custody, and realistic task review.',
        'Materialized action catalog, stage control plane, prompt, skill, knowledge, and quality gate draft refs without writing target-domain truth.',
        'Generated Stage-Native Artifact Contract refs for stage folder, manifest, receipt, blocker, current pointer, and canonical artifact refs.',
        ...(referenceDesignSourceRefs.length > 0 || referenceDesignPatternPacketRefs.length > 0
          ? [
              'Preserved external reference design refs and pattern packet refs as architecture inspiration only.',
              'Materialized ReferenceDesignPacket, TransferMap, AgentPackPlan, and StageDecompositionSubpacketSet refs before target stage pack handoff.',
            ]
          : []),
        ...(researchSourceRefs.length > 0 || researchSynthesisRefs.length > 0
          ? [
              'Preserved expert-practice research refs and synthesis refs as design inspiration only.',
              'Materialized ResearchSynthesisPacket, TransferMap, AgentPackPlan, and StageDecompositionSubpacketSet refs before target stage pack handoff.',
            ]
          : []),
      ],
      changed_stage_surfaces: [
        'action_catalog',
        'stage_control_plane',
        'stage_completion_policy',
        'artifact_morphology_contract',
        'stage_native_artifact_contract',
        'agent/prompts',
        'agent/stages',
        'agent/skills',
        'agent/knowledge',
        'agent/quality_gates',
      ],
      outcome: 'domain_gate_pending',
      remaining_blockers: ['target owner gate and baseline validation still required before promotion'],
      evidence_refs: [
        `receipt:opl-meta-agent/${targetAgent.domain_id}/stage-decomposition-pack-draft`,
        `artifact-morphology-ref:${targetAgent.domain_id}`,
        `artifact-native-contract-ref:${targetAgent.domain_id}/${stageId}`,
        `stage-folder-contract-ref:${targetAgent.domain_id}/${stageId}`,
        ...referenceDesignSourceRefs,
        ...referenceDesignPatternPacketRefs,
        ...researchSourceRefs,
        ...researchSynthesisRefs,
        ...(stageControlPlane.reference_design_packet_ref ? [String(stageControlPlane.reference_design_packet_ref)] : []),
        ...(stageControlPlane.research_synthesis_packet_ref ? [String(stageControlPlane.research_synthesis_packet_ref)] : []),
        ...(stageControlPlane.transfer_map_ref ? [String(stageControlPlane.transfer_map_ref)] : []),
        ...(stageControlPlane.agent_pack_plan_ref ? [String(stageControlPlane.agent_pack_plan_ref)] : []),
        ...(stageControlPlane.stage_decomposition_subpacket_set_ref
          ? [String(stageControlPlane.stage_decomposition_subpacket_set_ref)]
          : []),
      ],
    },
    route_impact: {
      next_owner: 'opl-meta-agent',
      materialization_required: true,
      target_owner_gate_required: true,
    },
    authority_boundary: {
      opl: 'stage_attempt_closeout_transport_only',
      oma: 'pack_draft_authoring_refs_only',
      target_domain: 'truth_quality_artifact_gate_owner',
    },
    stage_decomposition_pack_draft: draft,
  };
}

export function buildFixtureAgentSkeletonBuildCloseout(
  input: FixtureStageSpec,
): AgentSkeletonBuildCloseoutPacket {
  const decomposition = buildFixtureStageDecompositionCloseout(input);
  const draft = decomposition.stage_decomposition_pack_draft;
  const targetAgent = input.targetAgent;
  const owner = domainLabelFor(targetAgent);
  const actionId = input.actionId ?? 'draft-agent-output';
  return {
    surface_kind: 'stage_attempt_closeout_packet',
    stage_id: 'agent-skeleton-build',
    closeout_id: `agent-skeleton-build-closeout:${targetAgent.domain_id}`,
    closeout_refs: [
      `receipt:opl-meta-agent/${targetAgent.domain_id}/agent-skeleton-build`,
    ],
    materialized_files: stageFileDrafts({
      targetAgent,
      stageControlPlane: draft.stage_control_plane,
      actionId,
      owner,
    }),
    authority_boundary: {
      opl: 'stage_attempt_closeout_transport_only',
      oma: 'agent_file_body_materialization',
      target_domain: 'truth_quality_artifact_gate_owner',
    },
  };
}
