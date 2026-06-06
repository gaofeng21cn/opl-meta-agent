import test from 'node:test';
import {
  assert,
  asObjects,
  asStrings,
  readJson,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';

test('StageRun Kernel profile keeps legacy wrappers retired and canaries tool refs as affordances', () => {
  const profile = readJson('contracts/stage_run_kernel_profile.json');
  const canaryEvidence = readJson('contracts/stage_run_canary_evidence.json');
  const oplRefs = profile.opl_contract_refs as JsonObject;
  const retirementPolicy = profile.legacy_surface_retirement_policy as JsonObject;
  const canary = profile.agent_building_stage_run_canary as JsonObject;
  const toolPolicy = canary.tool_affordance_policy as JsonObject;
  const passCondition = canary.pass_condition as JsonObject;
  const overclaimBoundary = canary.overclaim_boundary as JsonObject;
  const legacyResidueGuard = canary.legacy_runtime_residue_guard as JsonObject;
  const operatorSummary = canaryEvidence.operator_summary as JsonObject;
  const evidenceOverclaimBoundary = canaryEvidence.overclaim_boundary as JsonObject;
  const canaryToolPolicy = canaryEvidence.tool_affordance_policy as JsonObject;
  const closeout = canaryEvidence.closeout as JsonObject;
  const authorityBoundary = canaryEvidence.authority_boundary as JsonObject;

  assert.equal(profile.surface_kind, 'opl_stage_run_kernel_profile');
  assert.equal(profile.owner, 'opl-meta-agent');
  assert.equal(profile.kernel_role, 'minimal_state_shell_not_domain_controller_system');
  assert.equal(profile.stage_run_state_machine.provider_completion_counts_as_domain_accepted, false);
  assert.equal(profile.stage_run_state_machine.file_presence_counts_as_stage_complete, false);
  assert.equal(profile.stage_run_state_machine.read_model_counts_as_transition_authority, false);

  assert.equal(oplRefs.owner, 'one-person-lab');
  assert.equal(oplRefs.domain_repo_role, 'consumer_profile_ref_only');
  assert.equal(oplRefs.repo_local_file_required, false);
  assert.equal(oplRefs.local_resolution_policy, 'do_not_copy_opl_framework_contracts_into_domain_repo');
  assert.deepEqual(asStrings(oplRefs.refs), [
    'contracts/opl-framework/stage-run-kernel-contract.json',
    'contracts/opl-framework/stage-manifest.schema.json',
    'contracts/opl-framework/role-artifact-ref.schema.json',
    'contracts/opl-framework/stage-owner-receipt.schema.json',
    'contracts/opl-framework/stage-typed-blocker.schema.json',
  ]);

  assert.equal(retirementPolicy.policy_kind, 'script_wrapper_status_workbench_retirement');
  assert.equal(retirementPolicy.retirement_state, 'retained_only_as_migration_input_or_diagnostic_provenance');
  [
    'generic_runtime_wrapper_owner',
    'generic_cli_mcp_skill_product_wrapper_owner',
    'generic_status_shell_owner',
    'generic_workbench_wrapper_owner',
    'generic_sidecar_or_projection_owner',
    'compatibility_materialization_route_owner',
  ].forEach((role) => {
    assert.ok(asStrings(retirementPolicy.forbidden_repo_owned_surface_roles).includes(role));
  });
  [
    'agent_building_domain_truth_ref',
    'agent_lab_quality_verdict_ref',
    'artifact_authority_ref',
    'owner_receipt_ref',
    'typed_blocker_ref',
    'domain_knowledge_skill_tool_quality_gate_ref',
    'diagnostic_or_provenance_ref',
    'explicit_migration_input_ref',
  ].forEach((role) => {
    assert.ok(asStrings(retirementPolicy.allowed_retained_roles).includes(role));
  });
  assert.equal(retirementPolicy.authority_boundary.legacy_surfaces_can_be_active_workflow, false);
  assert.equal(retirementPolicy.authority_boundary.legacy_surfaces_can_be_default_caller, false);
  assert.equal(retirementPolicy.authority_boundary.legacy_surfaces_can_write_runtime_state, false);
  assert.equal(retirementPolicy.authority_boundary.legacy_surfaces_can_write_read_model, false);
  assert.equal(retirementPolicy.authority_boundary.legacy_surfaces_can_authorize_owner_receipt, false);
  assert.equal(retirementPolicy.authority_boundary.legacy_surfaces_can_restore_repo_owned_wrapper, false);
  assert.equal(retirementPolicy.authority_boundary.legacy_surfaces_can_create_fallback_or_compatibility_route, false);

  assert.equal(canary.canary_id, 'oma-agent-building-stage-run-canary.v1');
  assert.equal(canary.controlled_canary_evidence_ref, 'contracts/stage_run_canary_evidence.json');
  assert.deepEqual(asStrings(canary.stage_sequence), [
    'intent-intake',
    'stage-decomposition-candidates',
    'mechanism-and-test-review',
    'owner-approval-or-typed-blocker',
  ]);
  assert.deepEqual(canary.required_stage_outputs['intent-intake'], [
    'intent_brief_ref',
    'target_agent_boundary_ref',
    'quality_bar_ref',
    'non_goals_ref',
  ]);
  assert.deepEqual(canary.required_stage_outputs['stage-decomposition-candidates'], [
    'stage_decomposition_candidate_refs',
    'candidate_tradeoff_review_ref',
    'selected_stage_plan_candidate_ref',
  ]);
  assert.deepEqual(canary.required_stage_outputs['mechanism-and-test-review'], [
    'mechanism_candidate_ref',
    'agent_lab_suite_seed_ref',
    'test_review_ref',
    'quality_gate_ref',
  ]);
  assert.deepEqual(canary.required_stage_outputs['owner-approval-or-typed-blocker'], [
    'oma_owner_receipt_ref_or_typed_blocker_ref',
    'next_owner_delta_ref',
  ]);

  assert.equal(toolPolicy.tool_refs_role, 'advisory_affordance_refs_only');
  assert.equal(toolPolicy.tool_refs_can_define_fixed_workflow_order, false);
  assert.equal(toolPolicy.tool_refs_can_replace_stage_reasoning, false);
  assert.equal(toolPolicy.tool_refs_can_authorize_domain_verdict, false);
  assert.equal(toolPolicy.tool_refs_can_bypass_owner_approval_or_typed_blocker, false);
  assert.deepEqual(asStrings(toolPolicy.allowed_tool_ref_classes), [
    'research_affordance_ref',
    'scaffold_affordance_ref',
    'agent_lab_affordance_ref',
    'review_affordance_ref',
    'artifact_materialization_affordance_ref',
  ]);

  assert.equal(passCondition.terminal_output, 'oma_owner_receipt_or_typed_blocker');
  assert.equal(passCondition.requires_owner_delta, true);
  assert.equal(passCondition.requires_no_forbidden_legacy_surface, true);
  assert.equal(passCondition.requires_tool_refs_as_affordances_only, true);
  assert.equal(passCondition.provider_completion_counts_as_pass, false);
  assert.equal(passCondition.file_presence_counts_as_pass, false);
  assert.equal(passCondition.read_model_counts_as_pass, false);

  assert.equal(overclaimBoundary.boundary_kind, 'controlled_canary_overclaim_boundary');
  assert.equal(overclaimBoundary.canary_evidence_ref, 'contracts/stage_run_canary_evidence.json');
  assert.deepEqual(asStrings(overclaimBoundary.allowed_claims), [
    'repo_local_stage_run_canary_shape_consumable',
    'controlled_fixture_strategy_trace_refs_present',
    'controlled_fixture_owner_receipt_or_typed_blocker_ref_present',
    'legacy_runtime_residue_guard_declared',
  ]);
  assert.deepEqual(asStrings(overclaimBoundary.forbidden_claims), [
    'live_domain_progress',
    'target_agent_domain_ready',
    'target_truth_ready',
    'target_artifact_ready',
    'target_quality_verdict',
    'target_export_ready',
    'agent_lab_promotion_ready',
    'production_ready',
    'app_live_rendering',
    'human_approval',
    'default_agent_promotion',
    'owner_receipt_body_materialized_by_opl',
  ]);
  assert.equal(overclaimBoundary.evidence_scope_must_equal, 'controlled_fixture_not_live_domain_progress');
  assert.equal(overclaimBoundary.authority_boundary.allowed_claims_can_authorize_closeout, false);
  assert.equal(overclaimBoundary.authority_boundary.controlled_canary_can_claim_live_domain_progress, false);
  assert.equal(overclaimBoundary.authority_boundary.operator_summary_can_upgrade_readiness, false);
  assert.equal(overclaimBoundary.authority_boundary.contract_completeness_can_claim_quality_or_export, false);

  assert.equal(legacyResidueGuard.guard_kind, 'legacy_runtime_residue_guard');
  assert.equal(legacyResidueGuard.scan_scope, 'repo_tracked_source_contracts_docs_only');
  assert.deepEqual(asStrings(legacyResidueGuard.forbidden_residue_roles), [
    'repo_owned_runtime_wrapper',
    'repo_owned_status_shell',
    'repo_owned_operator_workbench',
    'repo_owned_sidecar_or_projection_writer',
    'repo_owned_queue_or_attempt_ledger',
    'repo_owned_agent_lab_runner',
    'repo_owned_worktree_lifecycle',
    'compatibility_or_fallback_route',
  ]);
  assert.deepEqual(asStrings(legacyResidueGuard.required_guard_refs), [
    'contracts/functional_privatization_audit.json',
    'contracts/default_caller_deletion_evidence.json',
    'runtime/authority_functions/meta-agent-authority-functions.json#source_purity_scan_receipt',
    'tests/source-purity.test.ts',
  ]);
  assert.equal(legacyResidueGuard.authority_boundary.legacy_residue_can_be_active_runtime, false);
  assert.equal(legacyResidueGuard.authority_boundary.legacy_residue_can_write_runtime_state, false);
  assert.equal(legacyResidueGuard.authority_boundary.legacy_residue_can_write_read_model, false);
  assert.equal(legacyResidueGuard.authority_boundary.legacy_residue_can_authorize_closeout, false);
  assert.equal(legacyResidueGuard.authority_boundary.guard_can_physically_delete_files, false);

  assert.equal(canaryEvidence.surface_kind, 'opl_stage_run_controlled_canary_evidence');
  assert.equal(canaryEvidence.version, 'stage-run-controlled-canary.v1');
  assert.equal(canaryEvidence.domain_id, 'opl-meta-agent');
  assert.equal(canaryEvidence.canary_id, canary.canary_id);
  assert.equal(canaryEvidence.stage_id, 'agent-building-controlled-canary');
  assert.equal(canaryEvidence.evidence_scope, 'controlled_fixture_not_live_domain_progress');
  assert.match(canaryEvidence.stage_run_ref as string, /^stage-run-ref:opl-meta-agent\/oma-agent-building-stage-run-canary\//);
  assert.match(canaryEvidence.stage_manifest_ref as string, /^stage-manifest-ref:opl-meta-agent\/agent-building-controlled-canary\//);
  assert.equal(
    canaryEvidence.current_pointer_ref,
    'stage-current-pointer-ref:opl-meta-agent/agent-building-controlled-canary',
  );

  assert.equal(operatorSummary.summary_kind, 'controlled_canary_operator_summary');
  assert.equal(operatorSummary.summary_scope, 'operator_readable_controlled_fixture_summary');
  assert.equal(operatorSummary.evidence_scope, canaryEvidence.evidence_scope);
  assert.equal(operatorSummary.stage_run_ref, canaryEvidence.stage_run_ref);
  assert.equal(operatorSummary.stage_manifest_ref, canaryEvidence.stage_manifest_ref);
  assert.equal(operatorSummary.current_pointer_ref, canaryEvidence.current_pointer_ref);
  assert.deepEqual(asStrings(operatorSummary.visible_stage_sequence), asStrings(canary.stage_sequence));
  assert.deepEqual(asStrings(operatorSummary.visible_claims), asStrings(overclaimBoundary.allowed_claims));
  assert.deepEqual(asStrings(operatorSummary.blocked_claims), asStrings(overclaimBoundary.forbidden_claims));
  assert.equal(operatorSummary.terminal_outcome, closeout.terminal_outcome);
  assert.equal(operatorSummary.owner_receipt_ref_or_typed_blocker_ref, closeout.owner_receipt_ref);
  assert.equal(operatorSummary.operator_next_delta_ref, 'next-owner-delta-ref:opl-meta-agent/stage-run-canary/controlled-fixture');
  assert.equal(operatorSummary.summary_can_claim_live_domain_progress, false);
  assert.equal(operatorSummary.summary_can_claim_target_agent_readiness, false);
  assert.equal(operatorSummary.summary_can_claim_production_readiness, false);
  assert.equal(operatorSummary.summary_can_authorize_default_promotion, false);

  assert.deepEqual(evidenceOverclaimBoundary, {
    boundary_kind: overclaimBoundary.boundary_kind,
    allowed_claims: overclaimBoundary.allowed_claims,
    forbidden_claims: overclaimBoundary.forbidden_claims,
    authority_boundary: overclaimBoundary.authority_boundary,
  });

  [
    'candidate_generation',
    'grounded_reflection',
    'comparative_selection',
    'evolution_and_revision',
    'meta_review_learning',
    'independent_quality_gate',
  ].forEach((traceKey) => {
    const trace = canaryEvidence.strategy_trace[traceKey] as JsonObject;
    assert.ok(trace, `strategy_trace.${traceKey} should exist`);
    assert.ok(asStrings(trace.refs).length > 0, `strategy_trace.${traceKey}.refs should not be empty`);
  });

  assert.match(
    asStrings(canaryEvidence.strategy_trace.candidate_generation.refs)[0],
    /^intent-brief-ref:/,
    'candidate generation should include intent intake evidence',
  );
  assert.match(
    asStrings(canaryEvidence.strategy_trace.grounded_reflection.refs)[0],
    /^reflection-review-ref:/,
    'grounded reflection should include mechanism/test review evidence',
  );
  assert.match(
    asStrings(canaryEvidence.strategy_trace.comparative_selection.refs)[0],
    /^ranking-selection-ref:/,
    'comparative selection should include ranking evidence',
  );
  assert.match(
    asStrings(canaryEvidence.strategy_trace.evolution_and_revision.refs)[0],
    /^revision-lineage-ref:/,
    'evolution should include revision lineage',
  );
  assert.match(
    asStrings(canaryEvidence.strategy_trace.meta_review_learning.refs)[0],
    /^meta-review-ref:/,
    'meta review should include learning review evidence',
  );
  assert.match(
    asStrings(canaryEvidence.strategy_trace.independent_quality_gate.refs)[0],
    /^independent-agent-test-review-gate-ref:/,
    'independent gate should include independent agent test/review evidence',
  );

  assert.deepEqual(canaryEvidence.role_artifact_refs, {
    candidate_pool_ref: 'candidate-pool-ref:opl-meta-agent/stage-run-canary/controlled-fixture',
    reflection_review_ref: 'reflection-review-ref:opl-meta-agent/stage-run-canary/source-grounding',
    ranking_selection_ref: 'ranking-selection-ref:opl-meta-agent/stage-run-canary/candidate-ranking',
    revision_lineage_ref: 'revision-lineage-ref:opl-meta-agent/stage-run-canary/revision-v1',
    meta_review_ref: 'meta-review-ref:opl-meta-agent/stage-run-canary/meta-learning',
    independent_gate_ref: 'independent-agent-test-review-gate-ref:opl-meta-agent/stage-run-canary/no-shared-context',
  });

  assert.equal(canaryToolPolicy.tool_refs_role, toolPolicy.tool_refs_role);
  assert.equal(canaryToolPolicy.tool_refs_can_define_fixed_workflow_order, false);
  assert.equal(canaryToolPolicy.tool_refs_can_replace_stage_reasoning, false);
  assert.equal(canaryToolPolicy.tool_refs_can_authorize_domain_verdict, false);
  assert.equal(canaryToolPolicy.tool_refs_can_bypass_owner_approval_or_typed_blocker, false);
  assert.deepEqual(
    asObjects(canaryToolPolicy.tool_refs).map((entry) => entry.ref_kind),
    asStrings(toolPolicy.allowed_tool_ref_classes),
  );
  asObjects(canaryToolPolicy.tool_refs).forEach((toolRef) => {
    assert.equal(toolRef.role, 'affordance_not_workflow_step');
    assert.equal(toolRef.can_authorize_closeout, false);
  });

  assert.ok(['owner_receipt', 'typed_blocker'].includes(closeout.terminal_outcome as string));
  assert.equal(
    Boolean(closeout.owner_receipt_ref) || Boolean(closeout.typed_blocker_ref),
    true,
    'controlled canary closeout requires owner_receipt_ref or typed_blocker_ref',
  );
  assert.equal(closeout.same_attempt_self_review, false);
  if (closeout.terminal_outcome === 'owner_receipt') {
    assert.match(closeout.owner_receipt_ref as string, /^owner-receipt-ref:/);
    assert.equal(closeout.typed_blocker_ref, null);
  }
  if (closeout.terminal_outcome === 'typed_blocker') {
    assert.match(closeout.typed_blocker_ref as string, /^typed-blocker-ref:/);
    assert.equal(closeout.owner_receipt_ref, null);
  }

  assert.deepEqual(authorityBoundary, {
    refs_only: true,
    controlled_canary_claims_live_domain_progress: false,
    provider_completion_counts_as_closeout: false,
    file_presence_counts_as_closeout: false,
    read_model_counts_as_closeout: false,
    conformance_pass_counts_as_closeout: false,
    opl_can_write_domain_truth: false,
    opl_can_mutate_artifact_body: false,
    opl_can_sign_owner_receipt: false,
    opl_can_create_typed_blocker: false,
    opl_can_authorize_quality_or_export: false,
  });
});
