#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  type DomainPackSummary,
  type JsonObject,
  domainPackReceiptFields,
  readDomainPackSummary,
} from './lib/domain-pack.ts';
import {
  type AiReviewerEvaluation,
  aiReviewerAcceptanceGates,
  aiReviewerReceiptFields,
  loadAiReviewerEvaluation,
} from './lib/meta-agent-loop-ai-reviewer.ts';
import {
  type TargetAgent,
  readJson,
  readTargetAgent,
  resolveOplBin,
  runOpl,
  stableId,
} from './lib/meta-agent-loop-io.ts';
import {
  type LearningCandidate,
  type OwnerReceipt,
  type SuiteResult,
  buildLearningCandidate,
  buildMechanismPatchProposal,
  buildOwnerReceipt,
} from './lib/meta-agent-loop-receipts.ts';
import {
  buildOplWorkOrderPrimitiveRefs,
} from './lib/work-order-builders.ts';
import {
  collectEfficiencyNonRegressionRefs,
  type EfficiencyNonRegressionRefs,
  missingEfficiencyNonRegressionFields,
} from './lib/work-order-efficiency.ts';
import {
  validateDeveloperPatchWorkOrder,
} from './lib/work-order-validation.ts';
import {
  type PatchTraceabilityEntry,
  type TargetImprovementPolicy,
  buildPatchTraceabilityMatrix,
  inferProposedChangeRefs,
  mechanismEditableSurfaces,
  targetEditableSurfaceRefs,
  targetImprovementPolicy,
} from './lib/target-improvement-policy.ts';
import {
  type CapabilityCandidate,
  buildDeveloperPatchWorkOrder,
  buildEfficiencyTypedBlocker,
  buildTargetImprovementPolicyTypedBlocker,
  writeExternalSuiteArtifacts,
  writeTypedBlockerArtifacts,
} from './lib/external-suite-materializer.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export type ImproveArgs = {
  suitePath: string;
  targetAgentDir: string;
  outputDir: string;
  feedbackRef: string | null;
  oplBin: string;
  aiReviewerEvaluationPath: string;
};

export function parseImproveFromAgentLabSuiteArgs(argv: string[]): ImproveArgs {
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
    refs.push(...arrayOfStrings(task.feedback_refs));
    refs.push(...arrayOfStrings(task.reviewer_evidence_refs));
    refs.push(...arrayOfStrings(task.reviewer_revision_refs));
    refs.push(...arrayOfStrings(task.revision_checklist_refs));
    refs.push(...arrayOfStrings(task.owner_route_refs));
    refs.push(...arrayOfStrings(task.target_owner_closeout_refs));
    refs.push(...arrayOfStrings(task.stage_refs));
    refs.push(...arrayOfStrings(task.oracle_refs));
    refs.push(...arrayOfStrings(task.scorer_refs));
    refs.push(...arrayOfStrings(task.trajectory?.artifact_refs));
    refs.push(...arrayOfStrings(task.trajectory?.repair_refs));
    refs.push(...arrayOfStrings(task.scorecard?.metric_refs));
    refs.push(...arrayOfStrings(task.scorecard?.evidence_refs));
    refs.push(...arrayOfStrings(task.scorecard?.review_refs));
    refs.push(...arrayOfStrings(task.scorecard?.quality_gate_refs));
    refs.push(...arrayOfStrings(task.improvement_candidate?.evidence_refs));
    refs.push(task.improvement_candidate?.target_ref, task.improvement_candidate?.candidate_kind);
    refs.push(task.improvement_candidate?.promotion_gate_ref);
    refs.push(task.promotion_gate?.gate_ref);
    refs.push(...arrayOfStrings(task.promotion_gate?.required_refs));
    refs.push(...arrayOfStrings(task.promotion_gate?.regression_suite_refs));
    refs.push(...arrayOfStrings(task.promotion_gate?.no_forbidden_write_proof_refs));
  }
  return refs
    .filter((ref): ref is string => typeof ref === 'string' && ref.trim().length > 0)
    .map((ref) => ref.trim());
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function suiteTaskFamilies(suite: JsonObject): string[] {
  return uniqueStrings((Array.isArray(suite.tasks) ? suite.tasks : [])
    .map((task) => task.task_family)
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim()));
}

function feedbackProfiles({
  suite,
  suiteRefs,
}: {
  suite: JsonObject;
  suiteRefs: string[];
}): string[] {
  const joined = [
    String(suite.suite_id ?? ''),
    String(suite.suite_kind ?? ''),
    ...suiteTaskFamilies(suite),
    ...suiteRefs,
  ].join('\n').toLowerCase();
  const normalizedJoined = joined.replace(/-/g, '_');
  const profiles: string[] = [];
  if (
    normalizedJoined.includes('high_quality_medical_manuscript')
    || normalizedJoined.includes('reviewer_revision')
    || normalizedJoined.includes('feedback')
  ) {
    profiles.push('target_agent_feedback_external_suite');
  }
  if (
    normalizedJoined.includes('high_quality_medical_manuscript')
    || normalizedJoined.includes('reviewer_revision')
  ) {
    profiles.push('mas_feedback_agent_lab_external_suite');
  }
  if (normalizedJoined.includes('high_quality_medical_manuscript')) {
    profiles.push('high_quality_medical_manuscript_feedback');
  }
  if (normalizedJoined.includes('reviewer_revision')) {
    profiles.push('reviewer_revision_feedback');
  }
  return uniqueStrings(profiles);
}

function reviewerEvidenceRefs({
  aiReviewerEvaluation,
  aiReviewerEvaluationRef,
  suiteRefs,
}: {
  aiReviewerEvaluation: AiReviewerEvaluation;
  aiReviewerEvaluationRef: string;
  suiteRefs: string[];
}): string[] {
  return uniqueStrings([
    aiReviewerEvaluationRef,
    ...aiReviewerEvaluation.source_refs,
    ...aiReviewerEvaluation.direct_evidence_refs,
    ...suiteRefs.filter((ref) =>
      ref.includes('review')
      || ref.includes('reviewer')
      || ref.includes('evidence')
      || ref.includes('rubric-gap:')
      || ref.includes('quality-scorecard:')
      || ref.includes('quality-gate:')
    ),
  ]);
}

function sourceFeedbackRefs({
  suite,
  feedbackRef,
}: {
  suite: JsonObject;
  feedbackRef: string | null;
}): string[] {
  return uniqueStrings([
    ...(feedbackRef ? [feedbackRef] : []),
    ...(Array.isArray(suite.tasks) ? suite.tasks : []).flatMap((task) => [
      ...arrayOfStrings(task.feedback_refs),
      ...arrayOfStrings(task.reviewer_evidence_refs),
    ]),
  ]);
}

function buildExternalSuiteConsumptionContract({
  suite,
  suiteResult,
  targetAgent,
  feedbackRef,
  suiteRefs,
  reviewerRefs,
  developerPatchWorkOrder,
}: {
  suite: JsonObject;
  suiteResult: SuiteResult;
  targetAgent: TargetAgent;
  feedbackRef: string | null;
  suiteRefs: string[];
  reviewerRefs: string[];
  developerPatchWorkOrder: JsonObject;
}): JsonObject {
  const profiles = feedbackProfiles({ suite, suiteRefs });
  const targetCloseoutRefs = arrayOfStrings(developerPatchWorkOrder.target_closeout_refs);
  return {
    source_external_suite_intake: {
      surface_kind: 'opl_meta_agent_external_agent_lab_suite_intake',
      status: 'accepted_external_agent_lab_suite_input',
      suite_id: suite.suite_id,
      suite_kind: suite.suite_kind,
      accepted_input_profiles: profiles,
      task_families: suiteTaskFamilies(suite),
      target_agent: targetAgent.domain_id,
      source_agent_lab_result_ref: suiteResult.result_id,
      feedback_ref: feedbackRef,
      source_feedback_refs: sourceFeedbackRefs({ suite, feedbackRef }),
      consumed_as_refs_only: true,
      authority_boundary: {
        can_write_target_domain_truth: false,
        can_write_target_domain_memory_body: false,
        can_mutate_target_domain_artifact_body: false,
        can_authorize_target_domain_quality_or_export: false,
        can_promote_default_agent_without_gate: false,
      },
    },
    reviewer_evidence_refs: reviewerRefs,
    target_owner_closeout_refs: targetCloseoutRefs,
    opl_work_order_delegation_aperture: {
      delegates_to_opl_work_order_execute: true,
      primitive_owner: 'one-person-lab/OPL',
      command: 'work-order execute',
      executor_first: true,
      executor: 'codex_cli',
      executor_lease_ref: developerPatchWorkOrder.executor_lease_ref,
      patch_execution_bundle_ref: developerPatchWorkOrder.patch_execution_bundle_ref,
      target_owner_closeout_refs: targetCloseoutRefs,
      owner_closeout_hook_delegated: true,
      target_owner_closeout_owner: 'target-domain via OPL',
      oma_can_manage_target_worktree_lifecycle: false,
      oma_can_write_owner_receipt_body: false,
      required_opl_work_order_primitive_refs: developerPatchWorkOrder.required_opl_work_order_primitive_refs,
      authority_boundary: {
        can_manage_target_worktree_lifecycle: false,
        can_absorb_target_branch: false,
        can_clean_target_worktree: false,
        can_invoke_target_owner_closeout_hook: false,
        can_write_target_owner_receipt_body: false,
        can_write_target_domain_truth: false,
        can_write_target_domain_memory_body: false,
        can_mutate_target_domain_artifact_body: false,
        can_authorize_target_domain_quality_or_export: false,
        can_promote_default_agent_without_gate: false,
      },
    },
  };
}

function improvementAreaForTarget(targetAgent: TargetAgent): string {
  return `${targetAgent.domain_id.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_agent_lab_result_consumption_capability`;
}

function targetCapabilityRef(targetAgent: TargetAgent): string {
  return `domain-agent:${targetAgent.domain_id}/agent-lab-result-consumption-capability`;
}

function traceabilityStatus({
  suiteResult,
  patchTraceabilityMatrix,
}: {
  suiteResult: SuiteResult;
  patchTraceabilityMatrix: PatchTraceabilityEntry[];
}): string {
  if (patchTraceabilityMatrix.length > 0) {
    return 'gap_to_patch_refs_mapped';
  }
  return suiteResult.status === 'passed'
    ? 'no_source_patch_required'
    : 'target_owned_patch_refs_missing';
}

function missingTargetImprovementPolicyFields({
  suiteResult,
  proposedChangeRefs,
  patchTraceabilityMatrix,
}: {
  suiteResult: SuiteResult;
  proposedChangeRefs: string[];
  patchTraceabilityMatrix: PatchTraceabilityEntry[];
}): string[] {
  if (suiteResult.status === 'passed') {
    return [];
  }
  const missing: string[] = [];
  if (proposedChangeRefs.length === 0) {
    missing.push('target_improvement_policy.proposed_change_refs');
  }
  if (patchTraceabilityMatrix.length === 0) {
    missing.push('target_improvement_policy.patch_traceability_matrix');
  }
  if (
    patchTraceabilityMatrix.some((entry) =>
      entry.canonical_target_paths.length === 0 && entry.target_repo_file_hints.length === 0
    )
  ) {
    missing.push('target_improvement_policy.capability_map_or_explicit_policy_canonical_paths');
  }
  if (
    patchTraceabilityMatrix.some((entry) => entry.capability_verification_refs.length === 0)
  ) {
    missing.push('target_improvement_policy.capability_map_or_explicit_policy_verification_refs');
  }
  if (
    patchTraceabilityMatrix.some((entry) => entry.forbidden_target_paths_or_surfaces.length === 0)
  ) {
    missing.push('target_improvement_policy.capability_map_or_explicit_policy_forbidden_surfaces');
  }
  return missing;
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
  efficiencyNonRegressionRefs,
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
  efficiencyNonRegressionRefs: EfficiencyNonRegressionRefs;
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
    efficiency_non_regression_refs: efficiencyNonRegressionRefs,
    traceability_status: traceabilityStatus({
      suiteResult,
      patchTraceabilityMatrix,
    }),
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

export function runImproveFromAgentLabSuite({
  suitePath,
  targetAgentDir,
  outputDir,
  feedbackRef,
  oplBin,
  aiReviewerEvaluationPath,
}: ImproveArgs): JsonObject {
  fs.mkdirSync(outputDir, { recursive: true });
  const domainPackSummary = readDomainPackSummary(repoRoot, { domainId: 'opl-meta-agent' });
  const aiReviewerEvaluation = loadAiReviewerEvaluation(aiReviewerEvaluationPath);

  const suite = readJson(suitePath);
  const targetAgent = readTargetAgent(targetAgentDir);
  const policy = targetImprovementPolicy(targetAgentDir);

  const agentLabRun = runOpl(oplBin, ['agent-lab', 'run', '--suite', suitePath, '--json']);
  const suiteResult = agentLabRun.agent_lab_run.suite_result as SuiteResult;
  const suiteRefs = collectSuiteRefs(suite);
  const directReviewerEvidenceRefs = reviewerEvidenceRefs({
    aiReviewerEvaluation,
    aiReviewerEvaluationRef: aiReviewerEvaluationPath,
    suiteRefs,
  });
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
  const efficiencyNonRegressionRefs = collectEfficiencyNonRegressionRefs(suite, aiReviewerEvaluation);

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
    efficiencyNonRegressionRefs,
    domainPackSummary,
    aiReviewerEvaluation,
    aiReviewerEvaluationRef: aiReviewerEvaluationPath,
    policy,
  });
  const missingEfficiencyFields = missingEfficiencyNonRegressionFields(capabilityCandidate.efficiency_non_regression_refs);
  if (missingEfficiencyFields.length > 0) {
    const blocker = buildEfficiencyTypedBlocker({
      targetAgent,
      suite,
      suiteResult,
      capabilityCandidate,
      missingFields: missingEfficiencyFields,
    });
    const artifacts = writeTypedBlockerArtifacts({
      outputDir,
      capabilityCandidate,
      blocker,
      agentLabRun,
    });
    return {
      surface_kind: 'opl_meta_agent_external_suite_self_evolution_result',
      version: 'opl-meta-agent.external-suite-self-evolution.v1',
      status: 'blocked_efficiency_quality_floor_missing',
      product_id: 'opl-meta-agent',
      target_agent: capabilityCandidate.target_agent,
      authority_boundary: {
        ...capabilityCandidate.authority_boundary,
        no_executable_work_order_issued: true,
      },
      artifacts: {
        suite_path: suitePath,
        ...artifacts,
      },
      opl_agent_lab: agentLabRun.agent_lab_run,
      learning_loop: {
        target_capability_improvement_candidate: capabilityCandidate,
        typed_blocker: blocker,
      },
    };
  }
  const missingTargetImprovementPolicy = missingTargetImprovementPolicyFields({
    suiteResult,
    proposedChangeRefs,
    patchTraceabilityMatrix,
  });
  if (missingTargetImprovementPolicy.length > 0) {
    const blocker = buildTargetImprovementPolicyTypedBlocker({
      targetAgent,
      suite,
      suiteResult,
      capabilityCandidate,
      missingFields: missingTargetImprovementPolicy,
    });
    const artifacts = writeTypedBlockerArtifacts({
      outputDir,
      capabilityCandidate,
      blocker,
      agentLabRun,
    });
    return {
      surface_kind: 'opl_meta_agent_external_suite_self_evolution_result',
      version: 'opl-meta-agent.external-suite-self-evolution.v1',
      status: 'blocked_target_improvement_policy_missing',
      product_id: 'opl-meta-agent',
      target_agent: capabilityCandidate.target_agent,
      authority_boundary: {
        ...capabilityCandidate.authority_boundary,
        no_executable_work_order_issued: true,
      },
      artifacts: {
        suite_path: suitePath,
        ...artifacts,
      },
      opl_agent_lab: agentLabRun.agent_lab_run,
      learning_loop: {
        target_capability_improvement_candidate: capabilityCandidate,
        typed_blocker: blocker,
      },
    };
  }
  const developerPatchWorkOrder = buildDeveloperPatchWorkOrder({
    targetAgent,
    suite,
    suiteResult,
    receipt,
    capabilityCandidate,
    policy,
  });
  Object.assign(developerPatchWorkOrder, buildExternalSuiteConsumptionContract({
    suite,
    suiteResult,
    targetAgent,
    feedbackRef,
    suiteRefs,
    reviewerRefs: directReviewerEvidenceRefs,
    developerPatchWorkOrder,
  }));
  Object.assign(developerPatchWorkOrder.work_order_completeness as JsonObject, {
    reviewer_evidence: {
      refs: directReviewerEvidenceRefs,
    },
    opl_work_order_delegation_aperture: developerPatchWorkOrder.opl_work_order_delegation_aperture,
  });
  Object.assign(mechanismPatchProposal, {
    repeat_budget: {
      max_attempts: 2,
      remaining_attempts: 1,
      repeat_scope: 'same_target_eval_work_order_owner_route_tuple',
    },
    dead_letter_refs: [
      `dead-letter:opl-meta-agent/${targetAgent.domain_id}/${mechanismPatchProposal.proposal_id}`,
    ],
    escalation_refs: [
      `escalation:target-owner/${targetAgent.domain_id}/external-suite-self-evolution`,
      String(developerPatchWorkOrder.work_order_completeness?.fail_closed_blocker_ref),
    ],
    next_allowed_action: 'delegate_to_opl_work_order_execute_after_currentness_gate',
  });
  validateDeveloperPatchWorkOrder(developerPatchWorkOrder);

  const artifacts = writeExternalSuiteArtifacts({
    outputDir,
    receipt,
    learningCandidate,
    mechanismPatchProposal,
    capabilityCandidate,
    developerPatchWorkOrder,
    agentLabRun,
  });

  return {
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
      ...artifacts,
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
}

function main() {
  const payload = runImproveFromAgentLabSuite(parseImproveFromAgentLabSuiteArgs(process.argv.slice(2)));

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
