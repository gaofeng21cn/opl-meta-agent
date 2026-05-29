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

function requireNonNegativeNumber(value: unknown, fieldName: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid developer patch work order: ${fieldName} must be a non-negative number.`);
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
  requireIncludes(
    workOrder.owner_route_refs,
    workOrder.work_order_currentness?.owner_route_ref,
    'owner_route_refs',
  );
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
