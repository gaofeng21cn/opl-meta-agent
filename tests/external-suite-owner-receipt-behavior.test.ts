import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  oplBin,
  writeJsonFile as writeJson,
  readJsonFile as readJson,
} from './support/contracts.ts';
import test from 'node:test';
import {
  runImproveArgs,
  writeOwnerReceiptAiReviewerEvaluation,
  buildPassedTargetAgentOwnerReceiptSuite,
  buildPassedGenericOwnerReceiptSuite,
} from './support/external-suite-fixtures.ts';

function withTargetDescriptor(
  prefix: string,
  domainId: string,
  run: (fixture: { outputRoot: string; targetAgentDir: string; reviewerEvaluationPath: string; suitePath: string }) => void,
): void {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  try {
    const targetAgentDir = path.join(outputRoot, domainId);
    writeJson(path.join(targetAgentDir, 'contracts/domain_descriptor.json'), {
      domain_id: domainId,
      domain_label: domainId === 'target-agent' ? 'Target Agent' : 'External Agent',
      delivery_domain: domainId === 'target-agent' ? 'opl_compatible_target_agent' : 'external_opl_compatible_agent',
    });
    const reviewerEvaluationPath = path.join(outputRoot, 'ai-reviewer-evaluation.json');
    const suitePath = path.join(outputRoot, 'owner-receipt-suite.json');
    run({ outputRoot, targetAgentDir, reviewerEvaluationPath, suitePath });
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
}

test('target-agent owner receipt suite becomes a no-patch coordination record', () => {
  withTargetDescriptor('opl-meta-agent-target-owner-receipt-', 'target-agent', (fixture) => {
    writeJson(fixture.suitePath, buildPassedTargetAgentOwnerReceiptSuite());
    const reviewerEvaluation = writeOwnerReceiptAiReviewerEvaluation(fixture.reviewerEvaluationPath);

    const payload = runImproveArgs([
      '--suite',
      fixture.suitePath,
      '--target-agent-dir',
      fixture.targetAgentDir,
      '--output-dir',
      fixture.outputRoot,
      '--feedback-ref',
      'manual-review:gpt-5.5/target-agent-owner-receipt',
      '--ai-reviewer-evaluation',
      fixture.reviewerEvaluationPath,
      '--opl-bin',
      oplBin,
    ]);

    assert.equal(payload.status, 'passed');
    assert.equal(payload.target_agent.domain_id, 'target-agent');
    assert.equal(payload.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(payload.authority_boundary.can_authorize_target_domain_quality_or_export, false);

    const candidate = payload.learning_loop.target_capability_improvement_candidate;
    assert.equal(candidate.status, 'candidate_recorded_requires_target_owner_gate');
    assert.deepEqual(candidate.proposed_change_refs, []);
    assert.deepEqual(candidate.target_editable_surface_refs, []);
    assert.equal(candidate.ai_reviewer_review.critique, reviewerEvaluation.critique);
    assert.deepEqual(candidate.patch_traceability_matrix, []);

    const mechanism = readJson(payload.artifacts.mechanism_patch_proposal_path);
    assert.deepEqual(mechanism.editable_surfaces, []);
    assert.equal(mechanism.authority_boundary.can_authorize_target_domain_quality_or_export, false);

    const workOrder = readJson(payload.artifacts.developer_patch_work_order_path);
    assert.equal(workOrder.status, 'no_patch_required');
    assert.equal(workOrder.target_progress_accounting.progress_delta_classification, 'platform_repair');
    assert.equal(workOrder.target_progress_accounting.deliverable_progress_delta.count, 0);
    assert.ok(workOrder.target_progress_accounting.platform_repair_delta.refs.includes(
      workOrder.machine_closeout_refs.agent_lab_re_evaluation_ref,
    ));
    assert.deepEqual(workOrder.required_patch_surfaces, []);
    assert.deepEqual(workOrder.allowed_editable_surfaces, []);
    assert.ok(workOrder.required_verification_refs.includes('target_owner_receipt_projection_ref'));
    assert.equal(workOrder.required_opl_work_order_primitive_refs.consumed_as_refs_only_by_oma, true);
    assert.match(workOrder.required_opl_work_order_primitive_refs.work_order_readiness_primitive_ref, /\/no-source-patch$/);
    assert.equal(workOrder.work_order_completeness.executor_aperture.allowed_scope, 'coordination_record_only');
    assert.deepEqual(workOrder.work_order_completeness.executor_aperture.allowed_write_surfaces, []);
    assert.equal(workOrder.implementation_controls.coordination_record_only, true);
    assert.equal(workOrder.implementation_controls.source_patch_required, false);
    assert.equal(workOrder.version_management.absorb_back_required, false);
    assert.equal(workOrder.authority_boundary.can_modify_target_agent_source_repo, false);
    assert.equal(workOrder.authority_boundary.can_write_target_domain_truth, false);
    assert.equal(workOrder.authority_boundary.can_authorize_target_domain_quality_or_export, false);
    assert.match(workOrder.machine_closeout_refs.patch_absorption_ref, /no-source-patch/);
    assert.match(workOrder.machine_closeout_refs.worktree_cleanup_ref, /no-source-patch/);
  });
});

test('owner-receipt wording in a standard suite stays target-agent generic', () => {
  withTargetDescriptor('opl-meta-agent-external-owner-receipt-', 'external-agent', (fixture) => {
    writeJson(fixture.suitePath, buildPassedGenericOwnerReceiptSuite());
    writeOwnerReceiptAiReviewerEvaluation(fixture.reviewerEvaluationPath, {
      run_ref: 'run:ai-reviewer/external/owner-receipt',
      critique: 'The owner-receipt coordination record is accepted for the external target agent.',
      suggestions: ['Keep owner-receipt source refs available for external owner projection.'],
      source_refs: ['owner-receipt:external/live-acceptance'],
      verdict: 'accepted_no_patch_required',
      predicted_impact: 'The external owner-receipt projection remains auditable without target source changes.',
    });

    const payload = runImproveArgs([
      '--suite',
      fixture.suitePath,
      '--target-agent-dir',
      fixture.targetAgentDir,
      '--output-dir',
      fixture.outputRoot,
      '--feedback-ref',
      'manual-review:gpt-5.5/external-owner-receipt',
      '--opl-bin',
      oplBin,
      '--ai-reviewer-evaluation',
      fixture.reviewerEvaluationPath,
    ]);
    const candidate = payload.learning_loop.target_capability_improvement_candidate;
    assert.equal(payload.target_agent.domain_id, 'external-agent');
    assert.equal(candidate.proposed_change_refs.some((ref: string) => ref.includes(':mag/')), false);
    assert.equal(candidate.proposed_change_refs.some((ref: string) => ref.includes(':med-autogrant/')), false);
  });
});
