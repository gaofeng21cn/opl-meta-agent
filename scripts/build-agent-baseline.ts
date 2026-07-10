#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs as parseNodeArgs } from 'node:util';
import {
  buildProfileSelectionReceipt,
  type DomainPackSummary,
  type JsonObject,
  domainPackReceiptFields,
  readDomainPackSummary,
  writeMinimalAgentDomainPack,
  writeTargetAgentCapabilityMap,
  writeTargetAgentPackageManifest,
  writeTargetAgentPrimarySkill,
} from './lib/domain-pack.ts';
import {
  assertTargetProfileConformance,
  materializeAgentBuildReceipt,
  materializeStageDecompositionPackDraft,
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
  buildActionStageContinuation,
  buildActionStageRouteCloseoutGate,
  closeoutForStage,
  evaluateActionStageRoute,
} from './lib/action-stage-route.ts';
import {
  type AiReviewerEvaluation,
  aiReviewerAcceptanceGates,
  aiReviewerReceiptFields,
  assertAiReviewerArtifactMorphologyEvidence,
  loadAiReviewerEvaluation,
} from './lib/meta-agent-loop-ai-reviewer.ts';
import {
  type TargetAgent,
  resolveOplBin,
  runOpl,
  writeJson,
} from './lib/meta-agent-loop-io.ts';
import {
  buildAgentLabSuiteSeed as buildExternalSuiteSeed,
} from './lib/meta-agent-loop-receipts.ts';
import {
  buildFoundryLabWorkOrder,
} from './lib/foundry-lab-work-order.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

function hasSourceDerivedDesignInput(parsed: {
  referenceDesignSourceRefs: string[];
  referenceDesignPatternNotes?: string[];
  referenceDesignPatternPacketRefs: string[];
}): boolean {
  return parsed.referenceDesignSourceRefs.length > 0
    || (parsed.referenceDesignPatternNotes?.length ?? 0) > 0
    || parsed.referenceDesignPatternPacketRefs.length > 0;
}

function hasDesignBasisInput(parsed: {
  referenceDesignSourceRefs: string[];
  referenceDesignPatternNotes: string[];
  referenceDesignPatternPacketRefs: string[];
  researchSourceRefs: string[];
  expertPracticeNotes: string[];
  researchSynthesisRefs: string[];
}): boolean {
  return hasSourceDerivedDesignInput(parsed)
    || parsed.researchSourceRefs.length > 0
    || parsed.expertPracticeNotes.length > 0
    || parsed.researchSynthesisRefs.length > 0;
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

  if (!parsed.aiReviewerEvaluationPath) {
    throw new Error(
      'Missing required --ai-reviewer-evaluation <path>; baseline delivery fails closed without structured AI reviewer evaluation.',
    );
  }
  if (!parsed.domainId) {
    throw new Error(
      'Missing required --domain-id <domain_id>; build-agent-baseline requires an explicit target agent.',
    );
  }
  if (parsed.selectedOplProfileRefs.length === 0 && !hasDesignBasisInput(parsed)) {
    throw new Error(
      'Missing required profile input; target agent generation requires --selected-opl-profile <profile_ref>, source-derived design refs via --reference-design-source / --reference-design-pattern / --reference-design-pattern-packet, or research-driven design refs via --research-source / --expert-practice / --research-synthesis.',
    );
  }
  if (parsed.selectedOplProfileRefs.length > 0 && !parsed.profileSelectionRationale) {
    throw new Error(
      'Missing required --profile-selection-rationale <rationale>; target agent generation requires profile selection rationale.',
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
    aiReviewerEvaluationPath: parsed.aiReviewerEvaluationPath,
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

function stageDecompositionBlockerFromError(error: unknown, targetAgent: TargetAgent): JsonObject {
  const message = errorMessage(error);
  const referenceDesignResolutionFailed = message.startsWith('reference_design_resolution_failed:');
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
      `typed-blocker:opl-meta-agent/${targetAgent.domain_id}/stage-decomposition/${referenceDesignResolutionFailed
        ? 'reference_design_resolution_failed'
        : 'materialization_failed'}`,
    ],
    blocked_reason: referenceDesignResolutionFailed
      ? 'reference_design_resolution_failed'
      : 'stage_decomposition_materialization_failed',
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

function buildBaselineAgentLabSuiteSeed({
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
  return buildExternalSuiteSeed({
    suiteId: `opl-meta-agent-baseline-suite:${targetAgent.domain_id}`,
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
    evidenceRefs: [
      `evidence-ref:${targetAgent.domain_id}/scaffold-validation`,
      ...referenceDesignEvidenceRefs(targetAgent),
    ],
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
  if (!routeProgress.complete) {
    return buildActionStageContinuation(routeProgress);
  }
  const routeCloseoutGate = buildActionStageRouteCloseoutGate(routeProgress);
  const stageDecompositionCloseout = closeoutForStage(routeProgress, 'stage-decomposition');
  const agentSkeletonBuildCloseout = closeoutForStage(routeProgress, 'agent-skeleton-build');
  fs.mkdirSync(outputDir, { recursive: true });
  const domainPackSummary = readDomainPackSummary(repoRoot, { domainId: 'opl-meta-agent' });
  const aiReviewerEvaluation = loadAiReviewerEvaluation(aiReviewerEvaluationPath);
  assertAiReviewerArtifactMorphologyEvidence(aiReviewerEvaluation, 'Baseline delivery');
  targetAgent = resolveTargetAgentProfileSelection(targetAgent, oplBin);

  const targetAgentLabel = targetAgent.domain_label ?? targetAgent.domain_id;
  const targetAgentDir = path.join(outputDir, targetAgent.domain_id);
  const suiteSeedPath = path.join(outputDir, 'agent-lab-suite-seed.json');
  const foundryLabWorkOrderPath = path.join(outputDir, 'foundry-lab-work-order.json');

  try {
    buildProfileSelectionReceipt(targetAgent);
  } catch (error) {
    const blocker = stageDecompositionBlockerFromError(error, targetAgent);
    const blockerPath = writeStageDecompositionBlocker(outputDir, targetAgent, blocker);
    throw new Error(
      `Stage decomposition failed closed; typed blocker written to ${blockerPath}: ${blocker.blocker_message}`,
    );
  }

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
  const targetPrimarySkillPath = writeTargetAgentPrimarySkill(targetAgentDir, targetAgent);
  let stageDecompositionPackDraft: StageDecompositionPackDraft;
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
    materializeStageDecompositionPackDraft(
      targetAgentDir,
      stageDecompositionPackDraft,
      materializedFiles,
    );
  } catch (error) {
    const blocker = stageDecompositionBlockerFromError(error, targetAgent);
    const blockerPath = writeStageDecompositionBlocker(outputDir, targetAgent, blocker);
    throw new Error(
      `Stage decomposition failed closed; typed blocker written to ${blockerPath}: ${blocker.blocker_message}`,
    );
  }
  writeTargetAgentCapabilityMap(targetAgentDir, targetAgent, null);
  const agentBuildReceipt = materializeAgentBuildReceipt(targetAgentDir, targetAgent);
  const descriptorPath = path.join(targetAgentDir, 'contracts', 'domain_descriptor.json');
  const descriptor = JSON.parse(fs.readFileSync(descriptorPath, 'utf8'));
  const profileSelectionReceipt = buildProfileSelectionReceipt(targetAgent);
  const agentBuildReceiptPath = path.join(targetAgentDir, 'contracts', 'agent_build_receipt.json');
  const agentBuildReceiptRef = agentBuildReceipt?.receipt_ref ?? null;
  if (
    profileSelectionReceipt.expected_build_receipt_ref
    && agentBuildReceiptRef !== profileSelectionReceipt.expected_build_receipt_ref
  ) {
    throw new Error('Target descriptor requires the post-materialization AgentBuildReceipt.');
  }
  writeJson(descriptorPath, {
    ...descriptor,
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
    ...(agentBuildReceipt ? {
      build_receipt: agentBuildReceipt,
      build_receipt_ref: agentBuildReceiptRef,
    } : {}),
    stage_decomposition_subpacket_set: profileSelectionReceipt.stage_decomposition_subpacket_set,
    stage_decomposition_subpacket_set_ref: profileSelectionReceipt.stage_decomposition_subpacket_set_ref,
    stage_decomposition_subpacket_set_refs: profileSelectionReceipt.stage_decomposition_subpacket_set_ref
      ? [profileSelectionReceipt.stage_decomposition_subpacket_set_ref]
      : [],
    transferable_pattern_requirements: profileSelectionReceipt.transferable_pattern_requirements,
    capability_plan_requirements: profileSelectionReceipt.capability_plan_requirements,
  });
  const targetAgentCapabilityMapPath = writeTargetAgentCapabilityMap(
    targetAgentDir,
    targetAgent,
    agentBuildReceipt,
  );
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
  const targetAgentPackageManifestPath = writeTargetAgentPackageManifest(targetAgentDir, targetAgent);
  const targetAgentPackageManifestValidation = runOpl(oplBin, [
    'connect',
    'agent-packages',
    'validate-manifest',
    '--manifest-url', pathToFileURL(targetAgentPackageManifestPath).href,
    '--trust-tier', 'first_party',
    '--source-kind', 'local_file',
    '--json',
  ]);
  const targetProfileConformance = assertTargetProfileConformance(oplBin, targetAgentDir, targetAgent);

  const suiteSeed = buildBaselineAgentLabSuiteSeed({
    targetAgent,
    targetAgentDir,
    aiReviewerEvaluation,
    aiReviewerEvaluationRef: aiReviewerEvaluationPath,
  });
  writeJson(suiteSeedPath, suiteSeed);

  const foundryLabWorkOrder = buildFoundryLabWorkOrder({
    workOrderKind: 'agent_baseline_evaluation',
    targetAgent: {
      ...targetAgent,
      repo_dir: targetAgentDir,
      target_agent_ref: `domain-agent:${targetAgent.domain_id}`,
      descriptor_ref: path.join(targetAgentDir, 'contracts', 'domain_descriptor.json'),
    },
    suiteSeed,
    suiteSeedRef: path.basename(suiteSeedPath),
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
    status: 'candidate_package_materialized_ready_for_opl_foundry_lab_evaluation',
    product_id: 'opl-meta-agent',
    meta_agent_kind: 'opl_compatible_meta_agent',
    target_agent: {
      ...targetAgent,
      repo_dir: targetAgentDir,
      scaffold_status: scaffold.standard_domain_agent_scaffold.state,
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
      agent_lab_suite_seed_path: suiteSeedPath,
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
    action_stage_route_closeout: routeCloseoutGate,
    agent_building_judgment: {
      ai_reviewer_evaluation_ref: aiReviewerEvaluationPath,
      verdict: aiReviewerEvaluation.verdict,
      source_refs: aiReviewerEvaluation.source_refs,
      direct_evidence_refs: aiReviewerEvaluation.direct_evidence_refs,
    },
    foundry_lab_handoff: {
      suite_seed: suiteSeed,
      work_order: foundryLabWorkOrder,
    },
    authority_boundary: foundryLabWorkOrder.authority_boundary,
  };
}

function main() {
  const payload = runBuildAgentBaseline(parseBuildAgentBaselineArgs(process.argv.slice(2)));

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
