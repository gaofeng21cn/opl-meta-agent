#!/usr/bin/env node
import path from 'node:path';
import type { JsonObject } from './domain-pack.ts';
import {
  aiReviewerReceiptFields,
  loadAiReviewerEvaluation,
  type AiReviewerEvaluation,
} from './meta-agent-loop-ai-reviewer.ts';
import { stableId } from './meta-agent-loop-io.ts';
import {
  type AgentContracts,
  TARGET_AGENT_EDITABLE_SURFACES,
  TARGET_AGENT_FORBIDDEN_WRITE_SURFACES,
  type TargetAgentIdentity,
  loadAgentContracts,
  parseAgentEvidenceArgs,
  productionEvidenceGate,
  sourceContractRefs,
  targetAgentIdentity,
} from './agent-evidence-contracts.ts';
import {
  buildExpectedTypedBlockerRef,
} from './agent-evidence-typed-blocker.ts';
import {
  buildFoundryEvaluationSemanticRequest,
} from './foundry-evaluation-semantic-request.ts';
import {
  buildStageNativeArtifactAttemptRefs,
} from './stage-native-artifact-contract.ts';
import {
  collectEfficiencyNonRegressionRefs,
} from './work-order-efficiency.ts';
import {
  buildWorkOrderMaterializationRequest,
} from './work-order-materialization-request.ts';
import {
  forbiddenWriteSurfaces,
  noForbiddenWriteProofRefs,
  productionAcceptanceEvidenceRefs,
  targetOwnerRoute,
  uniqueRefs,
  verificationRefs,
} from './work-order-refs.ts';

export type { AgentContracts, TargetAgentIdentity } from './agent-evidence-contracts.ts';

export function buildAgentEvidenceEvaluationRequest({
  agentRepo,
  contracts,
  aiReviewerEvaluation,
  aiReviewerEvaluationPath,
}: {
  agentRepo: string;
  contracts: AgentContracts;
  aiReviewerEvaluation: AiReviewerEvaluation | null;
  aiReviewerEvaluationPath: string | null;
}): JsonObject {
  const targetAgent = targetAgentIdentity(contracts, agentRepo);
  const receiptRefs = productionAcceptanceEvidenceRefs(contracts.productionAcceptance);
  const noForbiddenRefs = noForbiddenWriteProofRefs(contracts, targetAgent);
  const stageNativeArtifactRefs = buildStageNativeArtifactAttemptRefs({
    domainId: targetAgent.domainId,
    stageId: 'agent-evidence-takeover',
    domainTruthOwner: 'opl-meta-agent',
    attemptId: 'production-evidence-tail',
  });
  const suiteId = stableId('oma_foundry_evaluation_request', [
    agentRepo,
    contracts.productionAcceptanceRef,
    contracts.productionAcceptance.updated_at,
    aiReviewerEvaluationPath,
  ]);

  const productionGate = productionEvidenceGate(contracts, targetAgent);
  const productionEvidenceGateIds = Array.isArray(productionGate.gate_ids)
    ? productionGate.gate_ids.filter((value): value is string => typeof value === 'string' && value.length > 0)
    : [];
  const reviewerRefs = aiReviewerEvaluation && aiReviewerEvaluationPath
    ? [
        aiReviewerEvaluationPath,
        ...aiReviewerEvaluation.source_refs,
        ...aiReviewerEvaluation.direct_evidence_refs,
      ]
    : [];
  const scorecardRef = `scorecard:${targetAgent.domainId}/production-evidence-tail/testing-takeover`;

  return buildFoundryEvaluationSemanticRequest({
    requestId: `oma-foundry-evaluation-request:${suiteId}`,
    suiteId,
    suiteKind: 'agent_production_evidence_suite',
    taskId: `agent-lab-task:${targetAgent.domainId}/production-evidence-tail/testing-takeover`,
    domainId: 'opl-meta-agent',
    taskFamily: 'target_agent_production_evidence_tail_testing_takeover',
    instructionsRef: `instructions:opl-meta-agent/${targetAgent.domainId}/production-evidence-tail-testing-takeover`,
    agentEntryRef: `target-agent-entry:${targetAgent.domainId}`,
    stageRefs: [
      `stage:${targetAgent.domainId}/production-acceptance-contract-read`,
      `stage:${targetAgent.domainId}/foundry-evaluation-request`,
      `stage:${targetAgent.domainId}/no-forbidden-write-verification`,
    ],
    oracleRefs: [
      `oracle:${targetAgent.domainId}/production-acceptance`,
      `oracle:${targetAgent.domainId}/owner-receipt-or-typed-blocker-route`,
    ],
    scorerRefs: [
      `scorer:${targetAgent.domainId}/no-forbidden-write-proof`,
      `scorer:${targetAgent.domainId}/refs-only-evidence-tail-handoff`,
    ],
    trajectoryRef: `trajectory:${targetAgent.domainId}/production-evidence-tail/testing-takeover`,
    requestedRunRef: `run:opl-foundry-lab/${targetAgent.domainId}/production-evidence-tail`,
    artifactRefs: [
      String(stageNativeArtifactRefs.canonical_artifact_ref),
      String(stageNativeArtifactRefs.manifest_ref),
    ],
    receiptRefs,
    scorecardRef,
    metricRefs: [
      `metric-ref:${targetAgent.domainId}/no-forbidden-write-proof`,
      `metric-ref:${targetAgent.domainId}/target-owner-route-present`,
      `metric-ref:${targetAgent.domainId}/ai-reviewer-evaluation-present`,
    ],
    evidenceRefs: uniqueRefs([
      ...sourceContractRefs(contracts),
      contracts.productionAcceptanceRef,
      ...receiptRefs,
      ...reviewerRefs,
    ]),
    reviewRefs: reviewerRefs,
    qualityGateRefs: [`quality-gate:${targetAgent.domainId}/production-evidence-tail/owner-gated`],
    improvementCandidateRef: `improvement-candidate:${targetAgent.domainId}/production-evidence-tail/foundry-testing-takeover`,
    improvementCandidateKind: 'production_evidence_tail_capability_gap',
    improvementTargetRef: `${targetAgent.targetAgentRef}/production-evidence-tail`,
    promotionGateRef: `promotion-gate:${targetAgent.domainId}/production-evidence-tail/owner-gated`,
    promotionGateRequiredRefs: noForbiddenRefs,
    productionEvidenceGateIds,
  });
}

export function buildCapabilityCandidate({
  contracts,
  evaluationRequest,
  aiReviewerEvaluation,
  aiReviewerEvaluationPath,
  targetAgent,
}: {
  contracts: AgentContracts;
  evaluationRequest: JsonObject;
  aiReviewerEvaluation: AiReviewerEvaluation | null;
  aiReviewerEvaluationPath: string | null;
  targetAgent: TargetAgentIdentity;
}): JsonObject {
  const proposedChangeRefs = [
    `agent:evidence-tail/${targetAgent.domainId}/no-active-caller-proof`,
    `agent:evidence-tail/${targetAgent.domainId}/opl-generated-surface-parity`,
    `agent:evidence-tail/${targetAgent.domainId}/domain-receipt-parity`,
    `agent:evidence-tail/${targetAgent.domainId}/independent-reviewer-auditor-receipt`,
    `agent:evidence-tail/${targetAgent.domainId}/no-forbidden-write-proof`,
  ];
  const candidateId = stableId('oma_agent_capability_candidate', [
    evaluationRequest.suite_id,
    proposedChangeRefs,
    aiReviewerEvaluationPath,
  ]);
  const expectedTypedBlockerRef = aiReviewerEvaluation
    ? null
    : buildExpectedTypedBlockerRef(targetAgent.domainId, candidateId, 'missing_ai_reviewer_evaluation');

  return {
    surface_kind: 'opl_meta_agent_target_capability_improvement_candidate',
    version: 'opl-meta-agent.target-capability-improvement-candidate.v1',
    candidate_id: candidateId,
    status: aiReviewerEvaluation
      ? 'candidate_recorded_requires_target_owner_gate'
      : 'candidate_recorded_missing_reviewer_evidence',
    target_agent: {
      domain_id: targetAgent.domainId,
      domain_label: targetAgent.domainLabel,
      owner: targetAgent.owner,
      generated_surface_owner: targetAgent.generatedSurfaceOwner,
      target_agent_ref: targetAgent.targetAgentRef,
    },
    source_foundry_evaluation_request: {
      request_id: evaluationRequest.request_id,
      suite_id: evaluationRequest.suite_id,
      suite_kind: evaluationRequest.suite_kind,
      evaluation_status: 'pending_opl_foundry_lab_execution',
    },
    source_contract_refs: sourceContractRefs(contracts),
    target_owner_route: targetOwnerRoute(contracts),
    proposed_change_refs: proposedChangeRefs,
    editable_surface_limits: {
      editable_surfaces: TARGET_AGENT_EDITABLE_SURFACES,
      forbidden_write_surfaces: forbiddenWriteSurfaces(contracts, TARGET_AGENT_FORBIDDEN_WRITE_SURFACES),
      proposal_only: true,
      refs_only: true,
    },
    no_forbidden_write: {
      required: true,
      proof_refs: noForbiddenWriteProofRefs(contracts, targetAgent),
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
    },
    efficiency_non_regression_refs: collectEfficiencyNonRegressionRefs(
      contracts.productionAcceptance,
      contracts.agentLabHandoff,
      evaluationRequest,
      aiReviewerEvaluation,
    ),
    verification_command_refs: verificationRefs(contracts.productionAcceptance),
    ai_reviewer_evaluation_ref: aiReviewerEvaluationPath,
    ai_reviewer_status: aiReviewerEvaluation ? 'present' : 'missing',
    expected_typed_blocker_ref: expectedTypedBlockerRef,
    ...(aiReviewerEvaluation && aiReviewerEvaluationPath
      ? aiReviewerReceiptFields(aiReviewerEvaluation, aiReviewerEvaluationPath)
      : {}),
  };
}

export function buildAgentEvidenceRequestFromCli(argv = process.argv.slice(2)): JsonObject {
  const args = parseAgentEvidenceArgs(argv);
  const contracts = loadAgentContracts(args.agentRepo, args.productionAcceptancePath);
  const targetAgent = targetAgentIdentity(contracts, args.agentRepo);
  const aiReviewerEvaluation = args.aiReviewerEvaluationPath
    ? loadAiReviewerEvaluation(args.aiReviewerEvaluationPath)
    : null;

  const evaluationRequest = buildAgentEvidenceEvaluationRequest({
    agentRepo: args.agentRepo,
    contracts,
    aiReviewerEvaluation,
    aiReviewerEvaluationPath: args.aiReviewerEvaluationPath,
  });
  const capabilityCandidate = buildCapabilityCandidate({
    contracts,
    evaluationRequest,
    aiReviewerEvaluation,
    aiReviewerEvaluationPath: args.aiReviewerEvaluationPath,
    targetAgent,
  });
  const sourceRefs = [
    ...sourceContractRefs(contracts),
    ...productionAcceptanceEvidenceRefs(contracts.productionAcceptance),
  ];
  const reviewerRefs = aiReviewerEvaluation && args.aiReviewerEvaluationPath
    ? [
        args.aiReviewerEvaluationPath,
        ...aiReviewerEvaluation.source_refs,
        ...aiReviewerEvaluation.direct_evidence_refs,
      ]
    : [];
  const candidateRefs = [
    String(capabilityCandidate.candidate_id),
    ...([capabilityCandidate.expected_typed_blocker_ref]
      .filter((ref): ref is string => typeof ref === 'string')),
  ];
  const workOrderMaterializationRequest = buildWorkOrderMaterializationRequest({
    requestKind: 'foundry_evaluation',
    targetAgent: {
      domain_id: targetAgent.domainId,
      repo_dir: args.agentRepo,
      target_agent_ref: targetAgent.targetAgentRef,
      descriptor_ref: path.join(args.agentRepo, 'contracts/domain_descriptor.json'),
    },
    semanticRequest: {
      ...evaluationRequest,
      source_refs: sourceRefs,
      reviewer_refs: reviewerRefs,
      candidate_refs: candidateRefs,
    },
  });

  return {
    surface_kind: 'opl_meta_agent_agent_evidence_handoff',
    version: 'opl-meta-agent.agent-evidence-handoff.v1',
    status: aiReviewerEvaluation
      ? 'foundry_evaluation_semantic_request_ready_for_opl_materialization'
      : 'foundry_evaluation_semantic_request_ready_reviewer_evidence_missing',
    product_id: 'opl-meta-agent',
    target_agent: capabilityCandidate.target_agent,
    agent_building_judgment: {
      target_capability_improvement_candidate: capabilityCandidate,
      expected_typed_blocker_ref: capabilityCandidate.expected_typed_blocker_ref,
    },
    semantic_requests: {
      work_order_materialization_request: workOrderMaterializationRequest,
    },
    authority_boundary: workOrderMaterializationRequest.authority_boundary,
  };
}

if (import.meta.main) {
  try {
    process.stdout.write(`${JSON.stringify(buildAgentEvidenceRequestFromCli(), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
