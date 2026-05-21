#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type DomainPackSummary,
  type JsonObject,
  domainPackReceiptFields,
  readDomainPackSummary,
} from './lib/domain-pack.ts';
import {
  type AiReviewerEvaluation,
  type LearningCandidate,
  type OwnerReceipt,
  type SuiteResult,
  type TargetAgent,
  aiReviewerAcceptanceGates,
  aiReviewerReceiptFields,
  buildLearningCandidate,
  buildMechanismPatchProposal,
  buildOwnerReceipt,
  loadAiReviewerEvaluation,
  readJson,
  readTargetAgent,
  resolveOplBin,
  runOpl,
  stableId,
  writeJson,
} from './lib/meta-agent-loop.ts';
import {
  buildOplAgentLabOwnedPrimitiveRefs,
  buildRefsOnlyWorkOrderCompleteness,
  buildRuntimeConsumptionVerification,
  buildTargetPatchLoopMachineRefs,
  buildTargetWorkspaceEnvironmentVerification,
  buildWorkOrderBundleRefs,
  targetPatchLoopCloseoutEvidence,
  validateDeveloperPatchWorkOrder,
} from './lib/work-order-policy.ts';
import {
  type PatchTraceabilityEntry,
  type TargetImprovementPolicy,
  buildPatchTraceabilityMatrix,
  inferProposedChangeRefs,
  mechanismEditableSurfaces,
  targetEditableSurfaceRefs,
  targetImprovementPolicy,
} from './lib/target-improvement-policy.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

type ImproveArgs = {
  suitePath: string;
  targetAgentDir: string;
  outputDir: string;
  feedbackRef: string | null;
  oplBin: string;
  aiReviewerEvaluationPath: string;
};

type CapabilityCandidate = JsonObject & {
  candidate_id: string;
  target_agent: JsonObject;
  authority_boundary: JsonObject;
  target_editable_surface_refs: string[];
  proposed_change_refs: string[];
  patch_traceability_matrix: PatchTraceabilityEntry[];
};

function parseArgs(argv: string[]): ImproveArgs {
  const parsed: {
    suitePath: string | null;
    targetAgentDir: string | null;
    outputDir: string | null;
    feedbackRef: string | null;
    oplBin: string;
    aiReviewerEvaluationPath: string | null;
  } = {
    suitePath: null,
    targetAgentDir: null,
    outputDir: null,
    feedbackRef: null,
    oplBin: resolveOplBin(),
    aiReviewerEvaluationPath: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];
    if (token === '--suite') {
      if (!value) {
        throw new Error('Missing value for --suite.');
      }
      parsed.suitePath = path.resolve(value);
      index += 1;
      continue;
    }
    if (token === '--target-agent-dir' || token === '--agent-dir') {
      if (!value) {
        throw new Error(`Missing value for ${token}.`);
      }
      parsed.targetAgentDir = path.resolve(value);
      index += 1;
      continue;
    }
    if (token === '--output-dir') {
      if (!value) {
        throw new Error('Missing value for --output-dir.');
      }
      parsed.outputDir = path.resolve(value);
      index += 1;
      continue;
    }
    if (token === '--feedback-ref') {
      if (!value) {
        throw new Error('Missing value for --feedback-ref.');
      }
      parsed.feedbackRef = value;
      index += 1;
      continue;
    }
    if (token === '--ai-reviewer-evaluation') {
      if (!value) {
        throw new Error('Missing value for --ai-reviewer-evaluation.');
      }
      parsed.aiReviewerEvaluationPath = path.resolve(value);
      index += 1;
      continue;
    }
    if (token === '--opl-bin') {
      if (!value) {
        throw new Error('Missing value for --opl-bin.');
      }
      parsed.oplBin = resolveOplBin(value);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}.`);
  }

  if (!parsed.suitePath) {
    throw new Error('Missing required --suite <path>.');
  }
  if (!fs.existsSync(parsed.suitePath)) {
    throw new Error(`Suite path does not exist: ${parsed.suitePath}`);
  }
  if (!parsed.targetAgentDir) {
    throw new Error('Missing required --target-agent-dir <path>.');
  }
  if (!fs.existsSync(parsed.targetAgentDir)) {
    throw new Error(`Target agent path does not exist: ${parsed.targetAgentDir}`);
  }
  if (!parsed.aiReviewerEvaluationPath) {
    throw new Error(
      'Missing required --ai-reviewer-evaluation <path>; external-suite improvement fails closed without structured AI reviewer evaluation.',
    );
  }

  parsed.outputDir ??= fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-external-suite-'));
  return {
    suitePath: parsed.suitePath,
    targetAgentDir: parsed.targetAgentDir,
    outputDir: parsed.outputDir,
    feedbackRef: parsed.feedbackRef,
    oplBin: parsed.oplBin,
    aiReviewerEvaluationPath: parsed.aiReviewerEvaluationPath,
  };
}

function collectSuiteRefs(suite: JsonObject): string[] {
  const refs: unknown[] = [];
  for (const task of Array.isArray(suite.tasks) ? suite.tasks : []) {
    refs.push(task.task_id, task.task_family, task.instructions_ref, task.agent_entry_ref);
    refs.push(...arrayOfStrings(task.stage_refs));
    refs.push(...arrayOfStrings(task.oracle_refs));
    refs.push(...arrayOfStrings(task.scorer_refs));
    refs.push(...arrayOfStrings(task.trajectory?.artifact_refs));
    refs.push(...arrayOfStrings(task.trajectory?.repair_refs));
    refs.push(...arrayOfStrings(task.scorecard?.metric_refs));
    refs.push(...arrayOfStrings(task.scorecard?.evidence_refs));
    refs.push(...arrayOfStrings(task.improvement_candidate?.evidence_refs));
    refs.push(task.improvement_candidate?.target_ref, task.improvement_candidate?.candidate_kind);
  }
  return refs
    .filter((ref): ref is string => typeof ref === 'string' && ref.trim().length > 0)
    .map((ref) => ref.trim());
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function improvementAreaForTarget(targetAgent: TargetAgent): string {
  return `${targetAgent.domain_id.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_agent_lab_result_consumption_capability`;
}

function targetCapabilityRef(targetAgent: TargetAgent): string {
  return `domain-agent:${targetAgent.domain_id}/agent-lab-result-consumption-capability`;
}

function buildCapabilityCandidate({
  targetAgent,
  suite,
  suiteResult,
  receipt,
  proposedChangeRefs,
  suiteRefs,
  feedbackRef,
  patchTraceabilityMatrix,
  domainPackSummary,
  aiReviewerEvaluation,
  aiReviewerEvaluationRef,
  policy,
}: {
  targetAgent: TargetAgent;
  suite: JsonObject;
  suiteResult: SuiteResult;
  receipt: OwnerReceipt;
  proposedChangeRefs: string[];
  suiteRefs: string[];
  feedbackRef: string | null;
  patchTraceabilityMatrix: PatchTraceabilityEntry[];
  domainPackSummary: DomainPackSummary;
  aiReviewerEvaluation: AiReviewerEvaluation;
  aiReviewerEvaluationRef: string;
  policy: TargetImprovementPolicy;
}): CapabilityCandidate {
  return {
    surface_kind: 'opl_meta_agent_target_agent_capability_improvement_candidate',
    version: 'opl-meta-agent.target-capability-improvement-candidate.v1',
    candidate_id: stableId('oma_target_capability_candidate', [
      targetAgent.domain_id,
      suite.suite_id,
      suiteResult.result_id,
      proposedChangeRefs,
    ]),
    status: 'candidate_recorded_requires_target_owner_gate',
    product_id: 'opl-meta-agent',
    target_agent: {
      domain_id: targetAgent.domain_id,
      domain_label: targetAgent.domain_label,
      delivery_domain: targetAgent.delivery_domain,
      repo_dir: targetAgent.repo_dir,
      descriptor_ref: targetAgent.descriptor_ref,
    },
    source_agent_lab_suite: {
      suite_id: suite.suite_id,
      suite_kind: suite.suite_kind,
      result_id: suiteResult.result_id,
      result_status: suiteResult.status,
      suite_passed: suiteResult.status === 'passed',
    },
    feedback_ref: feedbackRef,
    ai_reviewer_evaluation: aiReviewerEvaluation,
    ...aiReviewerReceiptFields(aiReviewerEvaluation, aiReviewerEvaluationRef),
    improvement_area: improvementAreaForTarget(targetAgent),
    failure_taxonomy_refs: suiteRefs.filter((ref) =>
      ref.includes('rubric-gap:')
      || ref.includes('metric-ref:')
      || ref.includes('quality-scorecard:')
      || ref.includes('repair-ref:')
    ).concat(aiReviewerEvaluation.source_refs),
    proposed_change_refs: proposedChangeRefs,
    patch_traceability_matrix: patchTraceabilityMatrix,
    traceability_status: patchTraceabilityMatrix.length
      ? 'gap_to_patch_refs_mapped'
      : 'generic_patch_refs_only',
    ...domainPackReceiptFields(domainPackSummary),
    source_domain_pack: domainPackSummary,
    target_editable_surface_refs: targetEditableSurfaceRefs(proposedChangeRefs),
    external_learning_refs: policy.externalLearningRefs,
    owner_receipt_ref: receipt.receipt_id,
    authority_boundary: {
      source_patch_allowed_after_owner_gate: suiteResult.status !== 'passed',
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
      can_train_or_deploy_model_weights: false,
    },
  };
}

function buildDeveloperPatchWorkOrder({
  targetAgent,
  suite,
  suiteResult,
  receipt,
  capabilityCandidate,
  policy,
}: {
  targetAgent: TargetAgent;
  suite: JsonObject;
  suiteResult: SuiteResult;
  receipt: OwnerReceipt;
  capabilityCandidate: CapabilityCandidate;
  policy: TargetImprovementPolicy;
}): JsonObject {
  const noPatchRequired = suiteResult.status === 'passed';
  const workOrderId = stableId('oma_developer_patch_work_order', [
    targetAgent.domain_id,
    suite.suite_id,
    suiteResult.result_id,
    capabilityCandidate.candidate_id,
  ]);
  const targetRepoFileHints = unique(capabilityCandidate.patch_traceability_matrix.flatMap((entry) =>
    entry.target_repo_file_hints
  ));
  const requiredVerificationRefs = noPatchRequired
    ? [
        'target_owner_receipt_projection_ref',
        'no_target_domain_truth_write_proof',
      ]
    : unique(capabilityCandidate.patch_traceability_matrix.flatMap((entry) =>
        entry.required_verification_refs
      )).concat([
        'target_runtime_consumption_verification_receipt',
        'target_workspace_environment_consumption_receipt',
      ]);
  const noForbiddenWriteProofRefs = noPatchRequired
    ? ['no_target_domain_truth_write_proof']
    : ['no_target_domain_truth_write_proof', 'repo_hygiene_no_checkout_venv_proof'];
  const failureEvidence = unique([
    ...capabilityCandidate.failure_taxonomy_refs,
    ...capabilityCandidate.ai_reviewer_evidence.source_refs,
    ...capabilityCandidate.ai_reviewer_evidence.direct_evidence_refs,
  ]);
  const patchMode = noPatchRequired ? 'no-source-patch' : 'source-patch';
  const reviewerPoolRefs = unique([
    String(capabilityCandidate.ai_reviewer_evaluation_ref),
    ...capabilityCandidate.ai_reviewer_evidence.source_refs,
    ...capabilityCandidate.ai_reviewer_evidence.direct_evidence_refs,
  ]);
  const machineCloseoutRefs = buildTargetPatchLoopMachineRefs({
    domainId: targetAgent.domain_id,
    suiteResultRef: suiteResult.result_id,
    workOrderId,
    requiredVerificationRefs,
    noForbiddenWriteProofRefs,
    patchMode,
  });
  const bundleRefs = buildWorkOrderBundleRefs({
    domainId: targetAgent.domain_id,
    workOrderId,
    reviewerRefs: reviewerPoolRefs,
    machineCloseoutRefs,
  });
  return {
    surface_kind: 'opl_meta_agent_developer_patch_work_order',
    version: 'opl-meta-agent.developer-patch-work-order.v1',
    work_order_id: workOrderId,
    status: noPatchRequired ? 'no_patch_required' : 'ready_for_target_agent_source_patch',
    product_id: 'opl-meta-agent',
    target_agent: capabilityCandidate.target_agent,
    source_agent_lab_result_ref: suiteResult.result_id,
    target_capability_improvement_candidate_ref: capabilityCandidate.candidate_id,
    owner_receipt_ref: receipt.receipt_id,
    ai_reviewer_evaluation_ref: capabilityCandidate.ai_reviewer_evaluation_ref,
    ai_reviewer_review: capabilityCandidate.ai_reviewer_review,
    ai_reviewer_independence: capabilityCandidate.ai_reviewer_independence,
    ai_reviewer_evidence: capabilityCandidate.ai_reviewer_evidence,
    ai_reviewer_scorecard: capabilityCandidate.ai_reviewer_scorecard,
    ai_reviewer_recovery_refs: capabilityCandidate.ai_reviewer_recovery_refs,
    review_provenance: capabilityCandidate.review_provenance,
    ...bundleRefs,
    work_order_completeness: buildRefsOnlyWorkOrderCompleteness({
      requiredFieldsPresent: true,
      executorLeaseRef: String(bundleRefs.executor_lease_ref),
      reviewerPoolRefs,
      patchExecutionBundleRef: String(bundleRefs.patch_execution_bundle_ref),
      targetCloseoutRefs: bundleRefs.target_closeout_refs as string[],
      reviewerRefs: reviewerPoolRefs,
      workOrderId,
      proposedChangeRefs: capabilityCandidate.proposed_change_refs,
      traceabilityStatus: noPatchRequired ? 'no_source_patch_required' : capabilityCandidate.traceability_status,
      requiredVerificationRefs,
      targetVerificationExtraRefs: [
        'target_owner_receipt_or_typed_blocker',
        noPatchRequired ? 'target_owner_receipt_projection_ref' : 'target_repo_test_receipt',
      ],
      ownerRouteRefs: [
        `target-agent-owner:${capabilityCandidate.target_agent.domain_id}`,
        `target-owner-receipt-or-typed-blocker:${capabilityCandidate.target_agent.domain_id}/${workOrderId}`,
      ],
      noForbiddenWriteProofRefs,
      executorAllowedScope: noPatchRequired ? 'coordination_record_only' : 'target_agent_owner_gated_patch',
      executorAllowedWriteSurfaces: noPatchRequired ? [] : capabilityCandidate.target_editable_surface_refs,
      executorForbiddenWriteSurfaces: [
        'target_domain_truth',
        'target_domain_memory_body',
        'target_domain_artifact_body',
        'target_quality_or_export_verdict',
        'default_agent_promotion_without_gate',
      ],
      canaryRefs: [
        ...(capabilityCandidate.ai_reviewer_evaluation.canary_refs ?? []),
        `agent-lab-canary:${suiteResult.result_id}`,
      ],
      rollbackRefs: [
        ...(capabilityCandidate.ai_reviewer_evaluation.rollback_refs ?? []),
        ...noForbiddenWriteProofRefs,
        noPatchRequired ? 'owner_receipt_coordination_record' : 'target_agent_previous_head_ref',
      ],
      versionRefs: [
        ...(capabilityCandidate.ai_reviewer_evaluation.version_refs ?? []),
        noPatchRequired ? 'owner_receipt_coordination_record' : 'git_commit',
      ],
      failClosedBlockerRef:
        `typed-blocker:opl-meta-agent/${capabilityCandidate.target_agent.domain_id}/${workOrderId}/missing-required-work-order-field`,
    }),
    required_opl_agent_lab_primitive_refs: buildOplAgentLabOwnedPrimitiveRefs({
      domainId: targetAgent.domain_id,
      workOrderId,
      patchMode,
      promotionGateRef: `promotion-gate:opl-meta-agent/${targetAgent.domain_id}/external-suite-self-evolution`,
    }),
    ahe_developer_work_order: {
      failure_evidence: failureEvidence,
      root_cause: noPatchRequired
        ? 'Agent Lab result passed; remaining work is coordination and owner receipt projection proof.'
        : 'Agent Lab and independent AI reviewer evidence identify target-agent capability gaps that require owner-gated source changes.',
      targeted_fix: noPatchRequired
        ? ['record coordination result and preserve target owner receipt authority']
        : capabilityCandidate.proposed_change_refs,
      predicted_impact: capabilityCandidate.ai_reviewer_review.predicted_impact,
    },
    required_patch_surfaces: noPatchRequired ? [] : capabilityCandidate.target_editable_surface_refs,
    allowed_editable_surfaces: noPatchRequired ? [] : capabilityCandidate.target_editable_surface_refs,
    target_repo_file_hints: noPatchRequired ? [] : targetRepoFileHints,
    required_verification_refs: requiredVerificationRefs,
    rollback_version_refs: noPatchRequired
      ? ['owner_receipt_coordination_record']
      : ['git_commit', 'target_agent_previous_head_ref', 'temporary_worktree_ref'],
    owner_route_refs: [
      `target-agent-owner:${targetAgent.domain_id}`,
      `promotion-gate:opl-meta-agent/${targetAgent.domain_id}/external-suite-self-evolution`,
    ],
    no_forbidden_write_proof: {
      required: true,
      proof_refs: noForbiddenWriteProofRefs,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
    },
    machine_closeout_refs: machineCloseoutRefs,
    proposed_change_refs: capabilityCandidate.proposed_change_refs,
    patch_traceability_matrix: noPatchRequired ? [] : capabilityCandidate.patch_traceability_matrix,
    implementation_controls: {
      coordination_record_only: noPatchRequired,
      source_patch_required: !noPatchRequired,
      patch_must_be_limited_to_traceable_surfaces: !noPatchRequired,
      developer_must_read_target_repo_context_before_editing: !noPatchRequired,
      developer_patch_receipt_required: !noPatchRequired,
      target_repo_test_receipt_required: !noPatchRequired,
      target_runtime_consumption_verification_required: !noPatchRequired,
      target_workspace_environment_consumption_proof_required: !noPatchRequired,
      dependency_lock_or_profile_migration_proof_required: !noPatchRequired,
      owner_entry_redrive_required: !noPatchRequired,
      repo_hygiene_no_checkout_venv_proof_required: !noPatchRequired,
      target_owner_receipt_projection_required: noPatchRequired,
      no_target_domain_truth_write_proof_required: true,
      no_quality_verdict_or_submission_readiness_authority: true,
      forbidden_target_paths_or_surfaces: policy.forbiddenTargetPathsOrSurfaces,
      required_closeout_evidence: targetPatchLoopCloseoutEvidence({
        sourcePatchRequired: !noPatchRequired,
      }),
    },
    runtime_consumption_verification: buildRuntimeConsumptionVerification({
      requiredSurfaceRefs: policy.runtimeRequiredSurfaceRefs,
      expectedOutcomes: policy.runtimeExpectedOutcomes,
    }),
    target_workspace_environment_verification: buildTargetWorkspaceEnvironmentVerification(),
    version_management: {
      target_agent_version_owner: 'target_agent_repo',
      required_version_artifacts: noPatchRequired
        ? [
          'owner_receipt_coordination_record',
          'target_owner_receipt_projection_ref',
        ]
        : [
          'git_commit',
          'test_receipt',
          'runtime_consumption_verification_receipt',
          'workspace_environment_consumption_receipt',
          'developer_patch_receipt',
          'target_agent_status_or_decision_doc_update',
        ],
      absorb_back_required: !noPatchRequired,
      temporary_worktree_cleanup_required: !noPatchRequired,
    },
    authority_boundary: {
      can_modify_target_agent_source_repo: !noPatchRequired,
      can_modify_target_agent_tests: !noPatchRequired,
      can_modify_target_agent_docs: !noPatchRequired,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
      can_train_or_deploy_model_weights: false,
    },
  };
}

function main() {
  const { suitePath, targetAgentDir, outputDir, feedbackRef, oplBin, aiReviewerEvaluationPath } = parseArgs(
    process.argv.slice(2),
  );
  fs.mkdirSync(outputDir, { recursive: true });
  const domainPackSummary = readDomainPackSummary(repoRoot, { domainId: 'opl-meta-agent' });
  const aiReviewerEvaluation = loadAiReviewerEvaluation(aiReviewerEvaluationPath);

  const suite = readJson(suitePath);
  const targetAgent = readTargetAgent(targetAgentDir, {
    domain_id: path.basename(targetAgentDir),
    domain_label: path.basename(targetAgentDir),
    delivery_domain: 'external_opl_compatible_agent',
  });
  if (!targetAgent.domain_id) {
    throw new Error(`Target agent descriptor is missing domain_id: ${targetAgent.descriptor_ref}`);
  }
  const policy = targetImprovementPolicy(targetAgentDir);

  const agentLabRun = runOpl(oplBin, ['agent-lab', 'run', '--suite', suitePath, '--json']);
  const suiteResult = agentLabRun.agent_lab_run.suite_result as SuiteResult;
  const suiteRefs = collectSuiteRefs(suite);
  const proposedChangeRefs = inferProposedChangeRefs({
    suiteRefs,
    aiReviewerEvaluation,
    policy,
  });
  const patchTraceabilityMatrix = buildPatchTraceabilityMatrix({
    suiteRefs,
    proposedChangeRefs,
    aiReviewerEvaluation,
    policy,
  });

  const receipt: OwnerReceipt = {
    ...buildOwnerReceipt({
      receiptClass: 'external_suite_quality_failure_self_evolution_receipt',
      status: suiteResult.status === 'passed'
        ? 'external_suite_passed_no_mechanism_patch_required'
        : 'external_suite_blocked_mechanism_candidate_recorded',
      targetAgent,
      suiteResult,
      extraAcceptanceGates: {
        external_suite_consumed: true,
        blocked_suite_can_generate_proposal_only_candidate: suiteResult.status !== 'passed',
        target_domain_truth_authority_preserved: true,
        target_quality_authority_preserved: true,
        target_artifact_authority_preserved: true,
        target_memory_authority_preserved: true,
        ...aiReviewerAcceptanceGates(),
      },
    }),
    ...aiReviewerReceiptFields(aiReviewerEvaluation, aiReviewerEvaluationPath),
    ...domainPackReceiptFields(domainPackSummary),
    source_domain_pack: domainPackSummary,
  };
  const learningCandidate = buildLearningCandidate({
    suiteResult,
    receipt,
    targetAgent,
    candidateKind: 'target_agent_capability_gap',
    targetRef: targetCapabilityRef(targetAgent),
    proposedChangeRefs,
    promotionGateRef: `promotion-gate:opl-meta-agent/${targetAgent.domain_id}/external-suite-self-evolution`,
  });
  const mechanismPatchProposal = buildMechanismPatchProposal({
    suiteResult,
    receipt,
    learningCandidate,
    mechanismRef: `mechanism:opl-meta-agent/${targetAgent.domain_id}/external-suite-self-evolution-loop`,
    editableSurfaces: mechanismEditableSurfaces(proposedChangeRefs),
    evidenceDeltaRef: `evidence-delta:opl-meta-agent/${targetAgent.domain_id}/external-agent-lab-suite`,
    observeRefs: [suitePath, aiReviewerEvaluationPath, ...policy.externalLearningRefs],
    diagnoseRefs: [...suiteRefs, ...aiReviewerEvaluation.source_refs],
    editRefs: [
      ...proposedChangeRefs,
      ...aiReviewerEvaluation.suggestions.map((suggestion) => `ai-reviewer-suggestion:${suggestion}`),
    ],
  });
  const capabilityCandidate = buildCapabilityCandidate({
    targetAgent,
    suite,
    suiteResult,
    receipt,
    proposedChangeRefs,
    suiteRefs,
    feedbackRef,
    patchTraceabilityMatrix,
    domainPackSummary,
    aiReviewerEvaluation,
    aiReviewerEvaluationRef: aiReviewerEvaluationPath,
    policy,
  });
  const developerPatchWorkOrder = buildDeveloperPatchWorkOrder({
    targetAgent,
    suite,
    suiteResult,
    receipt,
    capabilityCandidate,
    policy,
  });
  validateDeveloperPatchWorkOrder(developerPatchWorkOrder);

  const receiptPath = path.join(outputDir, 'meta-agent-improvement-receipt.json');
  const learningPath = path.join(outputDir, 'online-learning-candidate.json');
  const mechanismPath = path.join(outputDir, 'mechanism-patch-proposal.json');
  const capabilityPath = path.join(outputDir, 'target-capability-improvement-candidate.json');
  const workOrderPath = path.join(outputDir, 'developer-patch-work-order.json');
  const runPath = path.join(outputDir, 'agent-lab-run-result.json');

  writeJson(receiptPath, receipt);
  writeJson(learningPath, learningCandidate);
  writeJson(mechanismPath, mechanismPatchProposal);
  writeJson(capabilityPath, capabilityCandidate);
  writeJson(workOrderPath, developerPatchWorkOrder);
  writeJson(runPath, agentLabRun);

  const payload = {
    surface_kind: 'opl_meta_agent_external_suite_self_evolution_result',
    version: 'opl-meta-agent.external-suite-self-evolution.v1',
    status: suiteResult.status === 'passed' ? 'passed' : 'blocked_with_developer_patch_work_order',
    product_id: 'opl-meta-agent',
    target_agent: capabilityCandidate.target_agent,
    authority_boundary: capabilityCandidate.authority_boundary,
    ...domainPackReceiptFields(domainPackSummary),
    source_domain_pack: domainPackSummary,
    artifacts: {
      suite_path: suitePath,
      agent_lab_run_result_path: runPath,
      meta_agent_improvement_receipt_path: receiptPath,
      online_learning_candidate_path: learningPath,
      mechanism_patch_proposal_path: mechanismPath,
      target_capability_improvement_candidate_path: capabilityPath,
      developer_patch_work_order_path: workOrderPath,
    },
    opl_agent_lab: agentLabRun.agent_lab_run,
    learning_loop: {
      improvement_receipt: receipt,
      online_learning_candidate: learningCandidate,
      mechanism_patch_proposal: mechanismPatchProposal,
      target_capability_improvement_candidate: capabilityCandidate,
      developer_patch_work_order: developerPatchWorkOrder,
    },
  };
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
