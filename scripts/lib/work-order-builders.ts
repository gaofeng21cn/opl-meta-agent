import type { JsonObject } from './domain-pack.ts';
import {
  DEFAULT_NO_PATCH_CLOSEOUT_EVIDENCE,
  DEFAULT_RUNTIME_EXPECTED_OUTCOMES,
  DEFAULT_RUNTIME_REQUIRED_SURFACE_REFS,
  DEFAULT_SOURCE_PATCH_CLOSEOUT_EVIDENCE,
  DEFAULT_TARGET_WORKSPACE_EXPECTED_OUTCOMES,
  DEFAULT_TARGET_WORKSPACE_REQUIRED_SURFACE_REFS,
  uniqueRefs,
} from './work-order-refs.ts';
import {
  type EfficiencyNonRegressionRefs,
  hasEfficiencyNonRegressionEvidence,
} from './work-order-efficiency.ts';

type WorkOrderAuthorityFieldNames = {
  memoryWriteField?: string;
  artifactMutationField?: string;
};

type RefsOnlyWorkOrderCompletenessOptions = {
  requiredFieldsPresent: boolean;
  missingRequiredFields?: string[];
  executorLeaseRef: string;
  reviewerPoolRefs: string[];
  patchExecutionBundleRef: string;
  targetCloseoutRefs: string[];
  reviewerRefs: string[];
  workOrderId: string;
  proposedChangeRefs: string[];
  traceabilityStatus: string;
  requiredVerificationRefs: string[];
  targetVerificationExtraRefs: string[];
  ownerRouteRefs: string[];
  noForbiddenWriteProofRefs: string[];
  executorAllowedScope: string;
  executorAllowedWriteSurfaces: string[];
  executorForbiddenWriteSurfaces: string[];
  canaryRefs: string[];
  rollbackRefs: string[];
  versionRefs: string[];
  failClosedBlockerRef: string;
  authorityFieldNames?: WorkOrderAuthorityFieldNames;
  efficiencyNonRegressionRefs?: EfficiencyNonRegressionRefs;
};

type WorkOrderBundleRefOptions = {
  domainId: string;
  workOrderId: string;
  reviewerRefs: string[];
  machineCloseoutRefs: JsonObject;
};

function workOrderRouteTuple({
  domainId,
  suiteResultRef,
  workOrderId,
  ownerRouteRef,
}: {
  domainId: string;
  suiteResultRef: string;
  workOrderId: string;
  ownerRouteRef: string;
}): string {
  return [domainId, suiteResultRef, workOrderId, ownerRouteRef].join('|');
}

function buildProviderOwnerRouteIndexEvidence({
  domainId,
  suiteResultRef,
  workOrderId,
  ownerRouteRef,
}: {
  domainId: string;
  suiteResultRef: string;
  workOrderId: string;
  ownerRouteRef: string;
}): JsonObject {
  return {
    provider: 'opl_work_order_execute',
    owner_route_index_ref: `owner-route-index:${domainId}/${workOrderId}`,
    owner_route_ledger_ref: `owner-route-ledger:${domainId}/${workOrderId}`,
    stage_attempt_ledger_ref: `stage-attempt-ledger:${domainId}/${workOrderId}`,
    route_binding_ref: `route-binding:${domainId}/${suiteResultRef}/${workOrderId}`,
    target_eval_work_order_owner_route_tuple: workOrderRouteTuple({
      domainId,
      suiteResultRef,
      workOrderId,
      ownerRouteRef,
    }),
    derived_from_current_opl_route_ledger: true,
    fail_closed_without_route_or_ledger_proof: true,
  };
}

export function buildWorkOrderCurrentness({
  domainId,
  suiteResultRef,
  workOrderId,
  ownerRouteRef,
}: {
  domainId: string;
  suiteResultRef: string;
  workOrderId: string;
  ownerRouteRef: string;
}): JsonObject {
  return {
    target_agent_id: domainId,
    eval_result_ref: suiteResultRef,
    work_order_ref: workOrderId,
    owner_route_ref: ownerRouteRef,
    provider_owner_route_index_evidence: buildProviderOwnerRouteIndexEvidence({
      domainId,
      suiteResultRef,
      workOrderId,
      ownerRouteRef,
    }),
  };
}

function valuesAsStrings(record: JsonObject): string[] {
  return Object.values(record)
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
}

export function platformOnlyProgressRefs(machineCloseoutRefs: JsonObject): string[] {
  return uniqueRefs([
    ...valuesAsStrings(machineCloseoutRefs),
    'owner_receipt_coordination_record',
    'target_owner_receipt_projection_ref',
  ]);
}

export function buildTargetProgressAccounting({
  substantiveDeliverableDeltaRefs,
  machineCloseoutRefs,
}: {
  substantiveDeliverableDeltaRefs: string[];
  machineCloseoutRefs: JsonObject;
}): JsonObject {
  const platformOnlyRefs = platformOnlyProgressRefs(machineCloseoutRefs);
  const deliverableRefs = uniqueRefs(substantiveDeliverableDeltaRefs)
    .filter((ref) => !platformOnlyRefs.includes(ref));
  const platformRefs = uniqueRefs([
    machineCloseoutRefs.target_runtime_read_model_consumption_ref,
    machineCloseoutRefs.workspace_environment_proof_ref,
    machineCloseoutRefs.no_forbidden_write_proof_ref,
    machineCloseoutRefs.target_owner_receipt_or_typed_blocker_ref,
    machineCloseoutRefs.patch_absorption_ref,
    machineCloseoutRefs.worktree_cleanup_ref,
    machineCloseoutRefs.agent_lab_re_evaluation_ref,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0));
  const excludedRefs = uniqueRefs(substantiveDeliverableDeltaRefs)
    .filter((ref) => platformOnlyRefs.includes(ref));
  return {
    progress_delta_classification: deliverableRefs.length > 0
      ? (platformRefs.length > 0 ? 'mixed' : 'deliverable_progress')
      : (platformRefs.length > 0 ? 'platform_repair' : 'typed_blocker'),
    deliverable_progress_delta: {
      count: deliverableRefs.length,
      refs: deliverableRefs,
      domain_alias: 'target_agent_substantive_delta',
    },
    platform_repair_delta: {
      count: platformRefs.length,
      refs: platformRefs,
      domain_alias: 'platform_interface_repair_delta',
    },
    excluded_from_substantive_deliverable_progress_refs: excludedRefs,
    non_substantive_progress_ref_kinds: [
      'platform_interface_repair',
      'closeout_plumbing',
      'patch_absorption',
      'worktree_cleanup',
      'agent_lab_re_evaluation',
      'currentness_repair',
      'refs_only_ledger_work',
    ],
    accounting_policy: 'deliverable_delta_is_not_closed_by_platform_interface_repair',
  };
}

function buildNoForbiddenWriteReadiness({
  proofRefs,
  authorityFieldNames = {},
}: {
  proofRefs: string[];
  authorityFieldNames?: WorkOrderAuthorityFieldNames;
}): JsonObject {
  return {
    required: true,
    proof_refs: proofRefs,
    can_write_target_domain_truth: false,
    [authorityFieldNames.memoryWriteField ?? 'can_write_target_domain_memory_body']: false,
    [authorityFieldNames.artifactMutationField ?? 'can_mutate_target_domain_artifact_body']: false,
    can_authorize_target_quality_or_export: false,
  };
}

export function buildOplWorkOrderPrimitiveRefs({
  domainId,
  workOrderId,
  patchMode,
  promotionGateRef,
}: {
  domainId: string;
  workOrderId: string;
  patchMode?: string;
  promotionGateRef?: string;
}): JsonObject {
  const modeSuffix = patchMode ? `/${patchMode}` : '';
  return {
    work_order_readiness_primitive_ref:
      `opl-work-order-primitive:work-order-readiness/${domainId}/${workOrderId}${modeSuffix}`,
    promotion_readiness_primitive_ref:
      `opl-work-order-primitive:promotion-readiness/${domainId}/${workOrderId}${modeSuffix}`,
    promotion_gate_projection_ref:
      `opl-work-order-primitive:promotion-gate-projection/${domainId}/${workOrderId}${modeSuffix}`,
    owner_gated_promotion_projection_ref:
      `opl-work-order-primitive:owner-gated-promotion-projection/${domainId}/${workOrderId}${modeSuffix}`,
    target_owner_return_primitive_ref:
      `opl-work-order-primitive:target-owner-return/${domainId}/${workOrderId}`,
    patch_traceability_primitive_ref:
      `opl-work-order-primitive:patch-traceability/${domainId}/${workOrderId}${modeSuffix}`,
    readiness_projection_ref:
      `opl-work-order-readiness-projection:${domainId}/${workOrderId}${modeSuffix}`,
    promotion_gate_ref: promotionGateRef ?? `promotion-gate:opl-work-order/${domainId}/${workOrderId}`,
    owner: 'one-person-lab',
    consumed_as_refs_only_by_oma: true,
  };
}

export function buildRefsOnlyWorkOrderCompleteness({
  requiredFieldsPresent,
  missingRequiredFields = [],
  executorLeaseRef,
  reviewerPoolRefs,
  patchExecutionBundleRef,
  targetCloseoutRefs,
  reviewerRefs,
  workOrderId,
  proposedChangeRefs,
  traceabilityStatus,
  requiredVerificationRefs,
  targetVerificationExtraRefs,
  ownerRouteRefs,
  noForbiddenWriteProofRefs,
  executorAllowedScope,
  executorAllowedWriteSurfaces,
  executorForbiddenWriteSurfaces,
  canaryRefs,
  rollbackRefs,
  versionRefs,
  failClosedBlockerRef,
  authorityFieldNames,
  efficiencyNonRegressionRefs,
}: RefsOnlyWorkOrderCompletenessOptions): JsonObject {
  return {
    required_fields_present: requiredFieldsPresent,
    missing_required_fields: requiredFieldsPresent ? [] : missingRequiredFields,
    executor_lease_ref: executorLeaseRef,
    reviewer_pool_refs: uniqueRefs(reviewerPoolRefs),
    patch_execution_bundle_ref: patchExecutionBundleRef,
    target_closeout_refs: uniqueRefs(targetCloseoutRefs),
    reviewer_refs: uniqueRefs(reviewerRefs),
    executor_aperture: {
      executor_first: true,
      codex_first: true,
      executor: 'codex_cli',
      executor_lease_ref: executorLeaseRef,
      allowed_scope: executorAllowedScope,
      allowed_write_surfaces: executorAllowedWriteSurfaces,
      forbidden_write_surfaces: executorForbiddenWriteSurfaces,
    },
    patch_traceability: {
      matrix_ref: `${workOrderId}#/patch_traceability_matrix`,
      proposed_change_refs: proposedChangeRefs,
      traceability_status: traceabilityStatus,
    },
    target_verification: {
      required_refs: uniqueRefs([
        ...requiredVerificationRefs,
        ...targetVerificationExtraRefs,
      ]),
      requires_target_owner_receipt_or_typed_blocker: true,
      requires_no_forbidden_write_proof: true,
    },
    owner_route: {
      target_owner_required: true,
      route_refs: ownerRouteRefs,
    },
    no_forbidden_write_proof: buildNoForbiddenWriteReadiness({
      proofRefs: noForbiddenWriteProofRefs,
      authorityFieldNames,
    }),
    canary_refs: uniqueRefs(canaryRefs),
    rollback_refs: uniqueRefs(rollbackRefs),
    version_refs: uniqueRefs(versionRefs),
    ...(efficiencyNonRegressionRefs && hasEfficiencyNonRegressionEvidence(efficiencyNonRegressionRefs)
      ? { efficiency_non_regression_refs: efficiencyNonRegressionRefs }
      : {}),
    fail_closed_blocker_ref: failClosedBlockerRef,
  };
}

export function buildWorkOrderBundleRefs({
  domainId,
  workOrderId,
  reviewerRefs,
  machineCloseoutRefs,
}: WorkOrderBundleRefOptions): JsonObject {
  return {
    executor_lease_ref: `executor-lease:codex-cli/${workOrderId}`,
    reviewer_pool_refs: uniqueRefs(reviewerRefs),
    patch_execution_bundle_ref: `patch-execution-bundle:target-agent/${domainId}/${workOrderId}`,
    target_closeout_refs: uniqueRefs(
      Object.values(machineCloseoutRefs)
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .filter((value): value is string => typeof value === 'string'),
    ),
  };
}

export function buildTargetPatchLoopMachineRefs({
  domainId,
  suiteResultRef,
  workOrderId,
  requiredVerificationRefs,
  noForbiddenWriteProofRefs,
  patchMode,
  efficiencyNonRegressionRefs,
}: {
  domainId: string;
  suiteResultRef: string;
  workOrderId: string;
  requiredVerificationRefs: string[];
  noForbiddenWriteProofRefs: string[];
  patchMode?: string;
  efficiencyNonRegressionRefs?: EfficiencyNonRegressionRefs;
}): JsonObject {
  const modeSuffix = patchMode ? `/${patchMode}` : '';
  return {
    blocked_suite_result_ref: suiteResultRef,
    developer_patch_work_order_ref: workOrderId,
    patch_traceability_matrix_ref: `${workOrderId}#/patch_traceability_matrix`,
    target_repo_verification_refs: requiredVerificationRefs,
    target_runtime_read_model_consumption_ref:
      `target-runtime-read-model-consumption:${domainId}/${workOrderId}${modeSuffix}`,
    workspace_environment_proof_ref:
      `workspace-environment-proof:${domainId}/${workOrderId}${modeSuffix}`,
    no_forbidden_write_proof_ref: noForbiddenWriteProofRefs[0]
      ?? `no-forbidden-write:${domainId}/${workOrderId}`,
    target_owner_receipt_or_typed_blocker_ref:
      `target-owner-receipt-or-typed-blocker:${domainId}/${workOrderId}`,
    patch_absorption_ref: `patch-absorption:${domainId}/${workOrderId}${modeSuffix}`,
    worktree_cleanup_ref: `worktree-cleanup:${domainId}/${workOrderId}${modeSuffix}`,
    agent_lab_re_evaluation_ref:
      `agent-lab-re-evaluation:${domainId}/${suiteResultRef}/${workOrderId}`,
    ...(efficiencyNonRegressionRefs && hasEfficiencyNonRegressionEvidence(efficiencyNonRegressionRefs)
      ? { efficiency_non_regression_refs: efficiencyNonRegressionRefs }
      : {}),
  };
}

export function buildRuntimeConsumptionVerification({
  requiredSurfaceRefs,
  expectedOutcomes,
}: {
  requiredSurfaceRefs?: string[];
  expectedOutcomes?: string[];
} = {}): JsonObject {
  return {
    verification_mode: 'read_only_target_domain_runtime_projection',
    required_surface_refs: requiredSurfaceRefs?.length
      ? requiredSurfaceRefs
      : DEFAULT_RUNTIME_REQUIRED_SURFACE_REFS,
    expected_outcomes: expectedOutcomes?.length
      ? expectedOutcomes
      : DEFAULT_RUNTIME_EXPECTED_OUTCOMES,
    can_write_target_domain_truth: false,
    can_mutate_target_domain_artifact_body: false,
    can_authorize_target_domain_quality_or_export: false,
  };
}

export function buildTargetWorkspaceEnvironmentVerification(): JsonObject {
  return {
    verification_mode: 'read_only_target_workspace_environment_and_owner_entry_redrive',
    required_surface_refs: DEFAULT_TARGET_WORKSPACE_REQUIRED_SURFACE_REFS,
    expected_outcomes: DEFAULT_TARGET_WORKSPACE_EXPECTED_OUTCOMES,
    can_write_target_domain_truth: false,
    can_mutate_target_domain_artifact_body: false,
    can_authorize_target_domain_quality_or_export: false,
  };
}

export function targetPatchLoopCloseoutEvidence({
  sourcePatchRequired,
}: {
  sourcePatchRequired: boolean;
}): string[] {
  return sourcePatchRequired
    ? DEFAULT_SOURCE_PATCH_CLOSEOUT_EVIDENCE
    : DEFAULT_NO_PATCH_CLOSEOUT_EVIDENCE;
}
