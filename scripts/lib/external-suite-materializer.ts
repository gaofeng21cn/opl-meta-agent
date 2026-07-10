import type { JsonObject } from './domain-pack.ts';
import {
  type TargetAgent,
  stableId,
} from './meta-agent-loop-io.ts';
import type {
  PatchTraceabilityEntry,
  TargetImprovementPolicy,
} from './target-improvement-policy.ts';
import {
  buildAgentEvolutionWorkOrderFields,
  buildOplWorkOrderPrimitiveRefs,
  buildRefsOnlyWorkOrderCompleteness,
  buildRuntimeConsumptionVerification,
  buildTargetPatchLoopMachineRefs,
  buildTargetProgressAccounting,
  buildTargetWorkspaceEnvironmentVerification,
  buildWorkOrderBundleRefs,
  buildWorkOrderCurrentness,
  targetPatchLoopCloseoutEvidence,
} from './work-order-builders.ts';
import {
  hasEfficiencyNonRegressionEvidence,
  type EfficiencyNonRegressionRefs,
} from './work-order-efficiency.ts';
import {
  stringList,
} from './work-order-refs.ts';

export type CapabilityCandidate = JsonObject & {
  candidate_id: string;
  target_agent: JsonObject;
  authority_boundary: JsonObject;
  target_editable_surface_refs: string[];
  proposed_change_refs: string[];
  patch_traceability_matrix: PatchTraceabilityEntry[];
  efficiency_non_regression_refs: EfficiencyNonRegressionRefs;
};

export type SuiteResult = JsonObject & {
  result_id: string;
  status: string;
  foundry_lab_execution_receipt_ref?: string;
};

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function buildSourceMorphologyProof({
  targetAgent,
  suite,
  suiteResult,
  workOrderId,
  capabilityCandidate,
  patchMode,
}: {
  targetAgent: TargetAgent;
  suite: JsonObject;
  suiteResult: SuiteResult;
  workOrderId: string;
  capabilityCandidate: CapabilityCandidate;
  patchMode: string;
}): JsonObject {
  const ref = `source-morphology-proof:${targetAgent.domain_id}/${workOrderId}/${patchMode}`;
  return {
    ref,
    morphology_kind: 'external_agent_lab_suite_to_target_agent_developer_patch_work_order',
    target_agent_id: targetAgent.domain_id,
    work_order_ref: workOrderId,
    source_suite_ref: String(suite.suite_id ?? 'external-agent-lab-suite'),
    source_agent_lab_result_ref: suiteResult.result_id,
    target_capability_improvement_candidate_ref: capabilityCandidate.candidate_id,
    input_surface_refs: unique([
      String(suite.suite_id ?? ''),
      suiteResult.result_id,
      String(capabilityCandidate.ai_reviewer_evaluation_ref ?? ''),
      capabilityCandidate.candidate_id,
    ]),
    consumed_as_refs_only: true,
    source_patch_required: patchMode === 'source-patch',
    authority_boundary: {
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
    },
  };
}

function buildPrivateResidueDecision({
  targetAgent,
  workOrderId,
  patchMode,
  sourceMorphologyProofRef,
}: {
  targetAgent: TargetAgent;
  workOrderId: string;
  patchMode: string;
  sourceMorphologyProofRef: string;
}): JsonObject {
  const ref = `private-residue-decision:${targetAgent.domain_id}/${workOrderId}/${patchMode}/refs-only`;
  return {
    ref,
    decision: 'refs_only_no_private_residue_promotion',
    target_agent_id: targetAgent.domain_id,
    work_order_ref: workOrderId,
    source_morphology_proof_ref: sourceMorphologyProofRef,
    local_refs_may_be_retained_for_owner_consumption: true,
    private_residue_body_materialized: false,
    target_truth_write_authorized: false,
    target_artifact_mutation_authorized: false,
    owner_receipt_or_typed_blocker_body_authorized: false,
  };
}

export function buildDeveloperPatchWorkOrder({
  targetAgent,
  suite,
  suiteResult,
  foundryLabExecutionReceiptRef,
  capabilityCandidate,
  policy,
}: {
  targetAgent: TargetAgent;
  suite: JsonObject;
  suiteResult: SuiteResult;
  foundryLabExecutionReceiptRef: string;
  capabilityCandidate: CapabilityCandidate;
  policy: TargetImprovementPolicy;
}): JsonObject {
  const noPatchRequired = suiteResult.status === 'passed';
  const efficiencyNonRegressionRefs = capabilityCandidate.efficiency_non_regression_refs;
  const hasEfficiencyEvidence = hasEfficiencyNonRegressionEvidence(efficiencyNonRegressionRefs);
  const workOrderId = stableId('oma_developer_patch_work_order', [
    targetAgent.domain_id,
    suite.suite_id,
    suiteResult.result_id,
    capabilityCandidate.candidate_id,
  ]);
  const targetRepoFileHints = unique(capabilityCandidate.patch_traceability_matrix.flatMap((entry) =>
    entry.target_repo_file_hints
  ));
  const matchedCapabilityIds = unique(capabilityCandidate.patch_traceability_matrix.flatMap((entry) =>
    stringList(entry.capability_ids)
  ));
  const canonicalTargetPaths = unique(capabilityCandidate.patch_traceability_matrix.flatMap((entry) =>
    stringList(entry.canonical_target_paths)
  ));
  const failureTokenRegistryRefs = unique(capabilityCandidate.patch_traceability_matrix.flatMap((entry) =>
    stringList(entry.failure_token_registry_refs)
  ));
  const improvementTokens = unique(capabilityCandidate.patch_traceability_matrix.flatMap((entry) =>
    stringList(entry.improvement_tokens)
  ));
  const forbiddenTargetPathsOrSurfaces = unique([
    ...policy.forbiddenTargetPathsOrSurfaces,
    ...capabilityCandidate.patch_traceability_matrix.flatMap((entry) =>
      stringList(entry.forbidden_target_paths_or_surfaces)
    ),
  ]);
  const requiredVerificationRefs = unique((noPatchRequired
    ? [
        'target_owner_receipt_projection_ref',
        'no_target_domain_truth_write_proof',
      ]
    : unique(capabilityCandidate.patch_traceability_matrix.flatMap((entry) =>
        entry.required_verification_refs
      )).concat([
        'target_runtime_consumption_verification_receipt',
        'target_workspace_environment_consumption_receipt',
      ])).concat(stringList(efficiencyNonRegressionRefs.target_verification_refs)));
  const noForbiddenWriteProofRefs = noPatchRequired
    ? ['no_target_domain_truth_write_proof']
    : ['no_target_domain_truth_write_proof', 'repo_hygiene_no_checkout_venv_proof'];
  const failureEvidence = unique([
    ...capabilityCandidate.failure_taxonomy_refs,
    ...capabilityCandidate.ai_reviewer_evidence.source_refs,
    ...capabilityCandidate.ai_reviewer_evidence.direct_evidence_refs,
    ...capabilityCandidate.patch_traceability_matrix.flatMap((entry) => entry.failure_evidence),
  ]);
  const patchMode = noPatchRequired ? 'no-source-patch' : 'source-patch';
  const sourceMorphologyProof = buildSourceMorphologyProof({
    targetAgent,
    suite,
    suiteResult,
    workOrderId,
    capabilityCandidate,
    patchMode,
  });
  const privateResidueDecision = buildPrivateResidueDecision({
    targetAgent,
    workOrderId,
    patchMode,
    sourceMorphologyProofRef: String(sourceMorphologyProof.ref),
  });
  const reviewerPoolRefs = unique([
    String(capabilityCandidate.ai_reviewer_evaluation_ref),
    ...capabilityCandidate.ai_reviewer_evidence.source_refs,
    ...capabilityCandidate.ai_reviewer_evidence.direct_evidence_refs,
  ]);
  const machineCloseoutRefs = buildTargetPatchLoopMachineRefs({
    domainId: targetAgent.domain_id,
    suiteResultRef: suiteResult.result_id,
    workOrderId,
    requiredVerificationRefs,
    noForbiddenWriteProofRefs,
    patchMode,
    efficiencyNonRegressionRefs,
  });
  const bundleRefs = buildWorkOrderBundleRefs({
    domainId: targetAgent.domain_id,
    workOrderId,
    reviewerRefs: reviewerPoolRefs,
    machineCloseoutRefs,
  });
  const ownerRouteRef = `target-agent-owner:${capabilityCandidate.target_agent.domain_id}`;
  const substantiveDeliverableDeltaRefs = noPatchRequired
    ? []
    : capabilityCandidate.proposed_change_refs;
  const ownerRouteRefs = [
    ownerRouteRef,
    `promotion-gate:opl-meta-agent/${targetAgent.domain_id}/external-suite-self-evolution`,
  ];
  const agentEvolutionReadback = buildAgentEvolutionWorkOrderFields({
    domainId: targetAgent.domain_id,
    workOrderId,
    failureClass: 'quality-gate',
    ownerRouteRef,
    ownerRouteRefs,
    targetEditableSurfaceRefs: noPatchRequired ? [] : capabilityCandidate.target_editable_surface_refs,
    forbiddenSurfaces: forbiddenTargetPathsOrSurfaces,
    expectedChangeRefs: noPatchRequired ? ['owner_receipt_coordination_record'] : capabilityCandidate.proposed_change_refs,
    expectedBehaviorSummary: noPatchRequired
      ? 'Target owner consumes OMA coordination refs without a source patch.'
      : 'Target agent owner-gated source patch closes the Agent Lab and independent reviewer quality-gate gap.',
    verificationRefs: requiredVerificationRefs,
    targetCloseoutRefs: bundleRefs.target_closeout_refs as string[],
    ownerReceiptOrTypedBlockerRef: String(machineCloseoutRefs.target_owner_receipt_or_typed_blocker_ref),
    readModelConsumptionRef: String(machineCloseoutRefs.target_runtime_read_model_consumption_ref),
  });
  return {
    surface_kind: 'opl_meta_agent_developer_patch_work_order',
    version: 'opl-meta-agent.developer-patch-work-order.v1',
    work_order_id: workOrderId,
    status: noPatchRequired ? 'no_patch_required' : 'ready_for_target_agent_source_patch',
    product_id: 'opl-meta-agent',
    target_agent: capabilityCandidate.target_agent,
    source_agent_lab_result_ref: suiteResult.result_id,
    source_morphology_proof_ref: sourceMorphologyProof.ref,
    source_morphology_proof: sourceMorphologyProof,
    private_residue_decision_ref: privateResidueDecision.ref,
    private_residue_decision: privateResidueDecision,
    ...agentEvolutionReadback,
    work_order_currentness: buildWorkOrderCurrentness({
      domainId: targetAgent.domain_id,
      suiteResultRef: suiteResult.result_id,
      workOrderId,
      ownerRouteRef,
    }),
    target_capability_improvement_candidate_ref: capabilityCandidate.candidate_id,
    foundry_lab_execution_receipt_ref: foundryLabExecutionReceiptRef,
    ai_reviewer_evaluation_ref: capabilityCandidate.ai_reviewer_evaluation_ref,
    ai_reviewer_review: capabilityCandidate.ai_reviewer_review,
    ai_reviewer_independence: capabilityCandidate.ai_reviewer_independence,
    ai_reviewer_evidence: capabilityCandidate.ai_reviewer_evidence,
    ai_reviewer_scorecard: capabilityCandidate.ai_reviewer_scorecard,
    ai_reviewer_recovery_refs: capabilityCandidate.ai_reviewer_recovery_refs,
    review_provenance: capabilityCandidate.review_provenance,
    ...bundleRefs,
    work_order_completeness: buildRefsOnlyWorkOrderCompleteness({
      requiredFieldsPresent: true,
      executorLeaseRef: String(bundleRefs.executor_lease_ref),
      reviewerPoolRefs,
      patchExecutionBundleRef: String(bundleRefs.patch_execution_bundle_ref),
      targetCloseoutRefs: bundleRefs.target_closeout_refs as string[],
      reviewerRefs: reviewerPoolRefs,
      workOrderId,
      proposedChangeRefs: capabilityCandidate.proposed_change_refs,
      traceabilityStatus: noPatchRequired ? 'no_source_patch_required' : capabilityCandidate.traceability_status,
      requiredVerificationRefs,
      targetVerificationExtraRefs: [
        'target_owner_receipt_or_typed_blocker',
        noPatchRequired ? 'target_owner_receipt_projection_ref' : 'target_repo_test_receipt',
      ],
      ownerRouteRefs: [
        ...ownerRouteRefs,
        `target-owner-receipt-or-typed-blocker:${capabilityCandidate.target_agent.domain_id}/${workOrderId}`,
      ],
      noForbiddenWriteProofRefs,
      executorAllowedScope: noPatchRequired ? 'coordination_record_only' : 'target_agent_owner_gated_patch',
      executorAllowedWriteSurfaces: noPatchRequired ? [] : capabilityCandidate.target_editable_surface_refs,
      executorForbiddenWriteSurfaces: [
        'target_domain_truth',
        'target_domain_memory_body',
        'target_domain_artifact_body',
        'target_quality_or_export_verdict',
        'default_agent_promotion_without_gate',
      ],
      canaryRefs: [
        ...(capabilityCandidate.ai_reviewer_evaluation.canary_refs ?? []),
        `agent-lab-canary:${suiteResult.result_id}`,
      ],
      rollbackRefs: [
        ...(capabilityCandidate.ai_reviewer_evaluation.rollback_refs ?? []),
        ...noForbiddenWriteProofRefs,
        noPatchRequired ? 'owner_receipt_coordination_record' : 'target_agent_previous_head_ref',
      ],
      versionRefs: [
        ...(capabilityCandidate.ai_reviewer_evaluation.version_refs ?? []),
        noPatchRequired ? 'owner_receipt_coordination_record' : 'git_commit',
      ],
      failClosedBlockerRef:
        `typed-blocker:opl-meta-agent/${capabilityCandidate.target_agent.domain_id}/${workOrderId}/missing-required-work-order-field`,
      efficiencyNonRegressionRefs,
    }),
    required_opl_work_order_primitive_refs: buildOplWorkOrderPrimitiveRefs({
      domainId: targetAgent.domain_id,
      workOrderId,
      patchMode,
      promotionGateRef: `promotion-gate:opl-meta-agent/${targetAgent.domain_id}/external-suite-self-evolution`,
    }),
    ahe_developer_work_order: {
      failure_evidence: failureEvidence,
      root_cause: noPatchRequired
        ? 'Agent Lab result passed; remaining work is coordination and owner receipt projection proof.'
        : 'Agent Lab and independent AI reviewer evidence identify target-agent capability gaps that require owner-gated source changes.',
      targeted_fix: noPatchRequired
        ? ['owner_receipt_coordination_record']
        : capabilityCandidate.proposed_change_refs,
      predicted_impact: capabilityCandidate.ai_reviewer_review.predicted_impact,
    },
    failure_evidence_refs: failureEvidence,
    matched_capability_ids: matchedCapabilityIds,
    canonical_target_paths: noPatchRequired ? [] : canonicalTargetPaths,
    failure_token_registry_refs: failureTokenRegistryRefs,
    improvement_tokens: improvementTokens,
    target_progress_accounting: buildTargetProgressAccounting({
      substantiveDeliverableDeltaRefs,
      machineCloseoutRefs,
    }),
    required_patch_surfaces: noPatchRequired ? [] : capabilityCandidate.target_editable_surface_refs,
    allowed_editable_surfaces: noPatchRequired ? [] : capabilityCandidate.target_editable_surface_refs,
    target_repo_file_hints: noPatchRequired ? [] : targetRepoFileHints,
    required_verification_refs: requiredVerificationRefs,
    forbidden_target_paths_or_surfaces: forbiddenTargetPathsOrSurfaces,
    ...(hasEfficiencyEvidence ? { efficiency_non_regression_refs: efficiencyNonRegressionRefs } : {}),
    rollback_version_refs: noPatchRequired
      ? ['owner_receipt_coordination_record']
      : ['git_commit', 'target_agent_previous_head_ref', 'temporary_worktree_ref'],
    owner_route_refs: ownerRouteRefs,
    target_owner_closeout_refs: bundleRefs.target_closeout_refs,
    no_forbidden_write_proof: {
      required: true,
      proof_refs: noForbiddenWriteProofRefs,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
    },
    owner_closeout_boundary: {
      owner: 'target-domain via OPL',
      owner_closeout_hook_delegated: true,
      target_owner_receipt_or_typed_blocker_required: true,
      target_owner_closeout_refs: bundleRefs.target_closeout_refs,
      oma_can_write_target_owner_receipt_body: false,
      oma_can_write_target_owner_typed_blocker_body: false,
      oma_can_create_target_typed_blocker: false,
      oma_can_invoke_target_owner_closeout_hook: false,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
    },
    machine_closeout_refs: machineCloseoutRefs,
    proposed_change_refs: capabilityCandidate.proposed_change_refs,
    patch_traceability_matrix: noPatchRequired ? [] : capabilityCandidate.patch_traceability_matrix,
    implementation_controls: {
      coordination_record_only: noPatchRequired,
      source_patch_required: !noPatchRequired,
      patch_must_be_limited_to_traceable_surfaces: !noPatchRequired,
      developer_must_read_target_repo_context_before_editing: !noPatchRequired,
      developer_patch_receipt_required: !noPatchRequired,
      target_repo_test_receipt_required: !noPatchRequired,
      target_runtime_consumption_verification_required: !noPatchRequired,
      target_workspace_environment_consumption_proof_required: !noPatchRequired,
      dependency_lock_or_profile_migration_proof_required: !noPatchRequired,
      owner_entry_redrive_required: !noPatchRequired,
      repo_hygiene_no_checkout_venv_proof_required: !noPatchRequired,
      target_owner_receipt_projection_required: noPatchRequired,
      no_target_domain_truth_write_proof_required: true,
      no_quality_verdict_or_submission_readiness_authority: true,
      quality_floor_non_regression_required: hasEfficiencyEvidence,
      forbidden_target_paths_or_surfaces: forbiddenTargetPathsOrSurfaces,
      required_closeout_evidence: targetPatchLoopCloseoutEvidence({
        sourcePatchRequired: !noPatchRequired,
      }),
    },
    runtime_consumption_verification: buildRuntimeConsumptionVerification({
      requiredSurfaceRefs: policy.runtimeRequiredSurfaceRefs,
      expectedOutcomes: policy.runtimeExpectedOutcomes,
    }),
    target_workspace_environment_verification: buildTargetWorkspaceEnvironmentVerification(),
    version_management: {
      target_agent_version_owner: 'target_agent_repo',
      required_version_artifacts: noPatchRequired
        ? [
          'owner_receipt_coordination_record',
          'target_owner_receipt_projection_ref',
        ]
        : [
          'git_commit',
          'test_receipt',
          'runtime_consumption_verification_receipt',
          'workspace_environment_consumption_receipt',
          'developer_patch_receipt',
          'target_agent_status_or_decision_doc_update',
        ],
      absorb_back_required: !noPatchRequired,
      temporary_worktree_cleanup_required: !noPatchRequired,
    },
    authority_boundary: {
      can_modify_target_agent_source_repo: !noPatchRequired,
      can_modify_target_agent_tests: !noPatchRequired,
      can_modify_target_agent_docs: !noPatchRequired,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
      can_train_or_deploy_model_weights: false,
    },
  };
}
