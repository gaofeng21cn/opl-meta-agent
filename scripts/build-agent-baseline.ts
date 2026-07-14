#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs as parseNodeArgs } from 'node:util';
import {
  buildTargetAgentCapabilityMapProjection,
  buildTargetAgentPackageManifest,
  buildTargetAgentPrimarySkillMarkdown,
  buildProfileSelectionReceipt,
  type JsonObject,
  domainPackReceiptFields,
  readDomainPackSummary,
} from './lib/domain-pack.ts';
import {
  buildScaffoldMaterializationRequest,
  repairStageDecompositionCloseoutPacket,
} from './lib/stage-decomposition-pack-draft/materializer.ts';
import type {
  StageDecompositionPackDraft,
} from './lib/stage-decomposition-pack-draft/shared.ts';
import {
  validateAgentSkeletonBuildCloseoutPacket,
  validateStageDecompositionCloseoutPacket,
} from './lib/stage-decomposition-pack-draft/validator.ts';
import {
  type AiReviewerEvaluation,
  assertAiReviewerArtifactMorphologyEvidence,
  loadAiReviewerEvaluation,
} from './lib/meta-agent-loop-ai-reviewer.ts';
import {
  type TargetAgent,
  writeJson,
} from './lib/meta-agent-loop-io.ts';
import {
  buildFoundryEvaluationSemanticRequest,
} from './lib/foundry-evaluation-semantic-request.ts';
import {
  buildWorkOrderMaterializationRequest,
} from './lib/work-order-materialization-request.ts';
import {
  applyDeveloperProofProfileSelection,
  buildStandardAgentDeveloperProofRequest,
  normalizeRequestedProfileRefs,
  readStandardAgentDeveloperProofReceipt,
  type StandardAgentDeveloperProofRequest,
} from './lib/standard-agent-developer-proof.ts';

const repoRoot = path.resolve(import.meta.dirname, '..');

export type BuildAgentBaselineArgs = {
  outputDir: string;
  aiReviewerEvaluationPath: string;
  targetAgent: TargetAgent;
  stageDecompositionCloseoutRef: string | null;
  agentSkeletonBuildCloseoutRef: string | null;
  developerProofReceiptRef?: string | null;
};

type DomainCloseoutArtifact = {
  stage_id: 'stage-decomposition' | 'agent-skeleton-build';
  closeout_packet_ref: string;
  closeout_packet_path: string;
  closeout_packet: JsonObject;
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

function nonEmptyStringList(flag: string, value: string | string[] | undefined): string[] {
  const entries = Array.isArray(value) ? value : value === undefined ? [] : [value];
  return entries.map((entry) => nonEmptyValue(flag, entry));
}

function referenceDesignEvidenceRefs(targetAgent: TargetAgent): string[] {
  return [
    ...(targetAgent.reference_design_source_refs ?? []),
    ...(targetAgent.reference_design_pattern_notes ?? []).map((note) => `reference-design-pattern:${note}`),
    ...(targetAgent.reference_design_pattern_packet_refs ?? []),
    ...(targetAgent.research_source_refs ?? []),
    ...(targetAgent.expert_practice_notes ?? []).map((note) => `expert-practice:${note}`),
    ...(targetAgent.research_synthesis_refs ?? []),
  ];
}

export function parseBuildAgentBaselineArgs(argv: string[]): BuildAgentBaselineArgs {
  const parsed: {
    outputDir: string | null;
    aiReviewerEvaluationPath: string | null;
    domainId: string | null;
    domainLabel: string | null;
    deliveryDomain: string | null;
    targetBrief: string | null;
    intentSignals: string[];
    selectedOplProfileRefs: string[];
    profileSelectionRationale: string | null;
    profileRequirementRefs: string[];
    referenceDesignSourceRefs: string[];
    referenceDesignPatternNotes: string[];
    referenceDesignPatternPacketRefs: string[];
    researchSourceRefs: string[];
    expertPracticeNotes: string[];
    researchSynthesisRefs: string[];
    stageDecompositionCloseoutRef: string | null;
    agentSkeletonBuildCloseoutRef: string | null;
    developerProofReceiptRef: string | null;
  } = {
    outputDir: null,
    aiReviewerEvaluationPath: null,
    domainId: null,
    domainLabel: null,
    deliveryDomain: null,
    targetBrief: null,
    intentSignals: [],
    selectedOplProfileRefs: [],
    profileSelectionRationale: null,
    profileRequirementRefs: [],
    referenceDesignSourceRefs: [],
    referenceDesignPatternNotes: [],
    referenceDesignPatternPacketRefs: [],
    researchSourceRefs: [],
    expertPracticeNotes: [],
    researchSynthesisRefs: [],
    stageDecompositionCloseoutRef: null,
    agentSkeletonBuildCloseoutRef: null,
    developerProofReceiptRef: null,
  };

  const { values } = parseNodeArgs({
    args: argv,
    options: {
      'output-dir': { type: 'string' },
      'ai-reviewer-evaluation': { type: 'string' },
      'domain-id': { type: 'string' },
      'domain-label': { type: 'string' },
      'delivery-domain': { type: 'string' },
      'target-brief': { type: 'string' },
      'intent-signal': { type: 'string', multiple: true },
      'selected-opl-profile': { type: 'string', multiple: true },
      'profile-selection-rationale': { type: 'string' },
      'profile-requirement': { type: 'string', multiple: true },
      'reference-design-source': { type: 'string', multiple: true },
      'reference-design-pattern': { type: 'string', multiple: true },
      'reference-design-pattern-packet': { type: 'string', multiple: true },
      'research-source': { type: 'string', multiple: true },
      'expert-practice': { type: 'string', multiple: true },
      'research-synthesis': { type: 'string', multiple: true },
      'stage-decomposition-closeout-ref': { type: 'string' },
      'agent-skeleton-build-closeout-ref': { type: 'string' },
      'developer-proof-receipt-ref': { type: 'string' },
    },
    strict: true,
    allowPositionals: false,
  });
  if (typeof values['output-dir'] === 'string') {
    parsed.outputDir = path.resolve(nonEmptyValue('--output-dir', values['output-dir']));
  }
  if (typeof values['ai-reviewer-evaluation'] === 'string') {
    parsed.aiReviewerEvaluationPath = path.resolve(nonEmptyValue('--ai-reviewer-evaluation', values['ai-reviewer-evaluation']));
  }
  if (typeof values['domain-id'] === 'string') {
    parsed.domainId = nonEmptyValue('--domain-id', values['domain-id']);
  }
  if (typeof values['domain-label'] === 'string') {
    parsed.domainLabel = nonEmptyValue('--domain-label', values['domain-label']);
  }
  if (typeof values['delivery-domain'] === 'string') {
    parsed.deliveryDomain = nonEmptyValue('--delivery-domain', values['delivery-domain']);
  }
  if (typeof values['target-brief'] === 'string') {
    parsed.targetBrief = nonEmptyValue('--target-brief', values['target-brief']);
  }
  parsed.intentSignals = nonEmptyStringList(
    '--intent-signal',
    values['intent-signal'],
  );
  parsed.selectedOplProfileRefs = nonEmptyStringList(
    '--selected-opl-profile',
    values['selected-opl-profile'],
  );
  if (typeof values['profile-selection-rationale'] === 'string') {
    parsed.profileSelectionRationale = nonEmptyValue(
      '--profile-selection-rationale',
      values['profile-selection-rationale'],
    );
  }
  parsed.profileRequirementRefs = nonEmptyStringList(
    '--profile-requirement',
    values['profile-requirement'],
  );
  parsed.referenceDesignSourceRefs = nonEmptyStringList(
    '--reference-design-source',
    values['reference-design-source'],
  );
  parsed.referenceDesignPatternNotes = nonEmptyStringList(
    '--reference-design-pattern',
    values['reference-design-pattern'],
  );
  parsed.referenceDesignPatternPacketRefs = nonEmptyStringList(
    '--reference-design-pattern-packet',
    values['reference-design-pattern-packet'],
  );
  parsed.researchSourceRefs = nonEmptyStringList(
    '--research-source',
    values['research-source'],
  );
  parsed.expertPracticeNotes = nonEmptyStringList(
    '--expert-practice',
    values['expert-practice'],
  );
  parsed.researchSynthesisRefs = nonEmptyStringList(
    '--research-synthesis',
    values['research-synthesis'],
  );
  if (typeof values['stage-decomposition-closeout-ref'] === 'string') {
    parsed.stageDecompositionCloseoutRef = nonEmptyValue(
      '--stage-decomposition-closeout-ref',
      values['stage-decomposition-closeout-ref'],
    );
  }
  if (typeof values['agent-skeleton-build-closeout-ref'] === 'string') {
    parsed.agentSkeletonBuildCloseoutRef = nonEmptyValue(
      '--agent-skeleton-build-closeout-ref',
      values['agent-skeleton-build-closeout-ref'],
    );
  }
  if (typeof values['developer-proof-receipt-ref'] === 'string') {
    parsed.developerProofReceiptRef = nonEmptyValue(
      '--developer-proof-receipt-ref',
      values['developer-proof-receipt-ref'],
    );
  }

  if (!parsed.domainId) {
    throw new Error(
      'Missing required --domain-id <domain_id>; build-agent-baseline requires an explicit target agent.',
    );
  }
  parsed.outputDir ??= fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-bootstrap-'));
  const domainLabel = parsed.domainLabel ?? parsed.domainId;
  const targetAgent: TargetAgent = {
    domain_id: parsed.domainId,
    domain_label: domainLabel,
    delivery_domain: parsed.deliveryDomain ?? 'knowledge_delivery',
    target_brief: parsed.targetBrief
      ?? `Create an owner-gated ${domainLabel} delivery from declared workspace refs.`,
    ...(parsed.intentSignals.length > 0
      ? { intent_signals: parsed.intentSignals }
      : {}),
    ...(parsed.selectedOplProfileRefs.length > 0
      ? { selected_opl_profile_refs: parsed.selectedOplProfileRefs }
      : {}),
    ...(parsed.profileSelectionRationale
      ? { profile_selection_rationale: parsed.profileSelectionRationale }
      : {}),
    ...(parsed.profileRequirementRefs.length > 0
      ? { profile_requirement_refs: parsed.profileRequirementRefs }
      : {}),
    ...(parsed.referenceDesignSourceRefs.length > 0
      ? { reference_design_source_refs: parsed.referenceDesignSourceRefs }
      : {}),
    ...(parsed.referenceDesignPatternNotes.length > 0
      ? { reference_design_pattern_notes: parsed.referenceDesignPatternNotes }
      : {}),
    ...(parsed.referenceDesignPatternPacketRefs.length > 0
      ? { reference_design_pattern_packet_refs: parsed.referenceDesignPatternPacketRefs }
      : {}),
    ...(parsed.researchSourceRefs.length > 0
      ? { research_source_refs: parsed.researchSourceRefs }
      : {}),
    ...(parsed.expertPracticeNotes.length > 0
      ? { expert_practice_notes: parsed.expertPracticeNotes }
      : {}),
    ...(parsed.researchSynthesisRefs.length > 0
      ? { research_synthesis_refs: parsed.researchSynthesisRefs }
      : {}),
  };
  return {
    outputDir: parsed.outputDir,
    aiReviewerEvaluationPath: parsed.aiReviewerEvaluationPath ?? '',
    targetAgent,
    stageDecompositionCloseoutRef: parsed.stageDecompositionCloseoutRef,
    agentSkeletonBuildCloseoutRef: parsed.agentSkeletonBuildCloseoutRef,
    developerProofReceiptRef: parsed.developerProofReceiptRef,
  };
}

function readDomainCloseoutArtifact(
  sourceRef: string,
  expectedStageId: DomainCloseoutArtifact['stage_id'],
): DomainCloseoutArtifact {
  let sourcePath: string;
  if (sourceRef.startsWith('file:')) {
    try {
      sourcePath = fileURLToPath(sourceRef);
    } catch {
      throw new Error(`${expectedStageId} closeout ref must be a valid file URL or local path.`);
    }
  } else {
    sourcePath = path.resolve(sourceRef);
  }
  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
    throw new Error(`${expectedStageId} closeout packet is not a readable file: ${sourcePath}`);
  }
  const packet = JSON.parse(fs.readFileSync(sourcePath, 'utf8')) as JsonObject;
  if (packet.surface_kind !== 'stage_attempt_closeout_packet' || packet.stage_id !== expectedStageId) {
    throw new Error(
      `${expectedStageId} closeout ref must resolve to its OMA stage_attempt_closeout_packet.`,
    );
  }
  return {
    stage_id: expectedStageId,
    closeout_packet_ref: pathToFileURL(sourcePath).href,
    closeout_packet_path: sourcePath,
    closeout_packet: packet,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function validateOrRepairStageDecompositionCloseoutPacket(
  packet: unknown,
  { targetAgent }: { targetAgent: TargetAgent },
): StageDecompositionPackDraft {
  try {
    return validateStageDecompositionCloseoutPacket(packet, { targetAgent });
  } catch (firstError) {
    const repair = repairStageDecompositionCloseoutPacket(packet, { targetAgent });
    if (!repair.repaired) {
      throw firstError;
    }
    try {
      return validateStageDecompositionCloseoutPacket(repair.packet, { targetAgent });
    } catch (secondError) {
      throw new Error(
        [
          'stage-decomposition closeout failed validation after bounded materialization repair.',
          `first_validation_error=${errorMessage(firstError)}`,
          `repair_notes=${repair.repair_notes.join(',')}`,
          `post_repair_validation_error=${errorMessage(secondError)}`,
        ].join(' '),
      );
    }
  }
}

function stageDecompositionDebtFromError(error: unknown, targetAgent: TargetAgent): JsonObject {
  const message = errorMessage(error);
  return {
    surface_kind: 'stage_attempt_closeout_packet',
    stage_id: 'stage-decomposition',
    closeout_refs: [
      `quality-debt:opl-meta-agent/${targetAgent.domain_id}/stage-decomposition/partial-design-artifact`,
    ],
    status: 'completed_with_quality_debt',
    quality_debt_reasons: [message],
    domain_ready_verdict: 'not_ready_quality_debt',
    next_owner: 'opl-meta-agent',
    route_impact: {
      target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
      materialization_allowed: false,
      baseline_receipt_signed: false,
      next_stage_may_start: true,
      semantic_route_decision_owner: 'decisive_codex_attempt',
      stage_transition_materialization_owner: 'opl_stage_run_controller',
      route_back_may_target_any_declared_stage: true,
      validation_findings_are_non_blocking: true,
    },
    authority_boundary: {
      opl: 'stage_attempt_runtime_and_closeout_transport',
      oma: 'partial_design_artifact_owner_and_ai_route_back',
      target_domain: 'truth_quality_artifact_gate_owner',
    },
  };
}

function writeStageDecompositionDebt(
  outputDir: string,
  targetAgent: TargetAgent,
  debt: JsonObject,
): string {
  const debtPath = path.join(outputDir, `${targetAgent.domain_id}-stage-decomposition-quality-debt.json`);
  writeJson(debtPath, debt);
  return debtPath;
}

function buildBaselineFoundryEvaluationSemanticRequest({
  targetAgent,
  aiReviewerEvaluation,
  aiReviewerEvaluationRef,
}: {
  targetAgent: TargetAgent;
  aiReviewerEvaluation: AiReviewerEvaluation;
  aiReviewerEvaluationRef: string;
}): JsonObject {
  return buildFoundryEvaluationSemanticRequest({
    requestId: `oma-foundry-evaluation-request:${targetAgent.domain_id}/baseline`,
    suiteId: `opl-meta-agent-baseline-suite:${targetAgent.domain_id}`,
    suiteKind: 'agent_lab_external_suite',
    taskId: `agent-lab-task:opl-meta-agent/${targetAgent.domain_id}-baseline`,
    domainId: 'opl-meta-agent',
    taskFamily: 'agent_building_baseline',
    instructionsRef: `instructions:opl-meta-agent/${targetAgent.domain_id}/baseline`,
    agentEntryRef: `domain-agent-entry:${targetAgent.domain_id}`,
    stageRefs: [`stage:${targetAgent.domain_id}/intake`, `stage:${targetAgent.domain_id}/draft`],
    oracleRefs: ['oracle:opl-meta-agent/baseline-contract-valid'],
    scorerRefs: ['scorer:opl-meta-agent/baseline-acceptance'],
    trajectoryRef: `trajectory:opl-meta-agent/${targetAgent.domain_id}-baseline`,
    requestedRunRef: `run:opl-meta-agent/${targetAgent.domain_id}-baseline`,
    artifactRefs: [`artifact-ref:${targetAgent.domain_id}/package`],
    receiptRefs: [`expected-owner-receipt:target-domain/${targetAgent.domain_id}/baseline-delivery`],
    scorecardRef: 'quality-scorecard:opl-meta-agent/baseline-acceptance',
    metricRefs: ['metric-ref:descriptor-valid', 'metric-ref:agent-lab-suite-valid'],
    evidenceRefs: [
      `evidence-ref:${targetAgent.domain_id}/scaffold-validation`,
      ...referenceDesignEvidenceRefs(targetAgent),
      aiReviewerEvaluationRef,
      ...aiReviewerEvaluation.source_refs,
      ...aiReviewerEvaluation.direct_evidence_refs,
    ],
    reviewRefs: [
      'review-ref:opl-meta-agent/baseline-review',
      aiReviewerEvaluationRef,
    ],
    qualityGateRefs: ['quality-gate:opl-meta-agent/baseline-owner'],
    improvementCandidateRef: `improvement-candidate:opl-meta-agent/${targetAgent.domain_id}/rubric-gap-tightening`,
    improvementCandidateKind: 'rubric_gap',
    improvementTargetRef: 'quality-gate:opl-meta-agent/baseline-owner',
    promotionGateRef: `promotion-gate:opl-meta-agent/${targetAgent.domain_id}`,
    regressionSuiteRefs: ['regression-suite:opl-meta-agent/self-bootstrap'],
  });
}

function buildTargetDescriptorProjection(targetAgent: TargetAgent): JsonObject {
  const profileSelectionReceipt = buildProfileSelectionReceipt(targetAgent);
  return {
    delivery_domain: targetAgent.delivery_domain,
    target_brief: targetAgent.target_brief,
    ...((targetAgent.intent_signals?.length ?? 0) > 0
      ? { intent_signals: targetAgent.intent_signals }
      : {}),
    profile_selection_mode: profileSelectionReceipt.profile_selection_mode,
    ...((targetAgent.selected_opl_profile_refs?.length ?? 0) > 0
      ? { selected_opl_profile_refs: targetAgent.selected_opl_profile_refs }
      : {}),
    ...(targetAgent.profile_selection_rationale
      ? { profile_selection_rationale: targetAgent.profile_selection_rationale }
      : {}),
    ...((targetAgent.profile_requirement_refs?.length ?? 0) > 0
      ? { profile_requirement_refs: targetAgent.profile_requirement_refs }
      : {}),
    ...((targetAgent.reference_design_source_refs?.length ?? 0) > 0
      ? { reference_design_source_refs: targetAgent.reference_design_source_refs }
      : {}),
    ...((targetAgent.reference_design_pattern_notes?.length ?? 0) > 0
      ? { reference_design_pattern_notes: targetAgent.reference_design_pattern_notes }
      : {}),
    ...((targetAgent.reference_design_pattern_packet_refs?.length ?? 0) > 0
      ? { reference_design_pattern_packet_refs: targetAgent.reference_design_pattern_packet_refs }
      : {}),
    ...((targetAgent.research_source_refs?.length ?? 0) > 0
      ? { research_source_refs: targetAgent.research_source_refs }
      : {}),
    ...((targetAgent.expert_practice_notes?.length ?? 0) > 0
      ? { expert_practice_notes: targetAgent.expert_practice_notes }
      : {}),
    ...((targetAgent.research_synthesis_refs?.length ?? 0) > 0
      ? { research_synthesis_refs: targetAgent.research_synthesis_refs }
      : {}),
    source_derived_design_receipt: profileSelectionReceipt.source_derived_design_receipt,
    source_derived_design_receipt_ref: profileSelectionReceipt.source_derived_design_receipt_ref,
    research_driven_design_receipt: profileSelectionReceipt.research_driven_design_receipt,
    research_driven_design_receipt_ref: profileSelectionReceipt.research_driven_design_receipt_ref,
    reference_design_packet: profileSelectionReceipt.reference_design_packet,
    reference_design_packet_ref: profileSelectionReceipt.reference_design_packet_ref,
    research_synthesis_packet: profileSelectionReceipt.research_synthesis_packet,
    research_synthesis_packet_ref: profileSelectionReceipt.research_synthesis_packet_ref,
    transfer_map: profileSelectionReceipt.transfer_map,
    transfer_map_ref: profileSelectionReceipt.transfer_map_ref,
    agent_pack_plan: profileSelectionReceipt.agent_pack_plan,
    agent_pack_plan_ref: profileSelectionReceipt.agent_pack_plan_ref,
    design_admission_receipt: profileSelectionReceipt.design_admission_receipt,
    design_admission_receipt_ref: profileSelectionReceipt.design_admission_receipt_ref,
    expected_build_receipt_ref: profileSelectionReceipt.expected_build_receipt_ref,
    stage_decomposition_subpacket_set: profileSelectionReceipt.stage_decomposition_subpacket_set,
    stage_decomposition_subpacket_set_ref: profileSelectionReceipt.stage_decomposition_subpacket_set_ref,
    stage_decomposition_subpacket_set_refs: profileSelectionReceipt.stage_decomposition_subpacket_set_ref
      ? [profileSelectionReceipt.stage_decomposition_subpacket_set_ref]
      : [],
    transferable_pattern_requirements: profileSelectionReceipt.transferable_pattern_requirements,
    capability_plan_requirements: profileSelectionReceipt.capability_plan_requirements,
  };
}

function developerProofProgress({
  outputDir,
  targetAgent,
  request,
  requestPath,
  receiptRef,
  failure,
}: {
  outputDir: string;
  targetAgent: TargetAgent;
  request: StandardAgentDeveloperProofRequest;
  requestPath: string;
  receiptRef: string | null;
  failure: unknown | null;
}): JsonObject {
  const reason = failure
    ? `OPL Framework developer proof receipt failed closed: ${errorMessage(failure)}`
    : 'OPL Framework developer proof receipt is pending.';
  const debt = stageDecompositionDebtFromError(new Error(reason), targetAgent);
  const debtPath = writeStageDecompositionDebt(outputDir, targetAgent, debt);
  return {
    surface_kind: 'opl_meta_agent_baseline_progress',
    version: 'opl-meta-agent.baseline-progress.v1',
    status: 'completed_with_quality_debt',
    target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
    quality_debt_ref: debtPath,
    stage_closeout: debt,
    developer_proof_request: request,
    developer_proof_request_ref: request.request_ref,
    developer_proof_request_path: requestPath,
    developer_proof_receipt_state: failure
      ? 'invalid_receipt_fail_closed'
      : 'pending_framework_receipt',
    required_developer_proof_receipt_surface_kind:
      'opl_standard_agent_developer_proof_receipt',
    ...(receiptRef ? { developer_proof_receipt_ref: receiptRef } : {}),
    ...(failure
      ? {
          developer_proof_failure: {
            failure_kind: 'developer_proof_contract_mismatch',
            message: errorMessage(failure),
            materialization_or_validation_accepted_as_evidence: false,
          },
        }
      : {}),
    next_stage_may_start: true,
    semantic_route_decision_owner: 'decisive_codex_attempt',
    stage_transition_materialization_owner: 'opl_stage_run_controller',
  };
}

export function runBuildAgentBaseline({
    outputDir,
    aiReviewerEvaluationPath,
    targetAgent,
    stageDecompositionCloseoutRef,
    agentSkeletonBuildCloseoutRef,
    developerProofReceiptRef = null,
  }: BuildAgentBaselineArgs): JsonObject {
  fs.mkdirSync(outputDir, { recursive: true });
  const stageDecompositionCloseout = stageDecompositionCloseoutRef
    ? readDomainCloseoutArtifact(stageDecompositionCloseoutRef, 'stage-decomposition')
    : null;
  const agentSkeletonBuildCloseout = agentSkeletonBuildCloseoutRef
    ? readDomainCloseoutArtifact(agentSkeletonBuildCloseoutRef, 'agent-skeleton-build')
    : null;
  if (!stageDecompositionCloseout || !agentSkeletonBuildCloseout) {
    const missingStages = [
      ...(!stageDecompositionCloseout ? ['stage-decomposition'] : []),
      ...(!agentSkeletonBuildCloseout ? ['agent-skeleton-build'] : []),
    ];
    const debt = stageDecompositionDebtFromError(
      new Error(`AI-selected route omitted specialized build inputs: ${missingStages.join(', ')}`),
      targetAgent,
    );
    const debtPath = writeStageDecompositionDebt(outputDir, targetAgent, debt);
    return {
      surface_kind: 'opl_meta_agent_baseline_progress',
      version: 'opl-meta-agent.baseline-progress.v1',
      status: 'completed_with_quality_debt',
      target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
      quality_debt_ref: debtPath,
      missing_specialized_input_stages: missingStages,
      stage_closeout: debt,
      next_stage_may_start: true,
      semantic_route_decision_owner: 'decisive_codex_attempt',
      stage_transition_materialization_owner: 'opl_stage_run_controller',
    };
  }
  const domainPackSummary = readDomainPackSummary(repoRoot, { domainId: 'opl-meta-agent' });
  let aiReviewerQualityDebt: string | null = null;
  let aiReviewerEvaluation: AiReviewerEvaluation;
  try {
    aiReviewerEvaluation = loadAiReviewerEvaluation(aiReviewerEvaluationPath);
    assertAiReviewerArtifactMorphologyEvidence(aiReviewerEvaluation, 'Baseline delivery');
  } catch (error) {
    aiReviewerQualityDebt = errorMessage(error);
    aiReviewerEvaluation = {
      reviewer_kind: 'missing_quality_debt',
      model_or_provider: 'unavailable',
      run_ref: 'quality-debt:opl-meta-agent/ai-reviewer/missing',
      execution_attempt_ref: 'quality-debt:opl-meta-agent/execution/missing',
      review_attempt_ref: 'quality-debt:opl-meta-agent/review/missing',
      no_shared_context: true,
      independent_attempt: false,
      critique: aiReviewerQualityDebt,
      suggestions: ['Run an independent AI review before delivery or promotion claims.'],
      source_refs: [],
      direct_evidence_refs: [],
      verdict: 'not_reviewed_quality_debt',
      predicted_impact: 'blocks_delivery_and_promotion_claims_not_stage_progress',
      provenance: { status: 'missing_quality_debt' },
    };
  }

  const targetAgentDir = path.join(outputDir, targetAgent.domain_id);
  try {
    targetAgent = normalizeRequestedProfileRefs(targetAgent);
    buildProfileSelectionReceipt(targetAgent);
  } catch (error) {
    const debt = stageDecompositionDebtFromError(error, targetAgent);
    const debtPath = writeStageDecompositionDebt(outputDir, targetAgent, debt);
    return {
      surface_kind: 'opl_meta_agent_baseline_progress',
      version: 'opl-meta-agent.baseline-progress.v1',
      status: 'completed_with_quality_debt',
      target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
      quality_debt_ref: debtPath,
      stage_closeout: debt,
      next_stage_may_start: true,
    };
  }

  const targetPrimarySkillPath = path.join(targetAgentDir, 'agent', 'primary_skill', 'SKILL.md');
  const targetAgentCapabilityMapPath = path.join(targetAgentDir, 'contracts', 'capability_map.json');
  const targetAgentPackageManifestPath = path.join(
    targetAgentDir,
    'contracts',
    'opl_agent_package_manifest.json',
  );
  const scaffoldMaterializationRequestPath = path.join(
    outputDir,
    'scaffold-materialization-request.json',
  );
  const developerProofRequestPath = path.join(
    outputDir,
    'standard-agent-developer-proof-request.json',
  );
  let stageDecompositionPackDraft: StageDecompositionPackDraft;
  let developerProofRequest: StandardAgentDeveloperProofRequest;
  try {
    stageDecompositionPackDraft = validateOrRepairStageDecompositionCloseoutPacket(
      stageDecompositionCloseout.closeout_packet,
      { targetAgent },
    );
    const materializedFiles = validateAgentSkeletonBuildCloseoutPacket(
      agentSkeletonBuildCloseout.closeout_packet,
      {
        targetAgent,
        packDraft: stageDecompositionPackDraft,
      },
    );
    const scaffoldMaterializationRequest = buildScaffoldMaterializationRequest({
      targetAgent,
      draft: stageDecompositionPackDraft,
      materializedFiles,
      primarySkillBody: buildTargetAgentPrimarySkillMarkdown(targetAgent),
      descriptorProjection: buildTargetDescriptorProjection(targetAgent),
      capabilityMapProjection: buildTargetAgentCapabilityMapProjection(targetAgent, null),
      packageManifest: buildTargetAgentPackageManifest(targetAgent),
    });
    writeJson(scaffoldMaterializationRequestPath, scaffoldMaterializationRequest);
    developerProofRequest = buildStandardAgentDeveloperProofRequest({
      requestRef: pathToFileURL(developerProofRequestPath).href,
      targetAgent,
      targetRepoRef: pathToFileURL(targetAgentDir).href,
      packageManifestRef: pathToFileURL(targetAgentPackageManifestPath).href,
      scaffoldMaterializationRequestRef: pathToFileURL(scaffoldMaterializationRequestPath).href,
      stageDecompositionCloseoutRef: stageDecompositionCloseout.closeout_packet_ref,
      agentSkeletonBuildCloseoutRef: agentSkeletonBuildCloseout.closeout_packet_ref,
    });
    writeJson(developerProofRequestPath, developerProofRequest);
  } catch (error) {
    const debt = stageDecompositionDebtFromError(error, targetAgent);
    const debtPath = writeStageDecompositionDebt(outputDir, targetAgent, debt);
    return {
      surface_kind: 'opl_meta_agent_baseline_progress',
      version: 'opl-meta-agent.baseline-progress.v1',
      status: 'completed_with_quality_debt',
      target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
      quality_debt_ref: debtPath,
      stage_decomposition_closeout_ref: stageDecompositionCloseout.closeout_packet_ref,
      agent_skeleton_build_closeout_ref: agentSkeletonBuildCloseout.closeout_packet_ref,
      stage_closeout: debt,
      next_stage_may_start: true,
      semantic_route_decision_owner: 'decisive_codex_attempt',
      stage_transition_materialization_owner: 'opl_stage_run_controller',
    };
  }
  if (!developerProofReceiptRef) {
    return developerProofProgress({
      outputDir,
      targetAgent,
      request: developerProofRequest,
      requestPath: developerProofRequestPath,
      receiptRef: null,
      failure: null,
    });
  }
  let scaffoldMaterializationReceipt: JsonObject;
  let scaffoldValidation: JsonObject;
  let generatedInterfaces: JsonObject;
  let targetAgentPackageManifestValidation: JsonObject;
  let targetProfileConformance: JsonObject;
  try {
    const developerProof = readStandardAgentDeveloperProofReceipt({
      receiptRef: developerProofReceiptRef,
      requestPath: developerProofRequestPath,
      request: developerProofRequest,
    });
    targetAgent = applyDeveloperProofProfileSelection(
      targetAgent,
      developerProof.outputs.profileSelectionReceipt,
    );
    scaffoldMaterializationReceipt = developerProof.outputs.scaffoldMaterializationReceipt;
    scaffoldValidation = developerProof.outputs.scaffoldValidation;
    generatedInterfaces = developerProof.outputs.generatedInterfaces;
    targetAgentPackageManifestValidation = developerProof.outputs.packageManifestValidation;
    targetProfileConformance = developerProof.outputs.profileConformance;
  } catch (error) {
    return developerProofProgress({
      outputDir,
      targetAgent,
      request: developerProofRequest,
      requestPath: developerProofRequestPath,
      receiptRef: developerProofReceiptRef,
      failure: error,
    });
  }
  const agentBuildReceipt = scaffoldMaterializationReceipt.build_receipt as JsonObject;
  const descriptorPath = path.join(targetAgentDir, 'contracts', 'domain_descriptor.json');
  const profileSelectionReceipt = buildProfileSelectionReceipt(targetAgent);
  const agentBuildReceiptPath = path.join(targetAgentDir, 'contracts', 'agent_build_receipt.json');
  const agentBuildReceiptRef = agentBuildReceipt.receipt_ref ?? null;
  let targetDomainPackSummary: JsonObject;
  try {
    if (
      profileSelectionReceipt.expected_build_receipt_ref
      && agentBuildReceiptRef !== profileSelectionReceipt.expected_build_receipt_ref
    ) {
      throw new Error('Target descriptor requires the post-materialization AgentBuildReceipt.');
    }
    targetDomainPackSummary = readDomainPackSummary(targetAgentDir, {
      domainId: targetAgent.domain_id,
    });
  } catch (error) {
    const debt = stageDecompositionDebtFromError(error, targetAgent);
    const debtPath = writeStageDecompositionDebt(outputDir, targetAgent, debt);
    return {
      surface_kind: 'opl_meta_agent_baseline_progress',
      version: 'opl-meta-agent.baseline-progress.v1',
      status: 'completed_with_quality_debt',
      target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
      target_agent_dir: targetAgentDir,
      quality_debt_ref: debtPath,
      materialized_artifact_refs: [
        targetPrimarySkillPath,
        targetAgentCapabilityMapPath,
        targetAgentPackageManifestPath,
        agentBuildReceiptPath,
      ].filter((ref) => fs.existsSync(ref)),
      stage_closeout: debt,
      next_stage_may_start: true,
      semantic_route_decision_owner: 'decisive_codex_attempt',
      stage_transition_materialization_owner: 'opl_stage_run_controller',
    };
  }
  const aiReviewerEvaluationRef = aiReviewerEvaluationPath || aiReviewerEvaluation.run_ref;
  const evaluationSemanticRequest = buildBaselineFoundryEvaluationSemanticRequest({
    targetAgent,
    aiReviewerEvaluation,
    aiReviewerEvaluationRef,
  });
  const sourceRefs = [
    descriptorPath,
    targetAgentPackageManifestPath,
    targetAgentCapabilityMapPath,
    stageDecompositionCloseout.closeout_packet_ref,
    agentSkeletonBuildCloseout.closeout_packet_ref,
    ...referenceDesignEvidenceRefs(targetAgent),
  ].filter((ref): ref is string => typeof ref === 'string' && ref.length > 0);
  const reviewerRefs = [
    aiReviewerEvaluationRef,
    ...aiReviewerEvaluation.source_refs,
    ...aiReviewerEvaluation.direct_evidence_refs,
  ].filter((ref): ref is string => typeof ref === 'string' && ref.length > 0);
  const candidateRefs = [
    'candidate-agent-package:' + targetAgent.domain_id,
    'improvement-candidate:opl-meta-agent/' + targetAgent.domain_id + '/rubric-gap-tightening',
  ];
  const workOrderMaterializationRequest = buildWorkOrderMaterializationRequest({
    requestKind: 'foundry_evaluation',
    targetAgent: {
      domain_id: targetAgent.domain_id,
      repo_dir: targetAgentDir,
      target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
      descriptor_ref: path.join(targetAgentDir, 'contracts', 'domain_descriptor.json'),
    },
    semanticRequest: {
      ...evaluationSemanticRequest,
      source_refs: sourceRefs,
      reviewer_refs: reviewerRefs,
      candidate_refs: candidateRefs,
    },
  });

  return {
    surface_kind: 'opl_meta_agent_candidate_package_handoff',
    version: 'opl-meta-agent.candidate-package-handoff.v1',
    status: aiReviewerQualityDebt
      ? 'completed_with_quality_debt'
      : 'candidate_package_materialized_ready_for_opl_foundry_lab_evaluation',
    product_id: 'opl-meta-agent',
    meta_agent_kind: 'opl_compatible_meta_agent',
    target_agent: {
      ...targetAgent,
      repo_dir: targetAgentDir,
      scaffold_status: String(scaffoldMaterializationReceipt.status),
      scaffold_validation_status: scaffoldValidation.standard_domain_agent_scaffold.validation.status,
      generated_interface_status: generatedInterfaces.generated_agent_interfaces.status,
      domain_pack_status: targetDomainPackSummary.status,
      stage_decomposition_status: 'typed_closeout_received',
    },
    ...domainPackReceiptFields(domainPackSummary),
    source_domain_pack: domainPackSummary,
    target_agent_domain_pack: targetDomainPackSummary,
    artifacts: {
      stage_decomposition_closeout_packet_ref: stageDecompositionCloseout.closeout_packet_ref,
      agent_skeleton_build_closeout_packet_ref: agentSkeletonBuildCloseout.closeout_packet_ref,
      scaffold_materialization_request_path: scaffoldMaterializationRequestPath,
      developer_proof_request_path: developerProofRequestPath,
      developer_proof_request_ref: developerProofRequest.request_ref,
      developer_proof_receipt_ref: developerProofReceiptRef,
      opl_agent_package_manifest_path: targetAgentPackageManifestPath,
      target_agent_capability_map_path: targetAgentCapabilityMapPath,
      target_agent_primary_skill_path: targetPrimarySkillPath,
      ...(agentBuildReceipt ? {
        agent_build_receipt_path: agentBuildReceiptPath,
        agent_build_receipt_ref: String(agentBuildReceiptRef),
      } : {}),
    },
    opl_agent_package_manifest_validation:
      targetAgentPackageManifestValidation.opl_agent_package_manifest,
    opl_generated_interfaces: generatedInterfaces.generated_agent_interfaces,
    opl_profile_conformance: targetProfileConformance,
    stage_decomposition_artifact: {
      stage_id: stageDecompositionCloseout.stage_id,
      closeout_packet_ref: stageDecompositionCloseout.closeout_packet_ref,
      closeout_refs: stageDecompositionCloseout.closeout_packet.closeout_refs,
    },
    agent_skeleton_build_artifact: {
      stage_id: agentSkeletonBuildCloseout.stage_id,
      closeout_packet_ref: agentSkeletonBuildCloseout.closeout_packet_ref,
      closeout_refs: agentSkeletonBuildCloseout.closeout_packet.closeout_refs,
    },
    agent_building_judgment: {
      ai_reviewer_evaluation_ref: aiReviewerEvaluationRef,
      verdict: aiReviewerEvaluation.verdict,
      source_refs: aiReviewerEvaluation.source_refs,
      direct_evidence_refs: aiReviewerEvaluation.direct_evidence_refs,
    },
    ...(aiReviewerQualityDebt
      ? {
          quality_debt: {
            reasons: [aiReviewerQualityDebt],
            blocks_stage_transition: false,
            blocks_delivery_or_promotion_claims: true,
          },
          next_stage_may_start: true,
          semantic_route_decision_owner: 'decisive_codex_attempt',
          stage_transition_materialization_owner: 'opl_stage_run_controller',
        }
      : {}),
    foundry_lab_handoff: {
      materialization_request: workOrderMaterializationRequest,
    },
    authority_boundary: workOrderMaterializationRequest.authority_boundary,
  };
}

function main() {
  const payload = runBuildAgentBaseline(parseBuildAgentBaselineArgs(process.argv.slice(2)));

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

if (import.meta.main) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
