import type { JsonObject } from './domain-pack.ts';

type WorkOrderAuthorityFieldNames = {
  memoryWriteField?: string;
  artifactMutationField?: string;
};

type DeveloperPatchWorkOrderValidationOptions = {
  allowMissingReviewerFields?: boolean;
};

export type EfficiencyNonRegressionRefs = {
  quality_floor_refs: string[];
  latency_baseline_refs: string[];
  usage_cost_refs: string[];
  cache_reuse_refs: string[];
  target_verification_refs: string[];
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

export const DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES = [
  'target domain truth surfaces',
  'target domain memory body',
  'target domain artifact body',
  'target quality verdict bodies',
  'submission readiness verdicts',
  'export verdict bodies',
];

export const DEFAULT_RUNTIME_REQUIRED_SURFACE_REFS = [
  'target_agent_descriptor',
  'target_agent_owner_route',
  'target_agent_owner_receipt_contract',
  'target_agent_quality_gate_projection',
  'default_executor_dispatch_execution',
  'target_agent_status_or_progress_projection',
];

export const DEFAULT_RUNTIME_EXPECTED_OUTCOMES = [
  'patched quality contract, owner route, or owner receipt contract is visible in target runtime/read-model projection',
  'blocked suite redrive no longer parks as stale human handoff when target owner work remains',
  'no forbidden target domain truth, artifact, memory, quality verdict, or submission readiness surface is written by opl-meta-agent',
];

export const DEFAULT_TARGET_WORKSPACE_REQUIRED_SURFACE_REFS = [
  'target_workspace_pyproject_or_lock',
  'target_workspace_profile_or_config_env',
  'study_runtime_analysis_bundle',
  'target_owner_entry_redrive_report',
  'target_repo_hygiene_status',
];

export const DEFAULT_TARGET_WORKSPACE_EXPECTED_OUTCOMES = [
  'target workspace dependency lock/profile includes required runtime extras before owner redrive',
  'owner runtime entry uses the target workspace interpreter rather than target repo checkout .venv',
  'owner redrive reports the analysis/runtime bundle as ready under the target workspace interpreter',
  'repo hygiene proof shows no target checkout .venv or generated egg-info pollution',
];

export const DEFAULT_NO_PATCH_CLOSEOUT_EVIDENCE = [
  'target owner receipt projection consumed Agent Lab suite result',
  'target owner receipt projection consumed opl-meta-agent coordination result',
  'no target source patch was requested',
  'no target domain truth, memory body, artifact body, quality verdict, or export verdict was written',
];

export const DEFAULT_SOURCE_PATCH_CLOSEOUT_EVIDENCE = [
  'patch_traceability_matrix addressed',
  'target agent tests passed',
  'target runtime/read-model consumed patched capability',
  'target workspace dependency lock/profile migrated when runtime extras are required',
  'target owner entry redrive consumed the migrated workspace environment',
  'repo hygiene proof shows no target checkout .venv or generated egg-info pollution',
  'developer patch receipt recorded',
  'target agent status or decision docs updated',
  'temporary worktree cleaned after absorb',
];

export function uniqueRefs(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

export function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? uniqueRefs(value.filter((entry): entry is string => typeof entry === 'string').map((entry) => entry.trim()))
    : [];
}

export function records(value: unknown): JsonObject[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is JsonObject => Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry))
    : [];
}

export function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function firstString(values: unknown[], fallback: string): string {
  for (const value of values) {
    const text = stringValue(value);
    if (text) {
      return text;
    }
  }
  return fallback;
}

export function refsFromEntries(entries: unknown): string[] {
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry;
      }
      if (entry && typeof entry === 'object' && typeof (entry as JsonObject).ref === 'string') {
        return (entry as JsonObject).ref;
      }
      return null;
    })
    .filter((ref): ref is string => Boolean(ref && ref.trim()))
    .map((ref) => ref.trim());
}

export function refsFromRecord(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (!value || typeof value !== 'object') {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap(refsFromRecord);
  }
  const record = value as JsonObject;
  return [
    ...(typeof record.ref === 'string' ? [record.ref] : []),
    ...Object.entries(record)
      .filter(([key]) => key !== 'ref')
      .flatMap(([, nested]) => refsFromRecord(nested)),
  ];
}

export function emptyEfficiencyNonRegressionRefs(): EfficiencyNonRegressionRefs {
  return {
    quality_floor_refs: [],
    latency_baseline_refs: [],
    usage_cost_refs: [],
    cache_reuse_refs: [],
    target_verification_refs: [],
  };
}

function refsByTokens(values: string[], tokens: string[]): string[] {
  return uniqueRefs(values.filter((ref) => {
    const normalized = ref.toLowerCase();
    return tokens.some((token) => normalized.includes(token));
  }));
}

export function collectEfficiencyNonRegressionRefs(...sources: unknown[]): EfficiencyNonRegressionRefs {
  const explicit = emptyEfficiencyNonRegressionRefs();
  const flatRefs: string[] = [];
  const visit = (value: unknown): void => {
    if (typeof value === 'string') {
      flatRefs.push(value);
      return;
    }
    if (!value || typeof value !== 'object') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const record = value as JsonObject;
    for (const field of Object.keys(explicit) as Array<keyof EfficiencyNonRegressionRefs>) {
      explicit[field].push(...stringList(record[field]));
    }
    if (record.efficiency_evidence_refs) {
      visit(record.efficiency_evidence_refs);
    }
    if (record.efficiency_non_regression_refs) {
      visit(record.efficiency_non_regression_refs);
    }
    [
      record.evidence_refs,
      record.metric_refs,
      record.quality_gate_refs,
      record.review_refs,
      record.required_refs,
      record.regression_suite_refs,
      record.source_refs,
      record.direct_evidence_refs,
      record.artifact_refs,
      record.repair_refs,
      record.receipt_refs,
      record.next_verification_command_refs,
    ].forEach(visit);
  };
  sources.forEach(visit);
  const merged = {
    quality_floor_refs: uniqueRefs([
      ...explicit.quality_floor_refs,
      ...refsByTokens(flatRefs, ['quality-floor', 'quality_floor']),
    ]),
    latency_baseline_refs: uniqueRefs([
      ...explicit.latency_baseline_refs,
      ...refsByTokens(flatRefs, ['latency-baseline', 'latency_baseline']),
    ]),
    usage_cost_refs: uniqueRefs([
      ...explicit.usage_cost_refs,
      ...refsByTokens(flatRefs, ['usage-cost', 'usage_cost', 'token-cost', 'token_cost', 'cost-baseline']),
    ]),
    cache_reuse_refs: uniqueRefs([
      ...explicit.cache_reuse_refs,
      ...refsByTokens(flatRefs, ['cache-reuse', 'cache_reuse', 'prefix-cache', 'prefix_cache']),
    ]),
    target_verification_refs: uniqueRefs([
      ...explicit.target_verification_refs,
      ...refsByTokens(flatRefs, ['target-verification', 'target_verification']),
    ]),
  };
  return merged;
}

export function hasEfficiencyNonRegressionEvidence(refs: EfficiencyNonRegressionRefs): boolean {
  return [
    refs.quality_floor_refs,
    refs.latency_baseline_refs,
    refs.usage_cost_refs,
    refs.cache_reuse_refs,
    refs.target_verification_refs,
  ].some((values) => values.length > 0);
}

export function missingEfficiencyNonRegressionFields(refs: EfficiencyNonRegressionRefs): string[] {
  const missing: string[] = [];
  if (hasEfficiencyNonRegressionEvidence(refs) && refs.quality_floor_refs.length === 0) {
    missing.push('efficiency_non_regression_refs.quality_floor_refs');
  }
  return missing;
}

export function verificationRefs(productionAcceptance: JsonObject): string[] {
  return uniqueRefs([
    ...refsFromEntries(productionAcceptance.domain_acceptance_receipt?.next_verification_command_refs),
    ...refsFromEntries(productionAcceptance.refs?.next_verification_command_refs),
    ...refsFromEntries(productionAcceptance.closure_evidence?.next_verification_ref ? [
      productionAcceptance.closure_evidence.next_verification_ref,
    ] : []),
  ]);
}

export function productionAcceptanceEvidenceRefs(productionAcceptance: JsonObject): string[] {
  return uniqueRefs([
    ...refsFromRecord(productionAcceptance.domain_acceptance_receipt),
    ...refsFromRecord(productionAcceptance.refs),
    ...refsFromEntries(productionAcceptance.closure_evidence?.owner_receipt_ref ? [
      productionAcceptance.closure_evidence.owner_receipt_ref,
    ] : []),
  ]);
}

export function ownerRouteRef(
  ownerRoute: unknown,
  targetAgent: { domainId: string },
): string | null {
  const normalized = stringValue(ownerRoute);
  if (!normalized) {
    return null;
  }
  if (normalized.startsWith('owner-route:')) {
    return normalized;
  }
  if (normalized.includes('/')) {
    return `owner-route:${normalized}`;
  }
  return `owner-route:${targetAgent.domainId}/${normalized}`;
}

export function requiredReturnShapes(contracts: { productionAcceptance: JsonObject }): string[] {
  return uniqueRefs([
    ...stringList(contracts.productionAcceptance.production_like_receipt_chain?.required_return_shapes),
    ...stringList(contracts.productionAcceptance.domain_acceptance_receipt?.required_return_shapes),
  ]);
}

export function taskRequiredReturnShapeRefs(
  tasks: JsonObject[],
  targetAgent: { domainId: string },
): string[] {
  return uniqueRefs(tasks.flatMap((task) => (
    stringList(task.required_return_shapes).map((shape) => `required-return-shape:${targetAgent.domainId}/${shape}`)
  )));
}

export function forbiddenWriteSurfaces(contracts: {
  generatedSurfaceHandoff: JsonObject;
  productionAcceptance: JsonObject;
}, baseSurfaces: string[] = DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES): string[] {
  return uniqueRefs([
    ...baseSurfaces,
    ...stringList(contracts.generatedSurfaceHandoff.generated_surface_policy?.must_not_write),
    ...stringList(contracts.productionAcceptance.authority_boundary?.forbidden_write_surfaces),
  ]);
}

export function noForbiddenWriteProofRefs(
  contracts: {
    productionAcceptance: JsonObject;
    generatedSurfaceHandoff: JsonObject;
    agentLabHandoff: JsonObject;
  },
  targetAgent: { domainId: string },
): string[] {
  const refs = uniqueRefs([
    ...refsFromEntries(contracts.productionAcceptance.authority_boundary?.no_forbidden_write_proof_refs),
    ...refsFromEntries(contracts.generatedSurfaceHandoff.no_forbidden_write_proof_refs),
    ...refsFromEntries(contracts.agentLabHandoff.no_forbidden_write_proof_refs),
  ]);
  return refs.length > 0 ? refs : [`no-forbidden-write:${targetAgent.domainId}/production-evidence-tail`];
}

export function targetOwnerRoute(contracts: {
  productionAcceptance: JsonObject;
  productionAcceptanceRef: string;
}): JsonObject {
  const boundary = contracts.productionAcceptance.authority_boundary ?? {};
  return {
    domain_ready_requires_owner_receipt_or_typed_blocker:
      boundary.domain_ready_requires_owner_receipt_or_typed_blocker === true,
    quality_or_export_ready_requires_target_owner_gate:
      boundary.quality_or_export_ready_requires_target_owner_gate === true,
    artifact_mutation_requires_owner_receipt:
      boundary.artifact_mutation_requires_owner_receipt === true,
    source_authority_boundary_ref: `${contracts.productionAcceptanceRef}#/authority_boundary`,
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

export function buildOplAgentLabOwnedPrimitiveRefs({
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
      `opl-agent-lab-primitive:work-order-readiness/${domainId}/${workOrderId}${modeSuffix}`,
    promotion_readiness_primitive_ref:
      `opl-agent-lab-primitive:promotion-readiness/${domainId}/${workOrderId}${modeSuffix}`,
    target_owner_return_primitive_ref:
      `opl-agent-lab-primitive:target-owner-return/${domainId}/${workOrderId}`,
    patch_traceability_primitive_ref:
      `opl-agent-lab-primitive:patch-traceability/${domainId}/${workOrderId}${modeSuffix}`,
    readiness_projection_ref:
      `opl-agent-lab-readiness-projection:${domainId}/${workOrderId}${modeSuffix}`,
    promotion_gate_ref: promotionGateRef ?? `promotion-gate:opl-agent-lab/${domainId}/${workOrderId}`,
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

function requireNonEmptyStringArray(value: unknown, fieldName: string): void {
  if (!Array.isArray(value) || !value.some((entry) => typeof entry === 'string' && entry.trim().length > 0)) {
    throw new Error(`Invalid developer patch work order: ${fieldName} must be a non-empty string array.`);
  }
}

function requireNonEmptyString(value: unknown, fieldName: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid developer patch work order: ${fieldName} must be a non-empty string.`);
  }
}

function requireTypedBlockerRef(value: unknown, fieldName: string): void {
  requireNonEmptyString(value, fieldName);
  if (!String(value).startsWith('typed-blocker:')) {
    throw new Error(`Invalid developer patch work order: ${fieldName} must be a typed blocker ref.`);
  }
}

export function validateDeveloperPatchWorkOrder(
  workOrder: JsonObject,
  options: DeveloperPatchWorkOrderValidationOptions = {},
): void {
  if (!options.allowMissingReviewerFields) {
    requireNonEmptyStringArray(workOrder.ai_reviewer_evidence?.source_refs, 'ai_reviewer_evidence.source_refs');
    requireNonEmptyStringArray(
      workOrder.ai_reviewer_evidence?.direct_evidence_refs,
      'ai_reviewer_evidence.direct_evidence_refs',
    );
    requireNonEmptyString(workOrder.ai_reviewer_scorecard?.verdict, 'ai_reviewer_scorecard.verdict');
    requireNonEmptyString(workOrder.ai_reviewer_review?.predicted_impact, 'ai_reviewer_review.predicted_impact');
    requireNonEmptyStringArray(workOrder.reviewer_pool_refs, 'reviewer_pool_refs');
  }
  requireNonEmptyString(workOrder.executor_lease_ref, 'executor_lease_ref');
  requireNonEmptyString(workOrder.patch_execution_bundle_ref, 'patch_execution_bundle_ref');
  requireNonEmptyStringArray(workOrder.target_closeout_refs, 'target_closeout_refs');
  requireNonEmptyStringArray(workOrder.ahe_developer_work_order?.failure_evidence, 'ahe_developer_work_order.failure_evidence');
  requireNonEmptyString(workOrder.ahe_developer_work_order?.root_cause, 'ahe_developer_work_order.root_cause');
  requireNonEmptyStringArray(workOrder.ahe_developer_work_order?.targeted_fix, 'ahe_developer_work_order.targeted_fix');
  requireNonEmptyString(workOrder.ahe_developer_work_order?.predicted_impact, 'ahe_developer_work_order.predicted_impact');
  requireNonEmptyStringArray(workOrder.required_verification_refs, 'required_verification_refs');
  requireNonEmptyStringArray(workOrder.owner_route_refs, 'owner_route_refs');
  requireNonEmptyStringArray(workOrder.rollback_version_refs, 'rollback_version_refs');
  requireNonEmptyStringArray(workOrder.no_forbidden_write_proof?.proof_refs, 'no_forbidden_write_proof.proof_refs');
  if (!options.allowMissingReviewerFields) {
    requireNonEmptyStringArray(workOrder.work_order_completeness?.reviewer_refs, 'work_order_completeness.reviewer_refs');
    requireNonEmptyStringArray(
      workOrder.work_order_completeness?.reviewer_pool_refs,
      'work_order_completeness.reviewer_pool_refs',
    );
  }
  requireNonEmptyString(
    workOrder.work_order_completeness?.executor_lease_ref,
    'work_order_completeness.executor_lease_ref',
  );
  requireNonEmptyString(
    workOrder.work_order_completeness?.executor_aperture?.executor_lease_ref,
    'work_order_completeness.executor_aperture.executor_lease_ref',
  );
  requireNonEmptyString(
    workOrder.work_order_completeness?.patch_execution_bundle_ref,
    'work_order_completeness.patch_execution_bundle_ref',
  );
  requireNonEmptyStringArray(
    workOrder.work_order_completeness?.target_closeout_refs,
    'work_order_completeness.target_closeout_refs',
  );
  requireNonEmptyString(
    workOrder.work_order_completeness?.patch_traceability?.matrix_ref,
    'work_order_completeness.patch_traceability.matrix_ref',
  );
  requireNonEmptyStringArray(
    workOrder.work_order_completeness?.target_verification?.required_refs,
    'work_order_completeness.target_verification.required_refs',
  );
  requireNonEmptyStringArray(
    workOrder.work_order_completeness?.owner_route?.route_refs,
    'work_order_completeness.owner_route.route_refs',
  );
  requireNonEmptyStringArray(
    workOrder.work_order_completeness?.no_forbidden_write_proof?.proof_refs,
    'work_order_completeness.no_forbidden_write_proof.proof_refs',
  );
  requireNonEmptyStringArray(workOrder.work_order_completeness?.canary_refs, 'work_order_completeness.canary_refs');
  requireNonEmptyStringArray(workOrder.work_order_completeness?.rollback_refs, 'work_order_completeness.rollback_refs');
  requireNonEmptyStringArray(workOrder.work_order_completeness?.version_refs, 'work_order_completeness.version_refs');
  requireTypedBlockerRef(
    workOrder.work_order_completeness?.fail_closed_blocker_ref,
    'work_order_completeness.fail_closed_blocker_ref',
  );
}
