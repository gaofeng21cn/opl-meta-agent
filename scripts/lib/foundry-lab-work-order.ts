import type { JsonObject } from './domain-pack.ts';
import { stableId } from './meta-agent-loop-io.ts';

export type FoundryLabTargetAgent = {
  domain_id: string;
  target_agent_ref: string;
  descriptor_ref: string;
  domain_label?: string | null;
  repo_dir?: string | null;
};

export type FoundryLabWorkOrderKind =
  | 'agent_baseline_evaluation'
  | 'target_agent_takeover_evaluation'
  | 'target_agent_production_evidence_evaluation';

export const FOUNDRY_LAB_EVALUATION_OWNER = 'one-person-lab/OPL Foundry Lab';
export const FOUNDRY_LAB_EVALUATION_ACTION_REF =
  'opl agent-lab evaluation-work-order execute --work-order <work-order.json> --output <dir>';

type FoundryLabWorkOrderInput = {
  workOrderKind: FoundryLabWorkOrderKind;
  targetAgent: FoundryLabTargetAgent;
  suiteSeed: JsonObject;
  suiteSeedRef: string;
  sourceRefs?: string[];
  reviewerRefs?: string[];
  candidateRefs?: string[];
};

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Foundry Lab work order requires ${field}.`);
  }
  return value.trim();
}

function canonicalRefs(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

export function buildFoundryLabWorkOrder({
  workOrderKind,
  targetAgent,
  suiteSeed,
  suiteSeedRef,
  sourceRefs = [],
  reviewerRefs = [],
  candidateRefs = [],
}: FoundryLabWorkOrderInput): JsonObject {
  const canonicalTarget = {
    ...targetAgent,
    domain_id: requiredString(targetAgent.domain_id, 'target_agent.domain_id'),
    target_agent_ref: requiredString(targetAgent.target_agent_ref, 'target_agent.target_agent_ref'),
    descriptor_ref: requiredString(targetAgent.descriptor_ref, 'target_agent.descriptor_ref'),
  };
  const suiteId = requiredString(suiteSeed.suite_id, 'suite_seed.suite_id');
  const suiteKind = requiredString(suiteSeed.suite_kind, 'suite_seed.suite_kind');
  const canonicalSuiteSeedRef = requiredString(suiteSeedRef, 'suite_seed.ref');
  const canonicalSourceRefs = canonicalRefs(sourceRefs);
  const canonicalReviewerRefs = canonicalRefs(reviewerRefs);
  const canonicalCandidateRefs = canonicalRefs(candidateRefs);
  const workOrderId = stableId('oma_foundry_lab_work_order', {
    work_order_kind: workOrderKind,
    target_identity: {
      domain_id: canonicalTarget.domain_id,
      target_agent_ref: canonicalTarget.target_agent_ref,
      descriptor_ref: canonicalTarget.descriptor_ref,
    },
    suite_seed: {
      suite_id: suiteId,
      suite_kind: suiteKind,
      ref: canonicalSuiteSeedRef,
    },
    source_refs: canonicalSourceRefs,
    reviewer_refs: canonicalReviewerRefs,
    candidate_refs: canonicalCandidateRefs,
  });

  return {
    surface_kind: 'opl_meta_agent_foundry_lab_work_order_candidate',
    version: 'opl-meta-agent.foundry-lab-work-order-candidate.v1',
    work_order_id: workOrderId,
    work_order_kind: workOrderKind,
    status: 'ready_for_opl_foundry_lab_evaluation',
    product_id: 'opl-meta-agent',
    execution_owner: FOUNDRY_LAB_EVALUATION_OWNER,
    target_agent: canonicalTarget,
    suite_seed: {
      ref: canonicalSuiteSeedRef,
      suite_id: suiteId,
      suite_kind: suiteKind,
    },
    source_refs: canonicalSourceRefs,
    reviewer_refs: canonicalReviewerRefs,
    candidate_refs: canonicalCandidateRefs,
    requested_operations: [
      'materialize_agent_lab_suite',
      'execute_agent_lab_suite',
      'record_agent_lab_suite_result',
      'materialize_foundry_lab_execution_receipt',
      'project_improvement_candidate_refs',
      'evaluate_promotion_gate',
    ],
    expected_return_shapes: [
      'agent_lab_suite_result_ref',
      'foundry_lab_execution_receipt_ref',
      'improvement_candidate_refs',
      'promotion_gate_refs',
      'target_owner_receipt_or_typed_blocker_ref',
    ],
    consumer_dependency: {
      status: 'available',
      owner: FOUNDRY_LAB_EVALUATION_OWNER,
      required_consumer_role: 'compile_evaluation_work_order_to_agent_lab_suite_and_execute',
    },
    execution_aperture: {
      action_ref: FOUNDRY_LAB_EVALUATION_ACTION_REF,
      work_order_lifecycle_owner: FOUNDRY_LAB_EVALUATION_OWNER,
      result_ledger_owner: FOUNDRY_LAB_EVALUATION_OWNER,
      target_owner_closeout_owner: 'target-domain',
    },
    authority_boundary: {
      oma_can_execute_agent_lab_suite: false,
      oma_can_write_agent_lab_result: false,
      oma_can_write_owner_receipt_body: false,
      oma_can_write_learning_candidate_ledger: false,
      oma_can_write_promotion_gate: false,
      oma_can_manage_work_order_lifecycle: false,
      oma_can_write_target_domain_truth: false,
      oma_can_write_target_domain_memory_body: false,
      oma_can_mutate_target_domain_artifact_body: false,
      oma_can_authorize_target_domain_quality_or_export: false,
      oma_can_claim_target_domain_ready: false,
      oma_can_claim_target_production_ready: false,
      oma_can_promote_default_agent_without_gate: false,
    },
  };
}
