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
  hasEfficiencyNonRegressionEvidence,
  type EfficiencyNonRegressionRefs,
} from './work-order-efficiency.ts';
import {
  buildWorkOrderMaterializationRequest,
} from './work-order-materialization-request.ts';

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
  suite_id: string;
  status: string;
  evaluation_target_agent: {
    domain_id: string;
    target_agent_ref: string;
    descriptor_ref: string;
  };
  refs: JsonObject & {
    evaluation_provenance_refs: string[];
  };
  evaluation_provenance_bindings: JsonObject[];
  runs: JsonObject[];
  foundry_lab_execution_receipt_ref?: string;
};

function unique(values: unknown[]): string[] {
  return [...new Set(values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean))];
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? unique(value) : [];
}

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

export type DeveloperPatchMaterialization = {
  materializationRequest: JsonObject;
  agentBuildingEvidence: JsonObject;
};

export type SelfEvolutionReEvaluationPreparation = {
  preparedSuite: JsonObject;
  preparationReceipt: JsonObject;
};

function object(value: unknown, field: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Self-evolution closeout requires ${field} as an object.`);
  }
  return value as JsonObject;
}

function required(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Self-evolution closeout requires ${field}.`);
  }
  return value.trim();
}

export function prepareSelfEvolutionReEvaluation({
  suite,
  executionReceipt,
  targetPolicy,
  sourceSuiteRef,
  sourceExecutionReceiptRef,
  targetPolicyRef,
}: {
  suite: JsonObject;
  executionReceipt: JsonObject;
  targetPolicy: JsonObject;
  sourceSuiteRef: string;
  sourceExecutionReceiptRef: string;
  targetPolicyRef: string;
}): SelfEvolutionReEvaluationPreparation {
  const tasks = Array.isArray(suite.tasks) ? suite.tasks.map((task, index) =>
    object(task, `suite.tasks[${index}]`)) : [];
  if (tasks.length === 0) {
    throw new Error('Self-evolution re-evaluation requires at least one suite task.');
  }
  const taskIds = tasks.map((task, index) =>
    required(task.task_id, `suite.tasks[${index}].task_id`));
  const executionTarget = object(executionReceipt.target_agent, 'execution_receipt.target_agent');
  const explicitTarget = suite.evaluation_target_agent === undefined
    ? null
    : object(suite.evaluation_target_agent, 'suite.evaluation_target_agent');
  const feedbackTrigger = suite.feedback_self_evolution_trigger === undefined
    ? null
    : object(suite.feedback_self_evolution_trigger, 'suite.feedback_self_evolution_trigger');
  const suiteTargetDomain = explicitTarget
    ? required(explicitTarget.domain_id, 'suite.evaluation_target_agent.domain_id')
    : required(
      feedbackTrigger?.target_agent_id,
      'suite.feedback_self_evolution_trigger.target_agent_id',
    );
  const executionTargetDomain = required(
    executionTarget.domain_id,
    'execution_receipt.target_agent.domain_id',
  );
  if (suiteTargetDomain !== executionTargetDomain) {
    throw new Error('Self-evolution suite target does not match the execution receipt target.');
  }
  const allowedDomains = strings(targetPolicy.target_domain_ids);
  if (!allowedDomains.includes(suiteTargetDomain)) {
    throw new Error('Self-evolution target policy does not match the suite target domain.');
  }
  if (executionReceipt.status !== 'executed_absorbed_and_cleaned') {
    throw new Error('Self-evolution re-evaluation requires an absorbed and cleaned execution receipt.');
  }
  const absorption = object(executionReceipt.absorption, 'execution_receipt.absorption');
  if (absorption.absorbed !== true || !required(absorption.absorbed_head, 'execution_receipt.absorption.absorbed_head')) {
    throw new Error('Self-evolution re-evaluation requires patch absorption evidence.');
  }
  const verification = object(executionReceipt.verification, 'execution_receipt.verification');
  if (verification.all_passed !== true) {
    throw new Error('Self-evolution re-evaluation requires passing target verification.');
  }
  const cleanup = object(executionReceipt.cleanup, 'execution_receipt.cleanup');
  if (cleanup.worktree_removed !== true || cleanup.branch_removed !== true) {
    throw new Error('Self-evolution re-evaluation requires completed worktree cleanup.');
  }
  const stageProjection = object(
    targetPolicy.stage_completion_policy_projection,
    'target_policy.stage_completion_policy_projection',
  );
  const stagePolicy = object(stageProjection.policy, 'target_policy.stage_completion_policy_projection.policy');
  const promotionPolicy = object(
    targetPolicy.mechanism_promotion_gate,
    'target_policy.mechanism_promotion_gate',
  );
  if (promotionPolicy.risk_tier !== 'high_risk'
    || promotionPolicy.allowed_change_scope !== 'manual_review_required'
    || promotionPolicy.automatic_mechanism_promotion_ready !== false) {
    throw new Error('Self-evolution mechanism policy must remain high-risk and owner-gated.');
  }
  const noForbiddenWrite = object(
    executionReceipt.no_forbidden_write_proof,
    'execution_receipt.no_forbidden_write_proof',
  );
  const forbiddenWriteFlags = [
    'can_write_target_domain_truth',
    'can_write_target_domain_memory_body',
    'can_mutate_target_domain_artifact_body',
    'can_authorize_target_domain_quality_or_export',
  ];
  if (forbiddenWriteFlags.some((field) => noForbiddenWrite[field] !== false)) {
    throw new Error('Self-evolution re-evaluation requires a valid no-forbidden-write proof.');
  }
  const proofRefs = strings(noForbiddenWrite.proof_refs);
  const sourceRefs = unique([
    sourceSuiteRef,
    sourceExecutionReceiptRef,
    targetPolicyRef,
    required(stageProjection.source_ref, 'target_policy.stage_completion_policy_projection.source_ref'),
    `git-commit:${required(absorption.absorbed_head, 'execution_receipt.absorption.absorbed_head')}`,
  ]);
  const preparedTasks = tasks.map((task) => {
    const scorecard = structuredClone(object(task.scorecard, 'suite.tasks[].scorecard'));
    const sourcePromotionGate = object(task.promotion_gate, 'suite.tasks[].promotion_gate');
    const improvementCandidate = object(
      task.improvement_candidate,
      'suite.tasks[].improvement_candidate',
    );
    return {
      ...structuredClone(task),
      scorecard,
      stage_completion_policy: structuredClone(stagePolicy),
      improvement_candidate: {
        ...structuredClone(improvementCandidate),
        allowed_change_scope: 'manual_review_required',
        promotion_gate_ref: required(
          promotionPolicy.gate_ref,
          'target_policy.mechanism_promotion_gate.gate_ref',
        ),
      },
      promotion_gate: {
        gate_ref: required(
          promotionPolicy.gate_ref,
          'target_policy.mechanism_promotion_gate.gate_ref',
        ),
        gate_status: required(
          promotionPolicy.gate_status_after_absorbed_verified_patch,
          'target_policy.mechanism_promotion_gate.gate_status_after_absorbed_verified_patch',
        ),
        risk_tier: 'high_risk',
        required_refs: sourceRefs,
        regression_suite_refs: strings(promotionPolicy.regression_suite_refs),
        no_forbidden_write_proof_refs: unique([
          ...strings(promotionPolicy.no_forbidden_write_proof_refs),
          ...proofRefs,
        ]),
        failure_delta_refs: strings(promotionPolicy.failure_delta_refs),
        owner_or_human_gate_refs: strings(promotionPolicy.owner_or_human_gate_refs),
        advisory_only_refs: unique([
          required(scorecard.scorecard_ref, 'suite.tasks[].scorecard.scorecard_ref'),
          required(sourcePromotionGate.gate_ref, 'suite.tasks[].promotion_gate.gate_ref'),
        ]),
        authority_boundary: {
          can_write_domain_truth: false,
          can_write_memory_body: false,
          can_authorize_quality_verdict: false,
          can_authorize_publication_or_submission: false,
          can_promote_default_agent_without_gate: false,
        },
      },
    };
  });
  const preparationId = stableId('oma_self_evolution_reevaluation', {
    suite_id: suite.suite_id,
    task_ids: taskIds,
    source_execution_receipt_ref: sourceExecutionReceiptRef,
    absorbed_head: absorption.absorbed_head,
    target_policy_ref: targetPolicyRef,
  });
  const preparedSuite: JsonObject = {
    ...structuredClone(suite),
    tasks: preparedTasks,
    self_evolution_re_evaluation_context: {
      surface_kind: 'oma_self_evolution_re_evaluation_context',
      version: 'oma-self-evolution-re-evaluation.v1',
      preparation_ref: preparationId,
      scope: 'target_agent_mechanism_only',
      source_suite_ref: sourceSuiteRef,
      source_execution_receipt_ref: sourceExecutionReceiptRef,
      target_policy_ref: targetPolicyRef,
      target_agent_domain_id: suiteTargetDomain,
      target_agent_binding_source: explicitTarget
        ? 'suite.evaluation_target_agent'
        : 'suite.feedback_self_evolution_trigger+execution_receipt.target_agent',
      source_domain_scorecard_refs: tasks.map((task) =>
        required(object(task.scorecard, 'suite.tasks[].scorecard').scorecard_ref, 'suite.tasks[].scorecard.scorecard_ref')),
      source_domain_promotion_gate_refs: tasks.map((task) =>
        required(object(task.promotion_gate, 'suite.tasks[].promotion_gate').gate_ref, 'suite.tasks[].promotion_gate.gate_ref')),
      domain_scorecards_preserved: true,
      automatic_mechanism_promotion_ready: false,
      authorizes_publication_or_submission: false,
    },
  };
  return {
    preparedSuite,
    preparationReceipt: {
      surface_kind: 'oma_self_evolution_re_evaluation_preparation',
      version: 'oma-self-evolution-re-evaluation.v1',
      status: 'ready_for_opl_agent_lab_re_evaluation',
      preparation_ref: preparationId,
      suite_id: suite.suite_id,
      task_ids: taskIds,
      target_agent_domain_id: suiteTargetDomain,
      source_refs: sourceRefs,
      stage_completion_policy_ref: stagePolicy.policy_ref,
      mechanism_promotion_gate_ref: promotionPolicy.gate_ref,
      domain_scorecard_preserved: true,
      automatic_mechanism_promotion_ready: false,
      authorizes_publication_or_submission: false,
      authority_boundary: {
        oma_executes_agent_lab: false,
        oma_writes_target_owner_answer: false,
        oma_changes_domain_scorecard: false,
      },
    },
  };
}

export function buildSelfEvolutionOwnerCloseoutReplayDraft({
  executionReceipt,
  sourceExecutionReceiptRef,
  sourceExecutionReceiptSha256,
  preparedSuiteRef,
  suiteResult,
}: {
  executionReceipt: JsonObject;
  sourceExecutionReceiptRef: string;
  sourceExecutionReceiptSha256: string;
  preparedSuiteRef: string;
  suiteResult: JsonObject;
}): JsonObject {
  return {
    surface_kind: 'oma_target_owner_closeout_replay_draft',
    version: 'oma-target-owner-closeout-replay.v1',
    status: executionReceipt.status,
    work_order_id: executionReceipt.work_order_id,
    target_agent: executionReceipt.target_agent,
    source_execution_receipt_ref: sourceExecutionReceiptRef,
    source_execution_receipt_sha256: sourceExecutionReceiptSha256,
    patch: executionReceipt.patch,
    verification: executionReceipt.verification,
    absorption: executionReceipt.absorption,
    cleanup: executionReceipt.cleanup,
    no_forbidden_write_proof: executionReceipt.no_forbidden_write_proof,
    agent_lab_re_evaluation: {
      suite_path: preparedSuiteRef,
      suite_result: suiteResult,
    },
    replay_boundary: {
      is_opl_execution_receipt: false,
      oma_writes_target_owner_answer: false,
      target_owner_command_owner: 'med-autoscience',
    },
  };
}

export function consumeSelfEvolutionOwnerCloseout(response: JsonObject): JsonObject {
  const requiredFlags: Record<string, boolean> = {
    refs_only: true,
    writes_visual_truth: false,
    writes_artifact_body: false,
    writes_memory_body: false,
    authorizes_quality_or_export: false,
    authorizes_publication_or_submission: false,
    authorizes_domain_ready: false,
    automatic_mechanism_promotion_ready: false,
  };
  for (const [field, expected] of Object.entries(requiredFlags)) {
    if (response[field] !== expected) {
      throw new Error(`Target-owner self-evolution response has invalid ${field}.`);
    }
  }
  const returnShape = required(response.return_shape, 'owner_response.return_shape');
  const outcomeByShape: Record<string, { status: string; refField: string }> = {
    domain_receipt: {
      status: 'target_owner_accepted',
      refField: 'owner_receipt_ref',
    },
    no_regression_evidence: {
      status: 'target_owner_waived',
      refField: 'no_regression_evidence_ref',
    },
    typed_blocker: {
      status: 'target_owner_blocked',
      refField: 'blocker_ref',
    },
  };
  const outcome = outcomeByShape[returnShape];
  if (!outcome) {
    throw new Error('Target-owner self-evolution response has an unsupported return_shape.');
  }
  const ownerAnswerRef = required(
    response[outcome.refField],
    `owner_response.${outcome.refField}`,
  );
  return {
    surface_kind: 'oma_self_evolution_target_owner_terminal_outcome',
    version: 'oma-self-evolution-target-owner-terminal-outcome.v1',
    status: outcome.status,
    terminal: true,
    target_owner: response.owner,
    target_owner_return_shape: returnShape,
    target_owner_answer_ref: ownerAnswerRef,
    work_order_id: response.work_order_id,
    reason_codes: strings(response.reason_codes),
    evidence_refs: unique([ownerAnswerRef, ...strings(response.evidence_refs)]),
    automatic_mechanism_promotion_ready: false,
    domain_scorecard_accepted: false,
    publication_or_submission_ready: false,
    authority_boundary: {
      oma_consumes_owner_answer: true,
      oma_writes_owner_answer: false,
      oma_authorizes_domain_quality: false,
      oma_authorizes_publication_or_submission: false,
      oma_promotes_default_agent: false,
    },
  };
}

export function buildDeveloperPatchMaterializationRequest({
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
}): DeveloperPatchMaterialization {
  const requestId = stableId('oma_developer_patch_request', {
    target_agent: targetAgent.domain_id,
    suite_id: suite.suite_id,
    suite_result_ref: suiteResult.result_id,
    candidate_ref: capabilityCandidate.candidate_id,
    foundry_lab_execution_receipt_ref: foundryLabExecutionReceiptRef,
  });
  const traceability = capabilityCandidate.patch_traceability_matrix;
  const rootCauses = unique(traceability.map((entry) => entry.root_cause));
  const targetedFix = unique([
    ...capabilityCandidate.proposed_change_refs,
    ...traceability.flatMap((entry) => entry.targeted_fix),
  ]);
  const failureEvidenceRefs = unique([
    ...strings(capabilityCandidate.failure_taxonomy_refs),
    ...strings(capabilityCandidate.ai_reviewer_evidence?.source_refs),
    ...strings(capabilityCandidate.ai_reviewer_evidence?.direct_evidence_refs),
    ...traceability.flatMap((entry) => entry.failure_evidence),
    ...traceability.flatMap((entry) => entry.source_failure_refs),
  ]);
  const verificationRefs = unique([
    ...traceability.flatMap((entry) => entry.required_verification_refs),
    ...traceability.flatMap((entry) => entry.capability_verification_refs),
    ...strings(capabilityCandidate.efficiency_non_regression_refs.target_verification_refs),
  ]);
  const reviewerRefs = unique([
    capabilityCandidate.ai_reviewer_evaluation_ref,
    ...strings(capabilityCandidate.ai_reviewer_evidence?.source_refs),
    ...strings(capabilityCandidate.ai_reviewer_evidence?.direct_evidence_refs),
  ]);
  const forbiddenSurfaces = unique([
    ...policy.forbiddenTargetPathsOrSurfaces,
    ...traceability.flatMap((entry) => entry.forbidden_target_paths_or_surfaces),
  ]);
  const ownerRouteRefs = [
    `target-agent-owner:${targetAgent.domain_id}`,
    `promotion-gate:opl-meta-agent/${targetAgent.domain_id}/external-suite-self-evolution`,
  ];
  const noForbiddenWriteProofRefs = [
    `no-forbidden-write:${targetAgent.domain_id}/${requestId}`,
  ];
  const patchTraceabilityRefs = traceability.map((entry, index) =>
    stableId('patch_traceability', {
      candidate_ref: capabilityCandidate.candidate_id,
      index,
      gap_token: entry.gap_token,
      required_patch_refs: entry.required_patch_refs,
    })
  );
  const sourceMorphologyProofRef = `source-morphology-proof:${targetAgent.domain_id}/${requestId}`;
  const privateResidueDecisionRef = `private-residue-decision:${targetAgent.domain_id}/${requestId}`;
  const targetRuntimeReadModelConsumptionRef =
    `target-runtime-read-model-consumption:${targetAgent.domain_id}/${requestId}`;
  const sourceRefs = unique([
    String(suite.suite_id ?? ''),
    suiteResult.result_id,
    suiteResult.evaluation_target_agent.target_agent_ref,
    suiteResult.evaluation_target_agent.descriptor_ref,
    ...suiteResult.refs.evaluation_provenance_refs,
    ...failureEvidenceRefs,
  ]);
  const expectedBehaviorDelta =
    'The target owner applies only evidence-traceable source changes, reruns target verification, and exposes the repaired behavior through the target runtime/read model without transferring domain authority to OMA.';

  const agentBuildingJudgment: JsonObject = {
    target_capability_improvement_candidate_ref: capabilityCandidate.candidate_id,
    root_cause: rootCauses.join(' ') ||
      'Agent Lab and independent reviewer evidence identify an owner-gated target-agent capability gap.',
    targeted_fix: targetedFix,
    predicted_impact: text(
      capabilityCandidate.ai_reviewer_review?.predicted_impact,
      'The target-owned patch closes the observed capability gap without moving authority to OMA.',
    ),
    failure_class: 'quality-gate',
    source_morphology_proof_ref: sourceMorphologyProofRef,
    private_residue_decision_ref: privateResidueDecisionRef,
    target_runtime_read_model_consumption_ref: targetRuntimeReadModelConsumptionRef,
    failure_evidence_refs: failureEvidenceRefs,
    target_editable_surface_refs: capabilityCandidate.target_editable_surface_refs,
    forbidden_surfaces: forbiddenSurfaces,
    expected_behavior_delta: expectedBehaviorDelta,
    verification_refs: verificationRefs,
    reviewer_refs: reviewerRefs,
    owner_route_refs: ownerRouteRefs,
    no_forbidden_write_proof_refs: noForbiddenWriteProofRefs,
    patch_traceability_refs: patchTraceabilityRefs,
    ...(hasEfficiencyNonRegressionEvidence(capabilityCandidate.efficiency_non_regression_refs)
      ? { efficiency_non_regression_refs: capabilityCandidate.efficiency_non_regression_refs }
      : {}),
  };

  const agentBuildingEvidence: JsonObject = {
    source_morphology_proof: {
      ref: sourceMorphologyProofRef,
      source_agent_lab_result_ref: suiteResult.result_id,
      target_capability_improvement_candidate_ref: capabilityCandidate.candidate_id,
      input_surface_refs: sourceRefs,
      consumed_as_refs_only: true,
    },
    private_residue_decision: {
      ref: privateResidueDecisionRef,
      decision: 'refs_only_no_private_residue_promotion',
      source_morphology_proof_ref: sourceMorphologyProofRef,
      private_residue_body_materialized: false,
    },
    target_runtime_read_model_consumption: {
      ref: targetRuntimeReadModelConsumptionRef,
      required_surface_refs: policy.runtimeRequiredSurfaceRefs,
      expected_outcomes: policy.runtimeExpectedOutcomes,
      target_owner_verification_required: true,
    },
  };

  return {
    materializationRequest: buildWorkOrderMaterializationRequest({
      requestKind: 'developer_patch',
      targetAgent: {
        domain_id: targetAgent.domain_id,
        repo_dir: targetAgent.repo_dir ?? '',
        target_agent_ref: suiteResult.evaluation_target_agent.target_agent_ref,
        descriptor_ref: suiteResult.evaluation_target_agent.descriptor_ref,
      },
      semanticRequest: {
        request_id: requestId,
        source_agent_lab_result_ref: suiteResult.result_id,
        foundry_lab_execution_receipt_ref: foundryLabExecutionReceiptRef,
        agent_building_judgment: agentBuildingJudgment,
        source_refs: sourceRefs,
        reviewer_refs: reviewerRefs,
        candidate_refs: [capabilityCandidate.candidate_id],
      },
    }),
    agentBuildingEvidence,
  };
}
