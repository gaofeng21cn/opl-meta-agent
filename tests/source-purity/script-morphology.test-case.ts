// @ts-nocheck
import {
  test,
  assert,
  assertRepoRefExists,
  asObjects,
  asStrings,
  fs,
  path,
  repoRoot,
  readJson,
  ACTIVE_CALLER_SCAN_POLICY_ID,
  DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF,
  STANDARD_FOUNDRY_POLICIES_CONTRACT_REF,
  STAGE_NATIVE_ARTIFACT_VOCABULARY_CONTRACT_REF,
  assertPolicyObject,
  assertPolicyStringList,
  asBooleanRecord,
  collectActiveScriptCallerScan,
  collectFalseReadyClaimMatches,
  collectFalseReadyClaimMatchesFromSource,
  sourceRefIntegrityViolations,
  assertRepoLocalScriptRef,
  valuesAtDottedPath,
  listScriptRefs,
  type JsonObject,
} from './support.ts';

test('script morphology stays limited to authority refs, materializers, helpers, and verification wrappers', () => {
  const privatePolicy = readJson('contracts/private_functional_surface_policy.json');
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const scripts = listScriptRefs();
  const morphologyPolicy = authorityFunctions.script_morphology_policy as JsonObject;
  const receipt = authorityFunctions.source_purity_scan_receipt as JsonObject;
  const materializerScan = receipt.generic_script_materializer_scan as JsonObject;
  const morphologyScanScope = assertPolicyObject(morphologyPolicy, 'script_scan_scope');
  const receiptScanScope = assertPolicyObject(receipt, 'script_scan_scope');

  assert.equal(morphologyPolicy.policy_ref, 'contracts/private_functional_surface_policy.json');
  assert.deepEqual(asStrings(morphologyScanScope.included_extensions), ['.ts', '.sh']);
  assert.deepEqual(morphologyScanScope, receiptScanScope);
  assert.equal(morphologyScanScope.mode, 'repo_local_ts_and_shell_scripts');
  assert.equal(morphologyScanScope.shell_wrappers_included, true);
  assert.equal(morphologyScanScope.no_exempt_shell_wrappers, true);
  assert.equal(
    morphologyScanScope.gate_requirement,
    'every_scanned_script_ref_must_have_script_to_pack_retirement_or_retention_gate',
  );
  assert.ok(scripts.some((scriptRef) => scriptRef.endsWith('.ts')), 'source-purity scan should include TS scripts');
  assert.ok(scripts.some((scriptRef) => scriptRef.endsWith('.sh')), 'source-purity scan should include shell scripts');
  assert.deepEqual(
    asObjects(privatePolicy.allowed_script_morphology_classes).map((entry) => entry.class_id),
    [
      'authority_function_implementation_ref',
      'smoke_helper',
      'fixture_or_proof_helper',
      'developer_work_order_materializer',
    ],
  );
  assert.deepEqual(morphologyPolicy.allowed_classes, [
    'authority_function_implementation_ref',
    'smoke_helper',
    'fixture_or_proof_helper',
    'developer_work_order_materializer',
  ]);
  assert.deepEqual(morphologyPolicy.forbidden_roles, asStrings(privatePolicy.forbidden_script_roles));
  assert.equal(
    morphologyPolicy.allowed_opl_surface_consumption_policy_ref,
    'contracts/private_functional_surface_policy.json#allowed_opl_surface_consumption_refs',
  );
  const falseReadyClaimGuard = assertPolicyObject(morphologyPolicy, 'false_ready_claim_guard');
  assert.equal(falseReadyClaimGuard.guard_id, 'oma.generated-hosted-false-ready-claim-guard.v1');
  const falseReadyClaimKeys = asStrings(falseReadyClaimGuard.forbidden_true_claim_keys);
  assert.deepEqual(falseReadyClaimKeys, [
    'app_live_rendering_complete',
    'app_workbench_live_rendering_complete',
    'app_operator_sustained_consumption_complete',
    'registry_discovery_live_complete',
    'generated_interface_live_ready',
    'generated_hosted_surface_live_ready',
    'generated_surface_consumption_complete',
    'default_caller_cutover_complete',
    'default_promotion_complete',
    'retirement_readback_cleanup_complete',
    'retirement_readback_guard_satisfied',
    'cleanup_readback_physical_delete_authorized',
    'claims_cleanup_readback_authorizes_delete',
    'claims_retirement_cleanup_applied',
    'target_agent_ready',
    'domain_ready',
    'production_ready',
  ]);
  assert.deepEqual(asStrings(falseReadyClaimGuard.allowed_evidence_sources), [
    'OPL/App external evidence tail',
    'target owner receipt or typed blocker refs',
    'human gate receipt',
  ]);
  const falseReadyBoundary = asBooleanRecord(falseReadyClaimGuard.authority_boundary);
  assert.equal(falseReadyBoundary.oma_can_claim_app_live_rendering, false);
  assert.equal(falseReadyBoundary.oma_can_claim_registry_live_discovery, false);
  assert.equal(falseReadyBoundary.oma_can_claim_generated_hosted_live_ready, false);
  assert.equal(falseReadyBoundary.oma_can_claim_default_promotion, false);
  assert.equal(falseReadyBoundary.oma_can_claim_target_agent_ready, false);
  assert.deepEqual(
    collectFalseReadyClaimMatches(falseReadyClaimKeys),
    [],
    'OMA machine source must not carry generated/App/registry/default-promotion true flags',
  );
  assert.deepEqual(
    collectFalseReadyClaimMatchesFromSource(
      'contracts/__source_purity_false_ready_probe.json',
      ['{"generated_hosted_surface_', 'live_ready": true}\n'].join(''),
      falseReadyClaimKeys,
    ),
    [{ path: 'contracts/__source_purity_false_ready_probe.json', claimKey: 'generated_hosted_surface_live_ready' }],
    'false-ready probe should be caught by the same literal matcher used by the machine-source scan',
  );
  assert.deepEqual(
    collectFalseReadyClaimMatchesFromSource(
      'contracts/__source_purity_cleanup_readback_probe.json',
      ['{"cleanup_readback_physical_', 'delete_authorized": true}\n'].join(''),
      falseReadyClaimKeys,
    ),
    [
      {
        path: 'contracts/__source_purity_cleanup_readback_probe.json',
        claimKey: 'cleanup_readback_physical_delete_authorized',
      },
    ],
    'cleanup readback delete-authorization probe should be caught by the same literal matcher used by the machine-source scan',
  );
  const allowedOplSurfaceRefs = asObjects(privatePolicy.allowed_opl_surface_consumption_refs);
  assert.ok(
    allowedOplSurfaceRefs.length > 0,
    'private surface policy should declare allowed OPL surface consumption refs',
  );
  const allowedOplSurfaceRefIds = new Set<string>();
  allowedOplSurfaceRefs.forEach((surface) => {
    assert.equal(typeof surface.surface_ref, 'string', 'allowed OPL surface should have a surface_ref');
    assert.notEqual(surface.surface_ref.trim(), '', 'allowed OPL surface_ref should not be blank');
    assert.equal(surface.surface_owner, 'one-person-lab', `${surface.surface_ref} should be OPL-owned`);
    assert.equal(typeof surface.surface_role, 'string', `${surface.surface_ref} should declare surface_role`);
    assert.notEqual(surface.surface_role.trim(), '', `${surface.surface_ref} surface_role should not be blank`);
    allowedOplSurfaceRefIds.add(surface.surface_ref);
    assert.ok(
      asStrings(surface.allowed_script_classes).length > 0,
      `${surface.surface_ref} should declare allowed script classes`,
    );
    asStrings(surface.allowed_script_classes).forEach((classId) => {
      assert.ok(
        morphologyPolicy.allowed_classes.includes(classId),
        `${surface.surface_ref} allows unsupported script class ${classId}`,
      );
    });
    const boundary = asBooleanRecord(surface.boundary);
    [
      'can_create_runtime_truth',
      'can_write_target_truth',
      'can_write_owner_receipt_body',
    ].forEach((flag) => {
      assert.equal(boundary[flag], false, `${surface.surface_ref} boundary ${flag} must be false`);
    });
    Object.entries(boundary).forEach(([flag, value]) => {
      assert.equal(typeof value, 'boolean', `${surface.surface_ref} boundary ${flag} must be boolean`);
      if (flag.startsWith('can_claim_')) {
        assert.equal(value, false, `${surface.surface_ref} boundary ${flag} must be false`);
      }
    });
  });
  assert.ok(
    morphologyPolicy.forbidden_roles.includes(
      'generic_cli_mcp_skill_product_sidecar_status_workbench_materializer_owner',
    ),
  );
  [
    'pack_compiler_owner',
    'generated_interface_owner',
    'scaffold_generator_owner',
    'target_pack_authority',
  ].forEach((role) => {
    assert.ok(
      morphologyPolicy.forbidden_roles.includes(role),
      `script morphology should forbid ${role}`,
    );
  });
  assert.equal(materializerScan.status, 'passed');
  assert.equal(
    materializerScan.guard_id,
    'oma.script_morphology.generic_materializer_no_resurrection_guard.v1',
  );
  assert.equal(
    materializerScan.policy_ref,
    'runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy.generic_materializer_no_resurrection_guard',
  );
  const genericMaterializerGuard = assertPolicyObject(
    morphologyPolicy,
    'generic_materializer_no_resurrection_guard',
  );
  assert.equal(materializerScan.guard_id, genericMaterializerGuard.guard_id);
  assert.equal(
    genericMaterializerGuard.readback_surface_ref,
    'runtime/authority_functions/meta-agent-authority-functions.json#source_purity_scan_receipt.generic_script_materializer_scan',
  );
  assert.equal(
    genericMaterializerGuard.state,
    'repo_machine_source_scan_declared_no_second_runtime_or_wrapper_materializer',
  );
  assert.deepEqual(asStrings(genericMaterializerGuard.scan_roots), [
    'scripts/',
    'runtime/authority_functions/',
    'contracts/',
    'agent/',
    'package.json',
  ]);
  assert.deepEqual(
    asStrings(materializerScan.scan_roots),
    asStrings(genericMaterializerGuard.scan_roots),
  );
  assert.equal(materializerScan.repo_owned_generic_wrapper_materializer_count, 0);
  assert.equal(materializerScan.repo_owned_generic_runtime_materializer_count, 0);
  assert.equal(materializerScan.repo_owned_queue_or_attempt_ledger_materializer_count, 0);
  assert.equal(materializerScan.repo_owned_target_worktree_lifecycle_materializer_count, 0);
  assert.deepEqual(asStrings(materializerScan.excluded_standard_surface_paths), [
    'agent/',
    'contracts/',
    'runtime/authority_functions/',
  ]);
  const expectedForbiddenMaterializerRoles = [
    'repo_owned_cli_wrapper_materializer',
    'repo_owned_mcp_wrapper_materializer',
    'repo_owned_skill_wrapper_materializer',
    'repo_owned_product_entry_wrapper_materializer',
    'repo_owned_domain_action_adapter_wrapper_materializer',
    'repo_owned_status_read_model_materializer',
    'repo_owned_workbench_wrapper_materializer',
    'repo_owned_generic_runtime_materializer',
    'repo_owned_queue_or_attempt_ledger_materializer',
    'repo_owned_target_worktree_lifecycle_materializer',
  ];
  assert.deepEqual(
    asStrings(materializerScan.forbidden_materializer_roles_absent),
    expectedForbiddenMaterializerRoles,
  );
  assert.deepEqual(
    asStrings(genericMaterializerGuard.forbidden_materializer_roles),
    expectedForbiddenMaterializerRoles,
  );
  assert.equal(
    materializerScan.retained_materializer_role,
    'refs_only_target_agent_semantics_work_order_candidate_or_typed_blocker_materializer',
  );
  assert.equal(
    genericMaterializerGuard.retained_materializer_role,
    materializerScan.retained_materializer_role,
  );
  assert.deepEqual(asStrings(genericMaterializerGuard.allowed_outputs), [
    'candidate_agent_package_ref',
    'developer_patch_work_order_ref',
    'target_capability_improvement_candidate_ref',
    'mechanism_patch_proposal_ref',
    'typed_blocker_ref',
    'refs_only_contract_template_ref',
  ]);
  assert.deepEqual(
    asStrings(materializerScan.allowed_outputs),
    asStrings(genericMaterializerGuard.allowed_outputs),
  );
  assert.deepEqual(asStrings(genericMaterializerGuard.fail_closed_conditions), [
    'repo_machine_source_declares_repo_owned_generic_runtime_materializer',
    'repo_machine_source_declares_repo_owned_cli_mcp_skill_product_status_workbench_wrapper_materializer',
    'script_writes_runtime_state_or_queue_attempt_ledger',
    'script_manages_target_worktree_lifecycle_or_absorb_cleanup',
    'script_claims_generated_interface_or_pack_compiler_ownership',
  ]);
  const materializerGuardBoundary = asBooleanRecord(genericMaterializerGuard.authority_boundary);
  const materializerScanBoundary = asBooleanRecord(materializerScan.authority_boundary);
  Object.entries(materializerGuardBoundary).forEach(([flag, value]) => {
    assert.equal(value, false, `generic materializer guard boundary ${flag} must be false`);
    assert.equal(
      materializerScanBoundary[flag.replace('guard_', 'scan_')],
      false,
      `generic materializer scan ${flag} must be false`,
    );
  });
  assert.deepEqual(asStrings(materializerScan.retired_materializer_tails), [
    'build_agent_baseline_no_closeout_implicit_fixture_graph',
    'meta_agent_loop_reexport_facade',
    'stage_decomposition_pack_draft_barrel_reexport_facade',
    'target_improvement_policy_generic_external_agent_patch_ref_fallback',
  ]);
  assert.deepEqual(asStrings(materializerScan.retired_materializer_tail_verification_refs), [
    'docs/history/process/retired-surface-provenance.md',
    'tests/source-purity.test.ts',
    'tests/stage-decomposition-materializer.test.ts',
    'tests/takeover-loop.test.ts',
    'tests/external-suite-developer-work-order.test.ts',
  ]);

  const retirementGates = asObjects(morphologyPolicy.script_to_pack_retirement_gates);
  assert.deepEqual(retirementGates.map((entry) => entry.gate_id), [
    'agent_evidence_and_external_suite_materializers',
    'build_agent_baseline_and_stage_decomposition_materializers',
    'external_work_order_execution_delegation',
    'source_structure_and_stage_control_maintenance_helpers',
    'repo_shell_verification_wrappers',
    'retained_thin_authority_helpers_and_takeover_smoke',
  ]);
  const gatedScriptRefs = [...new Set(
    retirementGates.flatMap((gate) => asStrings(gate.tracked_script_refs)),
  )].sort();
  assert.deepEqual(
    gatedScriptRefs,
    scripts,
    'Every repo-local TypeScript or shell script must have an explicit script-to-pack retirement or retention gate',
  );
  const sourceRefIntegrityGuard = assertPolicyObject(morphologyPolicy, 'source_ref_integrity_guard');
  assert.equal(sourceRefIntegrityGuard.guard_id, 'oma.script_morphology.source_ref_integrity_guard.v1');
  assert.equal(sourceRefIntegrityGuard.state, 'repo_local_script_refs_declared_no_second_truth');
  assert.equal(
    sourceRefIntegrityGuard.readback_surface_ref,
    'contracts/script_to_pack_gate_receipt.json#current_scan_summary',
  );
  assert.deepEqual(asStrings(sourceRefIntegrityGuard.allowed_ref_roots), ['scripts/']);
  assert.deepEqual(asStrings(sourceRefIntegrityGuard.allowed_extensions), ['.ts', '.sh']);
  assert.deepEqual(asStrings(sourceRefIntegrityGuard.forbidden_ref_shapes), [
    'absolute_path',
    'parent_directory_traversal',
    'uri_or_url',
    'empty_ref',
    'human_doc_ref_as_machine_source_ref',
    'non_scripts_root',
    'stale_or_missing_script_ref',
    'self_guard_only_caller_proof',
  ]);
  assert.deepEqual(sourceRefIntegrityGuard.validation_policy, {
    all_refs_must_be_repo_local: true,
    all_refs_must_exist_in_repo_checkout: true,
    all_refs_must_be_under_scripts_root: true,
    script_classifications_must_match_scanned_script_refs: true,
    retirement_gate_refs_must_match_scanned_script_refs: true,
    current_scan_summary_must_match_source_purity_receipt: true,
    human_doc_refs_do_not_count_as_machine_source_refs: true,
    self_guard_strings_do_not_count_as_script_ref_integrity: true,
  });
  assert.deepEqual(asStrings(sourceRefIntegrityGuard.fail_closed_conditions), [
    'script_ref_missing_in_checkout',
    'script_ref_outside_scripts_root',
    'script_ref_uses_uri_or_absolute_path',
    'script_ref_uses_parent_directory_traversal',
    'script_ref_uses_human_doc_shape',
    'script_classification_ref_not_in_scan_scope',
    'retirement_gate_ref_not_in_scan_scope',
    'current_scan_summary_ref_drift',
    'source_purity_self_guard_only_caller',
  ]);
  assert.deepEqual(sourceRefIntegrityViolations('../scripts/outside.ts'), [
    'parent_directory_traversal',
    'non_scripts_root',
  ]);
  assert.deepEqual(sourceRefIntegrityViolations('/tmp/oma-script.ts'), [
    'absolute_path',
    'non_scripts_root',
  ]);
  assert.deepEqual(sourceRefIntegrityViolations('https://example.test/script.ts'), [
    'uri_or_url',
    'non_scripts_root',
  ]);
  assert.deepEqual(sourceRefIntegrityViolations('human_doc:docs/status.md'), [
    'human_doc_ref_as_machine_source_ref',
    'non_scripts_root',
  ]);
  scripts.forEach(assertRepoLocalScriptRef);
  gatedScriptRefs.forEach(assertRepoLocalScriptRef);
  const sourceRefBoundary = asBooleanRecord(sourceRefIntegrityGuard.authority_boundary);
  [
    'guard_can_create_missing_refs',
    'guard_can_create_alias_files',
    'guard_can_authorize_physical_delete',
    'guard_can_claim_opl_primitive_parity',
    'guard_can_claim_default_promotion_or_cutover',
    'guard_can_claim_app_or_registry_readiness',
    'guard_can_claim_generated_hosted_readiness',
    'guard_can_claim_target_agent_ready',
    'guard_can_claim_domain_ready',
    'guard_can_claim_production_ready',
  ].forEach((flag) => {
    assert.equal(sourceRefBoundary[flag], false, `source-ref integrity boundary ${flag} must be false`);
  });
  retirementGates.forEach((gate) => {
    const trackedScriptRefs = asStrings(gate.tracked_script_refs);
    assert.ok(trackedScriptRefs.length > 0, `${gate.gate_id} should track at least one script`);
    trackedScriptRefs.forEach((scriptRef) => {
      assertRepoRefExists(scriptRef);
      assert.ok(scripts.includes(scriptRef), `${scriptRef} should be part of the tracked script set`);
    });
    assert.ok(
      asStrings(gate.required_before_retire_or_absorb).includes('no_active_npm_or_test_caller_ref'),
      `${gate.gate_id} should require no active caller evidence before retirement`,
    );
    assert.ok(
      asStrings(gate.required_before_retire_or_absorb).includes('tombstone_or_provenance_ref'),
      `${gate.gate_id} should require tombstone or provenance evidence`,
    );
    assert.ok(
      asStrings(gate.forbidden_long_term_claims).length > 0,
      `${gate.gate_id} should declare forbidden long-term claims`,
    );
  });
  const buildBaselineGate = retirementGates.find((gate) => (
    gate.gate_id === 'build_agent_baseline_and_stage_decomposition_materializers'
  ));
  assert.ok(buildBaselineGate, 'build-agent-baseline retirement gate should exist');
  assert.equal(buildBaselineGate.retention_state, 'retained_current_authority_function');
  assert.match(
    String(buildBaselineGate.retention_reason),
    /current OMA thin refs-only authority surface/,
    'stage materializer gate should be retained only as a thin refs-only authority surface',
  );
  [
    'package.json#scripts.build-agent-baseline',
    STANDARD_FOUNDRY_POLICIES_CONTRACT_REF,
    STAGE_NATIVE_ARTIFACT_VOCABULARY_CONTRACT_REF,
    'tests/bootstrap-loop.test.ts',
    'tests/stage-decomposition-materializer.test.ts',
    'tests/takeover-loop.test.ts',
  ].forEach((ref) => {
    assert.ok(
      asStrings(buildBaselineGate.retention_evidence_refs).includes(ref),
      `build-agent-baseline retained current gate should cite ${ref}`,
    );
  });
  assert.ok(
    asStrings(buildBaselineGate.required_before_retire_or_absorb).includes(
      'stable_standard_foundry_policies_moved_to_contract_or_opl_primitive_ref',
    ),
    'stage materializer retirement should require stable Foundry policy contract or OPL primitive migration',
  );
  assert.ok(
    asStrings(buildBaselineGate.closed_retention_refs).includes(STANDARD_FOUNDRY_POLICIES_CONTRACT_REF),
    'stable Foundry policy body should be moved into a contract while script projection remains retained',
  );
  assert.ok(
    asStrings(buildBaselineGate.closed_retention_refs).includes(STAGE_NATIVE_ARTIFACT_VOCABULARY_CONTRACT_REF),
    'stable Stage Native Artifact vocabulary should be moved into a contract while script projection remains retained',
  );
  assert.ok(
    asStrings(buildBaselineGate.closed_retention_refs).includes(
      'retired-tail:opl-meta-agent/stage-decomposition-pack-draft/barrel-reexport-facade',
    ),
    'stage-decomposition barrel re-export should be recorded as a retired tail',
  );
  assert.equal(
    fs.existsSync(path.join(repoRoot, 'scripts/lib/stage-decomposition-pack-draft.ts')),
    false,
    'retired scripts/lib/stage-decomposition-pack-draft.ts barrel facade must not be restored',
  );
  assert.ok(
    asStrings(buildBaselineGate.required_before_retire_or_absorb).includes(
      'opl_physical_kernel_locator_conformance_workbench_consumption_parity_ref',
    ),
    'stage materializer retirement should require OPL physical kernel/conformance/workbench parity',
  );
  assert.ok(
    asStrings(buildBaselineGate.required_before_retire_or_absorb).includes(
      'opl_pack_compiler_target_pack_fixture_parity_ref',
    ),
    'stage materializer retirement should require OPL pack compiler target-pack fixture parity',
  );
  assert.ok(
    asStrings(buildBaselineGate.required_before_retire_or_absorb).includes(
      'no_domain_pack_helper_pack_compiler_or_generated_interface_owner_ref',
    ),
    'stage materializer retirement should prove domain-pack helper has not become pack compiler or generated interface owner',
  );
  assert.ok(
    asStrings(buildBaselineGate.required_before_retire_or_absorb).includes(
      'no_oma_runtime_state_owner_promotion_worktree_or_receipt_body_ref',
    ),
    'stage materializer retirement should prove no OMA runtime state, promotion, worktree, or receipt body ownership',
  );
  [
    'pack_compiler_owner',
    'generated_interface_owner',
    'physical_kernel_runtime_state_owner',
    'conformance_gate_owner',
    'workbench_consumption_owner',
    'owner_promotion_or_receipt_body_authority',
    'target_worktree_lifecycle_owner',
  ].forEach((claim) => {
    assert.ok(
      asStrings(buildBaselineGate.forbidden_long_term_claims).includes(claim),
      `build-agent-baseline retirement gate should forbid ${claim}`,
    );
  });
  const externalSuiteGate = retirementGates.find((gate) => (
    gate.gate_id === 'agent_evidence_and_external_suite_materializers'
  ));
  assert.ok(externalSuiteGate, 'agent evidence / external suite materializer gate should exist');
  assert.ok(
    asStrings(externalSuiteGate.closed_retention_refs).includes(
      'retired-tail:opl-meta-agent/target-improvement-policy/generic-external-agent-patch-ref-fallback',
    ),
    'generic external-agent patch-ref fallback should be recorded as a retired tail',
  );
  assert.ok(
    asStrings(externalSuiteGate.forbidden_long_term_claims).includes('generic_external_agent_patch_ref_fallback'),
    'external suite materializer gate should forbid generic external-agent patch-ref fallback resurrection',
  );
  const retainedHelperGate = retirementGates.find((gate) => (
    gate.gate_id === 'retained_thin_authority_helpers_and_takeover_smoke'
  ));
  assert.ok(retainedHelperGate, 'thin helper/takeover retention gate should exist');
  assert.deepEqual(asStrings(retainedHelperGate.tracked_script_refs), [
    'scripts/lib/meta-agent-loop-ai-reviewer.ts',
    'scripts/lib/meta-agent-loop-io.ts',
    'scripts/lib/meta-agent-loop-receipts.ts',
    'scripts/takeover-agent.ts',
  ]);
  assert.equal(retainedHelperGate.retention_state, 'retained_current_authority_function');
  assert.match(
    String(retainedHelperGate.retention_reason),
    /without owning target truth/,
  );
  [
    'package.json#scripts.takeover:test',
    'tests/takeover-loop.test.ts',
    'tests/target-improvement-policy.test.ts',
    'tests/agent-evidence-materializer.test.ts',
    'tests/external-suite-efficiency-handoff.test.ts',
    'tests/source-purity/script-morphology.test-case.ts',
  ].forEach((ref) => {
    assert.ok(
      asStrings(retainedHelperGate.retention_evidence_refs).includes(ref),
      `thin helper/takeover retention gate should cite ${ref}`,
    );
  });
  assert.ok(
    asStrings(retainedHelperGate.closed_retention_refs).includes(
      'retired-tail:opl-meta-agent/meta-agent-loop/reexport-facade',
    ),
    'retired meta-agent-loop re-export facade should remain closed',
  );
  assert.equal(
    fs.existsSync(path.join(repoRoot, 'scripts/lib/meta-agent-loop.ts')),
    false,
    'retired scripts/lib/meta-agent-loop.ts re-export facade must not be restored',
  );
  [
    'opl_generated_interface_or_invocation_helper_parity_ref',
    'opl_agent_lab_takeover_handoff_parity_ref',
    'no_target_truth_verdict_artifact_memory_or_owner_receipt_body_ref',
    'no_agent_lab_runner_promotion_gate_registry_or_app_shell_owner_ref',
  ].forEach((required) => {
    assert.ok(
      asStrings(retainedHelperGate.required_before_retire_or_absorb).includes(required),
      `thin helper/takeover retention gate should require ${required}`,
    );
  });
  [
    'registry_owner',
    'app_shell_owner',
    'generated_interface_owner',
    'target_owner_receipt_body_writer',
    'generic_runtime_owner',
  ].forEach((claim) => {
    assert.ok(
      asStrings(retainedHelperGate.forbidden_long_term_claims).includes(claim),
      `thin helper/takeover retention gate should forbid ${claim}`,
    );
  });
  const sourceStructureGate = retirementGates.find((gate) => (
    gate.gate_id === 'source_structure_and_stage_control_maintenance_helpers'
  ));
  assert.ok(sourceStructureGate, 'source-structure maintenance gate should exist');
  assert.deepEqual(asStrings(sourceStructureGate.tracked_script_refs), [
    'scripts/check-source-structure.ts',
    'scripts/sync-authority-functions.ts',
    'scripts/sync-stage-control-plane.ts',
  ]);
  [
    'authority_functions_source_aggregate_sync_parity_ref',
    'opl_framework_source_structure_lane_parity_ref',
    'stage_control_plane_source_aggregate_sync_parity_ref',
    'no_generated_aggregate_drift_ref',
  ].forEach((required) => {
    assert.ok(
      asStrings(sourceStructureGate.required_before_retire_or_absorb).includes(required),
      `source-structure maintenance gate should require ${required}`,
    );
  });
  [
    'generic_runtime_owner',
    'generated_interface_owner',
    'domain_truth_writer',
    'stage_runtime_owner',
    'line_budget_default_hard_gate',
  ].forEach((claim) => {
    assert.ok(
      asStrings(sourceStructureGate.forbidden_long_term_claims).includes(claim),
      `source-structure maintenance gate should forbid ${claim}`,
    );
  });
  const shellWrapperGate = retirementGates.find((gate) => (
    gate.gate_id === 'repo_shell_verification_wrappers'
  ));
  assert.ok(shellWrapperGate, 'repo shell verification wrapper gate should exist');
  assert.deepEqual(asStrings(shellWrapperGate.tracked_script_refs), [
    'scripts/repo-hygiene.sh',
    'scripts/run-with-repo-temp-env.sh',
    'scripts/verify.sh',
  ]);
  [
    'opl_framework_repo_verification_entrypoint_parity_ref',
    'external_cache_and_temp_env_boundary_parity_ref',
    'repo_hygiene_cleanup_route_parity_ref',
    'no_active_npm_or_test_caller_ref',
    'tombstone_or_provenance_ref',
  ].forEach((required) => {
    assert.ok(
      asStrings(shellWrapperGate.required_before_retire_or_absorb).includes(required),
      `repo shell wrapper gate should require ${required}`,
    );
  });
  [
    'generic_cli_wrapper_owner',
    'generic_runtime_owner',
    'scheduler_or_daemon_owner',
    'queue_or_attempt_ledger_owner',
    'generated_interface_owner',
    'target_truth_or_quality_writer',
    'line_budget_default_hard_gate',
  ].forEach((claim) => {
    assert.ok(
      asStrings(shellWrapperGate.forbidden_long_term_claims).includes(claim),
      `repo shell wrapper gate should forbid ${claim}`,
    );
  });

  const implementationRefs = new Map<string, string[]>();
  asObjects(authorityFunctions.functions).forEach((functionRef) => {
    asStrings(functionRef.implementation_refs).forEach((scriptRef) => {
      const refs = implementationRefs.get(scriptRef) ?? [];
      refs.push(functionRef.authority_ref);
      implementationRefs.set(scriptRef, refs);
    });
  });

  const classifiedScripts = asObjects(morphologyPolicy.script_classifications)
    .map((entry) => entry.script_ref as string)
    .sort();
  assert.deepEqual(classifiedScripts, scripts);
  assert.deepEqual(asStrings(receipt.scanned_script_refs).sort(), scripts);
  const activeCallerScan = assertPolicyObject(receipt, 'active_script_caller_scan');
  const activeCallerScanPolicy = assertPolicyObject(morphologyPolicy, 'active_caller_scan_policy');
  const expectedActiveCallerScan = collectActiveScriptCallerScan(scripts);
  assert.equal(activeCallerScanPolicy.policy_id, ACTIVE_CALLER_SCAN_POLICY_ID);
  assert.equal(
    activeCallerScanPolicy.receipt_ref,
    'runtime/authority_functions/meta-agent-authority-functions.json#source_purity_scan_receipt.active_script_caller_scan',
  );
  assert.equal(activeCallerScan.policy_id, activeCallerScanPolicy.policy_id);
  assert.deepEqual(activeCallerScan, expectedActiveCallerScan);
  assert.equal(activeCallerScan.status, 'passed');
  assert.equal(activeCallerScan.active_caller_required, activeCallerScanPolicy.active_caller_required);
  assert.equal(activeCallerScan.orphan_script_count, activeCallerScanPolicy.orphan_script_count_must_be);
  assert.deepEqual(
    asStrings(activeCallerScan.scan_inputs),
    assertPolicyStringList(activeCallerScanPolicy, 'scan_inputs'),
  );
  assert.equal(activeCallerScanPolicy.self_guard_test_ref, 'tests/source-purity.test.ts');
  assert.deepEqual(asStrings(activeCallerScanPolicy.self_guard_test_refs), [
    'tests/source-purity.test.ts',
    'tests/source-purity/',
  ]);
  assert.equal(activeCallerScanPolicy.self_guard_module_scope, 'tests/source-purity/');
  assert.equal(activeCallerScanPolicy.self_guard_may_prove_active_caller, false);
  const proofSourcePolicy = assertPolicyObject(activeCallerScanPolicy, 'proof_source_policy');
  assert.equal(proofSourcePolicy.policy_id, 'oma.script-active-caller-proof-source.v1');
  assert.equal(proofSourcePolicy.caller_proof_must_be_machine_scanned, true);
  assert.equal(proofSourcePolicy.package_script_import_shell_or_non_self_test_ref_required, true);
  assert.equal(proofSourcePolicy.self_guard_test_strings_count_as_caller, false);
  assert.equal(proofSourcePolicy.self_guard_module_strings_count_as_caller, false);
  assert.equal(proofSourcePolicy.test_ref_callers_must_be_outside_self_guard, true);
  assert.equal(proofSourcePolicy.caller_ref_paths_must_exist, true);
  assert.equal(proofSourcePolicy.receipt_must_not_synthesize_callers, true);
  assert.ok(
    assertPolicyStringList(activeCallerScanPolicy, 'fail_closed_conditions').includes(
      'source_purity_self_guard_only_caller',
    ),
  );
  assert.ok(
    assertPolicyStringList(activeCallerScanPolicy, 'fail_closed_conditions').includes(
      'caller_proof_source_not_machine_scanned',
    ),
  );
  asObjects(activeCallerScan.caller_refs_by_script).forEach((entry) => {
    assert.ok(scripts.includes(entry.script_ref), `${entry.script_ref} should be part of the tracked script set`);
    assert.ok(
      asStrings(entry.active_caller_refs).length > 0,
      `${entry.script_ref} should have at least one active caller before it can stay retained`,
    );
    asStrings(entry.active_caller_refs).forEach((callerRef) => {
      assert.equal(
        callerRef.startsWith('tests/source-purity.test.ts#test_ref'),
        false,
        `${entry.script_ref} active caller should not be self-proven by source-purity string guards`,
      );
      if (callerRef.startsWith('package.json#scripts.')) return;
      const [callerPath] = callerRef.split('#');
      assertRepoRefExists(callerPath);
    });
  });

  asObjects(morphologyPolicy.script_classifications).forEach((entry) => {
    assertRepoRefExists(entry.script_ref);
    assert.ok(entry.classes.length > 0, `${entry.script_ref} should have at least one script class`);
    asStrings(entry.classes).forEach((classId) => {
      assert.ok(
        morphologyPolicy.allowed_classes.includes(classId),
        `${entry.script_ref} uses unsupported script morphology class ${classId}`,
      );
    });
    assert.deepEqual(entry.forbidden_roles, [], `${entry.script_ref} must not declare forbidden roles`);
    assert.ok(entry.writes_only.length > 0, `${entry.script_ref} should declare refs-only writes`);
    asStrings(entry.consumes_opl_surfaces ?? []).forEach((surfaceRef) => {
      assert.ok(
        allowedOplSurfaceRefIds.has(surfaceRef),
        `${entry.script_ref} consumes unsupported OPL surface ${surfaceRef}`,
      );
      const surfacePolicy = allowedOplSurfaceRefs.find((surface) => surface.surface_ref === surfaceRef);
      assert.ok(surfacePolicy, `${surfaceRef} should have an OPL surface policy entry`);
      assert.ok(
        asStrings(entry.classes).some((classId) => asStrings(surfacePolicy.allowed_script_classes).includes(classId)),
        `${entry.script_ref} consumes ${surfaceRef} without an allowed script class`,
      );
    });
    if (entry.script_ref === 'scripts/lib/stage-decomposition-runner.ts') {
      assert.ok(
        asStrings(entry.writes_only).includes('fixture_closeout_packet_required_typed_blocker_ref'),
      );
      assert.deepEqual(asStrings(entry.retired_tail_refs), [
        'retired-tail:opl-meta-agent/build-agent-baseline/no-closeout-implicit-fixture-graph',
      ]);
    }
    if (entry.script_ref === 'scripts/lib/target-improvement-policy.ts') {
      assert.ok(
        asStrings(entry.writes_only).includes('missing_target_improvement_policy_typed_blocker_ref'),
        'target-improvement-policy should fail closed with a typed blocker when target policy refs are missing',
      );
      assert.deepEqual(asStrings(entry.contract_refs), [
        DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF,
      ]);
      assert.deepEqual(asStrings(entry.retired_tail_refs), [
        'retired-tail:opl-meta-agent/target-improvement-policy/generic-external-agent-patch-ref-fallback',
      ]);
    }
    if (entry.script_ref === 'scripts/lib/stage-decomposition-pack-draft-parts/shared.ts') {
      assert.deepEqual(asStrings(entry.contract_refs), [
        STANDARD_FOUNDRY_POLICIES_CONTRACT_REF,
      ]);
      [
        'standard_foundry_policy_ref',
        'stage_progress_delta_policy_ref',
        'typed_blocker_lineage_policy_ref',
        'stage_completion_policy_ref',
        'foundry_agent_series_design_profile_ref',
      ].forEach((writeRef) => {
        assert.ok(asStrings(entry.writes_only).includes(writeRef), `${entry.script_ref} writes_only ${writeRef}`);
      });
    }
    if (entry.script_ref === 'scripts/lib/stage-native-artifact-contract.ts') {
      assert.deepEqual(asStrings(entry.contract_refs), [
        STAGE_NATIVE_ARTIFACT_VOCABULARY_CONTRACT_REF,
      ]);
      [
        'opl_physical_kernel_locator_ref',
        'stage_artifact_conformance_ref',
        'stage_artifact_workbench_consumption_ref',
      ].forEach((writeRef) => {
        assert.ok(asStrings(entry.writes_only).includes(writeRef), `${entry.script_ref} writes_only ${writeRef}`);
      });
    }
    if (entry.script_ref === 'scripts/lib/domain-pack.ts') {
      assert.deepEqual(asStrings(entry.classes), [
        'fixture_or_proof_helper',
      ]);
      assert.deepEqual(asStrings(entry.consumes_opl_surfaces ?? []), []);
      [
        'domain_pack_summary_ref',
        'domain_pack_fixture_ref',
        'target_agent_minimal_domain_pack_fixture_ref',
        'generated_agent_morphology_conformance_fixture_ref',
        'generated_interface_owner_boundary_ref',
        'no_target_domain_truth_write_guard_ref',
        'no_default_promotion_without_gate_guard_ref',
      ].forEach((writeRef) => {
        assert.ok(asStrings(entry.writes_only).includes(writeRef), `${entry.script_ref} writes_only ${writeRef}`);
      });
      [
        'pack_compiler_owner',
        'generated_interface_owner',
        'scaffold_generator_owner',
        'target_pack_authority',
      ].forEach((forbiddenRole) => {
        assert.ok(
          morphologyPolicy.forbidden_roles.includes(forbiddenRole),
          `${entry.script_ref} should inherit forbidden script role ${forbiddenRole}`,
        );
      });
    }
    if (entry.script_ref === 'scripts/takeover-agent.ts') {
      [
        'new_agent_delivery_gate_ref',
        'no_patch_coordination_receipt_ref',
      ].forEach((writeRef) => {
        assert.ok(asStrings(entry.writes_only).includes(writeRef), `${entry.script_ref} writes_only ${writeRef}`);
      });
    }
    if (entry.script_ref === 'scripts/check-source-structure.ts') {
      assert.deepEqual(asStrings(entry.contract_refs), [
        'contracts/source_structure_policy.json',
      ]);
      assert.ok(
        asStrings(entry.writes_only).includes('source_structure_line_budget_receipt_ref'),
      );
      assert.ok(
        asStrings(entry.writes_only).includes('source_structure_json_readback_ref'),
      );
      assert.ok(
        asStrings(entry.writes_only).includes('script_to_pack_receipt_guard_readback_ref'),
      );
    }
    if (entry.script_ref === 'scripts/sync-stage-control-plane.ts') {
      assert.deepEqual(asStrings(entry.contract_refs), [
        'contracts/stage_control_plane.json',
        'contracts/stage_control_plane.source.json',
        'contracts/stage_control_plane.leaf-index.json',
      ]);
      assert.ok(
        asStrings(entry.writes_only).includes('stage_control_plane_drift_check_ref'),
      );
    }
    if (entry.script_ref === 'scripts/sync-authority-functions.ts') {
      assert.deepEqual(asStrings(entry.contract_refs), [
        'runtime/authority_functions/meta-agent-authority-functions.json',
        'runtime/authority_functions/meta-agent-authority-functions.source.json',
        'runtime/authority_functions/meta-agent-authority-functions.leaf-index.json',
      ]);
      assert.ok(
        asStrings(entry.writes_only).includes('authority_functions_drift_check_ref'),
      );
    }
    if (entry.script_ref === 'scripts/repo-hygiene.sh') {
      assert.ok(asStrings(entry.writes_only).includes('repo_hygiene_check_ref'));
      assert.ok(asStrings(entry.writes_only).includes('ignored_generated_cleanup_ref'));
    }
    if (entry.script_ref === 'scripts/run-with-repo-temp-env.sh') {
      assert.ok(asStrings(entry.writes_only).includes('repo_temp_env_boundary_ref'));
      assert.ok(asStrings(entry.writes_only).includes('external_cache_redirect_ref'));
    }
    if (entry.script_ref === 'scripts/verify.sh') {
      assert.ok(asStrings(entry.writes_only).includes('repo_native_verification_entrypoint_ref'));
      assert.ok(asStrings(entry.writes_only).includes('smoke_behavior_structure_verification_lane_ref'));
    }
    if (entry.script_ref === 'scripts/lib/work-order-refs.ts') {
      assert.deepEqual(asStrings(entry.contract_refs), [
        DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF,
      ]);
      assert.ok(
        asStrings(entry.writes_only).includes('developer_work_order_policy_contract_consumer_ref'),
      );
    }

    const declaredAuthorityRefs = entry.authority_function_refs ?? [];
    const expectedAuthorityRefs = implementationRefs.get(entry.script_ref) ?? [];
    if (entry.classes.includes('authority_function_implementation_ref')) {
      assert.deepEqual(
        declaredAuthorityRefs.sort(),
        expectedAuthorityRefs.sort(),
        `${entry.script_ref} authority refs must match runtime authority implementation_refs`,
      );
      assert.ok(expectedAuthorityRefs.length > 0, `${entry.script_ref} should be listed by a runtime authority function`);
    } else {
      assert.deepEqual(
        declaredAuthorityRefs,
        [],
        `${entry.script_ref} should not declare authority refs unless it is an implementation ref`,
      );
      assert.equal(
        implementationRefs.has(entry.script_ref),
        false,
        `${entry.script_ref} is referenced by authority functions but not classified as implementation ref`,
      );
    }
  });

  assert.deepEqual(asStrings(receipt.retained_non_polluting_domain_authority_surfaces), [
    'agent/',
    'contracts/',
    'runtime/authority_functions/',
    'scripts authority/materializer/helper and verification-wrapper refs',
  ]);
  assert.ok(asStrings(receipt.forbidden_long_term_composition_claims).includes('repo_owned_generic_cli_mcp_skill_product_status_workbench_wrapper'));
});
