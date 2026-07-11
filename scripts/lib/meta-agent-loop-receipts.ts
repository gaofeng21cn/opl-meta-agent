import type { JsonObject } from './domain-pack.ts';

type FoundryEvaluationRequestOptions = {
  requestId: string;
  suiteId: string;
  suiteKind: 'agent_lab_external_suite' | 'agent_production_evidence_suite';
  taskId: string;
  domainId: string;
  taskFamily: string;
  instructionsRef: string;
  agentEntryRef: string;
  stageRefs: string[];
  oracleRefs: string[];
  scorerRefs: string[];
  trajectoryRef: string;
  requestedRunRef: string;
  artifactRefs: string[];
  receiptRefs: string[];
  scorecardRef: string;
  metricRefs: string[];
  evidenceRefs: string[];
  reviewRefs: string[];
  qualityGateRefs: string[];
  improvementCandidateRef: string;
  improvementCandidateKind: string;
  improvementTargetRef: string;
  promotionGateRef: string;
  promotionGateRequiredRefs?: string[];
  regressionSuiteRefs?: string[];
  productionEvidenceGateIds?: string[];
};

const OMA_EVALUATION_REQUEST_AUTHORITY_BOUNDARY = {
  refs_only: true,
  oma_can_execute_agent_lab_suite: false,
  oma_can_write_agent_lab_result: false,
  oma_can_write_owner_receipt_body: false,
  oma_can_write_promotion_gate: false,
  oma_can_claim_target_domain_ready: false,
  oma_can_claim_target_production_ready: false,
} as const;

export function buildFoundryEvaluationRequest({
  requestId,
  suiteId,
  suiteKind,
  taskId,
  domainId,
  taskFamily,
  instructionsRef,
  agentEntryRef,
  stageRefs,
  oracleRefs,
  scorerRefs,
  trajectoryRef,
  requestedRunRef,
  artifactRefs,
  receiptRefs,
  scorecardRef,
  metricRefs,
  evidenceRefs,
  reviewRefs,
  qualityGateRefs,
  improvementCandidateRef,
  improvementCandidateKind,
  improvementTargetRef,
  promotionGateRef,
  promotionGateRequiredRefs = [],
  regressionSuiteRefs = [],
  productionEvidenceGateIds = [],
}: FoundryEvaluationRequestOptions): JsonObject {
  if (suiteKind === 'agent_production_evidence_suite' && productionEvidenceGateIds.length === 0) {
    throw new Error('Foundry evaluation requests for production evidence require production evidence gate ids.');
  }

  return {
    surface_kind: 'opl_meta_agent_foundry_evaluation_request',
    version: 'opl-meta-agent.foundry-evaluation-request.v1',
    request_id: requestId,
    suite_id: suiteId,
    suite_kind: suiteKind,
    task_intents: [{
      task_id: taskId,
      domain_id: domainId,
      task_family: taskFamily,
      instructions_ref: instructionsRef,
      agent_entry_ref: agentEntryRef,
      stage_refs: stageRefs,
      oracle_refs: oracleRefs,
      scorer_refs: scorerRefs,
      metric_refs: metricRefs,
      evidence_refs: evidenceRefs,
      review_refs: reviewRefs,
      quality_gate_refs: qualityGateRefs,
      trajectory_ref: trajectoryRef,
      requested_run_ref: requestedRunRef,
      artifact_refs: artifactRefs,
      receipt_refs: receiptRefs,
      scorecard_ref: scorecardRef,
      improvement_candidate: {
        candidate_ref: improvementCandidateRef,
        candidate_kind: improvementCandidateKind,
        target_ref: improvementTargetRef,
        allowed_change_scope: 'branch_only',
      },
      promotion_gate_ref: promotionGateRef,
      ...(promotionGateRequiredRefs.length > 0
        ? { promotion_gate_required_refs: promotionGateRequiredRefs }
        : {}),
      ...(regressionSuiteRefs.length > 0
        ? { regression_suite_refs: regressionSuiteRefs }
        : {}),
    }],
    ...(suiteKind === 'agent_production_evidence_suite'
      ? { production_evidence_gate_ids: productionEvidenceGateIds }
      : {}),
    authority_boundary: OMA_EVALUATION_REQUEST_AUTHORITY_BOUNDARY,
  };
}
