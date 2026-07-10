import assert from 'node:assert/strict';
import './contracts-stage-control-cases/stage-launch-contract.ts';
import test from 'node:test';
import {
  asObjects,
  asStrings,
  readJson,
} from './support/contracts.ts';
import {
  assertExactFalseFlags,
  assertFalseFlags,
} from './support/source-purity.ts';

const stateIndexAuthorityKeys = 'oma_can_own_state_index_kernel oma_can_own_sqlite_sidecar_index oma_can_manage_queue oma_can_manage_attempt_ledger oma_can_manage_target_runtime oma_can_manage_target_worktree_lifecycle oma_can_manage_promotion_gate oma_can_write_target_truth oma_can_write_target_artifact_body oma_can_write_target_memory_body oma_can_write_target_quality_or_export_verdict oma_can_write_target_owner_receipt_body'.split(' ');
const stageNativeAuthorityKeys = 'oma_can_own_agent_lab_runner oma_can_own_queue oma_can_own_attempt_ledger oma_can_own_worktree_lifecycle oma_can_own_promotion_gate oma_can_own_app_shell oma_can_write_target_owner_closeout oma_can_create_stage_folder_runtime_state oma_can_write_stage_folder_runtime_state oma_can_generate_target_domain_owner_receipt oma_can_write_target_owner_receipt_body oma_can_write_target_domain_truth oma_can_write_target_domain_memory_body oma_can_mutate_target_domain_artifact_body oma_can_authorize_target_quality_or_export oma_can_owner_promote_target_agent oma_can_promote_default_agent_without_gate oma_can_manage_target_worktree_lifecycle'.split(' ');
const stageControlAuthorityKeys = 'opl_can_write_domain_truth opl_can_write_memory_body opl_can_authorize_quality_or_export opl_can_switch_default_executor oma_can_switch_default_executor oma_can_own_state_index_kernel oma_can_own_sqlite_sidecar_index oma_can_manage_target_runtime oma_can_manage_queue oma_can_manage_attempt_ledger oma_can_manage_promotion_gate oma_can_manage_target_worktree_lifecycle oma_can_write_target_owner_receipt_body'.split(' ');

test('opl-meta-agent stage plan owns domain routes without framework authority', () => {
  const stageControl = readJson('contracts/stage_control_plane.json');
  const stageManifest = readJson('agent/stages/manifest.json');
  const stages = asObjects(stageControl.stages);
  const stageArtifactKernelAdoption = readJson('contracts/stage_artifact_kernel_adoption.json');
  const stateIndexKernelAdoption = stageArtifactKernelAdoption.state_index_kernel_adoption;
  const stageNativeContract = stageControl.stage_native_artifact_contract;
  const stageIds = [
    'intent-intake',
    'web-experience-research',
    'stage-decomposition',
    'agent-skeleton-build',
    'eval-suite-build',
    'baseline-run',
    'target-agent-takeover',
    'optimizer-iteration',
    'baseline-delivery',
    'trajectory-learning-intake',
    'online-learning',
  ];

  assert.equal(stageControl.surface_kind, 'family_stage_control_plane');
  assert.equal(stageControl.version, 'family-stage-control-plane.v1');
  assert.deepEqual(asObjects(stageManifest.stages).map((stage) => stage.stage_id), stageIds);
  assert.deepEqual(stages.map((stage) => stage.stage_id), stageIds);
  assert.doesNotMatch(JSON.stringify(stageControl), /external-agent-takeover|takeover-external-agent-test/);

  [
    ['agent-skeleton-build', 'build-agent-baseline'],
    ['target-agent-takeover', 'takeover-target-agent-test'],
    ['optimizer-iteration', 'improve-from-external-agent-lab-suite'],
  ].forEach(([stageId, actionId]) => {
    const stage = stages.find((candidate) => candidate.stage_id === stageId);
    assert.deepEqual(stage?.allowed_action_refs, [actionId]);
  });
  const takeoverStage = stages.find((stage) => stage.stage_id === 'target-agent-takeover');
  assert.ok(takeoverStage);
  const takeoverOutputs = asStrings(asObjects(takeoverStage.outputs)[0].ref);
  assert.deepEqual(takeoverOutputs, [
    'agent_lab_suite_seed_ref',
    'foundry_lab_evaluation_work_order_ref',
    'gated_self_evolution_candidate_ref',
    'mechanism_candidate_ref',
  ]);
  assert.equal(takeoverOutputs.includes('testing_takeover_receipt_ref'), false);
  assert.equal(takeoverStage.authority_boundary.oma_can_execute_agent_lab_suite, false);
  assert.equal(takeoverStage.authority_boundary.oma_can_write_owner_receipt_body, false);
  const baselineRunStage = stages.find((stage) => stage.stage_id === 'baseline-run');
  assert.ok(baselineRunStage);
  assert.deepEqual(asStrings(asObjects(baselineRunStage.outputs)[0].ref), [
    'agent_lab_suite_seed_ref',
    'foundry_lab_evaluation_work_order_ref',
    'expected_evaluation_result_ref',
  ]);
  assert.equal(baselineRunStage.authority_boundary.oma_can_execute_agent_lab_suite, false);
  assert.equal(baselineRunStage.authority_boundary.oma_can_write_agent_lab_result, false);
  [
    'agent_lab_complete_control_plane',
    'standard_domain_agent_scaffold',
    'generated_interface_bundle',
  ].forEach((field) => assert.equal(stageControl.opl_runtime_dependency[field], true, field));

  assert.equal(stateIndexKernelAdoption.kernel_owner, 'one-person-lab');
  assert.equal(stateIndexKernelAdoption.index_owner, 'one-person-lab');
  assert.equal(stateIndexKernelAdoption.oma_role, 'refs_only_index_source');
  assert.equal(stateIndexKernelAdoption.sidecar_index_authority, 'derived_read_model_only');
  assertExactFalseFlags(stateIndexKernelAdoption.authority_boundary, stateIndexAuthorityKeys, 'state index authority boundary');

  assert.equal(stageNativeContract.surface_kind, 'opl_stage_native_artifact_contract_bundle');
  assert.equal(stageNativeContract.target_domain_id, 'opl-meta-agent');
  assert.deepEqual(
    Object.keys(stageNativeContract.authority_boundary).sort(),
    [...stageNativeAuthorityKeys, 'opl_framework_owns_stage_folder_lifecycle', 'oma_role'].sort(),
  );
  assert.equal(stageNativeContract.authority_boundary.opl_framework_owns_stage_folder_lifecycle, true);
  assert.equal(stageNativeContract.authority_boundary.oma_role, 'contract_compiler_and_refs_materializer');
  assertFalseFlags(stageNativeContract.authority_boundary, stageNativeAuthorityKeys, 'stage-native authority boundary');
  assert.deepEqual(
    Object.keys(stageControl.authority_boundary).sort(),
    [...stageControlAuthorityKeys, 'domain_truth_owner', 'opl_role'].sort(),
  );
  assertFalseFlags(stageControl.authority_boundary, stageControlAuthorityKeys, 'stage-control authority boundary');
});

test('stage executor candidates fail closed without explicit non-default bindings', () => {
  const stageControl = readJson('contracts/stage_control_plane.json');
  const stages = asObjects(stageControl.stages);

  assert.equal(stageControl.opl_runtime_dependency.agent_lab_stage_executor_policy_read_model, true);
  assert.equal(stageControl.authority_boundary.opl_can_switch_default_executor, false);
  assert.equal(stageControl.authority_boundary.oma_can_switch_default_executor, false);

  stages.forEach((stage) => {
    const label = String(stage.stage_id);
    const executorPolicy = stage.executor_policy_capability;
    assert.equal(stage.selected_executor.executor_kind, 'codex_cli', `${label}.selected_executor`);
    assert.equal(stage.selected_executor.executor_binding_ref, 'default_codex_cli', `${label}.binding`);
    assert.ok(asStrings(stage.requires).includes('runtime-ref:stage-executor-policy-gate'));
    assert.ok(asStrings(stage.hard_blocker_refs).includes('blocker:missing_non_default_executor_binding_ref'));
    assert.equal(executorPolicy.default_executor_kind, 'codex_cli');
    assert.equal(executorPolicy.non_default_executor_requires_explicit_adapter, true);
    assert.equal(executorPolicy.non_default_executor_requires_executor_binding_ref, true);
    assert.equal(executorPolicy.agent_lab_trial_required_before_default_promotion, true);
    assert.equal(executorPolicy.quality_equivalence_claim_allowed, false);
    assert.equal(executorPolicy.default_executor_switch_allowed_by_oma, false);

    asObjects(stage.stage_executor_policy_candidates).forEach((candidate) => {
      assert.equal(candidate.candidate_kind, 'stage_executor_policy_candidate');
      assert.equal(candidate.stage_id, label);
      assert.equal(candidate.default_executor_kind, 'codex_cli');
      assert.equal(candidate.candidate_status, 'candidate_ref_only_requires_agent_lab_trial');
      assert.equal(candidate.can_claim_quality_equivalence, false);
      assert.equal(candidate.can_change_default_executor, false);
      if (candidate.executor_kind === 'codex_cli') {
        assert.equal(candidate.can_launch_without_explicit_binding, true);
      } else {
        assert.equal(candidate.can_launch_without_explicit_binding, false);
        assert.ok(asStrings(candidate.receipt_requirements).includes('executor_binding_ref'));
      }
    });
  });

  const research = stages.find((stage) => stage.stage_id === 'web-experience-research');
  const unboundCandidate = asObjects(research?.stage_executor_policy_candidates)
    .find((candidate) => candidate.executor_kind === 'claude_code');
  assert.ok(unboundCandidate);
  assert.equal(unboundCandidate.executor_binding_ref, null);
  assert.equal(unboundCandidate.can_launch_without_explicit_binding, false);
  assert.ok(asStrings(research?.hard_blocker_refs).includes('blocker:missing_non_default_executor_binding_ref'));
});
