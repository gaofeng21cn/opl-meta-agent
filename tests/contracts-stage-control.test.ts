import assert from 'node:assert/strict';
import './contracts-stage-control-cases/stage-launch-contract.ts';
import test from 'node:test';
import {
  asObjects,
  asStrings,
  readJson,
} from './support/contracts.ts';
import { assertFalseFlags } from './support/source-purity.ts';

test('opl-meta-agent stage plan covers research, build, eval, optimization, delivery, and learning', () => {
  const stageControl = readJson('contracts/stage_control_plane.json');
  const stages = asObjects(stageControl.stages);
  const stageIds = stages.map((stage) => stage.stage_id);
  const stageArtifactKernelAdoption = readJson('contracts/stage_artifact_kernel_adoption.json');
  const stateIndexKernelAdoption = stageArtifactKernelAdoption.state_index_kernel_adoption;
  const stageNativeContract = stageControl.stage_native_artifact_contract;

  assert.equal(stageControl.surface_kind, 'family_stage_control_plane');
  assert.equal(stageControl.version, 'family-stage-control-plane.v1');
  assert.deepEqual(stageIds, [
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
  ]);
  assert.equal(stages.some((stage) => stage.stage_id === 'external-agent-takeover'), false);
  assert.doesNotMatch(JSON.stringify(stageControl), /external-agent-takeover|takeover-external-agent-test/);
  assert.deepEqual(
    stages.find((stage) => stage.stage_id === 'agent-skeleton-build')?.allowed_action_refs,
    ['build-agent-baseline'],
  );
  assert.deepEqual(
    stages.find((stage) => stage.stage_id === 'target-agent-takeover')?.allowed_action_refs,
    ['takeover-target-agent-test'],
  );
  assert.deepEqual(
    stages.find((stage) => stage.stage_id === 'optimizer-iteration')?.allowed_action_refs,
    ['improve-from-external-agent-lab-suite'],
  );
  assert.equal(stageControl.opl_runtime_dependency.agent_lab_complete_control_plane, true);
  assert.equal(stageControl.opl_runtime_dependency.standard_domain_agent_scaffold, true);
  assert.equal(stageControl.opl_runtime_dependency.generated_interface_bundle, true);
  assert.equal(stateIndexKernelAdoption.surface_kind, 'opl_state_index_kernel_sqlite_sidecar_adoption');
  assert.equal(stateIndexKernelAdoption.kernel_owner, 'one-person-lab');
  assert.equal(stateIndexKernelAdoption.index_owner, 'one-person-lab');
  assert.equal(stateIndexKernelAdoption.index_kind, 'sqlite_sidecar_index');
  assert.equal(stateIndexKernelAdoption.oma_role, 'refs_only_index_source');
  assert.equal(stateIndexKernelAdoption.sidecar_index_authority, 'derived_read_model_only');
  assert.equal(stateIndexKernelAdoption.derived_index_rebuildable, true);
  assert.equal(stateIndexKernelAdoption.indexed_subjects_must_be_refs_only, true);
  assert.deepEqual(asStrings(stateIndexKernelAdoption.allowed_index_ref_classes), [
    'candidate_package_ref',
    'agent_lab_result_ref',
    'developer_work_order_ref',
    'typed_blocker_ref',
    'mechanism_patch_proposal_ref',
  ]);
  assert.deepEqual(asStrings(stateIndexKernelAdoption.allowed_index_payload_roles), [
    'ref',
    'status',
    'source_ref',
    'receipt_ref',
    'blocker_ref',
    'proposal_ref',
  ]);
  assert.deepEqual(asStrings(stateIndexKernelAdoption.forbidden_index_payload_roles), [
    'target_truth_body',
    'target_runtime_state_body',
    'target_artifact_body',
    'target_memory_body',
    'target_quality_verdict_body',
    'target_export_verdict_body',
    'target_owner_receipt_body',
    'target_worktree_lifecycle_state',
    'queue_state',
    'attempt_ledger_body',
    'promotion_gate_verdict',
  ]);
  assertFalseFlags(stateIndexKernelAdoption.authority_boundary, 'oma_can_own_state_index_kernel oma_can_own_sqlite_sidecar_index oma_can_manage_queue oma_can_manage_attempt_ledger oma_can_manage_target_runtime oma_can_manage_target_worktree_lifecycle oma_can_manage_promotion_gate oma_can_write_target_truth oma_can_write_target_artifact_body oma_can_write_target_memory_body oma_can_write_target_quality_or_export_verdict oma_can_write_target_owner_receipt_body'.split(' '), 'stateIndexKernelAdoption.authority_boundary');
  assertFalseFlags(stageControl.authority_boundary, 'oma_can_own_state_index_kernel oma_can_own_sqlite_sidecar_index oma_can_manage_target_runtime oma_can_manage_queue oma_can_manage_attempt_ledger oma_can_manage_promotion_gate oma_can_manage_target_worktree_lifecycle oma_can_write_target_owner_receipt_body opl_can_write_domain_truth opl_can_write_memory_body opl_can_authorize_quality_or_export'.split(' '), 'stageControl.authority_boundary');
  assert.equal(stageNativeContract.surface_kind, 'opl_stage_native_artifact_contract_bundle');
  assert.equal(stageNativeContract.target_domain_id, 'opl-meta-agent');
  assertFalseFlags(stageNativeContract.authority_boundary, 'oma_can_generate_target_domain_owner_receipt oma_can_write_target_domain_truth oma_can_own_agent_lab_runner oma_can_own_queue oma_can_own_attempt_ledger oma_can_own_worktree_lifecycle oma_can_own_promotion_gate oma_can_own_app_shell oma_can_write_target_owner_closeout oma_can_create_stage_folder_runtime_state oma_can_write_target_owner_receipt_body oma_can_owner_promote_target_agent oma_can_manage_target_worktree_lifecycle'.split(' '), 'stageNativeContract.authority_boundary');
  [
    ['artifact_native_contract_refs', 'artifact-native-contract-ref', ''],
    ['stage_folder_contract_refs', 'stage-folder-contract-ref', ''],
    ['stage_json_refs', 'stage-json-ref', ''],
    ['attempt_json_ref_templates', 'stage-attempt-json-ref', '/{stage_attempt_id}'],
    ['export_ref_templates', 'stage-export-ref', '/{stage_attempt_id}'],
    ['lineage_ref_templates', 'stage-lineage-ref', '/{stage_attempt_id}'],
    ['retention_ref_templates', 'stage-retention-ref', '/{stage_attempt_id}'],
    ['physical_kernel_locator_refs', 'opl-physical-kernel-locator-ref', ''],
    ['conformance_refs', 'stage-artifact-conformance-ref', ''],
    ['workbench_consumption_refs', 'stage-artifact-workbench-consumption-ref', ''],
  ].forEach(([field, prefix, suffix]) => {
    assert.deepEqual(
      asStrings(stageNativeContract[field]),
      stageIds.map((stageId) => `${prefix}:opl-meta-agent/${stageId}${suffix}`),
    );
  });
});

test('stage executor policy candidates stay gated, refs-only, and non-default explicit', () => {
  const stageControl = readJson('contracts/stage_control_plane.json');

  assert.equal(stageControl.opl_runtime_dependency.agent_lab_stage_executor_policy_read_model, true);
  assert.equal(stageControl.authority_boundary.opl_can_switch_default_executor, false);
  assert.equal(stageControl.authority_boundary.oma_can_switch_default_executor, false);

  asObjects(stageControl.stages).forEach((stage) => {
    const label = String(stage.stage_id);
    const executorPolicy = stage.executor_policy_capability;
    assert.equal(
      stage.selected_executor.executor_kind,
      'codex_cli',
      `${label}.selected_executor remains Codex first-class`,
    );
    assert.equal(
      stage.selected_executor.executor_binding_ref,
      'default_codex_cli',
      `${label}.selected_executor binding remains default Codex`,
    );
    assert.ok(
      asStrings(stage.requires).includes('runtime-ref:stage-executor-policy-gate'),
      `${label}.requires stage executor policy gate`,
    );
    assert.ok(
      asStrings(stage.hard_blocker_refs).includes('blocker:missing_non_default_executor_binding_ref'),
      `${label}.hard_blocker_refs missing non-default binding blocker`,
    );

    assert.equal(executorPolicy.default_executor_kind, 'codex_cli', `${label}.default_executor_kind`);
    [
      'supports_stage_level_executor_policy',
      'non_default_executor_policy_allowed',
      'non_default_executor_requires_explicit_adapter',
      'non_default_executor_requires_executor_binding_ref',
      'agent_lab_trial_required_before_default_promotion',
    ].forEach((field) => assert.equal(executorPolicy[field], true, `${label}.${field}`));
    assert.deepEqual(executorPolicy.policy_fields, [
      'executor_kind',
      'model',
      'reasoning_effort',
      'provider',
      'executor_binding_ref',
      'executor_labels',
      'required_capabilities',
      'receipt_requirements',
    ]);
    assertFalseFlags(executorPolicy, 'quality_equivalence_claim_allowed default_executor_switch_allowed_by_oma'.split(' '), `${label}.executor_policy_capability`);

    const candidates = asObjects(stage.stage_executor_policy_candidates);
    assert.ok(candidates.length > 0, `${label}.stage_executor_policy_candidates should not be empty`);
    candidates.forEach((candidate) => {
      assert.equal(candidate.candidate_kind, 'stage_executor_policy_candidate', `${label}.candidate_kind`);
      assert.equal(candidate.stage_id, label, `${label}.candidate stage_id`);
      assert.equal(candidate.default_executor_kind, 'codex_cli', `${label}.candidate default_executor_kind`);
      assert.equal(
        candidate.candidate_status,
        'candidate_ref_only_requires_agent_lab_trial',
        `${label}.candidate_status`,
      );
      assert.equal(candidate.can_claim_quality_equivalence, false, `${label}.candidate quality equivalence`);
      assert.equal(candidate.can_change_default_executor, false, `${label}.candidate default switch`);
      assert.match(
        candidate.candidate_ref,
        new RegExp(`^stage-executor-policy-candidate:opl-meta-agent/${label}/`),
        `${label}.candidate_ref`,
      );
      assert.ok(asStrings(candidate.receipt_requirements).length > 0, `${label}.candidate receipts`);
      assert.ok(asStrings(candidate.required_capabilities).length > 0, `${label}.candidate capabilities`);

      if (candidate.executor_kind === 'codex_cli') {
        assert.equal(candidate.can_launch_without_explicit_binding, true, `${label}.codex launch binding`);
        assert.equal(
          String(candidate.executor_binding_ref).startsWith('opl://executors/codex-cli/'),
          true,
          `${label}.codex binding ref`,
        );
      } else {
        assert.equal(candidate.can_launch_without_explicit_binding, false, `${label}.non-default launch binding`);
        assert.ok(
          asStrings(candidate.receipt_requirements).includes('executor_binding_ref'),
          `${label}.non-default requires executor_binding_ref receipt`,
        );
      }
    });
  });

  const evalSuite = asObjects(stageControl.stages).find((stage) => stage.stage_id === 'eval-suite-build');
  assert.ok(evalSuite);
  const antigravityCandidate = asObjects(evalSuite.stage_executor_policy_candidates)
    .find((candidate) => candidate.executor_kind === 'antigravity_cli');
  assert.ok(antigravityCandidate);
  assert.equal(antigravityCandidate.model, 'gemini-3.5-flash');
  assert.equal(antigravityCandidate.reasoning_effort, 'high');
  assert.equal(antigravityCandidate.provider, 'google');
  assert.equal(
    antigravityCandidate.executor_binding_ref,
    'executor-binding:antigravity/opl-meta-agent-eval-suite-build-html-authoring',
  );
  assert.ok(asStrings(antigravityCandidate.required_capabilities).includes('html_generation'));
  assert.ok(asStrings(antigravityCandidate.required_capabilities).includes('visual_layout_iteration'));
  assert.ok(
    asStrings(antigravityCandidate.receipt_requirements)
      .includes('executor-receipt-ref:eval-suite-build/antigravity-cli'),
  );
  assert.ok(
    asStrings(antigravityCandidate.receipt_requirements).includes('agent-lab-stage-executor-policy-trial-ref'),
  );

  const research = asObjects(stageControl.stages).find((stage) => stage.stage_id === 'web-experience-research');
  assert.ok(research);
  const claudeCandidate = asObjects(research.stage_executor_policy_candidates)
    .find((candidate) => candidate.executor_kind === 'claude_code');
  assert.ok(claudeCandidate);
  assert.equal(claudeCandidate.executor_binding_ref, null);
  assert.equal(claudeCandidate.can_launch_without_explicit_binding, false);
  assert.ok(asStrings(claudeCandidate.receipt_requirements).includes('executor_binding_ref'));
  assert.ok(
    asStrings(research.hard_blocker_refs).includes('blocker:missing_non_default_executor_binding_ref'),
    'web-experience-research should fail closed without a non-default executor binding ref',
  );
});
