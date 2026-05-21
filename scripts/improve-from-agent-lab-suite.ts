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
  writeJson,
} from './lib/meta-agent-loop.ts';
import {
  DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES,
  DEFAULT_RUNTIME_EXPECTED_OUTCOMES,
  DEFAULT_RUNTIME_REQUIRED_SURFACE_REFS,
  buildOplAgentLabOwnedPrimitiveRefs,
  buildRefsOnlyWorkOrderCompleteness,
  buildRuntimeConsumptionVerification,
  buildTargetPatchLoopMachineRefs,
  buildTargetWorkspaceEnvironmentVerification,
  targetPatchLoopCloseoutEvidence,
} from './lib/work-order-policy.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

type ImproveArgs = {
  suitePath: string;
  targetAgentDir: string;
  outputDir: string;
  feedbackRef: string | null;
  oplBin: string;
  aiReviewerEvaluationPath: string;
};

type PatchTraceabilityEntry = JsonObject & {
  gap_token: string;
  failure_evidence: string[];
  root_cause: string;
  targeted_fix: string[];
  predicted_impact: string;
  source_failure_refs: string[];
  required_patch_refs: string[];
  editable_surface_refs: string[];
  target_repo_file_hints: string[];
  required_verification_refs: string[];
  ai_reviewer_suggestions: string[];
  ai_reviewer_source_refs: string[];
};

type CapabilityCandidate = JsonObject & {
  candidate_id: string;
  target_agent: JsonObject;
  authority_boundary: JsonObject;
  target_editable_surface_refs: string[];
  proposed_change_refs: string[];
  patch_traceability_matrix: PatchTraceabilityEntry[];
};

type ChangeRefMapping = {
  token: string;
  refs: string[];
};

type TargetImprovementPolicy = {
  defaultChangeRefs: string[];
  defaultChangeRefTriggers: string[];
  changeRefMappings: ChangeRefMapping[];
  patchSurfaceHints: Record<string, string[]>;
  externalLearningRefs: string[];
  forbiddenTargetPathsOrSurfaces: string[];
  runtimeRequiredSurfaceRefs: string[];
  runtimeExpectedOutcomes: string[];
};

const OWNER_RECEIPT_CHANGE_REFS = [
  {
    token: 'live-acceptance',
    refs: [
      'target_agent_production_acceptance_contract_ref:target_agent/production_acceptance',
      'target_agent_owner_receipt_contract_ref:target_agent/live-acceptance',
    ],
  },
  {
    token: 'owner-receipt',
    refs: [
      'target_agent_owner_receipt_contract_ref:target_agent/live-acceptance',
      'target_agent_owner_route_ref:target_agent/owner-receipt-projection',
    ],
  },
  {
    token: 'package',
    refs: [
      'target_agent_delivery_policy_ref:target_agent/package-owner-closeout',
      'target_agent_quality_gate_ref:target_agent/export-owner',
    ],
  },
  {
    token: 'typed-blocker',
    refs: [
      'target_agent_production_acceptance_contract_ref:target_agent/production_acceptance',
      'target_agent_regression_suite_ref:target_agent/owner-boundary',
    ],
  },
];

const OWNER_RECEIPT_DEFAULT_CHANGE_REFS = [
  'target_agent_production_acceptance_contract_ref:target_agent/production_acceptance',
  'target_agent_owner_receipt_contract_ref:target_agent/live-acceptance',
  'target_agent_owner_route_ref:target_agent/owner-receipt-projection',
  'target_agent_quality_gate_ref:target_agent/export-owner',
  'target_agent_regression_suite_ref:target_agent/owner-boundary',
];

const GENERIC_IMPROVEMENT_POLICY: TargetImprovementPolicy = {
  defaultChangeRefs: [
    'target_agent_stage_policy_ref:external_agent/failure_taxonomy_to_mechanism_candidate',
    'target_agent_rubric_ref:external_agent/domain_quality_scorecard',
    'target_agent_regression_suite_ref:external_agent/blocked_suite_replay',
  ],
  defaultChangeRefTriggers: [],
  changeRefMappings: [],
  patchSurfaceHints: {},
  externalLearningRefs: [],
  forbiddenTargetPathsOrSurfaces: DEFAULT_FORBIDDEN_TARGET_PATHS_OR_SURFACES,
  runtimeRequiredSurfaceRefs: DEFAULT_RUNTIME_REQUIRED_SURFACE_REFS,
  runtimeExpectedOutcomes: DEFAULT_RUNTIME_EXPECTED_OUTCOMES,
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

function records(value: unknown): JsonObject[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is JsonObject => Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry))
    : [];
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : [];
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function optionalJson(targetAgentDir: string, relativePath: string): JsonObject | null {
  const filePath = path.join(targetAgentDir, relativePath);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return readJson(filePath);
}

function mappingFromRecord(entry: JsonObject): ChangeRefMapping | null {
  const token = stringValue(entry.token) ?? stringValue(entry.gap_token) ?? stringValue(entry.trigger_token);
  const refs = unique([
    ...stringList(entry.refs),
    ...stringList(entry.required_patch_refs),
    ...stringList(entry.change_refs),
  ]);
  if (!token || refs.length === 0) {
    return null;
  }
  return { token, refs };
}

function collectPatchSurfaceHints(...sources: Array<JsonObject | null>): Record<string, string[]> {
  const hints: Record<string, string[]> = {};
  for (const source of sources) {
    const raw = source?.meta_agent_work_order_contract?.patch_surface_hints
      ?? source?.oma_handoff?.patch_surface_hints
      ?? source?.external_suite_improvement_policy?.patch_surface_hints
      ?? source?.patch_surface_hints
      ?? {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      continue;
    }
    for (const [surface, values] of Object.entries(raw as Record<string, unknown>)) {
      hints[surface] = unique([...(hints[surface] ?? []), ...stringList(values)]);
    }
  }
  return hints;
}

function collectMappings(...sources: Array<JsonObject | null>): ChangeRefMapping[] {
  return sources.flatMap((source) => [
    ...records(source?.external_suite_improvement_policy?.change_ref_mappings),
    ...records(source?.meta_agent_work_order_contract?.change_ref_mappings),
    ...records(source?.oma_handoff?.change_ref_mappings),
    ...records(source?.change_ref_mappings),
  ]).map(mappingFromRecord).filter((entry): entry is ChangeRefMapping => Boolean(entry));
}

function targetImprovementPolicy(targetAgentDir: string): TargetImprovementPolicy {
  const agentLabHandoff = optionalJson(targetAgentDir, 'contracts/agent_lab_handoff.json');
  const omaHandoff = optionalJson(targetAgentDir, 'contracts/oma_handoff_refs.json');
  const generatedSurfaceHandoff = optionalJson(targetAgentDir, 'contracts/generated_surface_handoff.json');
  const productionAcceptanceDir = path.join(targetAgentDir, 'contracts/production_acceptance');
  const productionAcceptances = fs.existsSync(productionAcceptanceDir)
    ? fs.readdirSync(productionAcceptanceDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => readJson(path.join(productionAcceptanceDir, entry.name)))
    : [];
  const sources = [agentLabHandoff, omaHandoff, generatedSurfaceHandoff, ...productionAcceptances];
  const defaultChangeRefs = unique([
    ...sources.flatMap((source) => stringList(source?.external_suite_improvement_policy?.default_change_refs)),
    ...sources.flatMap((source) => stringList(source?.meta_agent_work_order_contract?.default_change_refs)),
    ...sources.flatMap((source) => stringList(source?.oma_handoff?.default_change_refs)),
  ]);
  const defaultChangeRefTriggers = unique([
    ...sources.flatMap((source) => stringList(source?.external_suite_improvement_policy?.default_change_ref_triggers)),
    ...sources.flatMap((source) => stringList(source?.meta_agent_work_order_contract?.default_change_ref_triggers)),
    ...sources.flatMap((source) => stringList(source?.oma_handoff?.default_change_ref_triggers)),
  ]);
  const externalLearningRefs = unique([
    ...sources.flatMap((source) => stringList(source?.external_suite_improvement_policy?.external_learning_refs)),
    ...sources.flatMap((source) => stringList(source?.meta_agent_work_order_contract?.external_learning_refs)),
    ...sources.flatMap((source) => stringList(source?.oma_handoff?.external_learning_refs)),
  ]);
  const forbiddenTargetPathsOrSurfaces = unique([
    ...sources.flatMap((source) => stringList(source?.meta_agent_work_order_contract?.forbidden_target_writes)),
    ...sources.flatMap((source) => stringList(source?.external_suite_improvement_policy?.forbidden_target_paths_or_surfaces)),
    ...stringList(generatedSurfaceHandoff?.generated_surface_policy?.must_not_write),
  ]);
  const runtimeRequiredSurfaceRefs = unique([
    ...sources.flatMap((source) => stringList(source?.external_suite_improvement_policy?.runtime_required_surface_refs)),
    ...sources.flatMap((source) => stringList(source?.meta_agent_work_order_contract?.runtime_required_surface_refs)),
    ...sources.flatMap((source) => stringList(source?.oma_handoff?.runtime_required_surface_refs)),
  ]);
  const runtimeExpectedOutcomes = unique([
    ...sources.flatMap((source) => stringList(source?.external_suite_improvement_policy?.runtime_expected_outcomes)),
    ...sources.flatMap((source) => stringList(source?.meta_agent_work_order_contract?.runtime_expected_outcomes)),
    ...sources.flatMap((source) => stringList(source?.oma_handoff?.runtime_expected_outcomes)),
  ]);
  return {
    defaultChangeRefs: defaultChangeRefs.length ? defaultChangeRefs : GENERIC_IMPROVEMENT_POLICY.defaultChangeRefs,
    defaultChangeRefTriggers,
    changeRefMappings: collectMappings(...sources),
    patchSurfaceHints: collectPatchSurfaceHints(...sources),
    externalLearningRefs,
    forbiddenTargetPathsOrSurfaces: forbiddenTargetPathsOrSurfaces.length
      ? forbiddenTargetPathsOrSurfaces
      : GENERIC_IMPROVEMENT_POLICY.forbiddenTargetPathsOrSurfaces,
    runtimeRequiredSurfaceRefs: runtimeRequiredSurfaceRefs.length
      ? runtimeRequiredSurfaceRefs
      : GENERIC_IMPROVEMENT_POLICY.runtimeRequiredSurfaceRefs,
    runtimeExpectedOutcomes: runtimeExpectedOutcomes.length
      ? runtimeExpectedOutcomes
      : GENERIC_IMPROVEMENT_POLICY.runtimeExpectedOutcomes,
  };
}

function textMatchesToken(text: string, token: string): boolean {
  const normalizedText = text.toLowerCase();
  const normalizedToken = token.toLowerCase();
  if (normalizedText.includes(normalizedToken)) {
    return true;
  }
  const tokenWords = normalizedToken.split(/[-_]/).filter((word) => word.length > 2);
  return tokenWords.length > 0 && tokenWords.every((word) => normalizedText.includes(word));
}

function reviewerEvidenceText(aiReviewerEvaluation: AiReviewerEvaluation): string[] {
  return [
    aiReviewerEvaluation.critique,
    ...aiReviewerEvaluation.suggestions,
    ...aiReviewerEvaluation.source_refs,
    aiReviewerEvaluation.verdict,
  ];
}

function inferProposedChangeRefs({
  targetAgent,
  suite,
  suiteRefs,
  aiReviewerEvaluation,
  policy,
}: {
  targetAgent: TargetAgent;
  suite: JsonObject;
  suiteRefs: string[];
  aiReviewerEvaluation: AiReviewerEvaluation;
  policy: TargetImprovementPolicy;
}): string[] {
  const combined = [...suiteRefs, ...reviewerEvidenceText(aiReviewerEvaluation)].join('\n').toLowerCase();
  const inferred = new Set<string>();
  const triggeredByDefaultPolicy = policy.defaultChangeRefTriggers.length === 0
    ? false
    : policy.defaultChangeRefTriggers.some((token) => textMatchesToken(combined, token));
  if (triggeredByDefaultPolicy) {
    policy.defaultChangeRefs.forEach((ref) => inferred.add(ref));
  }
  if (
    combined.includes('owner-receipt')
    || combined.includes('owner_receipt')
    || combined.includes('live-acceptance')
    || combined.includes('production-acceptance')
    || combined.includes('production_acceptance')
  ) {
    OWNER_RECEIPT_DEFAULT_CHANGE_REFS.forEach((ref) => inferred.add(ref));
  }
  for (const mapping of policy.changeRefMappings) {
    if (combined.includes(mapping.token)) {
      mapping.refs.forEach((ref) => inferred.add(ref));
    }
  }
  for (const mapping of OWNER_RECEIPT_CHANGE_REFS) {
    if (combined.includes(mapping.token)) {
      mapping.refs.forEach((ref) => inferred.add(ref));
    }
  }
  if (inferred.size === 0) {
    policy.defaultChangeRefs.forEach((ref) => inferred.add(ref));
  }
  return [...inferred].sort();
}

function buildPatchTraceabilityMatrix({
  targetAgent,
  suiteRefs,
  proposedChangeRefs,
  aiReviewerEvaluation,
  policy,
}: {
  targetAgent: TargetAgent;
  suiteRefs: string[];
  proposedChangeRefs: string[];
  aiReviewerEvaluation: AiReviewerEvaluation;
  policy: TargetImprovementPolicy;
}): PatchTraceabilityEntry[] {
  const combined = [...suiteRefs, ...reviewerEvidenceText(aiReviewerEvaluation)].join('\n').toLowerCase();
  const sourceFailureRefs = [...suiteRefs, ...aiReviewerEvaluation.source_refs].filter((ref) =>
    ref.includes('rubric-gap:')
    || ref.includes('metric-ref:')
    || ref.includes('quality-scorecard:')
    || ref.includes('evidence-delta:')
    || ref.includes('owner-receipt')
    || ref.includes('production-acceptance')
    || ref.includes('owner_receipt')
    || ref.includes('typed-blocker')
  );
  const matrix = [];
  for (const mapping of [...policy.changeRefMappings, ...OWNER_RECEIPT_CHANGE_REFS]) {
    if (!textMatchesToken(combined, mapping.token)) {
      continue;
    }
    const requiredPatchRefs = mapping.refs.filter((ref: string) => proposedChangeRefs.includes(ref));
    const reviewerSuggestions = aiReviewerEvaluation.suggestions.filter((suggestion) =>
      textMatchesToken(suggestion, mapping.token)
    );
    const reviewerSourceRefs = aiReviewerEvaluation.source_refs.filter((ref) => textMatchesToken(ref, mapping.token));
    const failureEvidence = unique([
      ...sourceFailureRefs.filter((ref) => textMatchesToken(ref, mapping.token)),
      ...reviewerSourceRefs,
      ...reviewerSuggestions.map((suggestion) => `ai-reviewer-suggestion:${suggestion}`),
    ]);
    matrix.push({
      gap_token: mapping.token,
      failure_evidence: failureEvidence.length ? failureEvidence : unique([
        ...aiReviewerEvaluation.source_refs,
        ...aiReviewerEvaluation.direct_evidence_refs,
      ]),
      root_cause: `AI reviewer identified ${mapping.token} as a target-agent capability gap requiring owner-gated source changes.`,
      targeted_fix: requiredPatchRefs,
      predicted_impact: aiReviewerEvaluation.predicted_impact,
      source_failure_refs: sourceFailureRefs.filter((ref) => textMatchesToken(ref, mapping.token)),
      required_patch_refs: requiredPatchRefs,
      editable_surface_refs: surfaceRefsForPatchRefs(requiredPatchRefs),
      target_repo_file_hints: fileHintsForPatchRefs({
        patchRefs: requiredPatchRefs,
        policy,
      }),
      required_verification_refs: [
        'target_repo_test_receipt',
        'no_target_domain_truth_write_proof',
        'developer_patch_receipt',
      ],
      ai_reviewer_suggestions: reviewerSuggestions,
      ai_reviewer_source_refs: reviewerSourceRefs,
    });
  }
  return matrix;
}

function surfaceRefsForPatchRefs(patchRefs: string[]): string[] {
  const surfaces = new Set<string>();
  for (const ref of patchRefs) {
    const prefix = String(ref).split(':')[0];
    if (prefix) {
      surfaces.add(prefix);
    }
  }
  return [...surfaces].sort();
}

function fileHintsForPatchRefs({ patchRefs, policy }: { patchRefs: string[]; policy: TargetImprovementPolicy }): string[] {
  const files = new Set<string>();
  for (const surfaceRef of surfaceRefsForPatchRefs(patchRefs)) {
    for (const filePath of policy.patchSurfaceHints[surfaceRef] ?? []) {
      files.add(filePath);
    }
  }
  return [...files].sort();
}

function improvementAreaForTarget(targetAgent: TargetAgent): string {
  return `${targetAgent.domain_id.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_agent_lab_result_consumption_capability`;
}

function targetCapabilityRef(targetAgent: TargetAgent): string {
  return `domain-agent:${targetAgent.domain_id}/agent-lab-result-consumption-capability`;
}

function targetEditableSurfaceRefs(proposedChangeRefs: string[]): string[] {
  return surfaceRefsForPatchRefs(proposedChangeRefs);
}

function mechanismEditableSurfaces(proposedChangeRefs: string[]): string[] {
  return surfaceRefsForPatchRefs(proposedChangeRefs).map((surfaceRef) =>
    surfaceRef.startsWith('target_agent_') ? surfaceRef : `target_agent_${surfaceRef}`
  );
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

function buildDeveloperPatchWorkOrder({
  targetAgent,
  suite,
  suiteResult,
  receipt,
  capabilityCandidate,
  policy,
}: {
  targetAgent: TargetAgent;
  suite: JsonObject;
  suiteResult: SuiteResult;
  receipt: OwnerReceipt;
  capabilityCandidate: CapabilityCandidate;
  policy: TargetImprovementPolicy;
}): JsonObject {
  const noPatchRequired = suiteResult.status === 'passed';
  const workOrderId = stableId('oma_developer_patch_work_order', [
    targetAgent.domain_id,
    suite.suite_id,
    suiteResult.result_id,
    capabilityCandidate.candidate_id,
  ]);
  const targetRepoFileHints = unique(capabilityCandidate.patch_traceability_matrix.flatMap((entry) =>
    entry.target_repo_file_hints
  ));
  const requiredVerificationRefs = noPatchRequired
    ? [
        'target_owner_receipt_projection_ref',
        'no_target_domain_truth_write_proof',
      ]
    : unique(capabilityCandidate.patch_traceability_matrix.flatMap((entry) =>
        entry.required_verification_refs
      )).concat([
        'target_runtime_consumption_verification_receipt',
        'target_workspace_environment_consumption_receipt',
      ]);
  const noForbiddenWriteProofRefs = noPatchRequired
    ? ['no_target_domain_truth_write_proof']
    : ['no_target_domain_truth_write_proof', 'repo_hygiene_no_checkout_venv_proof'];
  const failureEvidence = unique([
    ...capabilityCandidate.failure_taxonomy_refs,
    ...capabilityCandidate.ai_reviewer_evidence.source_refs,
    ...capabilityCandidate.ai_reviewer_evidence.direct_evidence_refs,
  ]);
  const patchMode = noPatchRequired ? 'no-source-patch' : 'source-patch';
  return {
    surface_kind: 'opl_meta_agent_developer_patch_work_order',
    version: 'opl-meta-agent.developer-patch-work-order.v1',
    work_order_id: workOrderId,
    status: noPatchRequired ? 'no_patch_required' : 'ready_for_target_agent_source_patch',
    product_id: 'opl-meta-agent',
    target_agent: capabilityCandidate.target_agent,
    source_agent_lab_result_ref: suiteResult.result_id,
    target_capability_improvement_candidate_ref: capabilityCandidate.candidate_id,
    owner_receipt_ref: receipt.receipt_id,
    ai_reviewer_evaluation_ref: capabilityCandidate.ai_reviewer_evaluation_ref,
    ai_reviewer_review: capabilityCandidate.ai_reviewer_review,
    ai_reviewer_independence: capabilityCandidate.ai_reviewer_independence,
    ai_reviewer_evidence: capabilityCandidate.ai_reviewer_evidence,
    ai_reviewer_scorecard: capabilityCandidate.ai_reviewer_scorecard,
    ai_reviewer_recovery_refs: capabilityCandidate.ai_reviewer_recovery_refs,
    review_provenance: capabilityCandidate.review_provenance,
    work_order_completeness: buildRefsOnlyWorkOrderCompleteness({
      requiredFieldsPresent: true,
      reviewerRefs: [
        String(capabilityCandidate.ai_reviewer_evaluation_ref),
        ...capabilityCandidate.ai_reviewer_evidence.source_refs,
        ...capabilityCandidate.ai_reviewer_evidence.direct_evidence_refs,
      ],
      workOrderId,
      proposedChangeRefs: capabilityCandidate.proposed_change_refs,
      traceabilityStatus: noPatchRequired ? 'no_source_patch_required' : capabilityCandidate.traceability_status,
      requiredVerificationRefs,
      targetVerificationExtraRefs: [
        'target_owner_receipt_or_typed_blocker',
        noPatchRequired ? 'target_owner_receipt_projection_ref' : 'target_repo_test_receipt',
      ],
      ownerRouteRefs: [
        `target-agent-owner:${capabilityCandidate.target_agent.domain_id}`,
        `target-owner-receipt-or-typed-blocker:${capabilityCandidate.target_agent.domain_id}/${workOrderId}`,
      ],
      noForbiddenWriteProofRefs,
      executorAllowedScope: noPatchRequired ? 'coordination_record_only' : 'target_agent_owner_gated_patch',
      executorAllowedWriteSurfaces: noPatchRequired ? [] : capabilityCandidate.target_editable_surface_refs,
      executorForbiddenWriteSurfaces: [
        'target_domain_truth',
        'target_domain_memory_body',
        'target_domain_artifact_body',
        'target_quality_or_export_verdict',
        'default_agent_promotion_without_gate',
      ],
      canaryRefs: [
        ...(capabilityCandidate.ai_reviewer_evaluation.canary_refs ?? []),
        `agent-lab-canary:${suiteResult.result_id}`,
      ],
      rollbackRefs: [
        ...(capabilityCandidate.ai_reviewer_evaluation.rollback_refs ?? []),
        ...noForbiddenWriteProofRefs,
        noPatchRequired ? 'owner_receipt_coordination_record' : 'target_agent_previous_head_ref',
      ],
      versionRefs: [
        ...(capabilityCandidate.ai_reviewer_evaluation.version_refs ?? []),
        noPatchRequired ? 'owner_receipt_coordination_record' : 'git_commit',
      ],
      failClosedBlockerRef:
        `typed-blocker:opl-meta-agent/${capabilityCandidate.target_agent.domain_id}/${workOrderId}/missing-required-work-order-field`,
    }),
    required_opl_agent_lab_primitive_refs: buildOplAgentLabOwnedPrimitiveRefs({
      domainId: targetAgent.domain_id,
      workOrderId,
      patchMode,
      promotionGateRef: `promotion-gate:opl-meta-agent/${targetAgent.domain_id}/external-suite-self-evolution`,
    }),
    ahe_developer_work_order: {
      failure_evidence: failureEvidence,
      root_cause: noPatchRequired
        ? 'Agent Lab result passed; remaining work is coordination and owner receipt projection proof.'
        : 'Agent Lab and independent AI reviewer evidence identify target-agent capability gaps that require owner-gated source changes.',
      targeted_fix: noPatchRequired
        ? ['record coordination result and preserve target owner receipt authority']
        : capabilityCandidate.proposed_change_refs,
      predicted_impact: capabilityCandidate.ai_reviewer_review.predicted_impact,
    },
    required_patch_surfaces: noPatchRequired ? [] : capabilityCandidate.target_editable_surface_refs,
    allowed_editable_surfaces: noPatchRequired ? [] : capabilityCandidate.target_editable_surface_refs,
    target_repo_file_hints: noPatchRequired ? [] : targetRepoFileHints,
    required_verification_refs: requiredVerificationRefs,
    rollback_version_refs: noPatchRequired
      ? ['owner_receipt_coordination_record']
      : ['git_commit', 'target_agent_previous_head_ref', 'temporary_worktree_ref'],
    owner_route_refs: [
      `target-agent-owner:${targetAgent.domain_id}`,
      `promotion-gate:opl-meta-agent/${targetAgent.domain_id}/external-suite-self-evolution`,
    ],
    no_forbidden_write_proof: {
      required: true,
      proof_refs: noForbiddenWriteProofRefs,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
    },
    machine_closeout_refs: buildTargetPatchLoopMachineRefs({
      domainId: targetAgent.domain_id,
      suiteResultRef: suiteResult.result_id,
      workOrderId,
      requiredVerificationRefs,
      noForbiddenWriteProofRefs,
      patchMode,
    }),
    proposed_change_refs: capabilityCandidate.proposed_change_refs,
    patch_traceability_matrix: noPatchRequired ? [] : capabilityCandidate.patch_traceability_matrix,
    implementation_controls: {
      coordination_record_only: noPatchRequired,
      source_patch_required: !noPatchRequired,
      patch_must_be_limited_to_traceable_surfaces: !noPatchRequired,
      developer_must_read_target_repo_context_before_editing: !noPatchRequired,
      developer_patch_receipt_required: !noPatchRequired,
      target_repo_test_receipt_required: !noPatchRequired,
      target_runtime_consumption_verification_required: !noPatchRequired,
      target_workspace_environment_consumption_proof_required: !noPatchRequired,
      dependency_lock_or_profile_migration_proof_required: !noPatchRequired,
      owner_entry_redrive_required: !noPatchRequired,
      repo_hygiene_no_checkout_venv_proof_required: !noPatchRequired,
      target_owner_receipt_projection_required: noPatchRequired,
      no_target_domain_truth_write_proof_required: true,
      no_quality_verdict_or_submission_readiness_authority: true,
      forbidden_target_paths_or_surfaces: policy.forbiddenTargetPathsOrSurfaces,
      required_closeout_evidence: targetPatchLoopCloseoutEvidence({
        sourcePatchRequired: !noPatchRequired,
      }),
    },
    runtime_consumption_verification: buildRuntimeConsumptionVerification({
      requiredSurfaceRefs: policy.runtimeRequiredSurfaceRefs,
      expectedOutcomes: policy.runtimeExpectedOutcomes,
    }),
    target_workspace_environment_verification: buildTargetWorkspaceEnvironmentVerification(),
    version_management: {
      target_agent_version_owner: 'target_agent_repo',
      required_version_artifacts: noPatchRequired
        ? [
          'owner_receipt_coordination_record',
          'target_owner_receipt_projection_ref',
        ]
        : [
          'git_commit',
          'test_receipt',
          'runtime_consumption_verification_receipt',
          'workspace_environment_consumption_receipt',
          'developer_patch_receipt',
          'target_agent_status_or_decision_doc_update',
        ],
      absorb_back_required: !noPatchRequired,
      temporary_worktree_cleanup_required: !noPatchRequired,
    },
    authority_boundary: {
      can_modify_target_agent_source_repo: !noPatchRequired,
      can_modify_target_agent_tests: !noPatchRequired,
      can_modify_target_agent_docs: !noPatchRequired,
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_promote_default_agent_without_gate: false,
      can_train_or_deploy_model_weights: false,
    },
  };
}

function requireNonEmptyStringArray(value: unknown, fieldName: string): void {
  if (!Array.isArray(value) || !value.some((entry) => typeof entry === 'string' && entry.trim().length > 0)) {
    throw new Error(`Invalid developer patch work order: ${fieldName} must be a non-empty string array.`);
  }
}

function requireNonEmptyString(value: unknown, fieldName: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid developer patch work order: ${fieldName} must be a non-empty string.`);
  }
}

function validateDeveloperPatchWorkOrder(workOrder: JsonObject): void {
  requireNonEmptyStringArray(workOrder.ai_reviewer_evidence?.source_refs, 'ai_reviewer_evidence.source_refs');
  requireNonEmptyStringArray(workOrder.ai_reviewer_evidence?.direct_evidence_refs, 'ai_reviewer_evidence.direct_evidence_refs');
  requireNonEmptyString(workOrder.ai_reviewer_scorecard?.verdict, 'ai_reviewer_scorecard.verdict');
  requireNonEmptyString(workOrder.ai_reviewer_review?.predicted_impact, 'ai_reviewer_review.predicted_impact');
  requireNonEmptyStringArray(workOrder.ahe_developer_work_order?.failure_evidence, 'ahe_developer_work_order.failure_evidence');
  requireNonEmptyString(workOrder.ahe_developer_work_order?.root_cause, 'ahe_developer_work_order.root_cause');
  requireNonEmptyStringArray(workOrder.ahe_developer_work_order?.targeted_fix, 'ahe_developer_work_order.targeted_fix');
  requireNonEmptyString(workOrder.ahe_developer_work_order?.predicted_impact, 'ahe_developer_work_order.predicted_impact');
  requireNonEmptyStringArray(workOrder.required_verification_refs, 'required_verification_refs');
  requireNonEmptyStringArray(workOrder.owner_route_refs, 'owner_route_refs');
  requireNonEmptyStringArray(workOrder.rollback_version_refs, 'rollback_version_refs');
  requireNonEmptyStringArray(workOrder.no_forbidden_write_proof?.proof_refs, 'no_forbidden_write_proof.proof_refs');
  requireNonEmptyStringArray(workOrder.work_order_completeness?.reviewer_refs, 'work_order_completeness.reviewer_refs');
  requireNonEmptyString(workOrder.work_order_completeness?.patch_traceability?.matrix_ref, 'work_order_completeness.patch_traceability.matrix_ref');
  requireNonEmptyStringArray(workOrder.work_order_completeness?.target_verification?.required_refs, 'work_order_completeness.target_verification.required_refs');
  requireNonEmptyStringArray(workOrder.work_order_completeness?.owner_route?.route_refs, 'work_order_completeness.owner_route.route_refs');
  requireNonEmptyStringArray(workOrder.work_order_completeness?.no_forbidden_write_proof?.proof_refs, 'work_order_completeness.no_forbidden_write_proof.proof_refs');
  requireNonEmptyStringArray(workOrder.work_order_completeness?.canary_refs, 'work_order_completeness.canary_refs');
  requireNonEmptyStringArray(workOrder.work_order_completeness?.rollback_refs, 'work_order_completeness.rollback_refs');
  requireNonEmptyStringArray(workOrder.work_order_completeness?.version_refs, 'work_order_completeness.version_refs');
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
    targetAgent,
    suite,
    suiteRefs,
    aiReviewerEvaluation,
    policy,
  });
  const patchTraceabilityMatrix = buildPatchTraceabilityMatrix({
    targetAgent,
    suiteRefs,
    proposedChangeRefs,
    aiReviewerEvaluation,
    policy,
  });

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
    domainPackSummary,
    aiReviewerEvaluation,
    aiReviewerEvaluationRef: aiReviewerEvaluationPath,
    policy,
  });
  const developerPatchWorkOrder = buildDeveloperPatchWorkOrder({
    targetAgent,
    suite,
    suiteResult,
    receipt,
    capabilityCandidate,
    policy,
  });
  validateDeveloperPatchWorkOrder(developerPatchWorkOrder);

  const receiptPath = path.join(outputDir, 'meta-agent-improvement-receipt.json');
  const learningPath = path.join(outputDir, 'online-learning-candidate.json');
  const mechanismPath = path.join(outputDir, 'mechanism-patch-proposal.json');
  const capabilityPath = path.join(outputDir, 'target-capability-improvement-candidate.json');
  const workOrderPath = path.join(outputDir, 'developer-patch-work-order.json');
  const runPath = path.join(outputDir, 'agent-lab-run-result.json');

  writeJson(receiptPath, receipt);
  writeJson(learningPath, learningCandidate);
  writeJson(mechanismPath, mechanismPatchProposal);
  writeJson(capabilityPath, capabilityCandidate);
  writeJson(workOrderPath, developerPatchWorkOrder);
  writeJson(runPath, agentLabRun);

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
      agent_lab_run_result_path: runPath,
      meta_agent_improvement_receipt_path: receiptPath,
      online_learning_candidate_path: learningPath,
      mechanism_patch_proposal_path: mechanismPath,
      target_capability_improvement_candidate_path: capabilityPath,
      developer_patch_work_order_path: workOrderPath,
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
