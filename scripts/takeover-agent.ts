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
  assertAiReviewerArtifactMorphologyEvidence,
  loadAiReviewerEvaluation,
} from './lib/meta-agent-loop-ai-reviewer.ts';
import {
  buildAgentLabSuiteSeed,
} from './lib/meta-agent-loop-receipts.ts';
import {
  type TargetAgent,
  readTargetAgent,
  writeJson,
} from './lib/meta-agent-loop-io.ts';
import {
  buildFoundryLabWorkOrder,
} from './lib/foundry-lab-work-order.ts';
import {
  buildStageNativeArtifactAttemptRefs,
} from './lib/stage-native-artifact-contract.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export type TakeoverArgs = {
  targetAgentDir: string;
  outputDir: string;
  aiReviewerEvaluationPath: string;
};

export function parseTakeoverAgentArgs(argv: string[]): TakeoverArgs {
  const parsed: {
    targetAgentDir: string | null;
    outputDir: string | null;
    aiReviewerEvaluationPath: string | null;
  } = {
    targetAgentDir: null,
    outputDir: null,
    aiReviewerEvaluationPath: null,
  };

  const { values } = parseNodeArgs({
    args: argv,
    options: {
      'agent-dir': { type: 'string' },
      'output-dir': { type: 'string' },
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
    aiReviewerEvaluationPath: parsed.aiReviewerEvaluationPath,
  };
}

function buildTakeoverSuiteSeed(targetAgent: TargetAgent, targetAgentDir: string): JsonObject {
  const stageNativeArtifactRefs = buildStageNativeArtifactAttemptRefs({
    domainId: targetAgent.domain_id,
    stageId: 'target-agent-takeover',
    domainTruthOwner: 'opl-meta-agent',
    attemptId: 'testing-takeover',
  });
  const suite = buildAgentLabSuiteSeed({
    suiteId: `opl-meta-agent-takeover-suite:${targetAgent.domain_id}`,
    taskId: `agent-lab-task:opl-meta-agent/${targetAgent.domain_id}/takeover`,
    taskFamily: 'agent_testing_takeover',
    targetAgent,
    targetAgentDir,
    instructionsRef: `instructions:opl-meta-agent/${targetAgent.domain_id}/takeover`,
    agentEntryRef: `domain-agent-entry:${targetAgent.domain_id}`,
    stageRefs: [
      `stage:${targetAgent.domain_id}/descriptor-contract-read`,
      `stage:${targetAgent.domain_id}/external-agent-lab-evaluation-request`,
      `stage:${targetAgent.domain_id}/gated-self-evolution-candidate-seed`,
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

export function runTakeoverAgent({
  targetAgentDir,
  outputDir,
  aiReviewerEvaluationPath,
}: TakeoverArgs): JsonObject {
  fs.mkdirSync(outputDir, { recursive: true });
  const domainPackSummary: DomainPackSummary = readDomainPackSummary(repoRoot, { domainId: 'opl-meta-agent' });
  const targetAgent = readTargetAgent(targetAgentDir);
  const aiReviewerEvaluation = loadAiReviewerEvaluation(aiReviewerEvaluationPath);
  assertAiReviewerArtifactMorphologyEvidence(aiReviewerEvaluation, 'Takeover');

  const suiteSeedPath = path.join(outputDir, 'agent-lab-takeover-suite-seed.json');
  const foundryLabWorkOrderPath = path.join(outputDir, 'foundry-lab-work-order.json');
  const suiteSeed = buildTakeoverSuiteSeed(targetAgent, targetAgentDir);
  writeJson(suiteSeedPath, suiteSeed);

  const candidateRefs = [
    'improvement-candidate:opl-meta-agent/' + targetAgent.domain_id + '/gated-self-evolution',
    'mechanism-candidate:opl-meta-agent/' + targetAgent.domain_id + '/testing-takeover-loop',
  ];
  const foundryLabWorkOrder = buildFoundryLabWorkOrder({
    workOrderKind: 'target_agent_takeover_evaluation',
    targetAgent: {
      domain_id: targetAgent.domain_id,
      domain_label: targetAgent.domain_label,
      repo_dir: targetAgent.repo_dir,
      target_agent_ref: targetAgent.target_agent_ref ?? `domain-agent:${targetAgent.domain_id}`,
      descriptor_ref: String(targetAgent.descriptor_ref),
    },
    suiteSeed,
    suiteSeedRef: path.basename(suiteSeedPath),
    sourceRefs: [
      targetAgent.descriptor_ref,
      ...aiReviewerEvaluation.source_refs,
    ].filter((ref): ref is string => typeof ref === 'string' && ref.length > 0),
    reviewerRefs: [
      aiReviewerEvaluationPath,
      ...aiReviewerEvaluation.source_refs,
      ...aiReviewerEvaluation.direct_evidence_refs,
    ],
    candidateRefs,
  });
  writeJson(foundryLabWorkOrderPath, foundryLabWorkOrder);

  return {
    surface_kind: 'opl_meta_agent_takeover_handoff',
    version: 'opl-meta-agent.takeover-handoff.v1',
    status: 'takeover_candidate_materialized_ready_for_opl_foundry_lab_evaluation',
    product_id: 'opl-meta-agent',
    takeover_policy: {
      target_opl_compatible_agents_allowed: true,
      can_execute_agent_lab_suite: false,
      can_write_target_domain_truth: false,
      can_write_target_quality_verdict: false,
      can_write_target_artifact_body: false,
      can_write_target_memory_body: false,
      can_write_target_owner_receipt_body: false,
      can_promote_default_agent_without_gate: false,
    },
    target_agent: {
      domain_id: targetAgent.domain_id,
      domain_label: targetAgent.domain_label,
      delivery_domain: targetAgent.delivery_domain,
      repo_dir: targetAgent.repo_dir,
      descriptor_ref: targetAgent.descriptor_ref,
      target_agent_ref: targetAgent.target_agent_ref,
    },
    ...domainPackReceiptFields(domainPackSummary),
    source_domain_pack: domainPackSummary,
    artifacts: {
      agent_lab_suite_seed_path: suiteSeedPath,
      foundry_lab_work_order_path: foundryLabWorkOrderPath,
    },
    agent_building_judgment: {
      ai_reviewer_evaluation_ref: aiReviewerEvaluationPath,
      verdict: aiReviewerEvaluation.verdict,
      suggestions: aiReviewerEvaluation.suggestions,
      candidate_refs: candidateRefs,
    },
    foundry_lab_handoff: {
      suite_seed: suiteSeed,
      work_order: foundryLabWorkOrder,
    },
    authority_boundary: foundryLabWorkOrder.authority_boundary,
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
