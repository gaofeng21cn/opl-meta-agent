#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs as parseNodeArgs } from 'node:util';
import {
  type DomainPackSummary,
  type JsonObject,
  domainPackReceiptFields,
  readDomainPackSummary,
} from './lib/domain-pack.ts';
import {
  assertNewAgentDeliveryGate,
} from './build-agent-baseline.ts';
import {
  loadAiReviewerEvaluation,
} from './lib/meta-agent-loop-ai-reviewer.ts';
import {
  type LearningCandidate,
  type OwnerReceipt,
  type SuiteResult,
  buildAgentLabSuite,
  buildLearningCandidate,
  buildMechanismPatchProposal,
  buildOwnerReceipt,
} from './lib/meta-agent-loop-receipts.ts';
import {
  type TargetAgent,
  readTargetAgent,
  resolveOplBin,
  runOpl,
  writeJson,
} from './lib/meta-agent-loop-io.ts';
import {
  buildStageNativeArtifactAttemptRefs,
} from './lib/stage-native-artifact-contract.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export type TakeoverArgs = {
  targetAgentDir: string;
  outputDir: string;
  oplBin: string;
  aiReviewerEvaluationPath: string;
};

export function parseTakeoverAgentArgs(argv: string[]): TakeoverArgs {
  const parsed: {
    targetAgentDir: string | null;
    outputDir: string | null;
    oplBin: string;
    aiReviewerEvaluationPath: string | null;
  } = {
    targetAgentDir: null,
    outputDir: null,
    oplBin: resolveOplBin(),
    aiReviewerEvaluationPath: null,
  };

  const { values } = parseNodeArgs({
    args: argv,
    options: {
      'agent-dir': { type: 'string' },
      'output-dir': { type: 'string' },
      'opl-bin': { type: 'string' },
      'ai-reviewer-evaluation': { type: 'string' },
    },
    strict: true,
    allowPositionals: false,
  });
  if (typeof values['agent-dir'] === 'string') {
    parsed.targetAgentDir = path.resolve(values['agent-dir']);
  }
  if (typeof values['output-dir'] === 'string') {
    parsed.outputDir = path.resolve(values['output-dir']);
  }
  if (typeof values['opl-bin'] === 'string') {
    parsed.oplBin = resolveOplBin(values['opl-bin']);
  }
  if (typeof values['ai-reviewer-evaluation'] === 'string') {
    parsed.aiReviewerEvaluationPath = path.resolve(values['ai-reviewer-evaluation']);
  }

  if (!parsed.targetAgentDir) {
    throw new Error('Missing required --agent-dir <path>.');
  }
  if (!fs.existsSync(parsed.targetAgentDir)) {
    throw new Error(`Target agent path does not exist: ${parsed.targetAgentDir}`);
  }
  if (!parsed.aiReviewerEvaluationPath) {
    throw new Error('Missing required --ai-reviewer-evaluation <path>.');
  }

  parsed.outputDir ??= fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-takeover-'));
  return {
    targetAgentDir: parsed.targetAgentDir,
    outputDir: parsed.outputDir,
    oplBin: parsed.oplBin,
    aiReviewerEvaluationPath: parsed.aiReviewerEvaluationPath,
  };
}

function buildTakeoverSuite(targetAgent: TargetAgent, targetAgentDir: string): JsonObject {
  const stageNativeArtifactRefs = buildStageNativeArtifactAttemptRefs({
    domainId: targetAgent.domain_id,
    stageId: 'target-agent-takeover',
    domainTruthOwner: 'opl-meta-agent',
    attemptId: 'testing-takeover',
  });
  const suite = buildAgentLabSuite({
    suiteId: `opl-meta-agent-takeover-suite:${targetAgent.domain_id}`,
    taskId: `agent-lab-task:opl-meta-agent/${targetAgent.domain_id}/takeover`,
    taskFamily: 'agent_testing_takeover',
    targetAgent,
    targetAgentDir,
    instructionsRef: `instructions:opl-meta-agent/${targetAgent.domain_id}/takeover`,
    agentEntryRef: `domain-agent-entry:${targetAgent.domain_id}`,
    stageRefs: [
      `stage:${targetAgent.domain_id}/descriptor-contract-read`,
      `stage:${targetAgent.domain_id}/external-agent-lab-run`,
      `stage:${targetAgent.domain_id}/gated-self-evolution-candidate`,
    ],
    oracleRefs: [
      `oracle:opl-meta-agent/${targetAgent.domain_id}/descriptor-contract-valid`,
      `oracle:opl-meta-agent/${targetAgent.domain_id}/authority-boundary-preserved`,
    ],
    scorerRefs: [`scorer:opl-meta-agent/${targetAgent.domain_id}/takeover-acceptance`],
    trajectoryRef: `trajectory:opl-meta-agent/${targetAgent.domain_id}/testing-takeover`,
    runRef: `run:opl-meta-agent/${targetAgent.domain_id}/testing-takeover`,
    artifactRefs: [
      `artifact-ref:${targetAgent.domain_id}/external-agent-package`,
      String(stageNativeArtifactRefs.canonical_artifact_ref),
      String(stageNativeArtifactRefs.manifest_ref),
    ],
    receiptRefs: [
      `owner-receipt:opl-meta-agent/${targetAgent.domain_id}/testing-takeover`,
      String(stageNativeArtifactRefs.receipt_ref),
      String(stageNativeArtifactRefs.blocker_ref),
    ],
    scorecardRef: `quality-scorecard:opl-meta-agent/${targetAgent.domain_id}/takeover-acceptance`,
    metricRefs: [
      'metric-ref:descriptor-valid',
      'metric-ref:agent-lab-external-suite-passed',
      'metric-ref:forbidden-authority-write-absent',
    ],
    evidenceRefs: [
      `evidence-ref:${targetAgent.domain_id}/descriptor-contract-read`,
      String(stageNativeArtifactRefs.artifact_native_contract_ref),
      String(stageNativeArtifactRefs.stage_folder_contract_ref),
    ],
    reviewRefs: [`review-ref:opl-meta-agent/${targetAgent.domain_id}/takeover-review`],
    qualityGateRefs: [`quality-gate:opl-meta-agent/${targetAgent.domain_id}/domain-owner-boundary`],
    improvementCandidateRef: `improvement-candidate:opl-meta-agent/${targetAgent.domain_id}/gated-self-evolution`,
    improvementCandidateKind: 'gated_self_evolution',
    improvementTargetRef: `quality-gate:opl-meta-agent/${targetAgent.domain_id}/domain-owner-boundary`,
    promotionGateRef: `promotion-gate:opl-meta-agent/${targetAgent.domain_id}/takeover`,
    regressionSuiteRefs: [`regression-suite:opl-meta-agent/${targetAgent.domain_id}/takeover`],
  });
  return {
    ...suite,
    stage_native_artifact_refs: stageNativeArtifactRefs,
    authority_boundary: {
      ...suite.authority_boundary,
      can_generate_target_domain_owner_receipt: false,
      can_write_target_artifact_body: false,
    },
    tasks: suite.tasks.map((task: JsonObject) => ({
      ...task,
      stage_native_artifact_refs: stageNativeArtifactRefs,
      artifact_native_contract_ref: stageNativeArtifactRefs.artifact_native_contract_ref,
      stage_folder_contract: stageNativeArtifactRefs.stage_folder_contract,
    })),
  };
}

function buildTakeoverMechanismPatchProposal(
  suiteResult: SuiteResult,
  takeoverReceipt: OwnerReceipt,
  learningCandidate: LearningCandidate,
  targetAgent: TargetAgent,
): JsonObject {
  return buildMechanismPatchProposal({
    suiteResult,
    receipt: takeoverReceipt,
    learningCandidate,
    mechanismRef: `mechanism:opl-meta-agent/${targetAgent.domain_id}/testing-takeover-loop`,
    editableSurfaces: [
      'agent_lab_suite_policy_ref',
      'takeover_review_policy_ref',
      'optimizer_candidate_policy_ref',
      'prompt_policy_ref',
      'quality_gate_policy_ref',
    ],
    evidenceDeltaRef: `evidence-delta:opl-meta-agent/${targetAgent.domain_id}/takeover`,
  });
}

export function runTakeoverAgent({ targetAgentDir, outputDir, oplBin, aiReviewerEvaluationPath }: TakeoverArgs): JsonObject {
  fs.mkdirSync(outputDir, { recursive: true });
  const domainPackSummary: DomainPackSummary = readDomainPackSummary(repoRoot, { domainId: 'opl-meta-agent' });

  const targetAgent = readTargetAgent(targetAgentDir);
  const aiReviewerEvaluation = loadAiReviewerEvaluation(aiReviewerEvaluationPath);

  const suitePath = path.join(outputDir, 'agent-lab-takeover-suite.json');
  const receiptPath = path.join(outputDir, 'takeover-receipt.json');
  const deliveryGatePath = path.join(outputDir, 'new-agent-delivery-gate.json');
  const learningPath = path.join(outputDir, 'takeover-online-learning-candidate.json');
  const mechanismPath = path.join(outputDir, 'takeover-mechanism-patch-proposal.json');

  const suite = buildTakeoverSuite(targetAgent, targetAgentDir);
  writeJson(suitePath, suite);

  const agentLabRun = runOpl(oplBin, ['agent-lab', 'run', '--suite', suitePath, '--json']);
  const suiteResult = agentLabRun.agent_lab_run.suite_result as SuiteResult;

  const takeoverReceipt: OwnerReceipt = {
    ...buildOwnerReceipt({
      receiptClass: 'testing_takeover_self_evolution_receipt',
      status: suiteResult.status === 'passed' ? 'testing_takeover_recorded' : 'testing_takeover_blocked',
      targetAgent,
      suiteResult,
      extraAcceptanceGates: {
        target_agent_allowed: true,
        target_domain_truth_authority_preserved: true,
        target_quality_authority_preserved: true,
        target_artifact_authority_preserved: true,
        target_memory_authority_preserved: true,
      },
    }),
    ...domainPackReceiptFields(domainPackSummary),
    source_domain_pack: domainPackSummary,
    stage_native_artifact_refs: suite.stage_native_artifact_refs,
    artifact_native_contract_ref: suite.stage_native_artifact_refs.artifact_native_contract_ref,
    stage_folder_contract: suite.tasks[0].stage_folder_contract,
    can_generate_target_domain_owner_receipt: false,
  };

  const learningCandidate = buildLearningCandidate({
    suiteResult,
    receipt: takeoverReceipt,
    targetAgent,
    candidateKind: 'gated_self_evolution',
    targetRef: `quality-gate:opl-meta-agent/${targetAgent.domain_id}/domain-owner-boundary`,
    proposedChangeRefs: [`candidate-ref:${targetAgent.domain_id}/gated-optimizer-policy-adjustment`],
    promotionGateRef: `promotion-gate:opl-meta-agent/${targetAgent.domain_id}/takeover`,
  });
  const mechanismPatchProposal = buildTakeoverMechanismPatchProposal(
    suiteResult,
    takeoverReceipt,
    learningCandidate,
    targetAgent,
  );
  const noPatchCoordinationReceipt: JsonObject = {
    surface_kind: 'opl_meta_agent_no_patch_coordination_receipt',
    receipt_id: `no-patch-coordination-receipt:opl-meta-agent/${targetAgent.domain_id}/testing-takeover`,
    target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
    takeover_receipt_ref: takeoverReceipt.receipt_id,
    agent_lab_result_ref: suiteResult.result_id,
    status: suiteResult.status === 'passed' ? 'recorded_requires_target_owner_wait' : 'blocked',
    authority_boundary: {
      refs_only: true,
      can_write_target_domain_truth: false,
      can_write_target_owner_receipt_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
    },
  };
  const noForbiddenWriteProofRef = `no-forbidden-write:opl-meta-agent/${targetAgent.domain_id}/agent_testing_takeover`;
  const newAgentDeliveryGate = assertNewAgentDeliveryGate({
    targetAgent,
    scaffoldValidationStatus: 'validated',
    generatedInterfaceStatus: 'ready',
    baselineSuiteResult: suiteResult as unknown as JsonObject,
    realTargetSuiteResult: suiteResult as unknown as JsonObject,
    aiReviewerEvaluation,
    selfEvolutionConsumptionRef: learningCandidate.candidate_id,
    noPatchCoordinationReceipt,
    stageRunRefsOnlyConsumptionRef: suite.stage_native_artifact_refs.attempt_json_ref,
    stageCompletionPolicyRef: suite.tasks[0].stage_completion_policy.policy_ref,
    stageCloseoutPacketRef: suite.stage_native_artifact_refs.receipt_ref,
    targetOwnerReceiptOrTypedBlockerOrHumanGateRef: noPatchCoordinationReceipt.receipt_id,
    noForbiddenWriteProofRef,
    sourceMorphologyRef: aiReviewerEvaluation.direct_evidence_refs
      .find((ref: string) => ref.includes('morphology')) ?? aiReviewerEvaluation.direct_evidence_refs[0],
    ownerRouteRef: aiReviewerEvaluation.source_refs
      .find((ref: string) => ref.includes('owner-route')) ?? noPatchCoordinationReceipt.receipt_id,
    generatedSurfaceConsumptionRef: `generated-surface-consumption:opl-meta-agent/${targetAgent.domain_id}/takeover`,
    privateResidueDecisionRef: 'contracts/default_caller_deletion_evidence.json',
    ownerAnswerShape: 'completed_and_wait_owner',
    providerCompletionIsDomainCompletion: false,
    omaTargetAuthorityBoundary: {
      can_write_target_domain_truth: false,
      can_write_target_owner_receipt_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
    },
  });

  writeJson(receiptPath, takeoverReceipt);
  writeJson(deliveryGatePath, newAgentDeliveryGate);
  writeJson(learningPath, learningCandidate);
  writeJson(mechanismPath, mechanismPatchProposal);

  return {
    surface_kind: 'opl_meta_agent_takeover_loop_result',
    version: 'opl-meta-agent.takeover-loop.v1',
    status: suiteResult.status === 'passed' ? 'passed' : 'blocked',
    product_id: 'opl-meta-agent',
    takeover_policy: {
      target_opl_compatible_agents_allowed: true,
      can_write_target_domain_truth: false,
      can_write_target_quality_verdict: false,
      can_write_target_artifact_body: false,
      can_write_target_memory_body: false,
      can_promote_default_agent_without_gate: false,
    },
    target_agent: {
      domain_id: targetAgent.domain_id,
      domain_label: targetAgent.domain_label,
      delivery_domain: targetAgent.delivery_domain,
      repo_dir: targetAgent.repo_dir,
      descriptor_ref: targetAgent.descriptor_ref,
    },
    ...domainPackReceiptFields(domainPackSummary),
    source_domain_pack: domainPackSummary,
    artifacts: {
      suite_path: suitePath,
      takeover_receipt_path: receiptPath,
      new_agent_delivery_gate_path: deliveryGatePath,
      online_learning_candidate_path: learningPath,
      mechanism_patch_proposal_path: mechanismPath,
    },
    opl_agent_lab: agentLabRun.agent_lab_run,
    learning_loop: {
      takeover_receipt: takeoverReceipt,
      online_learning_candidate: learningCandidate,
      online_learning_policy: learningCandidate.online_learning_policy,
      mechanism_patch_proposal: mechanismPatchProposal,
    },
    new_agent_delivery_gate: newAgentDeliveryGate,
  };
}

function main() {
  const payload = runTakeoverAgent(parseTakeoverAgentArgs(process.argv.slice(2)));

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
