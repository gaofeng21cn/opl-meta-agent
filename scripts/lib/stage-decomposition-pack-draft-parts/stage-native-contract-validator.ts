import type { JsonObject } from '../domain-pack.ts';
import type { TargetAgent } from '../meta-agent-loop-io.ts';
import {
  asRecord,
  asRecordArray,
  asString,
  asStringArray,
  assertBooleanFalse,
  stageNativeRefsFor,
} from './shared.ts';

type StageNativeRefs = ReturnType<typeof stageNativeRefsFor>;

export function validateEmbeddedStageNativeArtifactContract(
  stageNativeArtifactContract: JsonObject,
  stageNativeRefs: StageNativeRefs,
  stageId: string,
): void {
  if (stageNativeArtifactContract.surface_kind !== 'opl_stage_native_artifact_contract') {
    throw new Error(`stage-decomposition pack draft stage ${stageId} stage_native_artifact_contract.surface_kind is invalid.`);
  }
  if (stageNativeArtifactContract.artifact_native_contract_ref !== stageNativeRefs.artifactNativeContractRef) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} artifact_native_contract_ref is invalid.`);
  }
  if (stageNativeArtifactContract.stage_folder_contract_ref !== stageNativeRefs.stageFolderContractRef) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} stage_folder_contract_ref is invalid.`);
  }
  if (stageNativeArtifactContract.stage_json_ref !== stageNativeRefs.stageJsonRef) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} stage_json_ref is invalid.`);
  }
  if (stageNativeArtifactContract.attempt_json_ref !== stageNativeRefs.attemptJsonRef) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} attempt_json_ref is invalid.`);
  }
  if (stageNativeArtifactContract.manifest_ref !== stageNativeRefs.manifestRef) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} manifest_ref is invalid.`);
  }
  if (stageNativeArtifactContract.receipt_ref !== stageNativeRefs.receiptRef) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} receipt_ref is invalid.`);
  }
  if (stageNativeArtifactContract.blocker_ref !== stageNativeRefs.blockerRef) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} blocker_ref is invalid.`);
  }
  if (stageNativeArtifactContract.current_pointer_ref !== stageNativeRefs.currentPointerRef) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} current_pointer_ref is invalid.`);
  }
  if (stageNativeArtifactContract.canonical_artifact_ref !== stageNativeRefs.canonicalArtifactRef) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} canonical_artifact_ref is invalid.`);
  }
  if (stageNativeArtifactContract.export_ref !== stageNativeRefs.exportRef) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} export_ref is invalid.`);
  }
  if (stageNativeArtifactContract.lineage_ref !== stageNativeRefs.lineageRef) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} lineage_ref is invalid.`);
  }
  if (stageNativeArtifactContract.retention_ref !== stageNativeRefs.retentionRef) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} retention_ref is invalid.`);
  }
  if (stageNativeArtifactContract.physical_kernel_locator_ref !== stageNativeRefs.physicalKernelLocatorRef) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} physical_kernel_locator_ref is invalid.`);
  }
  if (stageNativeArtifactContract.conformance_ref !== stageNativeRefs.conformanceRef) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} conformance_ref is invalid.`);
  }
  if (stageNativeArtifactContract.workbench_consumption_ref !== stageNativeRefs.workbenchConsumptionRef) {
    throw new Error(`stage-decomposition pack draft stage ${stageId} workbench_consumption_ref is invalid.`);
  }
  const folderContract = asRecord(
    stageNativeArtifactContract.stage_folder_contract,
    `stage ${stageId}.stage_contract.stage_native_artifact_contract.stage_folder_contract`,
  );
  [
    ['stage_folder_contract_ref', stageNativeRefs.stageFolderContractRef],
    ['stage_json_ref', stageNativeRefs.stageJsonRef],
    ['attempt_json_ref', stageNativeRefs.attemptJsonRef],
    ['manifest_ref', stageNativeRefs.manifestRef],
    ['receipt_ref', stageNativeRefs.receiptRef],
    ['blocker_ref', stageNativeRefs.blockerRef],
    ['current_pointer_ref', stageNativeRefs.currentPointerRef],
    ['canonical_artifact_ref', stageNativeRefs.canonicalArtifactRef],
    ['export_ref', stageNativeRefs.exportRef],
    ['lineage_ref', stageNativeRefs.lineageRef],
    ['retention_ref', stageNativeRefs.retentionRef],
    ['physical_kernel_locator_ref', stageNativeRefs.physicalKernelLocatorRef],
    ['conformance_ref', stageNativeRefs.conformanceRef],
    ['workbench_consumption_ref', stageNativeRefs.workbenchConsumptionRef],
  ].forEach(([field, expectedValue]) => {
    if (folderContract[field] !== expectedValue) {
      throw new Error(`stage-decomposition pack draft stage ${stageId} stage_folder_contract.${field} is invalid.`);
    }
  });
  const physicalKernelLocatorContract = asRecord(
    stageNativeArtifactContract.physical_kernel_locator_contract,
    `stage ${stageId}.stage_contract.stage_native_artifact_contract.physical_kernel_locator_contract`,
  );
  if (physicalKernelLocatorContract.physical_kernel_locator_ref !== stageNativeRefs.physicalKernelLocatorRef) {
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
  if (conformanceContract.conformance_ref !== stageNativeRefs.conformanceRef) {
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
  if (workbenchConsumptionContract.workbench_consumption_ref !== stageNativeRefs.workbenchConsumptionRef) {
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
}

export function validateStageNativeArtifactContractBundle(
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
