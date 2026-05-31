import type { JsonObject } from './domain-pack.ts';

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

function requireProgressDeltaClassification(value: unknown, fieldName: string): void {
  requireNonEmptyString(value, fieldName);
  if (!PROGRESS_DELTA_CLASSIFICATIONS.has(String(value))) {
    throw new Error(`Invalid developer patch work order: ${fieldName} must be an OPL progress delta classification.`);
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

function requireSameStringArray(left: string[], right: string[], fieldName: string): void {
  if (left.length !== right.length || left.some((entry, index) => entry !== right[index])) {
    throw new Error(`Invalid developer patch work order: ${fieldName} must match target_progress_accounting shared refs.`);
  }
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
  const classification = String(accounting.progress_delta_classification);
  const deliverableRefs = requireStringArray(
    accounting.deliverable_progress_delta?.refs,
    'target_progress_accounting.deliverable_progress_delta.refs',
  );
  const substantiveRefs = requireStringArray(
    accounting.substantive_deliverable_delta_refs,
    'target_progress_accounting.substantive_deliverable_delta_refs',
  );
  requireSameStringArray(
    deliverableRefs,
    substantiveRefs,
    'target_progress_accounting.substantive_deliverable_delta_refs',
  );
  const platformRefs = requireStringArray(
    accounting.platform_interface_repair_refs,
    'target_progress_accounting.platform_interface_repair_refs',
  );
  const sharedPlatformRefs = requireStringArray(
    accounting.platform_repair_delta?.refs,
    'target_progress_accounting.platform_repair_delta.refs',
  );
  requireSameStringArray(
    sharedPlatformRefs,
    platformRefs,
    'target_progress_accounting.platform_interface_repair_refs',
  );
  const forbiddenDeliverableRefs = [...new Set([...deliverableRefs, ...substantiveRefs])]
    .filter(isPlatformOnlyProgressRef);
  if (forbiddenDeliverableRefs.length > 0) {
    throw new Error(
      `Invalid developer patch work order: platform-only repair refs cannot be counted as target-agent substantive deliverable progress: ${forbiddenDeliverableRefs.join(', ')}`,
    );
  }
  const deliverableCount = accounting?.deliverable_progress_delta?.count;
  if (deliverableCount !== deliverableRefs.length || deliverableCount !== substantiveRefs.length) {
    throw new Error(
      'Invalid developer patch work order: target_progress_accounting deliverable count must match target-agent substantive deliverable refs.',
    );
  }
  const platformCount = accounting?.platform_repair_delta?.count;
  if (platformCount !== platformRefs.length) {
    throw new Error(
      'Invalid developer patch work order: target_progress_accounting platform repair count must match platform/interface repair refs.',
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
  requireTargetProgressAccounting(workOrder);
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
