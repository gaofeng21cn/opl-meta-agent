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

type PatchSurfaceHintsByDomain = Record<string, Record<string, string[]>>;

const MAS_MEDICAL_MANUSCRIPT_CHANGE_REFS = [
  {
    token: 'medical_journal_prose_quality',
    refs: [
      'rubric_ref:ai_reviewer/high_quality_medical_manuscript',
      'prompt_ref:ai_reviewer_medical_prose_quality_review',
      'prompt_ref:medical-research-write/formal_manuscript_voice_no_internal_qc_language',
    ],
  },
  {
    token: 'hdl',
    refs: [
      'quality_contract_ref:mas/prediction_model_first_draft_quality/variable_unit_harmonization',
      'stage_policy_ref:mas/write/pre_draft_prediction_model_reporting/hdl_unit_sensitivity',
    ],
  },
  {
    token: 'model-reproducibility',
    refs: [
      'quality_contract_ref:mas/prediction_model_first_draft_quality/model_reproducibility',
      'skill_ref:medical-research-write/prediction_model_methods_reproducibility',
    ],
  },
  {
    token: 'baseline-survival',
    refs: [
      'quality_contract_ref:mas/prediction_model_first_draft_quality/baseline_survival_and_absolute_risk',
    ],
  },
  {
    token: 'table1-table2',
    refs: [
      'quality_contract_ref:mas/prediction_model_first_draft_quality/visible_table1_table2',
      'stage_policy_ref:mas/write/pre_draft_prediction_model_reporting/baseline_and_performance_tables',
    ],
  },
  {
    token: 'uncertainty-intervals',
    refs: [
      'quality_contract_ref:mas/prediction_model_first_draft_quality/uncertainty_intervals',
      'rubric_ref:ai_reviewer/high_quality_medical_manuscript/statistical_uncertainty',
    ],
  },
  {
    token: 'validation-metrics',
    refs: [
      'quality_contract_ref:mas/prediction_model_first_draft_quality/validation_metrics',
    ],
  },
  {
    token: 'nhanes',
    refs: [
      'quality_contract_ref:mas/prediction_model_first_draft_quality/survey_weighting_or_unweighted_framing',
      'prompt_ref:ai_reviewer_medical_prose_quality_review/nhanes_population_framing',
    ],
  },
  {
    token: 'calibration-risk-collapse',
    refs: [
      'quality_contract_ref:mas/prediction_model_first_draft_quality/calibration_and_risk_distribution_figures',
      'stage_policy_ref:mas/figure-polish/prediction_model_calibration_and_risk_distribution',
    ],
  },
  {
    token: 'figure-quality',
    refs: [
      'stage_policy_ref:mas/figure-polish/high_quality_medical_journal_figures',
    ],
  },
  {
    token: 'internal-quality-language-purge',
    refs: [
      'rubric_ref:ai_reviewer/high_quality_medical_manuscript/internal_quality_language_purge',
      'prompt_ref:medical-research-write/formal_manuscript_voice_no_internal_qc_language',
    ],
  },
];

const MAS_DEFAULT_CHANGE_REFS = [
  'stage_policy_ref:mas/write/pre_draft_prediction_model_reporting',
  'skill_ref:medical-research-write',
  'rubric_ref:ai_reviewer/high_quality_medical_manuscript',
  'prompt_ref:ai_reviewer_medical_prose_quality_review',
  'quality_contract_ref:prediction_model_first_draft_quality',
  'regression_suite_ref:mas/agent_lab_medical_manuscript_self_evolution',
];

const TARGET_AGENT_OWNER_RECEIPT_CHANGE_REFS = [
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

const TARGET_AGENT_OWNER_RECEIPT_DEFAULT_CHANGE_REFS = [
  'target_agent_production_acceptance_contract_ref:target_agent/production_acceptance',
  'target_agent_owner_receipt_contract_ref:target_agent/live-acceptance',
  'target_agent_owner_route_ref:target_agent/owner-receipt-projection',
  'target_agent_quality_gate_ref:target_agent/export-owner',
  'target_agent_regression_suite_ref:target_agent/owner-boundary',
];

const EXTERNAL_LEARNING_REFS = [
  'external-source:equator-network/tripod-reporting-guideline',
  'external-source:tripod-statement/scope-and-checklist',
  'external-source:tripod-ai/clinical-prediction-model-reporting',
];

const PATCH_SURFACE_HINTS_BY_DOMAIN: PatchSurfaceHintsByDomain = {
  'med-autoscience': {
    quality_contract_ref: [
      'src/med_autoscience/policies/medical_reporting_checklist.py',
      'src/med_autoscience/study_charter.py',
    ],
    skill_ref: [
      'src/med_autoscience/overlay/templates/medical-research-write.SKILL.md',
    ],
    rubric_ref: [
      'src/med_autoscience/policies/publication_critique.py',
      'src/med_autoscience/policies/medical_manuscript_draft_quality.py',
    ],
    prompt_ref: [
      'src/med_autoscience/policies/medical_manuscript_draft_quality.py',
      'src/med_autoscience/overlay/templates/medical-research-write.SKILL.md',
    ],
    stage_policy_ref: [
      'src/med_autoscience/controllers/pre_draft_quality_runtime.py',
      'src/med_autoscience/controllers/agent_lab_medical_manuscript_quality.py',
    ],
    regression_suite_ref: [
      'tests/test_prediction_model_first_draft_quality.py',
      'tests/test_medical_reporting_audit.py',
      'tests/test_medical_publication_surface.py',
    ],
  },
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
}: {
  targetAgent: TargetAgent;
  suite: JsonObject;
  suiteRefs: string[];
  aiReviewerEvaluation: AiReviewerEvaluation;
}): string[] {
  const combined = [...suiteRefs, ...reviewerEvidenceText(aiReviewerEvaluation)].join('\n').toLowerCase();
  const inferred = new Set<string>();
  if (
    String(suite.suite_id || '').includes('medical-manuscript')
    || combined.includes('medical-manuscript')
    || combined.includes('medical_journal_prose_quality')
  ) {
    MAS_DEFAULT_CHANGE_REFS.forEach((ref) => inferred.add(ref));
  }
  if (
    combined.includes('owner-receipt')
    || combined.includes('owner_receipt')
    || combined.includes('live-acceptance')
    || combined.includes('production-acceptance')
    || combined.includes('production_acceptance')
  ) {
    TARGET_AGENT_OWNER_RECEIPT_DEFAULT_CHANGE_REFS.forEach((ref) => inferred.add(ref));
  }
  for (const mapping of MAS_MEDICAL_MANUSCRIPT_CHANGE_REFS) {
    if (combined.includes(mapping.token)) {
      mapping.refs.forEach((ref) => inferred.add(ref));
    }
  }
  for (const mapping of TARGET_AGENT_OWNER_RECEIPT_CHANGE_REFS) {
    if (combined.includes(mapping.token)) {
      mapping.refs.forEach((ref) => inferred.add(ref));
    }
  }
  if (inferred.size === 0) {
    inferred.add('target_agent_stage_policy_ref:external_agent/failure_taxonomy_to_mechanism_candidate');
    inferred.add('target_agent_rubric_ref:external_agent/domain_quality_scorecard');
    inferred.add('target_agent_regression_suite_ref:external_agent/blocked_suite_replay');
  }
  return [...inferred].sort();
}

function buildPatchTraceabilityMatrix({
  targetAgent,
  suiteRefs,
  proposedChangeRefs,
  aiReviewerEvaluation,
}: {
  targetAgent: TargetAgent;
  suiteRefs: string[];
  proposedChangeRefs: string[];
  aiReviewerEvaluation: AiReviewerEvaluation;
}): PatchTraceabilityEntry[] {
  const combined = [...suiteRefs, ...reviewerEvidenceText(aiReviewerEvaluation)].join('\n').toLowerCase();
  const sourceFailureRefs = [...suiteRefs, ...aiReviewerEvaluation.source_refs].filter((ref) =>
    ref.includes('rubric-gap:')
    || ref.includes('metric-ref:')
    || ref.includes('quality-scorecard:')
    || ref.includes('evidence-delta:')
    || ref.includes('owner-receipt')
    || ref.includes('production-acceptance')
    || ref.includes('publication_eval')
    || ref.includes('review_ledger')
  );
  const matrix = [];
  for (const mapping of [...MAS_MEDICAL_MANUSCRIPT_CHANGE_REFS, ...TARGET_AGENT_OWNER_RECEIPT_CHANGE_REFS]) {
    if (!textMatchesToken(combined, mapping.token)) {
      continue;
    }
    const requiredPatchRefs = mapping.refs.filter((ref: string) => proposedChangeRefs.includes(ref));
    const reviewerSuggestions = aiReviewerEvaluation.suggestions.filter((suggestion) =>
      textMatchesToken(suggestion, mapping.token)
    );
    const reviewerSourceRefs = aiReviewerEvaluation.source_refs.filter((ref) => textMatchesToken(ref, mapping.token));
    matrix.push({
      gap_token: mapping.token,
      source_failure_refs: sourceFailureRefs.filter((ref) => textMatchesToken(ref, mapping.token)),
      required_patch_refs: requiredPatchRefs,
      editable_surface_refs: surfaceRefsForPatchRefs(requiredPatchRefs),
      target_repo_file_hints: fileHintsForPatchRefs({
        domainId: targetAgent.domain_id,
        patchRefs: requiredPatchRefs,
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

function fileHintsForPatchRefs({ domainId, patchRefs }: { domainId: string; patchRefs: string[] }): string[] {
  const hints = PATCH_SURFACE_HINTS_BY_DOMAIN[domainId] ?? {};
  const files = new Set<string>();
  for (const surfaceRef of surfaceRefsForPatchRefs(patchRefs)) {
    for (const filePath of hints[surfaceRef] ?? []) {
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

function forbiddenTargetPathsOrSurfaces(targetAgent: TargetAgent): string[] {
  if (targetAgent.domain_id === 'med-autoscience') {
    return [
      'study truth surfaces',
      'paper artifacts',
      'publication_eval/latest.json',
      'controller_decisions/latest.json',
      'manuscript/current_package',
      'submission readiness verdicts',
    ];
  }
  return [
    'target domain truth surfaces',
    'target domain memory body',
    'target domain artifact body',
    'target quality verdict bodies',
    'submission readiness verdicts',
    'export verdict bodies',
  ];
}

function runtimeRequiredSurfaceRefs(targetAgent: TargetAgent): string[] {
  if (targetAgent.domain_id === 'med-autoscience') {
    return [
      'study_runtime_status',
      'domain_transition',
      'publication_supervisor_state',
      'default_executor_dispatch_execution',
      'target_agent_status_or_progress_projection',
    ];
  }
  return [
    'target_agent_descriptor',
    'target_agent_owner_route',
    'target_agent_owner_receipt_contract',
    'target_agent_quality_gate_projection',
    'default_executor_dispatch_execution',
    'target_agent_status_or_progress_projection',
  ];
}

function runtimeExpectedOutcomes(targetAgent: TargetAgent): string[] {
  if (targetAgent.domain_id === 'med-autoscience') {
    return [
      'patched quality contract or owner route is visible in target runtime/read-model projection',
      'blocked suite redrive no longer parks as stale human handoff when target owner work remains',
      'no forbidden target domain truth, artifact, memory, quality verdict, or submission readiness surface is written by opl-meta-agent',
    ];
  }
  return [
    'patched quality contract, owner route, or owner receipt contract is visible in target runtime/read-model projection',
    'blocked suite redrive no longer parks as stale human handoff when target owner work remains',
    'no forbidden target domain truth, artifact, memory, quality verdict, or submission readiness surface is written by opl-meta-agent',
  ];
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
    external_learning_refs: EXTERNAL_LEARNING_REFS,
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
}: {
  targetAgent: TargetAgent;
  suite: JsonObject;
  suiteResult: SuiteResult;
  receipt: OwnerReceipt;
  capabilityCandidate: CapabilityCandidate;
}): JsonObject {
  const noPatchRequired = suiteResult.status === 'passed';
  return {
    surface_kind: 'opl_meta_agent_developer_patch_work_order',
    version: 'opl-meta-agent.developer-patch-work-order.v1',
    work_order_id: stableId('oma_developer_patch_work_order', [
      targetAgent.domain_id,
      suite.suite_id,
      suiteResult.result_id,
      capabilityCandidate.candidate_id,
    ]),
    status: noPatchRequired ? 'no_patch_required' : 'ready_for_target_agent_source_patch',
    product_id: 'opl-meta-agent',
    target_agent: capabilityCandidate.target_agent,
    source_agent_lab_result_ref: suiteResult.result_id,
    target_capability_improvement_candidate_ref: capabilityCandidate.candidate_id,
    owner_receipt_ref: receipt.receipt_id,
    ai_reviewer_evaluation_ref: capabilityCandidate.ai_reviewer_evaluation_ref,
    ai_reviewer_review: capabilityCandidate.ai_reviewer_review,
    ai_reviewer_evidence: capabilityCandidate.ai_reviewer_evidence,
    review_provenance: capabilityCandidate.review_provenance,
    required_patch_surfaces: noPatchRequired ? [] : capabilityCandidate.target_editable_surface_refs,
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
      forbidden_target_paths_or_surfaces: forbiddenTargetPathsOrSurfaces(targetAgent),
      required_closeout_evidence: noPatchRequired
        ? [
          'target owner receipt projection consumed Agent Lab suite result',
          'target owner receipt projection consumed opl-meta-agent coordination result',
          'no target source patch was requested',
          'no target domain truth, memory body, artifact body, quality verdict, or export verdict was written',
        ]
        : [
          'patch_traceability_matrix addressed',
          'target agent tests passed',
          'target runtime/read-model consumed patched capability',
          'target workspace dependency lock/profile migrated when runtime extras are required',
          'target owner entry redrive consumed the migrated workspace environment',
          'repo hygiene proof shows no target checkout .venv or generated egg-info pollution',
          'developer patch receipt recorded',
          'target agent status or decision docs updated',
          'temporary worktree cleaned after absorb',
        ],
    },
    runtime_consumption_verification: {
      verification_mode: 'read_only_target_domain_runtime_projection',
      required_surface_refs: runtimeRequiredSurfaceRefs(targetAgent),
      expected_outcomes: runtimeExpectedOutcomes(targetAgent),
      can_write_target_domain_truth: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
    },
    target_workspace_environment_verification: {
      verification_mode: 'read_only_target_workspace_environment_and_owner_entry_redrive',
      required_surface_refs: [
        'target_workspace_pyproject_or_lock',
        'target_workspace_profile_or_config_env',
        'study_runtime_analysis_bundle',
        'target_owner_entry_redrive_report',
        'target_repo_hygiene_status',
      ],
      expected_outcomes: [
        'target workspace dependency lock/profile includes required runtime extras before owner redrive',
        'owner runtime entry uses the target workspace interpreter rather than target repo checkout .venv',
        'owner redrive reports the analysis/runtime bundle as ready under the target workspace interpreter',
        'repo hygiene proof shows no target checkout .venv or generated egg-info pollution',
      ],
      can_write_target_domain_truth: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
    },
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

  const agentLabRun = runOpl(oplBin, ['agent-lab', 'run', '--suite', suitePath, '--json']);
  const suiteResult = agentLabRun.agent_lab_run.suite_result as SuiteResult;
  const suiteRefs = collectSuiteRefs(suite);
  const proposedChangeRefs = inferProposedChangeRefs({ targetAgent, suite, suiteRefs, aiReviewerEvaluation });
  const patchTraceabilityMatrix = buildPatchTraceabilityMatrix({
    targetAgent,
    suiteRefs,
    proposedChangeRefs,
    aiReviewerEvaluation,
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
    observeRefs: [suitePath, aiReviewerEvaluationPath, ...EXTERNAL_LEARNING_REFS],
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
  });
  const developerPatchWorkOrder = buildDeveloperPatchWorkOrder({
    targetAgent,
    suite,
    suiteResult,
    receipt,
    capabilityCandidate,
  });

  const receiptPath = path.join(outputDir, 'meta-agent-improvement-receipt.json');
  const learningPath = path.join(outputDir, 'online-learning-candidate.json');
  const mechanismPath = path.join(outputDir, 'mechanism-patch-proposal.json');
  const capabilityPath = path.join(outputDir, 'target-capability-improvement-candidate.json');
  const workOrderPath = path.join(outputDir, 'developer-patch-work-order.json');
  const runPath = path.join(outputDir, 'external-agent-lab-suite-run.json');

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
      external_agent_lab_suite_run_path: runPath,
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
