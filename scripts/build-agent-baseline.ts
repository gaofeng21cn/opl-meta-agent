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
  writeMinimalAgentDomainPack,
} from './lib/domain-pack.ts';
import {
  materializeStageDecompositionPackDraft,
} from './lib/stage-decomposition-pack-draft-parts/materializer.ts';
import type {
  StageRunnerKind,
} from './lib/stage-decomposition-pack-draft-parts/shared.ts';
import {
  validateStageDecompositionCloseoutPacket,
} from './lib/stage-decomposition-pack-draft-parts/validator.ts';
import {
  type StageDecompositionAttemptReceipt,
  runStageDecompositionAttempt,
} from './lib/stage-decomposition-runner.ts';
import {
  type AiReviewerEvaluation,
  aiReviewerAcceptanceGates,
  aiReviewerReceiptFields,
  loadAiReviewerEvaluation,
} from './lib/meta-agent-loop-ai-reviewer.ts';
import {
  type TargetAgent,
  resolveOplBin,
  runOpl,
  writeJson,
} from './lib/meta-agent-loop-io.ts';
import {
  type LearningCandidate,
  type OwnerReceipt,
  type SuiteResult,
  buildAgentLabSuite as buildExternalSuite,
  buildLearningCandidate as buildGatedLearningCandidate,
  buildMechanismPatchProposal,
  buildOwnerReceipt,
  buildRealTargetDeliveryReceipt,
  buildScaleoutEvidenceLedger,
} from './lib/meta-agent-loop-receipts.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export type BuildAgentBaselineArgs = {
  outputDir: string;
  oplBin: string;
  aiReviewerEvaluationPath: string;
  targetAgent: TargetAgent;
  stageRunner: StageRunnerKind;
  stageCloseoutPacketPath: string | null;
};

type NewAgentDeliveryGateInput = {
  targetAgent: TargetAgent;
  scaffoldValidationStatus: string;
  generatedInterfaceStatus: string;
  baselineSuiteResult: JsonObject;
  realTargetSuiteResult?: JsonObject | null;
  aiReviewerEvaluation: AiReviewerEvaluation | JsonObject;
  selfEvolutionConsumptionRef?: string | null;
  deliveryReceipt?: JsonObject | null;
  noPatchCoordinationReceipt?: JsonObject | null;
  developerPatchWorkOrder?: JsonObject | null;
  typedBlocker?: JsonObject | null;
  stageRunRefsOnlyConsumptionRef?: string | null;
  stageCompletionPolicyRef?: string | null;
  stageCloseoutPacketRef?: string | null;
  targetOwnerReceiptOrTypedBlockerOrHumanGateRef?: string | null;
  noForbiddenWriteProofRef?: string | null;
  sourceMorphologyRef?: string | null;
  ownerRouteRef?: string | null;
  generatedSurfaceConsumptionRef?: string | null;
  privateResidueDecisionRef?: string | null;
  ownerAnswerShape?: string | null;
  providerCompletionIsDomainCompletion?: boolean;
  omaTargetAuthorityBoundary?: JsonObject | null;
};

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function objectHasNonEmptyString(value: unknown, field: string): boolean {
  return (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && nonEmptyString((value as Record<string, unknown>)[field])
  );
}

function suiteResultRef(value: JsonObject | null | undefined): string | null {
  if (!value) {
    return null;
  }
  for (const field of ['result_id', 'suite_result_ref', 'run_ref']) {
    const candidate = value[field];
    if (nonEmptyString(candidate)) {
      return candidate;
    }
  }
  return null;
}

function booleanTrueField(value: JsonObject | null | undefined, field: string): boolean {
  return value?.[field] === true;
}

export function assertNewAgentDeliveryGate(input: NewAgentDeliveryGateInput): JsonObject {
  const baselineSuiteRef = suiteResultRef(input.baselineSuiteResult);
  const realTargetSuiteRef = suiteResultRef(input.realTargetSuiteResult ?? null);
  const closeoutOutcomes = [
    input.deliveryReceipt ? 'delivery_receipt' : null,
    input.noPatchCoordinationReceipt ? 'no_patch_coordination_receipt' : null,
    input.developerPatchWorkOrder ? 'developer_patch_work_order' : null,
    input.typedBlocker ? 'typed_blocker' : null,
  ].filter((entry): entry is string => Boolean(entry));
  const blockers = [
    ['passed', 'valid', 'validated'].includes(input.scaffoldValidationStatus)
      ? null
      : 'scaffold_validation_not_passed',
    input.generatedInterfaceStatus === 'ready'
      ? null
      : 'generated_interface_projection_not_ready',
    baselineSuiteRef
      ? null
      : 'agent_lab_baseline_or_takeover_suite_ref_missing',
    input.baselineSuiteResult.status === 'passed'
      ? null
      : 'agent_lab_baseline_or_takeover_suite_not_passed',
    realTargetSuiteRef
      ? null
      : 'real_target_or_external_suite_ref_missing',
    objectHasNonEmptyString(input.aiReviewerEvaluation, 'critique')
      ? null
      : 'ai_reviewer_critique_missing',
    Array.isArray(input.aiReviewerEvaluation.suggestions) && input.aiReviewerEvaluation.suggestions.length > 0
      ? null
      : 'ai_reviewer_suggestions_missing',
    Array.isArray(input.aiReviewerEvaluation.direct_evidence_refs)
      && input.aiReviewerEvaluation.direct_evidence_refs.length > 0
      ? null
      : 'ai_reviewer_direct_evidence_refs_missing',
    objectHasNonEmptyString(input.aiReviewerEvaluation, 'run_ref')
      && objectHasNonEmptyString(input.aiReviewerEvaluation, 'review_attempt_ref')
      ? null
      : 'ai_reviewer_provenance_missing',
    nonEmptyString(input.selfEvolutionConsumptionRef)
      ? null
      : 'self_evolution_consumption_ref_missing',
    nonEmptyString(input.stageRunRefsOnlyConsumptionRef)
      ? null
      : 'stage_run_refs_only_consumption_ref_missing',
    nonEmptyString(input.stageCompletionPolicyRef)
      ? null
      : 'stage_completion_policy_ref_missing',
    nonEmptyString(input.stageCloseoutPacketRef)
      ? null
      : 'stage_closeout_packet_ref_missing',
    nonEmptyString(input.targetOwnerReceiptOrTypedBlockerOrHumanGateRef)
      ? null
      : 'target_owner_receipt_or_typed_blocker_or_human_gate_ref_missing',
    nonEmptyString(input.noForbiddenWriteProofRef)
      ? null
      : 'no_forbidden_write_proof_ref_missing',
    nonEmptyString(input.sourceMorphologyRef)
      ? null
      : 'source_morphology_ref_missing',
    nonEmptyString(input.ownerRouteRef)
      ? null
      : 'owner_route_ref_missing',
    nonEmptyString(input.generatedSurfaceConsumptionRef)
      ? null
      : 'generated_surface_consumption_ref_missing',
    nonEmptyString(input.privateResidueDecisionRef)
      ? null
      : 'private_residue_decision_ref_missing',
    [
      'owner_receipt',
      'typed_blocker',
      'human_gate',
      'route_back',
      'rejected',
      'completed_and_continue',
      'completed_and_wait_owner',
    ].includes(input.ownerAnswerShape ?? '')
      ? null
      : 'owner_answer_shape_missing_or_unaccepted',
    input.providerCompletionIsDomainCompletion === true
      ? 'provider_completion_is_domain_completion_forbidden'
      : null,
    booleanTrueField(input.omaTargetAuthorityBoundary ?? null, 'can_write_target_domain_truth')
      ? 'oma_target_authority_boundary_can_write_target_domain_truth_forbidden'
      : null,
    booleanTrueField(input.omaTargetAuthorityBoundary ?? null, 'can_write_target_owner_receipt_body')
      ? 'oma_target_authority_boundary_can_write_target_owner_receipt_body_forbidden'
      : null,
    booleanTrueField(input.omaTargetAuthorityBoundary ?? null, 'can_mutate_target_domain_artifact_body')
      ? 'oma_target_authority_boundary_can_mutate_target_domain_artifact_body_forbidden'
      : null,
    booleanTrueField(input.omaTargetAuthorityBoundary ?? null, 'can_authorize_target_domain_quality_or_export')
      ? 'oma_target_authority_boundary_can_authorize_target_domain_quality_or_export_forbidden'
      : null,
    closeoutOutcomes.length === 1
      ? null
      : 'exactly_one_closeout_outcome_required',
  ].filter((entry): entry is string => Boolean(entry));
  if (blockers.length > 0) {
    throw new Error(`new_agent_delivery_gate_blocked:${blockers.join(',')}`);
  }
  return {
    surface_kind: 'opl_meta_agent_new_agent_delivery_gate',
    policy_id: 'opl-meta-agent.new-agent-delivery-gate.v1',
    gate_status: 'passed',
    target_agent: input.targetAgent,
    required_evidence: {
      scaffold_validation_status: input.scaffoldValidationStatus,
      generated_interface_status: input.generatedInterfaceStatus,
      baseline_or_takeover_suite_result_ref: baselineSuiteRef,
      real_target_or_external_suite_result_ref: realTargetSuiteRef,
      ai_reviewer_run_ref: input.aiReviewerEvaluation.run_ref,
      ai_reviewer_review_attempt_ref: input.aiReviewerEvaluation.review_attempt_ref,
      self_evolution_consumption_ref: input.selfEvolutionConsumptionRef,
      stage_run_refs_only_consumption_ref: input.stageRunRefsOnlyConsumptionRef,
      stage_completion_policy_ref: input.stageCompletionPolicyRef,
      stage_closeout_packet_ref: input.stageCloseoutPacketRef,
      target_owner_receipt_or_typed_blocker_or_human_gate_ref:
        input.targetOwnerReceiptOrTypedBlockerOrHumanGateRef,
      no_forbidden_write_proof_ref: input.noForbiddenWriteProofRef,
      source_morphology_ref: input.sourceMorphologyRef,
      owner_route_ref: input.ownerRouteRef,
      generated_surface_consumption_ref: input.generatedSurfaceConsumptionRef,
      private_residue_decision_ref: input.privateResidueDecisionRef,
      owner_answer_shape: input.ownerAnswerShape,
      closeout_outcome: closeoutOutcomes[0],
      closeout_outcome_count: closeoutOutcomes.length,
    },
    false_completion_guard: {
      scaffold_or_generated_interface_can_claim_complete: false,
      contract_validation_can_claim_complete: false,
      suite_pass_can_claim_complete: false,
      provider_completion_can_claim_complete: false,
      missing_source_morphology_owner_route_generated_consumption_private_residue_or_owner_answer_fails_closed: true,
      exactly_one_closeout_outcome_required: true,
    },
    authority_boundary: {
      delegates_work_order_execution_to_opl: true,
      oma_can_write_target_domain_truth: false,
      oma_can_write_target_domain_memory_body: false,
      oma_can_mutate_target_domain_artifact_body: false,
      oma_can_authorize_target_domain_quality_or_export: false,
      oma_can_manage_target_worktree_lifecycle: false,
      oma_can_write_target_owner_receipt_body: false,
      oma_can_promote_default_agent_without_gate: false,
    },
  };
}

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

export function parseBuildAgentBaselineArgs(argv: string[]): BuildAgentBaselineArgs {
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
    stageRunner: 'live',
    stageCloseoutPacketPath: null,
  };

  const { values, tokens } = parseNodeArgs({
    args: argv,
    options: {
      'output-dir': { type: 'string' },
      'opl-bin': { type: 'string' },
      'ai-reviewer-evaluation': { type: 'string' },
      'domain-id': { type: 'string' },
      'domain-label': { type: 'string' },
      'delivery-domain': { type: 'string' },
      'target-brief': { type: 'string' },
      'stage-runner': { type: 'string' },
      'stage-closeout-packet': { type: 'string' },
      'stage-decomposition-closeout': { type: 'string' },
    },
    strict: true,
    allowPositionals: false,
    tokens: true,
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
  if (typeof values['stage-runner'] === 'string') {
    const runner = nonEmptyValue('--stage-runner', values['stage-runner']);
    if (runner !== 'fixture' && runner !== 'live') {
      throw new Error('Value for --stage-runner must be fixture or live.');
    }
    parsed.stageRunner = runner;
  }
  const stageCloseoutPacket = tokens
    .filter((token) =>
      token.kind === 'option'
      && (token.name === 'stage-closeout-packet' || token.name === 'stage-decomposition-closeout')
    )
    .at(-1);
  if (stageCloseoutPacket?.kind === 'option') {
    parsed.stageCloseoutPacketPath = path.resolve(nonEmptyValue(stageCloseoutPacket.rawName, stageCloseoutPacket.value));
  }

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
  if (parsed.stageRunner === 'fixture' && !parsed.stageCloseoutPacketPath) {
    throw new Error(
      'Missing required --stage-decomposition-closeout <path>; fixture runner only consumes an explicit typed closeout packet.',
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
  };
  return {
    outputDir: parsed.outputDir,
    oplBin: parsed.oplBin,
    aiReviewerEvaluationPath: parsed.aiReviewerEvaluationPath,
    targetAgent,
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

function hasMorphologyEvidenceRef(ref: string): boolean {
  const normalized = ref.toLowerCase();
  return normalized.includes('artifact-morphology')
    || normalized.includes('artifact_morphology')
    || normalized.includes('morphology-evidence')
    || normalized.includes('realistic-target-task-review')
    || normalized.includes('artifact-native-source-format')
    || normalized.includes('artifact-shard-unit')
    || normalized.includes('target-extent-contract')
    || normalized.includes('asset-custody');
}

function assertBaselineReviewerMorphologyEvidence(aiReviewerEvaluation: AiReviewerEvaluation): void {
  const sourceHasMorphology = aiReviewerEvaluation.source_refs.some(hasMorphologyEvidenceRef);
  const directHasMorphology = aiReviewerEvaluation.direct_evidence_refs.some(hasMorphologyEvidenceRef);
  if (!sourceHasMorphology || !directHasMorphology) {
    throw new Error(
      'Baseline delivery requires AI reviewer artifact morphology evidence in source_refs and direct_evidence_refs before signing receipt.',
    );
  }
}

function targetPrimarySkillRef(): string {
  return 'agent/primary_skill/SKILL.md';
}

function buildTargetAgentPrimarySkillMarkdown(targetAgent: TargetAgent): string {
  const domainId = targetAgent.domain_id;
  const domainLabel = targetAgent.domain_label ?? domainId;
  const targetBrief = targetAgent.target_brief
    ?? `Create an owner-gated ${domainLabel} delivery from declared workspace refs.`;
  return [
    '---',
    `name: ${domainId}`,
    `description: Use when Codex should operate ${domainLabel} as an OPL-compatible target agent.`,
    '---',
    '',
    `# ${domainLabel}`,
    '',
    '## Purpose',
    '',
    `Use this primary skill to operate the OPL-compatible ${domainLabel} target agent. The target job is: ${targetBrief}`,
    '',
    '## Entry',
    '',
    '- Start from the user-visible requested deliverable, source refs, quality bar, non-goals, and owner boundary.',
    '- Route work through this target agent primary skill before invoking narrower prompt, stage, quality gate, or method refs.',
    '- Keep OPL generated interfaces as carrier and runtime projection surfaces, not as target truth or quality verdicts.',
    '',
    '## Agent Lab And Owner Handoff',
    '',
    '- Preserve descriptor, action catalog, stage control plane, quality gate, capability map, and owner route refs.',
    '- Return Agent Lab evidence, independent reviewer evidence, no-forbidden-write proof, and owner-facing closeout refs.',
    '- When the target cannot proceed without authority, return typed blocker, human gate, route-back, or owner-gated continuation.',
    '',
    '## Delivery Gate',
    '',
    '- Scaffold exists is not completion.',
    '- Generated interface readiness is not completion.',
    '- Contract or manifest validation is not completion.',
    '- Suite pass is not completion.',
    '- Provider completion is not domain completion.',
    '- Complete delivery requires owner-routable evidence and one accepted closeout outcome: owner receipt, typed blocker, human gate, route-back, or owner-gated continuation.',
    '',
    '## Authority Boundary',
    '',
    '- OPL owns standard runtime, generated / hosted surfaces, package validation, Agent Lab execution, registry / App projection, and work-order lifecycle.',
    '- OPL Meta Agent generated this candidate primary skill and capability sidecar, but does not own final target truth.',
    '- The target domain owner owns domain truth, memory body, artifact body, quality/export verdict, owner receipt, human gate, and default promotion authority.',
    '',
  ].join('\n');
}

function writeTargetAgentPrimarySkill(targetAgentDir: string, targetAgent: TargetAgent): string {
  const primarySkillPath = path.join(targetAgentDir, targetPrimarySkillRef());
  fs.mkdirSync(path.dirname(primarySkillPath), { recursive: true });
  fs.writeFileSync(primarySkillPath, buildTargetAgentPrimarySkillMarkdown(targetAgent), 'utf8');
  return primarySkillPath;
}

function buildTargetAgentPrimarySkillCapability(targetAgent: TargetAgent): JsonObject {
  const domainId = targetAgent.domain_id;
  const primarySkillPath = targetPrimarySkillRef();
  return {
    capability_id: `${domainId}.primary-skill.codex_entry`,
    surface_role: 'primary_skill',
    capability_kind: 'codex_primary_skill',
    canonical_owner: domainId,
    physical_source_ref: {
      ref_kind: 'repo_path',
      ref: primarySkillPath,
      role: 'primary_skill_source',
    },
    canonical_paths: [
      primarySkillPath,
    ],
    improvement_tokens: [
      'primary skill',
      'agent entry',
      'owner handoff',
      'delivery gate',
    ],
    failure_token_registry_ref: `failure-token-registry:${domainId}/primary-skill`,
    verification_refs: [
      'git diff --check',
      'opl agents scaffold --validate <target-agent-dir> --json',
      'opl connect agent-packages validate-manifest --manifest-url <sidecar> --json',
    ],
    forbidden_surfaces: [
      'target domain truth',
      'target memory body',
      'target artifact body',
      'target owner receipt body',
      'target typed blocker body',
      'quality/export verdict',
      'promotion gate state',
    ],
    runtime_projection_refs: [
      {
        ref_kind: 'contract_ref',
        ref: 'contracts/opl_agent_package_manifest.json#/codex_surface/primary_skill_ref',
        role: 'package_primary_skill_ref',
      },
    ],
    sync_policy: 'oma_generated_candidate_refs_only',
    externalization_reason: 'standard generated target agent primary Codex entry; OPL owns generated carrier projection and package validation',
    authority_boundary: {
      can_write_domain_truth: false,
      can_write_memory_body: false,
      can_mutate_artifact_body: false,
      can_sign_owner_receipt: false,
      can_create_typed_blocker: false,
      can_authorize_quality_or_export: false,
      can_claim_domain_ready: false,
      can_claim_production_ready: false,
    },
    exposure_layer: 'codex_default_primary_skill',
    codex_default_exposure: true,
    allowed_exposure_scopes: [
      'codex_default_entry',
      'opl_generated_plugin_carrier',
    ],
    codex_visibility_policy: 'registered_as_primary_codex_skill_entry',
    exposure_owner: domainId,
    canonical_target_paths: [
      primarySkillPath,
    ],
  };
}

function writeTargetAgentCapabilityMap(targetAgentDir: string, targetAgent: TargetAgent): string {
  const capabilityMapPath = path.join(targetAgentDir, 'contracts', 'capability_map.json');
  const capabilityMap = JSON.parse(fs.readFileSync(capabilityMapPath, 'utf8')) as JsonObject;
  const resolverIndex = typeof capabilityMap.resolver_index === 'object'
    && capabilityMap.resolver_index !== null
    && !Array.isArray(capabilityMap.resolver_index)
    ? capabilityMap.resolver_index as JsonObject
    : {};
  writeJson(capabilityMapPath, {
    ...capabilityMap,
    primary_skill_capability: buildTargetAgentPrimarySkillCapability(targetAgent),
    resolver_index: {
      ...resolverIndex,
      primary_skill_refs: [
        'contracts/capability_map.json#/primary_skill_capability',
      ],
    },
  });
  return capabilityMapPath;
}

function buildTargetAgentPackageManifest(targetAgent: TargetAgent): JsonObject {
  const domainId = targetAgent.domain_id;
  const domainLabel = targetAgent.domain_label ?? domainId;
  const primarySkillPath = targetPrimarySkillRef();
  return {
    surface_kind: 'opl_agent_package_manifest.v1',
    agent_id: domainId,
    package_id: domainId,
    display_name: domainLabel,
    publisher: 'one-person-lab',
    version: '0.1.0',
    source: 'oma_generated_target_agent',
    carrier_source_role: 'codex_plugin_default_carrier_not_package_truth',
    schema_ref: 'contracts/opl-framework/agent-package-manifest.schema.json',
    machine_boundary: 'OMA generates this package sidecar for OPL App/package management. Codex consumes the projected .codex-plugin carrier; this sidecar does not write target truth, owner receipts, runtime queues, or quality/export verdicts.',
    package_core: {
      core_kind: 'opl_agent_package_core',
      identity_fields: ['package_id', 'agent_id', 'version'],
      content_identity_fields: [
        'manifest_sha256',
        'payload_digest_ref',
        'required_skill_pack_lock_refs',
        'package_lock_ref',
      ],
      dependency_source: 'manifest_declared_capability_dependencies',
      lock_owner: 'opl_connect_agent_package_registry',
      lifecycle_receipt_owner: 'opl_connect_agent_package_registry',
      exposure_owner: 'opl_connect_agent_package_registry',
    },
    distribution_payload: {
      payload_kind: 'oma_generated_agent_package',
      payload_ref: `opl://agent-packages/${domainId}/candidate`,
      payload_digest_ref: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
      required_skill_pack_lock_refs: [],
      proof_status: 'candidate_sidecar_pending_publish',
      live_download_proof: false,
      installed_reload_proof: false,
      oci_ref: `ghcr.io/gaofeng21cn/opl-agent-${domainId}:latest`,
      oci_media_type: 'application/vnd.oci.image.manifest.v1+json',
      immutable_tag: '0.1.0',
      rolling_tag: 'latest',
      promotion_policy: 'daily_candidate_gates_then_promote_latest',
      install_truth: 'resolved_digest_lock',
    },
    codex_surface: {
      plugin_id: domainId,
      standalone_distribution: 'generated_carrier_surface',
      required_skill_ids: [domainId],
      primary_skill_ref: primarySkillPath,
      primary_skill_capability_ref: 'contracts/capability_map.json#/primary_skill_capability',
      bundled_capability_package_ids: [],
      user_install_action_count: 1,
    },
    carrier_adapters: [
      {
        adapter_kind: 'codex_plugin_carrier',
        carrier: 'codex_plugin',
        source_surface: 'codex_surface',
        projection_role: 'package_carrier_adapter',
        owns_package_core: false,
        owns_domain_truth: false,
      },
    ],
    opl_managed_surface: {
      package_shape: 'thin_agent_package',
      dependency_resolution: 'managed_dependency_graph',
      dependency_update_policy: 'independent_package_target',
      developer_mode_dependency_policy: 'source_checkout_when_authorized_else_pull_request',
    },
    capability_dependencies: [],
  };
}

function writeTargetAgentPackageManifest(targetAgentDir: string, targetAgent: TargetAgent): string {
  const packageManifestPath = path.join(targetAgentDir, 'contracts', 'opl_agent_package_manifest.json');
  writeJson(packageManifestPath, buildTargetAgentPackageManifest(targetAgent));
  return packageManifestPath;
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
  assertBaselineReviewerMorphologyEvidence(aiReviewerEvaluation);
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
        artifact_morphology_reviewer_source_refs_present: true,
        artifact_morphology_reviewer_direct_evidence_refs_present: true,
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

export function runBuildAgentBaseline({
    outputDir,
    oplBin,
    aiReviewerEvaluationPath,
    targetAgent,
    stageRunner,
    stageCloseoutPacketPath,
  }: BuildAgentBaselineArgs): JsonObject {
  fs.mkdirSync(outputDir, { recursive: true });
  const domainPackSummary = readDomainPackSummary(repoRoot, { domainId: 'opl-meta-agent' });
  const aiReviewerEvaluation = loadAiReviewerEvaluation(aiReviewerEvaluationPath);
  assertBaselineReviewerMorphologyEvidence(aiReviewerEvaluation);

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
  const targetPrimarySkillPath = writeTargetAgentPrimarySkill(targetAgentDir, targetAgent);
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
  const targetAgentCapabilityMapPath = writeTargetAgentCapabilityMap(targetAgentDir, targetAgent);
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

  const realTargetAgent: TargetAgent = {
    ...targetAgent,
    repo_dir: targetAgentDir,
    descriptor_ref: path.join(targetAgentDir, 'contracts', 'domain_descriptor.json'),
  };
  const realTargetSuitePath = path.join(outputDir, 'real-target-agent-lab-suite.json');
  const realTargetSuite = buildRealTargetAgentSuite({
    realTargetAgent,
    realTargetAgentDir: targetAgentDir,
    aiReviewerEvaluation,
    aiReviewerEvaluationRef: aiReviewerEvaluationPath,
  });
  writeJson(realTargetSuitePath, realTargetSuite);
  const realTargetAgentLabRun = runOpl(oplBin, ['agent-lab', 'run', '--suite', realTargetSuitePath, '--json']);
  const realTargetSuiteResult = realTargetAgentLabRun.agent_lab_run.suite_result as SuiteResult;
  const realTargetDeliveryReceipt = buildRealTargetDeliveryReceipt({
    targetAgent: realTargetAgent,
    suiteResult: realTargetSuiteResult,
    baselineDeliveryReceipt: baselineReceipt,
    candidateAgentPackageRef: `candidate-agent-package:${targetAgent.domain_id}`,
    agentLabSuiteRef: realTargetSuitePath,
    promotionGateRefs: [`promotion-gate:opl-meta-agent/${targetAgent.domain_id}`],
    noForbiddenWriteProofRefs: [
      `no-forbidden-write:opl-meta-agent/${targetAgent.domain_id}/real_target_delivery`,
    ],
  });
  const scaleoutEvidenceLedger = buildScaleoutEvidenceLedger({
    deliveryReceipts: [realTargetDeliveryReceipt],
  });
  const newAgentDeliveryGate = assertNewAgentDeliveryGate({
    targetAgent: realTargetAgent,
    scaffoldValidationStatus: scaffoldValidation.standard_domain_agent_scaffold.validation.status,
    generatedInterfaceStatus: generatedInterfaces.generated_agent_interfaces.status,
    baselineSuiteResult: suiteResult as unknown as JsonObject,
    realTargetSuiteResult: realTargetSuiteResult as unknown as JsonObject,
    aiReviewerEvaluation,
    selfEvolutionConsumptionRef: learningCandidate.candidate_id,
    deliveryReceipt: realTargetDeliveryReceipt as unknown as JsonObject,
    stageRunRefsOnlyConsumptionRef: stageDecompositionAttempt.attempt_ref,
    stageCompletionPolicyRef: stageDecompositionAttempt.stage_packet_ref,
    stageCloseoutPacketRef: stageDecompositionAttempt.closeout_packet_ref,
    targetOwnerReceiptOrTypedBlockerOrHumanGateRef: realTargetDeliveryReceipt.owner_receipt_refs[0],
    noForbiddenWriteProofRef: realTargetDeliveryReceipt.no_forbidden_write_proof_refs[0],
    sourceMorphologyRef: stageDecompositionAttempt.closeout_refs
      .find(hasMorphologyEvidenceRef) ?? aiReviewerEvaluation.direct_evidence_refs.find(hasMorphologyEvidenceRef),
    ownerRouteRef: realTargetDeliveryReceipt.owner_receipt_refs[0],
    generatedSurfaceConsumptionRef:
      generatedInterfaces.generated_agent_interfaces.generated_surface_consumption_bundle?.surface_kind,
    privateResidueDecisionRef: 'contracts/default_caller_deletion_evidence.json',
    ownerAnswerShape: 'owner_receipt',
    providerCompletionIsDomainCompletion: false,
    omaTargetAuthorityBoundary: {
      can_write_target_domain_truth: false,
      can_write_target_owner_receipt_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
    },
  });
  writeJson(realTargetReceiptPath, realTargetDeliveryReceipt);
  writeJson(scaleoutLedgerPath, scaleoutEvidenceLedger);
  const realTargetDelivery = {
    target_agent: {
      ...realTargetAgent,
      scaffold_validation_status: scaffoldValidation.standard_domain_agent_scaffold.validation.status,
      generated_interface_status: generatedInterfaces.generated_agent_interfaces.status,
    },
    agent_lab_run: realTargetAgentLabRun.agent_lab_run,
    delivery_receipt: realTargetDeliveryReceipt,
    new_agent_delivery_gate: newAgentDeliveryGate,
    scaleout_evidence_ledger: scaleoutEvidenceLedger,
    stage_decomposition_attempt: stageDecompositionAttempt,
    opl_agent_package_manifest_ref: targetAgentPackageManifestPath,
    capability_map_ref: targetAgentCapabilityMapPath,
    primary_skill_ref: targetPrimarySkillPath,
  };

  return {
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
      real_target_agent_lab_suite_path: path.join(outputDir, 'real-target-agent-lab-suite.json'),
      real_target_delivery_receipt_path: realTargetReceiptPath,
      real_target_scaleout_evidence_ledger_path: scaleoutLedgerPath,
      opl_agent_package_manifest_path: targetAgentPackageManifestPath,
      target_agent_capability_map_path: targetAgentCapabilityMapPath,
      target_agent_primary_skill_path: targetPrimarySkillPath,
    },
    opl_agent_package_manifest_validation:
      targetAgentPackageManifestValidation.opl_agent_package_manifest,
    opl_agent_lab: agentLabRun.agent_lab_run,
    opl_generated_interfaces: generatedInterfaces.generated_agent_interfaces,
    stage_decomposition_attempt: stageDecompositionAttempt,
    learning_loop: {
      baseline_receipt: baselineReceipt,
      online_learning_candidate: learningCandidate,
      online_learning_policy: learningCandidate.online_learning_policy,
      mechanism_patch_proposal: mechanismPatchProposal,
    },
    new_agent_delivery_gate: newAgentDeliveryGate,
    real_target_delivery: realTargetDelivery,
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
