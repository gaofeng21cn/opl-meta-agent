import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { JsonObject } from './support/contracts.ts';
import {
  oplBin,
  writeJsonFile as writeJson,
  readJsonFile as readJson,
} from './support/contracts.ts';
import test from 'node:test';
import {
  runImproveArgs,
  assertTargetPatchLoopMachineRefs,
  writeOwnerReceiptAiReviewerEvaluation,
  buildPassedTargetAgentOwnerReceiptSuite,
  buildPassedGenericOwnerReceiptSuite,
} from './support/external-suite-fixtures.ts';

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
    assert.deepEqual(candidate.proposed_change_refs, []);
    assert.deepEqual(candidate.target_editable_surface_refs, []);
    assert.equal(candidate.ai_reviewer_review.critique, reviewerEvaluation.critique);
    assert.equal(candidate.ai_reviewer_independence.no_shared_context, true);
    assert.equal(path.basename(payload.artifacts.target_capability_improvement_candidate_path), 'target-capability-improvement-candidate.json');
    const candidateFromFile = readJson(payload.artifacts.target_capability_improvement_candidate_path);
    assert.equal(candidateFromFile.candidate_id, candidate.candidate_id);
    assert.deepEqual(candidate.patch_traceability_matrix as JsonObject[], []);

    const mechanism = readJson(payload.artifacts.mechanism_patch_proposal_path);
    assert.deepEqual(mechanism.editable_surfaces, []);
    assert.equal(mechanism.authority_boundary.can_authorize_target_domain_quality_or_export, false);

    const workOrder = readJson(payload.artifacts.developer_patch_work_order_path);
    assert.equal(workOrder.status, 'no_patch_required');
    assert.equal(workOrder.target_progress_accounting.progress_delta_classification, 'platform_repair');
    assert.equal(workOrder.target_progress_accounting.deliverable_progress_delta.domain_alias, 'target_agent_substantive_delta');
    assert.equal(workOrder.target_progress_accounting.deliverable_progress_delta.count, 0);
    assert.equal(workOrder.target_progress_accounting.platform_repair_delta.domain_alias, 'platform_interface_repair_delta');
    assert.equal(Object.hasOwn(workOrder.target_progress_accounting, 'substantive_deliverable_delta_refs'), false);
    assert.equal(Object.hasOwn(workOrder.target_progress_accounting, 'platform_interface_repair_refs'), false);
    assert.ok((workOrder.target_progress_accounting.platform_repair_delta.refs as string[]).includes(
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
