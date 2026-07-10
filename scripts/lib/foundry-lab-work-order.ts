import type { JsonObject } from './domain-pack.ts';
import { stableId } from './meta-agent-loop-io.ts';

export type FoundryLabTargetAgent = {
  domain_id: string;
  domain_label?: string | null;
  repo_dir?: string | null;
  descriptor_ref?: string | null;
};

export type FoundryLabWorkOrderKind =
  | 'agent_baseline_evaluation'
  | 'target_agent_takeover_evaluation'
  | 'target_agent_production_evidence_evaluation';

export const FOUNDRY_LAB_EVALUATION_CONSUMER_BLOCKER =
  'blocked_missing_opl_foundry_lab_evaluation_work_order_consumer';

type FoundryLabWorkOrderInput = {
  workOrderKind: FoundryLabWorkOrderKind;
  targetAgent: FoundryLabTargetAgent;
  suiteSeed: JsonObject;
  suiteSeedRef: string;
  sourceRefs?: string[];
  reviewerRefs?: string[];
  candidateRefs?: string[];
};

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
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
  const suiteId = String(suiteSeed.suite_id ?? 'foundry-lab-suite-seed');
  const workOrderId = stableId('oma_foundry_lab_work_order', [
    workOrderKind,
    targetAgent.domain_id,
    suiteId,
    suiteSeedRef,
    sourceRefs,
    reviewerRefs,
    candidateRefs,
  ]);

  return {
    surface_kind: 'opl_meta_agent_foundry_lab_work_order_candidate',
    version: 'opl-meta-agent.foundry-lab-work-order-candidate.v1',
    work_order_id: workOrderId,
    work_order_kind: workOrderKind,
    status: FOUNDRY_LAB_EVALUATION_CONSUMER_BLOCKER,
    product_id: 'opl-meta-agent',
    execution_owner: 'one-person-lab/OPL Foundry Lab',
    target_agent: targetAgent,
    suite_seed: {
      ref: suiteSeedRef,
      suite_id: suiteId,
      suite_kind: suiteSeed.suite_kind,
    },
    source_refs: unique(sourceRefs),
    reviewer_refs: unique(reviewerRefs),
    candidate_refs: unique(candidateRefs),
    requested_operations: [
      'materialize_agent_lab_suite',
      'execute_agent_lab_suite',
      'record_agent_lab_suite_result',
      'materialize_foundry_lab_execution_receipt',
      'project_improvement_candidate_refs',
      'evaluate_promotion_gate',
      'project_mechanism_and_scaleout_ledger_refs',
    ],
    expected_return_shapes: [
      'agent_lab_suite_result_ref',
      'foundry_lab_execution_receipt_ref',
      'improvement_candidate_refs',
      'mechanism_proposal_refs',
      'promotion_gate_refs',
      'scaleout_ledger_refs',
      'target_owner_receipt_or_typed_blocker_ref',
    ],
    consumer_dependency: {
      status: 'missing',
      owner: 'one-person-lab/OPL Foundry Lab',
      required_consumer_role: 'compile_evaluation_work_order_to_agent_lab_suite_and_execute',
      current_incompatible_surfaces: [
        'opl agent-lab run --suite requires a materialized AgentLabSuite',
        'opl work-order execute accepts target source patch work orders only',
      ],
      unblock_condition:
        'canonical OPL consumer accepts this work order and returns a Foundry Lab execution receipt plus suite result ref',
    },
    execution_aperture: {
      action_ref: null,
      work_order_lifecycle_owner: 'one-person-lab/OPL Foundry Lab',
      result_ledger_owner: 'one-person-lab/OPL Foundry Lab',
      target_owner_closeout_owner: 'target-domain',
    },
    authority_boundary: {
      oma_can_execute_agent_lab_suite: false,
      oma_can_write_agent_lab_result: false,
      oma_can_write_owner_receipt_body: false,
      oma_can_write_learning_candidate_ledger: false,
      oma_can_write_promotion_gate: false,
      oma_can_write_mechanism_or_scaleout_ledger: false,
      oma_can_manage_work_order_lifecycle: false,
      oma_can_write_target_domain_truth: false,
      oma_can_write_target_domain_memory_body: false,
      oma_can_mutate_target_domain_artifact_body: false,
      oma_can_authorize_target_domain_quality_or_export: false,
      oma_can_promote_default_agent_without_gate: false,
    },
  };
}
