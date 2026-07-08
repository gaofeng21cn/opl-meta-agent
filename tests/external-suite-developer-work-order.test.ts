import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import type { JsonObject } from './support/contracts.ts';
import {
  oplBin,
  repoRoot,
  writeJsonFile as writeJson,
  readJsonFile as readJson,
} from './support/contracts.ts';
import test from 'node:test';
import {
  runImproveArgs,
  writeAiReviewerEvaluation,
  buildBlockedMedicalManuscriptSuite,
  buildReviewerRevisionFeedbackSuite,
  writeMedicalTargetImprovementPolicy,
} from './support/external-suite-fixtures.ts';

function executeWorkOrderExpectingValidationError(workOrder: JsonObject, outputRoot: string): string {
  const workOrderPath = path.join(outputRoot, `invalid-${String(workOrder.work_order_id)}.json`);
  writeJson(workOrderPath, workOrder);
  const result = spawnSync(
    'npm',
    [
      'run',
      'execute:external-work-order',
      '--',
      '--work-order',
      workOrderPath,
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
  return `${result.stderr}\n${result.stdout}`;
}

function writeGenericFeedbackTargetImprovementPolicy(targetAgentDir: string): void {
  writeJson(path.join(targetAgentDir, 'contracts/production_acceptance/meta-agent-work-order-contract.json'), {
    surface_kind: 'target_owned_explicit_improvement_policy',
    owner: 'target-agent',
    meta_agent_work_order_contract: {
      default_change_ref_triggers: ['artifact-morphology'],
      default_change_refs: [
        'target_agent_contract_ref:target-agent/artifact-morphology',
        'target_agent_regression_suite_ref:target-agent/artifact-morphology',
      ],
      capability_id: 'target-agent.artifact-morphology',
      canonical_paths: [
        'contracts/artifact_morphology.json',
        'tests/artifact-morphology.test.ts',
      ],
      verification_refs: ['target_repo_test_receipt'],
      forbidden_target_paths_or_surfaces: [
        'target truth',
        'target owner receipt body',
        'target quality verdict',
      ],
      authority_boundary: {
        can_write_target_owner_receipt_body: false,
      },
      change_ref_mappings: [
        {
          token: 'artifact-morphology',
          refs: [
            'target_agent_contract_ref:target-agent/artifact-morphology',
            'target_agent_regression_suite_ref:target-agent/artifact-morphology',
          ],
        },
      ],
      patch_surface_hints: {
        target_agent_contract_ref: ['contracts/artifact_morphology.json'],
        target_agent_regression_suite_ref: ['tests/artifact-morphology.test.ts'],
      },
    },
  });
  writeJson(path.join(targetAgentDir, 'contracts/agent_lab_handoff.json'), {
    surface_kind: 'domain_agent_lab_feedback_evidence_handoff',
    domain_id: 'target-agent',
    owner: 'target-agent',
    handoff_status: 'ready_for_opl_meta_agent_feedback_work_order',
    external_suite_improvement_policy: {
      forbidden_target_paths_or_surfaces: [
        'target truth',
        'target owner receipt body',
        'target quality verdict',
      ],
      runtime_required_surface_refs: [
        'target_agent_owner_route',
        'target_agent_feedback_projection',
      ],
      runtime_expected_outcomes: [
        'target owner can consume feedback evidence refs without OMA writing target truth',
      ],
    },
  });
}

function buildBlockedGenericFeedbackSuite(suitePath: string): JsonObject {
  const suite = buildBlockedMedicalManuscriptSuite(suitePath);
  suite.suite_id = 'target-agent-feedback-suite:artifact-morphology';
  const task = (suite.tasks as JsonObject[])[0];
  task.task_id = 'agent-lab-task:target-agent/artifact-morphology-feedback';
  task.domain_id = 'target-agent';
  task.task_family = 'target_agent_feedback_self_evolution';
  task.instructions_ref = 'instructions:target-agent/artifact-morphology-feedback';
  task.agent_entry_ref = 'domain-agent-entry:target-agent';
  task.feedback_refs = ['feedback-ref:target-agent/artifact-morphology/foundry-review'];
  task.reviewer_evidence_refs = ['feedback-evidence:target-agent/artifact-morphology/direct-review'];
  task.stage_refs = ['stage:target-agent/artifact-morphology'];
  task.oracle_refs = ['oracle:target-agent/feedback-boundary'];
  task.scorer_refs = ['scorer:target-agent/artifact-morphology-feedback'];
  (task.environment as JsonObject).workspace_locator_ref = 'workspace-locator:target-agent/artifact-morphology';
  task.trajectory = {
    trajectory_ref: 'trajectory:target-agent/artifact-morphology-feedback',
    run_ref: 'run:target-agent/artifact-morphology-feedback',
    agent_executor: 'codex_cli',
    stage_attempt_refs: ['stage-attempt:target-agent/artifact-morphology-feedback'],
    tool_call_refs: ['tool-call:target-agent/feedback-read'],
    artifact_refs: ['feedback-evidence:target-agent/artifact-morphology/direct-review'],
    receipt_refs: ['feedback-ref:target-agent/artifact-morphology/foundry-review'],
    repair_refs: ['rubric-gap:target-agent/artifact-morphology'],
    trace_refs: ['trace-ref:agent-lab/target-agent-feedback'],
  };
  task.scorecard = {
    scorecard_ref: 'quality-scorecard:target-agent/artifact-morphology-feedback',
    domain_owned: true,
    opl_scorecard_role: 'scorecard_ref_projection_only',
    passed: false,
    metric_refs: ['metric-ref:target-agent/artifact-morphology'],
    evidence_refs: ['feedback-evidence:target-agent/artifact-morphology/direct-review'],
    review_refs: ['feedback-ref:target-agent/artifact-morphology/foundry-review'],
    quality_gate_refs: ['quality-gate:target-agent/owner'],
  };
  task.improvement_candidate = {
    candidate_ref: 'improvement-candidate:target-agent/artifact-morphology',
    candidate_kind: 'feedback_gap',
    target_ref: 'rubric-gap-ref:target-agent/artifact-morphology',
    evidence_refs: ['rubric-gap:target-agent/artifact-morphology'],
    allowed_change_scope: 'branch_only',
    promotion_gate_ref: 'promotion-gate:target-agent/artifact-morphology-feedback',
  };
  task.promotion_gate = {
    gate_ref: 'promotion-gate:target-agent/artifact-morphology-feedback',
    gate_status: 'blocked',
    required_refs: ['quality-scorecard:target-agent/artifact-morphology-feedback'],
    regression_suite_refs: ['regression-suite:target-agent/artifact-morphology'],
    no_forbidden_write_proof_refs: ['no-forbidden-write:target-agent/feedback-suite'],
  };
  return suite;
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
    assert.equal(payload.status, 'blocked_with_developer_patch_work_order');
    assert.equal(payload.target_agent.domain_id, 'med-autoscience');
    assert.equal(payload.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(payload.authority_boundary.can_authorize_target_domain_quality_or_export, false);

    const candidate = payload.learning_loop.target_capability_improvement_candidate;
    assert.equal(candidate.status, 'candidate_recorded_requires_target_owner_gate');
    assert.ok(candidate.proposed_change_refs.includes('quality_contract_ref:prediction_model_first_draft_quality'));
    assert.ok(
      candidate.proposed_change_refs.includes(
        'quality_contract_ref:mas/prediction_model_first_draft_quality/variable_unit_harmonization',
      ),
    );
    assert.ok(candidate.external_learning_refs.includes('external-source:equator-network/tripod-reporting-guideline'));
    assert.equal(candidate.traceability_status, 'gap_to_patch_refs_mapped');
    assert.ok(
      (candidate.patch_traceability_matrix as JsonObject[]).some((item) =>
        item.gap_token === 'hdl'
        && item.required_patch_refs.includes(
          'quality_contract_ref:mas/prediction_model_first_draft_quality/variable_unit_harmonization',
        )
        && item.target_repo_file_hints.includes('src/med_autoscience/policies/medical_reporting_checklist.py')
      ),
    );

    const workOrder = readJson(payload.artifacts.developer_patch_work_order_path);
    assert.equal(workOrder.surface_kind, 'opl_meta_agent_developer_patch_work_order');
    assert.equal(workOrder.status, 'ready_for_target_agent_source_patch');
    assert.equal(workOrder.source_morphology_proof.consumed_as_refs_only, true);
    assert.equal(workOrder.private_residue_decision.target_truth_write_authorized, false);
    assert.equal(workOrder.target_owner_route.owner_route_ref, 'target-agent-owner:med-autoscience');
    assert.ok(
      workOrder.source_external_suite_intake.accepted_input_profiles.includes(
        'mas_feedback_agent_lab_external_suite',
      ),
    );
    assert.ok(
      workOrder.source_external_suite_intake.accepted_input_profiles.includes(
        'high_quality_medical_manuscript_feedback',
      ),
    );
    assert.equal(workOrder.source_external_suite_intake.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(workOrder.opl_work_order_delegation_aperture.delegates_to_opl_work_order_execute, true);
    assert.equal(workOrder.target_progress_accounting.progress_delta_classification, 'mixed');
    assert.ok(workOrder.allowed_editable_surfaces.includes('quality_contract_ref'));
    assert.ok(workOrder.required_verification_refs.includes('target_repo_test_receipt'));
    assert.ok(workOrder.owner_route_refs.includes('target-agent-owner:med-autoscience'));
    assert.equal(workOrder.required_opl_work_order_primitive_refs.consumed_as_refs_only_by_oma, true);
    assert.equal(workOrder.no_forbidden_write_proof.can_write_target_domain_truth, false);
    assert.equal(workOrder.work_order_completeness.required_fields_present, true);
    assert.equal(workOrder.work_order_completeness.patch_traceability.traceability_status, 'gap_to_patch_refs_mapped');
    assert.equal(workOrder.work_order_completeness.no_forbidden_write_proof.can_write_target_domain_truth, false);
    assert.equal(workOrder.version_management.absorb_back_required, true);
    assert.equal(workOrder.authority_boundary.can_modify_target_agent_source_repo, true);
    assert.equal(workOrder.authority_boundary.can_write_target_domain_truth, false);
    assert.ok(
      (workOrder.patch_traceability_matrix as JsonObject[]).some((item) => item.gap_token === 'internal-quality-language-purge'),
    );
    assert.equal(workOrder.target_workspace_environment_verification.can_write_target_domain_truth, false);

    const missingSourceMorphology = structuredClone(workOrder);
    delete missingSourceMorphology.source_morphology_proof_ref;
    delete missingSourceMorphology.source_morphology_proof;
    assert.match(
      executeWorkOrderExpectingValidationError(missingSourceMorphology, outputRoot),
      /source_morphology_proof or source_morphology_proof_ref is required by OPL work-order execute guard/,
    );

    const missingPrivateResidueDecision = structuredClone(workOrder);
    delete missingPrivateResidueDecision.private_residue_decision_ref;
    delete missingPrivateResidueDecision.private_residue_decision;
    assert.match(
      executeWorkOrderExpectingValidationError(missingPrivateResidueDecision, outputRoot),
      /private_residue_decision_ref/,
    );
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('generic target-agent feedback external suite is accepted without MAS-only profiles', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-generic-feedback-suite-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'target-agent');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'target-agent',
      domain_label: 'Target Agent',
      delivery_domain: 'opl_compatible_target_agent',
    });
    writeGenericFeedbackTargetImprovementPolicy(targetAgentDir);
    const suitePath = path.join(outputRoot, 'generic-feedback-suite.json');
    writeJson(suitePath, buildBlockedGenericFeedbackSuite(suitePath));
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeAiReviewerEvaluation(reviewerEvaluationPath, {
      run_ref: 'run:ai-reviewer/target-agent/artifact-morphology-feedback',
      execution_attempt_ref: 'attempt:executor/target-agent/artifact-morphology-feedback',
      review_attempt_ref: 'attempt:ai-reviewer/target-agent/artifact-morphology-feedback',
      critique: 'The target agent feedback shows an artifact-morphology gap in the generated package.',
      suggestions: ['Patch the artifact-morphology contract and regression suite.'],
      source_refs: [
        'feedback-ref:target-agent/artifact-morphology/foundry-review',
        'rubric-gap:target-agent/artifact-morphology',
      ],
      direct_evidence_refs: [
        'feedback-evidence:target-agent/artifact-morphology/direct-review',
      ],
      predicted_impact: 'The patch should make target-agent artifact morphology auditable without OMA owning target truth.',
      canary_refs: ['canary:target-agent/artifact-morphology-feedback'],
      rollback_refs: ['rollback:target-agent/pre-artifact-morphology-feedback'],
      version_refs: ['version:target-agent/current-head'],
    });

    const payload = runImproveArgs([
      '--suite',
      suitePath,
      '--target-agent-dir',
      targetAgentDir,
      '--output-dir',
      outputRoot,
      '--feedback-ref',
      'feedback-ref:target-agent/artifact-morphology/foundry-review',
      '--ai-reviewer-evaluation',
      reviewerEvaluationPath,
      '--opl-bin',
      oplBin,
    ]);

    assert.equal(payload.status, 'blocked_with_developer_patch_work_order');
    const workOrder = readJson(payload.artifacts.developer_patch_work_order_path);
    const profiles = workOrder.source_external_suite_intake.accepted_input_profiles as string[];
    assert.ok(profiles.includes('target_agent_feedback_external_suite'));
    assert.equal(profiles.includes('mas_feedback_agent_lab_external_suite'), false);
    assert.equal(profiles.includes('high_quality_medical_manuscript_feedback'), false);
    assert.equal(profiles.includes('reviewer_revision_feedback'), false);
    assert.equal(workOrder.target_agent.domain_id, 'target-agent');
    assert.ok(
      workOrder.source_external_suite_intake.source_feedback_refs.includes(
        'feedback-evidence:target-agent/artifact-morphology/direct-review',
      ),
    );
    assert.equal(workOrder.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(workOrder.opl_work_order_delegation_aperture.delegates_to_opl_work_order_execute, true);
    assert.equal(workOrder.target_progress_accounting.progress_delta_classification, 'mixed');

    const missingFeedback = structuredClone(workOrder);
    missingFeedback.source_external_suite_intake.feedback_ref = null;
    missingFeedback.source_external_suite_intake.source_feedback_refs = [];
    assert.match(
      executeWorkOrderExpectingValidationError(missingFeedback, outputRoot),
      /source_external_suite_intake requires feedback_ref or source_feedback_refs/,
    );

    const missingDirectReviewerEvidence = structuredClone(workOrder);
    missingDirectReviewerEvidence.ai_reviewer_evidence.direct_evidence_refs = [];
    assert.match(
      executeWorkOrderExpectingValidationError(missingDirectReviewerEvidence, outputRoot),
      /ai_reviewer_evidence\.direct_evidence_refs must be a non-empty string array/,
    );
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('MAS reviewer_revision feedback external suite is accepted as developer work-order input', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'opl-meta-agent-reviewer-revision-suite-'));
  try {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: 'med-autoscience',
      domain_label: 'MedAutoScience',
      delivery_domain: 'medical_research',
    });
    writeMedicalTargetImprovementPolicy(targetAgentDir);
    const suitePath = path.join(outputRoot, 'reviewer-revision-feedback-suite.json');
    writeJson(suitePath, buildReviewerRevisionFeedbackSuite(suitePath));
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    writeAiReviewerEvaluation(reviewerEvaluationPath, {
      run_ref: 'run:ai-reviewer/mas/002/reviewer_revision-feedback',
      execution_attempt_ref: 'attempt:executor/mas/002/reviewer_revision-feedback',
      review_attempt_ref: 'attempt:ai-reviewer/mas/002/reviewer_revision-feedback',
      source_refs: [
        'paper/review/reviewer_revision_ledger.json',
        'reviewer-evidence:mas/002/reviewer_revision/response-matrix',
        'rubric-gap:mas/002/internal-quality-language-purge',
      ],
      direct_evidence_refs: [
        'reviewer-evidence:mas/002/reviewer_revision/methods-completeness',
        'paper/evidence_ledger.json',
      ],
    });

    const payload = runImproveArgs([
      '--suite',
      suitePath,
      '--target-agent-dir',
      targetAgentDir,
      '--output-dir',
      outputRoot,
      '--feedback-ref',
      'feedback-ref:mas/002/reviewer_revision/mentor-round-1',
      '--ai-reviewer-evaluation',
      reviewerEvaluationPath,
      '--opl-bin',
      oplBin,
    ]);

    assert.equal(payload.status, 'blocked_with_developer_patch_work_order');
    const workOrder = readJson(payload.artifacts.developer_patch_work_order_path);
    assert.equal(workOrder.target_agent.domain_id, 'med-autoscience');
    assert.equal(workOrder.source_agent_lab_result_ref, workOrder.work_order_currentness.eval_result_ref);
    assert.ok(
      workOrder.source_external_suite_intake.accepted_input_profiles.includes(
        'mas_feedback_agent_lab_external_suite',
      ),
    );
    assert.ok(
      workOrder.source_external_suite_intake.accepted_input_profiles.includes('reviewer_revision_feedback'),
    );
    assert.ok(workOrder.source_external_suite_intake.task_families.includes('reviewer_revision_feedback_self_evolution'));
    assert.ok(workOrder.reviewer_evidence_refs.includes('reviewer-evidence:mas/002/reviewer_revision/response-matrix'));
    assert.ok(workOrder.reviewer_evidence_refs.includes('paper/review/reviewer_revision_ledger.json'));
    assert.equal(workOrder.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(workOrder.authority_boundary.can_authorize_target_domain_quality_or_export, false);
    assert.equal(workOrder.opl_work_order_delegation_aperture.delegates_to_opl_work_order_execute, true);
    assert.equal(workOrder.target_progress_accounting.progress_delta_classification, 'mixed');
    assert.ok(
      workOrder.target_progress_accounting.platform_repair_delta.refs.includes(
        workOrder.machine_closeout_refs.agent_lab_re_evaluation_ref,
      ),
    );
    const missingMasSpecializedProfile = structuredClone(workOrder);
    missingMasSpecializedProfile.source_external_suite_intake.accepted_input_profiles = [
      'target_agent_feedback_external_suite',
      'mas_feedback_agent_lab_external_suite',
    ];
    assert.match(
      executeWorkOrderExpectingValidationError(missingMasSpecializedProfile, outputRoot),
      /MAS feedback external suites must name high-quality manuscript or reviewer revision feedback profile/,
    );
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});
