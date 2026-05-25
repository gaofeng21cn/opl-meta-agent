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
} from './lib/meta-agent-loop.ts';
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
  writeEfficiencyBlockerArtifacts,
  writeExternalSuiteArtifacts,
} from './lib/external-suite-materializer.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

type ImproveArgs = {
  suitePath: string;
  targetAgentDir: string;
  outputDir: string;
  feedbackRef: string | null;
  oplBin: string;
  aiReviewerEvaluationPath: string;
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
    const artifacts = writeEfficiencyBlockerArtifacts({
      outputDir,
      capabilityCandidate,
      blocker,
      agentLabRun,
    });
    process.stdout.write(`${JSON.stringify({
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
    }, null, 2)}\n`);
    return;
  }
  const developerPatchWorkOrder = buildDeveloperPatchWorkOrder({
    targetAgent,
    suite,
    suiteResult,
    receipt,
    capabilityCandidate,
    policy,
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
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
