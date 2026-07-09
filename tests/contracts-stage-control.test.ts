import assert from 'node:assert/strict';
import './contracts-stage-control-cases/stage-launch-contract.ts';
import test from 'node:test';
import {
  asObjects,
  asStrings,
  readJson,
} from './support/contracts.ts';
import { assertEveryFlagFalse } from './support/source-purity.ts';

test('opl-meta-agent stage plan owns domain routes without framework authority', () => {
  const stageControl = readJson('contracts/stage_control_plane.json');
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
  [
    'agent_lab_complete_control_plane',
    'standard_domain_agent_scaffold',
    'generated_interface_bundle',
  ].forEach((field) => assert.equal(stageControl.opl_runtime_dependency[field], true, field));

  assert.equal(stateIndexKernelAdoption.kernel_owner, 'one-person-lab');
  assert.equal(stateIndexKernelAdoption.index_owner, 'one-person-lab');
  assert.equal(stateIndexKernelAdoption.oma_role, 'refs_only_index_source');
  assert.equal(stateIndexKernelAdoption.sidecar_index_authority, 'derived_read_model_only');
  assertEveryFlagFalse(stateIndexKernelAdoption.authority_boundary, 'state index authority boundary');

  assert.equal(stageNativeContract.surface_kind, 'opl_stage_native_artifact_contract_bundle');
  assert.equal(stageNativeContract.target_domain_id, 'opl-meta-agent');
  assertEveryFlagFalse(
    stageNativeContract.authority_boundary,
    'stage-native authority boundary',
    (field) => field.startsWith('oma_can_'),
  );
  assertEveryFlagFalse(
    stageControl.authority_boundary,
    'stage-control authority boundary',
    (field) => field.startsWith('oma_can_') || field.startsWith('opl_can_'),
  );
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
