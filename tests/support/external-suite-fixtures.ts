import assertModule from 'node:assert/strict';
import fsModule from 'node:fs';
import osModule from 'node:os';
import pathModule from 'node:path';
import { spawnSync as spawnSyncFn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  parseImproveFromAgentLabSuiteArgs,
  runImproveFromAgentLabSuite,
} from '../../scripts/improve-from-agent-lab-suite.ts';
import type { JsonObject } from '../../scripts/lib/domain-pack.ts';

export type { JsonObject };
export const assert: typeof assertModule = assertModule;
export const fs: typeof fsModule = fsModule;
export const os: typeof osModule = osModule;
export const path: typeof pathModule = pathModule;
export const spawnSync: typeof spawnSyncFn = spawnSyncFn;

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const oplBin = process.env.OPL_BIN
  ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';
export const targetPatchLoopMachineRefFields = [
  'blocked_suite_result_ref',
  'developer_patch_work_order_ref',
  'patch_traceability_matrix_ref',
  'target_repo_verification_refs',
  'target_runtime_read_model_consumption_ref',
  'workspace_environment_proof_ref',
  'no_forbidden_write_proof_ref',
  'target_owner_receipt_or_typed_blocker_ref',
  'patch_absorption_ref',
  'worktree_cleanup_ref',
  'agent_lab_re_evaluation_ref',
];
export const targetPatchLoopReviewerProjectionFields = [
  'ai_reviewer_evaluation_ref',
  'ai_reviewer_evidence.source_refs',
  'ai_reviewer_evidence.direct_evidence_refs',
  'ai_reviewer_scorecard.verdict',
  'ai_reviewer_review.predicted_impact',
  'ai_reviewer_independence',
  'review_provenance',
  'reviewer_pool_refs',
  'work_order_completeness.reviewer_refs',
];
export const targetPatchLoopProjectionRequiredFields = [
  ...targetPatchLoopMachineRefFields,
  ...targetPatchLoopReviewerProjectionFields,
];

export function writeJson(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

export function readJson(filePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function runImproveArgs(args: string[]): JsonObject {
  return runImproveFromAgentLabSuite(parseImproveFromAgentLabSuiteArgs(args));
}

export function assertTargetPatchLoopMachineRefs(refs: JsonObject, expected: {
  blockedSuiteResultRef: string;
  developerPatchWorkOrderRef: string;
  requiredVerificationRefs: string[];
}): void {
  targetPatchLoopMachineRefFields.forEach((field) => {
    assert.ok(field in refs, `machine_closeout_refs.${field} should be present`);
  });
  assert.equal(refs.blocked_suite_result_ref, expected.blockedSuiteResultRef);
  assert.equal(refs.developer_patch_work_order_ref, expected.developerPatchWorkOrderRef);
  assert.ok(String(refs.patch_traceability_matrix_ref).endsWith('#/patch_traceability_matrix'));
  assert.deepEqual(refs.target_repo_verification_refs, expected.requiredVerificationRefs);
  [
    'target_runtime_read_model_consumption_ref',
    'workspace_environment_proof_ref',
    'no_forbidden_write_proof_ref',
    'target_owner_receipt_or_typed_blocker_ref',
    'patch_absorption_ref',
    'worktree_cleanup_ref',
    'agent_lab_re_evaluation_ref',
  ].forEach((field) => {
    assert.equal(typeof refs[field], 'string', `machine_closeout_refs.${field} should be a string ref`);
    assert.ok(String(refs[field]).length > 0, `machine_closeout_refs.${field} should not be empty`);
  });
}

export function writeAiReviewerEvaluation(filePath: string, overrides: JsonObject = {}): JsonObject {
  const evaluation = {
    reviewer_kind: 'ai_reviewer',
    model_or_provider: 'gpt-5.5',
    run_ref: 'run:ai-reviewer/mas/002/high-quality-medical-manuscript',
    execution_attempt_ref: 'attempt:executor/mas/002/high-quality-medical-manuscript',
    review_attempt_ref: 'attempt:ai-reviewer/mas/002/high-quality-medical-manuscript',
    no_shared_context: true,
    independent_attempt: true,
    critique: 'The blocked suite shows reporting gaps in HDL harmonization, model reproducibility, and internal quality-control language.',
    suggestions: [
      'Map HDL unit harmonization to the prediction model quality contract and pre-draft reporting stage policy.',
      'Add reproducibility checks for model methods and baseline survival outputs.',
      'Purge internal-quality language from manuscript writing prompts and reviewer rubrics.',
    ],
    source_refs: [
      'artifacts/publication_eval/latest.json',
      'paper/review/review_ledger.json',
      'rubric-gap:mas/002/hdl-harmonization-and-sensitivity',
      'rubric-gap:mas/002/internal-quality-language-purge',
    ],
    direct_evidence_refs: [
      'paper/evidence_ledger.json',
      'artifacts/publication_eval/latest.json',
    ],
    verdict: 'blocked_requires_developer_patch',
    predicted_impact: 'The patch should convert reviewer-observed manuscript quality gaps into target-owned quality contracts, prompts, and regression checks without moving publication authority out of MAS.',
    canary_refs: ['canary:mas/002/high-quality-medical-manuscript-redrive'],
    rollback_refs: ['rollback:mas/002/pre-reviewer-workorder-head'],
    version_refs: ['version:mas/002/current-head'],
    provenance: {
      artifact_ref: 'artifact-ref:ai-reviewer/mas/002/high-quality-medical-manuscript',
      reviewer_prompt_ref: 'instructions:mas/high-quality-medical-manuscript-ai-reviewer',
      created_by: 'test-fixture',
    },
    ...overrides,
  };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(evaluation, null, 2)}\n`);
  return evaluation;
}

export function buildBlockedMedicalManuscriptSuite(suitePath: string): JsonObject {
  return {
    suite_id: 'mas-agent-lab-suite:002-dm-china-us-mortality-attribution:high-quality-medical-manuscript',
    suite_kind: 'agent_lab_external_suite',
    authority_boundary: {
      can_write_domain_truth: false,
      can_write_memory_body: false,
      can_authorize_quality_verdict: false,
      can_promote_default_agent_without_gate: false,
    },
    tasks: [
      {
        task_id: 'agent-lab-task:mas/002-dm-china-us-mortality-attribution/high-quality-medical-manuscript',
        domain_id: 'med-autoscience',
        task_family: 'high_quality_medical_manuscript_self_evolution',
        environment: {
          environment_kind: 'local_workspace',
          workspace_locator_ref: 'workspace-locator:mas/002-dm-china-us-mortality-attribution',
          sandbox_policy: 'refs_only_no_artifact_mutation',
          network_policy: 'domain_owner_policy',
        },
        instructions_ref: 'instructions:mas/high-quality-medical-manuscript-ai-reviewer',
        agent_entry_ref: 'domain-agent-entry:med-autoscience',
        stage_refs: [
          'stage:mas/review',
          'stage:mas/write',
          'stage:mas/publication-gate',
        ],
        oracle_refs: ['oracle:mas/ai-reviewer-publication-eval'],
        scorer_refs: ['scorer:mas/ai-reviewer-medical-publication-critique-v1'],
        recovery_probes: [
          {
            probe_ref: 'recovery-probe:mas/002/review-route-redrive',
            probe_kind: 'resume_after_interruption',
            expected_status: 'passed',
            observed_status: 'passed',
            source_refs: [suitePath],
          },
        ],
        trajectory: {
          trajectory_ref: 'trajectory:mas/002/high-quality-medical-manuscript',
          run_ref: 'run:mas/002/high-quality-medical-manuscript-agent-lab-projection',
          agent_executor: 'codex_cli',
          stage_attempt_refs: ['stage-attempt:mas/ai-reviewer-medical-prose-quality-review'],
          tool_call_refs: ['tool-call:mas/publication-eval-read'],
          artifact_refs: ['paper/evidence_ledger.json', 'artifacts/publication_eval/latest.json'],
          receipt_refs: ['artifacts/publication_eval/latest.json'],
          repair_refs: [
            'rubric-gap:mas/002/hdl-harmonization-and-sensitivity',
            'rubric-gap:mas/002/model-reproducibility-and-baseline-survival',
            'rubric-gap:mas/002/table1-table2-visible-baseline-performance',
            'rubric-gap:mas/002/uncertainty-intervals-and-validation-metrics',
            'rubric-gap:mas/002/nhanes-survey-weighting-and-unweighted-framing',
            'rubric-gap:mas/002/calibration-risk-collapse-and-figure-quality',
            'rubric-gap:mas/002/internal-quality-language-purge',
          ],
          trace_refs: ['trace-ref:agent-lab/mas-high-quality-medical-manuscript'],
        },
        scorecard: {
          scorecard_ref: 'quality-scorecard:mas/002/high-quality-medical-manuscript',
          domain_owned: true,
          opl_scorecard_role: 'scorecard_ref_projection_only',
          passed: false,
          metric_refs: [
            'metric-ref:mas/002/medical_journal_prose_quality:underdefined',
            'metric-ref:mas/high-quality-medical-manuscript/reproducibility-results-tables-figures',
          ],
          evidence_refs: ['artifacts/controller/task_intake/latest.json'],
          review_refs: ['paper/review/review_ledger.json'],
          quality_gate_refs: ['quality-gate:mas/publication-owner'],
        },
        improvement_candidate: {
          candidate_ref: 'improvement-candidate:mas/002/high-quality-medical-manuscript-rubric-gap',
          candidate_kind: 'rubric_gap',
          target_ref: 'rubric-gap-ref:mas/high-quality-medical-manuscript-ai-reviewer',
          evidence_refs: [
            'rubric-gap:mas/002/hdl-harmonization-and-sensitivity',
            'rubric-gap:mas/002/model-reproducibility-and-baseline-survival',
            'rubric-gap:mas/002/table1-table2-visible-baseline-performance',
            'rubric-gap:mas/002/uncertainty-intervals-and-validation-metrics',
            'rubric-gap:mas/002/nhanes-survey-weighting-and-unweighted-framing',
            'rubric-gap:mas/002/calibration-risk-collapse-and-figure-quality',
            'rubric-gap:mas/002/internal-quality-language-purge',
          ],
          allowed_change_scope: 'branch_only',
          promotion_gate_ref: 'promotion-gate:mas/002/high-quality-medical-manuscript',
        },
        promotion_gate: {
          gate_ref: 'promotion-gate:mas/002/high-quality-medical-manuscript',
          gate_status: 'blocked',
          required_refs: ['quality-scorecard:mas/002/high-quality-medical-manuscript'],
          regression_suite_refs: ['regression-suite:mas/ai-first-quality-boundary'],
          no_forbidden_write_proof_refs: ['no-forbidden-write:mas/agent-lab-medical-manuscript-quality'],
        },
      },
    ],
  };
}

export function buildReviewerRevisionFeedbackSuite(suitePath: string): JsonObject {
  const suite = buildBlockedMedicalManuscriptSuite(suitePath);
  suite.suite_id = 'mas-agent-lab-suite:002-dm-china-us-mortality-attribution:reviewer_revision-feedback';
  const task = (suite.tasks as JsonObject[])[0];
  task.task_id = 'agent-lab-task:mas/002-dm-china-us-mortality-attribution/reviewer_revision-feedback';
  task.task_family = 'reviewer_revision_feedback_self_evolution';
  task.instructions_ref = 'instructions:mas/reviewer_revision-feedback-ai-reviewer';
  task.feedback_refs = [
    'feedback-ref:mas/002/reviewer_revision/mentor-round-1',
    'feedback-ref:mas/002/reviewer_revision/statistical-methods',
  ];
  task.reviewer_evidence_refs = [
    'reviewer-evidence:mas/002/reviewer_revision/response-matrix',
    'reviewer-evidence:mas/002/reviewer_revision/methods-completeness',
  ];
  task.reviewer_revision_refs = [
    'reviewer-revision:mas/002/checklist/text-revisions',
    'reviewer-revision:mas/002/checklist/methods-completeness',
    'reviewer-revision:mas/002/checklist/statistical-analysis',
    'reviewer-revision:mas/002/checklist/tables-figures',
  ];
  task.revision_checklist_refs = [
    'revision-checklist:mas/002/discussion-claim-guardrails',
    'revision-checklist:mas/002/handoff-evidence-surface',
  ];
  task.owner_route_refs = ['target-agent-owner:med-autoscience'];
  task.target_owner_closeout_refs = [
    'target-owner-receipt-or-typed-blocker:med-autoscience/reviewer_revision-feedback',
  ];
  (task.trajectory as JsonObject).trajectory_ref = 'trajectory:mas/002/reviewer_revision-feedback';
  (task.trajectory as JsonObject).run_ref = 'run:mas/002/reviewer_revision-feedback-agent-lab-projection';
  (task.trajectory as JsonObject).trace_refs = ['trace-ref:agent-lab/mas-reviewer_revision-feedback'];
  (task.scorecard as JsonObject).scorecard_ref = 'quality-scorecard:mas/002/reviewer_revision-feedback';
  (task.scorecard as JsonObject).review_refs = [
    'paper/review/reviewer_revision_ledger.json',
    'reviewer-evidence:mas/002/reviewer_revision/response-matrix',
  ];
  (task.improvement_candidate as JsonObject).candidate_ref =
    'improvement-candidate:mas/002/reviewer_revision-feedback-rubric-gap';
  (task.improvement_candidate as JsonObject).target_ref = 'rubric-gap-ref:mas/reviewer_revision-feedback-ai-reviewer';
  (task.promotion_gate as JsonObject).gate_ref = 'promotion-gate:mas/002/reviewer_revision-feedback';
  return suite;
}

export function writeMedicalTargetImprovementPolicy(targetAgentDir: string): void {
  const metaAgentWorkOrderContract = {
    default_change_ref_triggers: [
      'medical-manuscript',
      'medical_journal_prose_quality',
      'reviewer_revision',
    ],
    default_change_refs: [
      'stage_policy_ref:mas/write/pre_draft_prediction_model_reporting',
      'skill_ref:medical-research-write',
      'rubric_ref:ai_reviewer/high_quality_medical_manuscript',
      'prompt_ref:ai_reviewer_medical_prose_quality_review',
      'quality_contract_ref:prediction_model_first_draft_quality',
      'regression_suite_ref:mas/agent_lab_medical_manuscript_self_evolution',
    ],
    capability_id: 'med-autoscience.medical-manuscript-quality',
    canonical_paths: [
      'src/med_autoscience/policies/medical_reporting_checklist.py',
      'src/med_autoscience/study_charter.py',
      'src/med_autoscience/overlay/templates/medical-research-write.SKILL.md',
      'src/med_autoscience/policies/publication_critique.py',
      'src/med_autoscience/policies/medical_manuscript_draft_quality.py',
      'src/med_autoscience/controllers/pre_draft_quality_runtime.py',
      'src/med_autoscience/controllers/agent_lab_medical_manuscript_quality.py',
      'tests/test_prediction_model_first_draft_quality.py',
      'tests/test_medical_reporting_audit.py',
      'tests/test_medical_publication_surface.py',
    ],
    verification_refs: ['target_repo_test_receipt'],
    forbidden_target_paths_or_surfaces: [
      'study truth surfaces',
      'paper artifacts',
      'publication_eval/latest.json',
      'controller_decisions/latest.json',
      'manuscript/current_package',
      'submission readiness verdicts',
    ],
    authority_boundary: {
      can_write_target_owner_receipt_body: false,
    },
    change_ref_mappings: [
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
    ],
    patch_surface_hints: {
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
  writeJson(path.join(targetAgentDir, 'contracts/production_acceptance/meta-agent-work-order-contract.json'), {
    surface_kind: 'target_owned_explicit_improvement_policy',
    owner: 'MedAutoScience',
    meta_agent_work_order_contract: metaAgentWorkOrderContract,
  });
  writeJson(path.join(targetAgentDir, 'contracts/agent_lab_handoff.json'), {
    surface_kind: 'domain_agent_lab_production_evidence_handoff',
    domain_id: 'med-autoscience',
    owner: 'MedAutoScience',
    handoff_status: 'ready_for_opl_meta_agent_and_agent_lab_execution',
    external_suite_improvement_policy: {
      external_learning_refs: [
        'external-source:equator-network/tripod-reporting-guideline',
        'external-source:tripod-statement/scope-and-checklist',
        'external-source:tripod-ai/clinical-prediction-model-reporting',
      ],
      forbidden_target_paths_or_surfaces: [
        'study truth surfaces',
        'paper artifacts',
        'publication_eval/latest.json',
        'controller_decisions/latest.json',
        'manuscript/current_package',
        'submission readiness verdicts',
      ],
      runtime_required_surface_refs: [
        'study_runtime_status',
        'domain_transition',
        'publication_supervisor_state',
        'default_executor_dispatch_execution',
        'target_agent_status_or_progress_projection',
      ],
      runtime_expected_outcomes: [
        'patched quality contract or owner route is visible in target runtime/read-model projection',
        'blocked suite redrive no longer parks as stale human handoff when target owner work remains',
        'no forbidden target domain truth, artifact, memory, quality verdict, or submission readiness surface is written by opl-meta-agent',
      ],
    },
  });
}

export function writeEfficiencyTargetImprovementPolicy(targetAgentDir: string): void {
  writeJson(path.join(targetAgentDir, 'contracts/production_acceptance/meta-agent-work-order-contract.json'), {
    surface_kind: 'target_owned_explicit_improvement_policy',
    owner: 'target-agent',
    meta_agent_work_order_contract: {
      default_change_ref_triggers: [
        'efficiency',
        'latency',
        'usage cost',
        'cache reuse',
      ],
      default_change_refs: [
        'target_agent_efficiency_policy_ref:target-agent/non-regression-quality-floor',
        'target_agent_runtime_contract_ref:target-agent/latency-and-cache-reuse',
        'target_agent_regression_suite_ref:target-agent/efficiency-non-regression',
      ],
      capability_id: 'target-agent.efficiency-runtime',
      canonical_paths: ['src/runtime/efficiency-policy.ts'],
      verification_refs: ['target-verification:target-agent/efficiency-redrive'],
      forbidden_target_paths_or_surfaces: [
        'target quality verdict bodies',
        'target export authority',
      ],
      authority_boundary: {
        can_write_target_owner_receipt_body: false,
      },
      change_ref_mappings: [
        {
          token: 'latency',
          refs: [
            'target_agent_runtime_contract_ref:target-agent/latency-and-cache-reuse',
          ],
        },
        {
          token: 'usage-cost',
          refs: [
            'target_agent_efficiency_policy_ref:target-agent/usage-cost-budget',
          ],
        },
        {
          token: 'cache-reuse',
          refs: [
            'target_agent_runtime_contract_ref:target-agent/cache-reuse',
          ],
        },
      ],
      patch_surface_hints: {
        target_agent_efficiency_policy_ref: [
          'contracts/efficiency-non-regression-policy.json',
        ],
        target_agent_runtime_contract_ref: [
          'src/runtime/efficiency-policy.ts',
        ],
        target_agent_regression_suite_ref: [
          'tests/efficiency-non-regression.test.ts',
        ],
      },
    },
  });
  writeJson(path.join(targetAgentDir, 'contracts/agent_lab_handoff.json'), {
    surface_kind: 'domain_agent_lab_efficiency_evidence_handoff',
    domain_id: 'target-agent',
    owner: 'target-agent',
    handoff_status: 'ready_for_opl_meta_agent_efficiency_work_order',
    external_suite_improvement_policy: {
      runtime_required_surface_refs: [
        'target_agent_runtime_projection',
        'target_agent_owner_route',
        'target_agent_efficiency_handoff_projection',
      ],
      runtime_expected_outcomes: [
        'target runtime/read-model exposes quality-floor-preserving efficiency evidence',
        'target owner route can consume efficiency non-regression refs without quality/export authority transfer',
      ],
    },
  });
}

export function writeOwnerReceiptAiReviewerEvaluation(filePath: string, overrides: JsonObject = {}): JsonObject {
  const evaluation = {
    reviewer_kind: 'ai_reviewer',
    model_or_provider: 'gpt-5.5',
    run_ref: 'run:ai-reviewer/target-agent/owner-receipt-consumption',
    execution_attempt_ref: 'attempt:executor/target-agent/owner-receipt-consumption',
    review_attempt_ref: 'attempt:ai-reviewer/target-agent/owner-receipt-consumption',
    no_shared_context: true,
    independent_attempt: true,
    critique: 'The target-agent owner receipt evidence contains a domain_owner_receipt shape and keeps quality or export readiness under target owner authority.',
    suggestions: [
      'Keep production acceptance closure tied to target owner receipt refs rather than OPL provider completion.',
      'Preserve quality and submission-ready verdict authority in target owner gates.',
      'Expose Agent Lab and opl-meta-agent coordination as source refs for the target owner receipt projection.',
    ],
    source_refs: [
      'contract-ref:target-agent/production_acceptance.json',
      'contract-ref:target-agent/owner_receipt_contract.json',
      'owner-receipt:target-agent/live-acceptance/2026-05-20',
      'quality-gate:target-agent/owner',
    ],
    direct_evidence_refs: [
      'owner-receipt:target-agent/live-acceptance/2026-05-20',
      'contract-ref:target-agent/owner_receipt_contract.json',
    ],
    verdict: 'accepted_no_patch_required',
    predicted_impact: 'The coordination record should preserve target-owner receipt authority while making Agent Lab consumption auditable.',
    canary_refs: ['canary:target-agent/owner-receipt-projection'],
    rollback_refs: ['rollback:target-agent/owner-receipt-coordination-record'],
    version_refs: ['version:target-agent/current-head'],
    provenance: {
      artifact_ref: 'artifact-ref:ai-reviewer/target-agent/owner-receipt-consumption',
      reviewer_prompt_ref: 'instructions:target-agent/owner-receipt-reviewer',
      created_by: 'test-fixture',
    },
    ...overrides,
  };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(evaluation, null, 2)}\n`);
  return evaluation;
}

function stageCompletionPolicy(domainId: string, taskFamily: string): JsonObject {
  return {
    surface_kind: 'domain_stage_completion_policy',
    version: 'domain-stage-completion-policy.v1',
    owner: 'one-person-lab',
    standard_agent_requirement: 'domain_stage_owns_completion_judgment_and_emits_standard_closeout_packet',
    policy_ref: `stage-completion-policy:${domainId}/${taskFamily}`,
    stage_id: taskFamily,
    target_domain_id: domainId,
    completion_judgment_owner: 'domain_stage',
    closeout_packet_required: true,
    provider_completion_is_domain_completion: false,
    opl_content_judgment_allowed: false,
    next_stage_transition_owner: 'opl_runtime',
    required_closeout_outcomes: [
      'completed_and_continue',
      'completed_and_wait_owner',
      'route_back',
      'blocked',
      'rejected',
    ],
    accepted_closeout_ref_fields: [
      'owner_receipt_ref',
      'typed_blocker_ref',
      'human_gate_ref',
      'route_back_ref',
    ],
    authority_boundary: {
      opl_can_decide_domain_completion: false,
      provider_completion_counts_as_stage_complete: false,
      file_presence_counts_as_stage_complete: false,
      suite_pass_counts_as_stage_complete: false,
      conformance_pass_counts_as_stage_complete: false,
    },
  };
}

export function buildPassedTargetAgentOwnerReceiptSuite(): JsonObject {
  return {
    suite_id: 'target-agent-suite:owner-receipt-consumption',
    suite_kind: 'agent_lab_external_suite',
    authority_boundary: {
      can_write_domain_truth: false,
      can_write_memory_body: false,
      can_authorize_quality_verdict: false,
      can_promote_default_agent_without_gate: false,
    },
    tasks: [
      {
        task_id: 'agent-lab-task:target-agent/owner-receipt-consumption',
        domain_id: 'target-agent',
        task_family: 'owner_receipt_result_consumption',
        environment: {
          environment_kind: 'provider_hosted',
          workspace_locator_ref: 'workspace-locator:target-agent/owner-receipt',
          sandbox_policy: 'refs_only_no_target_artifact_or_memory_mutation',
          network_policy: 'domain_owner_policy',
        },
        instructions_ref: 'instructions:target-agent/owner-receipt-consumption',
        agent_entry_ref: 'domain-agent-entry:target-agent',
        stage_refs: ['stage:target-agent/owner-review', 'stage:target-agent/package-closeout'],
        stage_completion_policy: stageCompletionPolicy('target-agent', 'owner_receipt_result_consumption'),
        oracle_refs: ['oracle:target-agent/production-acceptance-authority-boundary'],
        scorer_refs: ['scorer:target-agent/owner-receipt-ref-projection'],
        recovery_probes: [
          {
            probe_ref: 'recovery-probe:target-agent/owner-receipt-redrive',
            probe_kind: 'human_gate_resume',
            expected_status: 'passed',
            observed_status: 'passed',
            source_refs: ['owner-gate:target-agent/live-acceptance'],
          },
        ],
        trajectory: {
          trajectory_ref: 'trajectory:target-agent/owner-receipt-consumption',
          run_ref: 'run:target-agent/owner-receipt-consumption',
          agent_executor: 'codex_cli',
          stage_attempt_refs: ['stage-attempt:target-agent/owner-receipt-consumption'],
          tool_call_refs: ['tool-call:target-agent/owner-receipt-evidence'],
          artifact_refs: ['contract-ref:target-agent/production_acceptance.json'],
          receipt_refs: ['owner-receipt:target-agent/live-acceptance/2026-05-20'],
          repair_refs: [],
        },
        scorecard: {
          scorecard_ref: 'quality-scorecard:target-agent/owner-receipt',
          domain_owned: true,
          opl_scorecard_role: 'scorecard_ref_projection_only',
          passed: true,
          metric_refs: [
            'metric-ref:target-agent/live-acceptance-owner-receipt-shape',
            'metric-ref:target-agent/no-opl-provider-completion-quality-claim',
          ],
          evidence_refs: ['receipt:target-agent/live-acceptance/2026-05-20'],
          review_refs: ['review-ref:target-agent/domain-owner-live-acceptance-review'],
          quality_gate_refs: ['quality-gate:target-agent/owner'],
        },
        improvement_candidate: {
          candidate_ref: 'improvement-candidate:target-agent/owner-receipt-consumption',
          candidate_kind: 'owner_receipt_scaleout',
          target_ref: 'owner-receipt-contract:target-agent/live-acceptance',
          evidence_refs: [
            'evidence-delta:target-agent/domain-owner-live-acceptance-receipt-closed',
            'typed-blocker:target-agent/domain-owner-live-acceptance-receipt-required',
          ],
          allowed_change_scope: 'manual_review_required',
          promotion_gate_ref: 'promotion-gate:target-agent/owner-receipt',
        },
        promotion_gate: {
          gate_ref: 'promotion-gate:target-agent/owner-receipt',
          gate_status: 'passed',
          required_refs: ['owner-receipt-contract:target-agent/live-acceptance'],
          regression_suite_refs: ['regression-suite:target-agent/production-acceptance-owner-boundary'],
          no_forbidden_write_proof_refs: ['no-forbidden-write:target-agent/live-acceptance-owner-receipt'],
          failure_delta_refs: ['evidence-delta:target-agent/domain-owner-live-acceptance-receipt-closed'],
          owner_or_human_gate_refs: ['owner-gate:target-agent/live-acceptance'],
          promotion_receipt_refs: ['receipt:target-agent/live-acceptance/2026-05-20'],
        },
      },
    ],
  };
}

export function buildPassedGenericOwnerReceiptSuite(): JsonObject {
  return {
    suite_id: 'external-agent-suite:owner-receipt-coordination',
    suite_kind: 'agent_lab_external_suite',
    authority_boundary: {
      can_write_domain_truth: false,
      can_write_memory_body: false,
      can_authorize_quality_verdict: false,
      can_promote_default_agent_without_gate: false,
    },
    tasks: [
      {
        task_id: 'agent-lab-task:external/owner-receipt-coordination',
        domain_id: 'external-agent',
        task_family: 'owner_receipt_coordination',
        environment: {
          environment_kind: 'local_workspace',
          workspace_locator_ref: 'workspace-locator:external/owner-receipt',
          sandbox_policy: 'refs_only_no_artifact_mutation',
          network_policy: 'domain_owner_policy',
        },
        instructions_ref: 'instructions:external/owner-receipt-coordination',
        agent_entry_ref: 'domain-agent-entry:external-agent',
        stage_refs: ['stage:external/review'],
        stage_completion_policy: stageCompletionPolicy('external-agent', 'owner_receipt_coordination'),
        oracle_refs: ['oracle:external/owner-receipt-boundary'],
        scorer_refs: ['scorer:external/owner-receipt-ref-projection'],
        recovery_probes: [
          {
            probe_ref: 'recovery-probe:external/owner-receipt-redrive',
            probe_kind: 'resume_after_interruption',
            expected_status: 'passed',
            observed_status: 'passed',
            source_refs: ['owner-receipt:external/live-acceptance'],
          },
        ],
        trajectory: {
          trajectory_ref: 'trajectory:external/owner-receipt-coordination',
          run_ref: 'run:external/owner-receipt-coordination',
          agent_executor: 'codex_cli',
          stage_attempt_refs: ['stage-attempt:external/owner-receipt-coordination'],
          tool_call_refs: ['tool-call:external/owner-receipt-evidence'],
          artifact_refs: ['contract-ref:external/owner-receipt-contract.json'],
          receipt_refs: ['owner-receipt:external/live-acceptance'],
          repair_refs: [],
          trace_refs: ['trace-ref:agent-lab/external-owner-receipt'],
        },
        scorecard: {
          scorecard_ref: 'quality-scorecard:external/owner-receipt',
          domain_owned: true,
          opl_scorecard_role: 'scorecard_ref_projection_only',
          passed: true,
          metric_refs: ['metric-ref:external/owner-receipt-shape'],
          evidence_refs: ['owner-receipt:external/live-acceptance'],
          review_refs: ['review-ref:external/owner-receipt'],
          quality_gate_refs: ['quality-gate:external/owner'],
        },
        improvement_candidate: {
          candidate_ref: 'improvement-candidate:external/owner-receipt',
          candidate_kind: 'owner_receipt_scaleout',
          target_ref: 'owner-receipt-contract:external/live-acceptance',
          evidence_refs: ['evidence-delta:external/owner-receipt-closed'],
          allowed_change_scope: 'manual_review_required',
          promotion_gate_ref: 'promotion-gate:external/owner-receipt',
        },
        promotion_gate: {
          gate_ref: 'promotion-gate:external/owner-receipt',
          gate_status: 'passed',
          required_refs: ['owner-receipt-contract:external/live-acceptance'],
          regression_suite_refs: ['regression-suite:external/owner-boundary'],
          no_forbidden_write_proof_refs: ['no-forbidden-write:external/owner-receipt'],
          failure_delta_refs: ['evidence-delta:external/owner-receipt-closed'],
          owner_or_human_gate_refs: ['owner-gate:external/owner-receipt'],
          promotion_receipt_refs: ['owner-receipt:external/live-acceptance'],
        },
      },
    ],
  };
}

export function buildBlockedEfficiencySuite(): JsonObject {
  return {
    suite_id: 'external-agent-suite:efficiency-non-regression',
    suite_kind: 'agent_lab_external_suite',
    authority_boundary: {
      can_write_domain_truth: false,
      can_write_memory_body: false,
      can_authorize_quality_verdict: false,
      can_promote_default_agent_without_gate: false,
    },
    tasks: [
      {
        task_id: 'agent-lab-task:target-agent/efficiency-non-regression',
        domain_id: 'target-agent',
        task_family: 'target_agent_generic_efficiency_work_order',
        environment: {
          environment_kind: 'local_workspace',
          workspace_locator_ref: 'workspace-locator:target-agent/efficiency',
          sandbox_policy: 'refs_only_no_artifact_mutation',
          network_policy: 'domain_owner_policy',
        },
        instructions_ref: 'instructions:target-agent/efficiency-non-regression',
        agent_entry_ref: 'domain-agent-entry:target-agent',
        stage_refs: ['stage:target-agent/efficiency-review'],
        oracle_refs: ['oracle:target-agent/quality-floor-non-regression'],
        scorer_refs: ['scorer:target-agent/efficiency-non-regression'],
        recovery_probes: [
          {
            probe_ref: 'recovery-probe:target-agent/efficiency-redrive',
            probe_kind: 'efficiency_non_regression_redrive',
            expected_status: 'passed',
            observed_status: 'blocked',
            source_refs: ['target-verification:target-agent/efficiency-redrive'],
          },
        ],
        trajectory: {
          trajectory_ref: 'trajectory:target-agent/efficiency-non-regression',
          run_ref: 'run:target-agent/efficiency-non-regression',
          agent_executor: 'codex_cli',
          stage_attempt_refs: ['stage-attempt:target-agent/efficiency-review'],
          tool_call_refs: ['tool-call:target-agent/efficiency-evidence-read'],
          artifact_refs: ['artifact-ref:target-agent/latency-baseline'],
          receipt_refs: ['target-verification:target-agent/efficiency-redrive'],
          repair_refs: ['efficiency-gap:target-agent/cache-reuse-missing'],
          trace_refs: ['trace-ref:target-agent/efficiency-non-regression'],
        },
        scorecard: {
          scorecard_ref: 'quality-scorecard:target-agent/efficiency-non-regression',
          domain_owned: true,
          opl_scorecard_role: 'scorecard_ref_projection_only',
          passed: false,
          metric_refs: ['metric-ref:target-agent/usage-cost-regression'],
          evidence_refs: [
            'quality-floor:target-agent/current-behavior-gate',
            'latency-baseline:target-agent/p50-p95-before',
            'usage-cost:target-agent/token-cost-before',
            'cache-reuse:target-agent/reused-prefix-cache',
            'target-verification:target-agent/efficiency-redrive',
          ],
          review_refs: ['review-ref:target-agent/efficiency-reviewer'],
          quality_gate_refs: ['quality-gate:target-agent/owner-quality-floor'],
        },
        improvement_candidate: {
          candidate_ref: 'improvement-candidate:target-agent/efficiency',
          candidate_kind: 'efficiency_non_regression',
          evidence_refs: [
            'latency-baseline:target-agent/p50-p95-before',
            'usage-cost:target-agent/token-cost-before',
            'cache-reuse:target-agent/reused-prefix-cache',
          ],
          efficiency_evidence_refs: {
            quality_floor_refs: ['quality-floor:target-agent/current-behavior-gate'],
            latency_baseline_refs: ['latency-baseline:target-agent/p50-p95-before'],
            usage_cost_refs: ['usage-cost:target-agent/token-cost-before'],
            cache_reuse_refs: ['cache-reuse:target-agent/reused-prefix-cache'],
            target_verification_refs: ['target-verification:target-agent/efficiency-redrive'],
          },
          allowed_change_scope: 'branch_only',
          promotion_gate_ref: 'promotion-gate:target-agent/efficiency',
        },
        promotion_gate: {
          gate_ref: 'promotion-gate:target-agent/efficiency',
          gate_status: 'blocked',
          required_refs: ['quality-floor:target-agent/current-behavior-gate'],
          regression_suite_refs: ['regression-suite:target-agent/efficiency-non-regression'],
          no_forbidden_write_proof_refs: ['no-forbidden-write:target-agent/efficiency'],
        },
      },
    ],
  };
}

export function writeEfficiencyReviewerEvaluation(filePath: string, overrides: JsonObject = {}): JsonObject {
  return writeAiReviewerEvaluation(filePath, {
    critique: 'The suite shows an efficiency regression candidate with latency, usage cost, cache reuse, target verification, and preserved quality-floor evidence.',
    suggestions: [
      'Generate a generic target-agent efficiency work order that preserves the quality floor before optimizing latency and usage cost.',
    ],
    source_refs: [
      'latency-baseline:target-agent/p50-p95-before',
      'usage-cost:target-agent/token-cost-before',
      'cache-reuse:target-agent/reused-prefix-cache',
      'quality-floor:target-agent/current-behavior-gate',
    ],
    direct_evidence_refs: [
      'quality-floor:target-agent/current-behavior-gate',
      'target-verification:target-agent/efficiency-redrive',
    ],
    predicted_impact: 'The target agent can reduce latency and usage cost while proving quality-floor non-regression and cache reuse.',
    ...overrides,
  });
}
