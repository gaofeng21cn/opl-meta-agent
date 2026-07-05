#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { JsonObject } from './domain-pack.ts';
import {
  type AiReviewerEvaluation,
  aiReviewerReceiptFields,
  loadAiReviewerEvaluation,
} from './meta-agent-loop-ai-reviewer.ts';
import {
  runOpl,
  stableId,
  writeJson,
} from './meta-agent-loop-io.ts';
import {
  loadAgentContracts,
  parseAgentEvidenceArgs,
} from './agent-evidence-contracts.ts';
import {
  buildAgentEvolutionWorkOrderFields,
  buildOplWorkOrderPrimitiveRefs,
  buildRefsOnlyWorkOrderCompleteness,
  buildRuntimeConsumptionVerification,
  buildTargetPatchLoopMachineRefs,
  buildTargetProgressAccounting,
  buildTargetWorkspaceEnvironmentVerification,
  buildWorkOrderBundleRefs,
  buildWorkOrderCurrentness,
  targetPatchLoopCloseoutEvidence,
} from './work-order-builders.ts';
import {
  collectEfficiencyNonRegressionRefs,
  hasEfficiencyNonRegressionEvidence,
  missingEfficiencyNonRegressionFields,
} from './work-order-efficiency.ts';
import {
  buildStageNativeArtifactAttemptRefs,
} from './stage-native-artifact-contract.ts';
import {
  DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES,
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
import {
  validateDeveloperPatchWorkOrder,
} from './work-order-validation.ts';

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

const TARGET_AGENT_EDITABLE_SURFACES = [
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

export function buildAgentLabSuite({
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
  const nextVerificationRefs = verificationRefs(contracts.productionAcceptance);
  const noForbiddenRefs = noForbiddenWriteProofRefs(contracts, targetAgent);
  const reviewerEvidenceRefs = aiReviewerEvaluation && aiReviewerEvaluationPath
    ? [aiReviewerEvaluationPath, ...aiReviewerEvaluation.source_refs, ...aiReviewerEvaluation.direct_evidence_refs]
    : [];
  const stageNativeArtifactRefs = buildStageNativeArtifactAttemptRefs({
    domainId: targetAgent.domainId,
    stageId: 'agent-evidence-takeover',
    domainTruthOwner: 'opl-meta-agent',
    attemptId: 'production-evidence-tail',
  });
  const suiteSeed = [
    agentRepo,
    contracts.productionAcceptanceRef,
    contracts.productionAcceptance.domain_acceptance_receipt?.receipt_id,
    contracts.productionAcceptance.updated_at,
    aiReviewerEvaluationPath,
  ];
  const suiteId = stableId('agent_lab_suite', suiteSeed);
  return {
    suite_id: suiteId,
    suite_kind: 'agent_production_evidence_suite',
    suite_role: 'target_agent_production_evidence_tail_testing_takeover',
    target_agent_ref: targetAgent.targetAgentRef,
    source_contract_refs: sourceContractRefs(contracts),
    stage_native_artifact_refs: stageNativeArtifactRefs,
    production_evidence_gate: productionEvidenceGate(contracts, targetAgent),
    authority_boundary: {
      refs_only: true,
      can_generate_target_domain_owner_receipt: false,
      can_write_target_domain_truth: false,
      can_write_target_memory_body: false,
      can_mutate_target_artifact_body: false,
      can_authorize_target_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
      forbidden_write_surfaces: forbiddenWriteSurfaces(contracts, TARGET_AGENT_FORBIDDEN_WRITE_SURFACES),
    },
    tasks: [
      {
        task_id: `agent-lab-task:${targetAgent.domainId}/production-evidence-tail/testing-takeover`,
        domain_id: targetAgent.domainId,
        task_family: 'target_agent_production_evidence_tail_testing_takeover',
        target_agent_ref: targetAgent.targetAgentRef,
        target_agent_descriptor_ref: path.join(agentRepo, 'contracts/domain_descriptor.json'),
        environment: {
          environment_kind: 'external_repo_contract_intake',
          workspace_locator_ref: agentRepo,
          sandbox_policy: 'refs_only_no_target_domain_mutation',
          network_policy: 'target_owner_policy',
        },
        instructions_ref: `instructions:opl-meta-agent/${targetAgent.domainId}/production-evidence-tail-testing-takeover`,
        agent_entry_ref: `target-agent-entry:${targetAgent.domainId}`,
        stage_refs: [
          `stage:${targetAgent.domainId}/production-acceptance-contract-read`,
          `stage:${targetAgent.domainId}/agent-lab-handoff-suite-generation`,
          `stage:${targetAgent.domainId}/no-forbidden-write-verification`,
          `stage:${targetAgent.domainId}/developer-work-order-materialization`,
        ],
        oracle_refs: [
          `oracle:${targetAgent.domainId}/production-acceptance`,
          `oracle:${targetAgent.domainId}/owner-receipt-or-typed-blocker-route`,
        ],
        scorer_refs: [
          `scorer:${targetAgent.domainId}/no-forbidden-write-proof`,
          `scorer:${targetAgent.domainId}/refs-only-evidence-tail-handoff`,
        ],
        stage_native_artifact_refs: stageNativeArtifactRefs,
        stage_folder_contract: stageNativeArtifactRefs.stage_folder_contract,
        recovery_probes: [
          {
            probe_ref: `recovery-probe:${targetAgent.domainId}/production-evidence-tail/no-forbidden-write`,
            probe_kind: 'no_forbidden_authority_write',
            expected_status: 'passed',
            source_refs: [
              `${contracts.productionAcceptanceRef}#/authority_boundary`,
              'contracts/generated_surface_handoff.json#/generated_surface_policy/must_not_write',
            ],
          },
        ],
        trajectory: {
          trajectory_ref: `trajectory:${targetAgent.domainId}/production-evidence-tail/testing-takeover`,
          run_ref: `run:opl-meta-agent/${targetAgent.domainId}/production-evidence-tail`,
          agent_executor: 'codex_cli',
          stage_attempt_refs: [
            `stage-attempt:${targetAgent.domainId}/production-acceptance-contract-read`,
            `stage-attempt:${targetAgent.domainId}/agent-lab-handoff-suite-generation`,
          ],
          tool_call_refs: ['tool-call:opl-agent-lab-run-suite'],
          artifact_refs: [
            'agent-lab-suite.json',
            'developer-patch-work-order.json',
            'target-capability-improvement-candidate.json',
            'mechanism-patch-proposal.json',
            String(stageNativeArtifactRefs.manifest_ref),
            String(stageNativeArtifactRefs.canonical_artifact_ref),
          ],
          receipt_refs: [
            ...receiptRefs,
            String(stageNativeArtifactRefs.receipt_ref),
            String(stageNativeArtifactRefs.blocker_ref),
          ],
          stage_native_artifact_refs: stageNativeArtifactRefs,
          stage_folder_contract: stageNativeArtifactRefs.stage_folder_contract,
          repair_refs: [
            `repair-ref:${targetAgent.domainId}/evidence-tail/no-active-caller-proof`,
            `repair-ref:${targetAgent.domainId}/evidence-tail/opl-generated-surface-parity`,
            `repair-ref:${targetAgent.domainId}/evidence-tail/domain-receipt-parity`,
            `repair-ref:${targetAgent.domainId}/evidence-tail/independent-reviewer-auditor-receipt`,
            `repair-ref:${targetAgent.domainId}/evidence-tail/no-forbidden-write-proof`,
          ],
          trace_refs: ['trace-ref:opl-meta-agent/agent-evidence-tail-testing-takeover'],
        },
        scorecard: {
          scorecard_ref: `scorecard:${targetAgent.domainId}/production-evidence-tail/testing-takeover`,
          target_agent_owned: true,
          opl_scorecard_role: 'scorecard_ref_projection_only',
          passed: Boolean(aiReviewerEvaluation),
          metric_refs: [
            `metric-ref:${targetAgent.domainId}/no-forbidden-write-proof`,
            `metric-ref:${targetAgent.domainId}/target-owner-route-present`,
            `metric-ref:${targetAgent.domainId}/editable-surfaces-limited`,
            `metric-ref:${targetAgent.domainId}/verification-command-refs-present`,
            `metric-ref:${targetAgent.domainId}/ai-reviewer-evaluation-present`,
            `metric-ref:${targetAgent.domainId}/ai-reviewer-independent-attempt-present`,
          ],
          evidence_refs: [
            contracts.productionAcceptanceRef,
            String(stageNativeArtifactRefs.artifact_native_contract_ref),
            String(stageNativeArtifactRefs.stage_folder_contract_ref),
            'contracts/generated_surface_handoff.json',
            'contracts/owner_receipt_contract.json',
            ...receiptRefs,
            ...nextVerificationRefs,
            ...reviewerEvidenceRefs,
          ],
          review_refs: aiReviewerEvaluationPath ? [aiReviewerEvaluationPath] : [],
          quality_gate_refs: [
            `quality-gate:${targetAgent.domainId}/owner-receipt-or-typed-blocker`,
            `quality-gate:${targetAgent.domainId}/independent-reviewer-auditor-required`,
          ],
        },
        improvement_candidate: {
          candidate_ref: `improvement-candidate:${targetAgent.domainId}/production-evidence-tail/foundry-testing-takeover`,
          candidate_kind: 'production_evidence_tail_capability_gap',
          target_ref: `${targetAgent.targetAgentRef}/production-evidence-tail`,
          evidence_refs: [
            `${contracts.productionAcceptanceRef}#/codex_first_landing_program/shared_blockers`,
            ...receiptRefs,
          ],
          allowed_change_scope: 'branch_only',
          promotion_gate_ref: `promotion-gate:${targetAgent.domainId}/production-evidence-tail/owner-gated`,
        },
        promotion_gate: {
          gate_ref: `promotion-gate:${targetAgent.domainId}/production-evidence-tail/owner-gated`,
          gate_status: aiReviewerEvaluation ? 'blocked_requires_target_owner_gate' : 'blocked_missing_ai_reviewer_evaluation',
          required_refs: [
            `scorecard:${targetAgent.domainId}/production-evidence-tail/testing-takeover`,
            `owner-receipt-refs:${targetAgent.domainId}/production-evidence-tail`,
            ...noForbiddenRefs,
            ...nextVerificationRefs,
          ],
          regression_suite_refs: [
            `regression-suite:${targetAgent.domainId}/agent-lab-production-evidence-tail`,
            `regression-suite:${targetAgent.domainId}/no-forbidden-write-boundary`,
          ],
          no_forbidden_write_proof_refs: noForbiddenRefs,
        },
      },
    ],
    ...(aiReviewerEvaluation && aiReviewerEvaluationPath
      ? {
          ai_reviewer_evaluation_ref: aiReviewerEvaluationPath,
          ai_reviewer_evaluation: aiReviewerEvaluation,
        }
      : {}),
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
  const ownerRouteRefs = productionEvidenceGate(contracts, targetAgent).owner_route_refs as string[];
  const ownerRouteRef = ownerRouteRefs[0] ?? `owner-route:${targetAgent.domainId}/${targetAgent.owner}`;
  const stageNativeArtifactRefs = buildStageNativeArtifactAttemptRefs({
    domainId: targetAgent.domainId,
    stageId: 'agent-evidence-takeover',
    domainTruthOwner: 'opl-meta-agent',
    attemptId: workOrderId,
  });
  const targetEditableSurfaceRefs = stringList(capabilityCandidate.editable_surface_limits?.editable_surfaces);
  const forbiddenSurfaces = stringList(capabilityCandidate.editable_surface_limits?.forbidden_write_surfaces)
    .length
    ? stringList(capabilityCandidate.editable_surface_limits?.forbidden_write_surfaces)
    : TARGET_AGENT_FORBIDDEN_WRITE_SURFACES;
  const agentEvolutionReadback = buildAgentEvolutionWorkOrderFields({
    domainId: targetAgent.domainId,
    workOrderId,
    failureClass: 'quality-gate',
    ownerRouteRef,
    ownerRouteRefs,
    targetEditableSurfaceRefs,
    forbiddenSurfaces,
    expectedChangeRefs: stringList(capabilityCandidate.proposed_change_refs),
    expectedBehaviorSummary:
      'Target agent owner-gated source patch closes the production evidence quality-gate gap.',
    verificationRefs: requiredVerificationRefs,
    targetCloseoutRefs: bundleRefs.target_closeout_refs as string[],
    ownerReceiptOrTypedBlockerRef: String(machineCloseoutRefs.target_owner_receipt_or_typed_blocker_ref),
    readModelConsumptionRef: String(machineCloseoutRefs.target_runtime_read_model_consumption_ref),
  });
  agentEvolutionReadback.target_owner_route = {
    ...(capabilityCandidate.target_owner_route as JsonObject),
    ...(agentEvolutionReadback.target_owner_route as JsonObject),
  };
  return {
    surface_kind: 'opl_meta_agent_target_developer_patch_work_order',
    version: 'opl-meta-agent.target-developer-patch-work-order.v1',
    work_order_id: workOrderId,
    status: capabilityCandidate.ai_reviewer_status === 'present'
      ? 'ready_for_target_agent_source_patch_proposal'
      : 'blocked_missing_ai_reviewer_evaluation',
    target_agent: capabilityCandidate.target_agent,
    source_agent_lab_result_ref: suiteResult.result_id,
    ...agentEvolutionReadback,
    work_order_currentness: buildWorkOrderCurrentness({
      domainId: targetAgent.domainId,
      suiteResultRef: stringValue(suiteResult.result_id) ?? stableId('agent_lab_result', [workOrderId]),
      workOrderId,
      ownerRouteRef,
    }),
    target_capability_improvement_candidate_ref: capabilityCandidate.candidate_id,
    owner_receipt_refs_ref: ownerReceiptRefsPath,
    stage_native_artifact_refs: stageNativeArtifactRefs,
    artifact_native_contract_ref: stageNativeArtifactRefs.artifact_native_contract_ref,
    stage_folder_contract: stageNativeArtifactRefs.stage_folder_contract,
    editable_surface_limits: capabilityCandidate.editable_surface_limits,
    allowed_editable_surfaces: targetEditableSurfaceRefs,
    target_repo_file_hints: targetEditableSurfaceRefs,
    required_verification_refs: requiredVerificationRefs,
    rollback_version_refs: [
      'target_agent_current_head_ref',
      'developer_patch_branch_or_worktree_ref',
      'owner_receipt_or_typed_blocker_version_ref',
    ],
    owner_route_refs: ownerRouteRefs,
    target_owner_closeout_refs: bundleRefs.target_closeout_refs,
    forbidden_target_paths_or_surfaces: forbiddenSurfaces,
    owner_closeout_boundary: {
      owner: 'target-domain via OPL',
      owner_closeout_hook_delegated: true,
      target_owner_receipt_or_typed_blocker_required: true,
      target_owner_closeout_refs: bundleRefs.target_closeout_refs,
      oma_can_write_target_owner_receipt_body: false,
      oma_can_write_target_owner_typed_blocker_body: false,
      oma_can_create_target_typed_blocker: false,
      oma_can_invoke_target_owner_closeout_hook: false,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
    },
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
      ownerRouteRefs,
      noForbiddenWriteProofRefs: noForbiddenRefs,
      executorAllowedScope: 'refs_only_target_agent_owner_gated_patch_proposal',
      executorAllowedWriteSurfaces: TARGET_AGENT_EDITABLE_SURFACES,
      executorForbiddenWriteSurfaces: forbiddenSurfaces,
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
    required_opl_work_order_primitive_refs: buildOplWorkOrderPrimitiveRefs({
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
    target_progress_accounting: buildTargetProgressAccounting({
      substantiveDeliverableDeltaRefs: stringList(capabilityCandidate.proposed_change_refs),
      machineCloseoutRefs,
    }),
    implementation_controls: {
      proposal_only: true,
      refs_only: true,
      patch_must_be_limited_to_editable_surfaces: true,
      developer_must_read_target_agent_repo_context_before_editing: true,
      target_owner_receipt_or_typed_blocker_required: true,
      target_owner_receipt_generated_by_oma: false,
      stage_folder_runtime_state_written_by_oma: false,
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
      can_generate_target_domain_owner_receipt: false,
      can_write_stage_folder_runtime_state: false,
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
    repeat_budget: {
      max_attempts: 2,
      remaining_attempts: 0,
      repeat_scope: 'same_target_eval_work_order_owner_route_tuple',
    },
    dead_letter_refs: [
      `dead-letter:opl-meta-agent/${String(workOrder.target_agent?.domain_id ?? 'target-agent')}/${workOrder.work_order_id}`,
    ],
    escalation_refs: [
      ...stringList(workOrder.owner_route_refs),
      String(workOrder.work_order_completeness?.fail_closed_blocker_ref),
    ],
    next_allowed_action: 'supply_missing_refs_or_escalate_to_target_owner',
    next_owner: 'opl-meta-agent',
    target_owner_route: targetOwnerRoute(contracts),
    blocked_suite_result_ref: workOrder.source_agent_lab_result_ref,
    work_order_ref: workOrder.work_order_id,
    stage_native_artifact_refs: workOrder.stage_native_artifact_refs,
    artifact_native_contract_ref: workOrder.artifact_native_contract_ref,
    stage_folder_contract: workOrder.stage_folder_contract,
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
    required_opl_work_order_primitive_refs: workOrder.required_opl_work_order_primitive_refs,
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
      can_generate_target_domain_owner_receipt: false,
      can_write_stage_folder_runtime_state: false,
      can_write_target_domain_truth: false,
      can_authorize_target_quality_or_export: false,
      can_mutate_target_artifact_body: false,
      can_write_target_memory_body: false,
      can_promote_default_agent_without_gate: false,
    },
  };
}

export function materializeAgentEvidenceFromCli(argv = process.argv.slice(2)): JsonObject {
  const args = parseAgentEvidenceArgs(argv);
  fs.mkdirSync(args.outputDir, { recursive: true });
  const contracts = loadAgentContracts(args.agentRepo, args.productionAcceptancePath);
  const targetAgent = targetAgentIdentity(contracts, args.agentRepo);
  const aiReviewerEvaluation = args.aiReviewerEvaluationPath
    ? loadAiReviewerEvaluation(args.aiReviewerEvaluationPath)
    : null;

  const suite = buildAgentLabSuite({
    agentRepo: args.agentRepo,
    contracts,
    aiReviewerEvaluation,
    aiReviewerEvaluationPath: args.aiReviewerEvaluationPath,
  });
  const suitePath = path.join(args.outputDir, 'agent-lab-suite.json');
  writeJson(suitePath, suite);

  const agentLabRun = runOpl(args.oplBin, ['agent-lab', 'run', '--suite', suitePath, '--json']);
  const suiteResult = (agentLabRun.agent_lab_run?.suite_result ?? {
    result_id: stableId('agent_lab_result', [suite.suite_id, 'missing-opl-suite-result']),
    status: 'blocked',
    summary: {
      recovery_probe_count: 1,
      recovery_passed_count: 0,
      forbidden_authority_flag_count: 0,
    },
  }) as JsonObject;

  const ownerReceiptRefs = buildOwnerReceiptRefs(contracts, targetAgent);
  const ownerReceiptRefsPath = path.join(args.outputDir, 'owner-receipt-refs.json');
  writeJson(ownerReceiptRefsPath, ownerReceiptRefs);

  const capabilityCandidate = buildCapabilityCandidate({
    contracts,
    suite,
    suiteResult,
    aiReviewerEvaluation,
    aiReviewerEvaluationPath: args.aiReviewerEvaluationPath,
    targetAgent,
  });
  const capabilityPath = path.join(args.outputDir, 'target-capability-improvement-candidate.json');
  writeJson(capabilityPath, capabilityCandidate);

  const workOrder = buildDeveloperWorkOrder({
    contracts,
    suite,
    suiteResult,
    capabilityCandidate,
    ownerReceiptRefsPath,
    targetAgent,
  });
  const missingEfficiencyFields = missingEfficiencyNonRegressionFields(capabilityCandidate.efficiency_non_regression_refs);
  validateDeveloperPatchWorkOrder(workOrder, {
    allowMissingReviewerFields: !aiReviewerEvaluation,
  });
  const workOrderPath = path.join(args.outputDir, 'developer-patch-work-order.json');
  writeJson(workOrderPath, workOrder);

  const runPath = path.join(args.outputDir, 'agent-lab-run-result.json');
  writeJson(runPath, agentLabRun);

  const artifacts: JsonObject = {
    agent_lab_suite_path: suitePath,
    agent_lab_suite_run_path: runPath,
    owner_receipt_refs_path: ownerReceiptRefsPath,
    target_capability_improvement_candidate_path: capabilityPath,
    developer_patch_work_order_path: workOrderPath,
  };
  const learningLoop: JsonObject = {
    owner_receipt_refs: ownerReceiptRefs,
    target_capability_improvement_candidate: capabilityCandidate,
    developer_patch_work_order: workOrder,
  };

  let status = 'blocked_missing_ai_reviewer_evaluation';
  if (missingEfficiencyFields.length > 0) {
    const typedBlocker = buildTypedBlocker({
      contracts,
      suite,
      suiteResult,
      workOrder,
      status: 'blocked_efficiency_quality_floor_missing',
      blockedReason: 'efficiency_evidence_requires_quality_floor_refs',
      missingRequiredFields: missingEfficiencyFields,
    });
    const typedBlockerPath = path.join(args.outputDir, 'typed-blocker.json');
    writeJson(typedBlockerPath, typedBlocker);
    artifacts.typed_blocker_path = typedBlockerPath;
    learningLoop.typed_blocker = typedBlocker;
    status = 'blocked_efficiency_quality_floor_missing';
  } else if (aiReviewerEvaluation) {
    const mechanismPatchProposal = buildMechanismPatchProposal({
      suite,
      suiteResult,
      capabilityCandidate,
      workOrder,
      ownerReceiptRefsPath,
      targetAgent,
    });
    const mechanismPath = path.join(args.outputDir, 'mechanism-patch-proposal.json');
    writeJson(mechanismPath, mechanismPatchProposal);
    artifacts.mechanism_patch_proposal_path = mechanismPath;
    learningLoop.mechanism_patch_proposal = mechanismPatchProposal;
    status = suiteResult.status === 'passed'
      ? 'proposal_recorded_requires_target_owner_gate'
      : 'blocked_with_developer_patch_work_order';
  } else {
    const typedBlocker = buildTypedBlocker({ contracts, suite, suiteResult, workOrder });
    const typedBlockerPath = path.join(args.outputDir, 'typed-blocker.json');
    writeJson(typedBlockerPath, typedBlocker);
    artifacts.typed_blocker_path = typedBlockerPath;
    learningLoop.typed_blocker = typedBlocker;
  }

  return {
    surface_kind: 'opl_meta_agent_agent_evidence_materializer_result',
    version: 'opl-meta-agent.agent-evidence-materializer.v1',
    status,
    product_id: 'opl-meta-agent',
    target_agent: capabilityCandidate.target_agent,
    authority_boundary: {
      proposal_only: true,
      refs_only: true,
      can_write_target_domain_truth: false,
      can_write_target_memory_body: false,
      can_mutate_target_artifact_body: false,
      can_authorize_target_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
    },
    artifacts,
    opl_agent_lab: agentLabRun.agent_lab_run,
    learning_loop: learningLoop,
  };
}

function isDirectCliEntry(): boolean {
  return process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false;
}

if (isDirectCliEntry()) {
  try {
    process.stdout.write(`${JSON.stringify(materializeAgentEvidenceFromCli(), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
