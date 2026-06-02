import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  parseImproveFromAgentLabSuiteArgs,
  runImproveFromAgentLabSuite,
} from '../scripts/improve-from-agent-lab-suite.ts';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const oplBin = process.env.OPL_BIN
  ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';
const targetPatchLoopMachineRefFields = [
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

function writeJson(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function readJson(filePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function runImproveArgs(args: string[]): JsonObject {
  return runImproveFromAgentLabSuite(parseImproveFromAgentLabSuiteArgs(args));
}

function assertTargetPatchLoopMachineRefs(refs: JsonObject, expected: {
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

function writeAiReviewerEvaluation(filePath: string, overrides: JsonObject = {}): JsonObject {
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

function buildBlockedMedicalManuscriptSuite(suitePath: string): JsonObject {
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

function writeMedicalTargetImprovementPolicy(targetAgentDir: string): void {
  writeJson(path.join(targetAgentDir, 'contracts/agent_lab_handoff.json'), {
    surface_kind: 'domain_agent_lab_production_evidence_handoff',
    domain_id: 'med-autoscience',
    owner: 'MedAutoScience',
    handoff_status: 'ready_for_opl_meta_agent_and_agent_lab_execution',
    external_suite_improvement_policy: {
      default_change_ref_triggers: [
        'medical-manuscript',
        'medical_journal_prose_quality',
      ],
      default_change_refs: [
        'stage_policy_ref:mas/write/pre_draft_prediction_model_reporting',
        'skill_ref:medical-research-write',
        'rubric_ref:ai_reviewer/high_quality_medical_manuscript',
        'prompt_ref:ai_reviewer_medical_prose_quality_review',
        'quality_contract_ref:prediction_model_first_draft_quality',
        'regression_suite_ref:mas/agent_lab_medical_manuscript_self_evolution',
      ],
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

function writeOwnerReceiptAiReviewerEvaluation(filePath: string, overrides: JsonObject = {}): JsonObject {
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

function buildPassedTargetAgentOwnerReceiptSuite(): JsonObject {
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

function buildPassedGenericOwnerReceiptSuite(): JsonObject {
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

function buildBlockedEfficiencySuite(): JsonObject {
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

function writeEfficiencyReviewerEvaluation(filePath: string, overrides: JsonObject = {}): JsonObject {
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

test('external suite efficiency evidence is projected into developer work order refs', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-efficiency-suite-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'target-agent');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'target-agent',
      domain_label: 'Target Agent',
      delivery_domain: 'generic_target_agent',
    });
    const suitePath = path.join(outputRoot, 'efficiency-suite.json');
    writeJson(suitePath, buildBlockedEfficiencySuite());
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeEfficiencyReviewerEvaluation(reviewerEvaluationPath);

    const payload = runImproveArgs([
      '--suite',
      suitePath,
      '--target-agent-dir',
      targetAgentDir,
      '--output-dir',
      outputRoot,
      '--ai-reviewer-evaluation',
      reviewerEvaluationPath,
      '--opl-bin',
      oplBin,
    ]);
    assert.equal(payload.status, 'blocked_with_developer_patch_work_order');
    const workOrder = readJson(payload.artifacts.developer_patch_work_order_path);
    assert.deepEqual(workOrder.efficiency_non_regression_refs.quality_floor_refs, [
      'quality-floor:target-agent/current-behavior-gate',
    ]);
    assert.deepEqual(workOrder.efficiency_non_regression_refs.latency_baseline_refs, [
      'latency-baseline:target-agent/p50-p95-before',
    ]);
    assert.deepEqual(workOrder.efficiency_non_regression_refs.usage_cost_refs, [
      'usage-cost:target-agent/token-cost-before',
    ]);
    assert.deepEqual(workOrder.efficiency_non_regression_refs.cache_reuse_refs, [
      'cache-reuse:target-agent/reused-prefix-cache',
    ]);
    assert.deepEqual(workOrder.efficiency_non_regression_refs.target_verification_refs, [
      'target-verification:target-agent/efficiency-redrive',
    ]);
    assert.deepEqual(
      workOrder.work_order_completeness.efficiency_non_regression_refs,
      workOrder.efficiency_non_regression_refs,
    );
    assert.deepEqual(
      workOrder.machine_closeout_refs.efficiency_non_regression_refs,
      workOrder.efficiency_non_regression_refs,
    );
    assert.ok(workOrder.required_verification_refs.includes('target-verification:target-agent/efficiency-redrive'));
    assert.equal(workOrder.implementation_controls.quality_floor_non_regression_required, true);
    assert.equal(workOrder.authority_boundary.can_authorize_target_domain_quality_or_export, false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('external suite efficiency evidence without quality floor fails closed with typed blocker', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-efficiency-blocker-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'target-agent');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'target-agent',
      domain_label: 'Target Agent',
      delivery_domain: 'generic_target_agent',
    });
    const suite = buildBlockedEfficiencySuite();
    ((suite.tasks as JsonObject[])[0].improvement_candidate as JsonObject).efficiency_evidence_refs = {
      latency_baseline_refs: ['latency-baseline:target-agent/p50-p95-before'],
      usage_cost_refs: ['usage-cost:target-agent/token-cost-before'],
      cache_reuse_refs: ['cache-reuse:target-agent/reused-prefix-cache'],
      target_verification_refs: ['target-verification:target-agent/efficiency-redrive'],
    };
    const suitePath = path.join(outputRoot, 'efficiency-suite.json');
    writeJson(suitePath, suite);
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeEfficiencyReviewerEvaluation(reviewerEvaluationPath, {
      source_refs: [
        'latency-baseline:target-agent/p50-p95-before',
        'usage-cost:target-agent/token-cost-before',
      ],
      direct_evidence_refs: ['target-verification:target-agent/efficiency-redrive'],
    });

    const payload = runImproveArgs([
      '--suite',
      suitePath,
      '--target-agent-dir',
      targetAgentDir,
      '--output-dir',
      outputRoot,
      '--ai-reviewer-evaluation',
      reviewerEvaluationPath,
      '--opl-bin',
      oplBin,
    ]);
    assert.equal(payload.status, 'blocked_efficiency_quality_floor_missing');
    assert.equal(fs.existsSync(path.join(outputRoot, 'mechanism-patch-proposal.json')), false);
    const typedBlocker = readJson(payload.artifacts.typed_blocker_path);
    assert.equal(typedBlocker.blocked_reason, 'efficiency_evidence_requires_quality_floor_refs');
    assert.ok(typedBlocker.missing_required_fields.includes('efficiency_non_regression_refs.quality_floor_refs'));
    assert.deepEqual(typedBlocker.efficiency_non_regression_refs.latency_baseline_refs, [
      'latency-baseline:target-agent/p50-p95-before',
    ]);
    assert.equal(typedBlocker.authority_boundary.no_executable_work_order_issued, true);
    assert.equal(typedBlocker.authority_boundary.can_authorize_target_quality_or_export, false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('external blocked Agent Lab suite becomes a MAS developer patch work order', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-external-suite-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'med-autoscience',
      domain_label: 'MedAutoScience',
      delivery_domain: 'medical_research',
    });
    writeMedicalTargetImprovementPolicy(targetAgentDir);
    const suitePath = path.join(outputRoot, 'medical-manuscript-quality-suite.json');
    writeJson(suitePath, buildBlockedMedicalManuscriptSuite(suitePath));
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    const reviewerEvaluation = writeAiReviewerEvaluation(reviewerEvaluationPath);

    const payload = runImproveArgs([
      '--suite',
      suitePath,
      '--target-agent-dir',
      targetAgentDir,
      '--output-dir',
      outputRoot,
      '--feedback-ref',
      'manual-review:gpt-5.5/high-quality-medical-paper-style',
      '--ai-reviewer-evaluation',
      reviewerEvaluationPath,
      '--opl-bin',
      oplBin,
    ]);
    assert.equal(payload.surface_kind, 'opl_meta_agent_external_suite_self_evolution_result');
    assert.equal(payload.status, 'blocked_with_developer_patch_work_order');
    assert.equal(payload.target_agent.domain_id, 'med-autoscience');
    assert.equal(payload.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(payload.learning_loop.developer_patch_work_order.authority_boundary.can_modify_target_agent_source_repo, true);
    assert.equal(payload.authority_boundary.can_authorize_target_domain_quality_or_export, false);
    assert.equal(payload.opl_agent_lab.suite_result.status, 'blocked');
    assert.equal(payload.opl_agent_lab.suite_result.summary.forbidden_authority_flag_count, 0);

    const candidate = payload.learning_loop.target_capability_improvement_candidate;
    assert.equal(candidate.status, 'candidate_recorded_requires_target_owner_gate');
    assert.equal(candidate.feedback_ref, 'manual-review:gpt-5.5/high-quality-medical-paper-style');
    assert.equal(candidate.ai_reviewer_evaluation_ref, reviewerEvaluationPath);
    assert.equal(candidate.ai_reviewer_review.critique, reviewerEvaluation.critique);
    assert.deepEqual(candidate.ai_reviewer_review.suggestions, reviewerEvaluation.suggestions);
    assert.deepEqual(candidate.ai_reviewer_evidence.source_refs, reviewerEvaluation.source_refs);
    assert.deepEqual(candidate.ai_reviewer_evidence.direct_evidence_refs, reviewerEvaluation.direct_evidence_refs);
    assert.equal(candidate.ai_reviewer_independence.no_shared_context, true);
    assert.equal(candidate.ai_reviewer_independence.independent_attempt, true);
    assert.equal(candidate.ai_reviewer_independence.execution_attempt_ref, reviewerEvaluation.execution_attempt_ref);
    assert.equal(candidate.ai_reviewer_independence.review_attempt_ref, reviewerEvaluation.review_attempt_ref);
    assert.equal(candidate.review_provenance.run_ref, reviewerEvaluation.run_ref);
    assert.ok(candidate.proposed_change_refs.includes('quality_contract_ref:prediction_model_first_draft_quality'));
    assert.ok(candidate.proposed_change_refs.includes('skill_ref:medical-research-write'));
    assert.ok(candidate.proposed_change_refs.includes('rubric_ref:ai_reviewer/high_quality_medical_manuscript'));
    assert.ok(candidate.proposed_change_refs.includes('prompt_ref:ai_reviewer_medical_prose_quality_review'));
    assert.ok(
      candidate.proposed_change_refs.includes(
        'quality_contract_ref:mas/prediction_model_first_draft_quality/variable_unit_harmonization',
      ),
    );
    assert.ok(
      candidate.proposed_change_refs.includes(
        'quality_contract_ref:mas/prediction_model_first_draft_quality/survey_weighting_or_unweighted_framing',
      ),
    );
    assert.ok(
      candidate.proposed_change_refs.includes(
        'quality_contract_ref:mas/prediction_model_first_draft_quality/calibration_and_risk_distribution_figures',
      ),
    );
    assert.ok(candidate.external_learning_refs.includes('external-source:equator-network/tripod-reporting-guideline'));
    assert.equal(candidate.traceability_status, 'gap_to_patch_refs_mapped');
    const hdlTrace = (candidate.patch_traceability_matrix as JsonObject[]).find((item) => item.gap_token === 'hdl');
    assert.ok(hdlTrace);
    assert.ok(
      hdlTrace.required_patch_refs.includes(
        'quality_contract_ref:mas/prediction_model_first_draft_quality/variable_unit_harmonization',
      ),
    );
    assert.ok(hdlTrace.editable_surface_refs.includes('quality_contract_ref'));
    assert.ok(
      hdlTrace.target_repo_file_hints.includes(
        'src/med_autoscience/policies/medical_reporting_checklist.py',
      ),
    );
    assert.ok(
      hdlTrace.ai_reviewer_suggestions.includes(
        'Map HDL unit harmonization to the prediction model quality contract and pre-draft reporting stage policy.',
      ),
    );
    assert.ok(hdlTrace.ai_reviewer_source_refs.includes('rubric-gap:mas/002/hdl-harmonization-and-sensitivity'));
    assert.ok(hdlTrace.failure_evidence.includes('rubric-gap:mas/002/hdl-harmonization-and-sensitivity'));
    assert.match(hdlTrace.root_cause, /hdl/i);
    assert.ok(
      hdlTrace.targeted_fix.includes(
        'quality_contract_ref:mas/prediction_model_first_draft_quality/variable_unit_harmonization',
      ),
    );
    assert.equal(hdlTrace.predicted_impact, reviewerEvaluation.predicted_impact);

    const mechanism = readJson(payload.artifacts.mechanism_patch_proposal_path);
    assert.equal(mechanism.surface_kind, 'opl_meta_agent_mechanism_patch_proposal');
    assert.equal(mechanism.authority_boundary.can_mutate_target_domain_artifact_body, false);
    assert.ok(mechanism.editable_surfaces.includes('target_agent_stage_policy_ref'));
    assert.ok(mechanism.edit.proposed_change_refs.includes('quality_contract_ref:prediction_model_first_draft_quality'));
    assert.ok(mechanism.observe.source_refs.includes(reviewerEvaluationPath));
    assert.ok(mechanism.diagnose.source_refs.includes('artifacts/publication_eval/latest.json'));
    assert.equal(mechanism.repeat_budget.max_attempts, 2);
    assert.equal(mechanism.repeat_budget.remaining_attempts, 1);
    assert.ok(mechanism.dead_letter_refs.includes(`dead-letter:opl-meta-agent/med-autoscience/${mechanism.proposal_id}`));
    assert.ok(mechanism.escalation_refs.includes('escalation:target-owner/med-autoscience/external-suite-self-evolution'));
    assert.equal(mechanism.next_allowed_action, 'delegate_to_opl_work_order_execute_after_currentness_gate');

    const receipt = readJson(payload.artifacts.meta_agent_improvement_receipt_path);
    assert.equal(receipt.receipt_class, 'external_suite_quality_failure_self_evolution_receipt');
    assert.equal(receipt.acceptance_gates.target_domain_truth_authority_preserved, true);
    assert.equal(receipt.acceptance_gates.ai_reviewer_critique_present, true);
    assert.equal(receipt.acceptance_gates.ai_reviewer_suggestions_present, true);
    assert.equal(receipt.acceptance_gates.ai_reviewer_source_refs_valid, true);
    assert.equal(receipt.acceptance_gates.ai_reviewer_direct_evidence_refs_present, true);
    assert.equal(receipt.acceptance_gates.ai_reviewer_no_shared_context, true);
    assert.equal(receipt.acceptance_gates.ai_reviewer_independent_attempt_present, true);
    assert.equal(receipt.acceptance_gates.ai_reviewer_attempt_refs_distinct, true);

    const workOrder = readJson(payload.artifacts.developer_patch_work_order_path);
    assert.equal(workOrder.surface_kind, 'opl_meta_agent_developer_patch_work_order');
    assert.equal(workOrder.status, 'ready_for_target_agent_source_patch');
    assert.deepEqual(workOrder.work_order_currentness, {
      target_agent_id: 'med-autoscience',
      eval_result_ref: workOrder.source_agent_lab_result_ref,
      work_order_ref: workOrder.work_order_id,
      owner_route_ref: 'target-agent-owner:med-autoscience',
      provider_owner_route_index_evidence: {
        provider: 'opl_work_order_execute',
        owner_route_index_ref: `owner-route-index:med-autoscience/${workOrder.work_order_id}`,
        owner_route_ledger_ref: `owner-route-ledger:med-autoscience/${workOrder.work_order_id}`,
        stage_attempt_ledger_ref: `stage-attempt-ledger:med-autoscience/${workOrder.work_order_id}`,
        route_binding_ref: `route-binding:med-autoscience/${workOrder.source_agent_lab_result_ref}/${workOrder.work_order_id}`,
        target_eval_work_order_owner_route_tuple:
          `med-autoscience|${workOrder.source_agent_lab_result_ref}|${workOrder.work_order_id}|target-agent-owner:med-autoscience`,
        derived_from_current_opl_route_ledger: true,
        fail_closed_without_route_or_ledger_proof: true,
      },
    });
    assert.deepEqual(workOrder.target_progress_accounting, {
      progress_delta_classification: 'mixed',
      deliverable_progress_delta: {
        count: workOrder.proposed_change_refs.length,
        refs: workOrder.proposed_change_refs,
        domain_alias: 'target_agent_substantive_delta',
      },
      platform_repair_delta: {
        count: 7,
        refs: [
          workOrder.machine_closeout_refs.target_runtime_read_model_consumption_ref,
          workOrder.machine_closeout_refs.workspace_environment_proof_ref,
          workOrder.machine_closeout_refs.no_forbidden_write_proof_ref,
          workOrder.machine_closeout_refs.target_owner_receipt_or_typed_blocker_ref,
          workOrder.machine_closeout_refs.patch_absorption_ref,
          workOrder.machine_closeout_refs.worktree_cleanup_ref,
          workOrder.machine_closeout_refs.agent_lab_re_evaluation_ref,
        ],
        domain_alias: 'platform_interface_repair_delta',
      },
      substantive_deliverable_delta_refs: workOrder.proposed_change_refs,
      platform_interface_repair_refs: [
        workOrder.machine_closeout_refs.target_runtime_read_model_consumption_ref,
        workOrder.machine_closeout_refs.workspace_environment_proof_ref,
        workOrder.machine_closeout_refs.no_forbidden_write_proof_ref,
        workOrder.machine_closeout_refs.target_owner_receipt_or_typed_blocker_ref,
        workOrder.machine_closeout_refs.patch_absorption_ref,
        workOrder.machine_closeout_refs.worktree_cleanup_ref,
        workOrder.machine_closeout_refs.agent_lab_re_evaluation_ref,
      ],
      excluded_from_substantive_deliverable_progress_refs: [],
      non_substantive_progress_ref_kinds: [
        'platform_interface_repair',
        'closeout_plumbing',
        'patch_absorption',
        'worktree_cleanup',
        'agent_lab_re_evaluation',
        'currentness_repair',
        'refs_only_ledger_work',
      ],
      accounting_policy: 'deliverable_delta_is_not_closed_by_platform_interface_repair',
    });
    assert.equal(workOrder.ai_reviewer_evaluation_ref, reviewerEvaluationPath);
    assert.deepEqual(workOrder.ai_reviewer_review.suggestions, reviewerEvaluation.suggestions);
    assert.equal(workOrder.ai_reviewer_review.predicted_impact, reviewerEvaluation.predicted_impact);
    assert.deepEqual(workOrder.ai_reviewer_independence.direct_evidence_refs, reviewerEvaluation.direct_evidence_refs);
    assert.equal(workOrder.ai_reviewer_scorecard.verdict, reviewerEvaluation.verdict);
    assert.equal(workOrder.executor_lease_ref, `executor-lease:codex-cli/${workOrder.work_order_id}`);
    assert.ok(workOrder.reviewer_pool_refs.includes(reviewerEvaluationPath));
    assert.ok(workOrder.reviewer_pool_refs.includes('paper/evidence_ledger.json'));
    assert.equal(
      workOrder.patch_execution_bundle_ref,
      `patch-execution-bundle:target-agent/${workOrder.target_agent.domain_id}/${workOrder.work_order_id}`,
    );
    assert.ok(workOrder.target_closeout_refs.includes(workOrder.machine_closeout_refs.patch_absorption_ref));
    assert.ok(workOrder.target_closeout_refs.includes(workOrder.machine_closeout_refs.worktree_cleanup_ref));
    assert.equal(
      workOrder.work_order_completeness.executor_lease_ref,
      workOrder.executor_lease_ref,
    );
    assert.deepEqual(workOrder.work_order_completeness.reviewer_pool_refs, workOrder.reviewer_pool_refs);
    assert.equal(
      workOrder.work_order_completeness.patch_execution_bundle_ref,
      workOrder.patch_execution_bundle_ref,
    );
    assert.deepEqual(workOrder.work_order_completeness.target_closeout_refs, workOrder.target_closeout_refs);
    assert.deepEqual(workOrder.ai_reviewer_recovery_refs.canary_refs, reviewerEvaluation.canary_refs);
    assert.ok(workOrder.ahe_developer_work_order.failure_evidence.includes('rubric-gap:mas/002/hdl-harmonization-and-sensitivity'));
    assert.match(workOrder.ahe_developer_work_order.root_cause, /capability gaps/);
    assert.ok(workOrder.ahe_developer_work_order.targeted_fix.includes('quality_contract_ref:prediction_model_first_draft_quality'));
    assert.equal(workOrder.ahe_developer_work_order.predicted_impact, reviewerEvaluation.predicted_impact);
    assert.ok(workOrder.allowed_editable_surfaces.includes('quality_contract_ref'));
    assert.ok(workOrder.target_repo_file_hints.includes('src/med_autoscience/policies/medical_reporting_checklist.py'));
    assert.ok(workOrder.required_verification_refs.includes('target_repo_test_receipt'));
    assert.ok(workOrder.rollback_version_refs.includes('target_agent_previous_head_ref'));
    assert.ok(workOrder.owner_route_refs.includes('target-agent-owner:med-autoscience'));
    assert.equal(workOrder.required_opl_work_order_primitive_refs.owner, 'one-person-lab');
    assert.equal(workOrder.required_opl_work_order_primitive_refs.consumed_as_refs_only_by_oma, true);
    assert.match(
      workOrder.required_opl_work_order_primitive_refs.work_order_readiness_primitive_ref,
      /^opl-work-order-primitive:work-order-readiness\/med-autoscience\//,
    );
    assert.match(
      workOrder.required_opl_work_order_primitive_refs.promotion_readiness_primitive_ref,
      /^opl-work-order-primitive:promotion-readiness\/med-autoscience\//,
    );
    assert.match(
      workOrder.required_opl_work_order_primitive_refs.promotion_gate_projection_ref,
      /^opl-work-order-primitive:promotion-gate-projection\/med-autoscience\//,
    );
    assert.match(
      workOrder.required_opl_work_order_primitive_refs.owner_gated_promotion_projection_ref,
      /^opl-work-order-primitive:owner-gated-promotion-projection\/med-autoscience\//,
    );
    assert.equal(workOrder.no_forbidden_write_proof.can_write_target_domain_truth, false);
    assert.equal(workOrder.work_order_completeness.required_fields_present, true);
    assert.ok(workOrder.work_order_completeness.reviewer_refs.includes(reviewerEvaluationPath));
    assert.ok(workOrder.work_order_completeness.reviewer_refs.includes('paper/evidence_ledger.json'));
    assert.equal(workOrder.work_order_completeness.executor_aperture.executor_first, true);
    assert.equal(workOrder.work_order_completeness.executor_aperture.codex_first, true);
    assert.equal(workOrder.work_order_completeness.executor_aperture.executor, 'codex_cli');
    assert.equal(
      workOrder.work_order_completeness.executor_aperture.executor_lease_ref,
      workOrder.executor_lease_ref,
    );
    assert.ok(workOrder.work_order_completeness.executor_aperture.allowed_write_surfaces.includes('quality_contract_ref'));
    assert.ok(workOrder.work_order_completeness.executor_aperture.forbidden_write_surfaces.includes('target_quality_or_export_verdict'));
    assert.equal(
      workOrder.work_order_completeness.patch_traceability.matrix_ref,
      `${workOrder.work_order_id}#/patch_traceability_matrix`,
    );
    assert.equal(workOrder.work_order_completeness.patch_traceability.traceability_status, 'gap_to_patch_refs_mapped');
    assert.ok(workOrder.work_order_completeness.target_verification.required_refs.includes('target_repo_test_receipt'));
    assert.equal(workOrder.work_order_completeness.target_verification.requires_target_owner_receipt_or_typed_blocker, true);
    assert.ok(workOrder.work_order_completeness.owner_route.route_refs.includes('target-agent-owner:med-autoscience'));
    assert.equal(workOrder.work_order_completeness.no_forbidden_write_proof.can_write_target_domain_truth, false);
    assert.ok(workOrder.work_order_completeness.no_forbidden_write_proof.proof_refs.includes('no_target_domain_truth_write_proof'));
    assert.ok(workOrder.work_order_completeness.canary_refs.includes('canary:mas/002/high-quality-medical-manuscript-redrive'));
    assert.ok(workOrder.work_order_completeness.rollback_refs.includes('rollback:mas/002/pre-reviewer-workorder-head'));
    assert.ok(workOrder.work_order_completeness.version_refs.includes('version:mas/002/current-head'));
    assert.match(workOrder.work_order_completeness.fail_closed_blocker_ref, /typed-blocker:opl-meta-agent\/med-autoscience/);
    assert.equal(workOrder.version_management.absorb_back_required, true);
    assert.equal(workOrder.version_management.temporary_worktree_cleanup_required, true);
    assert.equal(workOrder.authority_boundary.can_modify_target_agent_source_repo, true);
    assert.equal(workOrder.authority_boundary.can_write_target_domain_truth, false);
    assertTargetPatchLoopMachineRefs(workOrder.machine_closeout_refs, {
      blockedSuiteResultRef: workOrder.source_agent_lab_result_ref,
      developerPatchWorkOrderRef: workOrder.work_order_id,
      requiredVerificationRefs: workOrder.required_verification_refs,
    });
    assert.equal(
      workOrder.machine_closeout_refs.target_owner_receipt_or_typed_blocker_ref,
      `target-owner-receipt-or-typed-blocker:med-autoscience/${workOrder.work_order_id}`,
    );
    assert.ok(
      (workOrder.patch_traceability_matrix as JsonObject[]).some((item) => item.gap_token === 'internal-quality-language-purge'),
    );
    assert.ok(
      (workOrder.patch_traceability_matrix as JsonObject[]).some((item) =>
        item.ai_reviewer_suggestions.includes(
          'Purge internal-quality language from manuscript writing prompts and reviewer rubrics.',
        )
      ),
    );
    assert.equal(workOrder.implementation_controls.patch_must_be_limited_to_traceable_surfaces, true);
    assert.equal(workOrder.implementation_controls.developer_patch_receipt_required, true);
    assert.equal(workOrder.implementation_controls.no_target_domain_truth_write_proof_required, true);
    assert.equal(workOrder.implementation_controls.target_runtime_consumption_verification_required, true);
    assert.equal(workOrder.implementation_controls.target_workspace_environment_consumption_proof_required, true);
    assert.equal(workOrder.implementation_controls.dependency_lock_or_profile_migration_proof_required, true);
    assert.equal(workOrder.implementation_controls.owner_entry_redrive_required, true);
    assert.equal(workOrder.implementation_controls.repo_hygiene_no_checkout_venv_proof_required, true);
    assert.ok(
      workOrder.implementation_controls.required_closeout_evidence.includes(
        'target runtime/read-model consumed patched capability',
      ),
    );
    assert.ok(
      workOrder.implementation_controls.required_closeout_evidence.includes(
        'target workspace dependency lock/profile migrated when runtime extras are required',
      ),
    );
    assert.ok(
      workOrder.implementation_controls.required_closeout_evidence.includes(
        'target owner entry redrive consumed the migrated workspace environment',
      ),
    );
    assert.ok(
      workOrder.implementation_controls.required_closeout_evidence.includes(
        'repo hygiene proof shows no target checkout .venv or generated egg-info pollution',
      ),
    );
    assert.ok(
      workOrder.runtime_consumption_verification.required_surface_refs.includes('study_runtime_status'),
    );
    assert.ok(
      workOrder.runtime_consumption_verification.required_surface_refs.includes('domain_transition'),
    );
    assert.ok(
      workOrder.runtime_consumption_verification.required_surface_refs.includes('default_executor_dispatch_execution'),
    );
    assert.ok(
      workOrder.runtime_consumption_verification.expected_outcomes.includes(
        'blocked suite redrive no longer parks as stale human handoff when target owner work remains',
      ),
    );
    assert.equal(workOrder.runtime_consumption_verification.can_write_target_domain_truth, false);
    assert.equal(
      workOrder.target_workspace_environment_verification.verification_mode,
      'read_only_target_workspace_environment_and_owner_entry_redrive',
    );
    assert.ok(
      workOrder.target_workspace_environment_verification.required_surface_refs.includes(
        'target_workspace_pyproject_or_lock',
      ),
    );
    assert.ok(
      workOrder.target_workspace_environment_verification.required_surface_refs.includes(
        'study_runtime_analysis_bundle',
      ),
    );
    assert.ok(
      workOrder.target_workspace_environment_verification.expected_outcomes.includes(
        'owner runtime entry uses the target workspace interpreter rather than target repo checkout .venv',
      ),
    );
    assert.equal(workOrder.target_workspace_environment_verification.can_write_target_domain_truth, false);
    assert.ok(workOrder.implementation_controls.forbidden_target_paths_or_surfaces.includes('publication_eval/latest.json'));
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('target-agent owner receipt Agent Lab suite becomes a no-patch result-consumer coordination record', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-target-owner-receipt-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'target-agent');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'target-agent',
      domain_label: 'Target Agent',
      delivery_domain: 'opl_compatible_target_agent',
    });
    const suitePath = path.join(outputRoot, 'target-owner-receipt-suite.json');
    writeJson(suitePath, buildPassedTargetAgentOwnerReceiptSuite());
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    const reviewerEvaluation = writeOwnerReceiptAiReviewerEvaluation(reviewerEvaluationPath);

    const payload = runImproveArgs([
      '--suite',
      suitePath,
      '--target-agent-dir',
      targetAgentDir,
      '--output-dir',
      outputRoot,
      '--feedback-ref',
      'manual-review:gpt-5.5/target-agent-owner-receipt',
      '--ai-reviewer-evaluation',
      reviewerEvaluationPath,
      '--opl-bin',
      oplBin,
    ]);
    assert.equal(payload.surface_kind, 'opl_meta_agent_external_suite_self_evolution_result');
    assert.equal(payload.status, 'passed');
    assert.equal(payload.target_agent.domain_id, 'target-agent');
    assert.equal(payload.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(payload.authority_boundary.can_authorize_target_domain_quality_or_export, false);
    assert.equal(payload.opl_agent_lab.suite_result.status, 'passed');

    const candidate = payload.learning_loop.target_capability_improvement_candidate;
    assert.equal(candidate.improvement_area, 'target_agent_agent_lab_result_consumption_capability');
    assert.equal(candidate.status, 'candidate_recorded_requires_target_owner_gate');
    assert.ok(
      candidate.proposed_change_refs.includes(
        'target_agent_production_acceptance_contract_ref:target_agent/production_acceptance',
      ),
    );
    assert.ok(candidate.proposed_change_refs.includes('target_agent_owner_receipt_contract_ref:target_agent/live-acceptance'));
    assert.ok(candidate.target_editable_surface_refs.includes('target_agent_production_acceptance_contract_ref'));
    assert.equal(candidate.ai_reviewer_review.critique, reviewerEvaluation.critique);
    assert.equal(candidate.ai_reviewer_independence.no_shared_context, true);
    assert.equal(path.basename(payload.artifacts.target_capability_improvement_candidate_path), 'target-capability-improvement-candidate.json');
    const candidateFromFile = readJson(payload.artifacts.target_capability_improvement_candidate_path);
    assert.equal(candidateFromFile.candidate_id, candidate.candidate_id);
    const liveTrace = (candidate.patch_traceability_matrix as JsonObject[]).find((item) =>
      item.gap_token === 'live-acceptance'
    );
    assert.ok(liveTrace);
    assert.deepEqual(liveTrace.target_repo_file_hints, []);
    assert.ok(liveTrace.required_patch_refs.includes('target_agent_owner_receipt_contract_ref:target_agent/live-acceptance'));

    const mechanism = readJson(payload.artifacts.mechanism_patch_proposal_path);
    assert.ok(mechanism.editable_surfaces.includes('target_agent_owner_receipt_contract_ref'));
    assert.equal(mechanism.authority_boundary.can_authorize_target_domain_quality_or_export, false);

    const workOrder = readJson(payload.artifacts.developer_patch_work_order_path);
    assert.equal(workOrder.status, 'no_patch_required');
    assert.equal(workOrder.target_progress_accounting.progress_delta_classification, 'platform_repair');
    assert.equal(workOrder.target_progress_accounting.deliverable_progress_delta.domain_alias, 'target_agent_substantive_delta');
    assert.equal(workOrder.target_progress_accounting.deliverable_progress_delta.count, 0);
    assert.equal(workOrder.target_progress_accounting.platform_repair_delta.domain_alias, 'platform_interface_repair_delta');
    assert.deepEqual(workOrder.target_progress_accounting.substantive_deliverable_delta_refs, []);
    assert.ok(workOrder.target_progress_accounting.platform_interface_repair_refs.includes(
      workOrder.machine_closeout_refs.agent_lab_re_evaluation_ref,
    ));
    assert.deepEqual(workOrder.required_patch_surfaces, []);
    assert.deepEqual(workOrder.allowed_editable_surfaces, []);
    assert.ok(workOrder.required_verification_refs.includes('target_owner_receipt_projection_ref'));
    assert.equal(workOrder.required_opl_work_order_primitive_refs.owner, 'one-person-lab');
    assert.equal(workOrder.required_opl_work_order_primitive_refs.consumed_as_refs_only_by_oma, true);
    assert.match(
      workOrder.required_opl_work_order_primitive_refs.work_order_readiness_primitive_ref,
      /\/no-source-patch$/,
    );
    assert.ok(workOrder.rollback_version_refs.includes('owner_receipt_coordination_record'));
    assert.equal(workOrder.ahe_developer_work_order.predicted_impact, reviewerEvaluation.predicted_impact);
    assert.deepEqual(workOrder.patch_traceability_matrix, []);
    assert.equal(workOrder.work_order_completeness.required_fields_present, true);
    assert.equal(workOrder.work_order_completeness.executor_aperture.allowed_scope, 'coordination_record_only');
    assert.deepEqual(workOrder.work_order_completeness.executor_aperture.allowed_write_surfaces, []);
    assert.equal(workOrder.work_order_completeness.patch_traceability.traceability_status, 'no_source_patch_required');
    assert.ok(workOrder.work_order_completeness.target_verification.required_refs.includes('target_owner_receipt_projection_ref'));
    assert.ok(workOrder.work_order_completeness.canary_refs.includes('canary:target-agent/owner-receipt-projection'));
    assert.ok(workOrder.work_order_completeness.rollback_refs.includes('owner_receipt_coordination_record'));
    assert.ok(workOrder.work_order_completeness.version_refs.includes('owner_receipt_coordination_record'));
    assert.equal(workOrder.implementation_controls.coordination_record_only, true);
    assert.equal(workOrder.implementation_controls.source_patch_required, false);
    assert.equal(workOrder.implementation_controls.developer_patch_receipt_required, false);
    assert.ok(
      workOrder.implementation_controls.required_closeout_evidence.includes(
        'target owner receipt projection consumed Agent Lab suite result',
      ),
    );
    assert.ok(workOrder.implementation_controls.forbidden_target_paths_or_surfaces.includes('target quality verdict bodies'));
    assert.ok(workOrder.runtime_consumption_verification.required_surface_refs.includes('target_agent_owner_receipt_contract'));
    assert.ok(workOrder.runtime_consumption_verification.required_surface_refs.includes('target_agent_owner_route'));
    assert.equal(workOrder.version_management.absorb_back_required, false);
    assert.equal(workOrder.version_management.temporary_worktree_cleanup_required, false);
    assert.equal(workOrder.authority_boundary.can_modify_target_agent_source_repo, false);
    assert.equal(workOrder.authority_boundary.can_modify_target_agent_tests, false);
    assert.equal(workOrder.authority_boundary.can_modify_target_agent_docs, false);
    assert.equal(workOrder.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(workOrder.authority_boundary.can_authorize_target_domain_quality_or_export, false);
    assertTargetPatchLoopMachineRefs(workOrder.machine_closeout_refs, {
      blockedSuiteResultRef: workOrder.source_agent_lab_result_ref,
      developerPatchWorkOrderRef: workOrder.work_order_id,
      requiredVerificationRefs: workOrder.required_verification_refs,
    });
    assert.match(workOrder.machine_closeout_refs.patch_absorption_ref, /no-source-patch/);
    assert.match(workOrder.machine_closeout_refs.worktree_cleanup_ref, /no-source-patch/);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('owner-receipt wording in a standard suite stays target-agent generic', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-external-owner-receipt-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'external-agent');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'external-agent',
      domain_label: 'External Agent',
      delivery_domain: 'external_opl_compatible_agent',
    });
    const suitePath = path.join(outputRoot, 'owner-receipt-suite.json');
    writeJson(suitePath, buildPassedGenericOwnerReceiptSuite());
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeOwnerReceiptAiReviewerEvaluation(reviewerEvaluationPath, {
      run_ref: 'run:ai-reviewer/external/owner-receipt',
      critique: 'The owner-receipt coordination record is accepted for the external target agent.',
      suggestions: ['Keep owner-receipt source refs available for external owner projection.'],
      source_refs: ['owner-receipt:external/live-acceptance'],
      verdict: 'accepted_no_patch_required',
      predicted_impact: 'The external owner-receipt projection remains auditable without target source changes.',
    });

    const payload = runImproveArgs([
      '--suite',
      suitePath,
      '--target-agent-dir',
      targetAgentDir,
      '--output-dir',
      outputRoot,
      '--feedback-ref',
      'manual-review:gpt-5.5/external-owner-receipt',
      '--opl-bin',
      oplBin,
      '--ai-reviewer-evaluation',
      reviewerEvaluationPath,
    ]);
    const candidate = payload.learning_loop.target_capability_improvement_candidate;
    assert.equal(payload.target_agent.domain_id, 'external-agent');
    assert.equal(
      candidate.proposed_change_refs.some((ref: string) => ref.includes(':mag/')),
      false,
    );
    assert.equal(
      candidate.proposed_change_refs.some((ref: string) => ref.includes(':med-autogrant/')),
      false,
    );
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('workbench and scaleout contracts expose target patch-loop machine refs only', () => {
  const appProjection = readJson(path.join(repoRoot, 'contracts/app_workbench_projection.json'));
  const scaleoutEvidence = readJson(path.join(repoRoot, 'contracts/real_target_agent_scaleout_evidence.json'));
  const developerWorkOrderSection = (appProjection.workbench_sections as JsonObject[]).find((section) =>
    section.section_id === 'developer_work_order'
  );
  const blockedSuiteEvidenceClass = (scaleoutEvidence.required_evidence_classes as JsonObject[]).find((entry) =>
    entry.evidence_class === 'blocked_suite_to_developer_work_order'
  );

  assert.ok(developerWorkOrderSection);
  assert.ok(blockedSuiteEvidenceClass);
  assert.deepEqual(
    appProjection.drilldown_readiness_receipt.developer_work_order_machine_ref_fields,
    targetPatchLoopMachineRefFields,
  );
  assert.deepEqual(blockedSuiteEvidenceClass.required_refs, targetPatchLoopMachineRefFields);
  targetPatchLoopMachineRefFields.forEach((field) => {
    assert.ok((developerWorkOrderSection.projection_fields as string[]).includes(field));
  });
  assert.ok((developerWorkOrderSection.projection_fields as string[]).includes('substantive_deliverable_delta_refs'));
  assert.ok((developerWorkOrderSection.projection_fields as string[]).includes('platform_interface_repair_refs'));
  assert.ok((developerWorkOrderSection.projection_fields as string[]).includes('deliverable_progress_delta'));
  assert.ok((developerWorkOrderSection.projection_fields as string[]).includes('platform_repair_delta'));
  assert.ok((developerWorkOrderSection.projection_fields as string[]).includes('progress_delta_classification'));
  assert.ok((developerWorkOrderSection.projection_fields as string[]).includes('target_progress_accounting_ref'));
  assert.deepEqual(appProjection.drilldown_readiness_receipt.target_progress_accounting_fields, [
    'deliverable_progress_delta',
    'platform_repair_delta',
    'progress_delta_classification',
    'substantive_deliverable_delta_refs',
    'platform_interface_repair_refs',
    'target_progress_accounting_ref',
  ]);
  assert.equal(appProjection.authority_boundary.refs_only, true);
  assert.equal(scaleoutEvidence.authority_boundary.can_write_target_domain_truth, false);
});

test('external suite improvement fails closed when AI reviewer evaluation is missing', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-external-suite-missing-reviewer-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'med-autoscience',
      domain_label: 'MedAutoScience',
      delivery_domain: 'medical_research',
    });
    writeMedicalTargetImprovementPolicy(targetAgentDir);
    const suitePath = path.join(outputRoot, 'medical-manuscript-quality-suite.json');
    writeJson(suitePath, buildBlockedMedicalManuscriptSuite(suitePath));

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/improve-from-agent-lab-suite.ts'),
        '--suite',
        suitePath,
        '--target-agent-dir',
        targetAgentDir,
        '--output-dir',
        outputRoot,
        '--opl-bin',
        oplBin,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /ai reviewer evaluation/i);
    assert.equal(fs.existsSync(path.join(outputRoot, 'developer-patch-work-order.json')), false);
    assert.equal(fs.existsSync(path.join(outputRoot, 'meta-agent-improvement-receipt.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('external suite improvement fails closed when AI reviewer predicted impact is missing', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-external-suite-missing-impact-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'med-autoscience',
      domain_label: 'MedAutoScience',
      delivery_domain: 'medical_research',
    });
    writeMedicalTargetImprovementPolicy(targetAgentDir);
    const suitePath = path.join(outputRoot, 'medical-manuscript-quality-suite.json');
    writeJson(suitePath, buildBlockedMedicalManuscriptSuite(suitePath));
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeAiReviewerEvaluation(reviewerEvaluationPath, { predicted_impact: '' });

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/improve-from-agent-lab-suite.ts'),
        '--suite',
        suitePath,
        '--target-agent-dir',
        targetAgentDir,
        '--output-dir',
        outputRoot,
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
        '--opl-bin',
        oplBin,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /predicted_impact must be a non-empty string/);
    assert.equal(fs.existsSync(path.join(outputRoot, 'developer-patch-work-order.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('external suite improvement fails closed when reviewer direct evidence is scaffold-only', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-external-suite-scaffold-reviewer-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'med-autoscience',
      domain_label: 'MedAutoScience',
      delivery_domain: 'medical_research',
    });
    writeMedicalTargetImprovementPolicy(targetAgentDir);
    const suitePath = path.join(outputRoot, 'medical-manuscript-quality-suite.json');
    writeJson(suitePath, buildBlockedMedicalManuscriptSuite(suitePath));
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeAiReviewerEvaluation(reviewerEvaluationPath, {
      direct_evidence_refs: ['suite:mas/002/generated-scaffold'],
    });

    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts/improve-from-agent-lab-suite.ts'),
        '--suite',
        suitePath,
        '--target-agent-dir',
        targetAgentDir,
        '--output-dir',
        outputRoot,
        '--ai-reviewer-evaluation',
        reviewerEvaluationPath,
        '--opl-bin',
        oplBin,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /direct_evidence_refs must include direct evidence beyond suite\/scaffold refs/);
    assert.equal(fs.existsSync(path.join(outputRoot, 'developer-patch-work-order.json')), false);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});
