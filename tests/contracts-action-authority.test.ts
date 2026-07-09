import assert from 'node:assert/strict';
import test from 'node:test';
import {
  asObjects,
  asStrings,
  readJson,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';

function actionById(actions: JsonObject[], actionId: string): JsonObject {
  const action = actions.find((candidate) => candidate.action_id === actionId);
  assert.ok(action, `${actionId} should exist`);
  return action;
}

function assertIncludesAll(actual: unknown, expected: string[], label: string): void {
  const values = asStrings(actual);
  expected.forEach((value) => assert.ok(values.includes(value), `${label} should include ${value}`));
}

function assertFalseFlags(surface: JsonObject, fields: string[], label: string): void {
  fields.forEach((field) => assert.equal(surface[field], false, `${label}.${field}`));
}

test('action catalog and owner receipts forbid target-domain authority writes', () => {
  const actionCatalog = readJson('contracts/action_catalog.json');
  const ownerReceipt = readJson('contracts/owner_receipt_contract.json');

  assert.equal(actionCatalog.version, 'family-action-catalog.v1');
  const actions = asObjects(actionCatalog.actions);
  assert.equal(actions.some((action) => action.action_id === 'takeover-external-agent-test'), false);
  assert.doesNotMatch(
    JSON.stringify(actionCatalog),
    /takeover-external-agent-test|opl_meta_agent_takeover_external_agent_test|opl-meta-agent\.takeover-external-agent-test/,
  );

  const buildAgentBaselineAction = actionById(actions, 'build-agent-baseline');
  const takeoverAction = actionById(actions, 'takeover-target-agent-test');
  const externalSuiteAction = actionById(actions, 'improve-from-external-agent-lab-suite');
  const executeWorkOrderAction = actionById(actions, 'execute-external-work-order');
  const mechanismAction = actionById(actions, 'generate-mechanism-patch-proposal');
  const trajectoryLearningAction = actionById(actions, 'materialize-trajectory-learning-proposal');

  assert.match(String(buildAgentBaselineAction.source_command.command), /^npm run build-agent-baseline --/);
  assert.match(String(buildAgentBaselineAction.summary), /natural-language/i);
  assert.match(String(buildAgentBaselineAction.source_command.command), /--domain-id <domain_id>/);
  assert.match(String(buildAgentBaselineAction.source_command.command), /--selected-opl-profile <selected_opl_profile_ref>/);
  assertIncludesAll(buildAgentBaselineAction.workspace_locator_fields, [
    'ai_reviewer_evaluation',
    'domain_id',
    'domain_label',
    'delivery_domain',
    'target_brief',
    'selected_opl_profile_refs',
    'profile_selection_rationale',
    'reference_design_source_refs',
    'reference_design_pattern_packet_refs',
  ], 'buildAgentBaseline.workspace_locator_fields');

  assert.equal(takeoverAction.supported_surfaces.mcp.descriptor_only, true);
  assert.equal(takeoverAction.supported_surfaces.mcp.public_runtime, false);
  assertIncludesAll(takeoverAction.workspace_locator_fields, ['ai_reviewer_evaluation'], 'takeover.workspace_locator_fields');
  assert.match(String(takeoverAction.source_command.command), /--ai-reviewer-evaluation <ai_reviewer_evaluation>/);
  assertFalseFlags(takeoverAction.authority_boundary as JsonObject, [
    'can_write_target_domain_truth',
    'can_promote_default_agent_without_gate',
  ], 'takeover.authority_boundary');
  assert.deepEqual(takeoverAction.new_agent_delivery_gate, buildAgentBaselineAction.new_agent_delivery_gate);

  assert.equal(externalSuiteAction.supported_surfaces.mcp.descriptor_only, true);
  assert.equal(externalSuiteAction.supported_surfaces.product_entry.action_key, 'improve-from-external-agent-lab-suite');
  assert.match(String(externalSuiteAction.summary), /prepare a versioned developer patch work order for OPL execution/);
  assert.equal(externalSuiteAction.accepted_external_suite_inputs.accepted_suite_kind, 'agent_lab_external_suite');
  assert.deepEqual(externalSuiteAction.accepted_external_suite_inputs.accepted_feedback_profiles, [
    'target_agent_feedback_external_suite',
  ]);
  assertIncludesAll(externalSuiteAction.accepted_external_suite_inputs.required_work_order_readback_fields, [
    'opl_work_order_delegation_aperture',
    'target_owner_route',
    'target_editable_surface_refs',
    'forbidden_surfaces',
    'verification_refs',
    'owner_closeout_readback',
  ], 'externalSuite.required_work_order_readback_fields');
  assertFalseFlags(externalSuiteAction.authority_boundary as JsonObject, [
    'can_write_target_domain_truth',
    'can_authorize_target_domain_quality_or_export',
  ], 'externalSuite.authority_boundary');
  assert.equal(externalSuiteAction.authority_boundary.can_modify_target_agent_source_repo, true);
  assert.equal(externalSuiteAction.authority_boundary.can_modify_target_agent_tests, true);
  assert.equal(externalSuiteAction.authority_boundary.can_modify_target_agent_docs, true);
  assert.equal(
    externalSuiteAction.accepted_external_suite_inputs.authority_boundary.can_write_target_domain_truth,
    false,
  );

  const feedbackReadback = actionCatalog.target_agent_feedback_self_evolution_readback as JsonObject;
  assert.equal(feedbackReadback.surface_kind, 'opl_meta_agent_external_feedback_trigger_consumption_readback');
  assert.equal(feedbackReadback.feedback_profile, 'target_agent_feedback_external_suite');
  assert.equal(feedbackReadback.accepted_materialized_input, 'agent_lab_external_suite');
  assert.equal(feedbackReadback.status_projection.suite_materialized_only, 'runnable_pending');
  assertIncludesAll(feedbackReadback.required_action_route, [
    'improve-from-external-agent-lab-suite',
    'execute-external-work-order',
  ], 'feedbackReadback.required_action_route');
  assert.equal(feedbackReadback.consumer_actions.materialized_suite_consumer, 'improve-from-external-agent-lab-suite');
  assertFalseFlags(feedbackReadback.authority_boundary as JsonObject, [
    'oma_can_own_runner_or_queue',
    'oma_can_manage_target_worktree_lifecycle',
    'oma_can_write_target_owner_receipt_body',
    'oma_can_write_target_domain_truth',
  ], 'feedbackReadback.authority_boundary');

  assert.equal(executeWorkOrderAction.supported_surfaces.mcp.descriptor_only, true);
  assert.equal(executeWorkOrderAction.supported_surfaces.product_entry.action_key, 'execute-external-work-order');
  assert.equal(executeWorkOrderAction.authority_boundary.delegates_to_opl_work_order_execute, true);
  assert.equal(executeWorkOrderAction.authority_boundary.owner_closeout_hook_delegated, true);
  assert.equal(executeWorkOrderAction.authority_boundary.target_owner_closeout_owner, 'target-domain via OPL');
  assertFalseFlags(executeWorkOrderAction.authority_boundary as JsonObject, [
    'can_own_generic_runner',
    'can_manage_target_worktree_lifecycle',
    'can_absorb_target_branch',
    'can_clean_target_worktree',
    'oma_can_write_owner_receipt',
    'can_invoke_target_owner_closeout_hook',
    'can_write_target_owner_receipt_body',
    'can_write_target_domain_truth',
    'can_mutate_target_domain_artifact_body',
  ], 'executeWorkOrder.authority_boundary');
  assertIncludesAll(executeWorkOrderAction.human_gate_ids, ['target_domain_owner_closeout_hook_gate'], 'executeWorkOrder.human_gate_ids');
  assertIncludesAll(executeWorkOrderAction.workspace_locator_fields, ['work_order_path'], 'executeWorkOrder.workspace_locator_fields');

  const deliveryGate = buildAgentBaselineAction.new_agent_delivery_gate as JsonObject;
  assertIncludesAll(deliveryGate.required_gates, [
    'scaffold_validation',
    'generated_interface_projection',
    'agent_lab_baseline_or_takeover_suite',
    'independent_reviewer_assessment',
    'stage_closeout_packet_ref',
    'target_owner_receipt_or_typed_blocker_or_human_gate_ref',
    'exactly_one_terminal_closeout',
  ], 'newAgentDeliveryGate.required_gates');
  assertIncludesAll(deliveryGate.insufficient_completion_inputs, [
    'repo_scaffold_only',
    'generated_interface_projection_only',
    'owner_receipt_human_gate_or_typed_blocker_missing',
  ], 'newAgentDeliveryGate.insufficient_completion_inputs');
  assertIncludesAll(deliveryGate.accepted_terminal_outcomes, [
    'delivery_receipt',
    'developer_patch_work_order',
    'typed_blocker',
  ], 'newAgentDeliveryGate.accepted_terminal_outcomes');
  assert.equal(deliveryGate.exactly_one_terminal_outcome_required, true);
  assert.equal(deliveryGate.authority_boundary.delegates_work_order_execution_to_opl, true);
  assertFalseFlags(deliveryGate.authority_boundary as JsonObject, [
    'oma_can_manage_target_worktree_lifecycle',
    'oma_can_write_target_owner_receipt_body',
    'oma_can_write_target_domain_truth',
    'oma_can_mutate_target_domain_artifact_body',
    'oma_can_promote_default_agent_without_gate',
  ], 'deliveryGate.authority_boundary');
  assert.equal(deliveryGate.stage_run_boundary.temporal_and_stage_run_consumption, 'refs_only');
  assert.equal(deliveryGate.stage_run_boundary.provider_completion_is_domain_completion, false);
  assert.equal(deliveryGate.stage_run_boundary.stage_run_state_can_replace_domain_closeout_packet, false);
  assert.equal(deliveryGate.target_domain_boundary.target_domain_owns_authority_owner_receipt_typed_blocker_and_human_gate, true);
  assert.equal(deliveryGate.target_domain_boundary.accepted_owner_answer_shape_required, true);
  assertFalseFlags(deliveryGate.target_domain_boundary as JsonObject, [
    'oma_can_write_target_truth',
    'oma_can_write_target_owner_receipt_body',
    'oma_can_mutate_target_artifact_body',
    'suite_pass_can_claim_target_artifact_readiness',
  ], 'deliveryGate.target_domain_boundary');

  assert.equal(mechanismAction.source_command.command, 'authority-function-ref:opl-meta-agent/mechanism-patch-proposal-authorizer');
  assert.equal(mechanismAction.supported_surfaces.cli.surface_kind, 'not_exposed_repo_local_cli');
  assert.equal(mechanismAction.supported_surfaces.product_entry.surface_kind, 'opl_generated_product_entry_descriptor');

  assert.equal(trajectoryLearningAction.source_command.command, 'contract-ref:contracts/trajectory_learning_contract.json#/candidate_surfaces');
  assert.equal(trajectoryLearningAction.supported_surfaces.cli.surface_kind, 'not_exposed_repo_local_cli');
  assert.equal(trajectoryLearningAction.supported_surfaces.mcp.descriptor_only, true);
  assert.equal(trajectoryLearningAction.supported_surfaces.product_entry.action_key, 'materialize-trajectory-learning-proposal');
  assertIncludesAll(trajectoryLearningAction.workspace_locator_fields, [
    'redacted_trajectory_ref',
    'candidate_buffer_ref',
    'agent_lab_promotion_gate_ref',
  ], 'trajectoryLearning.workspace_locator_fields');
  assertFalseFlags(trajectoryLearningAction.authority_boundary as JsonObject, [
    'can_run_trajectory_daemon',
    'can_install_user_scope_skills',
    'can_claim_ux_score_as_quality_verdict',
    'can_promote_default_agent_without_gate',
    'can_write_target_domain_truth',
  ], 'trajectoryLearning.authority_boundary');

  assertIncludesAll(ownerReceipt.allowed_receipt_classes, [
    'testing_takeover_self_evolution_receipt',
    'mechanism_patch_proposal_receipt',
  ], 'ownerReceipt.allowed_receipt_classes');
  assertIncludesAll(ownerReceipt.forbidden_claims, [
    'opl_meta_agent_wrote_target_domain_truth',
    'opl_meta_agent_promoted_default_agent_without_gate',
  ], 'ownerReceipt.forbidden_claims');
  assertIncludesAll(ownerReceipt.testing_takeover_acceptance_gates, [
    'no_memory_body_written',
    'no_default_promotion',
    'target_agent_allowed',
  ], 'ownerReceipt.testing_takeover_acceptance_gates');
  assert.equal(ownerReceipt.testing_takeover_acceptance_gates.includes('external_agent_allowed'), false);
});
