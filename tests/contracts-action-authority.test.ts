import assert from 'node:assert/strict';
import test from 'node:test';
import {
  asObjects,
  asStrings,
  readJson,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';
import {
  assertFalseFlags,
  assertIncludesAll,
} from './support/source-purity.ts';

function actionById(actions: JsonObject[], actionId: string): JsonObject {
  const action = actions.find((candidate) => candidate.action_id === actionId);
  assert.ok(action, `${actionId} should exist`);
  return action;
}

test('action catalog and owner receipts forbid target-domain authority writes', () => {
  const actionCatalog = readJson('contracts/action_catalog.json');
  const ownerReceipt = readJson('contracts/owner_receipt_contract.json');
  const actions = asObjects(actionCatalog.actions);
  const actionIds = [
    'build-agent-baseline',
    'takeover-target-agent-test',
    'improve-from-external-agent-lab-suite',
    'execute-external-work-order',
    'generate-mechanism-patch-proposal',
    'materialize-trajectory-learning-proposal',
  ];
  const commonFalseAuthority = [
    'can_write_target_domain_truth',
    'can_write_target_domain_memory_body',
    'can_mutate_target_domain_artifact_body',
    'can_authorize_target_domain_quality_or_export',
    'can_promote_default_agent_without_gate',
    'can_train_or_deploy_model_weights',
  ];

  assert.equal(actionCatalog.version, 'family-action-catalog.v1');
  assert.deepEqual(actions.map((action) => action.action_id), actionIds);
  assert.doesNotMatch(
    JSON.stringify(actionCatalog),
    /takeover-external-agent-test|opl_meta_agent_takeover_external_agent_test|opl-meta-agent\.takeover-external-agent-test/,
  );

  actionIds.forEach((actionId) => {
    const action = actionById(actions, actionId);
    assertFalseFlags(action.authority_boundary as JsonObject, commonFalseAuthority, `${actionId}.authority_boundary`);
  });

  const baselineAction = actionById(actions, 'build-agent-baseline');
  const takeoverAction = actionById(actions, 'takeover-target-agent-test');
  const externalSuiteAction = actionById(actions, 'improve-from-external-agent-lab-suite');
  const executeWorkOrderAction = actionById(actions, 'execute-external-work-order');
  const trajectoryAction = actionById(actions, 'materialize-trajectory-learning-proposal');

  assert.match(String(baselineAction.source_command.command), /^npm run build-agent-baseline --/);
  assert.equal(Object.hasOwn(baselineAction, 'new_agent_delivery_gate'), false);
  assert.equal(Object.hasOwn(takeoverAction, 'new_agent_delivery_gate'), false);
  assert.match(String(baselineAction.summary), /without creating a suite result or owner receipt/);
  assert.match(String(takeoverAction.summary), /without local suite execution or owner receipt creation/);
  assert.equal(takeoverAction.supported_surfaces.mcp.descriptor_only, true);
  assert.equal(takeoverAction.supported_surfaces.mcp.public_runtime, false);

  [
    'can_modify_target_agent_source_repo',
    'can_modify_target_agent_tests',
    'can_modify_target_agent_docs',
  ].forEach((field) => assert.equal(externalSuiteAction.authority_boundary[field], true, field));
  assert.equal(externalSuiteAction.accepted_external_suite_inputs.accepted_suite_kind, 'agent_lab_external_suite');

  assert.equal(executeWorkOrderAction.authority_boundary.delegates_to_opl_work_order_execute, true);
  assert.equal(executeWorkOrderAction.authority_boundary.owner_closeout_hook_delegated, true);
  assertFalseFlags(executeWorkOrderAction.authority_boundary as JsonObject, [
    'can_own_generic_runner',
    'can_own_generic_queue_or_attempt_ledger',
    'can_manage_target_worktree_lifecycle',
    'can_absorb_target_branch',
    'can_clean_target_worktree',
    'oma_can_write_owner_receipt',
    'can_invoke_target_owner_closeout_hook',
    'can_write_target_owner_receipt_body',
  ], 'execute-external-work-order.authority_boundary');

  assertFalseFlags(trajectoryAction.authority_boundary as JsonObject, [
    'can_run_trajectory_daemon',
    'can_install_user_scope_skills',
    'can_claim_ux_score_as_quality_verdict',
  ], 'materialize-trajectory-learning-proposal.authority_boundary');

  const feedbackReadback = actionCatalog.target_agent_feedback_self_evolution_readback as JsonObject;
  assertIncludesAll(asStrings(feedbackReadback.required_action_route), [
    'improve-from-external-agent-lab-suite',
    'execute-external-work-order',
  ], 'feedback readback route');
  assertFalseFlags(feedbackReadback.authority_boundary as JsonObject, [
    'oma_can_own_runner_or_queue',
    'oma_can_manage_target_worktree_lifecycle',
    'oma_can_write_target_owner_receipt_body',
    'oma_can_write_target_domain_truth',
  ], 'feedback readback authority_boundary');

  assertIncludesAll(asStrings(ownerReceipt.forbidden_claims), [
    'opl_meta_agent_wrote_target_domain_truth',
    'opl_meta_agent_promoted_default_agent_without_gate',
  ], 'owner receipt forbidden claims');
  assert.equal(asStrings(ownerReceipt.testing_takeover_acceptance_gates).includes('external_agent_allowed'), false);
});
