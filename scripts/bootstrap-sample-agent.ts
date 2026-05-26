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
  writeMinimalAgentDomainPack,
} from './lib/domain-pack.ts';
import {
  materializeStageDecompositionPackDraft,
  validateStageDecompositionCloseoutPacket,
  type StageRunnerKind,
} from './lib/stage-decomposition-pack-draft.ts';
import {
  type StageDecompositionAttemptReceipt,
  runStageDecompositionAttempt,
} from './lib/stage-decomposition-runner.ts';
import {
  type AiReviewerEvaluation,
  type LearningCandidate,
  type OwnerReceipt,
  type SuiteResult,
  type TargetAgent,
  aiReviewerAcceptanceGates,
  aiReviewerReceiptFields,
  buildAgentLabSuite as buildExternalSuite,
  buildLearningCandidate as buildGatedLearningCandidate,
  buildMechanismPatchProposal,
  buildOwnerReceipt,
  buildRealTargetDeliveryReceipt,
  buildScaleoutEvidenceLedger,
  loadAiReviewerEvaluation,
  resolveOplBin,
  runOpl,
  writeJson,
} from './lib/meta-agent-loop.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

type BootstrapArgs = {
  outputDir: string;
  oplBin: string;
  aiReviewerEvaluationPath: string;
  targetAgent: TargetAgent;
  sampleMode: boolean;
  stageRunner: StageRunnerKind;
  stageCloseoutPacketPath: string | null;
};

function nonEmptyValue(flag: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing value for ${flag}.`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`Value for ${flag} must be non-empty.`);
  }
  return trimmed;
}

function parseArgs(argv: string[]): BootstrapArgs {
  const parsed: {
    outputDir: string | null;
    oplBin: string;
    aiReviewerEvaluationPath: string | null;
    domainId: string | null;
    domainLabel: string | null;
    deliveryDomain: string | null;
    targetBrief: string | null;
    stageRunner: StageRunnerKind;
    stageCloseoutPacketPath: string | null;
  } = {
    outputDir: null,
    oplBin: resolveOplBin(),
    aiReviewerEvaluationPath: null,
    domainId: null,
    domainLabel: null,
    deliveryDomain: null,
    targetBrief: null,
    stageRunner: 'fixture',
    stageCloseoutPacketPath: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];
    if (token === '--output-dir') {
      parsed.outputDir = path.resolve(nonEmptyValue(token, value));
      index += 1;
      continue;
    }
    if (token === '--opl-bin') {
      parsed.oplBin = resolveOplBin(nonEmptyValue(token, value));
      index += 1;
      continue;
    }
    if (token === '--ai-reviewer-evaluation') {
      parsed.aiReviewerEvaluationPath = path.resolve(nonEmptyValue(token, value));
      index += 1;
      continue;
    }
    if (token === '--domain-id') {
      parsed.domainId = nonEmptyValue(token, value);
      index += 1;
      continue;
    }
    if (token === '--domain-label') {
      parsed.domainLabel = nonEmptyValue(token, value);
      index += 1;
      continue;
    }
    if (token === '--delivery-domain') {
      parsed.deliveryDomain = nonEmptyValue(token, value);
      index += 1;
      continue;
    }
    if (token === '--target-brief') {
      parsed.targetBrief = nonEmptyValue(token, value);
      index += 1;
      continue;
    }
    if (token === '--stage-runner') {
      const runner = nonEmptyValue(token, value);
      if (runner !== 'fixture' && runner !== 'live') {
        throw new Error('Value for --stage-runner must be fixture or live.');
      }
      parsed.stageRunner = runner;
      index += 1;
      continue;
    }
    if (token === '--stage-closeout-packet' || token === '--stage-decomposition-closeout') {
      parsed.stageCloseoutPacketPath = path.resolve(nonEmptyValue(token, value));
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}.`);
  }

  if (!parsed.aiReviewerEvaluationPath) {
    throw new Error(
      'Missing required --ai-reviewer-evaluation <path>; baseline delivery fails closed without structured AI reviewer evaluation.',
    );
  }
  parsed.outputDir ??= fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-bootstrap-'));
  const sampleMode = parsed.domainId === null;
  let targetAgent: TargetAgent;
  if (sampleMode) {
    targetAgent = {
      domain_id: 'sample-brief-agent',
      domain_label: 'Sample Brief Agent',
      delivery_domain: 'knowledge_briefing',
      target_brief: 'Create a source-grounded knowledge brief from workspace refs.',
    };
  } else {
    const domainId = parsed.domainId;
    if (!domainId) {
      throw new Error('Missing required --domain-id <domain_id>.');
    }
    const domainLabel = parsed.domainLabel ?? domainId;
    targetAgent = {
      domain_id: domainId,
      domain_label: domainLabel,
      delivery_domain: parsed.deliveryDomain ?? 'knowledge_delivery',
      target_brief: parsed.targetBrief
        ?? `Create an owner-gated ${domainLabel} delivery from declared workspace refs.`,
    };
  }
  return {
    outputDir: parsed.outputDir,
    oplBin: parsed.oplBin,
    aiReviewerEvaluationPath: parsed.aiReviewerEvaluationPath,
    targetAgent,
    sampleMode,
    stageRunner: parsed.stageRunner,
    stageCloseoutPacketPath: parsed.stageCloseoutPacketPath,
  };
}

function materializeStageDecompositionAttempt({
  targetAgent,
  targetAgentDir,
  outputDir,
  oplBin,
  stageRunner,
  stageCloseoutPacketPath,
}: {
  targetAgent: TargetAgent;
  targetAgentDir: string;
  outputDir: string;
  oplBin: string;
  stageRunner: StageRunnerKind;
  stageCloseoutPacketPath?: string | null;
}): StageDecompositionAttemptReceipt {
  const attempt = runStageDecompositionAttempt({
    targetAgent,
    targetAgentDir,
    outputDir,
    oplBin,
    runnerKind: stageRunner,
    closeoutPacketPath: stageCloseoutPacketPath ?? null,
  });
  const packDraft = validateStageDecompositionCloseoutPacket(attempt.closeoutPacket, { targetAgent });
  materializeStageDecompositionPackDraft(targetAgentDir, packDraft);
  return attempt.receipt;
}

function stageDecompositionBlockerFromError(error: unknown, targetAgent: TargetAgent): JsonObject {
  const message = error instanceof Error ? error.message : String(error);
  try {
    const parsed = JSON.parse(message);
    if (
      typeof parsed === 'object'
      && parsed !== null
      && !Array.isArray(parsed)
      && parsed.surface_kind === 'stage_attempt_closeout_packet'
      && parsed.stage_id === 'stage-decomposition'
    ) {
      return parsed as JsonObject;
    }
  } catch {
    // Fall through to a normalized typed blocker.
  }
  return {
    surface_kind: 'stage_attempt_closeout_packet',
    stage_id: 'stage-decomposition',
    closeout_refs: [
      `typed-blocker:opl-meta-agent/${targetAgent.domain_id}/stage-decomposition/materialization_failed`,
    ],
    blocked_reason: 'stage_decomposition_materialization_failed',
    blocker_message: message,
    domain_ready_verdict: 'blocked',
    next_owner: 'opl-meta-agent',
    route_impact: {
      target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
      materialization_allowed: false,
      baseline_receipt_signed: false,
    },
    authority_boundary: {
      opl: 'stage_attempt_runtime_and_closeout_transport',
      oma: 'cannot_materialize_without_valid_stage_decomposition_pack_draft',
      target_domain: 'truth_quality_artifact_gate_owner',
    },
  };
}

function writeStageDecompositionBlocker(
  outputDir: string,
  targetAgent: TargetAgent,
  blocker: JsonObject,
): string {
  const blockerPath = path.join(outputDir, `${targetAgent.domain_id}-stage-decomposition-blocker.json`);
  writeJson(blockerPath, blocker);
  return blockerPath;
}

function buildAgentLabSuite({
  targetAgent,
  targetAgentDir,
  aiReviewerEvaluation,
  aiReviewerEvaluationRef,
}: {
  targetAgent: TargetAgent;
  targetAgentDir: string;
  aiReviewerEvaluation: AiReviewerEvaluation;
  aiReviewerEvaluationRef: string;
}): JsonObject {
  return buildExternalSuite({
    suiteId: targetAgent.domain_id === 'sample-brief-agent'
      ? 'opl-meta-agent-self-bootstrap-suite'
      : `opl-meta-agent-baseline-suite:${targetAgent.domain_id}`,
    taskId: `agent-lab-task:opl-meta-agent/${targetAgent.domain_id}-baseline`,
    taskFamily: 'agent_building_baseline',
    targetAgent: {
      ...targetAgent,
      descriptor_ref: path.join(targetAgentDir, 'contracts', 'domain_descriptor.json'),
    },
    targetAgentDir,
    instructionsRef: `instructions:opl-meta-agent/${targetAgent.domain_id}/baseline`,
    agentEntryRef: `domain-agent-entry:${targetAgent.domain_id}`,
    stageRefs: [`stage:${targetAgent.domain_id}/intake`, `stage:${targetAgent.domain_id}/draft`],
    oracleRefs: ['oracle:opl-meta-agent/baseline-contract-valid'],
    scorerRefs: ['scorer:opl-meta-agent/baseline-acceptance'],
    trajectoryRef: `trajectory:opl-meta-agent/${targetAgent.domain_id}-baseline`,
    runRef: `run:opl-meta-agent/${targetAgent.domain_id}-baseline`,
    artifactRefs: [`artifact-ref:${targetAgent.domain_id}/package`],
    receiptRefs: [`owner-receipt:opl-meta-agent/${targetAgent.domain_id}/baseline-delivery`],
    scorecardRef: 'quality-scorecard:opl-meta-agent/baseline-acceptance',
    metricRefs: ['metric-ref:descriptor-valid', 'metric-ref:agent-lab-suite-valid'],
    evidenceRefs: [`evidence-ref:${targetAgent.domain_id}/scaffold-validation`],
    reviewRefs: ['review-ref:opl-meta-agent/baseline-review'],
    qualityGateRefs: ['quality-gate:opl-meta-agent/baseline-owner'],
    improvementCandidateRef: `improvement-candidate:opl-meta-agent/${targetAgent.domain_id}/rubric-gap-tightening`,
    improvementCandidateKind: 'rubric_gap',
    improvementTargetRef: 'quality-gate:opl-meta-agent/baseline-owner',
    promotionGateRef: `promotion-gate:opl-meta-agent/${targetAgent.domain_id}`,
    regressionSuiteRefs: ['regression-suite:opl-meta-agent/self-bootstrap'],
    aiReviewerEvaluation,
    aiReviewerEvaluationRef,
  });
}

function buildBaselineReceipt(
  targetAgent: TargetAgent,
  suiteResult: SuiteResult,
  scaffoldValidation: JsonObject,
  domainPackSummary: DomainPackSummary,
  targetDomainPackSummary: DomainPackSummary,
  aiReviewerEvaluation: AiReviewerEvaluation,
  aiReviewerEvaluationRef: string,
  stageDecompositionAttempt: StageDecompositionAttemptReceipt,
): OwnerReceipt {
  const receipt = {
    ...buildOwnerReceipt({
      receiptClass: 'baseline_delivery_receipt',
      status: 'baseline_delivered',
      targetAgent,
      suiteResult,
      extraAcceptanceGates: {
        direct_and_hosted_path_declared: true,
        operator_runbook_present: true,
        target_agent_brief_declared: Boolean(targetAgent.target_brief),
        ...aiReviewerAcceptanceGates(),
      },
    }),
    target_agent: targetAgent,
    scaffold_validation_status: scaffoldValidation.standard_domain_agent_scaffold.validation.status,
    ...aiReviewerReceiptFields(aiReviewerEvaluation, aiReviewerEvaluationRef),
    ...domainPackReceiptFields(domainPackSummary),
    source_domain_pack: domainPackSummary,
    target_agent_domain_pack: targetDomainPackSummary,
    stage_decomposition_attempt: stageDecompositionAttempt,
    generated_from_stage_decomposition_closeout: {
      status: 'verified',
      stage_packet_ref: stageDecompositionAttempt.stage_packet_ref,
      closeout_packet_ref: stageDecompositionAttempt.closeout_packet_ref,
      closeout_refs: stageDecompositionAttempt.closeout_refs,
      runner_kind: stageDecompositionAttempt.runner_kind,
    },
  };
  return receipt;
}

function buildLearningCandidate(suiteResult: SuiteResult, baselineReceipt: OwnerReceipt): LearningCandidate {
  const targetAgent = baselineReceipt.target_agent as TargetAgent;
  return buildGatedLearningCandidate({
    suiteResult,
    receipt: baselineReceipt,
    targetAgent,
    candidateKind: 'rubric_gap',
    targetRef: 'quality-gate:opl-meta-agent/baseline-owner',
    proposedChangeRefs: [`candidate-ref:${targetAgent.domain_id}/add-source-coverage-rubric`],
    promotionGateRef: `promotion-gate:opl-meta-agent/${targetAgent.domain_id}`,
  });
}

function buildBaselineMechanismPatchProposal(
  suiteResult: SuiteResult,
  baselineReceipt: OwnerReceipt,
  learningCandidate: LearningCandidate,
  aiReviewerEvaluation: AiReviewerEvaluation,
  aiReviewerEvaluationRef: string,
): JsonObject {
  return buildMechanismPatchProposal({
    suiteResult,
    receipt: baselineReceipt,
    learningCandidate,
    mechanismRef: `mechanism:opl-meta-agent/${baselineReceipt.target_agent.domain_id}/self-learning-loop`,
    editableSurfaces: [
      'prompt_policy_ref',
      'skill_policy_ref',
      'stage_policy_ref',
      'quality_gate_policy_ref',
      'agent_lab_suite_policy_ref',
    ],
    evidenceDeltaRef: `evidence-delta:opl-meta-agent/${baselineReceipt.target_agent.domain_id}/baseline`,
    observeRefs: [aiReviewerEvaluationRef],
    diagnoseRefs: aiReviewerEvaluation.source_refs,
    editRefs: aiReviewerEvaluation.suggestions.map((suggestion) => `ai-reviewer-suggestion:${suggestion}`),
  });
}

function buildRealTargetAgentSuite({
  realTargetAgent,
  realTargetAgentDir,
  aiReviewerEvaluation,
  aiReviewerEvaluationRef,
}: {
  realTargetAgent: TargetAgent;
  realTargetAgentDir: string;
  aiReviewerEvaluation: AiReviewerEvaluation;
  aiReviewerEvaluationRef: string;
}): JsonObject {
  return buildExternalSuite({
    suiteId: 'opl-meta-agent-real-target-delivery-suite',
    taskId: `agent-lab-task:opl-meta-agent/${realTargetAgent.domain_id}/real-target-delivery`,
    taskFamily: 'real_target_delivery',
    targetAgent: {
      ...realTargetAgent,
      descriptor_ref: path.join(realTargetAgentDir, 'contracts', 'domain_descriptor.json'),
    },
    targetAgentDir: realTargetAgentDir,
    instructionsRef: `instructions:opl-meta-agent/${realTargetAgent.domain_id}/real-target-delivery`,
    agentEntryRef: `domain-agent-entry:${realTargetAgent.domain_id}`,
    stageRefs: [
      `stage:${realTargetAgent.domain_id}/intent`,
      `stage:${realTargetAgent.domain_id}/draft`,
      `stage:${realTargetAgent.domain_id}/delivery`,
    ],
    oracleRefs: ['oracle:opl-meta-agent/real-target-contract-valid'],
    scorerRefs: ['scorer:opl-meta-agent/real-target-delivery-acceptance'],
    trajectoryRef: `trajectory:opl-meta-agent/${realTargetAgent.domain_id}/real-target-delivery`,
    runRef: `run:opl-meta-agent/${realTargetAgent.domain_id}/real-target-delivery`,
    artifactRefs: [`artifact-ref:${realTargetAgent.domain_id}/package`],
    receiptRefs: [`owner-receipt:opl-meta-agent/${realTargetAgent.domain_id}/baseline-delivery`],
    scorecardRef: `quality-scorecard:opl-meta-agent/${realTargetAgent.domain_id}/real-target-delivery`,
    metricRefs: [
      'metric-ref:real-target-descriptor-valid',
      'metric-ref:real-target-agent-lab-suite-valid',
      'metric-ref:real-target-owner-receipt-present',
    ],
    evidenceRefs: [`evidence-ref:${realTargetAgent.domain_id}/scaffold-validation`],
    reviewRefs: [`review-ref:opl-meta-agent/${realTargetAgent.domain_id}/real-target-review`],
    qualityGateRefs: [`quality-gate:opl-meta-agent/${realTargetAgent.domain_id}/baseline-owner`],
    improvementCandidateRef: `improvement-candidate:opl-meta-agent/${realTargetAgent.domain_id}/source-coverage`,
    improvementCandidateKind: 'prompt_policy',
    improvementTargetRef: `prompt-policy:${realTargetAgent.domain_id}/source-grounded-briefing`,
    promotionGateRef: `promotion-gate:opl-meta-agent/${realTargetAgent.domain_id}`,
    regressionSuiteRefs: ['regression-suite:opl-meta-agent/real-target-delivery'],
    aiReviewerEvaluation,
    aiReviewerEvaluationRef,
  });
}

function main() {
  const {
    outputDir,
    oplBin,
    aiReviewerEvaluationPath,
    targetAgent,
    sampleMode,
    stageRunner,
    stageCloseoutPacketPath,
  } = parseArgs(process.argv.slice(2));
  fs.mkdirSync(outputDir, { recursive: true });
  const domainPackSummary = readDomainPackSummary(repoRoot, { domainId: 'opl-meta-agent' });
  const aiReviewerEvaluation = loadAiReviewerEvaluation(aiReviewerEvaluationPath);

  const targetAgentLabel = targetAgent.domain_label ?? targetAgent.domain_id;
  const targetAgentDir = path.join(outputDir, targetAgent.domain_id);
  const suitePath = path.join(outputDir, 'agent-lab-suite.json');
  const receiptPath = path.join(outputDir, 'baseline-delivery-receipt.json');
  const learningPath = path.join(outputDir, 'online-learning-candidate.json');
  const mechanismPath = path.join(outputDir, 'mechanism-patch-proposal.json');
  const realTargetReceiptPath = path.join(outputDir, 'real-target-delivery-receipt.json');
  const scaleoutLedgerPath = path.join(outputDir, 'real-target-scaleout-evidence-ledger.json');

  const scaffold = runOpl(oplBin, [
    'agents',
    'scaffold',
    '--target-dir',
    targetAgentDir,
    '--domain-id',
    targetAgent.domain_id,
    '--domain-label',
    targetAgentLabel,
    '--force',
    '--json',
  ]);
  writeMinimalAgentDomainPack(targetAgentDir, targetAgent);
  let stageDecompositionAttempt: StageDecompositionAttemptReceipt;
  try {
    stageDecompositionAttempt = materializeStageDecompositionAttempt({
      targetAgent,
      targetAgentDir,
      outputDir,
      oplBin,
      stageRunner,
      stageCloseoutPacketPath,
    });
  } catch (error) {
    const blocker = stageDecompositionBlockerFromError(error, targetAgent);
    const blockerPath = writeStageDecompositionBlocker(outputDir, targetAgent, blocker);
    throw new Error(`Stage decomposition failed closed; typed blocker written to ${blockerPath}.`);
  }
  const descriptorPath = path.join(targetAgentDir, 'contracts', 'domain_descriptor.json');
  const descriptor = JSON.parse(fs.readFileSync(descriptorPath, 'utf8'));
  writeJson(descriptorPath, {
    ...descriptor,
    delivery_domain: targetAgent.delivery_domain,
    target_brief: targetAgent.target_brief,
  });
  const targetDomainPackSummary = readDomainPackSummary(targetAgentDir, {
    domainId: targetAgent.domain_id,
  });
  const scaffoldValidation = runOpl(oplBin, [
    'agents',
    'scaffold',
    '--validate',
    targetAgentDir,
    '--json',
  ]);
  const generatedInterfaces = runOpl(oplBin, [
    'agents',
    'interfaces',
    '--repo-dir',
    targetAgentDir,
    '--json',
  ]);

  const suite = buildAgentLabSuite({
    targetAgent,
    targetAgentDir,
    aiReviewerEvaluation,
    aiReviewerEvaluationRef: aiReviewerEvaluationPath,
  });
  writeJson(suitePath, suite);
  const agentLabRun = runOpl(oplBin, ['agent-lab', 'run', '--suite', suitePath, '--json']);
  const suiteResult = agentLabRun.agent_lab_run.suite_result as SuiteResult;

  const baselineReceipt = buildBaselineReceipt(
    targetAgent,
    suiteResult,
    scaffoldValidation,
    domainPackSummary,
    targetDomainPackSummary,
    aiReviewerEvaluation,
    aiReviewerEvaluationPath,
    stageDecompositionAttempt,
  );
  const learningCandidate = buildLearningCandidate(suiteResult, baselineReceipt);
  const mechanismPatchProposal = buildBaselineMechanismPatchProposal(
    suiteResult,
    baselineReceipt,
    learningCandidate,
    aiReviewerEvaluation,
    aiReviewerEvaluationPath,
  );
  writeJson(receiptPath, baselineReceipt);
  writeJson(learningPath, learningCandidate);
  writeJson(mechanismPath, mechanismPatchProposal);

  let realTargetDelivery: JsonObject | null = null;
  if (sampleMode) {
    const realTargetAgent: TargetAgent = {
      domain_id: 'real-target-brief-agent',
      domain_label: 'Real Target Brief Agent',
      delivery_domain: 'knowledge_briefing',
    };
    const realTargetAgentDir = path.join(outputDir, realTargetAgent.domain_id);
    runOpl(oplBin, [
      'agents',
      'scaffold',
      '--target-dir',
      realTargetAgentDir,
      '--domain-id',
      realTargetAgent.domain_id,
      '--domain-label',
      realTargetAgent.domain_label ?? realTargetAgent.domain_id,
      '--force',
      '--json',
    ]);
    writeMinimalAgentDomainPack(realTargetAgentDir, realTargetAgent);
    const realTargetStageOutputDir = path.join(outputDir, `${realTargetAgent.domain_id}-stage-decomposition`);
    let realTargetStageDecompositionAttempt: StageDecompositionAttemptReceipt;
    try {
      realTargetStageDecompositionAttempt = materializeStageDecompositionAttempt({
        targetAgent: realTargetAgent,
        targetAgentDir: realTargetAgentDir,
        outputDir: realTargetStageOutputDir,
        oplBin,
        stageRunner,
        stageCloseoutPacketPath: null,
      });
    } catch (error) {
      const blocker = stageDecompositionBlockerFromError(error, realTargetAgent);
      const blockerPath = writeStageDecompositionBlocker(realTargetStageOutputDir, realTargetAgent, blocker);
      throw new Error(`Real-target stage decomposition failed closed; typed blocker written to ${blockerPath}.`);
    }
    const realTargetScaffoldValidation = runOpl(oplBin, [
      'agents',
      'scaffold',
      '--validate',
      realTargetAgentDir,
      '--json',
    ]);
    const realTargetInterfaces = runOpl(oplBin, [
      'agents',
      'interfaces',
      '--repo-dir',
      realTargetAgentDir,
      '--json',
    ]);
    const realTargetSuitePath = path.join(outputDir, 'real-target-agent-lab-suite.json');
    const realTargetSuite = buildRealTargetAgentSuite({
      realTargetAgent,
      realTargetAgentDir,
      aiReviewerEvaluation,
      aiReviewerEvaluationRef: aiReviewerEvaluationPath,
    });
    writeJson(realTargetSuitePath, realTargetSuite);
    const realTargetAgentLabRun = runOpl(oplBin, ['agent-lab', 'run', '--suite', realTargetSuitePath, '--json']);
    const realTargetSuiteResult = realTargetAgentLabRun.agent_lab_run.suite_result as SuiteResult;
    const realTargetReceipt = buildOwnerReceipt({
      receiptClass: 'real_target_baseline_delivery_receipt',
      status: 'real_target_baseline_delivered',
      targetAgent: {
        ...realTargetAgent,
        repo_dir: realTargetAgentDir,
        descriptor_ref: path.join(realTargetAgentDir, 'contracts', 'domain_descriptor.json'),
      },
      suiteResult: realTargetSuiteResult,
      extraAcceptanceGates: {
        real_target_agent_delivery: true,
        sample_smoke_counted_as_real_target_delivery: false,
        ...aiReviewerAcceptanceGates(),
      },
    });
    const realTargetDeliveryReceipt = buildRealTargetDeliveryReceipt({
      targetAgent: {
        ...realTargetAgent,
        repo_dir: realTargetAgentDir,
        descriptor_ref: path.join(realTargetAgentDir, 'contracts', 'domain_descriptor.json'),
      },
      suiteResult: realTargetSuiteResult,
      baselineDeliveryReceipt: realTargetReceipt,
      candidateAgentPackageRef: `candidate-agent-package:${realTargetAgent.domain_id}`,
      agentLabSuiteRef: realTargetSuitePath,
      promotionGateRefs: [`promotion-gate:opl-meta-agent/${realTargetAgent.domain_id}`],
      noForbiddenWriteProofRefs: [
        `no-forbidden-write:opl-meta-agent/${realTargetAgent.domain_id}/real_target_delivery`,
      ],
      sampleTargetAgentRef: `domain-agent:${targetAgent.domain_id}`,
      sampleReceiptRef: baselineReceipt.receipt_id,
    });
    const scaleoutEvidenceLedger = buildScaleoutEvidenceLedger({
      deliveryReceipts: [realTargetDeliveryReceipt],
      sampleReceiptRefs: [baselineReceipt.receipt_id],
    });
    writeJson(realTargetReceiptPath, realTargetDeliveryReceipt);
    writeJson(scaleoutLedgerPath, scaleoutEvidenceLedger);
    realTargetDelivery = {
      target_agent: {
        ...realTargetAgent,
        repo_dir: realTargetAgentDir,
        scaffold_validation_status: realTargetScaffoldValidation.standard_domain_agent_scaffold.validation.status,
        generated_interface_status: realTargetInterfaces.generated_agent_interfaces.status,
      },
      agent_lab_run: realTargetAgentLabRun.agent_lab_run,
      delivery_receipt: realTargetDeliveryReceipt,
      scaleout_evidence_ledger: scaleoutEvidenceLedger,
      stage_decomposition_attempt: realTargetStageDecompositionAttempt,
    };
  }

  const payload = {
    surface_kind: 'opl_meta_agent_self_learning_loop_result',
    version: 'opl-meta-agent.self-learning-loop.v1',
    status: suiteResult.status === 'passed' ? 'passed' : 'blocked',
    product_id: 'opl-meta-agent',
    meta_agent_kind: 'opl_compatible_meta_agent',
    target_agent: {
      ...targetAgent,
      repo_dir: targetAgentDir,
      scaffold_status: scaffold.standard_domain_agent_scaffold.state,
      scaffold_validation_status: scaffoldValidation.standard_domain_agent_scaffold.validation.status,
      generated_interface_status: generatedInterfaces.generated_agent_interfaces.status,
      domain_pack_status: targetDomainPackSummary.status,
      stage_decomposition_status: stageDecompositionAttempt.status,
    },
    ...domainPackReceiptFields(domainPackSummary),
    source_domain_pack: domainPackSummary,
    target_agent_domain_pack: targetDomainPackSummary,
    artifacts: {
      stage_decomposition_attempt_receipt_path: path.join(outputDir, `${targetAgent.domain_id}-stage-decomposition-attempt-receipt.json`),
      stage_decomposition_closeout_packet_path: stageDecompositionAttempt.closeout_packet_path,
      suite_path: suitePath,
      baseline_delivery_receipt_path: receiptPath,
      online_learning_candidate_path: learningPath,
      mechanism_patch_proposal_path: mechanismPath,
      ...(realTargetDelivery
        ? {
            real_target_agent_lab_suite_path: path.join(outputDir, 'real-target-agent-lab-suite.json'),
            real_target_delivery_receipt_path: realTargetReceiptPath,
            real_target_scaleout_evidence_ledger_path: scaleoutLedgerPath,
          }
        : {}),
    },
    opl_agent_lab: agentLabRun.agent_lab_run,
    opl_generated_interfaces: generatedInterfaces.generated_agent_interfaces,
    stage_decomposition_attempt: stageDecompositionAttempt,
    learning_loop: {
      baseline_receipt: baselineReceipt,
      online_learning_candidate: learningCandidate,
      online_learning_policy: learningCandidate.online_learning_policy,
      mechanism_patch_proposal: mechanismPatchProposal,
    },
    ...(realTargetDelivery
      ? {
          real_target_delivery: realTargetDelivery,
        }
      : {}),
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
