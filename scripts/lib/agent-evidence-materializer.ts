import path from 'node:path';
import type { JsonObject } from './domain-pack.ts';
import {
  type AiReviewerEvaluation,
  aiReviewerReceiptFields,
  stableId,
} from './meta-agent-loop.ts';
import {
  DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES,
} from './work-order-policy-constants.ts';
import {
  buildOplAgentLabOwnedPrimitiveRefs,
  buildRefsOnlyWorkOrderCompleteness,
  buildRuntimeConsumptionVerification,
  buildTargetPatchLoopMachineRefs,
  buildTargetWorkspaceEnvironmentVerification,
  buildWorkOrderBundleRefs,
  targetPatchLoopCloseoutEvidence,
} from './work-order-builders.ts';
import {
  collectEfficiencyNonRegressionRefs,
  hasEfficiencyNonRegressionEvidence,
} from './work-order-efficiency.ts';
import {
  firstString,
  forbiddenWriteSurfaces,
  noForbiddenWriteProofRefs,
  ownerRouteRef,
  productionAcceptanceEvidenceRefs,
  records,
  refsFromEntries,
  refsFromRecord,
  requiredReturnShapes,
  stringList,
  stringValue,
  targetOwnerRoute,
  taskRequiredReturnShapeRefs,
  uniqueRefs,
  verificationRefs,
} from './work-order-refs.ts';

export type AgentContracts = {
  productionAcceptance: JsonObject;
  productionAcceptanceRef: string;
  agentLabHandoff: JsonObject;
  domainDescriptor: JsonObject;
  generatedSurfaceHandoff: JsonObject;
  ownerReceiptContract: JsonObject;
};

export type TargetAgentIdentity = {
  domainId: string;
  domainLabel: string;
  owner: string;
  generatedSurfaceOwner: string;
  targetAgentRef: string;
};

export const TARGET_AGENT_EDITABLE_SURFACES = [
  'agent/prompts',
  'agent/skills',
  'agent/knowledge',
  'agent/quality_gates',
  'contracts/agent_lab_handoff.json',
  'contracts/stage_control_plane.json',
  'contracts/owner_receipt_contract.json',
  'contracts/generated_surface_handoff.json',
  'contracts/functional_privatization_audit.json',
  'tests',
  'docs/status.md',
];

export const TARGET_AGENT_FORBIDDEN_WRITE_SURFACES = [
  ...DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES,
  'target export verdict',
  'target owner receipt body',
  'default agent promotion without gate',
];

function unique(values: string[]): string[] {
  return uniqueRefs(values);
}

function handoffTasks(agentLabHandoff: JsonObject): JsonObject[] {
  return records(agentLabHandoff.external_suite_seed?.tasks);
}

export function targetAgentIdentity(contracts: AgentContracts, agentRepo: string): TargetAgentIdentity {
  const domainId = firstString([
    contracts.domainDescriptor.domain_id,
    contracts.productionAcceptance.domain_id,
    contracts.agentLabHandoff.domain_id,
  ], path.basename(agentRepo));
  const domainLabel = firstString([
    contracts.domainDescriptor.domain_label,
    contracts.productionAcceptance.domain_label,
    contracts.agentLabHandoff.domain_label,
  ], domainId);
  const owner = firstString([
    contracts.productionAcceptance.owner,
    contracts.agentLabHandoff.owner,
    contracts.domainDescriptor.owner,
  ], domainId);
  const generatedSurfaceOwner = firstString([
    contracts.domainDescriptor.generated_surface_owner,
    contracts.generatedSurfaceHandoff.generated_surface_owner,
  ], 'one-person-lab');
  return {
    domainId,
    domainLabel,
    owner,
    generatedSurfaceOwner,
    targetAgentRef: `target-agent:${domainId}`,
  };
}

export function sourceContractRefs(contracts: AgentContracts): string[] {
  return [
    contracts.productionAcceptanceRef,
    'contracts/agent_lab_handoff.json',
    'contracts/domain_descriptor.json',
    'contracts/generated_surface_handoff.json',
    'contracts/owner_receipt_contract.json',
  ];
}

export function productionEvidenceGate(contracts: AgentContracts, targetAgent: TargetAgentIdentity): JsonObject {
  const tasks = handoffTasks(contracts.agentLabHandoff);
  const handoffGateIds = tasks
    .map((task) => stringValue(task.gate_id))
    .filter((gateId): gateId is string => Boolean(gateId));
  const routeRefs = unique(
    tasks.map((task) => ownerRouteRef(task.owner_route, targetAgent)).filter((ref): ref is string => Boolean(ref)),
  );
  const evidenceRefs = productionAcceptanceEvidenceRefs(contracts.productionAcceptance);
  const returnShapeRefs = taskRequiredReturnShapeRefs(tasks, targetAgent);
  return {
    surface_kind: 'production_evidence_gate_refs',
    target_agent_ref: targetAgent.targetAgentRef,
    gate_ids: handoffGateIds.length > 0
      ? handoffGateIds
      : [
          'production_acceptance_contract_read',
          'agent_lab_handoff_suite_generation',
          'owner_receipt_or_typed_blocker_route',
          'no_forbidden_write_verification',
        ],
    owner_route_refs: routeRefs.length > 0
      ? routeRefs
      : [`owner-route:${targetAgent.domainId}/${targetAgent.owner}`],
    no_forbidden_write_proof_refs: noForbiddenWriteProofRefs(contracts, targetAgent),
    typed_blocker_refs: unique([
      ...refsFromEntries(contracts.productionAcceptance.domain_acceptance_receipt?.typed_blocker_refs),
      `typed-blocker-ref:${targetAgent.domainId}/production-evidence-tail/owner-receipt-required`,
    ]),
    required_return_shapes: requiredReturnShapes(contracts),
    required_owner_receipt_refs: evidenceRefs.length > 0 || returnShapeRefs.length > 0
      ? unique([...evidenceRefs, ...returnShapeRefs])
      : [`required-owner-receipt-ref:${targetAgent.domainId}/production-evidence-tail`],
    gate_result_refs: [`gate-result-ref:opl-agent-lab/${targetAgent.domainId}/production-evidence-tail`],
    domain_verdict_claimed: false,
    source_handoff_ref: 'contracts/agent_lab_handoff.json',
  };
}

export function buildOwnerReceiptRefs(contracts: AgentContracts, targetAgent: TargetAgentIdentity): JsonObject {
  return {
    surface_kind: 'opl_meta_agent_target_owner_receipt_refs',
    version: 'opl-meta-agent.target-owner-receipt-refs.v1',
    status: 'refs_only_no_owner_receipt_signed_by_meta_agent',
    target_agent_ref: targetAgent.targetAgentRef,
    owner: targetAgent.owner,
    receipt_refs: productionAcceptanceEvidenceRefs(contracts.productionAcceptance),
    required_return_shapes: requiredReturnShapes(contracts),
    target_owner_route: targetOwnerRoute(contracts),
  };
}

export function buildCapabilityCandidate({
  contracts,
  suite,
  suiteResult,
  aiReviewerEvaluation,
  aiReviewerEvaluationPath,
  targetAgent,
}: {
  contracts: AgentContracts;
  suite: JsonObject;
  suiteResult: JsonObject;
  aiReviewerEvaluation: AiReviewerEvaluation | null;
  aiReviewerEvaluationPath: string | null;
  targetAgent: TargetAgentIdentity;
}): JsonObject {
  const sharedBlockers =
    contracts.productionAcceptance.codex_first_landing_program?.parallel_execution_model?.shared_blockers ?? [];
  const noForbiddenRefs = noForbiddenWriteProofRefs(contracts, targetAgent);
  const efficiencyNonRegressionRefs = collectEfficiencyNonRegressionRefs(
    contracts.productionAcceptance,
    contracts.agentLabHandoff,
    suite,
    aiReviewerEvaluation,
  );
  return {
    surface_kind: 'opl_meta_agent_target_capability_improvement_candidate',
    version: 'opl-meta-agent.target-capability-improvement-candidate.v1',
    candidate_id: stableId('oma_agent_capability_candidate', [suite.suite_id, suiteResult.result_id, sharedBlockers]),
    status: aiReviewerEvaluation
      ? 'candidate_recorded_requires_target_owner_gate'
      : 'blocked_missing_ai_reviewer_evaluation',
    target_agent: {
      domain_id: targetAgent.domainId,
      domain_label: targetAgent.domainLabel,
      owner: targetAgent.owner,
      generated_surface_owner: targetAgent.generatedSurfaceOwner,
      target_agent_ref: targetAgent.targetAgentRef,
    },
    source_agent_lab_suite: {
      suite_id: suite.suite_id,
      result_id: suiteResult.result_id,
      result_status: suiteResult.status,
    },
    source_contract_refs: suite.source_contract_refs,
    target_owner_route: targetOwnerRoute(contracts),
    proposed_change_refs: [
      `agent:evidence-tail/${targetAgent.domainId}/no-active-caller-proof`,
      `agent:evidence-tail/${targetAgent.domainId}/opl-generated-surface-parity`,
      `agent:evidence-tail/${targetAgent.domainId}/domain-receipt-parity`,
      `agent:evidence-tail/${targetAgent.domainId}/independent-reviewer-auditor-receipt`,
      `agent:evidence-tail/${targetAgent.domainId}/no-forbidden-write-proof`,
    ],
    editable_surface_limits: {
      editable_surfaces: TARGET_AGENT_EDITABLE_SURFACES,
      forbidden_write_surfaces: forbiddenWriteSurfaces(contracts, TARGET_AGENT_FORBIDDEN_WRITE_SURFACES),
      proposal_only: true,
      refs_only: true,
    },
    no_forbidden_write: {
      required: true,
      proof_refs: noForbiddenRefs,
      can_write_target_domain_truth: false,
      can_write_target_memory_body: false,
      can_mutate_target_artifact_body: false,
      can_authorize_target_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
    },
    efficiency_non_regression_refs: efficiencyNonRegressionRefs,
    verification_command_refs: verificationRefs(contracts.productionAcceptance),
    ai_reviewer_evaluation_ref: aiReviewerEvaluationPath,
    ai_reviewer_status: aiReviewerEvaluation ? 'present' : 'missing_typed_blocker_required',
    ...(aiReviewerEvaluation && aiReviewerEvaluationPath
      ? aiReviewerReceiptFields(aiReviewerEvaluation, aiReviewerEvaluationPath)
      : {}),
  };
}

export function buildDeveloperWorkOrder({
  contracts,
  suite,
  suiteResult,
  capabilityCandidate,
  ownerReceiptRefsPath,
  targetAgent,
}: {
  contracts: AgentContracts;
  suite: JsonObject;
  suiteResult: JsonObject;
  capabilityCandidate: JsonObject;
  ownerReceiptRefsPath: string;
  targetAgent: TargetAgentIdentity;
}): JsonObject {
  const verificationCommandRefs = verificationRefs(contracts.productionAcceptance);
  const efficiencyNonRegressionRefs = capabilityCandidate.efficiency_non_regression_refs;
  const hasEfficiencyEvidence = hasEfficiencyNonRegressionEvidence(efficiencyNonRegressionRefs);
  const requiredVerificationRefs = unique([
    ...verificationCommandRefs,
    ...stringList(efficiencyNonRegressionRefs.target_verification_refs),
  ]);
  const workOrderId = stableId('oma_agent_developer_work_order', [
    suite.suite_id,
    suiteResult.result_id,
    capabilityCandidate.candidate_id,
  ]);
  const sourceFailureRefs = unique([
    ...productionAcceptanceEvidenceRefs(contracts.productionAcceptance),
    ...verificationCommandRefs,
    ...refsFromRecord(contracts.productionAcceptance.codex_first_landing_program?.parallel_execution_model?.shared_blockers),
  ]);
  const reviewerEvidenceRefs = capabilityCandidate.ai_reviewer_evidence
    ? unique([
        ...stringList(capabilityCandidate.ai_reviewer_evidence.source_refs),
        ...stringList(capabilityCandidate.ai_reviewer_evidence.direct_evidence_refs),
      ])
    : [];
  const noForbiddenRefs = stringList(capabilityCandidate.no_forbidden_write?.proof_refs);
  const reviewerPresent = capabilityCandidate.ai_reviewer_status === 'present';
  const recoveryRefs = capabilityCandidate.ai_reviewer_recovery_refs ?? {};
  const reviewerPoolRefs = reviewerPresent
    ? unique([
        String(capabilityCandidate.ai_reviewer_evaluation_ref),
        ...stringList(capabilityCandidate.ai_reviewer_evidence?.source_refs),
        ...stringList(capabilityCandidate.ai_reviewer_evidence?.direct_evidence_refs),
      ])
    : [];
  const machineCloseoutRefs = buildTargetPatchLoopMachineRefs({
    domainId: targetAgent.domainId,
    suiteResultRef: stringValue(suiteResult.result_id) ?? stableId('agent_lab_result', [workOrderId]),
    workOrderId,
    requiredVerificationRefs,
    noForbiddenWriteProofRefs: noForbiddenRefs,
    efficiencyNonRegressionRefs,
  });
  const bundleRefs = buildWorkOrderBundleRefs({
    domainId: targetAgent.domainId,
    workOrderId,
    reviewerRefs: reviewerPoolRefs,
    machineCloseoutRefs,
  });
  return {
    surface_kind: 'opl_meta_agent_target_developer_patch_work_order',
    version: 'opl-meta-agent.target-developer-patch-work-order.v1',
    work_order_id: workOrderId,
    status: capabilityCandidate.ai_reviewer_status === 'present'
      ? 'ready_for_target_agent_source_patch_proposal'
      : 'blocked_missing_ai_reviewer_evaluation',
    target_agent: capabilityCandidate.target_agent,
    source_agent_lab_result_ref: suiteResult.result_id,
    target_capability_improvement_candidate_ref: capabilityCandidate.candidate_id,
    owner_receipt_refs_ref: ownerReceiptRefsPath,
    target_owner_route: capabilityCandidate.target_owner_route,
    editable_surface_limits: capabilityCandidate.editable_surface_limits,
    allowed_editable_surfaces: capabilityCandidate.editable_surface_limits.editable_surfaces,
    target_repo_file_hints: capabilityCandidate.editable_surface_limits.editable_surfaces,
    required_verification_refs: requiredVerificationRefs,
    rollback_version_refs: [
      'target_agent_current_head_ref',
      'developer_patch_branch_or_worktree_ref',
      'owner_receipt_or_typed_blocker_version_ref',
    ],
    owner_route_refs: productionEvidenceGate(contracts, targetAgent).owner_route_refs,
    proposed_change_refs: capabilityCandidate.proposed_change_refs,
    ai_reviewer_evaluation_ref: capabilityCandidate.ai_reviewer_evaluation_ref,
    ai_reviewer_status: capabilityCandidate.ai_reviewer_status,
    ...(capabilityCandidate.ai_reviewer_status === 'present'
      ? {
          ai_reviewer_review: capabilityCandidate.ai_reviewer_review,
          ai_reviewer_independence: capabilityCandidate.ai_reviewer_independence,
          ai_reviewer_evidence: capabilityCandidate.ai_reviewer_evidence,
          ai_reviewer_scorecard: capabilityCandidate.ai_reviewer_scorecard,
          ai_reviewer_recovery_refs: capabilityCandidate.ai_reviewer_recovery_refs,
          review_provenance: capabilityCandidate.review_provenance,
        }
      : {}),
    ...bundleRefs,
    work_order_completeness: buildRefsOnlyWorkOrderCompleteness({
      requiredFieldsPresent: reviewerPresent,
      missingRequiredFields: [
        'ai_reviewer_evaluation_ref',
        'ai_reviewer_review',
        'ai_reviewer_independence',
        'ai_reviewer_evidence.source_refs',
        'ai_reviewer_evidence.direct_evidence_refs',
        'ai_reviewer_scorecard.verdict',
        'review_provenance',
      ],
      executorLeaseRef: String(bundleRefs.executor_lease_ref),
      reviewerPoolRefs,
      patchExecutionBundleRef: String(bundleRefs.patch_execution_bundle_ref),
      targetCloseoutRefs: bundleRefs.target_closeout_refs as string[],
      reviewerRefs: reviewerPoolRefs,
      workOrderId,
      proposedChangeRefs: stringList(capabilityCandidate.proposed_change_refs),
      traceabilityStatus: reviewerPresent
        ? 'reviewer_refs_to_agent_evidence_tail_refs_mapped'
        : 'blocked_missing_reviewer_refs',
      requiredVerificationRefs,
      targetVerificationExtraRefs: [
        'target_owner_receipt_or_typed_blocker',
        'no_forbidden_write_proof',
      ],
      ownerRouteRefs: [`owner-route:${targetAgent.domainId}/${targetAgent.owner}`],
      noForbiddenWriteProofRefs: noForbiddenRefs,
      executorAllowedScope: 'refs_only_target_agent_owner_gated_patch_proposal',
      executorAllowedWriteSurfaces: TARGET_AGENT_EDITABLE_SURFACES,
      executorForbiddenWriteSurfaces: stringList(capabilityCandidate.editable_surface_limits?.forbidden_write_surfaces)
        .length
        ? stringList(capabilityCandidate.editable_surface_limits?.forbidden_write_surfaces)
        : TARGET_AGENT_FORBIDDEN_WRITE_SURFACES,
      canaryRefs: [
        ...stringList(recoveryRefs.canary_refs),
        `agent-lab-canary:${targetAgent.domainId}/production-evidence-tail`,
      ],
      rollbackRefs: [
        ...stringList(recoveryRefs.rollback_refs),
        'target_agent_current_head_ref',
        'developer_patch_branch_or_worktree_ref',
      ],
      versionRefs: [
        ...stringList(recoveryRefs.version_refs),
        'target_agent_current_head_ref',
        'developer_patch_branch_or_worktree_ref',
        'owner_receipt_or_typed_blocker_version_ref',
      ],
      failClosedBlockerRef:
        `typed-blocker:opl-meta-agent/${targetAgent.domainId}/${workOrderId}/missing-required-work-order-field`,
      authorityFieldNames: {
        memoryWriteField: 'can_write_target_memory_body',
      },
      efficiencyNonRegressionRefs,
    }),
    required_opl_agent_lab_primitive_refs: buildOplAgentLabOwnedPrimitiveRefs({
      domainId: targetAgent.domainId,
      workOrderId,
      promotionGateRef: `promotion-gate:${targetAgent.domainId}/production-evidence-tail/owner-gated`,
    }),
    ahe_developer_work_order: {
      failure_evidence: unique([...sourceFailureRefs, ...reviewerEvidenceRefs]),
      root_cause: capabilityCandidate.ai_reviewer_status === 'present'
        ? 'Production evidence tail lacks target-owner-gated proof refs required for domain-ready promotion.'
        : 'Structured independent AI reviewer evaluation is missing, so the work order cannot authorize a mechanism patch proposal.',
      targeted_fix: capabilityCandidate.proposed_change_refs,
      predicted_impact: capabilityCandidate.ai_reviewer_status === 'present'
        ? capabilityCandidate.ai_reviewer_review.predicted_impact
        : 'Blocks delivery receipt and preserves target owner authority until reviewer evidence is supplied.',
    },
    implementation_controls: {
      proposal_only: true,
      refs_only: true,
      patch_must_be_limited_to_editable_surfaces: true,
      developer_must_read_target_agent_repo_context_before_editing: true,
      target_owner_receipt_or_typed_blocker_required: true,
      independent_reviewer_or_auditor_receipt_required: true,
      no_forbidden_write_proof_required: true,
      quality_floor_non_regression_required: hasEfficiencyEvidence,
      verification_command_refs_required: true,
      forbidden_write_surfaces: forbiddenWriteSurfaces(contracts, TARGET_AGENT_FORBIDDEN_WRITE_SURFACES),
      required_closeout_evidence: targetPatchLoopCloseoutEvidence({
        sourcePatchRequired: capabilityCandidate.ai_reviewer_status === 'present',
      }),
    },
    runtime_consumption_verification: buildRuntimeConsumptionVerification(),
    target_workspace_environment_verification: buildTargetWorkspaceEnvironmentVerification(),
    no_forbidden_write: capabilityCandidate.no_forbidden_write,
    no_forbidden_write_proof: capabilityCandidate.no_forbidden_write,
    ...(hasEfficiencyEvidence ? { efficiency_non_regression_refs: efficiencyNonRegressionRefs } : {}),
    machine_closeout_refs: machineCloseoutRefs,
    verification_command_refs: requiredVerificationRefs,
    authority_boundary: {
      can_modify_target_agent_source_repo: reviewerPresent,
      can_modify_target_agent_tests: reviewerPresent,
      can_modify_target_agent_docs: reviewerPresent,
      can_write_target_domain_truth: false,
      can_write_target_memory_body: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
    },
  };
}

export function buildMechanismPatchProposal({
  suite,
  suiteResult,
  capabilityCandidate,
  workOrder,
  ownerReceiptRefsPath,
  targetAgent,
}: {
  suite: JsonObject;
  suiteResult: JsonObject;
  capabilityCandidate: JsonObject;
  workOrder: JsonObject;
  ownerReceiptRefsPath: string;
  targetAgent: TargetAgentIdentity;
}): JsonObject {
  return {
    surface_kind: 'opl_meta_agent_mechanism_patch_proposal',
    version: 'opl-meta-agent.mechanism-patch-proposal.v1',
    proposal_id: stableId('oma_agent_mechanism_patch', [
      suite.suite_id,
      suiteResult.result_id,
      capabilityCandidate.candidate_id,
      workOrder.work_order_id,
    ]),
    status: 'proposal_recorded_requires_target_owner_gate',
    mechanism_ref: `mechanism:opl-meta-agent/${targetAgent.domainId}/production-evidence-tail/testing-takeover`,
    editable_surfaces: [
      'target_agent_pack_refs',
      'target_owner_receipt_refs',
      'target_no_forbidden_write_proof_refs',
      'target_test_refs',
      'target_status_doc_refs',
    ],
    observe: {
      segment_run_ref: suiteResult.result_id,
      source_refs: [
        suite.suite_id,
        ownerReceiptRefsPath,
        capabilityCandidate.candidate_id,
        workOrder.work_order_id,
      ],
    },
    diagnose: {
      evidence_delta_ref: `evidence-delta:${targetAgent.domainId}/production-evidence-tail/testing-takeover`,
      source_refs: capabilityCandidate.proposed_change_refs,
    },
    edit: {
      next_mechanism_candidate_ref: capabilityCandidate.candidate_id,
      proposed_change_refs: capabilityCandidate.proposed_change_refs,
      editable_surfaces: capabilityCandidate.editable_surface_limits.editable_surfaces,
      source_refs: [workOrder.work_order_id],
    },
    promotion_gate_ref: `promotion-gate:${targetAgent.domainId}/production-evidence-tail/owner-gated`,
    authority_boundary: {
      proposal_only: true,
      refs_only: true,
      can_write_target_domain_truth: false,
      can_write_target_memory_body: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
    },
  };
}

export function buildTypedBlocker({
  contracts,
  suite,
  suiteResult,
  workOrder,
  status = 'blocked_missing_ai_reviewer_evaluation',
  blockedReason = 'independent_ai_reviewer_attempt_required_before_mechanism_patch_proposal_or_delivery_receipt',
  missingRequiredFields = [],
}: {
  contracts: AgentContracts;
  suite: JsonObject;
  suiteResult: JsonObject;
  workOrder: JsonObject;
  status?: string;
  blockedReason?: string;
  missingRequiredFields?: string[];
}): JsonObject {
  return {
    surface_kind: 'opl_meta_agent_agent_evidence_takeover_typed_blocker',
    version: 'opl-meta-agent.agent-evidence-takeover-typed-blocker.v1',
    blocker_id: stableId('oma_agent_evidence_blocker', [suite.suite_id, suiteResult.result_id, workOrder.work_order_id]),
    status,
    blocked_reason: blockedReason,
    next_owner: 'opl-meta-agent',
    target_owner_route: targetOwnerRoute(contracts),
    blocked_suite_result_ref: workOrder.source_agent_lab_result_ref,
    work_order_ref: workOrder.work_order_id,
    required_input_refs: ['--ai-reviewer-evaluation <json>'],
    required_source_refs: [
      contracts.productionAcceptanceRef,
      'contracts/agent_lab_handoff.json',
      'contracts/generated_surface_handoff.json',
      'contracts/owner_receipt_contract.json',
    ],
    required_verification_refs: workOrder.required_verification_refs,
    missing_required_fields: missingRequiredFields,
    rollback_version_refs: workOrder.rollback_version_refs,
    owner_route_refs: workOrder.owner_route_refs,
    ahe_developer_work_order: workOrder.ahe_developer_work_order,
    machine_closeout_refs: workOrder.machine_closeout_refs,
    required_opl_agent_lab_primitive_refs: workOrder.required_opl_agent_lab_primitive_refs,
    required_ai_reviewer_independence_fields: [
      'no_shared_context=true',
      'independent_attempt=true',
      'direct_evidence_refs[]',
      'execution_attempt_ref',
      'review_attempt_ref',
      'execution_attempt_ref != review_attempt_ref',
    ],
    no_forbidden_write: workOrder.no_forbidden_write,
    no_forbidden_write_proof: workOrder.no_forbidden_write,
    ...(workOrder.efficiency_non_regression_refs
      ? { efficiency_non_regression_refs: workOrder.efficiency_non_regression_refs }
      : {}),
    work_order_completeness: workOrder.work_order_completeness,
    verification_command_refs: verificationRefs(contracts.productionAcceptance),
    authority_boundary: {
      typed_blocker_only: true,
      no_delivery_receipt_signed: true,
      no_executable_work_order_issued: true,
      can_write_target_domain_truth: false,
      can_authorize_target_quality_or_export: false,
      can_mutate_target_artifact_body: false,
      can_write_target_memory_body: false,
      can_promote_default_agent_without_gate: false,
    },
  };
}
