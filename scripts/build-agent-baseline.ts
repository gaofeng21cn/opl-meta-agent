#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
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
  assertTargetProfileConformance,
  buildScaffoldMaterializationRequest,
  delegateScaffoldMaterialization,
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
  buildActionStageRouteContext,
  evaluateActionStageRoute,
} from './lib/action-stage-route.ts';
import {
  type AiReviewerEvaluation,
  assertAiReviewerArtifactMorphologyEvidence,
  loadAiReviewerEvaluation,
} from './lib/meta-agent-loop-ai-reviewer.ts';
import {
  type TargetAgent,
  resolveOplBin,
  runOpl,
  sha256FileBytes,
  writeJson,
} from './lib/meta-agent-loop-io.ts';
import {
  buildFoundryEvaluationRequest,
} from './lib/meta-agent-loop-receipts.ts';
import {
  buildFoundryLabWorkOrder,
} from './lib/foundry-lab-work-order.ts';

const repoRoot = path.resolve(import.meta.dirname, '..');

export type BuildAgentBaselineArgs = {
  outputDir: string;
  oplBin: string;
  aiReviewerEvaluationPath: string;
  targetAgent: TargetAgent;
  stageRunReadbackPaths: string[];
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
    oplBin: string;
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
    stageRunReadbackPaths: string[];
  } = {
    outputDir: null,
    oplBin: resolveOplBin(),
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
    stageRunReadbackPaths: [],
  };

  const { values } = parseNodeArgs({
    args: argv,
    options: {
      'output-dir': { type: 'string' },
      'opl-bin': { type: 'string' },
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
      'stage-run-readback': { type: 'string', multiple: true },
    },
    strict: true,
    allowPositionals: false,
  });
  if (typeof values['output-dir'] === 'string') {
    parsed.outputDir = path.resolve(nonEmptyValue('--output-dir', values['output-dir']));
  }
  if (typeof values['opl-bin'] === 'string') {
    parsed.oplBin = resolveOplBin(nonEmptyValue('--opl-bin', values['opl-bin']));
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
  parsed.stageRunReadbackPaths = nonEmptyStringList(
    '--stage-run-readback',
    values['stage-run-readback'],
  ).map((readbackPath) => path.resolve(readbackPath));

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
    oplBin: parsed.oplBin,
    aiReviewerEvaluationPath: parsed.aiReviewerEvaluationPath ?? '',
    targetAgent,
    stageRunReadbackPaths: parsed.stageRunReadbackPaths,
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
      route_back_selection_owner: 'codex_cli',
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

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && Boolean(entry.trim()))
      .map((entry) => entry.trim())
    : [];
}

function jsonObject(value: unknown, field: string): JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${field} must be a JSON object.`);
  }
  return value as JsonObject;
}

function assertScaffoldValidationPassed(scaffoldValidation: JsonObject): void {
  const scaffold = jsonObject(
    scaffoldValidation.standard_domain_agent_scaffold,
    'OPL scaffold validation standard_domain_agent_scaffold',
  );
  const validation = jsonObject(
    scaffold.validation,
    'OPL scaffold validation standard_domain_agent_scaffold.validation',
  );
  if (validation.status !== 'passed') {
    const blockers = stringArray(validation.blockers);
    throw new Error(
      `OPL scaffold validation did not pass: ${blockers.length > 0 ? blockers.join(', ') : 'unknown_scaffold_validation_failure'}.`,
    );
  }
}

function canonicalBuiltinProfileRef(value: string): string {
  if (value.startsWith('opl-profile-route:')) {
    throw new Error(`Selected OPL profile must be a builtin profile, not a route ref: ${value}`);
  }
  const profileId = value.startsWith('opl-profile:')
    ? value.slice('opl-profile:'.length)
    : value;
  if (!/^[A-Za-z0-9._-]+$/.test(profileId)) {
    throw new Error(`Selected OPL profile ref is invalid: ${value}`);
  }
  return `opl-profile:${profileId}`;
}

function validatedExplicitProfileRefs(targetAgent: TargetAgent, oplBin: string): string[] {
  const profileRefs = [...new Set(
    stringArray(targetAgent.selected_opl_profile_refs).map(canonicalBuiltinProfileRef),
  )];
  for (const profileRef of profileRefs) {
    const profileId = profileRef.slice('opl-profile:'.length);
    const readback = runOpl(oplBin, ['profiles', 'inspect', profileId, '--json']);
    const inspect = jsonObject(readback.agent_profile_inspect, 'OPL profile inspect readback');
    const profile = inspect.status === 'found'
      ? jsonObject(inspect.profile, 'OPL profile inspect profile')
      : null;
    if (!profile || profile.profile_ref !== profileRef) {
      throw new Error(`Selected OPL profile is unknown or unavailable: ${profileRef}`);
    }
  }
  return profileRefs;
}

export function resolveTargetAgentProfileSelection(
  targetAgent: TargetAgent,
  oplBin: string,
): TargetAgent {
  const explicitProfileRefs = validatedExplicitProfileRefs(targetAgent, oplBin);
  if (explicitProfileRefs.length > 1) {
    throw new Error(`Multiple builtin OPL profiles are not supported for one target agent: ${explicitProfileRefs.join(', ')}`);
  }
  const intent = targetAgent.target_brief?.trim();
  if (!intent) {
    return explicitProfileRefs.length > 0
      ? { ...targetAgent, selected_opl_profile_refs: explicitProfileRefs }
      : targetAgent;
  }
  const selectorArgs = ['profiles', 'select', '--intent', intent];
  stringArray(targetAgent.intent_signals).forEach((signal) => {
    selectorArgs.push('--intent-signal', signal);
  });
  stringArray(targetAgent.reference_design_source_refs).forEach((sourceRef) => {
    selectorArgs.push('--reference-source', sourceRef);
  });
  stringArray(targetAgent.reference_design_pattern_packet_refs).forEach((packetRef) => {
    selectorArgs.push('--pattern-packet', packetRef);
  });
  const readback = runOpl(oplBin, [...selectorArgs, '--json']);
  const receipt = readback.profile_selection_receipt;
  if (typeof receipt !== 'object' || receipt === null || Array.isArray(receipt)) {
    throw new Error('OPL profile selector readback is missing profile_selection_receipt.');
  }
  const selectorProfileRefs = stringArray((receipt as JsonObject).selected_profile_refs)
    .filter((profileRef) => profileRef.startsWith('opl-profile:') && !profileRef.startsWith('opl-profile-route:'))
    .map(canonicalBuiltinProfileRef);
  const selectedProfileRefs = [...new Set([
    ...explicitProfileRefs,
    ...selectorProfileRefs,
  ])];
  if (selectedProfileRefs.length > 1) {
    throw new Error(`Multiple builtin OPL profiles are not supported for one target agent: ${selectedProfileRefs.join(', ')}`);
  }
  const matchedSignals = stringArray((receipt as JsonObject).matched_trigger_signals);
  return {
    ...targetAgent,
    ...(selectedProfileRefs.length > 0
      ? {
          selected_opl_profile_refs: selectedProfileRefs,
          profile_selection_rationale: targetAgent.profile_selection_rationale?.trim()
            || `OPL profile selector matched lower-bound signals: ${matchedSignals.join(', ') || 'explicit profile selection'}.`,
        }
      : {
          selected_opl_profile_refs: undefined,
          profile_selection_rationale: undefined,
        }),
  };
}

function buildBaselineFoundryEvaluationRequest({
  targetAgent,
  aiReviewerEvaluation,
  aiReviewerEvaluationRef,
}: {
  targetAgent: TargetAgent;
  aiReviewerEvaluation: AiReviewerEvaluation;
  aiReviewerEvaluationRef: string;
}): JsonObject {
  return buildFoundryEvaluationRequest({
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
    receiptRefs: [`owner-receipt:opl-meta-agent/${targetAgent.domain_id}/baseline-delivery`],
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

export function runBuildAgentBaseline({
    outputDir,
    oplBin,
    aiReviewerEvaluationPath,
    targetAgent,
    stageRunReadbackPaths,
  }: BuildAgentBaselineArgs): JsonObject {
  const routeProgress = evaluateActionStageRoute({
    repoRoot,
    actionId: 'build-agent-baseline',
    stageRunReadbackPaths,
  });
  const routeContext = buildActionStageRouteContext(routeProgress);
  fs.mkdirSync(outputDir, { recursive: true });
  const stageDecompositionCloseout = routeProgress.stage_closeouts.find(
    (entry) => entry.stage_id === 'stage-decomposition',
  );
  const agentSkeletonBuildCloseout = routeProgress.stage_closeouts.find(
    (entry) => entry.stage_id === 'agent-skeleton-build',
  );
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
      route_back_selection_owner: 'codex_cli',
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
  const evaluationRequestPath = path.join(outputDir, 'foundry-evaluation-request.json');
  const foundryLabWorkOrderPath = path.join(outputDir, 'foundry-lab-work-order.json');

  try {
    targetAgent = resolveTargetAgentProfileSelection(targetAgent, oplBin);
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
  let stageDecompositionPackDraft: StageDecompositionPackDraft;
  let scaffoldMaterializationReceipt: JsonObject;
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
    scaffoldMaterializationReceipt = delegateScaffoldMaterialization({
      oplBin,
      targetAgentDir,
      requestPath: scaffoldMaterializationRequestPath,
      request: scaffoldMaterializationRequest,
    });
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
      route_back_selection_owner: 'codex_cli',
    };
  }
  const agentBuildReceipt = scaffoldMaterializationReceipt.build_receipt as JsonObject;
  const descriptorPath = path.join(targetAgentDir, 'contracts', 'domain_descriptor.json');
  const profileSelectionReceipt = buildProfileSelectionReceipt(targetAgent);
  const agentBuildReceiptPath = path.join(targetAgentDir, 'contracts', 'agent_build_receipt.json');
  const agentBuildReceiptRef = agentBuildReceipt.receipt_ref ?? null;
  let targetDomainPackSummary: JsonObject;
  let scaffoldValidation: JsonObject;
  let generatedInterfaces: JsonObject;
  let targetAgentPackageManifestValidation: JsonObject;
  let targetProfileConformance: JsonObject;
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
    scaffoldValidation = runOpl(oplBin, [
      'agents', 'scaffold', '--validate', targetAgentDir, '--json',
    ]);
    assertScaffoldValidationPassed(scaffoldValidation);
    generatedInterfaces = runOpl(oplBin, [
      'agents', 'interfaces', '--repo-dir', targetAgentDir, '--json',
    ]);
    targetAgentPackageManifestValidation = runOpl(oplBin, [
      'packages', 'validate-manifest',
      '--manifest-url', pathToFileURL(targetAgentPackageManifestPath).href,
      '--trust-tier', 'first_party', '--source-kind', 'local_file', '--json',
    ]);
    targetProfileConformance = assertTargetProfileConformance(oplBin, targetAgentDir, targetAgent);
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
      route_back_selection_owner: 'codex_cli',
    };
  }
  const evaluationRequest = buildBaselineFoundryEvaluationRequest({
    targetAgent,
    aiReviewerEvaluation,
    aiReviewerEvaluationRef: aiReviewerEvaluationPath,
  });
  writeJson(evaluationRequestPath, evaluationRequest);

  const foundryLabWorkOrder = buildFoundryLabWorkOrder({
    workOrderKind: 'agent_baseline_evaluation',
    targetAgent: {
      ...targetAgent,
      repo_dir: targetAgentDir,
      target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
      descriptor_ref: path.join(targetAgentDir, 'contracts', 'domain_descriptor.json'),
    },
    evaluationRequest,
    evaluationRequestRef: path.basename(evaluationRequestPath),
    evaluationRequestSha256: sha256FileBytes(evaluationRequestPath),
    sourceRefs: [
      descriptorPath,
      targetAgentPackageManifestPath,
      targetAgentCapabilityMapPath,
      stageDecompositionCloseout.stage_attempt_ref,
      stageDecompositionCloseout.closeout_packet_ref,
      agentSkeletonBuildCloseout.stage_attempt_ref,
      agentSkeletonBuildCloseout.closeout_packet_ref,
      ...referenceDesignEvidenceRefs(targetAgent),
    ].filter((ref): ref is string => typeof ref === 'string' && ref.length > 0),
    reviewerRefs: [
      aiReviewerEvaluationPath,
      ...aiReviewerEvaluation.source_refs,
      ...aiReviewerEvaluation.direct_evidence_refs,
    ],
    candidateRefs: [
      'candidate-agent-package:' + targetAgent.domain_id,
      'improvement-candidate:opl-meta-agent/' + targetAgent.domain_id + '/rubric-gap-tightening',
    ],
  });
  writeJson(foundryLabWorkOrderPath, foundryLabWorkOrder);

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
      stage_decomposition_stage_run_readback_path: stageDecompositionCloseout.readback_path,
      agent_skeleton_build_stage_run_readback_path: agentSkeletonBuildCloseout.readback_path,
      scaffold_materialization_request_path: scaffoldMaterializationRequestPath,
      foundry_evaluation_request_path: evaluationRequestPath,
      foundry_lab_work_order_path: foundryLabWorkOrderPath,
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
    stage_decomposition_attempt: {
      stage_id: stageDecompositionCloseout.stage_id,
      stage_attempt_ref: stageDecompositionCloseout.stage_attempt_ref,
      closeout_packet_ref: stageDecompositionCloseout.closeout_packet_ref,
      closeout_refs: stageDecompositionCloseout.closeout_packet.closeout_refs,
    },
    agent_skeleton_build_attempt: {
      stage_id: agentSkeletonBuildCloseout.stage_id,
      stage_attempt_ref: agentSkeletonBuildCloseout.stage_attempt_ref,
      closeout_packet_ref: agentSkeletonBuildCloseout.closeout_packet_ref,
      closeout_refs: agentSkeletonBuildCloseout.closeout_packet.closeout_refs,
    },
    action_stage_route_context: routeContext,
    agent_building_judgment: {
      ai_reviewer_evaluation_ref: aiReviewerEvaluationPath,
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
          route_back_selection_owner: 'codex_cli',
        }
      : {}),
    foundry_lab_handoff: {
      evaluation_request: evaluationRequest,
      work_order: foundryLabWorkOrder,
    },
    authority_boundary: foundryLabWorkOrder.authority_boundary,
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
