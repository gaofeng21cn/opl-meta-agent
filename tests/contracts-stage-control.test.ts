import assert from 'node:assert/strict';
import './contracts-stage-control-cases/stage-launch-contract.ts';
import test from 'node:test';
import {
  asObjects,
  asStrings,
  readJson,
} from './support/contracts.ts';

test('opl-meta-agent stage plan covers research, build, eval, optimization, delivery, and learning', () => {
  const stageControl = readJson('contracts/stage_control_plane.json');
  const stageArtifactKernelAdoption = readJson('contracts/stage_artifact_kernel_adoption.json');
  const stateIndexKernelAdoption = stageArtifactKernelAdoption.state_index_kernel_adoption;

  assert.equal(stageControl.surface_kind, 'family_stage_control_plane');
  assert.equal(stageControl.version, 'family-stage-control-plane.v1');
  assert.deepEqual(asObjects(stageControl.stages).map((stage) => stage.stage_id), [
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
  assert.equal(asObjects(stageControl.stages).some((stage) => stage.stage_id === 'external-agent-takeover'), false);
  assert.doesNotMatch(JSON.stringify(stageControl), /external-agent-takeover|takeover-external-agent-test/);
  assert.deepEqual(
    asObjects(stageControl.stages).find((stage) => stage.stage_id === 'agent-skeleton-build')?.allowed_action_refs,
    ['build-agent-baseline'],
  );
  assert.deepEqual(
    asObjects(stageControl.stages).find((stage) => stage.stage_id === 'target-agent-takeover')?.allowed_action_refs,
    ['takeover-target-agent-test'],
  );
  assert.deepEqual(
    asObjects(stageControl.stages).find((stage) => stage.stage_id === 'optimizer-iteration')?.allowed_action_refs,
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
  assert.equal(stateIndexKernelAdoption.authority_boundary.oma_can_own_state_index_kernel, false);
  assert.equal(stateIndexKernelAdoption.authority_boundary.oma_can_own_sqlite_sidecar_index, false);
  assert.equal(stateIndexKernelAdoption.authority_boundary.oma_can_manage_queue, false);
  assert.equal(stateIndexKernelAdoption.authority_boundary.oma_can_manage_attempt_ledger, false);
  assert.equal(stateIndexKernelAdoption.authority_boundary.oma_can_manage_target_runtime, false);
  assert.equal(stateIndexKernelAdoption.authority_boundary.oma_can_manage_target_worktree_lifecycle, false);
  assert.equal(stateIndexKernelAdoption.authority_boundary.oma_can_manage_promotion_gate, false);
  assert.equal(stateIndexKernelAdoption.authority_boundary.oma_can_write_target_truth, false);
  assert.equal(stateIndexKernelAdoption.authority_boundary.oma_can_write_target_artifact_body, false);
  assert.equal(stateIndexKernelAdoption.authority_boundary.oma_can_write_target_memory_body, false);
  assert.equal(stateIndexKernelAdoption.authority_boundary.oma_can_write_target_quality_or_export_verdict, false);
  assert.equal(stateIndexKernelAdoption.authority_boundary.oma_can_write_target_owner_receipt_body, false);
  assert.equal(stageControl.authority_boundary.oma_can_own_state_index_kernel, false);
  assert.equal(stageControl.authority_boundary.oma_can_own_sqlite_sidecar_index, false);
  assert.equal(stageControl.authority_boundary.oma_can_manage_target_runtime, false);
  assert.equal(stageControl.authority_boundary.oma_can_manage_queue, false);
  assert.equal(stageControl.authority_boundary.oma_can_manage_attempt_ledger, false);
  assert.equal(stageControl.authority_boundary.oma_can_manage_promotion_gate, false);
  assert.equal(stageControl.authority_boundary.oma_can_manage_target_worktree_lifecycle, false);
  assert.equal(stageControl.authority_boundary.oma_can_write_target_owner_receipt_body, false);
  assert.equal(stageControl.stage_native_artifact_contract.surface_kind, 'opl_stage_native_artifact_contract_bundle');
  assert.equal(stageControl.stage_native_artifact_contract.target_domain_id, 'opl-meta-agent');
  assert.equal(stageControl.stage_native_artifact_contract.authority_boundary.oma_can_generate_target_domain_owner_receipt, false);
  assert.equal(stageControl.stage_native_artifact_contract.authority_boundary.oma_can_write_target_domain_truth, false);
  assert.deepEqual(
    asStrings(stageControl.stage_native_artifact_contract.artifact_native_contract_refs),
    asObjects(stageControl.stages).map((stage) => `artifact-native-contract-ref:opl-meta-agent/${stage.stage_id}`),
  );
  assert.deepEqual(
    asStrings(stageControl.stage_native_artifact_contract.stage_folder_contract_refs),
    asObjects(stageControl.stages).map((stage) => `stage-folder-contract-ref:opl-meta-agent/${stage.stage_id}`),
  );
  assert.deepEqual(
    asStrings(stageControl.stage_native_artifact_contract.stage_json_refs),
    asObjects(stageControl.stages).map((stage) => `stage-json-ref:opl-meta-agent/${stage.stage_id}`),
  );
  assert.deepEqual(
    asStrings(stageControl.stage_native_artifact_contract.attempt_json_ref_templates),
    asObjects(stageControl.stages).map((stage) => `stage-attempt-json-ref:opl-meta-agent/${stage.stage_id}/{stage_attempt_id}`),
  );
  assert.deepEqual(
    asStrings(stageControl.stage_native_artifact_contract.export_ref_templates),
    asObjects(stageControl.stages).map((stage) => `stage-export-ref:opl-meta-agent/${stage.stage_id}/{stage_attempt_id}`),
  );
  assert.deepEqual(
    asStrings(stageControl.stage_native_artifact_contract.lineage_ref_templates),
    asObjects(stageControl.stages).map((stage) => `stage-lineage-ref:opl-meta-agent/${stage.stage_id}/{stage_attempt_id}`),
  );
  assert.deepEqual(
    asStrings(stageControl.stage_native_artifact_contract.retention_ref_templates),
    asObjects(stageControl.stages).map((stage) => `stage-retention-ref:opl-meta-agent/${stage.stage_id}/{stage_attempt_id}`),
  );
  assert.deepEqual(
    asStrings(stageControl.stage_native_artifact_contract.physical_kernel_locator_refs),
    asObjects(stageControl.stages).map((stage) => `opl-physical-kernel-locator-ref:opl-meta-agent/${stage.stage_id}`),
  );
  assert.deepEqual(
    asStrings(stageControl.stage_native_artifact_contract.conformance_refs),
    asObjects(stageControl.stages).map((stage) => `stage-artifact-conformance-ref:opl-meta-agent/${stage.stage_id}`),
  );
  assert.deepEqual(
    asStrings(stageControl.stage_native_artifact_contract.workbench_consumption_refs),
    asObjects(stageControl.stages).map((stage) => `stage-artifact-workbench-consumption-ref:opl-meta-agent/${stage.stage_id}`),
  );
  assert.equal(stageControl.stage_native_artifact_contract.authority_boundary.oma_can_own_agent_lab_runner, false);
  assert.equal(stageControl.stage_native_artifact_contract.authority_boundary.oma_can_own_queue, false);
  assert.equal(stageControl.stage_native_artifact_contract.authority_boundary.oma_can_own_attempt_ledger, false);
  assert.equal(stageControl.stage_native_artifact_contract.authority_boundary.oma_can_own_worktree_lifecycle, false);
  assert.equal(stageControl.stage_native_artifact_contract.authority_boundary.oma_can_own_promotion_gate, false);
  assert.equal(stageControl.stage_native_artifact_contract.authority_boundary.oma_can_own_app_shell, false);
  assert.equal(stageControl.stage_native_artifact_contract.authority_boundary.oma_can_write_target_owner_closeout, false);
  assert.equal(stageControl.stage_native_artifact_contract.authority_boundary.oma_can_create_stage_folder_runtime_state, false);
  assert.equal(stageControl.stage_native_artifact_contract.authority_boundary.oma_can_write_target_owner_receipt_body, false);
  assert.equal(stageControl.stage_native_artifact_contract.authority_boundary.oma_can_owner_promote_target_agent, false);
  assert.equal(stageControl.stage_native_artifact_contract.authority_boundary.oma_can_manage_target_worktree_lifecycle, false);
  assert.equal(stageControl.authority_boundary.opl_can_write_domain_truth, false);
  assert.equal(stageControl.authority_boundary.opl_can_write_memory_body, false);
  assert.equal(stageControl.authority_boundary.opl_can_authorize_quality_or_export, false);
});

test('stage executor policy candidates stay gated, refs-only, and non-default explicit', () => {
  const stageControl = readJson('contracts/stage_control_plane.json');

  assert.equal(stageControl.opl_runtime_dependency.agent_lab_stage_executor_policy_read_model, true);
  assert.equal(stageControl.authority_boundary.opl_can_switch_default_executor, false);
  assert.equal(stageControl.authority_boundary.oma_can_switch_default_executor, false);

  asObjects(stageControl.stages).forEach((stage) => {
    const label = String(stage.stage_id);
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

    assert.equal(
      stage.executor_policy_capability.supports_stage_level_executor_policy,
      true,
      `${label}.supports_stage_level_executor_policy`,
    );
    assert.equal(stage.executor_policy_capability.default_executor_kind, 'codex_cli', `${label}.default_executor_kind`);
    assert.equal(
      stage.executor_policy_capability.non_default_executor_policy_allowed,
      true,
      `${label}.non_default_executor_policy_allowed`,
    );
    assert.equal(
      stage.executor_policy_capability.non_default_executor_requires_explicit_adapter,
      true,
      `${label}.non_default_executor_requires_explicit_adapter`,
    );
    assert.equal(
      stage.executor_policy_capability.non_default_executor_requires_executor_binding_ref,
      true,
      `${label}.non_default_executor_requires_executor_binding_ref`,
    );
    assert.deepEqual(stage.executor_policy_capability.policy_fields, [
      'executor_kind',
      'model',
      'reasoning_effort',
      'provider',
      'executor_binding_ref',
      'executor_labels',
      'required_capabilities',
      'receipt_requirements',
    ]);
    assert.equal(
      stage.executor_policy_capability.agent_lab_trial_required_before_default_promotion,
      true,
      `${label}.agent_lab_trial_required_before_default_promotion`,
    );
    assert.equal(
      stage.executor_policy_capability.quality_equivalence_claim_allowed,
      false,
      `${label}.quality_equivalence_claim_allowed`,
    );
    assert.equal(
      stage.executor_policy_capability.default_executor_switch_allowed_by_oma,
      false,
      `${label}.default_executor_switch_allowed_by_oma`,
    );

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
