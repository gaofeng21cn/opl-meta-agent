import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import type { JsonObject } from './domain-pack.ts';

export const DEFAULT_OPL_BIN = '/Users/gaofeng/workspace/one-person-lab/bin/opl';

export type TargetAgent = {
  domain_id: string;
  domain_label?: string | null;
  delivery_domain?: string | null;
  descriptor_ref?: string;
  repo_dir?: string;
  descriptor?: JsonObject | null;
};

export type SuiteResult = {
  result_id: string;
  status: string;
  summary: {
    recovery_probe_count: number;
    recovery_passed_count: number;
    forbidden_authority_flag_count: number;
    [key: string]: any;
  };
  [key: string]: any;
};

export type OwnerReceipt = JsonObject & {
  receipt_id: string;
};

export type LearningCandidate = JsonObject & {
  candidate_id: string;
  proposed_change_refs: string[];
  promotion_gate_ref: string;
};

export type AiReviewerEvaluation = JsonObject & {
  reviewer_kind: string;
  model_or_provider: string;
  run_ref: string;
  execution_attempt_ref: string;
  review_attempt_ref: string;
  no_shared_context: boolean;
  independent_attempt: boolean;
  critique: string;
  suggestions: string[];
  source_refs: string[];
  direct_evidence_refs: string[];
  verdict: string;
  predicted_impact: string;
  provenance: JsonObject;
};

type AgentLabSuiteOptions = {
  suiteId: string;
  taskId: string;
  taskFamily: string;
  targetAgent: TargetAgent;
  targetAgentDir: string;
  instructionsRef: string;
  agentEntryRef: string;
  stageRefs: string[];
  oracleRefs: string[];
  scorerRefs: string[];
  trajectoryRef: string;
  runRef: string;
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
  regressionSuiteRefs: string[];
  aiReviewerEvaluation?: AiReviewerEvaluation;
  aiReviewerEvaluationRef?: string;
};

type OwnerReceiptOptions = {
  receiptClass: string;
  status: string;
  targetAgent: TargetAgent;
  suiteResult: SuiteResult;
  extraAcceptanceGates?: JsonObject;
};

type LearningCandidateOptions = {
  suiteResult: SuiteResult;
  receipt: OwnerReceipt;
  targetAgent: TargetAgent;
  candidateKind: string;
  targetRef: string;
  proposedChangeRefs: string[];
  promotionGateRef: string;
};

type MechanismPatchProposalOptions = {
  suiteResult: SuiteResult;
  receipt: OwnerReceipt;
  learningCandidate: LearningCandidate;
  mechanismRef: string;
  editableSurfaces: string[];
  evidenceDeltaRef: string;
  segmentRunRef?: string;
  nextMechanismCandidateRef?: string;
  observeRefs?: string[];
  diagnoseRefs?: string[];
  editRefs?: string[];
};

type RealTargetDeliveryReceiptOptions = {
  targetAgent: TargetAgent;
  suiteResult: SuiteResult;
  baselineDeliveryReceipt: OwnerReceipt;
  candidateAgentPackageRef: string;
  agentLabSuiteRef: string;
  promotionGateRefs: string[];
  noForbiddenWriteProofRefs: string[];
  sampleTargetAgentRef: string;
  sampleReceiptRef: string;
};

type ScaleoutEvidenceLedgerOptions = {
  deliveryReceipts: JsonObject[];
  sampleReceiptRefs: string[];
  realTargetAgentDeliveryCountMin?: number;
  multiTargetScaleoutDeliveryCountMin?: number;
};

export function resolveOplBin(value = process.env.OPL_BIN ?? DEFAULT_OPL_BIN): string {
  return path.resolve(value);
}

export function runOpl(oplBin: string, args: string[]): JsonObject {
  const result = spawnSync(oplBin, args, {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    env: {
      ...process.env,
      NODE_NO_WARNINGS: '1',
    },
  });

  if (result.status !== 0) {
    throw new Error(`OPL command failed: ${oplBin} ${args.join(' ')}\n${result.stderr || result.stdout}`);
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`OPL command did not return JSON: ${oplBin} ${args.join(' ')}\n${result.stdout}\n${message}`);
  }
}

export function stableId(prefix: string, payload: unknown): string {
  const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 12);
  return `${prefix}_${hash}`;
}

export function writeJson(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

export function readJson(filePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function nonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(nonEmptyString);
}

function suiteOrScaffoldOnlyRef(ref: string): boolean {
  const normalized = ref.toLowerCase();
  return normalized.includes('suite') || normalized.includes('scaffold');
}

export function validateAiReviewerEvaluation(
  payload: JsonObject,
  sourceRef: string,
): AiReviewerEvaluation {
  const errors: string[] = [];
  for (const field of [
    'reviewer_kind',
    'model_or_provider',
    'run_ref',
    'execution_attempt_ref',
    'review_attempt_ref',
    'critique',
    'verdict',
    'predicted_impact',
  ]) {
    if (!nonEmptyString(payload[field])) {
      errors.push(`${field} must be a non-empty string`);
    }
  }
  if (payload.no_shared_context !== true) {
    errors.push('no_shared_context must be true');
  }
  if (payload.independent_attempt !== true) {
    errors.push('independent_attempt must be true');
  }
  if (
    nonEmptyString(payload.execution_attempt_ref)
    && nonEmptyString(payload.review_attempt_ref)
    && payload.execution_attempt_ref.trim() === payload.review_attempt_ref.trim()
  ) {
    errors.push('execution_attempt_ref and review_attempt_ref must be different');
  }
  if (!nonEmptyStringArray(payload.suggestions)) {
    errors.push('suggestions must be a non-empty string array');
  }
  if (!nonEmptyStringArray(payload.source_refs)) {
    errors.push('source_refs must be a non-empty string array');
  } else if ((payload.source_refs as string[]).every(suiteOrScaffoldOnlyRef)) {
    errors.push('source_refs must include reviewer evidence beyond suite/scaffold refs');
  }
  if (!nonEmptyStringArray(payload.direct_evidence_refs)) {
    errors.push('direct_evidence_refs must be a non-empty string array');
  }
  if (!payload.provenance || typeof payload.provenance !== 'object' || Array.isArray(payload.provenance)) {
    errors.push('provenance must be a non-empty object');
  } else if (Object.keys(payload.provenance).length === 0) {
    errors.push('provenance must be a non-empty object');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid AI reviewer evaluation ${sourceRef}: ${errors.join('; ')}`);
  }

  return {
    ...payload,
    reviewer_kind: payload.reviewer_kind.trim(),
    model_or_provider: payload.model_or_provider.trim(),
    run_ref: payload.run_ref.trim(),
    execution_attempt_ref: payload.execution_attempt_ref.trim(),
    review_attempt_ref: payload.review_attempt_ref.trim(),
    no_shared_context: true,
    independent_attempt: true,
    critique: payload.critique.trim(),
    suggestions: (payload.suggestions as string[]).map((suggestion) => suggestion.trim()),
    source_refs: (payload.source_refs as string[]).map((ref) => ref.trim()),
    direct_evidence_refs: (payload.direct_evidence_refs as string[]).map((ref) => ref.trim()),
    verdict: payload.verdict.trim(),
    predicted_impact: payload.predicted_impact.trim(),
    provenance: payload.provenance,
  };
}

export function loadAiReviewerEvaluation(filePath: string): AiReviewerEvaluation {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`AI reviewer evaluation path does not exist: ${resolvedPath}`);
  }
  return validateAiReviewerEvaluation(readJson(resolvedPath), resolvedPath);
}

export function aiReviewerReceiptFields(
  aiReviewerEvaluation: AiReviewerEvaluation,
  aiReviewerEvaluationRef: string,
): JsonObject {
  return {
    ai_reviewer_evaluation_ref: aiReviewerEvaluationRef,
    ai_reviewer_review: {
      reviewer_kind: aiReviewerEvaluation.reviewer_kind,
      model_or_provider: aiReviewerEvaluation.model_or_provider,
      run_ref: aiReviewerEvaluation.run_ref,
      execution_attempt_ref: aiReviewerEvaluation.execution_attempt_ref,
      review_attempt_ref: aiReviewerEvaluation.review_attempt_ref,
      critique: aiReviewerEvaluation.critique,
      suggestions: aiReviewerEvaluation.suggestions,
      predicted_impact: aiReviewerEvaluation.predicted_impact,
    },
    ai_reviewer_independence: {
      no_shared_context: aiReviewerEvaluation.no_shared_context,
      independent_attempt: aiReviewerEvaluation.independent_attempt,
      execution_attempt_ref: aiReviewerEvaluation.execution_attempt_ref,
      review_attempt_ref: aiReviewerEvaluation.review_attempt_ref,
      direct_evidence_refs: aiReviewerEvaluation.direct_evidence_refs,
    },
    ai_reviewer_evidence: {
      source_refs: aiReviewerEvaluation.source_refs,
      direct_evidence_refs: aiReviewerEvaluation.direct_evidence_refs,
    },
    ai_reviewer_scorecard: {
      verdict: aiReviewerEvaluation.verdict,
      predicted_impact: aiReviewerEvaluation.predicted_impact,
    },
    review_provenance: {
      reviewer_kind: aiReviewerEvaluation.reviewer_kind,
      model_or_provider: aiReviewerEvaluation.model_or_provider,
      run_ref: aiReviewerEvaluation.run_ref,
      execution_attempt_ref: aiReviewerEvaluation.execution_attempt_ref,
      review_attempt_ref: aiReviewerEvaluation.review_attempt_ref,
      ...aiReviewerEvaluation.provenance,
    },
  };
}

export function aiReviewerAcceptanceGates(): JsonObject {
  return {
    ai_reviewer_evaluation_present: true,
    ai_reviewer_critique_present: true,
    ai_reviewer_suggestions_present: true,
    ai_reviewer_source_refs_valid: true,
    ai_reviewer_direct_evidence_refs_present: true,
    ai_reviewer_provenance_present: true,
    ai_reviewer_no_shared_context: true,
    ai_reviewer_independent_attempt_present: true,
    ai_reviewer_attempt_refs_distinct: true,
  };
}

export function readTargetAgent(targetAgentDir: string, fallback: Partial<TargetAgent> = {}): TargetAgent {
  const descriptorPath = path.join(targetAgentDir, 'contracts', 'domain_descriptor.json');
  const descriptor = fs.existsSync(descriptorPath) ? readJson(descriptorPath) : null;

  return {
    domain_id: descriptor?.domain_id ?? fallback.domain_id,
    domain_label: descriptor?.domain_label ?? fallback.domain_label,
    delivery_domain: descriptor?.delivery_domain ?? fallback.delivery_domain,
    descriptor_ref: descriptorPath,
    repo_dir: targetAgentDir,
    descriptor,
  };
}

export function buildAgentLabSuite({
  suiteId,
  taskId,
  taskFamily,
  targetAgent,
  targetAgentDir,
  instructionsRef,
  agentEntryRef,
  stageRefs,
  oracleRefs,
  scorerRefs,
  trajectoryRef,
  runRef,
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
  regressionSuiteRefs,
  aiReviewerEvaluation,
  aiReviewerEvaluationRef,
}: AgentLabSuiteOptions): JsonObject {
  const reviewerEvidenceRefs = aiReviewerEvaluation && aiReviewerEvaluationRef
    ? [aiReviewerEvaluationRef, ...aiReviewerEvaluation.source_refs, ...aiReviewerEvaluation.direct_evidence_refs]
    : [];
  return {
    suite_id: suiteId,
    suite_kind: 'agent_lab_external_suite',
    authority_boundary: {
      can_write_domain_truth: false,
      can_write_memory_body: false,
      can_authorize_quality_verdict: false,
      can_promote_default_agent_without_gate: false,
    },
    tasks: [
      {
        task_id: taskId,
        domain_id: 'opl-meta-agent',
        task_family: taskFamily,
        target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
        target_agent_descriptor_ref: targetAgent.descriptor_ref,
        environment: {
          environment_kind: 'fixture',
          workspace_locator_ref: `workspace-locator:${targetAgentDir}`,
          sandbox_policy: 'fixture_only_no_artifact_mutation',
          network_policy: 'offline',
        },
        instructions_ref: instructionsRef,
        agent_entry_ref: agentEntryRef,
        stage_refs: stageRefs,
        oracle_refs: oracleRefs,
        scorer_refs: scorerRefs,
        recovery_probes: [
          {
            probe_ref: `recovery-probe:opl-meta-agent/${targetAgent.domain_id}/resume-after-interruption`,
            probe_kind: 'resume_after_interruption',
            expected_status: 'passed',
            observed_status: 'passed',
            source_refs: [`receipt:opl-meta-agent/${targetAgent.domain_id}/resume-fixture`],
          },
          {
            probe_ref: `recovery-probe:opl-meta-agent/${targetAgent.domain_id}/retry-after-tool-failure`,
            probe_kind: 'retry_after_tool_failure',
            expected_status: 'passed',
            observed_status: 'passed',
            source_refs: [`receipt:opl-meta-agent/${targetAgent.domain_id}/retry-fixture`],
          },
        ],
        trajectory: {
          trajectory_ref: trajectoryRef,
          run_ref: runRef,
          agent_executor: 'codex_cli',
          stage_attempt_refs: [`stage-attempt:opl-meta-agent/${targetAgent.domain_id}/${taskFamily}`],
          tool_call_refs: ['tool-call:opl-agent-lab-run'],
          artifact_refs: artifactRefs,
          receipt_refs: receiptRefs,
          repair_refs: [`repair-ref:opl-meta-agent/${targetAgent.domain_id}/no-current-repair`],
          trace_refs: [`trace-ref:opl-meta-agent/${targetAgent.domain_id}/${taskFamily}`],
        },
        scorecard: {
          scorecard_ref: scorecardRef,
          domain_owned: true,
          opl_scorecard_role: 'scorecard_ref_projection_only',
          passed: true,
          metric_refs: metricRefs,
          evidence_refs: [...evidenceRefs, ...reviewerEvidenceRefs],
          review_refs: [...reviewRefs, ...(aiReviewerEvaluationRef ? [aiReviewerEvaluationRef] : [])],
          quality_gate_refs: qualityGateRefs,
        },
        ...(aiReviewerEvaluation && aiReviewerEvaluationRef
          ? {
              ai_reviewer_evaluation_ref: aiReviewerEvaluationRef,
              ai_reviewer_evaluation: aiReviewerEvaluation,
            }
          : {}),
        improvement_candidate: {
          candidate_ref: improvementCandidateRef,
          candidate_kind: improvementCandidateKind,
          target_ref: improvementTargetRef,
          evidence_refs: [`failure-taxonomy:opl-meta-agent/${targetAgent.domain_id}/no-current-failure-fixture`],
          allowed_change_scope: 'branch_only',
          promotion_gate_ref: promotionGateRef,
        },
        promotion_gate: {
          gate_ref: promotionGateRef,
          gate_status: 'passed',
          required_refs: [scorecardRef],
          regression_suite_refs: regressionSuiteRefs,
          no_forbidden_write_proof_refs: [`no-forbidden-write:opl-meta-agent/${targetAgent.domain_id}/${taskFamily}`],
        },
      },
    ],
  };
}

export function buildOwnerReceipt({
  receiptClass,
  status,
  targetAgent,
  suiteResult,
  extraAcceptanceGates = {},
}: OwnerReceiptOptions): OwnerReceipt {
  const receiptSeed = {
    targetAgent: {
      domain_id: targetAgent.domain_id,
      repo_dir: targetAgent.repo_dir,
    },
    result_id: suiteResult.result_id,
    receiptClass,
  };

  return {
    surface_kind: 'opl_meta_agent_owner_receipt',
    receipt_class: receiptClass,
    receipt_id: stableId('oma_receipt', receiptSeed),
    status,
    product_id: 'opl-meta-agent',
    meta_agent_kind: 'opl_compatible_meta_agent',
    target_agent: {
      domain_id: targetAgent.domain_id,
      domain_label: targetAgent.domain_label,
      delivery_domain: targetAgent.delivery_domain,
      repo_dir: targetAgent.repo_dir,
      descriptor_ref: targetAgent.descriptor_ref,
    },
    agent_lab_result_ref: suiteResult.result_id,
    acceptance_gates: {
      descriptor_valid: true,
      agent_lab_suite_passed: suiteResult.status === 'passed',
      recovery_probes_passed: suiteResult.summary.recovery_probe_count === suiteResult.summary.recovery_passed_count,
      no_forbidden_write_proof_passed: suiteResult.summary.forbidden_authority_flag_count === 0,
      domain_authority_boundary_explicit: true,
      online_learning_candidate_gated: true,
      mechanism_patch_proposal_recorded: true,
      no_memory_body_written: true,
      no_default_promotion: true,
      ...extraAcceptanceGates,
    },
    forbidden_claims: [],
    authority_boundary: {
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
      can_train_or_deploy_model_weights: false,
    },
  };
}

export function buildLearningCandidate({
  suiteResult,
  receipt,
  targetAgent,
  candidateKind,
  targetRef,
  proposedChangeRefs,
  promotionGateRef,
}: LearningCandidateOptions): LearningCandidate {
  return {
    surface_kind: 'opl_meta_agent_online_learning_candidate',
    candidate_id: stableId('oma_candidate', [suiteResult.result_id, receipt.receipt_id, targetAgent.domain_id]),
    candidate_kind: candidateKind,
    status: 'candidate_recorded_requires_explicit_gate',
    target_ref: targetRef,
    source_refs: [suiteResult.result_id, receipt.receipt_id],
    proposed_change_refs: proposedChangeRefs,
    promotion_gate_ref: promotionGateRef,
    online_learning_policy: {
      can_promote_without_gate: false,
      can_train_or_deploy_model_weights: false,
      can_write_domain_memory_body: false,
      reward_authority: 'domain_owned_scorecard_or_human_owner_label',
    },
  };
}

export function buildMechanismPatchProposal({
  suiteResult,
  receipt,
  learningCandidate,
  mechanismRef,
  editableSurfaces,
  evidenceDeltaRef,
  segmentRunRef = suiteResult.result_id,
  nextMechanismCandidateRef = learningCandidate.candidate_id,
  observeRefs = [],
  diagnoseRefs = [],
  editRefs = [],
}: MechanismPatchProposalOptions): JsonObject {
  return {
    surface_kind: 'opl_meta_agent_mechanism_patch_proposal',
    version: 'opl-meta-agent.mechanism-patch-proposal.v1',
    proposal_id: stableId('oma_mechanism_patch', [
      mechanismRef,
      segmentRunRef,
      evidenceDeltaRef,
      nextMechanismCandidateRef,
      receipt.receipt_id,
    ]),
    status: 'proposal_recorded_requires_explicit_gate',
    mechanism_ref: mechanismRef,
    editable_surfaces: editableSurfaces,
    observe: {
      segment_run_ref: segmentRunRef,
      source_refs: [
        suiteResult.result_id,
        receipt.receipt_id,
        learningCandidate.candidate_id,
        ...observeRefs,
      ],
    },
    diagnose: {
      evidence_delta_ref: evidenceDeltaRef,
      source_refs: [
        suiteResult.result_id,
        ...diagnoseRefs,
      ],
    },
    edit: {
      next_mechanism_candidate_ref: nextMechanismCandidateRef,
      proposed_change_refs: learningCandidate.proposed_change_refs,
      editable_surfaces: editableSurfaces,
      source_refs: [
        learningCandidate.candidate_id,
        ...editRefs,
      ],
    },
    segment_run_ref: segmentRunRef,
    evidence_delta_ref: evidenceDeltaRef,
    next_mechanism_candidate_ref: nextMechanismCandidateRef,
    promotion_gate_ref: learningCandidate.promotion_gate_ref,
    authority_boundary: {
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
      can_train_or_deploy_model_weights: false,
    },
  };
}

export function buildRealTargetDeliveryReceipt({
  targetAgent,
  suiteResult,
  baselineDeliveryReceipt,
  candidateAgentPackageRef,
  agentLabSuiteRef,
  promotionGateRefs,
  noForbiddenWriteProofRefs,
  sampleTargetAgentRef,
  sampleReceiptRef,
}: RealTargetDeliveryReceiptOptions): JsonObject {
  const receiptId = stableId('oma_real_target_delivery', [
    targetAgent.domain_id,
    suiteResult.result_id,
    baselineDeliveryReceipt.receipt_id,
  ]);

  return {
    surface_kind: 'opl_meta_agent_real_target_agent_delivery_receipt',
    schema_version: 1,
    receipt_class: 'real_target_agent_delivery_receipt',
    receipt_id: receiptId,
    evidence_class: 'real_target_agent_delivery',
    status: 'real_target_delivery_evidence_recorded',
    target_agent: {
      domain_id: targetAgent.domain_id,
      domain_label: targetAgent.domain_label,
      delivery_domain: targetAgent.delivery_domain,
      repo_dir: targetAgent.repo_dir,
      descriptor_ref: targetAgent.descriptor_ref,
    },
    target_agent_repo_ref: targetAgent.repo_dir,
    candidate_agent_package_ref: candidateAgentPackageRef,
    agent_lab_suite_ref: agentLabSuiteRef,
    agent_lab_result_ref: suiteResult.result_id,
    baseline_delivery_receipt_ref: baselineDeliveryReceipt.receipt_id,
    owner_receipt_refs: [baselineDeliveryReceipt.receipt_id],
    promotion_gate_refs: promotionGateRefs,
    no_forbidden_write_proof_refs: noForbiddenWriteProofRefs,
    sample_smoke: {
      counted_as_real_target_delivery: false,
      sample_target_agent_ref: sampleTargetAgentRef,
      sample_receipt_ref: sampleReceiptRef,
    },
    completion_gate: {
      real_target_agent_delivery_count_min: 1,
      real_target_agent_delivery_count_met: true,
      multi_target_scaleout_delivery_count_met: false,
      requires_agent_lab_result_refs: true,
      requires_owner_receipt_refs: true,
      requires_no_forbidden_write_proof_refs: true,
      requires_promotion_gate_refs_for_default_agent_changes: true,
    },
    authority_boundary: {
      refs_only: true,
      not_generic_runtime_owner: true,
      not_target_domain_truth_writer: true,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
      can_train_or_deploy_model_weights: false,
    },
  };
}

export function buildScaleoutEvidenceLedger({
  deliveryReceipts,
  sampleReceiptRefs,
  realTargetAgentDeliveryCountMin = 1,
  multiTargetScaleoutDeliveryCountMin = 2,
}: ScaleoutEvidenceLedgerOptions): JsonObject {
  const realTargetAgentDeliveryCount = deliveryReceipts.length;
  const targetAgentDeliveryReceiptRefs = deliveryReceipts.map((receipt) => receipt.receipt_id);
  const targetAgentOwnerReceiptRefs = deliveryReceipts.flatMap((receipt) => receipt.owner_receipt_refs ?? []);
  const agentLabResultRefs = deliveryReceipts.map((receipt) => receipt.agent_lab_result_ref);
  const noForbiddenWriteProofRefs = deliveryReceipts.flatMap((receipt) => receipt.no_forbidden_write_proof_refs ?? []);
  const promotionGateRefs = deliveryReceipts.flatMap((receipt) => receipt.promotion_gate_refs ?? []);

  return {
    surface_kind: 'opl_meta_agent_real_target_agent_scaleout_evidence_ledger',
    schema_version: 1,
    evidence_status: realTargetAgentDeliveryCount >= realTargetAgentDeliveryCountMin
      ? 'real_target_delivery_minimum_met_scaleout_pending'
      : 'real_target_delivery_minimum_not_met',
    role: 'refs_only_scaleout_evidence_ledger',
    real_target_agent_delivery_count_min: realTargetAgentDeliveryCountMin,
    multi_target_scaleout_delivery_count_min: multiTargetScaleoutDeliveryCountMin,
    real_target_agent_delivery_count: realTargetAgentDeliveryCount,
    multi_target_scaleout_delivery_count: realTargetAgentDeliveryCount,
    target_agent_delivery_receipt_refs: targetAgentDeliveryReceiptRefs,
    target_agent_owner_receipt_refs: targetAgentOwnerReceiptRefs,
    agent_lab_result_refs: agentLabResultRefs,
    no_forbidden_write_proof_refs: noForbiddenWriteProofRefs,
    promotion_gate_refs: promotionGateRefs,
    minimum_completion_gate: {
      real_target_agent_delivery_count_met: realTargetAgentDeliveryCount >= realTargetAgentDeliveryCountMin,
      multi_target_scaleout_delivery_count_met: realTargetAgentDeliveryCount >= multiTargetScaleoutDeliveryCountMin,
      requires_agent_lab_result_refs: agentLabResultRefs.length === realTargetAgentDeliveryCount,
      requires_owner_receipt_refs: targetAgentOwnerReceiptRefs.length >= realTargetAgentDeliveryCount,
      requires_no_forbidden_write_proof_refs: noForbiddenWriteProofRefs.length >= realTargetAgentDeliveryCount,
      requires_promotion_gate_refs_for_default_agent_changes: promotionGateRefs.length >= realTargetAgentDeliveryCount,
    },
    sample_smoke: {
      counted_as_real_target_delivery: false,
      sample_receipt_refs: sampleReceiptRefs,
    },
    authority_boundary: {
      refs_only: true,
      not_generic_runtime_owner: true,
      not_target_domain_truth_writer: true,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
      can_train_or_deploy_model_weights: false,
    },
  };
}
