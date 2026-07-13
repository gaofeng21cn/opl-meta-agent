import { STANDARD_AGENT_PACK_ABI } from 'opl-framework/standard-agent-pack-abi';
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
  type JsonObject,
} from '../domain-pack.ts';
import type { TargetAgent } from '../meta-agent-loop-io.ts';
import type {
  AgentSkeletonBuildFile,
  StageDecompositionPackDraft,
} from './shared.ts';
import { validateArtifactMorphologyContract } from './artifact-morphology-validator.ts';
import {
  validateAgentPackPlanObject,
  validateDesignAdmissionReceiptObject,
  validateReferenceDesignPacketObject,
  validateResearchSynthesisPacketObject,
  validateStageDecompositionSubpacketSetObject,
  validateTransferMapObject,
} from './reference-design-validator.ts';
import {
  CANONICAL_FOUNDRY_POLICY_REFS,
  DEFAULT_STAGE_EXECUTOR_BINDING_REF,
  DOMAIN_FOUNDRY_POLICY_DELTA,
  SHARED_POLICY_RELEASE,
  STANDARD_STAGE_PACK_CONFORMANCE_VERSION,
  STAGE_COMPLETION_POLICY,
  STAGE_PROGRESS_DELTA_POLICY,
  TYPED_BLOCKER_LINEAGE_POLICY,
  USER_STAGE_LOG_REQUIRED_FIELDS,
  asRecord,
  asRecordArray,
  asString,
  asStringArray,
  assertMatchingStringArray,
  assertBooleanFalse,
  domainLabelFor,
  filePlansByPath,
  filesByPath,
  isRecord,
  normalizedStringArray,
  optionalString,
  stageNativeRefsFor,
  validateRelativeMarkdownPath,
} from './shared.ts';
import {
  validateEmbeddedStageNativeArtifactContract,
  validateStageNativeArtifactContractBundle,
} from './stage-native-contract-validator.ts';

function validateNoForbiddenWritePolicy(policy: JsonObject): void {
  if (policy.refs_only !== true) {
    throw new Error('stage-decomposition pack draft no_forbidden_write_policy.refs_only must be true.');
  }
  [
    'can_write_target_domain_truth',
    'can_write_target_domain_memory_body',
    'can_mutate_target_domain_artifact_body',
    'can_authorize_target_domain_quality_or_export',
    'can_promote_default_agent_without_gate',
  ].forEach((field) => assertBooleanFalse(policy, field, `no_forbidden_write_policy.${field}`));
}

function normalizeOptionalStringArray(value: unknown, field: string): string[] | null {
  if (value === undefined || value === null) {
    return null;
  }
  return asStringArray(value, field);
}

function assertMatchingOptionalStringArray(
  actual: unknown,
  expected: unknown,
  field: string,
): void {
  const actualList = normalizeOptionalStringArray(actual, `stage_decomposition_pack_draft.target_agent.${field}`);
  const expectedList = normalizeOptionalStringArray(expected, `requested_target_agent.${field}`);
  if (JSON.stringify(actualList) !== JSON.stringify(expectedList)) {
    throw new Error(`stage-decomposition pack draft target_agent.${field} does not match requested target.`);
  }
}

function assertMatchingObject(actual: unknown, expected: unknown, field: string): void {
  const actualObject = asRecord(actual, `stage_decomposition_pack_draft.${field}`);
  if (JSON.stringify(actualObject) !== JSON.stringify(expected)) {
    throw new Error(`stage-decomposition pack draft ${field} does not match requested profile requirements.`);
  }
}

function assertOptionalRefField(
  actual: unknown,
  expected: string | null,
  field: string,
): void {
  if (!expected) {
    if (actual !== undefined && actual !== null) {
      throw new Error(`stage-decomposition pack draft ${field} must be absent when source-derived design is not active.`);
    }
    return;
  }
  if (actual !== expected) {
    throw new Error(`stage-decomposition pack draft ${field} does not match requested target.`);
  }
}

function assertOptionalRefArrayIncludes(
  actual: unknown,
  expected: string | null,
  field: string,
): void {
  if (!expected) {
    return;
  }
  if (!normalizedStringArray(actual, field).includes(expected)) {
    throw new Error(`stage-decomposition pack draft ${field} missing ${expected}.`);
  }
}

function assertReferenceDesignObjectRefs(value: JsonObject, targetAgent: TargetAgent, field: string): void {
  const packet = buildReferenceDesignPacket(targetAgent);
  const researchPacket = buildResearchSynthesisPacket(targetAgent);
  const transferMap = buildTransferMap(targetAgent);
  const agentPackPlan = buildAgentPackPlan(targetAgent);
  const designAdmissionReceipt = buildDesignAdmissionReceipt(targetAgent);
  const stageDecompositionSubpacketSet = buildStageDecompositionSubpacketSet(targetAgent);
  const packetRef = optionalString(packet?.packet_ref ?? researchPacket?.packet_ref);
  const referencePacketRef = optionalString(packet?.packet_ref);
  const researchPacketRef = optionalString(researchPacket?.packet_ref);
  const transferMapRef = optionalString(transferMap?.transfer_map_ref);
  const agentPackPlanRef = optionalString(agentPackPlan?.plan_ref);
  const designAdmissionReceiptRef = optionalString(designAdmissionReceipt?.receipt_ref);
  const buildReceiptRef = designAdmissionReceiptRef
    ? buildAgentBuildReceiptRef(targetAgent)
    : null;
  const stageDecompositionSubpacketSetRef = optionalString(stageDecompositionSubpacketSet?.packet_set_ref);
  assertOptionalRefField(value.reference_design_packet_ref, referencePacketRef, `${field}.reference_design_packet_ref`);
  assertOptionalRefField(value.research_synthesis_packet_ref, researchPacketRef, `${field}.research_synthesis_packet_ref`);
  assertOptionalRefField(value.transfer_map_ref, transferMapRef, `${field}.transfer_map_ref`);
  assertOptionalRefField(value.agent_pack_plan_ref, agentPackPlanRef, `${field}.agent_pack_plan_ref`);
  assertOptionalRefField(value.design_admission_receipt_ref, designAdmissionReceiptRef, `${field}.design_admission_receipt_ref`);
  assertOptionalRefField(value.expected_build_receipt_ref, buildReceiptRef, `${field}.expected_build_receipt_ref`);
  for (const forbiddenField of ['build_receipt', 'build_receipt_ref', 'build_receipt_refs']) {
    if (Object.hasOwn(value, forbiddenField)) {
      throw new Error(`stage-decomposition pack draft ${field}.${forbiddenField} is forbidden before materialization.`);
    }
  }
  assertOptionalRefField(
    value.stage_decomposition_subpacket_set_ref,
    stageDecompositionSubpacketSetRef,
    `${field}.stage_decomposition_subpacket_set_ref`,
  );
  assertOptionalRefArrayIncludes(
    value.reference_design_packet_refs,
    referencePacketRef,
    `${field}.reference_design_packet_refs`,
  );
  assertOptionalRefArrayIncludes(
    value.research_synthesis_packet_refs,
    researchPacketRef,
    `${field}.research_synthesis_packet_refs`,
  );
  assertOptionalRefArrayIncludes(value.transfer_map_refs, transferMapRef, `${field}.transfer_map_refs`);
  assertOptionalRefArrayIncludes(value.agent_pack_plan_refs, agentPackPlanRef, `${field}.agent_pack_plan_refs`);
  assertOptionalRefArrayIncludes(
    value.design_admission_receipt_refs,
    designAdmissionReceiptRef,
    `${field}.design_admission_receipt_refs`,
  );
  assertOptionalRefArrayIncludes(
    value.stage_decomposition_subpacket_set_refs,
    stageDecompositionSubpacketSetRef,
    `${field}.stage_decomposition_subpacket_set_refs`,
  );

  if (
    packetRef
    && transferMapRef
    && agentPackPlanRef
    && designAdmissionReceiptRef
    && buildReceiptRef
    && stageDecompositionSubpacketSetRef
  ) {
    const actualReferencePacket = referencePacketRef
      ? asRecord(value.reference_design_packet, `${field}.reference_design_packet`)
      : null;
    const actualResearchPacket = researchPacketRef
      ? asRecord(value.research_synthesis_packet, `${field}.research_synthesis_packet`)
      : null;
    const actualTransferMap = asRecord(value.transfer_map, `${field}.transfer_map`);
    const actualAgentPackPlan = asRecord(value.agent_pack_plan, `${field}.agent_pack_plan`);
    const actualDesignAdmissionReceipt = asRecord(value.design_admission_receipt, `${field}.design_admission_receipt`);
    const actualSubpacketSet = asRecord(
      value.stage_decomposition_subpacket_set,
      `${field}.stage_decomposition_subpacket_set`,
    );
    if (actualReferencePacket && referencePacketRef) {
      validateReferenceDesignPacketObject(actualReferencePacket, targetAgent, referencePacketRef, transferMapRef, field);
    }
    if (actualResearchPacket && researchPacketRef) {
      validateResearchSynthesisPacketObject(actualResearchPacket, targetAgent, researchPacketRef, field);
    }
    validateTransferMapObject(actualTransferMap, targetAgent, packetRef, transferMapRef, field);
    validateAgentPackPlanObject(actualAgentPackPlan, targetAgent, packetRef, transferMapRef, agentPackPlanRef, field);
    validateDesignAdmissionReceiptObject(
      actualDesignAdmissionReceipt,
      targetAgent,
      packetRef,
      transferMapRef,
      agentPackPlanRef,
      designAdmissionReceiptRef,
      field,
    );
    validateStageDecompositionSubpacketSetObject(
      actualSubpacketSet,
      targetAgent,
      packetRef,
      transferMapRef,
      agentPackPlanRef,
      designAdmissionReceiptRef,
      buildReceiptRef,
      stageDecompositionSubpacketSetRef,
      field,
    );
  }
}

function sourceDerivedObjectRequirementRefs(targetAgent: TargetAgent): string[] {
  const packet = buildReferenceDesignPacket(targetAgent);
  const researchPacket = buildResearchSynthesisPacket(targetAgent);
  const transferMap = buildTransferMap(targetAgent);
  const agentPackPlan = buildAgentPackPlan(targetAgent);
  const designAdmissionReceipt = buildDesignAdmissionReceipt(targetAgent);
  const stageDecompositionSubpacketSet = buildStageDecompositionSubpacketSet(targetAgent);
  return [
    optionalString(packet?.packet_ref) ? `reference-design-packet-ref:${String(packet?.packet_ref)}` : null,
    optionalString(researchPacket?.packet_ref) ? `research-synthesis-packet-ref:${String(researchPacket?.packet_ref)}` : null,
    optionalString(transferMap?.transfer_map_ref) ? `transfer-map-ref:${String(transferMap?.transfer_map_ref)}` : null,
    optionalString(agentPackPlan?.plan_ref) ? `agent-pack-plan-ref:${String(agentPackPlan?.plan_ref)}` : null,
    optionalString(designAdmissionReceipt?.receipt_ref)
      ? `design-admission-receipt-ref:${String(designAdmissionReceipt?.receipt_ref)}`
      : null,
    optionalString(stageDecompositionSubpacketSet?.packet_set_ref)
      ? `stage-decomposition-subpacket-set-ref:${String(stageDecompositionSubpacketSet?.packet_set_ref)}`
      : null,
  ].filter((entry): entry is string => Boolean(entry));
}

function validateReferenceDesignBoundary(
  boundaryValue: unknown,
  targetAgent: TargetAgent,
  field: string,
): void {
  const boundary = asRecord(boundaryValue, field);
  assertMatchingStringArray(boundary.source_refs, targetAgent.reference_design_source_refs, `${field}.source_refs`);
  assertMatchingStringArray(boundary.pattern_notes, targetAgent.reference_design_pattern_notes, `${field}.pattern_notes`);
  assertMatchingStringArray(
    boundary.pattern_packet_refs,
    targetAgent.reference_design_pattern_packet_refs,
    `${field}.pattern_packet_refs`,
  );
  assertMatchingStringArray(
    boundary.research_source_refs,
    targetAgent.research_source_refs,
    `${field}.research_source_refs`,
  );
  assertMatchingStringArray(
    boundary.expert_practice_notes,
    targetAgent.expert_practice_notes,
    `${field}.expert_practice_notes`,
  );
  assertMatchingStringArray(
    boundary.research_synthesis_refs,
    targetAgent.research_synthesis_refs,
    `${field}.research_synthesis_refs`,
  );
  if (boundary.role !== 'external_architecture_or_research_inspiration_not_target_domain_truth') {
    throw new Error(`stage-decomposition pack draft ${field}.role must mark reference/research designs as inspiration only.`);
  }
  assertOptionalRefField(
    boundary.reference_design_packet_ref,
    optionalString(buildReferenceDesignPacket(targetAgent)?.packet_ref),
    `${field}.reference_design_packet_ref`,
  );
  assertOptionalRefField(
    boundary.research_synthesis_packet_ref,
    optionalString(buildResearchSynthesisPacket(targetAgent)?.packet_ref),
    `${field}.research_synthesis_packet_ref`,
  );
  assertOptionalRefField(
    boundary.transfer_map_ref,
    optionalString(buildTransferMap(targetAgent)?.transfer_map_ref),
    `${field}.transfer_map_ref`,
  );
  assertOptionalRefField(
    boundary.agent_pack_plan_ref,
    optionalString(buildAgentPackPlan(targetAgent)?.plan_ref),
    `${field}.agent_pack_plan_ref`,
  );
  assertOptionalRefField(
    boundary.design_admission_receipt_ref,
    optionalString(buildDesignAdmissionReceipt(targetAgent)?.receipt_ref),
    `${field}.design_admission_receipt_ref`,
  );
  [
    'can_copy_external_runtime',
    'can_copy_external_domain_truth',
    'can_replace_target_owner_judgment',
  ].forEach((fieldName) => assertBooleanFalse(boundary, fieldName, `${field}.${fieldName}`));
}

function assertMatchingProfileSelectionFields(value: JsonObject, targetAgent: TargetAgent, field: string): void {
  const receipt = buildProfileSelectionReceipt(targetAgent);
  if (value.profile_selection_mode !== receipt.profile_selection_mode) {
    throw new Error(`stage-decomposition pack draft ${field}.profile_selection_mode does not match requested target.`);
  }
  assertMatchingStringArray(
    value.selected_profile_refs,
    targetAgent.selected_opl_profile_refs,
    `${field}.selected_profile_refs`,
  );
  assertMatchingObject(
    value.profile_requirements,
    buildProfileRequirements(targetAgent),
    `${field}.profile_requirements`,
  );
  assertMatchingStringArray(
    value.reference_design_pattern_packet_refs,
    targetAgent.reference_design_pattern_packet_refs,
    `${field}.reference_design_pattern_packet_refs`,
  );
  assertMatchingStringArray(
    value.research_source_refs,
    targetAgent.research_source_refs,
    `${field}.research_source_refs`,
  );
  assertMatchingStringArray(
    value.expert_practice_notes,
    targetAgent.expert_practice_notes,
    `${field}.expert_practice_notes`,
  );
  assertMatchingStringArray(
    value.research_synthesis_refs,
    targetAgent.research_synthesis_refs,
    `${field}.research_synthesis_refs`,
  );
  const expectedTransferablePatternRequirements = buildTransferablePatternRequirements(targetAgent);
  const actualTransferablePatternRequirements = normalizedStringArray(
    value.transferable_pattern_requirements,
    `${field}.transferable_pattern_requirements`,
  );
  if (JSON.stringify(actualTransferablePatternRequirements) !== JSON.stringify(expectedTransferablePatternRequirements)) {
    throw new Error(`stage-decomposition pack draft ${field}.transferable_pattern_requirements does not match requested target.`);
  }
  const expectedCapabilityPlanRequirements = buildCapabilityPlanRequirements(targetAgent);
  const actualCapabilityPlanRequirements = normalizedStringArray(
    value.capability_plan_requirements,
    `${field}.capability_plan_requirements`,
  );
  if (JSON.stringify(actualCapabilityPlanRequirements) !== JSON.stringify(expectedCapabilityPlanRequirements)) {
    throw new Error(`stage-decomposition pack draft ${field}.capability_plan_requirements does not match requested target.`);
  }
  const expectedSourceReceipt = receipt.source_derived_design_receipt;
  if (JSON.stringify(value.source_derived_design_receipt ?? null) !== JSON.stringify(expectedSourceReceipt ?? null)) {
    throw new Error(`stage-decomposition pack draft ${field}.source_derived_design_receipt does not match requested target.`);
  }
  const expectedResearchReceipt = receipt.research_driven_design_receipt;
  if (JSON.stringify(value.research_driven_design_receipt ?? null) !== JSON.stringify(expectedResearchReceipt ?? null)) {
    throw new Error(`stage-decomposition pack draft ${field}.research_driven_design_receipt does not match requested target.`);
  }
  assertReferenceDesignObjectRefs(value, targetAgent, field);
}

function validateProfileRequirementBody(
  files: Map<string, string>,
  relPath: string,
  targetAgent: TargetAgent,
  field: string,
): void {
  const body = files.get(relPath) ?? '';
  const selectedProfileRefs = normalizedStringArray(
    targetAgent.selected_opl_profile_refs,
    'requested_target_agent.selected_opl_profile_refs',
  );
  selectedProfileRefs.forEach((profileRef) => {
    if (!body.includes(profileRef)) {
      throw new Error(`stage-decomposition pack draft ${field} missing selected OPL profile ref ${profileRef}.`);
    }
  });
  const profileRequirements = buildProfileRequirements(targetAgent);
  const requiredEvidenceObjects = normalizedStringArray(
    profileRequirements.required_evidence_objects,
    'profile_requirements.required_evidence_objects',
  );
  ['EvidencePacket', 'IndependentReviewReceipt'].forEach((objectName) => {
    if (requiredEvidenceObjects.includes(objectName) && !body.includes(objectName)) {
      throw new Error(`stage-decomposition pack draft ${field} missing profile evidence object ${objectName}.`);
    }
  });
}

function validateActionCatalog(catalog: JsonObject, targetAgent: TargetAgent): void {
  if (catalog.surface_kind !== 'family_action_catalog') {
    throw new Error('stage-decomposition pack draft action_catalog.surface_kind must be family_action_catalog.');
  }
  if (catalog.target_domain_id !== targetAgent.domain_id) {
    throw new Error('stage-decomposition pack draft action_catalog target_domain_id does not match target agent.');
  }
  const actions = asRecordArray(catalog.actions, 'action_catalog.actions');
  actions.forEach((action) => {
    asString(action.action_id, 'action_catalog.actions[].action_id');
    const boundary = asRecord(action.authority_boundary, 'action_catalog.actions[].authority_boundary');
    [
      'can_write_target_domain_truth',
      'can_write_target_domain_memory_body',
      'can_mutate_target_domain_artifact_body',
      'can_authorize_target_domain_quality_or_export',
    ].forEach((field) => assertBooleanFalse(boundary, field, `action_catalog.actions[].authority_boundary.${field}`));
  });
}

function validateStageRefs(
  stage: JsonObject,
  field: string,
  refKind: string,
  prefix: string,
  files: Map<string, string>,
): string[] {
  const refs = asRecordArray(stage[field], `stage.${field}`);
  return refs.map((entry) => {
    if (entry.ref_kind !== refKind) {
      throw new Error(`stage-decomposition pack draft ${field} must use ${refKind}.`);
    }
    const relPath = validateRelativeMarkdownPath(entry.ref, `stage.${field}.ref`);
    if (!relPath.startsWith(prefix)) {
      throw new Error(`stage-decomposition pack draft ${field} refs must live under ${prefix}.`);
    }
    if (!files.has(relPath)) {
      throw new Error(`stage-decomposition pack draft ${field} ref has no file body: ${relPath}`);
    }
    return relPath;
  });
}

function validateToolAffordanceBoundary(stageId: string, stage: JsonObject, files: Map<string, string>): string[] {
  const toolRefs = asRecordArray(stage.tool_refs, `stage ${stageId}.tool_refs`);
  const toolPaths = toolRefs.map((entry) => {
    const relPath = validateRelativeMarkdownPath(entry.ref, `stage ${stageId}.tool_refs.ref`);
    if (!relPath.startsWith('agent/tools/')) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} tool_refs must live under agent/tools/.`);
    }
    if (!files.has(relPath)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} tool ref has no file body: ${relPath}`);
    }
    return relPath;
  });
  const boundary = asRecord(stage.tool_affordance_boundary, `stage ${stageId}.tool_affordance_boundary`);
  if (boundary.catalog_role !== 'available_affordance_catalog_not_workflow_script') {
    throw new Error(`stage-decomposition pack draft stage ${stageId} tool_affordance_boundary.catalog_role is invalid.`);
  }
  [
    'capability_refs',
    'permission_scope_refs',
    'credential_boundary_refs',
    'write_scope_refs',
    'side_effect_risk_refs',
    'forbidden_authority_refs',
  ].forEach((field) => asRecordArray(boundary[field], `stage ${stageId}.tool_affordance_boundary.${field}`));
  const autonomy = asRecord(boundary.executor_autonomy, `stage ${stageId}.tool_affordance_boundary.executor_autonomy`);
  [
    'executor_can_choose_tools',
    'executor_can_skip_tools',
    'executor_can_substitute_tools_within_boundary',
    'executor_can_choose_order_and_parallelism',
    'executor_can_request_missing_context_or_human_gate',
  ].forEach((field) => {
    if (autonomy[field] !== true) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} tool_affordance_boundary.${field} must be true.`);
    }
  });
  [
    'tool_catalog_can_prescribe_tool_sequence',
    'tool_catalog_can_define_cognitive_strategy',
    'tool_catalog_can_override_stage_goal',
    'tool_catalog_can_authorize_forbidden_write',
  ].forEach((field) => assertBooleanFalse(autonomy, field, `stage ${stageId}.tool_affordance_boundary.${field}`));
  return toolPaths;
}

function validateQualityGateBody(files: Map<string, string>, qualityGatePath: string): void {
  const body = files.get(qualityGatePath) ?? '';
  if (!/Quality gate declaration is required/i.test(body)) {
    throw new Error(`stage-decomposition pack draft quality gate declaration missing: ${qualityGatePath}`);
  }
  if (!/Dedicated review stage is conditional/i.test(body)) {
    throw new Error(`stage-decomposition pack draft dedicated review stage policy missing: ${qualityGatePath}`);
  }
}

function validateStageCompletionPolicy(
  policy: JsonObject,
  targetAgent: TargetAgent,
  stageId: string,
): void {
  if (policy.surface_kind !== STAGE_COMPLETION_POLICY.surface_kind) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} stage_completion_policy.surface_kind is invalid.`);
  }
  if (policy.policy_ref !== `stage-completion-policy-ref:${targetAgent.domain_id}/${stageId}`) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} stage_completion_policy.policy_ref is invalid.`);
  }
  if (policy.stage_id !== stageId || policy.target_domain_id !== targetAgent.domain_id) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} stage_completion_policy identity is invalid.`);
  }
  if (policy.completion_judgment_owner !== 'domain_stage') {
    throw new Error(`stage-decomposition pack draft stage ${stageId} completion judgment must be domain-stage owned.`);
  }
  if (policy.closeout_packet_required !== false) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} closeout packet must not gate progress.`);
  }
  if (policy.raw_artifact_sufficient_for_progress !== true) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} must allow raw artifact progress.`);
  }
  [
    'provider_completion_is_domain_completion',
    'opl_content_judgment_allowed',
  ].forEach((field) => assertBooleanFalse(policy, field, `stage ${stageId}.stage_completion_policy.${field}`));
  if (policy.next_stage_transition_owner !== 'codex_cli') {
    throw new Error(`stage-decomposition pack draft stage ${stageId} next_stage_transition_owner must be codex_cli.`);
  }
  const outcomes = asStringArray(
    policy.required_closeout_outcomes,
    `stage ${stageId}.stage_completion_policy.required_closeout_outcomes`,
  );
  [
    'completed_and_continue',
    'completed_and_wait_owner',
    'route_back',
    'blocked',
    'rejected',
  ].forEach((outcome) => {
    if (!outcomes.includes(outcome)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} stage_completion_policy missing outcome ${outcome}.`);
    }
  });
  const refFields = asStringArray(
    policy.accepted_closeout_ref_fields,
    `stage ${stageId}.stage_completion_policy.accepted_closeout_ref_fields`,
  );
  [
    'owner_receipt_ref',
    'typed_blocker_ref',
    'human_gate_ref',
    'route_back_ref',
  ].forEach((field) => {
    if (!refFields.includes(field)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} stage_completion_policy missing ref field ${field}.`);
    }
  });
  const boundary = asRecord(policy.authority_boundary, `stage ${stageId}.stage_completion_policy.authority_boundary`);
  if (boundary.readable_file_counts_as_stage_progress !== true) {
    throw new Error(
      `stage-decomposition pack draft stage ${stageId} must allow readable file artifacts to advance progression.`,
    );
  }
  [
    'opl_can_decide_domain_completion',
    'provider_completion_counts_as_stage_complete',
    'framework_can_accept_reject_or_override_codex_route',
    'suite_pass_counts_as_stage_complete',
    'conformance_pass_counts_as_stage_complete',
  ].forEach((field) => assertBooleanFalse(boundary, field, `stage ${stageId}.stage_completion_policy.authority_boundary.${field}`));
}

function validateStageControlPlane(
  stageControl: JsonObject,
  actionCatalog: JsonObject,
  artifactMorphologyContract: JsonObject,
  targetAgent: TargetAgent,
  files: Map<string, string>,
  validateFileBodies = false,
): void {
  if (stageControl.surface_kind !== 'family_stage_control_plane') {
    throw new Error('stage-decomposition pack draft stage_control_plane.surface_kind must be family_stage_control_plane.');
  }
  if (stageControl.target_domain_id !== targetAgent.domain_id) {
    throw new Error('stage-decomposition pack draft stage_control_plane target_domain_id does not match target agent.');
  }
  if (stageControl.stage_pack_conformance_version !== STANDARD_STAGE_PACK_CONFORMANCE_VERSION) {
    throw new Error(`stage-decomposition pack draft stage_control_plane.stage_pack_conformance_version must be ${STANDARD_STAGE_PACK_CONFORMANCE_VERSION}.`);
  }
  assertMatchingProfileSelectionFields(stageControl, targetAgent, 'stage_control_plane');
  if (stageControl.profile_selection_receipt_ref !== 'contracts/capability_map.json#/profile_selection_receipt') {
    throw new Error('stage-decomposition pack draft stage_control_plane missing profile_selection_receipt_ref.');
  }
  const actionIds = new Set(asRecordArray(actionCatalog.actions, 'action_catalog.actions').map((action) => (
    asString(action.action_id, 'action.action_id')
  )));
  const stages = asRecordArray(stageControl.stages, 'stage_control_plane.stages');
  const designBasisActive = buildDesignAdmissionReceipt(targetAgent) !== null;
  const expectedPlannedStages = designBasisActive
    ? asRecordArray(
        buildAgentPackPlan(targetAgent)?.planned_stage_refs,
        'expected_agent_pack_plan.planned_stage_refs',
      )
    : [];
  const expectedPlannedStagesById = new Map(expectedPlannedStages.map((stage) => [
    asString(stage.stage_id, 'expected_agent_pack_plan.planned_stage_refs[].stage_id'),
    stage,
  ]));
  if (designBasisActive && stages.length !== expectedPlannedStages.length) {
    throw new Error(
      'stage-decomposition pack draft stage_control_plane.stages must materialize every AgentPackPlan stage exactly once.',
    );
  }
  if (new Set(stages.map((stage) => stage.stage_id)).size !== stages.length) {
    throw new Error('stage-decomposition pack draft stage_control_plane stage ids must be unique.');
  }
  const morphologyRefs = asRecord(artifactMorphologyContract.stage_refs, 'artifact_morphology_contract.stage_refs');
  const requiredMorphologyRefs = [
    asString(morphologyRefs.artifact_morphology_ref, 'artifact_morphology_contract.stage_refs.artifact_morphology_ref'),
    asString(morphologyRefs.native_source_format_ref, 'artifact_morphology_contract.stage_refs.native_source_format_ref'),
    asString(morphologyRefs.shard_unit_ref, 'artifact_morphology_contract.stage_refs.shard_unit_ref'),
    asString(morphologyRefs.extent_contract_ref, 'artifact_morphology_contract.stage_refs.extent_contract_ref'),
    asString(morphologyRefs.asset_custody_ref, 'artifact_morphology_contract.stage_refs.asset_custody_ref'),
  ];
  const hasStageFile = [...files.keys()].some((relPath) => relPath.startsWith('agent/stages/') && !relPath.endsWith('/README.md'));
  if (!hasStageFile) {
    throw new Error('stage-decomposition pack draft must include a real agent/stages markdown file.');
  }
  stages.forEach((stage) => {
    const stageId = asString(stage.stage_id, 'stage.stage_id');
    assertMatchingProfileSelectionFields(stage, targetAgent, `stage ${stageId}`);
    if (stage.profile_selection_receipt_ref !== 'contracts/capability_map.json#/profile_selection_receipt') {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing profile_selection_receipt_ref.`);
    }
    if (designBasisActive) {
      const expectedPlannedStage = expectedPlannedStagesById.get(stageId);
      if (!expectedPlannedStage) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} is not declared by AgentPackPlan.`);
      }
      if (stage.stage_origin !== expectedPlannedStage.origin) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} origin does not match AgentPackPlan.`);
      }
      const stagePatternSourceRefs = normalizedStringArray(
        stage.stage_pattern_source_refs,
        `stage ${stageId}.stage_pattern_source_refs`,
      );
      if (expectedPlannedStage.origin === 'source_pattern_ref') {
        const expectedPatternRef = asString(
          expectedPlannedStage.source_pattern_ref,
          `expected_agent_pack_plan.${stageId}.source_pattern_ref`,
        );
        if (stagePatternSourceRefs.length !== 1 || stagePatternSourceRefs[0] !== expectedPatternRef) {
          throw new Error(
            `stage-decomposition pack draft stage ${stageId} stage_pattern_source_refs must equal ${expectedPatternRef}.`,
          );
        }
        if (
          stage.pattern_id !== expectedPlannedStage.pattern_id
          || stage.step_id !== expectedPlannedStage.step_id
          || JSON.stringify(normalizedStringArray(stage.source_step_ids, `stage ${stageId}.source_step_ids`))
            !== JSON.stringify(normalizedStringArray(
              expectedPlannedStage.source_step_ids,
              `expected_agent_pack_plan.${stageId}.source_step_ids`,
            ))
          || JSON.stringify(stage.source_step_mappings)
            !== JSON.stringify(expectedPlannedStage.source_step_mappings)
          || stage.provenance_kind !== expectedPlannedStage.provenance_kind
          || JSON.stringify(normalizedStringArray(stage.source_anchor_refs, `stage ${stageId}.source_anchor_refs`))
            !== JSON.stringify(normalizedStringArray(
              expectedPlannedStage.source_anchor_refs,
              `expected_agent_pack_plan.${stageId}.source_anchor_refs`,
            ))
        ) {
          throw new Error(`stage-decomposition pack draft stage ${stageId} workflow provenance does not match AgentPackPlan.`);
        }
      } else if (
        stagePatternSourceRefs.length !== 0
        || stage.target_only_requirement_ref !== expectedPlannedStage.target_only_requirement_ref
      ) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} target-only requirement does not match AgentPackPlan.`);
      }
    }
    validateReferenceDesignBoundary(
      stage.reference_design_boundary,
      targetAgent,
      `stage ${stageId}.reference_design_boundary`,
    );
    const inputs = asRecordArray(stage.inputs, `stage ${stageId}.inputs`);
    [
      ...(
        normalizedStringArray(
          targetAgent.reference_design_source_refs,
          'requested_target_agent.reference_design_source_refs',
        ).length > 0
          ? [{ kind: 'reference_design_source_refs', ref: `reference-design-source-refs:${targetAgent.domain_id}` }]
          : []
      ),
      ...(
        normalizedStringArray(
          targetAgent.reference_design_pattern_packet_refs,
          'requested_target_agent.reference_design_pattern_packet_refs',
        ).length > 0
          ? [{
              kind: 'reference_design_pattern_packet_refs',
              ref: `reference-design-pattern-packet-refs:${targetAgent.domain_id}`,
            }]
          : []
      ),
      ...(
        normalizedStringArray(
          targetAgent.research_source_refs,
          'requested_target_agent.research_source_refs',
        ).length > 0
          ? [{ kind: 'research_source_refs', ref: `research-source-refs:${targetAgent.domain_id}` }]
          : []
      ),
      ...(
        normalizedStringArray(
          targetAgent.expert_practice_notes,
          'requested_target_agent.expert_practice_notes',
        ).length > 0
          ? [{ kind: 'expert_practice_notes', ref: `expert-practice-notes:${targetAgent.domain_id}` }]
          : []
      ),
      ...(
        normalizedStringArray(
          targetAgent.research_synthesis_refs,
          'requested_target_agent.research_synthesis_refs',
        ).length > 0
          ? [{ kind: 'research_synthesis_refs', ref: `research-synthesis-refs:${targetAgent.domain_id}` }]
          : []
      ),
    ].forEach((expected) => {
      if (!inputs.some((entry) => entry.ref_kind === expected.kind && entry.ref === expected.ref)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} missing input ${expected.kind}.`);
      }
    });
    [
      ...sourceDerivedObjectRequirementRefs(targetAgent),
    ].forEach((expectedRef) => {
      const refKind = expectedRef.startsWith('reference-design-packet-ref:')
        ? 'reference_design_packet_ref'
        : expectedRef.startsWith('research-synthesis-packet-ref:')
          ? 'research_synthesis_packet_ref'
          : expectedRef.startsWith('transfer-map-ref:')
          ? 'transfer_map_ref'
          : expectedRef.startsWith('agent-pack-plan-ref:')
            ? 'agent_pack_plan_ref'
            : expectedRef.startsWith('design-admission-receipt-ref:')
              ? 'design_admission_receipt_ref'
              : 'stage_decomposition_subpacket_set_ref';
      const rawRef = expectedRef.replace(
        /^reference-design-packet-ref:|^research-synthesis-packet-ref:|^transfer-map-ref:|^agent-pack-plan-ref:|^design-admission-receipt-ref:|^stage-decomposition-subpacket-set-ref:/,
        '',
      );
      if (!inputs.some((entry) => entry.ref_kind === refKind && entry.ref === rawRef)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} missing source-derived design object input ${rawRef}.`);
      }
    });
    if (!inputs.some((entry) =>
      entry.ref_kind === 'profile_selection_receipt_ref'
      && entry.ref === 'contracts/capability_map.json#/profile_selection_receipt'
    )) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing profile selection receipt input.`);
    }
    const executor = asRecord(stage.selected_executor, `stage ${stageId}.selected_executor`);
    if (executor.executor_kind !== 'codex_cli' || executor.default_executor !== true) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} must select codex_cli as default executor.`);
    }
    if (executor.executor_binding_ref !== DEFAULT_STAGE_EXECUTOR_BINDING_REF) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} must use ${DEFAULT_STAGE_EXECUTOR_BINDING_REF} executor binding.`);
    }
    const promptRefs = validateStageRefs(stage, 'prompt_refs', 'domain_prompt_ref', 'agent/prompts/', files);
    const skillRefs = validateStageRefs(stage, 'skills', 'domain_skill_ref', 'agent/skills/', files);
    const toolRefs = validateToolAffordanceBoundary(stageId, stage, files);
    const knowledgeRefs = validateStageRefs(stage, 'knowledge_refs', 'domain_knowledge_ref', 'agent/knowledge/', files);
    const qualityGateRefs = validateStageRefs(stage, 'evaluation', 'domain_quality_gate_ref', 'agent/quality_gates/', files);
    if (validateFileBodies) {
      [...promptRefs, ...knowledgeRefs, ...qualityGateRefs].forEach((relPath) =>
        validateProfileRequirementBody(files, relPath, targetAgent, `${relPath}`)
      );
      qualityGateRefs.forEach((qualityGatePath) => validateQualityGateBody(files, qualityGatePath));
    }

    const allowedActions = asStringArray(stage.allowed_action_refs, `stage ${stageId}.allowed_action_refs`);
    allowedActions.forEach((actionId) => {
      if (!actionIds.has(actionId)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} references unknown action ${actionId}.`);
      }
    });
    const gate = asRecord(stage.independent_gate_policy, `stage ${stageId}.independent_gate_policy`);
    if (!qualityGateRefs.includes(String(gate.gate_ref))) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} independent_gate_policy.gate_ref must reference a declared quality gate file.`);
    }
    if (gate.execution_review_separation_required !== true) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} rejects self-review: execution_review_separation_required must be true.`);
    }
    [
      'mechanical_completion_can_close_stage',
      'provider_completion_can_claim_domain_ready',
      'generated_surface_readiness_can_claim_quality_or_export',
    ].forEach((field) => assertBooleanFalse(gate, field, `stage ${stageId}.independent_gate_policy.${field}`));

    const contract = asRecord(stage.stage_contract, `stage ${stageId}.stage_contract`);
    const requires = asStringArray(contract.requires, `stage ${stageId}.stage_contract.requires`);
    const ensures = asStringArray(contract.ensures, `stage ${stageId}.stage_contract.ensures`);
    const stageNativeRefs = stageNativeRefsFor(targetAgent.domain_id, stageId);
    const stageCompletionPolicy = asRecord(
      contract.stage_completion_policy,
      `stage ${stageId}.stage_contract.stage_completion_policy`,
    );
    validateStageCompletionPolicy(stageCompletionPolicy, targetAgent, stageId);
    const stageCloseoutPacketRef = `stage-closeout-packet-ref:${targetAgent.domain_id}/${stageId}/{stage_attempt_id}`;
    [
      `stage-completion-policy-ref:${targetAgent.domain_id}/${stageId}`,
      stageNativeRefs.artifactNativeContractRef,
      ...promptRefs.map((entry) => `prompt-ref:${entry}`),
      ...skillRefs.map((entry) => `skill-ref:${entry}`),
      ...toolRefs.map((entry) => `tool-affordance-ref:${entry}`),
      ...knowledgeRefs.map((entry) => `knowledge-ref:${entry}`),
      ...qualityGateRefs.map((entry) => `quality-gate-ref:${entry}`),
      ...allowedActions.map((entry) => `action-ref:${entry}`),
      ...requiredMorphologyRefs,
    ].forEach((requiredRef) => {
      if (!requires.includes(requiredRef)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} missing required ref ${requiredRef}.`);
      }
    });
    if (!ensures.includes(`stage-attempt-receipt-ref:${stageId}`)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing stage attempt receipt ensure.`);
    }
    if (!ensures.includes(`independent-gate-receipt-ref:${stageId}`)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing independent gate receipt ensure.`);
    }
    if (!requires.includes('runtime-ref:stage-progress-log-user-stage-log')) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing user stage log projection requirement.`);
    }
    if (!requires.includes('profile-selection-receipt-ref:contracts/capability_map.json#/profile_selection_receipt')) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing profile selection receipt requirement.`);
    }
    [
      ...(
        normalizedStringArray(
          targetAgent.reference_design_source_refs,
          'requested_target_agent.reference_design_source_refs',
        ).length > 0 ? [`reference-design-source-refs:${targetAgent.domain_id}`] : []
      ),
      ...(
        normalizedStringArray(
          targetAgent.reference_design_pattern_packet_refs,
          'requested_target_agent.reference_design_pattern_packet_refs',
        ).length > 0 ? [`reference-design-pattern-packet-refs:${targetAgent.domain_id}`] : []
      ),
      ...(
        normalizedStringArray(
          targetAgent.research_source_refs,
          'requested_target_agent.research_source_refs',
        ).length > 0 ? [`research-source-refs:${targetAgent.domain_id}`] : []
      ),
      ...(
        normalizedStringArray(
          targetAgent.expert_practice_notes,
          'requested_target_agent.expert_practice_notes',
        ).length > 0 ? [`expert-practice-notes:${targetAgent.domain_id}`] : []
      ),
      ...(
        normalizedStringArray(
          targetAgent.research_synthesis_refs,
          'requested_target_agent.research_synthesis_refs',
        ).length > 0 ? [`research-synthesis-refs:${targetAgent.domain_id}`] : []
      ),
      ...sourceDerivedObjectRequirementRefs(targetAgent),
    ].forEach((requiredRef) => {
      if (!requires.includes(requiredRef)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} missing reference design requirement ${requiredRef}.`);
      }
    });
    if (!ensures.includes(`stage-user-log-ref:${stageId}`)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing user stage log ensure.`);
    }
    if (!ensures.includes(stageCloseoutPacketRef)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing stage closeout packet ensure.`);
    }
    [
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
      stageNativeRefs.physicalKernelLocatorRef,
      stageNativeRefs.conformanceRef,
      stageNativeRefs.workbenchConsumptionRef,
    ].forEach((ensuredRef) => {
      if (!ensures.includes(ensuredRef)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} missing stage-native ensure ${ensuredRef}.`);
      }
    });
    const expectedReceiptRefs = asRecordArray(contract.expected_receipt_refs, `stage ${stageId}.stage_contract.expected_receipt_refs`);
    if (!expectedReceiptRefs.some((entry) => entry.ref === `independent-gate-receipt-ref:${stageId}`)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing expected independent gate receipt ref.`);
    }
    if (!expectedReceiptRefs.some((entry) => entry.ref === `stage-user-log-ref:${stageId}`)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing expected user stage log receipt ref.`);
    }
    if (!expectedReceiptRefs.some((entry) => entry.ref === `stage-completion-policy-ref:${targetAgent.domain_id}/${stageId}`)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing expected stage completion policy ref.`);
    }
    const buildReceiptRef = designBasisActive ? buildAgentBuildReceiptRef(targetAgent) : null;
    if (buildReceiptRef && !expectedReceiptRefs.some((entry) => entry.ref === buildReceiptRef)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing expected agent build receipt ref.`);
    }
    if (!expectedReceiptRefs.some((entry) => entry.ref === stageCloseoutPacketRef)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing expected stage closeout packet ref.`);
    }
    const receiptSchemaRefs = asRecordArray(
      contract.receipt_schema_refs,
      `stage ${stageId}.stage_contract.receipt_schema_refs`,
    );
    if (!receiptSchemaRefs.some((entry) => entry.ref === 'contracts/owner_receipt_contract.json')) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing owner receipt schema ref.`);
    }
    const authorityFunctionRefs = asRecordArray(
      contract.authority_function_refs,
      `stage ${stageId}.stage_contract.authority_function_refs`,
    );
    if (!authorityFunctionRefs.some((entry) => entry.ref === 'runtime/authority_functions/README.md')) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing minimal authority function ref.`);
    }
    const l4EntryGate = asRecord(contract.l4_entry_gate, `stage ${stageId}.stage_contract.l4_entry_gate`);
    if (
      l4EntryGate.entry_level !== STANDARD_AGENT_PACK_ABI.l4_entry_gate.entry_level
      || l4EntryGate.can_claim_l5 !== false
      || l4EntryGate.can_claim_domain_ready !== false
    ) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} l4_entry_gate is invalid.`);
    }
    const l5EntryGate = asRecord(contract.l5_entry_gate, `stage ${stageId}.stage_contract.l5_entry_gate`);
    if (
      l5EntryGate.entry_level !== STANDARD_AGENT_PACK_ABI.l5_entry_gate.entry_level
      || l5EntryGate.conformance_pass_counts_as_l5 !== false
      || l5EntryGate.contract_validation_counts_as_l5 !== false
      || l5EntryGate.provider_completion_counts_as_l5 !== false
      || l5EntryGate.app_projection_counts_as_l5 !== false
    ) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} l5_entry_gate is invalid.`);
    }
    const embeddedMorphology = asRecord(
      contract.artifact_morphology_contract,
      `stage ${stageId}.stage_contract.artifact_morphology_contract`,
    );
    if (JSON.stringify(embeddedMorphology) !== JSON.stringify(artifactMorphologyContract)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} embedded artifact morphology contract must match top-level contract.`);
    }
    const artifactMorphologyRefs = asRecordArray(
      contract.artifact_morphology_refs,
      `stage ${stageId}.stage_contract.artifact_morphology_refs`,
    );
    requiredMorphologyRefs.forEach((expectedRef) => {
      if (!artifactMorphologyRefs.some((entry) => entry.ref === expectedRef)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} missing artifact morphology ref ${expectedRef}.`);
      }
    });
    [
      stageNativeRefs.artifactNativeContractRef,
      stageNativeRefs.stageFolderContractRef,
      stageNativeRefs.stageJsonRef,
      stageNativeRefs.attemptJsonRef,
      stageNativeRefs.manifestRef,
      stageNativeRefs.receiptRef,
      stageNativeRefs.blockerRef,
      stageNativeRefs.currentPointerRef,
      stageNativeRefs.canonicalArtifactRef,
      stageNativeRefs.exportRef,
      stageNativeRefs.lineageRef,
      stageNativeRefs.retentionRef,
      stageNativeRefs.physicalKernelLocatorRef,
      stageNativeRefs.conformanceRef,
      stageNativeRefs.workbenchConsumptionRef,
    ].forEach((expectedRef) => {
      if (!expectedReceiptRefs.some((entry) => entry.ref === expectedRef)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} missing expected stage-native ref ${expectedRef}.`);
      }
    });
    const stageNativeArtifactContract = asRecord(
      contract.stage_native_artifact_contract,
      `stage ${stageId}.stage_contract.stage_native_artifact_contract`,
    );
    validateEmbeddedStageNativeArtifactContract(stageNativeArtifactContract, stageNativeRefs, stageId);
    const userStageLog = asRecord(contract.user_stage_log_contract, `stage ${stageId}.stage_contract.user_stage_log_contract`);
    const requiredFields = asStringArray(
      userStageLog.required_domain_semantic_fields,
      `stage ${stageId}.stage_contract.user_stage_log_contract.required_domain_semantic_fields`,
    );
    for (const field of USER_STAGE_LOG_REQUIRED_FIELDS) {
      if (!requiredFields.includes(field)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} user_stage_log_contract missing field ${field}.`);
      }
    }
    const progressDeltaPolicy = asRecord(contract.progress_delta_policy, `stage ${stageId}.stage_contract.progress_delta_policy`);
    if (progressDeltaPolicy.surface_kind !== STAGE_PROGRESS_DELTA_POLICY.surface_kind) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} progress_delta_policy.surface_kind is invalid.`);
    }
    const progressRequiredFields = asStringArray(
      progressDeltaPolicy.required_fields,
      `stage ${stageId}.stage_contract.progress_delta_policy.required_fields`,
    );
    [
      'progress_delta_classification',
      'deliverable_progress_delta',
      'platform_repair_delta',
      'next_forced_delta',
    ].forEach((field) => {
      if (!progressRequiredFields.includes(field)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} progress_delta_policy missing field ${field}.`);
      }
    });
    const typedBlockerLineagePolicy = asRecord(
      contract.typed_blocker_lineage_policy,
      `stage ${stageId}.stage_contract.typed_blocker_lineage_policy`,
    );
    if (typedBlockerLineagePolicy.surface_kind !== TYPED_BLOCKER_LINEAGE_POLICY.surface_kind) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} typed_blocker_lineage_policy.surface_kind is invalid.`);
    }
    const blockerRequiredFields = asStringArray(
      typedBlockerLineagePolicy.required_fields,
      `stage ${stageId}.stage_contract.typed_blocker_lineage_policy.required_fields`,
    );
    [
      'blocker_family',
      'repeat_count',
      'next_forced_delta',
      'escalation_owner',
    ].forEach((field) => {
      if (!blockerRequiredFields.includes(field)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} typed_blocker_lineage_policy missing field ${field}.`);
      }
    });
    const boundary = asRecord(stage.authority_boundary, `stage ${stageId}.authority_boundary`);
    [
      'can_write_target_domain_truth',
      'can_write_target_domain_memory_body',
      'can_mutate_target_domain_artifact_body',
      'can_authorize_target_domain_quality_or_export',
    ].forEach((field) => assertBooleanFalse(boundary, field, `stage ${stageId}.authority_boundary.${field}`));
  });
}

export function validateStageDecompositionCloseoutPacket(
  packet: unknown,
  { targetAgent }: { targetAgent: TargetAgent },
): StageDecompositionPackDraft {
  if (!isRecord(packet)) {
    throw new Error('stage-decomposition closeout must be a typed JSON object.');
  }
  if (packet.surface_kind !== 'stage_attempt_closeout_packet') {
    throw new Error('stage-decomposition closeout must use surface_kind stage_attempt_closeout_packet.');
  }
  if (packet.stage_id !== 'stage-decomposition') {
    throw new Error('stage-decomposition closeout stage_id must be stage-decomposition.');
  }
  const closeoutRefs = asStringArray(packet.closeout_refs, 'closeout_refs');
  if (closeoutRefs.length === 0) {
    throw new Error('stage-decomposition closeout must include closeout_refs.');
  }
  const draft = asRecord(packet.stage_decomposition_pack_draft, 'stage_decomposition_pack_draft') as StageDecompositionPackDraft;
  if (draft.surface_kind !== 'opl_meta_agent_stage_decomposition_pack_draft') {
    throw new Error('stage-decomposition pack draft must declare surface_kind opl_meta_agent_stage_decomposition_pack_draft.');
  }
  if (draft.version !== 'opl-meta-agent.stage-decomposition-pack-draft.v1') {
    throw new Error('stage-decomposition pack draft version is unsupported.');
  }
  const draftTarget = asRecord(draft.target_agent, 'stage_decomposition_pack_draft.target_agent') as TargetAgent;
  if (draftTarget.domain_id !== targetAgent.domain_id) {
    throw new Error('stage-decomposition pack draft target_agent.domain_id does not match requested target.');
  }
  if ((draftTarget.domain_label ?? null) !== (targetAgent.domain_label ?? null)) {
    throw new Error('stage-decomposition pack draft target_agent.domain_label does not match requested target.');
  }
  if ((draftTarget.delivery_domain ?? null) !== (targetAgent.delivery_domain ?? null)) {
    throw new Error('stage-decomposition pack draft target_agent.delivery_domain does not match requested target.');
  }
  if ((draftTarget.target_brief ?? null) !== (targetAgent.target_brief ?? null)) {
    throw new Error('stage-decomposition pack draft target_agent.target_brief does not match requested target.');
  }
  assertMatchingOptionalStringArray(
    draftTarget.selected_opl_profile_refs,
    targetAgent.selected_opl_profile_refs,
    'selected_opl_profile_refs',
  );
  assertMatchingOptionalStringArray(
    draftTarget.reference_design_source_refs,
    targetAgent.reference_design_source_refs,
    'reference_design_source_refs',
  );
  assertMatchingOptionalStringArray(
    draftTarget.reference_design_pattern_notes,
    targetAgent.reference_design_pattern_notes,
    'reference_design_pattern_notes',
  );
  assertMatchingOptionalStringArray(
    draftTarget.reference_design_pattern_packet_refs,
    targetAgent.reference_design_pattern_packet_refs,
    'reference_design_pattern_packet_refs',
  );
  assertMatchingOptionalStringArray(
    draftTarget.research_source_refs,
    targetAgent.research_source_refs,
    'research_source_refs',
  );
  assertMatchingOptionalStringArray(
    draftTarget.expert_practice_notes,
    targetAgent.expert_practice_notes,
    'expert_practice_notes',
  );
  assertMatchingOptionalStringArray(
    draftTarget.research_synthesis_refs,
    targetAgent.research_synthesis_refs,
    'research_synthesis_refs',
  );
  validateNoForbiddenWritePolicy(asRecord(draft.no_forbidden_write_policy, 'no_forbidden_write_policy'));
  const expectedSubpacketSet = buildStageDecompositionSubpacketSet(targetAgent);
  if (expectedSubpacketSet) {
    const packet = buildReferenceDesignPacket(targetAgent);
    const researchPacket = buildResearchSynthesisPacket(targetAgent);
    const transferMap = buildTransferMap(targetAgent);
    const agentPackPlan = buildAgentPackPlan(targetAgent);
    const designAdmissionReceipt = buildDesignAdmissionReceipt(targetAgent);
    const packetRef = optionalString(packet?.packet_ref ?? researchPacket?.packet_ref);
    const transferMapRef = optionalString(transferMap?.transfer_map_ref);
    const agentPackPlanRef = optionalString(agentPackPlan?.plan_ref);
    const designAdmissionReceiptRef = optionalString(designAdmissionReceipt?.receipt_ref);
    const buildReceiptRef = buildAgentBuildReceiptRef(targetAgent);
    const subpacketSetRef = optionalString(expectedSubpacketSet.packet_set_ref);
    if (!packetRef || !transferMapRef || !agentPackPlanRef || !designAdmissionReceiptRef || !buildReceiptRef || !subpacketSetRef) {
      throw new Error('stage-decomposition pack draft expected subpacket refs are incomplete.');
    }
    assertOptionalRefField(
      draft.stage_decomposition_subpacket_set_ref,
      subpacketSetRef,
      'stage_decomposition_pack_draft.stage_decomposition_subpacket_set_ref',
    );
    assertOptionalRefArrayIncludes(
      draft.stage_decomposition_subpacket_set_refs,
      subpacketSetRef,
      'stage_decomposition_pack_draft.stage_decomposition_subpacket_set_refs',
    );
    validateStageDecompositionSubpacketSetObject(
      asRecord(draft.stage_decomposition_subpacket_set, 'stage_decomposition_pack_draft.stage_decomposition_subpacket_set'),
      targetAgent,
      packetRef,
      transferMapRef,
      agentPackPlanRef,
      designAdmissionReceiptRef,
      buildReceiptRef,
      subpacketSetRef,
      'stage_decomposition_pack_draft',
    );
  }
  const filePlans = filePlansByPath(draft.file_materialization_plan);
  const plannedFiles = new Map([...filePlans.keys()].map((filePath) => [filePath, '']));
  const artifactMorphologyContract = asRecord(
    draft.artifact_morphology_contract,
    'artifact_morphology_contract',
  );
  const actionCatalog = asRecord(draft.action_catalog, 'action_catalog');
  const stageControl = asRecord(draft.stage_control_plane, 'stage_control_plane');
  validateArtifactMorphologyContract(artifactMorphologyContract, targetAgent);
  validateActionCatalog(actionCatalog, targetAgent);
  asRecordArray(actionCatalog.actions, 'action_catalog.actions').forEach((action, index) => {
    for (const field of ['input_schema_ref', 'output_schema_ref']) {
      const schemaRef = asString(action[field], `action_catalog.actions[${index}].${field}`);
      if (!plannedFiles.has(schemaRef)) {
        throw new Error(`stage-decomposition file plan missing action schema: ${schemaRef}`);
      }
    }
  });
  validateStageControlPlane(
    stageControl,
    actionCatalog,
    artifactMorphologyContract,
    targetAgent,
    plannedFiles,
  );
  const stageNativeArtifactContract = asRecord(
    draft.stage_native_artifact_contract,
    'stage_native_artifact_contract',
  );
  validateStageNativeArtifactContractBundle(stageNativeArtifactContract, stageControl, targetAgent);
  const foundrySeries = asRecord(draft.foundry_agent_series, 'foundry_agent_series');
  if (foundrySeries.surface_kind !== 'opl_foundry_agent_series_consumer') {
    throw new Error('stage-decomposition pack draft foundry_agent_series.surface_kind is invalid.');
  }
  if (foundrySeries.version !== 'foundry-agent-series-consumer.v1') {
    throw new Error('stage-decomposition pack draft foundry_agent_series.version is invalid.');
  }
  const expectedLabel = domainLabelFor(targetAgent);
  const expectedSeriesIdentity: Record<string, string> = {
    domain_id: targetAgent.domain_id,
    foundry_agent_id: targetAgent.domain_id,
    product_layer: 'foundry_agent',
    domain_label: expectedLabel,
    authority_owner: expectedLabel,
    stage_control_plane_target_domain_id: targetAgent.domain_id,
  };
  for (const [field, expected] of Object.entries(expectedSeriesIdentity)) {
    if (foundrySeries[field] !== expected) {
      throw new Error(
        `stage-decomposition pack draft foundry_agent_series.${field} does not match the target agent.`,
      );
    }
  }
  if (Object.hasOwn(foundrySeries, 'required_identity_fields')) {
    throw new Error('stage-decomposition pack draft foundry_agent_series.required_identity_fields is retired.');
  }
  if (foundrySeries.stage_manifest_ref !== 'agent/stages/manifest.json') {
    throw new Error('stage-decomposition pack draft foundry_agent_series.stage_manifest_ref is invalid.');
  }
  if (foundrySeries.stage_control_plane_ref !== 'opl-generated:family_stage_control_plane') {
    throw new Error('stage-decomposition pack draft foundry_agent_series.stage_control_plane_ref is invalid.');
  }
  for (const [field, expected] of Object.entries(CANONICAL_FOUNDRY_POLICY_REFS)) {
    if (foundrySeries[field] !== expected) {
      throw new Error(`stage-decomposition pack draft foundry_agent_series.${field} is invalid.`);
    }
  }
  if (JSON.stringify(foundrySeries.shared_policy_release) !== JSON.stringify(SHARED_POLICY_RELEASE)) {
    throw new Error('stage-decomposition pack draft foundry_agent_series.shared_policy_release is invalid.');
  }
  if (JSON.stringify(foundrySeries.domain_policy_delta) !== JSON.stringify(DOMAIN_FOUNDRY_POLICY_DELTA)) {
    throw new Error('stage-decomposition pack draft foundry_agent_series.domain_policy_delta is invalid.');
  }
  const foundryAuthority = asRecord(foundrySeries.authority_boundary, 'foundry_agent_series.authority_boundary');
  [
    'oma_can_write_target_domain_truth',
    'oma_can_write_target_domain_memory_body',
    'oma_can_mutate_target_domain_artifact_body',
    'oma_can_authorize_target_domain_quality_or_export',
    'generated_surface_can_claim_domain_ready',
  ].forEach((field) => assertBooleanFalse(foundryAuthority, field, `foundry_agent_series.authority_boundary.${field}`));
  return {
    ...draft,
    artifact_morphology_contract: artifactMorphologyContract,
    stage_native_artifact_contract: stageNativeArtifactContract,
    foundry_agent_series: foundrySeries,
    file_materialization_plan: {
      ...draft.file_materialization_plan,
      files: [...filePlans.values()],
    },
  };
}

export function validateAgentSkeletonBuildCloseoutPacket(
  packet: unknown,
  {
    targetAgent,
    packDraft,
  }: {
    targetAgent: TargetAgent;
    packDraft: StageDecompositionPackDraft;
  },
): AgentSkeletonBuildFile[] {
  if (!isRecord(packet)) {
    throw new Error('agent-skeleton-build closeout must be a typed JSON object.');
  }
  if (packet.surface_kind !== 'stage_attempt_closeout_packet' || packet.stage_id !== 'agent-skeleton-build') {
    throw new Error('agent-skeleton-build closeout identity is invalid.');
  }
  if (asStringArray(packet.closeout_refs, 'agent-skeleton-build.closeout_refs').length === 0) {
    throw new Error('agent-skeleton-build closeout must include closeout_refs.');
  }
  const files = filesByPath(packet.materialized_files);
  const plannedFiles = filePlansByPath(packDraft.file_materialization_plan);
  if (JSON.stringify([...files.keys()]) !== JSON.stringify([...plannedFiles.keys()])) {
    throw new Error('agent-skeleton-build materialized files must exactly cover the stage-decomposition file plan.');
  }
  for (const [filePath, body] of files) {
    if (!filePath.endsWith('.schema.json')) continue;
    const schema = JSON.parse(body) as JsonObject;
    if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema' || schema.type !== 'object') {
      throw new Error(`agent-skeleton-build action schema is invalid: ${filePath}`);
    }
  }
  validateStageControlPlane(
    asRecord(packDraft.stage_control_plane, 'stage_control_plane'),
    asRecord(packDraft.action_catalog, 'action_catalog'),
    asRecord(packDraft.artifact_morphology_contract, 'artifact_morphology_contract'),
    targetAgent,
    files,
    true,
  );
  return [...files.entries()].map(([filePath, body]) => ({ path: filePath, body }));
}
