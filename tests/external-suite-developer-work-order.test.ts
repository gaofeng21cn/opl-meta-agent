import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import type { JsonObject } from './support/contracts.ts';
import { readJsonFile as readJson, writeJsonFile as writeJson } from './support/contracts.ts';
import {
  buildExternalSuite,
  runImproveFromSuite,
  withOutputRoot,
  writeAiReviewerEvaluation,
  writeTargetDescriptor,
  writeTargetImprovementPolicy,
} from './support/external-suite-fixtures.ts';

const medicalPolicy = {
  triggers: ['medical manuscript', 'reviewer revision'],
  refs: ['quality_contract_ref:prediction_model_first_draft_quality'],
  paths: ['src/med_autoscience/policies/medical_reporting_checklist.py'],
  mappings: [
    { token: 'hdl', refs: ['quality_contract_ref:mas/prediction_model_first_draft_quality/variable_unit_harmonization'] },
    { token: 'reviewer revision', refs: ['quality_contract_ref:prediction_model_first_draft_quality'] },
  ],
};

test('external blocked Agent Lab suite becomes a MAS developer patch work order', () => {
  withOutputRoot('oma-medical-suite-', (outputRoot) => {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    const suitePath = path.join(outputRoot, 'suite.json');
    const reviewerEvaluationPath = path.join(outputRoot, 'reviewer.json');
    writeTargetDescriptor(targetAgentDir);
    writeTargetImprovementPolicy(targetAgentDir, medicalPolicy);
    writeJson(suitePath, buildExternalSuite({
      suiteId: 'mas-suite:high-quality-medical-manuscript',
      domainId: 'med-autoscience',
      taskFamily: 'high_quality_medical_manuscript_self_evolution',
      evidenceRefs: [
        'rubric-gap:mas/002/hdl-harmonization',
        'rubric-gap:mas/002/internal-quality-language-purge',
      ],
      feedbackRefs: ['feedback-ref:mas/002/manuscript-review'],
    }));
    writeAiReviewerEvaluation(reviewerEvaluationPath);

    const payload = runImproveFromSuite({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath });
    assert.equal(payload.status, 'blocked_with_developer_patch_work_order');
    const workOrder = readJson(payload.artifacts.developer_patch_work_order_path);
    assert.equal(workOrder.status, 'ready_for_target_agent_source_patch');
    assert.equal(workOrder.target_agent.domain_id, 'med-autoscience');
    const hdlTrace = (workOrder.patch_traceability_matrix as JsonObject[])
      .find((entry) => entry.gap_token === 'hdl');
    assert.ok(hdlTrace);
    assert.deepEqual(hdlTrace.required_patch_refs, [
      'quality_contract_ref:mas/prediction_model_first_draft_quality/variable_unit_harmonization',
    ]);
    assert.deepEqual(hdlTrace.target_repo_file_hints, medicalPolicy.paths);
    assert.equal(workOrder.authority_boundary.can_write_target_domain_truth, false);
  });
});

test('generic target-agent feedback external suite is accepted without MAS-only profiles', () => {
  withOutputRoot('oma-generic-feedback-', (outputRoot) => {
    const targetAgentDir = path.join(outputRoot, 'target-agent');
    const suitePath = path.join(outputRoot, 'suite.json');
    const reviewerEvaluationPath = path.join(outputRoot, 'reviewer.json');
    const directReview = 'feedback-evidence:target-agent/artifact-morphology/direct-review';
    writeTargetDescriptor(targetAgentDir, 'target-agent');
    writeTargetImprovementPolicy(targetAgentDir, {
      triggers: ['artifact morphology'],
      refs: ['target_agent_contract_ref:target-agent/artifact-morphology'],
      paths: ['contracts/artifact_morphology.json'],
    });
    writeJson(suitePath, buildExternalSuite({
      suiteId: 'target-agent-feedback-suite:artifact-morphology',
      domainId: 'target-agent',
      taskFamily: 'target_agent_feedback_self_evolution',
      evidenceRefs: ['rubric-gap:target-agent/artifact-morphology'],
      feedbackRefs: ['feedback-ref:target-agent/artifact-morphology/foundry-review'],
      reviewerEvidenceRefs: [directReview],
    }));
    writeAiReviewerEvaluation(reviewerEvaluationPath, {
      source_refs: ['rubric-gap:target-agent/artifact-morphology'],
      direct_evidence_refs: [directReview],
    });

    const payload = runImproveFromSuite({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath });
    const workOrder = readJson(payload.artifacts.developer_patch_work_order_path);
    assert.equal(payload.status, 'blocked_with_developer_patch_work_order');
    assert.equal(workOrder.target_agent.domain_id, 'target-agent');
    assert.deepEqual(workOrder.source_external_suite_intake.accepted_input_profiles, [
      'target_agent_feedback_external_suite',
    ]);
    assert.ok(workOrder.source_external_suite_intake.source_feedback_refs.includes(directReview));
  });
});

test('MAS reviewer_revision feedback external suite is accepted as developer work-order input', () => {
  withOutputRoot('oma-reviewer-revision-', (outputRoot) => {
    const targetAgentDir = path.join(outputRoot, 'med-autoscience');
    const suitePath = path.join(outputRoot, 'suite.json');
    const reviewerEvaluationPath = path.join(outputRoot, 'reviewer.json');
    const reviewerEvidence = 'reviewer-evidence:mas/002/reviewer_revision/response-matrix';
    writeTargetDescriptor(targetAgentDir);
    writeTargetImprovementPolicy(targetAgentDir, medicalPolicy);
    writeJson(suitePath, buildExternalSuite({
      suiteId: 'mas-suite:reviewer_revision-feedback',
      domainId: 'med-autoscience',
      taskFamily: 'reviewer_revision_feedback_self_evolution',
      evidenceRefs: ['rubric-gap:mas/002/internal-quality-language-purge'],
      feedbackRefs: ['feedback-ref:mas/002/reviewer_revision/mentor-round-1'],
      reviewerEvidenceRefs: [reviewerEvidence],
    }));
    writeAiReviewerEvaluation(reviewerEvaluationPath, {
      source_refs: [reviewerEvidence, 'rubric-gap:mas/002/internal-quality-language-purge'],
      direct_evidence_refs: ['paper/evidence_ledger.json'],
    });

    const payload = runImproveFromSuite({ suitePath, targetAgentDir, outputRoot, reviewerEvaluationPath });
    const workOrder = readJson(payload.artifacts.developer_patch_work_order_path);
    assert.deepEqual(workOrder.source_external_suite_intake.accepted_input_profiles, [
      'target_agent_feedback_external_suite',
      'mas_feedback_agent_lab_external_suite',
      'reviewer_revision_feedback',
    ]);
    assert.deepEqual(workOrder.source_external_suite_intake.task_families, [
      'reviewer_revision_feedback_self_evolution',
    ]);
    assert.ok(workOrder.reviewer_evidence_refs.includes(reviewerEvidence));
  });
});
