import type { JsonObject } from './domain-pack.ts';

export type StageNativeArtifactContractInput = {
  domainId: string;
  stageId: string;
  domainTruthOwner: string;
  materializedBy?: string;
};

export type StageNativeArtifactAttemptRefsInput = StageNativeArtifactContractInput & {
  attemptId?: string;
};

export function stageNativeArtifactRefs({
  domainId,
  stageId,
  attemptId = '{stage_attempt_id}',
}: {
  domainId: string;
  stageId: string;
  attemptId?: string;
}): JsonObject {
  return {
    artifact_native_contract_ref: `artifact-native-contract-ref:${domainId}/${stageId}`,
    stage_folder_contract_ref: `stage-folder-contract-ref:${domainId}/${stageId}`,
    stage_folder_ref: `stage-folder-ref:${domainId}/${stageId}/${attemptId}`,
    manifest_ref: `stage-manifest-ref:${domainId}/${stageId}/${attemptId}`,
    receipt_ref: `stage-attempt-receipt-ref:${domainId}/${stageId}/${attemptId}`,
    blocker_ref: `stage-typed-blocker-ref:${domainId}/${stageId}/${attemptId}`,
    current_pointer_ref: `stage-current-pointer-ref:${domainId}/${stageId}`,
    canonical_artifact_ref: `canonical-artifact-ref:${domainId}/${stageId}`,
  };
}

export function buildStageNativeArtifactContract({
  domainId,
  stageId,
  domainTruthOwner,
  materializedBy = 'opl-meta-agent',
}: StageNativeArtifactContractInput): JsonObject {
  const refs = stageNativeArtifactRefs({ domainId, stageId });
  return {
    surface_kind: 'opl_stage_native_artifact_contract',
    version: 'stage-native-artifact-contract.v1',
    target_domain_id: domainId,
    stage_id: stageId,
    owner: 'one-person-lab',
    materialized_by: materializedBy,
    domain_truth_owner: domainTruthOwner,
    role: 'stage_folder_manifest_receipt_blocker_current_pointer_and_canonical_refs_only',
    ...refs,
    stage_folder_contract: {
      stage_folder_contract_ref: refs.stage_folder_contract_ref,
      folder_path_template: `stages/${stageId}/attempts/{stage_attempt_id}`,
      folder_role: 'stage_native_attempt_artifact_folder',
      body_policy: 'refs_and_manifests_only_no_target_artifact_body',
      lifecycle_owner: 'one-person-lab',
    },
    manifest_contract: {
      manifest_ref_template: `stage-manifest-ref:${domainId}/${stageId}/{stage_attempt_id}`,
      manifest_file_name: 'stage.manifest.json',
      required_fields: [
        'stage_id',
        'stage_attempt_id',
        'physical_output_path',
        'role',
        'content_hash',
        'producer',
        'input_refs',
        'lineage_refs',
        'receipt_refs',
        'current_pointer_ref',
        'canonical_artifact_ref',
        'export_eligibility',
        'repair_classification',
      ],
      missing_or_hash_mismatch_projection: 'broken_artifact',
      missing_owner_receipt_projection: 'orphan_artifact',
    },
    terminal_receipts: {
      success_receipt_ref_template: `stage-attempt-receipt-ref:${domainId}/${stageId}/{stage_attempt_id}`,
      blocked_typed_blocker_ref_template: `stage-typed-blocker-ref:${domainId}/${stageId}/{stage_attempt_id}`,
      skipped_or_deferred_decision_ref_template: `stage-decision-receipt-ref:${domainId}/${stageId}/{stage_attempt_id}`,
      success_requires_owner_receipt_ref: true,
      blocked_requires_typed_blocker_ref: true,
      skipped_or_deferred_requires_decision_receipt_ref: true,
    },
    current_pointer_contract: {
      current_pointer_ref: refs.current_pointer_ref,
      pointer_owner: 'one-person-lab',
      old_attempts_not_pointed_by_current_are_historical_evidence_only: true,
    },
    output_roles: [
      {
        role_id: 'stage_manifest',
        ref_kind: 'stage_manifest_ref',
        body_owner: 'one-person-lab',
        contains_target_artifact_body: false,
      },
      {
        role_id: 'stage_attempt_receipt',
        ref_kind: 'stage_attempt_receipt_ref',
        body_owner: 'one-person-lab',
        contains_target_artifact_body: false,
      },
      {
        role_id: 'typed_blocker',
        ref_kind: 'stage_typed_blocker_ref',
        body_owner: domainTruthOwner,
        contains_target_artifact_body: false,
      },
      {
        role_id: 'canonical_artifact_ref',
        ref_kind: 'canonical_artifact_ref',
        body_owner: domainTruthOwner,
        contains_target_artifact_body: false,
      },
    ],
    authority_boundary: {
      opl_framework_owns_stage_folder_lifecycle: true,
      oma_role: 'contract_compiler_and_refs_materializer',
      oma_can_write_stage_folder_runtime_state: false,
      oma_can_generate_target_domain_owner_receipt: false,
      oma_can_write_target_domain_truth: false,
      oma_can_write_target_domain_memory_body: false,
      oma_can_mutate_target_domain_artifact_body: false,
      oma_can_authorize_target_quality_or_export: false,
      oma_can_promote_default_agent_without_gate: false,
    },
  };
}

export function buildStageNativeArtifactContractBundle({
  domainId,
  domainTruthOwner,
  stageIds,
  materializedBy = 'opl-meta-agent',
}: {
  domainId: string;
  domainTruthOwner: string;
  stageIds: string[];
  materializedBy?: string;
}): JsonObject {
  return {
    surface_kind: 'opl_stage_native_artifact_contract_bundle',
    version: 'stage-native-artifact-contract-bundle.v1',
    target_domain_id: domainId,
    owner: 'one-person-lab',
    materialized_by: materializedBy,
    domain_truth_owner: domainTruthOwner,
    bundle_role: 'stage_native_artifact_contract_refs_only',
    artifact_native_contract_refs: stageIds.map((stageId) => (
      `artifact-native-contract-ref:${domainId}/${stageId}`
    )),
    stage_folder_contract_refs: stageIds.map((stageId) => (
      `stage-folder-contract-ref:${domainId}/${stageId}`
    )),
    contracts: stageIds.map((stageId) => buildStageNativeArtifactContract({
      domainId,
      stageId,
      domainTruthOwner,
      materializedBy,
    })),
    authority_boundary: {
      oma_role: 'contract_compiler_and_refs_materializer',
      oma_can_write_stage_folder_runtime_state: false,
      oma_can_generate_target_domain_owner_receipt: false,
      oma_can_write_target_domain_truth: false,
      oma_can_write_target_domain_memory_body: false,
      oma_can_mutate_target_domain_artifact_body: false,
      oma_can_authorize_target_quality_or_export: false,
      oma_can_promote_default_agent_without_gate: false,
      opl_framework_owns_stage_folder_lifecycle: true,
    },
  };
}

export function buildStageNativeArtifactAttemptRefs({
  domainId,
  stageId,
  domainTruthOwner,
  materializedBy = 'opl-meta-agent',
  attemptId = '{stage_attempt_id}',
}: StageNativeArtifactAttemptRefsInput): JsonObject {
  const refs = stageNativeArtifactRefs({ domainId, stageId, attemptId });
  return {
    surface_kind: 'opl_stage_native_artifact_attempt_refs',
    version: 'stage-native-artifact-attempt-refs.v1',
    target_domain_id: domainId,
    stage_id: stageId,
    attempt_id: attemptId,
    owner: materializedBy,
    domain_truth_owner: domainTruthOwner,
    ...refs,
    refs_only: true,
    can_generate_target_domain_owner_receipt: false,
    can_write_target_domain_truth: false,
    can_write_target_domain_memory_body: false,
    can_mutate_target_domain_artifact_body: false,
    can_authorize_target_quality_or_export: false,
    can_promote_default_agent_without_gate: false,
  };
}
