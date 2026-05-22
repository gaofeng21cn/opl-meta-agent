import type { JsonObject } from './domain-pack.ts';

type DeveloperPatchWorkOrderValidationOptions = {
  allowMissingReviewerFields?: boolean;
};

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
