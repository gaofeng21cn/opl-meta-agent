import test from 'node:test';
import {
  assert,
  asObjects,
  asStrings,
  readJson,
  assertCompleteStageNativeRefs,
  opl10PrincipleRefs,
  userStageLogRequiredFields,
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
    'external-agent-takeover',
    'optimizer-iteration',
    'baseline-delivery',
    'trajectory-learning-intake',
    'online-learning',
  ]);
  assert.deepEqual(
    asObjects(stageControl.stages).find((stage) => stage.stage_id === 'agent-skeleton-build')?.allowed_action_refs,
    ['build-agent-baseline'],
  );
  assert.deepEqual(
    asObjects(stageControl.stages).find((stage) => stage.stage_id === 'external-agent-takeover')?.allowed_action_refs,
    ['takeover-external-agent-test'],
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

test('stage launch contract is Codex-first, receipted, and OPL-10 bounded', () => {
  const stageControl = readJson('contracts/stage_control_plane.json');

  asObjects(stageControl.stages).forEach((stage) => {
    const label = String(stage.stage_id);
    assert.equal(stage.selected_executor.executor_kind, 'codex_cli', `${label}.selected_executor.executor_kind`);
    assert.equal(stage.selected_executor.executor_binding_ref, 'default_codex_cli', `${label}.selected_executor.executor_binding_ref`);
    assert.equal(
      stage.selected_executor.default_executor,
      label === 'intent-intake',
      `${label}.selected_executor.default_executor`,
    );
    assert.equal(
      stage.executor_binding.binding_kind,
      'codex_cli_first_class_stage_executor',
      `${label}.executor_binding.binding_kind`,
    );
    assert.equal(stage.executor_binding.executor_ref, 'executor:codex-cli', `${label}.executor_ref`);
    assert.equal(stage.executor_binding.executor_owner, 'OPL Framework', `${label}.executor_owner`);
    assert.equal(stage.executor_binding.launch_surface_owner, 'one-person-lab', `${label}.launch_surface_owner`);
    assert.equal(stage.executor_binding.domain_pack_owner, 'opl-meta-agent', `${label}.domain_pack_owner`);
    assert.equal(stage.executor_binding.adapter_required, false, `${label}.adapter_required`);
    assert.equal(
      stage.executor_binding.non_codex_executor_requires_explicit_adapter,
      true,
      `${label}.non_codex_executor_requires_explicit_adapter`,
    );
    assert.equal(
      stage.executor_binding.codex_first_expert_judgment_required,
      true,
      `${label}.codex_first_expert_judgment_required`,
    );

    const requires = asStrings(stage.requires);
    const ensures = asStrings(stage.ensures);
    const expectedReceiptRefs = asStrings(stage.expected_receipt_refs);
    const hardBlockerRefs = asStrings(stage.hard_blocker_refs);
    const stageContract = stage.stage_contract;
    const userStageLog = stageContract.user_stage_log_contract;
    const stageNativeArtifactContract = stageContract.stage_native_artifact_contract;
    const progressDeltaPolicy = stageContract.progress_delta_policy;
    const typedBlockerLineagePolicy = stageContract.typed_blocker_lineage_policy;

    assert.ok(requires.includes(`stage:${label}`), `${label}.requires should include stage ref`);
    assert.ok(
      requires.includes(`artifact-native-contract-ref:opl-meta-agent/${label}`),
      `${label}.requires artifact-native contract ref`,
    );
    assert.ok(requires.includes('runtime-ref:stage-attempt-ledger'), `${label}.requires should include stage ledger`);
    assert.ok(
      requires.includes('runtime-ref:generated-interface-bundle'),
      `${label}.requires should include generated interface bundle`,
    );
    assert.ok(
      requires.includes('runtime-ref:stage-progress-log-user-stage-log'),
      `${label}.requires should include user stage log projection`,
    );
    assert.ok(ensures.includes(`stage-attempt-receipt-ref:${label}`), `${label}.ensures stage receipt`);
    assert.ok(ensures.includes(`executor-receipt-ref:${label}/codex-cli`), `${label}.ensures executor receipt`);
    assert.ok(ensures.includes(`no-forbidden-write-proof-ref:${label}`), `${label}.ensures boundary proof`);
    assert.ok(ensures.includes(`independent-ai-review-ref:${label}`), `${label}.ensures AI review`);
    assert.ok(ensures.includes(`stage-user-log-ref:${label}`), `${label}.ensures user stage log`);
    assert.ok(
      ensures.includes(`stage-folder-contract-ref:opl-meta-agent/${label}`),
      `${label}.ensures stage folder contract`,
    );
    assert.ok(
      ensures.includes(`stage-json-ref:opl-meta-agent/${label}`),
      `${label}.ensures stage json`,
    );
    assert.ok(
      ensures.includes(`stage-attempt-json-ref:opl-meta-agent/${label}/{stage_attempt_id}`),
      `${label}.ensures attempt json`,
    );
    assert.ok(
      ensures.includes(`stage-manifest-ref:opl-meta-agent/${label}/{stage_attempt_id}`),
      `${label}.ensures stage manifest`,
    );
    assert.ok(
      ensures.includes(`stage-attempt-receipt-ref:opl-meta-agent/${label}/{stage_attempt_id}`),
      `${label}.ensures stage-native receipt`,
    );
    assert.ok(
      ensures.includes(`stage-current-pointer-ref:opl-meta-agent/${label}`),
      `${label}.ensures current pointer`,
    );
    assert.ok(
      ensures.includes(`canonical-artifact-ref:opl-meta-agent/${label}`),
      `${label}.ensures canonical artifact ref`,
    );
    assert.ok(
      ensures.includes(`stage-export-ref:opl-meta-agent/${label}/{stage_attempt_id}`),
      `${label}.ensures export ref`,
    );
    assert.ok(
      ensures.includes(`stage-lineage-ref:opl-meta-agent/${label}/{stage_attempt_id}`),
      `${label}.ensures lineage ref`,
    );
    assert.ok(
      ensures.includes(`stage-retention-ref:opl-meta-agent/${label}/{stage_attempt_id}`),
      `${label}.ensures retention ref`,
    );
    assert.ok(
      ensures.includes(`opl-physical-kernel-locator-ref:opl-meta-agent/${label}`),
      `${label}.ensures physical kernel locator ref`,
    );
    assert.ok(
      ensures.includes(`stage-artifact-conformance-ref:opl-meta-agent/${label}`),
      `${label}.ensures conformance ref`,
    );
    assert.ok(
      ensures.includes(`stage-artifact-workbench-consumption-ref:opl-meta-agent/${label}`),
      `${label}.ensures workbench consumption ref`,
    );
    assert.ok(
      expectedReceiptRefs.includes(`boundary-receipt-ref:${label}/refs-only`),
      `${label}.expected_receipt_refs boundary receipt`,
    );
    assert.ok(
      expectedReceiptRefs.includes(`independent-ai-review-ref:${label}`),
      `${label}.expected_receipt_refs AI review`,
    );
    assert.ok(
      expectedReceiptRefs.includes(`stage-user-log-ref:${label}`),
      `${label}.expected_receipt_refs user stage log`,
    );
    assert.ok(
      expectedReceiptRefs.includes(`artifact-native-contract-ref:opl-meta-agent/${label}`),
      `${label}.expected_receipt_refs artifact-native contract`,
    );
    assert.ok(
      expectedReceiptRefs.includes(`stage-folder-contract-ref:opl-meta-agent/${label}`),
      `${label}.expected_receipt_refs stage folder`,
    );
    assert.ok(
      expectedReceiptRefs.includes(`stage-json-ref:opl-meta-agent/${label}`),
      `${label}.expected_receipt_refs stage json`,
    );
    assert.ok(
      expectedReceiptRefs.includes(`stage-attempt-json-ref:opl-meta-agent/${label}/{stage_attempt_id}`),
      `${label}.expected_receipt_refs attempt json`,
    );
    assert.ok(
      expectedReceiptRefs.includes(`stage-manifest-ref:opl-meta-agent/${label}/{stage_attempt_id}`),
      `${label}.expected_receipt_refs manifest`,
    );
    assert.ok(
      expectedReceiptRefs.includes(`stage-attempt-receipt-ref:opl-meta-agent/${label}/{stage_attempt_id}`),
      `${label}.expected_receipt_refs stage-native receipt`,
    );
    assert.ok(
      expectedReceiptRefs.includes(`stage-typed-blocker-ref:opl-meta-agent/${label}/{stage_attempt_id}`),
      `${label}.expected_receipt_refs blocker`,
    );
    assert.ok(
      expectedReceiptRefs.includes(`stage-current-pointer-ref:opl-meta-agent/${label}`),
      `${label}.expected_receipt_refs current pointer`,
    );
    assert.ok(
      expectedReceiptRefs.includes(`canonical-artifact-ref:opl-meta-agent/${label}`),
      `${label}.expected_receipt_refs canonical artifact`,
    );
    assert.ok(
      expectedReceiptRefs.includes(`stage-export-ref:opl-meta-agent/${label}/{stage_attempt_id}`),
      `${label}.expected_receipt_refs export`,
    );
    assert.ok(
      expectedReceiptRefs.includes(`stage-lineage-ref:opl-meta-agent/${label}/{stage_attempt_id}`),
      `${label}.expected_receipt_refs lineage`,
    );
    assert.ok(
      expectedReceiptRefs.includes(`stage-retention-ref:opl-meta-agent/${label}/{stage_attempt_id}`),
      `${label}.expected_receipt_refs retention`,
    );
    assert.ok(
      expectedReceiptRefs.includes(`opl-physical-kernel-locator-ref:opl-meta-agent/${label}`),
      `${label}.expected_receipt_refs physical kernel locator`,
    );
    assert.ok(
      expectedReceiptRefs.includes(`stage-artifact-conformance-ref:opl-meta-agent/${label}`),
      `${label}.expected_receipt_refs conformance`,
    );
    assert.ok(
      expectedReceiptRefs.includes(`stage-artifact-workbench-consumption-ref:opl-meta-agent/${label}`),
      `${label}.expected_receipt_refs workbench consumption`,
    );
    assert.equal(
      stageNativeArtifactContract.surface_kind,
      'opl_stage_native_artifact_contract',
      `${label}.stage_native_artifact_contract.surface_kind`,
    );
    assert.equal(
      stageNativeArtifactContract.artifact_native_contract_ref,
      `artifact-native-contract-ref:opl-meta-agent/${label}`,
      `${label}.artifact_native_contract_ref`,
    );
    assert.equal(
      stageNativeArtifactContract.stage_folder_contract.stage_folder_contract_ref,
      `stage-folder-contract-ref:opl-meta-agent/${label}`,
      `${label}.stage_folder_contract_ref`,
    );
    assertCompleteStageNativeRefs(stageNativeArtifactContract, label);
    assertCompleteStageNativeRefs(stageNativeArtifactContract.stage_folder_contract, label);
    assert.equal(stageNativeArtifactContract.stage_json_contract.stage_json_file_name, 'stage.json');
    assert.equal(stageNativeArtifactContract.attempt_json_contract.attempt_json_file_name, 'attempt.json');
    assert.equal(stageNativeArtifactContract.receipt_contract.receipt_file_name, 'receipt.json');
    assert.equal(stageNativeArtifactContract.current_pointer_contract.current_file_name, 'current.json');
    assert.equal(stageNativeArtifactContract.canonical_artifact_contract.canonical_file_name, 'canonical.json');
    assert.equal(stageNativeArtifactContract.export_contract.export_file_name, 'export.json');
    assert.equal(stageNativeArtifactContract.lineage_contract.lineage_file_name, 'lineage.json');
    assert.equal(stageNativeArtifactContract.retention_contract.retention_file_name, 'retention.json');
    assert.ok(
      asStrings(stageNativeArtifactContract.stage_folder_contract.required_files).includes('physical_kernel_locator.json'),
      `${label}.stage_folder_contract.required_files physical kernel locator`,
    );
    assert.ok(
      asStrings(stageNativeArtifactContract.stage_folder_contract.required_files).includes('conformance.json'),
      `${label}.stage_folder_contract.required_files conformance`,
    );
    assert.ok(
      asStrings(stageNativeArtifactContract.stage_folder_contract.required_files).includes('workbench_consumption.json'),
      `${label}.stage_folder_contract.required_files workbench consumption`,
    );
    assert.equal(
      stageNativeArtifactContract.physical_kernel_locator_contract.source_contract_ref,
      'contracts/opl-framework/stage-artifact-runtime-contract.json',
      `${label}.physical_kernel_locator_contract.source_contract_ref`,
    );
    assert.equal(
      stageNativeArtifactContract.physical_kernel_locator_contract.oma_materializes_ref_template_only,
      true,
      `${label}.physical_kernel_locator_contract.refs_only`,
    );
    assert.equal(
      stageNativeArtifactContract.physical_kernel_locator_contract.oma_can_create_runtime_state,
      false,
      `${label}.physical_kernel_locator_contract.no_runtime_state_create`,
    );
    assert.deepEqual(
      asStrings(stageNativeArtifactContract.physical_kernel_locator_contract.required_attempt_entries),
      ['attempt.json', 'manifest.json', 'inputs/', 'outputs/', 'evidence/', 'receipts/'],
      `${label}.physical_kernel_locator_contract.required_attempt_entries`,
    );
    assert.equal(
      stageNativeArtifactContract.conformance_contract.surface_kind,
      'opl_stage_artifact_runtime_conformance',
      `${label}.conformance_contract.surface_kind`,
    );
    assert.equal(
      stageNativeArtifactContract.conformance_contract.domain_readiness_claim,
      false,
      `${label}.conformance_contract.no_domain_readiness_claim`,
    );
    assert.equal(
      stageNativeArtifactContract.conformance_contract.oma_can_claim_conformance_pass,
      false,
      `${label}.conformance_contract.no_oma_conformance_pass_claim`,
    );
    assert.equal(
      stageNativeArtifactContract.workbench_consumption_contract.surface_kind,
      'opl_stage_artifact_runtime_workbench_consumption',
      `${label}.workbench_consumption_contract.surface_kind`,
    );
    assert.equal(
      stageNativeArtifactContract.workbench_consumption_contract.artifact_body_access,
      false,
      `${label}.workbench_consumption_contract.no_body_access`,
    );
    assert.equal(
      stageNativeArtifactContract.workbench_consumption_contract.domain_verdict_authority,
      false,
      `${label}.workbench_consumption_contract.no_domain_verdict_authority`,
    );
    assert.equal(
      stageNativeArtifactContract.workbench_consumption_contract.oma_can_write_workbench_state,
      false,
      `${label}.workbench_consumption_contract.no_workbench_state_write`,
    );
    assert.equal(
      stageNativeArtifactContract.manifest_contract.missing_owner_receipt_projection,
      'orphan_artifact',
      `${label}.missing_owner_receipt_projection`,
    );
    assert.equal(
      stageNativeArtifactContract.manifest_contract.missing_or_hash_mismatch_projection,
      'broken_artifact',
      `${label}.missing_or_hash_mismatch_projection`,
    );
    assert.equal(
      stageNativeArtifactContract.current_pointer_contract.current_pointer_ref,
      `stage-current-pointer-ref:opl-meta-agent/${label}`,
      `${label}.current_pointer_ref`,
    );
    assert.equal(
      stageNativeArtifactContract.authority_boundary.oma_can_generate_target_domain_owner_receipt,
      false,
      `${label}.no_target_owner_receipt_generation`,
    );
    assert.equal(
      stageNativeArtifactContract.authority_boundary.oma_can_write_stage_folder_runtime_state,
      false,
      `${label}.no_stage_folder_runtime_state_write`,
    );
    assert.equal(
      stageNativeArtifactContract.authority_boundary.oma_can_write_target_domain_truth,
      false,
      `${label}.no_target_truth_write`,
    );
    assert.equal(
      stageNativeArtifactContract.authority_boundary.oma_can_own_agent_lab_runner,
      false,
      `${label}.no_agent_lab_runner_owner`,
    );
    assert.equal(
      stageNativeArtifactContract.authority_boundary.oma_can_own_queue,
      false,
      `${label}.no_queue_owner`,
    );
    assert.equal(
      stageNativeArtifactContract.authority_boundary.oma_can_own_attempt_ledger,
      false,
      `${label}.no_attempt_ledger_owner`,
    );
    assert.equal(
      stageNativeArtifactContract.authority_boundary.oma_can_own_worktree_lifecycle,
      false,
      `${label}.no_worktree_lifecycle_owner`,
    );
    assert.equal(
      stageNativeArtifactContract.authority_boundary.oma_can_own_promotion_gate,
      false,
      `${label}.no_promotion_gate_owner`,
    );
    assert.equal(
      stageNativeArtifactContract.authority_boundary.oma_can_own_app_shell,
      false,
      `${label}.no_app_shell_owner`,
    );
    assert.equal(
      stageNativeArtifactContract.authority_boundary.oma_can_write_target_owner_closeout,
      false,
      `${label}.no_target_owner_closeout_write`,
    );
    assert.equal(
      stageNativeArtifactContract.authority_boundary.oma_can_create_stage_folder_runtime_state,
      false,
      `${label}.no_runtime_state_create`,
    );
    assert.equal(
      stageNativeArtifactContract.authority_boundary.oma_can_write_target_owner_receipt_body,
      false,
      `${label}.no_target_owner_receipt_body_write`,
    );
    assert.equal(
      stageNativeArtifactContract.authority_boundary.oma_can_owner_promote_target_agent,
      false,
      `${label}.no_owner_promotion`,
    );
    assert.equal(
      stageNativeArtifactContract.authority_boundary.oma_can_manage_target_worktree_lifecycle,
      false,
      `${label}.no_target_worktree_lifecycle_manage`,
    );
    assert.equal(userStageLog.surface_kind, 'opl_standard_agent_user_stage_log_contract', `${label}.user_stage_log`);
    assert.equal(userStageLog.version, 'standard-user-stage-log.v1', `${label}.user_stage_log.version`);
    assert.equal(
      userStageLog.standard_agent_requirement,
      'domain_stage_closeout_must_return_user_readable_stage_semantics_or_typed_blocker',
      `${label}.user_stage_log.requirement`,
    );
    assert.equal(
      userStageLog.opl_projection_surface,
      'stage_progress_log.user_stage_log',
      `${label}.user_stage_log.projection`,
    );
    assert.deepEqual(
      asStrings(userStageLog.required_domain_semantic_fields),
      userStageLogRequiredFields,
      `${label}.user_stage_log.semantic_fields`,
    );
    assert.deepEqual(
      asStrings(userStageLog.required_observability_fields),
      ['duration', 'token_usage', 'cost'],
      `${label}.user_stage_log.observability_fields`,
    );
    assert.equal(
      userStageLog.missing_semantics_policy,
      'typed_blocker_or_missing_domain_semantic_summary_no_opl_inference',
      `${label}.user_stage_log.missing_policy`,
    );
    assert.equal(
      userStageLog.token_policy,
      'observed_or_explicit_missing_null_no_zero_fill',
      `${label}.user_stage_log.token_policy`,
    );
    assert.equal(
      userStageLog.authority_boundary.opl_can_infer_domain_semantics,
      false,
      `${label}.user_stage_log.no_semantic_inference`,
    );
    assert.equal(
      userStageLog.authority_boundary.opl_can_write_domain_truth,
      false,
      `${label}.user_stage_log.no_truth_write`,
    );
    assert.equal(
      progressDeltaPolicy.surface_kind,
      'opl_stage_progress_delta_policy',
      `${label}.progress_delta_policy.surface_kind`,
    );
    assert.equal(
      progressDeltaPolicy.version,
      'progress-delta-policy.v1',
      `${label}.progress_delta_policy.version`,
    );
    assert.ok(
      asStrings(progressDeltaPolicy.required_fields).includes('progress_delta_classification'),
      `${label}.progress_delta_policy.progress_delta_classification`,
    );
    assert.ok(
      asStrings(progressDeltaPolicy.required_fields).includes('deliverable_progress_delta'),
      `${label}.progress_delta_policy.deliverable_progress_delta`,
    );
    assert.ok(
      asStrings(progressDeltaPolicy.required_fields).includes('platform_repair_delta'),
      `${label}.progress_delta_policy.platform_repair_delta`,
    );
    assert.ok(
      asStrings(progressDeltaPolicy.required_fields).includes('next_forced_delta'),
      `${label}.progress_delta_policy.next_forced_delta`,
    );
    assert.equal(
      progressDeltaPolicy.deliverable_delta_aliases.target_agent_progress,
      'deliverable_progress_delta',
      `${label}.progress_delta_policy.target_agent_progress`,
    );
    assert.equal(
      progressDeltaPolicy.platform_delta_aliases.platform_interface_repair,
      'platform_repair_delta',
      `${label}.progress_delta_policy.platform_interface_repair`,
    );
    assert.equal(
      progressDeltaPolicy.platform_only_is_not_deliverable_progress,
      true,
      `${label}.progress_delta_policy.platform_only_guard`,
    );
    assert.equal(
      progressDeltaPolicy.authority_boundary.opl_can_write_domain_truth,
      false,
      `${label}.progress_delta_policy.no_truth_write`,
    );
    assert.equal(
      typedBlockerLineagePolicy.surface_kind,
      'family-stall-lineage.v1',
      `${label}.typed_blocker_lineage_policy.surface_kind`,
    );
    assert.equal(
      typedBlockerLineagePolicy.version,
      'family-stall-lineage.v1',
      `${label}.typed_blocker_lineage_policy.version`,
    );
    [
      'blocker_family',
      'study_id_or_domain_identity',
      'work_unit_id',
      'eval_id_or_review_ref',
      'source_fingerprint',
      'repeat_count',
      'next_forced_delta',
      'escalation_owner',
    ].forEach((field) => {
      assert.ok(
        asStrings(typedBlockerLineagePolicy.required_fields).includes(field),
        `${label}.typed_blocker_lineage_policy.${field}`,
      );
    });
    assert.deepEqual(
      typedBlockerLineagePolicy.repeat_budget,
      {
        mechanism_repair_after_repeat_count: 2,
        human_gate_or_stop_loss_after_repeat_count: 3,
      },
      `${label}.typed_blocker_lineage_policy.repeat_budget`,
    );
    assert.equal(
      typedBlockerLineagePolicy.authority_boundary.opl_can_generate_domain_blocker,
      false,
      `${label}.typed_blocker_lineage_policy.no_generated_domain_blocker`,
    );

    asObjects(stage.prompt_refs).forEach((entry) => {
      assert.ok(requires.includes(`prompt-ref:${entry.ref}`), `${label}.requires prompt ref ${entry.ref}`);
    });
    asObjects(stage.skills).forEach((entry) => {
      assert.ok(requires.includes(`skill-ref:${entry.ref}`), `${label}.requires skill ref ${entry.ref}`);
    });
    asObjects(stage.knowledge_refs).forEach((entry) => {
      assert.ok(requires.includes(`knowledge-ref:${entry.ref}`), `${label}.requires knowledge ref ${entry.ref}`);
    });
    asObjects(stage.evaluation).forEach((entry) => {
      assert.ok(requires.includes(`quality-gate-ref:${entry.ref}`), `${label}.requires quality gate ref ${entry.ref}`);
    });
    asStrings(stage.allowed_action_refs).forEach((actionRef) => {
      assert.ok(requires.includes(`action-ref:${actionRef}`), `${label}.requires action ref ${actionRef}`);
    });

    assert.equal(stage.verified_static_core.status, 'required_before_launch', `${label}.verified_static_core.status`);
    [
      'prompt_refs_resolve_to_domain_pack_files',
      'skill_refs_resolve_to_domain_pack_files',
      'knowledge_refs_resolve_to_domain_pack_files',
      'quality_gate_refs_resolve_to_domain_pack_files',
      'allowed_action_refs_resolve_to_action_catalog_when_present',
      'authority_boundary_forbids_domain_truth_memory_quality_and_promotion_writes',
    ].forEach((checkRef) => {
      assert.ok(stage.verified_static_core.checks.includes(checkRef), `${label}.verified_static_core ${checkRef}`);
    });

    assert.deepEqual(stage.runtime_enforced_boundary.opl_10_principle_refs, opl10PrincipleRefs);
    assert.equal(stage.runtime_enforced_boundary.codex_first, true, `${label}.codex_first`);
    assert.equal(
      stage.runtime_enforced_boundary.selected_executor_must_match_binding,
      true,
      `${label}.selected_executor_must_match_binding`,
    );
    assert.equal(stage.runtime_enforced_boundary.stage_attempt_ledger_required, true, `${label}.ledger_required`);
    assert.equal(stage.runtime_enforced_boundary.receipt_refs_required, true, `${label}.receipt_refs_required`);
    assert.equal(
      stage.runtime_enforced_boundary.independent_ai_review_required_before_promotion,
      true,
      `${label}.independent_review_required`,
    );
    assert.equal(stage.runtime_enforced_boundary.no_shared_context_review_required, true, `${label}.no_shared_context`);
    assert.equal(stage.runtime_enforced_boundary.generated_surface_owner, 'one-person-lab', `${label}.generated owner`);
    assert.equal(stage.runtime_enforced_boundary.domain_truth_owner, 'opl-meta-agent', `${label}.truth owner`);
    assert.equal(stage.runtime_enforced_boundary.can_write_domain_truth, false, `${label}.truth write`);
    assert.equal(stage.runtime_enforced_boundary.can_write_memory_body, false, `${label}.memory write`);
    assert.equal(
      stage.runtime_enforced_boundary.can_mutate_target_domain_artifact_body,
      false,
      `${label}.artifact write`,
    );
    assert.equal(stage.runtime_enforced_boundary.can_authorize_quality_or_export, false, `${label}.quality authority`);
    assert.equal(
      stage.runtime_enforced_boundary.can_promote_default_agent_without_gate,
      false,
      `${label}.default promotion`,
    );
    assert.equal(stage.runtime_enforced_boundary.suite_pass_claims_domain_ready, false, `${label}.suite pass claim`);
    [
      'blocker:missing_prompt_ref',
      'blocker:missing_tool_or_skill_ref',
      'blocker:missing_knowledge_or_memory_ref',
      'blocker:missing_quality_gate_ref',
      'blocker:missing_expected_receipt_ref',
      'blocker:forbidden_domain_truth_or_memory_write',
      'blocker:quality_or_promotion_claim_without_independent_ai_review',
      'blocker:contract_completeness_claimed_as_quality_verdict',
      'blocker:missing_user_stage_log_semantics',
    ].forEach((blockerRef) => {
      assert.ok(hardBlockerRefs.includes(blockerRef), `${label}.hard_blocker_refs ${blockerRef}`);
    });
  });
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
