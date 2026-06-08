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
};

export function parseTakeoverAgentArgs(argv: string[]): TakeoverArgs {
  const parsed: {
    targetAgentDir: string | null;
    outputDir: string | null;
    oplBin: string;
  } = {
    targetAgentDir: null,
    outputDir: null,
    oplBin: resolveOplBin(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];
    if (token === '--agent-dir') {
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

  if (!parsed.targetAgentDir) {
    throw new Error('Missing required --agent-dir <path>.');
  }
  if (!fs.existsSync(parsed.targetAgentDir)) {
    throw new Error(`Target agent path does not exist: ${parsed.targetAgentDir}`);
  }

  parsed.outputDir ??= fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-takeover-'));
  return {
    targetAgentDir: parsed.targetAgentDir,
    outputDir: parsed.outputDir,
    oplBin: parsed.oplBin,
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

export function runTakeoverAgent({ targetAgentDir, outputDir, oplBin }: TakeoverArgs): JsonObject {
  fs.mkdirSync(outputDir, { recursive: true });
  const domainPackSummary: DomainPackSummary = readDomainPackSummary(repoRoot, { domainId: 'opl-meta-agent' });

  const targetAgent = readTargetAgent(targetAgentDir);

  const suitePath = path.join(outputDir, 'agent-lab-takeover-suite.json');
  const receiptPath = path.join(outputDir, 'takeover-receipt.json');
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

  writeJson(receiptPath, takeoverReceipt);
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
