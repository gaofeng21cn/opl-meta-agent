import test from 'node:test';
import {
  assert,
  asObjects,
  asStrings,
  readJson,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';

test('action catalog and owner receipts forbid target-domain authority writes', () => {
  const actionCatalog = readJson('contracts/action_catalog.json');
  const ownerReceipt = readJson('contracts/owner_receipt_contract.json');
  const packageJson = readJson('package.json');

  assert.equal(actionCatalog.version, 'family-action-catalog.v1');
  assert.match(packageJson.scripts['build-agent-baseline'], /--experimental-strip-types/);
  assert.equal(packageJson.scripts['bootstrap:sample'], undefined);
  assert.match(packageJson.scripts['improve:external-suite'], /--experimental-strip-types/);
  assert.match(packageJson.scripts['execute:external-work-order'], /--experimental-strip-types/);
  assert.match(packageJson.scripts['agent:evidence'], /--experimental-strip-types/);
  assert.match(packageJson.scripts['takeover:test'], /--experimental-strip-types/);
  const actions = asObjects(actionCatalog.actions);
  const buildAgentBaselineAction = actions.find((action) => action.action_id === 'build-agent-baseline');
  assert.ok(buildAgentBaselineAction);
  assert.match(buildAgentBaselineAction.source_command.command, /^npm run build-agent-baseline --/);
  assert.match(buildAgentBaselineAction.supported_surfaces.cli.command, /^npm run build-agent-baseline --/);
  assert.match(buildAgentBaselineAction.supported_surfaces.product_entry.command, /^npm run build-agent-baseline --/);
  const takeoverAction = actions.find((action) => action.action_id === 'takeover-target-agent-test');
  assert.ok(takeoverAction);
  assert.equal(takeoverAction.supported_surfaces.mcp.descriptor_only, true);
  assert.equal(takeoverAction.supported_surfaces.mcp.public_runtime, false);
  assert.ok(takeoverAction.workspace_locator_fields.includes('ai_reviewer_evaluation'));
  assert.match(takeoverAction.source_command.command, /--ai-reviewer-evaluation <ai_reviewer_evaluation>/);
  assert.match(takeoverAction.supported_surfaces.cli.command, /--ai-reviewer-evaluation <ai_reviewer_evaluation>/);
  assert.match(
    takeoverAction.supported_surfaces.product_entry.command,
    /--ai-reviewer-evaluation <ai_reviewer_evaluation>/,
  );
  assert.equal(takeoverAction.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(takeoverAction.authority_boundary.can_promote_default_agent_without_gate, false);
  assert.equal(actions.some((action) => action.action_id === 'takeover-external-agent-test'), false);
  assert.doesNotMatch(
    JSON.stringify(actionCatalog),
    /takeover-external-agent-test|opl_meta_agent_takeover_external_agent_test|opl-meta-agent\.takeover-external-agent-test/,
  );
  const externalSuiteAction = actions.find(
    (action) => action.action_id === 'improve-from-external-agent-lab-suite',
  );
  assert.ok(externalSuiteAction);
  assert.equal(externalSuiteAction.supported_surfaces.mcp.descriptor_only, true);
  assert.equal(externalSuiteAction.supported_surfaces.product_entry.action_key, 'improve-from-external-agent-lab-suite');
  assert.match(externalSuiteAction.summary, /prepare a versioned developer patch work order for OPL execution/);
  assert.equal(externalSuiteAction.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(externalSuiteAction.authority_boundary.can_modify_target_agent_source_repo, true);
  assert.equal(externalSuiteAction.authority_boundary.can_modify_target_agent_tests, true);
  assert.equal(externalSuiteAction.authority_boundary.can_modify_target_agent_docs, true);
  assert.equal(externalSuiteAction.authority_boundary.can_authorize_target_domain_quality_or_export, false);
  assert.ok(externalSuiteAction.workspace_locator_fields.includes('ai_reviewer_evaluation'));
  assert.equal(externalSuiteAction.accepted_external_suite_inputs.accepted_suite_kind, 'agent_lab_external_suite');
  assert.ok(
    externalSuiteAction.accepted_external_suite_inputs.accepted_feedback_profiles.includes(
      'mas_feedback_agent_lab_external_suite',
    ),
  );
  assert.ok(
    externalSuiteAction.accepted_external_suite_inputs.accepted_feedback_profiles.includes(
      'reviewer_revision_feedback',
    ),
  );
  assert.ok(
    externalSuiteAction.accepted_external_suite_inputs.required_work_order_readback_fields.includes(
      'opl_work_order_delegation_aperture',
    ),
  );
  [
    'agent_evolution_decision_ref',
    'failure_class',
    'target_owner_route',
    'target_editable_surface_refs',
    'forbidden_surfaces',
    'expected_behavior_delta',
    'verification_refs',
    'owner_closeout_readback',
  ].forEach((field) => {
    assert.ok(
      externalSuiteAction.accepted_external_suite_inputs.required_work_order_readback_fields.includes(field),
    );
  });
  assert.equal(
    externalSuiteAction.accepted_external_suite_inputs.authority_boundary.can_write_target_domain_truth,
    false,
  );
  const masReviewerRevisionReadback =
    actionCatalog.mas_reviewer_revision_feedback_self_evolution_readback as JsonObject;
  assert.equal(
    masReviewerRevisionReadback.surface_kind,
    'opl_meta_agent_external_feedback_trigger_consumption_readback',
  );
  assert.equal(masReviewerRevisionReadback.target_agent_id, 'med-autoscience');
  assert.equal(masReviewerRevisionReadback.feedback_profile, 'reviewer_revision_feedback');
  assert.equal(masReviewerRevisionReadback.accepted_materialized_input, 'agent_lab_external_suite');
  assert.equal(masReviewerRevisionReadback.status_projection.suite_materialized_only, 'runnable_pending');
  assert.equal(masReviewerRevisionReadback.status_projection.contract_itself_triggers_execution, false);
  assert.ok(
    asStrings(masReviewerRevisionReadback.status_projection.must_not_report_as).includes('executed'),
  );
  assert.deepEqual(masReviewerRevisionReadback.status_projection.executed_requires_refs, [
    'developer_patch_work_order_ref',
    'opl_work_order_execute_receipt_ref',
    'target_owner_closeout_readback_ref',
  ]);
  assert.deepEqual(masReviewerRevisionReadback.required_action_route, [
    'improve-from-external-agent-lab-suite',
    'execute-external-work-order',
    'target_owner_closeout_readback',
  ]);
  assert.equal(
    masReviewerRevisionReadback.consumer_actions.materialized_suite_consumer,
    'improve-from-external-agent-lab-suite',
  );
  assert.equal(
    masReviewerRevisionReadback.consumer_actions.work_order_execution_delegation,
    'execute-external-work-order',
  );
  assert.equal(masReviewerRevisionReadback.authority_boundary.oma_can_consume_materialized_agent_lab_suite, true);
  assert.equal(masReviewerRevisionReadback.authority_boundary.oma_can_materialize_developer_work_order, true);
  assert.equal(masReviewerRevisionReadback.authority_boundary.oma_can_own_runner_or_queue, false);
  assert.equal(masReviewerRevisionReadback.authority_boundary.oma_can_manage_target_worktree_lifecycle, false);
  assert.equal(masReviewerRevisionReadback.authority_boundary.oma_can_write_target_owner_receipt_body, false);
  assert.equal(masReviewerRevisionReadback.authority_boundary.oma_can_write_target_domain_truth, false);
  const executeWorkOrderAction = actions.find(
    (action) => action.action_id === 'execute-external-work-order',
  );
  assert.ok(executeWorkOrderAction);
  assert.equal(executeWorkOrderAction.supported_surfaces.mcp.descriptor_only, true);
  assert.equal(executeWorkOrderAction.supported_surfaces.product_entry.action_key, 'execute-external-work-order');
  assert.equal(executeWorkOrderAction.authority_boundary.delegates_to_opl_work_order_execute, true);
  assert.equal(executeWorkOrderAction.authority_boundary.can_own_generic_runner, false);
  assert.equal(executeWorkOrderAction.authority_boundary.can_manage_target_worktree_lifecycle, false);
  assert.equal(executeWorkOrderAction.authority_boundary.can_absorb_target_branch, false);
  assert.equal(executeWorkOrderAction.authority_boundary.can_clean_target_worktree, false);
  assert.equal(executeWorkOrderAction.authority_boundary.owner_closeout_hook_delegated, true);
  assert.equal(executeWorkOrderAction.authority_boundary.target_owner_closeout_owner, 'target-domain via OPL');
  assert.equal(executeWorkOrderAction.authority_boundary.oma_can_write_owner_receipt, false);
  assert.equal(executeWorkOrderAction.authority_boundary.can_invoke_target_owner_closeout_hook, false);
  assert.equal(executeWorkOrderAction.authority_boundary.can_write_target_owner_receipt_body, false);
  assert.equal(executeWorkOrderAction.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(executeWorkOrderAction.authority_boundary.can_mutate_target_domain_artifact_body, false);
  assert.ok(executeWorkOrderAction.human_gate_ids.includes('target_domain_owner_closeout_hook_gate'));
  assert.ok(executeWorkOrderAction.workspace_locator_fields.includes('work_order_path'));
  const morphologyPolicy = readJson('runtime/authority_functions/meta-agent-authority-functions.json')
    .script_morphology_policy as JsonObject;
  const executeWorkOrderFunction = asObjects(morphologyPolicy.script_classifications).find(
    (entry) => entry.script_ref === 'scripts/execute-external-work-order.ts',
  );
  assert.ok(executeWorkOrderFunction);
  assert.deepEqual(asStrings(executeWorkOrderFunction.forbidden_roles), []);
  assert.ok(asStrings(executeWorkOrderFunction.writes_only).includes('owner_closeout_hook_delegated_ref'));
  assert.ok(asStrings(executeWorkOrderFunction.writes_only).includes('no_oma_owner_receipt_write_proof_ref'));
  assert.ok(asStrings(executeWorkOrderFunction.consumes_opl_surfaces)
    .includes('opl_work_order_execute_primitive'));
  const baselineAction = actions.find((action) => action.action_id === 'build-agent-baseline');
  assert.ok(baselineAction);
  assert.ok(baselineAction.workspace_locator_fields.includes('ai_reviewer_evaluation'));
  assert.ok(baselineAction.workspace_locator_fields.includes('domain_id'));
  assert.ok(baselineAction.workspace_locator_fields.includes('domain_label'));
  assert.ok(baselineAction.workspace_locator_fields.includes('delivery_domain'));
  assert.ok(baselineAction.workspace_locator_fields.includes('target_brief'));
  assert.match(baselineAction.summary, /natural-language/i);
  assert.match(baselineAction.source_command.command, /--domain-id <domain_id>/);
  assert.match(baselineAction.source_command.command, /--target-brief <target_brief>/);
  assert.equal(
    actionCatalog.actions.find((action: JsonObject) => action.action_id === 'build-agent-baseline')
      ?.supported_surfaces.skill.intent_mapping,
    'Codex extracts domain_id, domain_label, delivery_domain, target_brief, output_dir, opl_bin, and ai_reviewer_evaluation from the user natural-language request before invoking this action.',
  );
  assert.deepEqual(takeoverAction.new_agent_delivery_gate, baselineAction.new_agent_delivery_gate);
  assert.deepEqual(baselineAction.new_agent_delivery_gate.required_gates, [
    'scaffold_validation',
    'generated_interface_projection',
    'agent_lab_baseline_or_takeover_suite',
    'independent_reviewer_assessment',
    'oma_self_evolution_consumption',
    'temporal_or_stage_run_refs_only_consumption',
    'stage_completion_policy_ref',
    'stage_closeout_packet_ref',
    'target_owner_receipt_or_typed_blocker_or_human_gate_ref',
    'no_forbidden_target_truth_write_proof',
    'target_source_morphology_ref',
    'target_owner_route_ref',
    'generated_surface_consumption_ref',
    'private_residue_decision_ref',
    'accepted_owner_answer_shape',
    'exactly_one_terminal_closeout',
  ]);
  assert.deepEqual(baselineAction.new_agent_delivery_gate.insufficient_completion_inputs, [
    'repo_scaffold_only',
    'contract_validation_only',
    'generated_interface_projection_only',
    'baseline_suite_pass_only',
    'conformance_pass_only',
    'temporal_provider_completion_only',
    'stage_run_state_only',
    'stage_run_canary_or_operator_summary_only',
    'target_artifact_morphology_missing',
    'target_owner_route_missing',
    'generated_surface_consumption_missing',
    'private_residue_decision_missing',
    'accepted_owner_answer_shape_missing',
    'owner_receipt_human_gate_or_typed_blocker_missing',
  ]);
  assert.deepEqual(baselineAction.new_agent_delivery_gate.accepted_terminal_outcomes, [
    'delivery_receipt',
    'no_patch_coordination_receipt',
    'developer_patch_work_order',
    'typed_blocker',
  ]);
  assert.equal(baselineAction.new_agent_delivery_gate.exactly_one_terminal_outcome_required, true);
  assert.equal(baselineAction.new_agent_delivery_gate.output_readback_field, 'new_agent_delivery_gate');
  assert.equal(baselineAction.new_agent_delivery_gate.authority_boundary.delegates_work_order_execution_to_opl, true);
  assert.equal(baselineAction.new_agent_delivery_gate.authority_boundary.oma_can_manage_target_worktree_lifecycle, false);
  assert.equal(baselineAction.new_agent_delivery_gate.authority_boundary.oma_can_write_target_owner_receipt_body, false);
  assert.equal(baselineAction.new_agent_delivery_gate.authority_boundary.oma_can_write_target_domain_truth, false);
  assert.equal(baselineAction.new_agent_delivery_gate.authority_boundary.oma_can_mutate_target_domain_artifact_body, false);
  assert.equal(baselineAction.new_agent_delivery_gate.authority_boundary.oma_can_promote_default_agent_without_gate, false);
  assert.equal(
    baselineAction.new_agent_delivery_gate.stage_run_boundary.temporal_and_stage_run_consumption,
    'refs_only',
  );
  assert.equal(
    baselineAction.new_agent_delivery_gate.stage_run_boundary
      .opl_owns_runtime_stage_run_temporal_and_generated_surfaces,
    true,
  );
  assert.equal(
    baselineAction.new_agent_delivery_gate.stage_run_boundary.provider_completion_is_domain_completion,
    false,
  );
  assert.equal(
    baselineAction.new_agent_delivery_gate.stage_run_boundary.stage_run_state_can_replace_domain_closeout_packet,
    false,
  );
  assert.equal(
    baselineAction.new_agent_delivery_gate.target_domain_boundary
      .target_domain_owns_authority_owner_receipt_typed_blocker_and_human_gate,
    true,
  );
  assert.equal(
    baselineAction.new_agent_delivery_gate.target_domain_boundary.target_domain_artifact_morphology_required,
    true,
  );
  assert.equal(
    baselineAction.new_agent_delivery_gate.target_domain_boundary.target_owner_route_required,
    true,
  );
  assert.equal(
    baselineAction.new_agent_delivery_gate.target_domain_boundary.generated_surface_consumption_required,
    true,
  );
  assert.equal(
    baselineAction.new_agent_delivery_gate.target_domain_boundary.private_residue_decision_required,
    true,
  );
  assert.equal(
    baselineAction.new_agent_delivery_gate.target_domain_boundary.accepted_owner_answer_shape_required,
    true,
  );
  assert.equal(baselineAction.new_agent_delivery_gate.target_domain_boundary.oma_can_write_target_truth, false);
  assert.equal(
    baselineAction.new_agent_delivery_gate.target_domain_boundary.oma_can_write_target_owner_receipt_body,
    false,
  );
  assert.equal(
    baselineAction.new_agent_delivery_gate.target_domain_boundary.oma_can_mutate_target_artifact_body,
    false,
  );
  assert.equal(
    baselineAction.new_agent_delivery_gate.target_domain_boundary.suite_pass_can_claim_target_artifact_readiness,
    false,
  );
  const mechanismAction = actions.find((action) => action.action_id === 'generate-mechanism-patch-proposal');
  assert.ok(mechanismAction);
  assert.equal(
    mechanismAction.source_command.command,
    'authority-function-ref:opl-meta-agent/mechanism-patch-proposal-authorizer',
  );
  assert.equal(mechanismAction.supported_surfaces.cli.surface_kind, 'not_exposed_repo_local_cli');
  assert.equal(
    mechanismAction.supported_surfaces.product_entry.surface_kind,
    'opl_generated_product_entry_descriptor',
  );
  assert.doesNotMatch(JSON.stringify(mechanismAction), /opl-meta-agent authority-function/);
  assert.deepEqual(mechanismAction.workspace_locator_fields, [
    'mechanism_ref',
    'segment_run_ref',
    'evidence_delta_ref',
    'next_mechanism_candidate_ref',
  ]);
  const trajectoryLearningAction = actions.find(
    (action) => action.action_id === 'materialize-trajectory-learning-proposal',
  );
  assert.ok(trajectoryLearningAction);
  assert.equal(
    trajectoryLearningAction.source_command.command,
    'contract-ref:contracts/trajectory_learning_contract.json#/candidate_surfaces',
  );
  assert.equal(trajectoryLearningAction.supported_surfaces.cli.surface_kind, 'not_exposed_repo_local_cli');
  assert.equal(trajectoryLearningAction.supported_surfaces.mcp.descriptor_only, true);
  assert.equal(
    trajectoryLearningAction.supported_surfaces.product_entry.surface_kind,
    'opl_generated_product_entry_descriptor',
  );
  assert.equal(trajectoryLearningAction.supported_surfaces.product_entry.action_key, 'materialize-trajectory-learning-proposal');
  assert.doesNotMatch(JSON.stringify(trajectoryLearningAction), /opl-meta-agent authority-function/);
  assert.ok(trajectoryLearningAction.workspace_locator_fields.includes('redacted_trajectory_ref'));
  assert.ok(trajectoryLearningAction.workspace_locator_fields.includes('candidate_buffer_ref'));
  assert.ok(trajectoryLearningAction.workspace_locator_fields.includes('agent_lab_promotion_gate_ref'));
  assert.equal(trajectoryLearningAction.authority_boundary.can_run_trajectory_daemon, false);
  assert.equal(trajectoryLearningAction.authority_boundary.can_install_user_scope_skills, false);
  assert.equal(trajectoryLearningAction.authority_boundary.can_claim_ux_score_as_quality_verdict, false);
  assert.equal(trajectoryLearningAction.authority_boundary.can_promote_default_agent_without_gate, false);
  assert.equal(trajectoryLearningAction.authority_boundary.can_write_target_domain_truth, false);
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_scheduler_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_cli_mcp_product_wrapper_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_sidecar_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_session_store_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_status_workbench_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generic_trajectory_daemon_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('user_scope_skill_installer_owner'));
  assert.ok(actionCatalog.forbidden_generic_owner_roles.includes('generated_surface_owner_in_domain_repo'));
  assert.ok(ownerReceipt.allowed_receipt_classes.includes('testing_takeover_self_evolution_receipt'));
  assert.ok(ownerReceipt.allowed_receipt_classes.includes('mechanism_patch_proposal_receipt'));
  assert.ok(ownerReceipt.forbidden_claims.includes('opl_meta_agent_wrote_target_domain_truth'));
  assert.ok(ownerReceipt.forbidden_claims.includes('opl_meta_agent_promoted_default_agent_without_gate'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('mechanism_patch_proposal_recorded'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('no_memory_body_written'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('no_default_promotion'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('target_agent_allowed'));
  assert.equal(ownerReceipt.testing_takeover_acceptance_gates.includes('external_agent_allowed'), false);
  assert.ok(ownerReceipt.baseline_acceptance_gates.includes('ai_reviewer_critique_present'));
  assert.ok(ownerReceipt.baseline_acceptance_gates.includes('ai_reviewer_suggestions_present'));
  assert.ok(ownerReceipt.baseline_acceptance_gates.includes('ai_reviewer_source_refs_valid'));
  assert.ok(ownerReceipt.baseline_acceptance_gates.includes('ai_reviewer_provenance_present'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('ai_reviewer_critique_present'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('ai_reviewer_suggestions_present'));
  assert.ok(ownerReceipt.testing_takeover_acceptance_gates.includes('ai_reviewer_source_refs_valid'));
});
