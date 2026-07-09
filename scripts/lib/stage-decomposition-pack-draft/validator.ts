import {
  buildProfileRequirements,
  type JsonObject,
} from '../domain-pack.ts';
import type { TargetAgent } from '../meta-agent-loop-io.ts';
import type { StageDecompositionPackDraft } from './shared.ts';
import { validateArtifactMorphologyContract } from './artifact-morphology-validator.ts';
import {
  DEFAULT_STAGE_EXECUTOR_BINDING_REF,
  SERIES_DESIGN_PROFILE,
  STANDARD_AGENT_PACK_ABI,
  STANDARD_STAGE_PACK_CONFORMANCE_VERSION,
  STAGE_COMPLETION_POLICY,
  STAGE_PROGRESS_DELTA_POLICY,
  TYPED_BLOCKER_LINEAGE_POLICY,
  USER_STAGE_LOG_REQUIRED_FIELDS,
  asRecord,
  asRecordArray,
  asString,
  asStringArray,
  assertBooleanFalse,
  filesByPath,
  isRecord,
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

function normalizedStringArray(value: unknown, field: string): string[] {
  if (value === undefined || value === null) {
    return [];
  }
  return asStringArray(value, field);
}

function assertMatchingStringArray(actual: unknown, expected: unknown, field: string): void {
  const actualList = normalizedStringArray(actual, `stage_decomposition_pack_draft.${field}`);
  const expectedList = normalizedStringArray(expected, `requested_target_agent.${field}`);
  if (JSON.stringify(actualList) !== JSON.stringify(expectedList)) {
    throw new Error(`stage-decomposition pack draft ${field} does not match requested target.`);
  }
}

function assertMatchingObject(actual: unknown, expected: unknown, field: string): void {
  const actualObject = asRecord(actual, `stage_decomposition_pack_draft.${field}`);
  if (JSON.stringify(actualObject) !== JSON.stringify(expected)) {
    throw new Error(`stage-decomposition pack draft ${field} does not match requested profile requirements.`);
  }
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
  if (boundary.role !== 'external_architecture_inspiration_not_target_domain_truth') {
    throw new Error(`stage-decomposition pack draft ${field}.role must mark reference designs as inspiration only.`);
  }
  [
    'can_copy_external_runtime',
    'can_copy_external_domain_truth',
    'can_replace_target_owner_judgment',
  ].forEach((fieldName) => assertBooleanFalse(boundary, fieldName, `${field}.${fieldName}`));
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
  if (policy.closeout_packet_required !== true) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} stage_completion_policy.closeout_packet_required must be true.`);
  }
  [
    'provider_completion_is_domain_completion',
    'opl_content_judgment_allowed',
  ].forEach((field) => assertBooleanFalse(policy, field, `stage ${stageId}.stage_completion_policy.${field}`));
  if (policy.next_stage_transition_owner !== 'opl_runtime') {
    throw new Error(`stage-decomposition pack draft stage ${stageId} next_stage_transition_owner must be opl_runtime.`);
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
  [
    'opl_can_decide_domain_completion',
    'provider_completion_counts_as_stage_complete',
    'file_presence_counts_as_stage_complete',
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
  assertMatchingStringArray(
    stageControl.selected_profile_refs,
    targetAgent.selected_opl_profile_refs,
    'stage_control_plane.selected_profile_refs',
  );
  if (stageControl.profile_selection_receipt_ref !== 'contracts/capability_map.json#/profile_selection_receipt') {
    throw new Error('stage-decomposition pack draft stage_control_plane missing profile_selection_receipt_ref.');
  }
  const expectedProfileRequirements = buildProfileRequirements(targetAgent);
  assertMatchingObject(stageControl.profile_requirements, expectedProfileRequirements, 'stage_control_plane.profile_requirements');
  const actionIds = new Set(asRecordArray(actionCatalog.actions, 'action_catalog.actions').map((action) => (
    asString(action.action_id, 'action.action_id')
  )));
  const stages = asRecordArray(stageControl.stages, 'stage_control_plane.stages');
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
    assertMatchingStringArray(
      stage.selected_profile_refs,
      targetAgent.selected_opl_profile_refs,
      `stage ${stageId}.selected_profile_refs`,
    );
    if (stage.profile_selection_receipt_ref !== 'contracts/capability_map.json#/profile_selection_receipt') {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing profile_selection_receipt_ref.`);
    }
    assertMatchingObject(stage.profile_requirements, expectedProfileRequirements, `stage ${stageId}.profile_requirements`);
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
    ].forEach((expected) => {
      if (!inputs.some((entry) => entry.ref_kind === expected.kind && entry.ref === expected.ref)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} missing input ${expected.kind}.`);
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
    qualityGateRefs.forEach((qualityGatePath) => validateQualityGateBody(files, qualityGatePath));

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
  validateNoForbiddenWritePolicy(asRecord(draft.no_forbidden_write_policy, 'no_forbidden_write_policy'));
  const files = filesByPath(draft.files);
  const artifactMorphologyContract = asRecord(
    draft.artifact_morphology_contract,
    'artifact_morphology_contract',
  );
  const actionCatalog = asRecord(draft.action_catalog, 'action_catalog');
  const stageControl = asRecord(draft.stage_control_plane, 'stage_control_plane');
  validateArtifactMorphologyContract(artifactMorphologyContract, targetAgent);
  validateActionCatalog(actionCatalog, targetAgent);
  validateStageControlPlane(stageControl, actionCatalog, artifactMorphologyContract, targetAgent, files);
  const stageNativeArtifactContract = asRecord(
    draft.stage_native_artifact_contract,
    'stage_native_artifact_contract',
  );
  validateStageNativeArtifactContractBundle(stageNativeArtifactContract, stageControl, targetAgent);
  const foundrySeries = asRecord(draft.foundry_agent_series, 'foundry_agent_series');
  const seriesDesignProfile = asRecord(foundrySeries.series_design_profile, 'foundry_agent_series.series_design_profile');
  if (seriesDesignProfile.surface_kind !== SERIES_DESIGN_PROFILE.surface_kind) {
    throw new Error('stage-decomposition pack draft foundry_agent_series.series_design_profile.surface_kind is invalid.');
  }
  if (seriesDesignProfile.profile_id !== SERIES_DESIGN_PROFILE.profile_id) {
    throw new Error('stage-decomposition pack draft foundry_agent_series.series_design_profile.profile_id is invalid.');
  }
  const stagePackSections = asStringArray(
    seriesDesignProfile.stage_pack_sections,
    'foundry_agent_series.series_design_profile.stage_pack_sections',
  );
  asStringArray(
    SERIES_DESIGN_PROFILE.stage_pack_sections,
    'standard_foundry_policy.series_design_profile.stage_pack_sections',
  ).forEach((section) => {
    if (!stagePackSections.includes(section)) {
      throw new Error(`stage-decomposition pack draft foundry_agent_series.series_design_profile missing ${section} section.`);
    }
  });
  const sharedCloseout = asRecord(
    seriesDesignProfile.shared_closeout_contract,
    'foundry_agent_series.series_design_profile.shared_closeout_contract',
  );
  assertBooleanFalse(
    sharedCloseout,
    'provider_completion_is_closeout',
    'foundry_agent_series.series_design_profile.shared_closeout_contract.provider_completion_is_closeout',
  );
  return {
    ...draft,
    artifact_morphology_contract: artifactMorphologyContract,
    stage_native_artifact_contract: stageNativeArtifactContract,
    foundry_agent_series: foundrySeries,
    files: [...files.entries()].map(([filePath, body]) => ({ path: filePath, body })),
  };
}
