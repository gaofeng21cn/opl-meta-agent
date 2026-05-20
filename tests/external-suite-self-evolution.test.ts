import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const oplBin = process.env.OPL_BIN
  ?? '/Users/gaofeng/workspace/one-person-lab/bin/opl';

function writeJson(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function readJson(filePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeAiReviewerEvaluation(filePath: string, overrides: JsonObject = {}): JsonObject {
  const evaluation = {
    reviewer_kind: 'ai_reviewer',
    model_or_provider: 'gpt-5.5',
    run_ref: 'run:ai-reviewer/mas/002/high-quality-medical-manuscript',
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
    verdict: 'blocked_requires_developer_patch',
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
    verdict: 'accepted_no_patch_required',
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
        '--feedback-ref',
        'manual-review:gpt-5.5/high-quality-medical-paper-style',
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

    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout) as JsonObject;
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

    const mechanism = readJson(payload.artifacts.mechanism_patch_proposal_path);
    assert.equal(mechanism.surface_kind, 'opl_meta_agent_mechanism_patch_proposal');
    assert.equal(mechanism.authority_boundary.can_mutate_target_domain_artifact_body, false);
    assert.ok(mechanism.editable_surfaces.includes('target_agent_stage_policy_ref'));
    assert.ok(mechanism.edit.proposed_change_refs.includes('quality_contract_ref:prediction_model_first_draft_quality'));
    assert.ok(mechanism.observe.source_refs.includes(reviewerEvaluationPath));
    assert.ok(mechanism.diagnose.source_refs.includes('artifacts/publication_eval/latest.json'));

    const receipt = readJson(payload.artifacts.meta_agent_improvement_receipt_path);
    assert.equal(receipt.receipt_class, 'external_suite_quality_failure_self_evolution_receipt');
    assert.equal(receipt.acceptance_gates.target_domain_truth_authority_preserved, true);
    assert.equal(receipt.acceptance_gates.ai_reviewer_critique_present, true);
    assert.equal(receipt.acceptance_gates.ai_reviewer_suggestions_present, true);
    assert.equal(receipt.acceptance_gates.ai_reviewer_source_refs_valid, true);

    const workOrder = readJson(payload.artifacts.developer_patch_work_order_path);
    assert.equal(workOrder.surface_kind, 'opl_meta_agent_developer_patch_work_order');
    assert.equal(workOrder.status, 'ready_for_target_agent_source_patch');
    assert.equal(workOrder.ai_reviewer_evaluation_ref, reviewerEvaluationPath);
    assert.deepEqual(workOrder.ai_reviewer_review.suggestions, reviewerEvaluation.suggestions);
    assert.equal(workOrder.version_management.absorb_back_required, true);
    assert.equal(workOrder.version_management.temporary_worktree_cleanup_required, true);
    assert.equal(workOrder.authority_boundary.can_modify_target_agent_source_repo, true);
    assert.equal(workOrder.authority_boundary.can_write_target_domain_truth, false);
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
        '--feedback-ref',
        'manual-review:gpt-5.5/target-agent-owner-receipt',
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

    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout) as JsonObject;
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
    assert.deepEqual(workOrder.required_patch_surfaces, []);
    assert.deepEqual(workOrder.patch_traceability_matrix, []);
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
    });

    const result = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        path.join(repoRoot, 'scripts/improve-from-agent-lab-suite.ts'),
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
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      },
    );

    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout) as JsonObject;
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
