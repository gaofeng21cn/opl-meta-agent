import type { JsonObject } from '../domain-pack.ts';
import type { TargetAgent } from '../meta-agent-loop.ts';
import {
  SERIES_DESIGN_PROFILE,
  STAGE_PROGRESS_DELTA_POLICY,
  TYPED_BLOCKER_LINEAGE_POLICY,
  USER_STAGE_LOG_REQUIRED_FIELDS,
} from '../standard-foundry-policies.ts';
import type { StageDecompositionPackDraft } from './shared.ts';
import {
  DEFAULT_STAGE_EXECUTOR_BINDING_REF,
  STANDARD_STAGE_PACK_CONFORMANCE_VERSION,
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

function validateQualityGateBody(files: Map<string, string>, qualityGatePath: string): void {
  const body = files.get(qualityGatePath) ?? '';
  if (!/Quality gate declaration is required/i.test(body)) {
    throw new Error(`stage-decomposition pack draft quality gate declaration missing: ${qualityGatePath}`);
  }
  if (!/Dedicated review stage is conditional/i.test(body)) {
    throw new Error(`stage-decomposition pack draft dedicated review stage policy missing: ${qualityGatePath}`);
  }
}

function validateStageControlPlane(
  stageControl: JsonObject,
  actionCatalog: JsonObject,
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
  const actionIds = new Set(asRecordArray(actionCatalog.actions, 'action_catalog.actions').map((action) => (
    asString(action.action_id, 'action.action_id')
  )));
  const stages = asRecordArray(stageControl.stages, 'stage_control_plane.stages');
  const hasStageFile = [...files.keys()].some((relPath) => relPath.startsWith('agent/stages/') && !relPath.endsWith('/README.md'));
  if (!hasStageFile) {
    throw new Error('stage-decomposition pack draft must include a real agent/stages markdown file.');
  }
  stages.forEach((stage) => {
    const stageId = asString(stage.stage_id, 'stage.stage_id');
    const executor = asRecord(stage.selected_executor, `stage ${stageId}.selected_executor`);
    if (executor.executor_kind !== 'codex_cli' || executor.default_executor !== true) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} must select codex_cli as default executor.`);
    }
    if (executor.executor_binding_ref !== DEFAULT_STAGE_EXECUTOR_BINDING_REF) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} must use ${DEFAULT_STAGE_EXECUTOR_BINDING_REF} executor binding.`);
    }
    const promptRefs = validateStageRefs(stage, 'prompt_refs', 'domain_prompt_ref', 'agent/prompts/', files);
    const skillRefs = validateStageRefs(stage, 'skills', 'domain_skill_ref', 'agent/skills/', files);
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
    const expectedArtifactNativeContractRef = stageNativeRefs.artifactNativeContractRef;
    const expectedStageFolderContractRef = stageNativeRefs.stageFolderContractRef;
    const expectedStageJsonRef = stageNativeRefs.stageJsonRef;
    const expectedAttemptJsonRef = stageNativeRefs.attemptJsonRef;
    const expectedManifestRef = stageNativeRefs.manifestRef;
    const expectedReceiptRef = stageNativeRefs.receiptRef;
    const expectedBlockerRef = stageNativeRefs.blockerRef;
    const expectedCurrentPointerRef = stageNativeRefs.currentPointerRef;
    const expectedCanonicalArtifactRef = stageNativeRefs.canonicalArtifactRef;
    const expectedExportRef = stageNativeRefs.exportRef;
    const expectedLineageRef = stageNativeRefs.lineageRef;
    const expectedRetentionRef = stageNativeRefs.retentionRef;
    const expectedPhysicalKernelLocatorRef = stageNativeRefs.physicalKernelLocatorRef;
    const expectedConformanceRef = stageNativeRefs.conformanceRef;
    const expectedWorkbenchConsumptionRef = stageNativeRefs.workbenchConsumptionRef;
    [
      expectedArtifactNativeContractRef,
      ...promptRefs.map((entry) => `prompt-ref:${entry}`),
      ...skillRefs.map((entry) => `skill-ref:${entry}`),
      ...knowledgeRefs.map((entry) => `knowledge-ref:${entry}`),
      ...qualityGateRefs.map((entry) => `quality-gate-ref:${entry}`),
      ...allowedActions.map((entry) => `action-ref:${entry}`),
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
    if (!ensures.includes(`stage-user-log-ref:${stageId}`)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} missing user stage log ensure.`);
    }
    [
      expectedStageFolderContractRef,
      expectedStageJsonRef,
      expectedAttemptJsonRef,
      expectedManifestRef,
      expectedReceiptRef,
      expectedCurrentPointerRef,
      expectedCanonicalArtifactRef,
      expectedExportRef,
      expectedLineageRef,
      expectedRetentionRef,
      expectedPhysicalKernelLocatorRef,
      expectedConformanceRef,
      expectedWorkbenchConsumptionRef,
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
    [
      expectedArtifactNativeContractRef,
      expectedStageFolderContractRef,
      expectedStageJsonRef,
      expectedAttemptJsonRef,
      expectedManifestRef,
      expectedReceiptRef,
      expectedBlockerRef,
      expectedCurrentPointerRef,
      expectedCanonicalArtifactRef,
      expectedExportRef,
      expectedLineageRef,
      expectedRetentionRef,
      expectedPhysicalKernelLocatorRef,
      expectedConformanceRef,
      expectedWorkbenchConsumptionRef,
    ].forEach((expectedRef) => {
      if (!expectedReceiptRefs.some((entry) => entry.ref === expectedRef)) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} missing expected stage-native ref ${expectedRef}.`);
      }
    });
    const stageNativeArtifactContract = asRecord(
      contract.stage_native_artifact_contract,
      `stage ${stageId}.stage_contract.stage_native_artifact_contract`,
    );
    if (stageNativeArtifactContract.surface_kind !== 'opl_stage_native_artifact_contract') {
      throw new Error(`stage-decomposition pack draft stage ${stageId} stage_native_artifact_contract.surface_kind is invalid.`);
    }
    if (stageNativeArtifactContract.artifact_native_contract_ref !== expectedArtifactNativeContractRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} artifact_native_contract_ref is invalid.`);
    }
    if (stageNativeArtifactContract.stage_folder_contract_ref !== expectedStageFolderContractRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} stage_folder_contract_ref is invalid.`);
    }
    if (stageNativeArtifactContract.stage_json_ref !== expectedStageJsonRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} stage_json_ref is invalid.`);
    }
    if (stageNativeArtifactContract.attempt_json_ref !== expectedAttemptJsonRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} attempt_json_ref is invalid.`);
    }
    if (stageNativeArtifactContract.manifest_ref !== expectedManifestRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} manifest_ref is invalid.`);
    }
    if (stageNativeArtifactContract.receipt_ref !== expectedReceiptRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} receipt_ref is invalid.`);
    }
    if (stageNativeArtifactContract.blocker_ref !== expectedBlockerRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} blocker_ref is invalid.`);
    }
    if (stageNativeArtifactContract.current_pointer_ref !== expectedCurrentPointerRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} current_pointer_ref is invalid.`);
    }
    if (stageNativeArtifactContract.canonical_artifact_ref !== expectedCanonicalArtifactRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} canonical_artifact_ref is invalid.`);
    }
    if (stageNativeArtifactContract.export_ref !== expectedExportRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} export_ref is invalid.`);
    }
    if (stageNativeArtifactContract.lineage_ref !== expectedLineageRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} lineage_ref is invalid.`);
    }
    if (stageNativeArtifactContract.retention_ref !== expectedRetentionRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} retention_ref is invalid.`);
    }
    if (stageNativeArtifactContract.physical_kernel_locator_ref !== expectedPhysicalKernelLocatorRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} physical_kernel_locator_ref is invalid.`);
    }
    if (stageNativeArtifactContract.conformance_ref !== expectedConformanceRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} conformance_ref is invalid.`);
    }
    if (stageNativeArtifactContract.workbench_consumption_ref !== expectedWorkbenchConsumptionRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} workbench_consumption_ref is invalid.`);
    }
    const folderContract = asRecord(
      stageNativeArtifactContract.stage_folder_contract,
      `stage ${stageId}.stage_contract.stage_native_artifact_contract.stage_folder_contract`,
    );
    [
      ['stage_folder_contract_ref', expectedStageFolderContractRef],
      ['stage_json_ref', expectedStageJsonRef],
      ['attempt_json_ref', expectedAttemptJsonRef],
      ['manifest_ref', expectedManifestRef],
      ['receipt_ref', expectedReceiptRef],
      ['blocker_ref', expectedBlockerRef],
      ['current_pointer_ref', expectedCurrentPointerRef],
      ['canonical_artifact_ref', expectedCanonicalArtifactRef],
      ['export_ref', expectedExportRef],
      ['lineage_ref', expectedLineageRef],
      ['retention_ref', expectedRetentionRef],
      ['physical_kernel_locator_ref', expectedPhysicalKernelLocatorRef],
      ['conformance_ref', expectedConformanceRef],
      ['workbench_consumption_ref', expectedWorkbenchConsumptionRef],
    ].forEach(([field, expectedValue]) => {
      if (folderContract[field] !== expectedValue) {
        throw new Error(`stage-decomposition pack draft stage ${stageId} stage_folder_contract.${field} is invalid.`);
      }
    });
    const physicalKernelLocatorContract = asRecord(
      stageNativeArtifactContract.physical_kernel_locator_contract,
      `stage ${stageId}.stage_contract.stage_native_artifact_contract.physical_kernel_locator_contract`,
    );
    if (physicalKernelLocatorContract.physical_kernel_locator_ref !== expectedPhysicalKernelLocatorRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} physical_kernel_locator_contract ref is invalid.`);
    }
    if (physicalKernelLocatorContract.source_contract_ref !== 'contracts/opl-framework/stage-artifact-runtime-contract.json') {
      throw new Error(`stage-decomposition pack draft stage ${stageId} physical_kernel_locator_contract source contract is invalid.`);
    }
    if (physicalKernelLocatorContract.oma_materializes_ref_template_only !== true) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} physical kernel locator must be refs-only.`);
    }
    assertBooleanFalse(
      physicalKernelLocatorContract,
      'oma_can_create_runtime_state',
      `stage ${stageId}.physical_kernel_locator_contract.oma_can_create_runtime_state`,
    );
    const conformanceContract = asRecord(
      stageNativeArtifactContract.conformance_contract,
      `stage ${stageId}.stage_contract.stage_native_artifact_contract.conformance_contract`,
    );
    if (conformanceContract.surface_kind !== 'opl_stage_artifact_runtime_conformance') {
      throw new Error(`stage-decomposition pack draft stage ${stageId} conformance_contract.surface_kind is invalid.`);
    }
    if (conformanceContract.conformance_ref !== expectedConformanceRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} conformance_contract ref is invalid.`);
    }
    assertBooleanFalse(
      conformanceContract,
      'domain_readiness_claim',
      `stage ${stageId}.conformance_contract.domain_readiness_claim`,
    );
    assertBooleanFalse(
      conformanceContract,
      'oma_can_claim_conformance_pass',
      `stage ${stageId}.conformance_contract.oma_can_claim_conformance_pass`,
    );
    const workbenchConsumptionContract = asRecord(
      stageNativeArtifactContract.workbench_consumption_contract,
      `stage ${stageId}.stage_contract.stage_native_artifact_contract.workbench_consumption_contract`,
    );
    if (workbenchConsumptionContract.surface_kind !== 'opl_stage_artifact_runtime_workbench_consumption') {
      throw new Error(`stage-decomposition pack draft stage ${stageId} workbench_consumption_contract.surface_kind is invalid.`);
    }
    if (workbenchConsumptionContract.workbench_consumption_ref !== expectedWorkbenchConsumptionRef) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} workbench_consumption_contract ref is invalid.`);
    }
    assertBooleanFalse(
      workbenchConsumptionContract,
      'artifact_body_access',
      `stage ${stageId}.workbench_consumption_contract.artifact_body_access`,
    );
    assertBooleanFalse(
      workbenchConsumptionContract,
      'domain_verdict_authority',
      `stage ${stageId}.workbench_consumption_contract.domain_verdict_authority`,
    );
    assertBooleanFalse(
      workbenchConsumptionContract,
      'oma_can_write_workbench_state',
      `stage ${stageId}.workbench_consumption_contract.oma_can_write_workbench_state`,
    );
    const stageNativeBoundary = asRecord(
      stageNativeArtifactContract.authority_boundary,
      `stage ${stageId}.stage_contract.stage_native_artifact_contract.authority_boundary`,
    );
    [
      'oma_can_write_stage_folder_runtime_state',
      'oma_can_generate_target_domain_owner_receipt',
      'oma_can_write_target_domain_truth',
      'oma_can_write_target_domain_memory_body',
      'oma_can_mutate_target_domain_artifact_body',
      'oma_can_authorize_target_quality_or_export',
      'oma_can_promote_default_agent_without_gate',
      'oma_can_own_agent_lab_runner',
      'oma_can_own_queue',
      'oma_can_own_attempt_ledger',
      'oma_can_own_worktree_lifecycle',
      'oma_can_own_promotion_gate',
      'oma_can_own_app_shell',
      'oma_can_write_target_owner_closeout',
      'oma_can_create_stage_folder_runtime_state',
      'oma_can_write_target_owner_receipt_body',
      'oma_can_owner_promote_target_agent',
      'oma_can_manage_target_worktree_lifecycle',
    ].forEach((field) => assertBooleanFalse(
      stageNativeBoundary,
      field,
      `stage ${stageId}.stage_native_artifact_contract.authority_boundary.${field}`,
    ));
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

function validateStageNativeArtifactContractBundle(
  bundle: JsonObject,
  stageControl: JsonObject,
  targetAgent: TargetAgent,
): void {
  if (bundle.surface_kind !== 'opl_stage_native_artifact_contract_bundle') {
    throw new Error('stage-decomposition pack draft stage_native_artifact_contract.surface_kind is invalid.');
  }
  if (bundle.target_domain_id !== targetAgent.domain_id) {
    throw new Error('stage-decomposition pack draft stage_native_artifact_contract target_domain_id does not match target agent.');
  }
  const stages = asRecordArray(stageControl.stages, 'stage_control_plane.stages');
  const contracts = asRecordArray(bundle.contracts, 'stage_native_artifact_contract.contracts');
  if (contracts.length !== stages.length) {
    throw new Error('stage-decomposition pack draft stage_native_artifact_contract must include one contract per stage.');
  }
  const contractRefs = asStringArray(
    bundle.artifact_native_contract_refs,
    'stage_native_artifact_contract.artifact_native_contract_refs',
  );
  const folderRefs = asStringArray(
    bundle.stage_folder_contract_refs,
    'stage_native_artifact_contract.stage_folder_contract_refs',
  );
  const stageJsonRefs = asStringArray(
    bundle.stage_json_refs,
    'stage_native_artifact_contract.stage_json_refs',
  );
  const attemptJsonRefs = asStringArray(
    bundle.attempt_json_ref_templates,
    'stage_native_artifact_contract.attempt_json_ref_templates',
  );
  const manifestRefs = asStringArray(
    bundle.manifest_ref_templates,
    'stage_native_artifact_contract.manifest_ref_templates',
  );
  const receiptRefs = asStringArray(
    bundle.receipt_ref_templates,
    'stage_native_artifact_contract.receipt_ref_templates',
  );
  const currentPointerRefs = asStringArray(
    bundle.current_pointer_refs,
    'stage_native_artifact_contract.current_pointer_refs',
  );
  const canonicalRefs = asStringArray(
    bundle.canonical_artifact_refs,
    'stage_native_artifact_contract.canonical_artifact_refs',
  );
  const exportRefs = asStringArray(
    bundle.export_ref_templates,
    'stage_native_artifact_contract.export_ref_templates',
  );
  const lineageRefs = asStringArray(
    bundle.lineage_ref_templates,
    'stage_native_artifact_contract.lineage_ref_templates',
  );
  const retentionRefs = asStringArray(
    bundle.retention_ref_templates,
    'stage_native_artifact_contract.retention_ref_templates',
  );
  const physicalKernelLocatorRefs = asStringArray(
    bundle.physical_kernel_locator_refs,
    'stage_native_artifact_contract.physical_kernel_locator_refs',
  );
  const conformanceRefs = asStringArray(
    bundle.conformance_refs,
    'stage_native_artifact_contract.conformance_refs',
  );
  const workbenchConsumptionRefs = asStringArray(
    bundle.workbench_consumption_refs,
    'stage_native_artifact_contract.workbench_consumption_refs',
  );
  stages.forEach((stage) => {
    const stageId = asString(stage.stage_id, 'stage.stage_id');
    const stageNativeRefs = stageNativeRefsFor(targetAgent.domain_id, stageId);
    const expectedRefs = [
      [contractRefs, stageNativeRefs.artifactNativeContractRef],
      [folderRefs, stageNativeRefs.stageFolderContractRef],
      [stageJsonRefs, stageNativeRefs.stageJsonRef],
      [attemptJsonRefs, stageNativeRefs.attemptJsonRef],
      [manifestRefs, stageNativeRefs.manifestRef],
      [receiptRefs, stageNativeRefs.receiptRef],
      [currentPointerRefs, stageNativeRefs.currentPointerRef],
      [canonicalRefs, stageNativeRefs.canonicalArtifactRef],
      [exportRefs, stageNativeRefs.exportRef],
      [lineageRefs, stageNativeRefs.lineageRef],
      [retentionRefs, stageNativeRefs.retentionRef],
      [physicalKernelLocatorRefs, stageNativeRefs.physicalKernelLocatorRef],
      [conformanceRefs, stageNativeRefs.conformanceRef],
      [workbenchConsumptionRefs, stageNativeRefs.workbenchConsumptionRef],
    ] as const;
    expectedRefs.forEach(([refs, expectedRef]) => {
      if (!refs.includes(expectedRef)) {
        throw new Error(`stage-decomposition pack draft stage_native_artifact_contract missing ${expectedRef}.`);
      }
    });
    const embedded = asRecord(
      asRecord(stage.stage_contract, `stage ${stageId}.stage_contract`).stage_native_artifact_contract,
      `stage ${stageId}.stage_contract.stage_native_artifact_contract`,
    );
    const matching = contracts.find((contract) => (
      contract.artifact_native_contract_ref === stageNativeRefs.artifactNativeContractRef
    ));
    if (!matching) {
      throw new Error(
        `stage-decomposition pack draft stage_native_artifact_contract missing stage contract ${stageNativeRefs.artifactNativeContractRef}.`,
      );
    }
    if (JSON.stringify(matching) !== JSON.stringify(embedded)) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} embedded and bundled stage-native contracts must match.`);
    }
  });
  const boundary = asRecord(bundle.authority_boundary, 'stage_native_artifact_contract.authority_boundary');
  [
    'oma_can_write_stage_folder_runtime_state',
    'oma_can_generate_target_domain_owner_receipt',
    'oma_can_write_target_domain_truth',
    'oma_can_write_target_domain_memory_body',
    'oma_can_mutate_target_domain_artifact_body',
    'oma_can_authorize_target_quality_or_export',
    'oma_can_promote_default_agent_without_gate',
    'oma_can_own_agent_lab_runner',
    'oma_can_own_queue',
    'oma_can_own_attempt_ledger',
    'oma_can_own_worktree_lifecycle',
    'oma_can_own_promotion_gate',
    'oma_can_own_app_shell',
    'oma_can_write_target_owner_closeout',
    'oma_can_create_stage_folder_runtime_state',
    'oma_can_write_target_owner_receipt_body',
    'oma_can_owner_promote_target_agent',
    'oma_can_manage_target_worktree_lifecycle',
  ].forEach((field) => assertBooleanFalse(boundary, field, `stage_native_artifact_contract.authority_boundary.${field}`));
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
  validateNoForbiddenWritePolicy(asRecord(draft.no_forbidden_write_policy, 'no_forbidden_write_policy'));
  const files = filesByPath(draft.files);
  const actionCatalog = asRecord(draft.action_catalog, 'action_catalog');
  const stageControl = asRecord(draft.stage_control_plane, 'stage_control_plane');
  validateActionCatalog(actionCatalog, targetAgent);
  validateStageControlPlane(stageControl, actionCatalog, targetAgent, files);
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
    stage_native_artifact_contract: stageNativeArtifactContract,
    foundry_agent_series: foundrySeries,
    files: [...files.entries()].map(([filePath, body]) => ({ path: filePath, body })),
  };
}
