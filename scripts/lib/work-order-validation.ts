import type { JsonObject } from './domain-pack.ts';
import {
  AGENT_EVOLUTION_FAILURE_CLASSES,
  REQUIRED_AGENT_EVOLUTION_WORK_ORDER_FIELDS,
} from './work-order-refs.ts';

type DeveloperPatchWorkOrderValidationOptions = {
  allowMissingReviewerFields?: boolean;
};

const PROGRESS_DELTA_CLASSIFICATIONS = new Set([
  'deliverable_progress',
  'platform_repair',
  'mixed',
  'typed_blocker',
  'human_gate',
  'stop_loss',
]);

const AGENT_EVOLUTION_FAILURE_CLASS_SET = new Set<string>(AGENT_EVOLUTION_FAILURE_CLASSES);

function requireNonEmptyStringArray(value: unknown, fieldName: string): void {
  if (!Array.isArray(value) || !value.some((entry) => typeof entry === 'string' && entry.trim().length > 0)) {
    throw new Error(`Invalid developer patch work order: ${fieldName} must be a non-empty string array.`);
  }
}

function requireStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string' && entry.trim().length > 0)) {
    throw new Error(`Invalid developer patch work order: ${fieldName} must be a string array.`);
  }
  return value.map((entry) => entry.trim());
}

function requireObject(value: unknown, fieldName: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid developer patch work order: ${fieldName} must be an object.`);
  }
  return value as JsonObject;
}

function requireNonEmptyString(value: unknown, fieldName: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid developer patch work order: ${fieldName} must be a non-empty string.`);
  }
}

function asNonEmptyString(value: unknown, fieldName: string): string {
  requireNonEmptyString(value, fieldName);
  return String(value).trim();
}

function requireTypedBlockerRef(value: unknown, fieldName: string): void {
  requireNonEmptyString(value, fieldName);
  if (!String(value).startsWith('typed-blocker:')) {
    throw new Error(`Invalid developer patch work order: ${fieldName} must be a typed blocker ref.`);
  }
}

function requireNonNegativeNumber(value: unknown, fieldName: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid developer patch work order: ${fieldName} must be a non-negative number.`);
  }
}

function requireBoolean(value: unknown, fieldName: string): void {
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid developer patch work order: ${fieldName} must be a boolean.`);
  }
}

function requireFalse(value: unknown, fieldName: string): void {
  if (value !== false) {
    throw new Error(`Invalid developer patch work order: ${fieldName} must be false.`);
  }
}

function requireProgressDeltaClassification(value: unknown, fieldName: string): void {
  requireNonEmptyString(value, fieldName);
  if (!PROGRESS_DELTA_CLASSIFICATIONS.has(String(value))) {
    throw new Error(`Invalid developer patch work order: ${fieldName} must be an OPL progress delta classification.`);
  }
}

function requireAgentEvolutionFailureClass(value: unknown, fieldName: string): void {
  requireNonEmptyString(value, fieldName);
  if (!AGENT_EVOLUTION_FAILURE_CLASS_SET.has(String(value))) {
    throw new Error(`Invalid developer patch work order: ${fieldName} must be an OMA agent-evolution failure class.`);
  }
}

function requireEqualString(value: unknown, expected: unknown, fieldName: string): void {
  requireNonEmptyString(value, fieldName);
  requireNonEmptyString(expected, `expected ${fieldName}`);
  if (value !== expected) {
    throw new Error(`Invalid developer patch work order: ${fieldName} must match current target/eval/work-order refs.`);
  }
}

function requireIncludes(values: unknown, expected: unknown, fieldName: string): void {
  requireNonEmptyStringArray(values, fieldName);
  requireNonEmptyString(expected, `expected ${fieldName}`);
  if (!(values as unknown[]).includes(expected)) {
    throw new Error(`Invalid developer patch work order: ${fieldName} must include ${String(expected)}.`);
  }
}

function requireAllIncluded(values: unknown, expectedValues: unknown, fieldName: string): void {
  const actual = requireStringArray(values, fieldName);
  const expected = requireStringArray(expectedValues, `expected ${fieldName}`);
  expected.forEach((expectedValue) => {
    if (!actual.includes(expectedValue)) {
      throw new Error(`Invalid developer patch work order: ${fieldName} must include ${expectedValue}.`);
    }
  });
}

function requireCurrentnessRouteEvidence(workOrder: JsonObject): void {
  const currentness = workOrder.work_order_currentness;
  const evidence = currentness?.provider_owner_route_index_evidence;
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    throw new Error(
      'Invalid developer patch work order: work_order_currentness.provider_owner_route_index_evidence must prove the current OPL route/ledger binding.',
    );
  }
  const routeEvidence = evidence as JsonObject;
  const requiredFields = [
    'provider',
    'owner_route_index_ref',
    'owner_route_ledger_ref',
    'stage_attempt_ledger_ref',
    'route_binding_ref',
    'target_eval_work_order_owner_route_tuple',
  ];
  requiredFields.forEach((field) => {
    requireNonEmptyString(
      routeEvidence[field],
      `work_order_currentness.provider_owner_route_index_evidence.${field}`,
    );
  });
  if (routeEvidence.derived_from_current_opl_route_ledger !== true) {
    throw new Error(
      'Invalid developer patch work order: work_order_currentness.provider_owner_route_index_evidence.derived_from_current_opl_route_ledger must be true.',
    );
  }
  if (routeEvidence.fail_closed_without_route_or_ledger_proof !== true) {
    throw new Error(
      'Invalid developer patch work order: work_order_currentness.provider_owner_route_index_evidence.fail_closed_without_route_or_ledger_proof must be true.',
    );
  }
  const expectedTuple = [
    asNonEmptyString(workOrder.target_agent?.domain_id, 'target_agent.domain_id'),
    asNonEmptyString(workOrder.source_agent_lab_result_ref, 'source_agent_lab_result_ref'),
    asNonEmptyString(workOrder.work_order_id, 'work_order_id'),
    asNonEmptyString(currentness?.owner_route_ref, 'work_order_currentness.owner_route_ref'),
  ].join('|');
  if (routeEvidence.target_eval_work_order_owner_route_tuple !== expectedTuple) {
    throw new Error(
      'Invalid developer patch work order: work_order_currentness.provider_owner_route_index_evidence.target_eval_work_order_owner_route_tuple must match current target/eval/work-order/owner-route refs.',
    );
  }
}

function requireForbiddenAuthorityFalse(boundary: JsonObject, fieldPrefix: string): void {
  [
    'can_write_target_domain_truth',
    'can_write_target_domain_memory_body',
    'can_mutate_target_domain_artifact_body',
    'can_authorize_target_domain_quality_or_export',
    'can_promote_default_agent_without_gate',
  ].forEach((field) => {
    requireFalse(boundary[field], `${fieldPrefix}.${field}`);
  });
}

function requireExternalSuiteIntake(workOrder: JsonObject): void {
  const intake = requireObject(workOrder.source_external_suite_intake, 'source_external_suite_intake');
  requireNonEmptyString(intake.suite_id, 'source_external_suite_intake.suite_id');
  requireNonEmptyString(intake.suite_kind, 'source_external_suite_intake.suite_kind');
  requireNonEmptyString(intake.target_agent, 'source_external_suite_intake.target_agent');
  requireEqualString(
    intake.target_agent,
    workOrder.target_agent?.domain_id,
    'source_external_suite_intake.target_agent',
  );
  requireEqualString(
    intake.source_agent_lab_result_ref,
    workOrder.source_agent_lab_result_ref,
    'source_external_suite_intake.source_agent_lab_result_ref',
  );
  const acceptedProfiles = requireStringArray(
    intake.accepted_input_profiles,
    'source_external_suite_intake.accepted_input_profiles',
  );
  const hasTargetAgentFeedbackProfile = acceptedProfiles.includes('target_agent_feedback_external_suite');
  const hasMasFeedbackProfile = acceptedProfiles.includes('mas_feedback_agent_lab_external_suite');
  if (hasMasFeedbackProfile && !hasTargetAgentFeedbackProfile) {
    throw new Error(
      'Invalid developer patch work order: MAS feedback external suites must include target_agent_feedback_external_suite.',
    );
  }
  const feedbackRefPresent = typeof intake.feedback_ref === 'string' && intake.feedback_ref.trim().length > 0;
  const sourceFeedbackRefs = Array.isArray(intake.source_feedback_refs)
    ? requireStringArray(intake.source_feedback_refs, 'source_external_suite_intake.source_feedback_refs')
    : [];
  if (hasTargetAgentFeedbackProfile && !feedbackRefPresent && sourceFeedbackRefs.length === 0) {
    throw new Error(
      'Invalid developer patch work order: source_external_suite_intake requires feedback_ref or source_feedback_refs.',
    );
  }
  if (
    hasMasFeedbackProfile
    && !acceptedProfiles.includes('high_quality_medical_manuscript_feedback')
    && !acceptedProfiles.includes('reviewer_revision_feedback')
  ) {
    throw new Error(
      'Invalid developer patch work order: MAS feedback external suites must name high-quality manuscript or reviewer revision feedback profile.',
    );
  }
  requireForbiddenAuthorityFalse(
    requireObject(intake.authority_boundary, 'source_external_suite_intake.authority_boundary'),
    'source_external_suite_intake.authority_boundary',
  );
}

function requireReviewerEvidenceRefs(workOrder: JsonObject): void {
  requireNonEmptyStringArray(
    workOrder.ai_reviewer_evidence?.direct_evidence_refs,
    'ai_reviewer_evidence.direct_evidence_refs',
  );
  requireNonEmptyStringArray(workOrder.reviewer_evidence_refs, 'reviewer_evidence_refs');
  requireAllIncluded(
    workOrder.reviewer_evidence_refs,
    workOrder.ai_reviewer_evidence?.source_refs,
    'reviewer_evidence_refs',
  );
  requireAllIncluded(
    workOrder.reviewer_evidence_refs,
    workOrder.ai_reviewer_evidence?.direct_evidence_refs,
    'reviewer_evidence_refs',
  );
  requireAllIncluded(
    workOrder.work_order_completeness?.reviewer_evidence?.refs,
    workOrder.reviewer_evidence_refs,
    'work_order_completeness.reviewer_evidence.refs',
  );
}

function requireNoForbiddenWriteBoundary(workOrder: JsonObject): void {
  const proof = requireObject(workOrder.no_forbidden_write_proof, 'no_forbidden_write_proof');
  requireNonEmptyStringArray(proof.proof_refs, 'no_forbidden_write_proof.proof_refs');
  [
    'can_write_target_domain_truth',
    'can_write_target_domain_memory_body',
    'can_mutate_target_domain_artifact_body',
    'can_authorize_target_domain_quality_or_export',
  ].forEach((field) => {
    requireFalse(proof[field], `no_forbidden_write_proof.${field}`);
  });
}

function requireOplExecutionGuardFields(workOrder: JsonObject): void {
  if (requireStringArray(workOrder.owner_route_refs, 'owner_route_refs').length === 0) {
    throw new Error('Invalid developer patch work order: owner_route_refs must satisfy OPL target_owner_route guard.');
  }
  const sourceMorphologyProofRef = typeof workOrder.source_morphology_proof_ref === 'string'
    ? workOrder.source_morphology_proof_ref.trim()
    : '';
  const hasSourceMorphologyProof = Boolean(
    workOrder.source_morphology_proof
      && typeof workOrder.source_morphology_proof === 'object'
      && !Array.isArray(workOrder.source_morphology_proof),
  );
  if (!hasSourceMorphologyProof && !sourceMorphologyProofRef) {
    throw new Error(
      'Invalid developer patch work order: source_morphology_proof or source_morphology_proof_ref is required by OPL work-order execute guard.',
    );
  }
  if (hasSourceMorphologyProof) {
    const proof = requireObject(workOrder.source_morphology_proof, 'source_morphology_proof');
    requireNonEmptyString(proof.ref, 'source_morphology_proof.ref');
    requireEqualString(proof.target_agent_id, workOrder.target_agent?.domain_id, 'source_morphology_proof.target_agent_id');
    requireEqualString(proof.work_order_ref, workOrder.work_order_id, 'source_morphology_proof.work_order_ref');
    requireEqualString(
      proof.source_agent_lab_result_ref,
      workOrder.source_agent_lab_result_ref,
      'source_morphology_proof.source_agent_lab_result_ref',
    );
    if (sourceMorphologyProofRef) {
      requireEqualString(
        sourceMorphologyProofRef,
        proof.ref,
        'source_morphology_proof_ref',
      );
    }
    if (proof.consumed_as_refs_only !== true) {
      throw new Error('Invalid developer patch work order: source_morphology_proof.consumed_as_refs_only must be true.');
    }
    requireForbiddenAuthorityFalse(
      requireObject(proof.authority_boundary, 'source_morphology_proof.authority_boundary'),
      'source_morphology_proof.authority_boundary',
    );
  }
  requireNonEmptyString(
    workOrder.machine_closeout_refs?.target_runtime_read_model_consumption_ref,
    'machine_closeout_refs.target_runtime_read_model_consumption_ref',
  );
  requireNonEmptyString(
    workOrder.private_residue_decision_ref,
    'private_residue_decision_ref',
  );
  if (workOrder.private_residue_decision && typeof workOrder.private_residue_decision === 'object') {
    const decision = requireObject(workOrder.private_residue_decision, 'private_residue_decision');
    requireEqualString(
      decision.ref,
      workOrder.private_residue_decision_ref,
      'private_residue_decision.ref',
    );
    requireEqualString(decision.target_agent_id, workOrder.target_agent?.domain_id, 'private_residue_decision.target_agent_id');
    requireEqualString(decision.work_order_ref, workOrder.work_order_id, 'private_residue_decision.work_order_ref');
    requireFalse(
      decision.private_residue_body_materialized,
      'private_residue_decision.private_residue_body_materialized',
    );
    requireFalse(
      decision.target_truth_write_authorized,
      'private_residue_decision.target_truth_write_authorized',
    );
    requireFalse(
      decision.target_artifact_mutation_authorized,
      'private_residue_decision.target_artifact_mutation_authorized',
    );
  }
  requireNonEmptyString(
    workOrder.machine_closeout_refs?.target_owner_receipt_or_typed_blocker_ref,
    'machine_closeout_refs.target_owner_receipt_or_typed_blocker_ref',
  );
  requireNoForbiddenWriteBoundary(workOrder);
}

function requireOwnerCloseoutBoundary(workOrder: JsonObject): void {
  const boundary = requireObject(workOrder.owner_closeout_boundary, 'owner_closeout_boundary');
  requireNonEmptyString(boundary.owner, 'owner_closeout_boundary.owner');
  if (boundary.owner_closeout_hook_delegated !== true) {
    throw new Error('Invalid developer patch work order: owner_closeout_boundary.owner_closeout_hook_delegated must be true.');
  }
  if (boundary.target_owner_receipt_or_typed_blocker_required !== true) {
    throw new Error(
      'Invalid developer patch work order: owner_closeout_boundary.target_owner_receipt_or_typed_blocker_required must be true.',
    );
  }
  requireAllIncluded(
    boundary.target_owner_closeout_refs,
    workOrder.target_closeout_refs,
    'owner_closeout_boundary.target_owner_closeout_refs',
  );
  [
    'oma_can_write_target_owner_receipt_body',
    'oma_can_write_target_owner_typed_blocker_body',
    'oma_can_create_target_typed_blocker',
    'oma_can_invoke_target_owner_closeout_hook',
    'can_write_target_domain_truth',
    'can_write_target_domain_memory_body',
    'can_mutate_target_domain_artifact_body',
    'can_authorize_target_domain_quality_or_export',
  ].forEach((field) => {
    requireFalse(boundary[field], `owner_closeout_boundary.${field}`);
  });
}

function requireTargetOwnerCloseoutRefs(workOrder: JsonObject): void {
  requireNonEmptyStringArray(workOrder.target_owner_closeout_refs, 'target_owner_closeout_refs');
  requireAllIncluded(
    workOrder.target_owner_closeout_refs,
    workOrder.target_closeout_refs,
    'target_owner_closeout_refs',
  );
  const refs = requireStringArray(workOrder.target_owner_closeout_refs, 'target_owner_closeout_refs');
  [
    'target-owner-receipt-or-typed-blocker:',
    'patch-absorption:',
    'worktree-cleanup:',
    'agent-lab-re-evaluation:',
  ].forEach((prefix) => {
    if (!refs.some((ref) => ref.startsWith(prefix))) {
      throw new Error(`Invalid developer patch work order: target_owner_closeout_refs must include ${prefix} refs.`);
    }
  });
}

function requireOplWorkOrderDelegationAperture(workOrder: JsonObject): void {
  const aperture = requireObject(workOrder.opl_work_order_delegation_aperture, 'opl_work_order_delegation_aperture');
  if (aperture.delegates_to_opl_work_order_execute !== true) {
    throw new Error(
      'Invalid developer patch work order: opl_work_order_delegation_aperture.delegates_to_opl_work_order_execute must be true.',
    );
  }
  if (aperture.executor_first !== true) {
    throw new Error('Invalid developer patch work order: opl_work_order_delegation_aperture.executor_first must be true.');
  }
  requireNonEmptyString(aperture.primitive_owner, 'opl_work_order_delegation_aperture.primitive_owner');
  requireNonEmptyString(aperture.command, 'opl_work_order_delegation_aperture.command');
  requireEqualString(
    aperture.executor_lease_ref,
    workOrder.executor_lease_ref,
    'opl_work_order_delegation_aperture.executor_lease_ref',
  );
  requireEqualString(
    aperture.patch_execution_bundle_ref,
    workOrder.patch_execution_bundle_ref,
    'opl_work_order_delegation_aperture.patch_execution_bundle_ref',
  );
  requireAllIncluded(
    aperture.target_owner_closeout_refs,
    workOrder.target_closeout_refs,
    'opl_work_order_delegation_aperture.target_owner_closeout_refs',
  );
  [
    'work_order_readiness_primitive_ref',
    'target_owner_return_primitive_ref',
    'patch_traceability_primitive_ref',
    'readiness_projection_ref',
  ].forEach((field) => {
    requireNonEmptyString(
      aperture.required_opl_work_order_primitive_refs?.[field],
      `opl_work_order_delegation_aperture.required_opl_work_order_primitive_refs.${field}`,
    );
  });
  requireForbiddenAuthorityFalse(
    requireObject(aperture.authority_boundary, 'opl_work_order_delegation_aperture.authority_boundary'),
    'opl_work_order_delegation_aperture.authority_boundary',
  );
  requireAllIncluded(
    workOrder.work_order_completeness?.opl_work_order_delegation_aperture?.target_owner_closeout_refs,
    workOrder.target_closeout_refs,
    'work_order_completeness.opl_work_order_delegation_aperture.target_owner_closeout_refs',
  );
}

function isPlatformOnlyProgressRef(ref: string): boolean {
  return [
    'target-runtime-read-model-consumption:',
    'workspace-environment-proof:',
    'no-forbidden-write:',
    'target-owner-receipt-or-typed-blocker:',
    'patch-absorption:',
    'worktree-cleanup:',
    'agent-lab-re-evaluation:',
    'owner_receipt_coordination_record',
    'target_owner_receipt_projection_ref',
    'target_runtime_consumption_verification_receipt',
    'target_workspace_environment_consumption_receipt',
    'repo_hygiene_no_checkout_venv_proof',
    'no_target_domain_truth_write_proof',
  ].some((prefix) => ref === prefix || ref.startsWith(prefix));
}

function requireTypedBlockerProgressLineage(accounting: JsonObject): void {
  if (typeof accounting.next_forced_delta !== 'string' || accounting.next_forced_delta.trim().length === 0) {
    throw new Error(
      'Invalid developer patch work order: typed_blocker requires target_progress_accounting.next_forced_delta.',
    );
  }
  if (typeof accounting.next_allowed_action !== 'string' || accounting.next_allowed_action.trim().length === 0) {
    throw new Error(
      'Invalid developer patch work order: typed_blocker requires target_progress_accounting.next_allowed_action.',
    );
  }
  const lineage = requireObject(
    accounting.typed_blocker_lineage,
    'target_progress_accounting.typed_blocker_lineage',
  );
  [
    'blocker_family',
    'study_id_or_domain_identity',
    'work_unit_id',
    'eval_id_or_review_ref',
    'source_fingerprint',
    'first_seen',
    'last_seen',
    'last_deliverable_delta',
    'next_forced_delta',
    'escalation_owner',
  ].forEach((field) => {
    requireNonEmptyString(lineage[field], `target_progress_accounting.typed_blocker_lineage.${field}`);
  });
  requireNonNegativeNumber(
    lineage.repeat_count,
    'target_progress_accounting.typed_blocker_lineage.repeat_count',
  );
  requireBoolean(lineage.terminal, 'target_progress_accounting.typed_blocker_lineage.terminal');
  const repeatBudget = requireObject(
    lineage.repeat_budget,
    'target_progress_accounting.typed_blocker_lineage.repeat_budget',
  );
  requireNonNegativeNumber(
    repeatBudget.mechanism_repair_after_repeat_count,
    'target_progress_accounting.typed_blocker_lineage.repeat_budget.mechanism_repair_after_repeat_count',
  );
  requireNonNegativeNumber(
    repeatBudget.human_gate_or_stop_loss_after_repeat_count,
    'target_progress_accounting.typed_blocker_lineage.repeat_budget.human_gate_or_stop_loss_after_repeat_count',
  );
}

function requireTargetProgressAccounting(workOrder: JsonObject): void {
  const accounting = requireObject(workOrder.target_progress_accounting, 'target_progress_accounting');
  [
    'substantive_deliverable_delta_refs',
    'platform_interface_repair_refs',
  ].forEach((field) => {
    if (Object.hasOwn(accounting, field)) {
      throw new Error(
        `Invalid developer patch work order: retired target_progress_accounting alias field ${field} is not accepted.`,
      );
    }
  });
  const classification = String(accounting.progress_delta_classification);
  const deliverableRefs = requireStringArray(
    accounting.deliverable_progress_delta?.refs,
    'target_progress_accounting.deliverable_progress_delta.refs',
  );
  const platformRefs = requireStringArray(
    accounting.platform_repair_delta?.refs,
    'target_progress_accounting.platform_repair_delta.refs',
  );
  const forbiddenDeliverableRefs = [...new Set(deliverableRefs)]
    .filter(isPlatformOnlyProgressRef);
  if (forbiddenDeliverableRefs.length > 0) {
    throw new Error(
      `Invalid developer patch work order: platform-only repair refs cannot be counted as target-agent substantive deliverable progress: ${forbiddenDeliverableRefs.join(', ')}`,
    );
  }
  const deliverableCount = accounting?.deliverable_progress_delta?.count;
  if (deliverableCount !== deliverableRefs.length) {
    throw new Error(
      'Invalid developer patch work order: target_progress_accounting deliverable count must match deliverable progress refs.',
    );
  }
  const platformCount = accounting?.platform_repair_delta?.count;
  if (platformCount !== platformRefs.length) {
    throw new Error(
      'Invalid developer patch work order: target_progress_accounting platform repair count must match platform repair refs.',
    );
  }
  const deliverableRefCount = deliverableRefs.length;
  const platformRefCount = platformRefs.length;
  if (classification === 'deliverable_progress' && (deliverableRefCount === 0 || platformRefCount !== 0)) {
    throw new Error(
      'Invalid developer patch work order: deliverable_progress requires deliverable refs and no platform repair refs.',
    );
  }
  if (classification === 'platform_repair' && (platformRefCount === 0 || deliverableRefCount !== 0)) {
    throw new Error(
      'Invalid developer patch work order: platform_repair requires platform repair refs and no deliverable refs.',
    );
  }
  if (classification === 'mixed' && (deliverableRefCount === 0 || platformRefCount === 0)) {
    throw new Error(
      'Invalid developer patch work order: mixed requires both deliverable refs and platform repair refs.',
    );
  }
  if (classification === 'typed_blocker') {
    if (deliverableRefCount !== 0 || platformRefCount !== 0) {
      throw new Error(
        'Invalid developer patch work order: typed_blocker requires zero deliverable refs and zero platform repair refs.',
      );
    }
    requireTypedBlockerProgressLineage(accounting);
  }
  if (classification === 'human_gate' && deliverableRefCount !== 0) {
    throw new Error(
      'Invalid developer patch work order: human_gate must not carry deliverable progress refs.',
    );
  }
  if (classification === 'stop_loss' && deliverableRefCount !== 0) {
    throw new Error(
      'Invalid developer patch work order: stop_loss must not carry deliverable progress refs.',
    );
  }
}

function requireAgentEvolutionReadback(workOrder: JsonObject): void {
  REQUIRED_AGENT_EVOLUTION_WORK_ORDER_FIELDS.forEach((field) => {
    if (!Object.hasOwn(workOrder, field)) {
      throw new Error(`Invalid developer patch work order: ${field} is required by developer work-order policy.`);
    }
  });
  requireNonEmptyString(workOrder.agent_evolution_decision_ref, 'agent_evolution_decision_ref');
  requireAgentEvolutionFailureClass(workOrder.failure_class, 'failure_class');

  const ownerRoute = requireObject(workOrder.target_owner_route, 'target_owner_route');
  requireEqualString(ownerRoute.target_agent_id, workOrder.target_agent?.domain_id, 'target_owner_route.target_agent_id');
  requireEqualString(
    ownerRoute.owner_route_ref,
    workOrder.work_order_currentness?.owner_route_ref,
    'target_owner_route.owner_route_ref',
  );
  requireAllIncluded(ownerRoute.route_refs, workOrder.owner_route_refs, 'target_owner_route.route_refs');
  requireNonEmptyString(ownerRoute.currentness_ref, 'target_owner_route.currentness_ref');

  const editableSurfaceRefs = requireStringArray(
    workOrder.target_editable_surface_refs,
    'target_editable_surface_refs',
  );
  if (workOrder.status === 'ready_for_target_agent_source_patch' && editableSurfaceRefs.length === 0) {
    throw new Error(
      'Invalid developer patch work order: ready source patch requires target_editable_surface_refs.',
    );
  }
  requireAllIncluded(
    workOrder.target_editable_surface_refs,
    workOrder.allowed_editable_surfaces ?? [],
    'target_editable_surface_refs',
  );
  requireNonEmptyStringArray(workOrder.forbidden_surfaces, 'forbidden_surfaces');
  requireAllIncluded(
    workOrder.forbidden_surfaces,
    workOrder.forbidden_target_paths_or_surfaces,
    'forbidden_surfaces',
  );

  const expectedBehavior = requireObject(workOrder.expected_behavior_delta, 'expected_behavior_delta');
  requireEqualString(expectedBehavior.failure_class, workOrder.failure_class, 'expected_behavior_delta.failure_class');
  requireNonEmptyString(expectedBehavior.summary, 'expected_behavior_delta.summary');
  requireStringArray(expectedBehavior.expected_change_refs, 'expected_behavior_delta.expected_change_refs');
  requireAllIncluded(
    expectedBehavior.verification_refs,
    workOrder.required_verification_refs,
    'expected_behavior_delta.verification_refs',
  );
  requireNonEmptyString(
    expectedBehavior.read_model_consumption_ref,
    'expected_behavior_delta.read_model_consumption_ref',
  );
  requireAllIncluded(workOrder.verification_refs, workOrder.required_verification_refs, 'verification_refs');

  const closeoutReadback = requireObject(workOrder.owner_closeout_readback, 'owner_closeout_readback');
  requireEqualString(closeoutReadback.owner, workOrder.owner_closeout_boundary?.owner, 'owner_closeout_readback.owner');
  requireEqualString(
    closeoutReadback.target_owner_receipt_or_typed_blocker_ref,
    workOrder.machine_closeout_refs?.target_owner_receipt_or_typed_blocker_ref,
    'owner_closeout_readback.target_owner_receipt_or_typed_blocker_ref',
  );
  requireAllIncluded(
    closeoutReadback.target_owner_closeout_refs,
    workOrder.target_closeout_refs,
    'owner_closeout_readback.target_owner_closeout_refs',
  );
  [
    'oma_can_write_target_owner_receipt_body',
    'oma_can_write_target_owner_typed_blocker_body',
    'oma_can_create_target_typed_blocker',
    'oma_can_invoke_target_owner_closeout_hook',
    'can_write_target_domain_truth',
    'can_write_target_domain_memory_body',
    'can_mutate_target_domain_artifact_body',
    'can_authorize_target_domain_quality_or_export',
  ].forEach((field) => {
    requireFalse(closeoutReadback[field], `owner_closeout_readback.${field}`);
  });
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
  requireProgressDeltaClassification(
    workOrder.target_progress_accounting?.progress_delta_classification,
    'target_progress_accounting.progress_delta_classification',
  );
  requireNonNegativeNumber(
    workOrder.target_progress_accounting?.deliverable_progress_delta?.count,
    'target_progress_accounting.deliverable_progress_delta.count',
  );
  requireNonNegativeNumber(
    workOrder.target_progress_accounting?.platform_repair_delta?.count,
    'target_progress_accounting.platform_repair_delta.count',
  );
  requireEqualString(
    workOrder.work_order_currentness?.target_agent_id,
    workOrder.target_agent?.domain_id,
    'work_order_currentness.target_agent_id',
  );
  requireEqualString(
    workOrder.work_order_currentness?.eval_result_ref,
    workOrder.source_agent_lab_result_ref,
    'work_order_currentness.eval_result_ref',
  );
  requireEqualString(
    workOrder.work_order_currentness?.work_order_ref,
    workOrder.work_order_id,
    'work_order_currentness.work_order_ref',
  );
  requireCurrentnessRouteEvidence(workOrder);
  requireIncludes(
    workOrder.owner_route_refs,
    workOrder.work_order_currentness?.owner_route_ref,
    'owner_route_refs',
  );
  requireOplExecutionGuardFields(workOrder);
  requireTargetProgressAccounting(workOrder);
  requireAgentEvolutionReadback(workOrder);
  requireNonEmptyStringArray(workOrder.rollback_version_refs, 'rollback_version_refs');
  requireNonEmptyStringArray(workOrder.no_forbidden_write_proof?.proof_refs, 'no_forbidden_write_proof.proof_refs');
  if (!options.allowMissingReviewerFields) {
    requireNonEmptyStringArray(workOrder.work_order_completeness?.reviewer_refs, 'work_order_completeness.reviewer_refs');
    requireNonEmptyStringArray(
      workOrder.work_order_completeness?.reviewer_pool_refs,
      'work_order_completeness.reviewer_pool_refs',
    );
    if (workOrder.surface_kind === 'opl_meta_agent_developer_patch_work_order') {
      requireNonEmptyStringArray(workOrder.failure_evidence_refs, 'failure_evidence_refs');
      requireAllIncluded(
        workOrder.failure_evidence_refs,
        workOrder.ahe_developer_work_order?.failure_evidence,
        'failure_evidence_refs',
      );
      requireStringArray(workOrder.matched_capability_ids, 'matched_capability_ids');
      requireStringArray(workOrder.canonical_target_paths, 'canonical_target_paths');
      requireStringArray(workOrder.failure_token_registry_refs, 'failure_token_registry_refs');
      requireStringArray(workOrder.improvement_tokens, 'improvement_tokens');
      requireNonEmptyStringArray(workOrder.forbidden_target_paths_or_surfaces, 'forbidden_target_paths_or_surfaces');
      requireExternalSuiteIntake(workOrder);
      requireReviewerEvidenceRefs(workOrder);
      requireTargetOwnerCloseoutRefs(workOrder);
      requireOplWorkOrderDelegationAperture(workOrder);
      requireForbiddenAuthorityFalse(
        requireObject(workOrder.authority_boundary, 'authority_boundary'),
        'authority_boundary',
      );
      requireNoForbiddenWriteBoundary(workOrder);
      requireOwnerCloseoutBoundary(workOrder);
    }
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
  requireIncludes(
    workOrder.work_order_completeness?.owner_route?.route_refs,
    workOrder.work_order_currentness?.owner_route_ref,
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
