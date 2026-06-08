import test from 'node:test';
import {
  assert,
  spawnSync,
  repoRoot,
  oplBin,
  asObjects,
  asStrings,
  readJson,
  assertRepoRefExists,
  assertNoForbiddenAuthority,
  assertNoForbiddenDesignCenterVocabulary,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';

test('OPL owns generated interface surfaces for opl-meta-agent contract pack', () => {
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const generatedSurfaceHandoff = readJson('contracts/generated_surface_handoff.json');
  const privatePolicy = readJson('contracts/private_functional_surface_policy.json');

  assert.equal(packCompilerInput.generated_surface_owner, 'one-person-lab');
  assert.equal(packCompilerInput.canonical_semantic_pack_root, 'agent/');
  assert.equal(packCompilerInput.domain_repo_can_own_generated_surface, false);
  assert.equal(generatedSurfaceHandoff.generated_surface_owner, 'one-person-lab');
  assert.equal(generatedSurfaceHandoff.canonical_semantic_pack_root, 'agent/');
  assert.equal(generatedSurfaceHandoff.domain_repo_can_own_generated_surface, false);
  assert.equal(privatePolicy.default_posture, 'forbidden_until_classified_and_receipted');
  assert.ok(privatePolicy.forbidden_private_surface_classes.includes('generic_cli_mcp_product_wrapper'));
});

test('registration, App workbench projection, and scaleout evidence contracts are consumable refs-only surfaces', () => {
  const registration = readJson('contracts/opl_domain_manifest_registration.json');
  const appProjection = readJson('contracts/app_workbench_projection.json');
  const scaleoutEvidence = readJson('contracts/real_target_agent_scaleout_evidence.json');
  const generatedSurfaceHandoff = readJson('contracts/generated_surface_handoff.json');
  const actionCatalog = readJson('contracts/action_catalog.json');
  const audit = readJson('contracts/functional_privatization_audit.json');

  assert.equal(registration.surface_kind, 'opl_domain_manifest_registration');
  assert.equal(registration.registry_owner, 'one-person-lab');
  assert.equal(registration.registration_status, 'discovery_receipt_ready');
  assert.equal(registration.role, 'domain_registration_metadata_refs_only');
  assertNoForbiddenAuthority(registration, 'registration');
  assert.equal(registration.authority_boundary.registry_owner_is_opl_framework, true);
  assert.equal(registration.authority_boundary.domain_repo_can_own_generated_surface, false);
  assert.equal(registration.authority_boundary.domain_repo_can_own_generic_operator_workbench, false);
  Object.entries(registration.domain_manifest)
    .filter(([key]) => key.endsWith('_ref'))
    .map(([, value]) => value as string)
    .forEach(assertRepoRefExists);
  assert.equal(registration.discovery_receipt.surface_kind, 'opl_domain_manifest_discovery_receipt');
  assert.equal(registration.discovery_receipt.status, 'ready_for_opl_registry_consumption');
  assert.equal(registration.discovery_receipt.registry_owner, 'one-person-lab');
  assert.ok(registration.discovery_receipt.safe_action_route_refs.includes('safe-action:opl-meta-agent/build-agent-baseline'));
  assert.ok(registration.discovery_receipt.blocked_claims.includes('app_live_rendering_complete'));
  assert.equal(registration.discovery_receipt.authority_boundary.refs_only, true);
  assert.equal(registration.discovery_receipt.authority_boundary.can_write_target_domain_truth, false);
  asStrings(registration.discovery_receipt.consumed_contract_refs).forEach(assertRepoRefExists);
  asStrings(registration.discovery_receipt.verified_by_refs).forEach(assertRepoRefExists);

  assert.equal(appProjection.surface_kind, 'opl_app_workbench_projection_contract');
  assert.equal(appProjection.projection_owner, 'one-person-lab');
  assert.equal(appProjection.projection_status, 'drilldown_readiness_receipt_ready');
  assert.equal(appProjection.role, 'refs_status_receipts_candidates_and_blockers_only');
  assertNoForbiddenAuthority(appProjection, 'appProjection');
  assert.equal(appProjection.authority_boundary.projection_owner_is_opl_framework, true);
  assert.equal(appProjection.authority_boundary.domain_repo_can_own_generic_operator_workbench, false);
  assert.equal(appProjection.workbench_sections.length, 7);
  assert.equal(
    asObjects(appProjection.workbench_sections).some((section) => section.section_id === 'scaleout_evidence'),
    true,
  );
  assert.equal(
    asObjects(appProjection.workbench_sections).some((section) => section.section_id === 'trajectory_learning'),
    true,
  );
  assert.equal(appProjection.drilldown_readiness_receipt.surface_kind, 'opl_app_workbench_drilldown_readiness_receipt');
  assert.equal(appProjection.drilldown_readiness_receipt.status, 'ready_for_app_consumption_refs_only');
  assert.equal(appProjection.drilldown_readiness_receipt.summary_first, true);
  assert.equal(appProjection.drilldown_readiness_receipt.detail_mode_required_for_full_refs, true);
  assert.equal(appProjection.drilldown_readiness_receipt.live_rendering_status, 'not_claimed_by_contract');
  assert.ok(appProjection.drilldown_readiness_receipt.safe_action_route_refs.includes('safe-action:opl-meta-agent/improve-from-external-agent-lab-suite'));
  assert.ok(appProjection.drilldown_readiness_receipt.blocker_ref_fields.includes('typed_blocker_refs'));
  assert.ok(appProjection.drilldown_readiness_receipt.receipt_ref_fields.includes('mechanism_patch_proposal_ref'));
  assert.equal(appProjection.drilldown_readiness_receipt.authority_boundary.refs_only, true);
  assert.equal(appProjection.drilldown_readiness_receipt.authority_boundary.can_mutate_target_domain_artifact_body, false);
  asStrings(appProjection.drilldown_readiness_receipt.verified_by_refs).forEach(assertRepoRefExists);
  asStrings(Object.values(appProjection.source_refs)).forEach(assertRepoRefExists);

  assert.equal(scaleoutEvidence.surface_kind, 'real_target_agent_scaleout_evidence_contract');
  assert.equal(scaleoutEvidence.evidence_status, 'multi_target_scaleout_closed_by_refs_only_receipts');
  assert.equal(scaleoutEvidence.role, 'refs_only_scaleout_evidence_gate');
  assertNoForbiddenAuthority(scaleoutEvidence, 'scaleoutEvidence');
  assert.equal(scaleoutEvidence.authority_boundary.not_target_domain_truth_writer, true);
  assert.equal(scaleoutEvidence.authority_boundary.implicit_fixture_smoke_retired, true);
  assert.equal(scaleoutEvidence.authority_boundary.can_treat_suite_pass_as_default_promotion, false);
  assert.equal(scaleoutEvidence.implemented_receipt_surfaces.real_target_delivery_receipt_surface_kind, 'opl_meta_agent_real_target_agent_delivery_receipt');
  assert.equal(scaleoutEvidence.implemented_receipt_surfaces.scaleout_evidence_ledger_surface_kind, 'opl_meta_agent_real_target_agent_scaleout_evidence_ledger');
  assert.equal(scaleoutEvidence.implemented_receipt_surfaces.implicit_fixture_smoke_retired, true);
  assert.equal(
    scaleoutEvidence.implemented_receipt_surfaces.receipt_baseline_source_kind,
    'explicit_target_agent_baseline',
  );
  assert.equal(scaleoutEvidence.implemented_receipt_surfaces.real_target_agent_delivery_count_min_supported, true);
  assert.equal(scaleoutEvidence.implemented_receipt_surfaces.multi_target_scaleout_pending, false);
  assert.equal(scaleoutEvidence.implemented_receipt_surfaces.multi_target_scaleout_closed, true);
  assert.equal(scaleoutEvidence.implemented_receipt_surfaces.implicit_fixture_graph_retired, true);
  assert.equal(scaleoutEvidence.implemented_receipt_surfaces.fixture_runner_requires_explicit_closeout, true);
  assert.deepEqual(scaleoutEvidence.implemented_receipt_surfaces.retired_tail_verification_refs, [
    'tests/stage-decomposition-materializer.test.ts',
    'tests/bootstrap-loop.test.ts',
  ]);
  assert.deepEqual(scaleoutEvidence.implemented_receipt_surfaces.multi_target_scaleout_verified_by_real_targets, [
    'med-autoscience',
    'med-autogrant',
  ]);
  assert.equal(scaleoutEvidence.multi_target_scaleout_closeout.status, 'closed_by_two_real_target_refs_only_receipts');
  assert.equal(scaleoutEvidence.multi_target_scaleout_closeout.target_agent_count, 2);
  assert.equal(
    scaleoutEvidence.multi_target_scaleout_closeout.minimum_completion_gate.multi_target_scaleout_delivery_count_met,
    true,
  );
  assert.equal(
    scaleoutEvidence.multi_target_scaleout_closeout.minimum_completion_gate.requires_owner_receipt_or_typed_blocker_refs,
    true,
  );
  assert.equal(
    scaleoutEvidence.multi_target_scaleout_closeout.minimum_completion_gate.requires_cleanup_closeout_refs,
    true,
  );
  assert.equal(scaleoutEvidence.multi_target_scaleout_closeout.minimum_completion_gate.suite_pass_claims_domain_ready, false);
  assert.equal(scaleoutEvidence.multi_target_scaleout_closeout.minimum_completion_gate.provider_completion_claims_domain_ready, false);
  assert.equal(scaleoutEvidence.multi_target_scaleout_closeout.minimum_completion_gate.proposal_claims_default_promotion, false);
  asObjects(scaleoutEvidence.multi_target_scaleout_closeout.target_agents).forEach((target) => {
    assert.ok(asStrings(target.target_agent_owner_receipt_refs).length + asStrings(target.typed_blocker_refs).length > 0);
    assert.ok(asStrings(target.agent_lab_result_refs).length > 0);
    assert.ok(asStrings(target.no_forbidden_write_proof_refs).length > 0);
    assert.ok(asStrings(target.cleanup_closeout_refs).length > 0);
    assert.equal(target.domain_ready_claimed, false);
    assert.equal(target.default_promotion_claimed, false);
  });
  asStrings(scaleoutEvidence.implemented_receipt_surfaces.verified_by_refs).forEach(assertRepoRefExists);
  assert.deepEqual(
    asObjects(scaleoutEvidence.required_evidence_classes).map((entry) => entry.evidence_class),
    [
      'real_target_agent_delivery',
      'blocked_suite_to_developer_work_order',
      'multi_target_scaleout',
    ],
  );
  asStrings(Object.values(scaleoutEvidence.source_refs)).forEach(assertRepoRefExists);

  [
    registration,
    appProjection,
    scaleoutEvidence,
  ].forEach((surface: JsonObject) => {
    surface.human_doc_refs.forEach(assertRepoRefExists);
  });

  assert.equal(
    generatedSurfaceHandoff.registration_contract_ref,
    'contracts/opl_domain_manifest_registration.json',
  );
  assert.equal(
    generatedSurfaceHandoff.app_workbench_projection_ref,
    'contracts/app_workbench_projection.json',
  );
  assert.equal(
    generatedSurfaceHandoff.scaleout_evidence_contract_ref,
    'contracts/real_target_agent_scaleout_evidence.json',
  );
  assert.equal(
    generatedSurfaceHandoff.trajectory_learning_contract_ref,
    'contracts/trajectory_learning_contract.json',
  );
  assert.equal(
    generatedSurfaceHandoff.registry_discovery_receipt_ref,
    registration.discovery_receipt.receipt_ref,
  );
  assert.equal(
    generatedSurfaceHandoff.app_drilldown_readiness_receipt_ref,
    appProjection.drilldown_readiness_receipt.receipt_ref,
  );
  assert.equal(
    asObjects(generatedSurfaceHandoff.generated_surfaces).some((surface) =>
      surface.surface_id === 'scaleout_evidence_projection'
    ),
    true,
  );
  assert.equal(
    asObjects(generatedSurfaceHandoff.generated_surfaces).some((surface) =>
      surface.surface_id === 'trajectory_learning_projection'
    ),
    true,
  );
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('opl_domain_manifest_registration_contract'));
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('app_workbench_projection_contract'));
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('real_target_agent_scaleout_evidence_contract'));
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('trajectory_learning_contract'));
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('ux_signal_not_quality_verdict_boundary'));
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('registry_discovery_receipt'));
  assert.ok(generatedSurfaceHandoff.required_domain_handoff.includes('app_drilldown_readiness_receipt'));
  assert.deepEqual(actionCatalog.registration_projection_evidence_contract_refs, {
    opl_domain_manifest_registration_ref: 'contracts/opl_domain_manifest_registration.json',
    app_workbench_projection_ref: 'contracts/app_workbench_projection.json',
    real_target_agent_scaleout_evidence_ref: 'contracts/real_target_agent_scaleout_evidence.json',
    target_agent_owner_chain_evidence_ref: 'contracts/target_agent_owner_chain_evidence.json',
    trajectory_learning_contract_ref: 'contracts/trajectory_learning_contract.json',
  });
  assert.deepEqual(audit.registration_projection_evidence_contract_refs, {
    opl_domain_manifest_registration_ref: 'contracts/opl_domain_manifest_registration.json',
    app_workbench_projection_ref: 'contracts/app_workbench_projection.json',
    real_target_agent_scaleout_evidence_ref: 'contracts/real_target_agent_scaleout_evidence.json',
    trajectory_learning_contract_ref: 'contracts/trajectory_learning_contract.json',
  });
});

test('top-level OMA commands and materializers stay target-agent generic', () => {
  const series = readJson('contracts/foundry_agent_series.json');
  [
    'package.json',
    'contracts/action_catalog.json',
    'contracts/stage_control_plane.json',
    'contracts/app_workbench_projection.json',
    'contracts/opl_domain_manifest_registration.json',
    'contracts/trajectory_learning_contract.json',
    'scripts/agent-evidence-takeover.ts',
    'scripts/improve-from-agent-lab-suite.ts',
  ].forEach(assertNoForbiddenDesignCenterVocabulary);

  const actionCatalog = readJson('contracts/action_catalog.json');
  const actionIds = asObjects(actionCatalog.actions).map((action) => action.action_id);
  assert.ok(actionIds.includes('improve-from-external-agent-lab-suite'));
  assert.ok(actionIds.includes('materialize-trajectory-learning-proposal'));
  assert.equal(actionIds.some((actionId) => /mas|mag|medical|grant|manuscript|publication|fundability/i.test(actionId)), false);

  const vocabularyPolicy = series.domain_specific_profile.target_agent_generic_vocabulary_policy;
  assert.deepEqual(asStrings(vocabularyPolicy.allowed_top_level_suite_kinds), [
    'agent_lab_external_suite',
    'agent_production_evidence_suite',
  ]);
  assert.equal(vocabularyPolicy.top_level_suite_kind_scope, 'target_agent_generic_only');
  assert.equal(vocabularyPolicy.top_level_command_family_scope, 'target_agent_generic_only');
  assert.equal(vocabularyPolicy.oma_must_not_add_target_domain_compatibility_layer, true);
  assert.deepEqual(asStrings(vocabularyPolicy.domain_names_allowed_only_as), [
    'target_agent_id',
    'target_agent_ref',
    'owner_route_ref',
    'fixture_ref',
    'receipt_provenance_ref',
    'real_target_smoke_evidence_ref',
  ]);
  asStrings(vocabularyPolicy.forbidden_domain_specific_suite_kind_prefixes).forEach((prefix) => {
    assert.equal(
      asStrings(vocabularyPolicy.allowed_top_level_suite_kinds).some((suiteKind) => suiteKind.startsWith(prefix)),
      false,
      `${prefix} must not become a top-level OMA suite kind`,
    );
  });
});

test('registration, projection, and evidence contracts are represented in functional audit', () => {
  const audit = readJson('contracts/functional_privatization_audit.json');
  assert.equal(audit.source_shape, 'landed');
  assert.equal(audit.standard_agent_source_shape, 'landed');
  assert.equal(audit.functional_structure_gap_count, 0);
  assert.equal(audit.domain_repo_retained_generic_surface_count, 0);
  assert.ok(asStrings(audit.remaining_tail_kinds).includes('opl_generated_default_caller_consumption_tail'));
  assert.ok(asStrings(audit.remaining_tail_kinds).includes('domain_refs_only_adapter_thinning'));
  assert.ok(asStrings(audit.remaining_tail_kinds).includes('script_to_pack_hygiene'));
  assert.ok(asStrings(audit.forbidden_active_surface_claims).includes('repo_owned_generic_runtime'));
  assert.ok(asStrings(audit.forbidden_active_surface_claims).includes('repo_owned_generated_shell'));
  assert.ok(asStrings(audit.forbidden_active_surface_claims).includes('repo_owned_workbench'));
  assert.ok(asStrings(audit.forbidden_active_surface_claims).includes('repo_owned_sidecar'));
  assert.ok(asStrings(audit.forbidden_active_surface_claims).includes('repo_owned_compatibility_surface'));
  assert.ok(asStrings(audit.domain_allowed_roles).includes('agent_building_semantics'));
  assert.ok(asStrings(audit.domain_allowed_roles).includes('candidate_agent_skeleton_strategy'));
  assert.ok(asStrings(audit.domain_allowed_roles).includes('contracts_prompt_skill_quality_gate_generation_strategy'));
  assert.ok(asStrings(audit.domain_allowed_roles).includes('baseline_review_semantics'));
  assert.ok(asStrings(audit.domain_allowed_roles).includes('optimizer_review_semantics'));
  assert.ok(asStrings(audit.domain_allowed_roles).includes('developer_work_order_materialization'));
  assert.ok(asStrings(audit.domain_allowed_roles).includes('owner_receipt_refs'));
  assert.equal(asStrings(audit.domain_allowed_roles).includes('domain_entry_and_tests'), false);
  const expectedModules = [
    {
      moduleId: 'opl_domain_manifest_registration',
      classification: 'refs_only_domain_adapter',
      codePath: 'contracts/opl_domain_manifest_registration.json',
      roleScope: 'refs_only_registration_metadata_not_generic_runtime_owner',
    },
    {
      moduleId: 'app_workbench_projection',
      classification: 'refs_only_domain_adapter',
      codePath: 'contracts/app_workbench_projection.json',
      roleScope: 'refs_status_receipts_candidates_and_blockers_only_not_operator_workbench_owner',
    },
    {
      moduleId: 'real_target_agent_scaleout_evidence',
      classification: 'refs_only_domain_adapter',
      codePath: 'contracts/real_target_agent_scaleout_evidence.json',
      roleScope: 'refs_only_scaleout_evidence_gate_not_target_domain_truth_writer',
    },
    {
      moduleId: 'trajectory_learning_contract',
      classification: 'refs_only_domain_adapter',
      codePath: 'contracts/trajectory_learning_contract.json',
      roleScope: 'trajectory_atom_candidate_and_proposal_contract_not_runtime_owner',
    },
  ];

  expectedModules.forEach((expected) => {
    const module = asObjects(audit.modules).find((entry) => entry.module_id === expected.moduleId);
    assert.ok(module, `${expected.moduleId} should be represented in functional audit`);
    assert.equal(module.owner, 'opl-meta-agent');
    assert.equal(module.classification, expected.classification);
    assert.deepEqual(module.code_paths, [expected.codePath]);
    assert.equal(module.role_scope, expected.roleScope);
    assertRepoRefExists(expected.codePath);
  });
});

test('OPL generated interfaces expose CLI, MCP, Skill, and product-entry descriptors for this repo', () => {
  const result = spawnSync(oplBin, [
    'agents',
    'interfaces',
    '--repo-dir',
    repoRoot,
    '--json',
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout) as JsonObject;
  const bundle = payload.generated_agent_interfaces;
  assert.equal(bundle.surface_kind, 'opl_generated_agent_interface_bundle');
  assert.equal(bundle.owner, 'one-person-lab');
  assert.equal(bundle.source_kind, 'standard_agent_repo_contracts');
  assert.equal(bundle.repo_dir, repoRoot);
  assert.equal(bundle.domain_repo_can_own_generated_surface, false);
  assert.equal(bundle.status, 'ready');
  assert.equal(asObjects(bundle.cli.descriptors).some((entry) => entry.action_id === 'build-agent-baseline'), true);
  assert.equal(
    asObjects(bundle.mcp.descriptors).find((entry) => entry.name === 'opl_meta_agent_takeover_target_agent_test')
      ?.descriptor_only,
    true,
  );
  assert.equal(
    asObjects(bundle.mcp.descriptors).some((entry) => entry.name === 'opl_meta_agent_takeover_external_agent_test'),
    false,
  );
  assert.equal(
    asObjects(bundle.skill.descriptors).some((entry) =>
      entry.command_contract_id === 'opl-meta-agent.build-agent-baseline'
    ),
    true,
  );
  assert.equal(
    asObjects(bundle.skill.descriptors).some((entry) =>
      entry.command_contract_id === 'opl-meta-agent.improve-from-external-agent-lab-suite'
    ),
    true,
  );
  assert.equal(
    asObjects(bundle.skill.descriptors).some((entry) =>
      entry.command_contract_id === 'opl-meta-agent.execute-external-work-order'
    ),
    true,
  );
  assert.equal(
    asObjects(bundle.product_entry.descriptors).some((entry) => entry.action_key === 'takeover-target-agent-test'),
    true,
  );
  assert.equal(
    asObjects(bundle.product_entry.descriptors).some((entry) => entry.action_key === 'takeover-external-agent-test'),
    false,
  );
  assert.doesNotMatch(JSON.stringify(bundle), /takeover-external-agent-test|opl_meta_agent_takeover_external_agent_test/);
  assert.equal(
    asObjects(bundle.product_entry.descriptors).some((entry) => entry.action_key === 'improve-from-external-agent-lab-suite'),
    true,
  );
  assert.equal(
    asObjects(bundle.product_entry.descriptors).some((entry) => entry.action_key === 'execute-external-work-order'),
    true,
  );
  assert.equal(bundle.authority_boundary.generated_interface_can_write_domain_truth, false);
  assert.equal(bundle.authority_boundary.generated_interface_can_write_memory_body, false);
  assert.equal(bundle.authority_boundary.generated_interface_can_authorize_quality_or_export, false);
});

test('OPL default-caller deletion evidence is closed by domain-owned refs without authorizing physical delete', () => {
  const evidence = readJson('contracts/default_caller_deletion_evidence.json');
  const generatedSurfaceHandoff = readJson('contracts/generated_surface_handoff.json');
  const audit = readJson('contracts/functional_privatization_audit.json');
  const expectedSurfaces = [
    'cli',
    'mcp',
    'skill',
    'product_entry',
    'product_status',
    'product_session',
    'domain_handler',
    'workbench',
  ];

  assert.equal(evidence.surface_kind, 'opl_meta_agent_default_caller_deletion_evidence');
  assert.equal(evidence.owner, 'opl-meta-agent');
  assert.equal(evidence.role, 'domain_boundary_evidence_for_opl_generated_default_caller_consumption');
  assert.equal(evidence.evidence_status, 'source_shape_landed_with_boundary_refs_only_tail');
  assert.equal(evidence.source_shape, 'landed');
  assert.equal(evidence.standard_agent_source_shape, 'landed');
  assert.equal(evidence.functional_structure_gap_count, 0);
  assert.equal(evidence.remaining_tail_kind, 'opl_generated_default_caller_consumption_tail');
  assert.equal(evidence.generated_surface_owner, 'one-person-lab');
  assert.equal(evidence.domain_repo_can_own_generated_surface, false);
  assert.equal(evidence.domain_repo_retained_generic_surface_count, 0);
  assert.equal(evidence.physical_delete_authorized, false);
  assert.equal(evidence.authority_boundary.refs_only, true);
  assert.equal(evidence.authority_boundary.can_write_domain_truth, false);
  assert.equal(evidence.authority_boundary.can_write_memory_body, false);
  assert.equal(evidence.authority_boundary.can_authorize_quality_or_export, false);
  assert.equal(evidence.authority_boundary.can_authorize_domain_repo_physical_delete, false);
  assert.equal(evidence.authority_boundary.can_restore_repo_local_default_wrapper, false);
  assert.equal(evidence.authority_boundary.can_restore_repo_owned_sidecar_or_workbench, false);
  assert.equal(evidence.authority_boundary.can_create_compatibility_facade, false);
  assert.ok(asStrings(evidence.retained_domain_authority).includes('agent_building_semantics'));
  assert.ok(
    asStrings(evidence.retained_domain_authority)
      .includes('skeleton_contracts_prompt_skill_quality_gate_generation_strategy'),
  );
  assert.ok(asStrings(evidence.retained_domain_authority).includes('baseline_review_semantics'));
  assert.ok(asStrings(evidence.retained_domain_authority).includes('optimizer_review_semantics'));
  assert.ok(asStrings(evidence.retained_domain_authority).includes('work_order_materialization_semantics'));
  assert.ok(asStrings(evidence.retained_domain_authority).includes('target_domain_truth_boundary'));
  assert.ok(asStrings(evidence.retained_domain_authority).includes('owner_receipt_ref_materialization'));
  assert.ok(asStrings(evidence.opl_owned_surfaces).includes('runtime_queue_workbench_projection'));
  assert.equal(
    generatedSurfaceHandoff.default_caller_deletion_evidence_ref,
    'contracts/default_caller_deletion_evidence.json',
  );

  const handoffSurfaces = asObjects(generatedSurfaceHandoff.handoff_surfaces);
  assert.deepEqual(asObjects(handoffSurfaces).map((surface) => surface.surface_id), expectedSurfaces);
  expectedSurfaces.forEach((surfaceId) => {
    const surfaceEvidence = evidence.surface_evidence[surfaceId] as JsonObject;
    assert.ok(surfaceEvidence, `${surfaceId} should have deletion evidence`);
    assert.ok(asStrings(surfaceEvidence.typed_blocker_refs).length > 0);
    assert.ok(asStrings(surfaceEvidence.no_forbidden_write_refs).length > 0);
    assert.ok(asStrings(surfaceEvidence.tombstone_refs).length > 0);
    assert.ok(asStrings(surfaceEvidence.provenance_refs).length > 0);
    assert.ok(asStrings(surfaceEvidence.current_surface_refs).length > 0);

    const handoffSurface = handoffSurfaces.find((entry) => entry.surface_id === surfaceId);
    assert.ok(handoffSurface, `${surfaceId} should have a handoff surface`);
    assert.equal(handoffSurface.owner, 'one-person-lab');
    assert.equal(handoffSurface.physical_delete_authorized, false);
    assert.equal(
      handoffSurface.bridge_exit_gate_ref,
      `contracts/default_caller_deletion_evidence.json#/surface_evidence/${surfaceId}`,
    );

    const moduleId = `default_caller_${surfaceId}_deletion_evidence`;
    const auditModule = asObjects(audit.modules).find((entry) => entry.module_id === moduleId);
    assert.ok(auditModule, `${moduleId} should be represented in functional audit`);
    assert.equal(auditModule.owner, 'opl-meta-agent');
    assert.equal(auditModule.classification, 'refs_only_domain_adapter');
    assert.deepEqual(auditModule.code_paths, ['contracts/default_caller_deletion_evidence.json']);
    assert.equal(
      auditModule.role_scope,
      'refs_only_default_caller_deletion_evidence_not_generated_surface_owner',
    );
    assert.equal(auditModule.bridge_exit_gate.physical_delete_authorized, false);
    assert.deepEqual(
      asStrings(auditModule.bridge_exit_gate.typed_blocker_refs),
      asStrings(surfaceEvidence.typed_blocker_refs),
    );
    assert.deepEqual(
      asStrings(auditModule.bridge_exit_gate.no_forbidden_write_refs),
      asStrings(surfaceEvidence.no_forbidden_write_refs),
    );
  });

  const result = spawnSync(oplBin, [
    'agents',
    'default-callers',
    '--agent',
    `opl-meta-agent=${repoRoot}`,
    '--json',
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout) as JsonObject;
  const report = payload.agent_default_caller_readiness as JsonObject;
  const summary = report.summary as JsonObject;
  assert.equal(summary.generated_default_caller_surface_count, 8);
  assert.equal(summary.blocked_surface_count, 0);
  assert.equal(summary.missing_domain_owner_receipt_or_typed_blocker_count, 0);
  assert.equal(summary.missing_no_forbidden_write_proof_count, 0);
  assert.equal(summary.missing_tombstone_or_provenance_ref_count, 0);
  assert.equal(report.migration_gate_policy.physical_delete_authorized_by_this_report, false);
  assert.equal(report.authority_boundary.report_can_authorize_domain_repo_physical_delete, false);

  const repoReport = asObjects(report.reports)[0];
  assert.equal(repoReport.deletion_gate.physical_delete_authorized, false);
  assert.equal(repoReport.deletion_gate.missing_domain_owner_receipt_or_typed_blocker_count, 0);
  assert.equal(repoReport.deletion_gate.missing_no_forbidden_write_proof_count, 0);
  assert.equal(repoReport.deletion_gate.missing_tombstone_or_provenance_ref_count, 0);
  assert.equal(asObjects(repoReport.surface_gates).length, 8);
  asObjects(repoReport.surface_gates).forEach((gate) => {
    const worklist = gate.deletion_evidence_worklist as JsonObject;
    assert.equal(gate.status, 'ready_for_default_caller_cutover');
    assert.equal(worklist.physical_delete_authorized, false);
    assert.equal(worklist.domain_owner_receipt_or_typed_blocker.status, 'observed');
    assert.equal(worklist.no_forbidden_write_proof.status, 'observed');
    assert.equal(worklist.tombstone_or_provenance_ref.status, 'observed');
  });
});
