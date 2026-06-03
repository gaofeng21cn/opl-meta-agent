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

function stageNativeAuthorityBoundary(): JsonObject {
  return {
    opl_framework_owns_stage_folder_lifecycle: true,
    oma_role: 'contract_compiler_and_refs_materializer',
    oma_can_own_agent_lab_runner: false,
    oma_can_own_queue: false,
    oma_can_own_attempt_ledger: false,
    oma_can_own_worktree_lifecycle: false,
    oma_can_own_promotion_gate: false,
    oma_can_own_app_shell: false,
    oma_can_write_target_owner_closeout: false,
    oma_can_create_stage_folder_runtime_state: false,
    oma_can_write_stage_folder_runtime_state: false,
    oma_can_generate_target_domain_owner_receipt: false,
    oma_can_write_target_owner_receipt_body: false,
    oma_can_write_target_domain_truth: false,
    oma_can_write_target_domain_memory_body: false,
    oma_can_mutate_target_domain_artifact_body: false,
    oma_can_authorize_target_quality_or_export: false,
    oma_can_owner_promote_target_agent: false,
    oma_can_promote_default_agent_without_gate: false,
    oma_can_manage_target_worktree_lifecycle: false,
  };
}

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
    stage_json_ref: `stage-json-ref:${domainId}/${stageId}`,
    attempt_json_ref: `stage-attempt-json-ref:${domainId}/${stageId}/${attemptId}`,
    manifest_ref: `stage-manifest-ref:${domainId}/${stageId}/${attemptId}`,
    receipt_ref: `stage-attempt-receipt-ref:${domainId}/${stageId}/${attemptId}`,
    blocker_ref: `stage-typed-blocker-ref:${domainId}/${stageId}/${attemptId}`,
    current_pointer_ref: `stage-current-pointer-ref:${domainId}/${stageId}`,
    canonical_artifact_ref: `canonical-artifact-ref:${domainId}/${stageId}`,
    export_ref: `stage-export-ref:${domainId}/${stageId}/${attemptId}`,
    lineage_ref: `stage-lineage-ref:${domainId}/${stageId}/${attemptId}`,
    retention_ref: `stage-retention-ref:${domainId}/${stageId}/${attemptId}`,
    physical_kernel_locator_ref: `opl-physical-kernel-locator-ref:${domainId}/${stageId}`,
    conformance_ref: `stage-artifact-conformance-ref:${domainId}/${stageId}`,
    workbench_consumption_ref: `stage-artifact-workbench-consumption-ref:${domainId}/${stageId}`,
  };
}

export function buildStageFolderContract({
  domainId,
  stageId,
  attemptId = '{stage_attempt_id}',
}: {
  domainId: string;
  stageId: string;
  attemptId?: string;
}): JsonObject {
  const refs = stageNativeArtifactRefs({ domainId, stageId, attemptId });
  return {
    artifact_native_contract_ref: refs.artifact_native_contract_ref,
    stage_folder_contract_ref: refs.stage_folder_contract_ref,
    stage_folder_ref: refs.stage_folder_ref,
    folder_path_template: `stages/${stageId}/attempts/{stage_attempt_id}`,
    folder_role: 'stage_native_attempt_artifact_folder',
    body_policy: 'refs_and_manifests_only_no_target_artifact_body',
    lifecycle_owner: 'one-person-lab',
    runtime_state_owner: 'one-person-lab',
    materialization_kind: 'compiler_ref_template_only_not_runtime_state',
    stage_json_ref: refs.stage_json_ref,
    attempt_json_ref: refs.attempt_json_ref,
    manifest_ref: refs.manifest_ref,
    receipt_ref: refs.receipt_ref,
    blocker_ref: refs.blocker_ref,
    current_pointer_ref: refs.current_pointer_ref,
    canonical_artifact_ref: refs.canonical_artifact_ref,
    export_ref: refs.export_ref,
    lineage_ref: refs.lineage_ref,
    retention_ref: refs.retention_ref,
    physical_kernel_locator_ref: refs.physical_kernel_locator_ref,
    conformance_ref: refs.conformance_ref,
    workbench_consumption_ref: refs.workbench_consumption_ref,
    required_files: [
      'stage.json',
      'attempt.json',
      'stage.manifest.json',
      'receipt.json',
      'current.json',
      'canonical.json',
      'export.json',
      'lineage.json',
      'retention.json',
      'physical_kernel_locator.json',
      'conformance.json',
      'workbench_consumption.json',
    ],
  };
}

export function buildStageNativeArtifactContract({
  domainId,
  stageId,
  domainTruthOwner,
  materializedBy = 'opl-meta-agent',
}: StageNativeArtifactContractInput): JsonObject {
  const refs = stageNativeArtifactRefs({ domainId, stageId });
  const stageFolderContract = buildStageFolderContract({ domainId, stageId });
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
    stage_folder_contract: stageFolderContract,
    stage_json_contract: {
      stage_json_ref: refs.stage_json_ref,
      stage_json_file_name: 'stage.json',
      body_owner: 'one-person-lab',
      materialized_by: materializedBy,
      required_fields: [
        'stage_id',
        'target_domain_id',
        'stage_folder_contract_ref',
        'artifact_native_contract_ref',
        'attempt_json_ref_template',
        'manifest_ref_template',
        'receipt_ref_template',
        'current_pointer_ref',
        'canonical_artifact_ref',
        'export_ref_template',
        'lineage_ref_template',
        'retention_ref_template',
        'physical_kernel_locator_ref',
        'conformance_ref',
        'workbench_consumption_ref',
      ],
      body_policy: 'refs_only_stage_descriptor_no_target_artifact_body',
    },
    attempt_json_contract: {
      attempt_json_ref_template: refs.attempt_json_ref,
      attempt_json_file_name: 'attempt.json',
      body_owner: 'one-person-lab',
      materialized_by: materializedBy,
      runtime_state_owner: 'one-person-lab',
      oma_materializes_ref_template_only: true,
      required_fields: [
        'stage_id',
        'stage_attempt_id',
        'attempt_json_ref',
        'manifest_ref',
        'receipt_ref',
        'blocker_ref',
        'lineage_ref',
        'retention_ref',
      ],
    },
    manifest_contract: {
      manifest_ref_template: `stage-manifest-ref:${domainId}/${stageId}/{stage_attempt_id}`,
      manifest_file_name: 'stage.manifest.json',
      required_fields: [
        'stage_json_ref',
        'attempt_json_ref',
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
        'export_ref',
        'lineage_ref',
        'retention_ref',
        'physical_kernel_locator_ref',
        'conformance_ref',
        'workbench_consumption_ref',
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
    receipt_contract: {
      receipt_ref_template: refs.receipt_ref,
      receipt_file_name: 'receipt.json',
      receipt_owner: 'one-person-lab',
      owner_receipt_body_owner: domainTruthOwner,
      oma_can_generate_target_domain_owner_receipt: false,
      required_return_shape: 'stage_attempt_receipt_or_typed_blocker_ref',
    },
    current_pointer_contract: {
      current_pointer_ref: refs.current_pointer_ref,
      current_file_name: 'current.json',
      pointer_owner: 'one-person-lab',
      oma_materializes_ref_template_only: true,
      old_attempts_not_pointed_by_current_are_historical_evidence_only: true,
    },
    canonical_artifact_contract: {
      canonical_artifact_ref: refs.canonical_artifact_ref,
      canonical_file_name: 'canonical.json',
      body_owner: domainTruthOwner,
      contains_target_artifact_body: false,
      canonical_body_requires_target_owner_receipt: true,
    },
    export_contract: {
      export_ref_template: refs.export_ref,
      export_file_name: 'export.json',
      export_owner: domainTruthOwner,
      oma_can_authorize_target_quality_or_export: false,
      export_requires_target_owner_gate: true,
    },
    lineage_contract: {
      lineage_ref_template: refs.lineage_ref,
      lineage_file_name: 'lineage.json',
      lineage_owner: 'one-person-lab',
      required_fields: [
        'stage_id',
        'stage_attempt_id',
        'input_refs',
        'source_refs',
        'producer_refs',
        'parent_attempt_refs',
        'repair_refs',
      ],
    },
    retention_contract: {
      retention_ref_template: refs.retention_ref,
      retention_file_name: 'retention.json',
      retention_owner: 'one-person-lab',
      retention_policy: 'attempt_refs_retained_as_evidence_until_opl_retention_gate',
      oma_can_delete_stage_attempt_history: false,
    },
    physical_kernel_locator_contract: {
      physical_kernel_locator_ref: refs.physical_kernel_locator_ref,
      physical_kernel_locator_file_name: 'physical_kernel_locator.json',
      source_contract_ref: 'contracts/opl-framework/stage-artifact-runtime-contract.json',
      source_surface_kind: 'opl_stage_artifact_runtime_contract',
      attempt_root_pattern:
        'runtime-state/domains/<domain>/deliverables/<program>/<topic>/<deliverable>/stages/<nn-stage>/attempts/<attempt_id>',
      folder_path_template: `stages/${stageId}/attempts/{stage_attempt_id}`,
      required_attempt_entries: [
        'attempt.json',
        'manifest.json',
        'inputs/',
        'outputs/',
        'evidence/',
        'receipts/',
      ],
      current_pointer_role: 'refs_only_current_or_canonical_artifact_pointer',
      derived_index_role: 'rebuildable_projection_not_primary_truth',
      status_source_of_truth: 'physical_stage_folder',
      oma_materializes_ref_template_only: true,
      oma_can_create_runtime_state: false,
    },
    conformance_contract: {
      surface_kind: 'opl_stage_artifact_runtime_conformance',
      conformance_ref: refs.conformance_ref,
      conformance_file_name: 'conformance.json',
      source_contract_ref: 'contracts/opl-framework/stage-artifact-runtime-contract.json',
      conformance_owner: 'one-person-lab',
      strict_units: [
        'Stage Folder',
        'Manifest',
        'Receipt',
        'content_hashes',
        'latest_pointer',
        'current_pointer',
        'lineage_events',
      ],
      fails_on: [
        'missing_deliverable_json',
        'missing_stage_json',
        'missing_required_attempt_entry',
        'missing_latest_pointer',
        'latest_pointer_missing_attempt',
        'missing_current_pointer',
        'missing_manifest_hash_entry',
        'manifest_content_hash_mismatch',
        'attempt_broken',
        'attempt_orphan',
      ],
      domain_readiness_claim: false,
      oma_materializes_ref_template_only: true,
      oma_can_claim_conformance_pass: false,
    },
    workbench_consumption_contract: {
      surface_kind: 'opl_stage_artifact_runtime_workbench_consumption',
      workbench_consumption_ref: refs.workbench_consumption_ref,
      workbench_consumption_file_name: 'workbench_consumption.json',
      source_contract_ref: 'contracts/opl-framework/stage-artifact-runtime-contract.json',
      workbench_owner: 'one-person-lab-app via OPL/App contracts',
      projects: [
        'current_pointer',
        'stage_status',
        'attempt_manifest_refs',
        'owner_receipt_refs',
        'typed_blocker_refs',
        'decision_receipt_refs',
        'content_hashes',
        'canonical_artifacts',
        'export_artifacts',
        'lineage_refs',
        'retention_policy',
        'conformance_summary',
      ],
      artifact_body_access: false,
      domain_verdict_authority: false,
      oma_materializes_ref_template_only: true,
      oma_can_write_workbench_state: false,
    },
    output_roles: [
      {
        role_id: 'stage_json',
        ref_kind: 'stage_json_ref',
        body_owner: 'one-person-lab',
        contains_target_artifact_body: false,
      },
      {
        role_id: 'attempt_json',
        ref_kind: 'stage_attempt_json_ref',
        body_owner: 'one-person-lab',
        contains_target_artifact_body: false,
      },
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
      {
        role_id: 'export_ref',
        ref_kind: 'stage_export_ref',
        body_owner: domainTruthOwner,
        contains_target_artifact_body: false,
      },
      {
        role_id: 'lineage_ref',
        ref_kind: 'stage_lineage_ref',
        body_owner: 'one-person-lab',
        contains_target_artifact_body: false,
      },
      {
        role_id: 'retention_ref',
        ref_kind: 'stage_retention_ref',
        body_owner: 'one-person-lab',
        contains_target_artifact_body: false,
      },
      {
        role_id: 'physical_kernel_locator_ref',
        ref_kind: 'opl_physical_kernel_locator_ref',
        body_owner: 'one-person-lab',
        contains_target_artifact_body: false,
      },
      {
        role_id: 'conformance_ref',
        ref_kind: 'stage_artifact_conformance_ref',
        body_owner: 'one-person-lab',
        contains_target_artifact_body: false,
      },
      {
        role_id: 'workbench_consumption_ref',
        ref_kind: 'stage_artifact_workbench_consumption_ref',
        body_owner: 'one-person-lab-app via OPL/App contracts',
        contains_target_artifact_body: false,
      },
    ],
    authority_boundary: stageNativeAuthorityBoundary(),
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
    stage_json_refs: stageIds.map((stageId) => (
      `stage-json-ref:${domainId}/${stageId}`
    )),
    attempt_json_ref_templates: stageIds.map((stageId) => (
      `stage-attempt-json-ref:${domainId}/${stageId}/{stage_attempt_id}`
    )),
    manifest_ref_templates: stageIds.map((stageId) => (
      `stage-manifest-ref:${domainId}/${stageId}/{stage_attempt_id}`
    )),
    receipt_ref_templates: stageIds.map((stageId) => (
      `stage-attempt-receipt-ref:${domainId}/${stageId}/{stage_attempt_id}`
    )),
    current_pointer_refs: stageIds.map((stageId) => (
      `stage-current-pointer-ref:${domainId}/${stageId}`
    )),
    canonical_artifact_refs: stageIds.map((stageId) => (
      `canonical-artifact-ref:${domainId}/${stageId}`
    )),
    export_ref_templates: stageIds.map((stageId) => (
      `stage-export-ref:${domainId}/${stageId}/{stage_attempt_id}`
    )),
    lineage_ref_templates: stageIds.map((stageId) => (
      `stage-lineage-ref:${domainId}/${stageId}/{stage_attempt_id}`
    )),
    retention_ref_templates: stageIds.map((stageId) => (
      `stage-retention-ref:${domainId}/${stageId}/{stage_attempt_id}`
    )),
    physical_kernel_locator_refs: stageIds.map((stageId) => (
      `opl-physical-kernel-locator-ref:${domainId}/${stageId}`
    )),
    conformance_refs: stageIds.map((stageId) => (
      `stage-artifact-conformance-ref:${domainId}/${stageId}`
    )),
    workbench_consumption_refs: stageIds.map((stageId) => (
      `stage-artifact-workbench-consumption-ref:${domainId}/${stageId}`
    )),
    contracts: stageIds.map((stageId) => buildStageNativeArtifactContract({
      domainId,
      stageId,
      domainTruthOwner,
      materializedBy,
    })),
    authority_boundary: stageNativeAuthorityBoundary(),
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
    stage_folder_contract: buildStageFolderContract({ domainId, stageId, attemptId }),
    authority_boundary: stageNativeAuthorityBoundary(),
    can_own_agent_lab_runner: false,
    can_own_queue: false,
    can_own_attempt_ledger: false,
    can_own_worktree_lifecycle: false,
    can_own_promotion_gate: false,
    can_own_app_shell: false,
    can_write_target_owner_closeout: false,
    can_create_stage_folder_runtime_state: false,
    can_write_stage_folder_runtime_state: false,
    can_generate_target_domain_owner_receipt: false,
    can_write_target_owner_receipt_body: false,
    can_write_target_domain_truth: false,
    can_write_target_domain_memory_body: false,
    can_mutate_target_domain_artifact_body: false,
    can_authorize_target_quality_or_export: false,
    can_owner_promote_target_agent: false,
    can_promote_default_agent_without_gate: false,
    can_manage_target_worktree_lifecycle: false,
  };
}
