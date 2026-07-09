import assert from 'node:assert/strict';
import test from 'node:test';
import {
  asObjects,
  asStrings,
  readJson,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';
import {
  assertEveryFlagFalse,
  assertIncludesAll,
} from './support/source-purity.ts';

test('StageRun Kernel profile delegates schemas and rejects wrapper authority', () => {
  const profile = readJson('contracts/stage_run_kernel_profile.json');
  const oplRefs = profile.opl_contract_refs as JsonObject;
  const retirementPolicy = profile.legacy_surface_retirement_policy as JsonObject;
  const schemaRefs = [
    profile.kernel_contract_ref,
    profile.stage_manifest_schema_ref,
    profile.role_artifact_ref_schema_ref,
    profile.owner_receipt_schema_ref,
    profile.typed_blocker_schema_ref,
  ];

  assert.equal(profile.surface_kind, 'opl_stage_run_kernel_profile');
  assert.equal(profile.owner, 'opl-meta-agent');
  assert.equal(profile.kernel_role, 'minimal_state_shell_not_domain_controller_system');
  assertEveryFlagFalse(profile.stage_run_state_machine, 'stage-run state machine');

  assert.equal(oplRefs.owner, 'one-person-lab');
  assert.equal(oplRefs.domain_repo_role, 'consumer_profile_ref_only');
  assert.equal(oplRefs.repo_local_file_required, false);
  assert.deepEqual(asStrings(oplRefs.refs), schemaRefs);

  assert.equal(retirementPolicy.policy_kind, 'script_wrapper_status_workbench_retirement');
  assert.equal(retirementPolicy.retirement_state, 'retained_only_as_migration_input_or_diagnostic_provenance');
  assertIncludesAll(asStrings(retirementPolicy.forbidden_repo_owned_surface_roles), [
    'generic_runtime_wrapper_owner',
    'generic_cli_mcp_skill_product_wrapper_owner',
    'generic_workbench_wrapper_owner',
    'compatibility_materialization_route_owner',
  ], 'retired wrapper roles');
  assertEveryFlagFalse(retirementPolicy.authority_boundary, 'legacy retirement authority');
});

test('controlled StageRun canary requires an owner closeout and forbids readiness overclaims', () => {
  const profile = readJson('contracts/stage_run_kernel_profile.json');
  const evidence = readJson('contracts/stage_run_canary_evidence.json');
  const canary = profile.agent_building_stage_run_canary as JsonObject;
  const toolPolicy = canary.tool_affordance_policy as JsonObject;
  const passCondition = canary.pass_condition as JsonObject;
  const overclaimBoundary = canary.overclaim_boundary as JsonObject;
  const operatorSummary = evidence.operator_summary as JsonObject;
  const evidenceOverclaim = evidence.overclaim_boundary as JsonObject;
  const closeout = evidence.closeout as JsonObject;

  assert.equal(canary.canary_id, 'oma-agent-building-stage-run-canary.v1');
  assert.equal(canary.controlled_canary_evidence_ref, 'contracts/stage_run_canary_evidence.json');
  assertIncludesAll(asStrings(canary.stage_sequence), [
    'intent-intake',
    'stage-decomposition-candidates',
    'mechanism-and-test-review',
    'owner-approval-or-typed-blocker',
  ], 'canary stages');

  assert.equal(toolPolicy.tool_refs_role, 'advisory_affordance_refs_only');
  assertEveryFlagFalse(
    toolPolicy,
    'tool affordance policy',
    (field) => field.startsWith('tool_refs_can_'),
  );
  assert.equal(passCondition.terminal_output, 'oma_owner_receipt_or_typed_blocker');
  assert.equal(passCondition.requires_owner_delta, true);
  assert.equal(passCondition.provider_completion_counts_as_pass, false);
  assert.equal(passCondition.file_presence_counts_as_pass, false);
  assert.equal(passCondition.read_model_counts_as_pass, false);

  assertIncludesAll(asStrings(overclaimBoundary.forbidden_claims), [
    'live_domain_progress',
    'target_agent_domain_ready',
    'target_quality_verdict',
    'production_ready',
    'default_agent_promotion',
  ], 'canary forbidden claims');
  assertEveryFlagFalse(overclaimBoundary.authority_boundary, 'canary overclaim authority');

  assert.equal(evidence.surface_kind, 'opl_stage_run_controlled_canary_evidence');
  assert.equal(evidence.domain_id, 'opl-meta-agent');
  assert.equal(evidence.canary_id, canary.canary_id);
  assert.equal(evidence.evidence_scope, 'controlled_fixture_not_live_domain_progress');
  assert.match(String(evidence.stage_run_ref), /^stage-run-ref:opl-meta-agent\//);
  assert.match(String(evidence.stage_manifest_ref), /^stage-manifest-ref:opl-meta-agent\//);

  assert.equal(operatorSummary.evidence_scope, evidence.evidence_scope);
  assert.equal(operatorSummary.stage_run_ref, evidence.stage_run_ref);
  assert.equal(operatorSummary.stage_manifest_ref, evidence.stage_manifest_ref);
  assert.deepEqual(asStrings(operatorSummary.visible_stage_sequence), asStrings(canary.stage_sequence));
  assert.deepEqual(asStrings(operatorSummary.visible_claims), asStrings(overclaimBoundary.allowed_claims));
  assert.deepEqual(asStrings(operatorSummary.blocked_claims), asStrings(overclaimBoundary.forbidden_claims));
  assert.equal(evidenceOverclaim.boundary_kind, overclaimBoundary.boundary_kind);
  assert.deepEqual(evidenceOverclaim.authority_boundary, overclaimBoundary.authority_boundary);

  Object.entries(evidence.strategy_trace as JsonObject).forEach(([traceKey, trace]) => {
    assert.ok(asStrings((trace as JsonObject).refs).length > 0, `${traceKey}.refs`);
  });
  const canaryToolPolicy = evidence.tool_affordance_policy as JsonObject;
  assert.equal(canaryToolPolicy.tool_refs_role, toolPolicy.tool_refs_role);
  assert.deepEqual(
    asObjects(canaryToolPolicy.tool_refs).map((entry) => entry.ref_kind),
    asStrings(toolPolicy.allowed_tool_ref_classes),
  );
  asObjects(canaryToolPolicy.tool_refs).forEach((toolRef) => {
    assert.equal(toolRef.role, 'affordance_not_workflow_step');
    assert.equal(toolRef.can_authorize_closeout, false);
  });

  assert.ok(['owner_receipt', 'typed_blocker'].includes(String(closeout.terminal_outcome)));
  assert.notEqual(Boolean(closeout.owner_receipt_ref), Boolean(closeout.typed_blocker_ref));
  const terminalRef = String(closeout.owner_receipt_ref ?? closeout.typed_blocker_ref);
  assert.match(terminalRef, /^(?:owner-receipt-ref|typed-blocker-ref):/);
  assert.equal(closeout.same_attempt_self_review, false);
  assert.equal(operatorSummary.terminal_outcome, closeout.terminal_outcome);
  assert.equal(operatorSummary.owner_receipt_ref_or_typed_blocker_ref, terminalRef);

  assert.equal(evidence.authority_boundary.refs_only, true);
  assertEveryFlagFalse(
    evidence.authority_boundary,
    'controlled canary authority',
    (field) => field !== 'refs_only',
  );
});
