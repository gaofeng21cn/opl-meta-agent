import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  assert,
  assertRepoRefExists,
  asObjects,
  asStrings,
  repoRoot,
  readJson,
  type JsonObject,
} from './support/contracts.ts';
import {
  DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF,
  STAGE_NATIVE_ARTIFACT_VOCABULARY_CONTRACT_REF,
  STANDARD_FOUNDRY_POLICIES_CONTRACT_REF,
  ACTIVE_CALLER_SCAN_POLICY_ID,
  assertPolicyObject,
  assertPolicyStringList,
  asBooleanRecord,
  collectActiveScriptCallerScan,
  listScriptRefs,
} from './support/source-purity.ts';

function valuesAtDottedPath(contract: unknown, dottedPath: string): unknown[] {
  const values = dottedPath.split('.').reduce<unknown[]>((currentValues, segment) => (
    currentValues.flatMap((currentValue) => valuesAtSegment(currentValue, segment))
  ), [contract]);
  return values.flatMap((value) => Array.isArray(value) ? value : [value]);
}

function valuesAtSegment(value: unknown, segment: string): unknown[] {
  if (Array.isArray(value)) {
    const selected = value.filter((entry) => (
      entry
      && typeof entry === 'object'
      && [
        'module_id',
        'tail_id',
        'gate_id',
        'action_id',
        'section_id',
      ].some((key) => (entry as JsonObject)[key] === segment)
    ));
    if (selected.length > 0) {
      return selected;
    }
    return value.flatMap((entry) => valuesAtSegment(entry, segment));
  }
  if (!value || typeof value !== 'object') {
    return [];
  }
  return Object.hasOwn(value as JsonObject, segment) ? [(value as JsonObject)[segment]] : [];
}

function listFalseReadyScanSourceRefs(relativeRef: string): string[] {
  const absoluteRef = path.join(repoRoot, relativeRef);
  if (!fs.existsSync(absoluteRef)) return [];
  const stat = fs.statSync(absoluteRef);
  if (stat.isFile()) {
    if (relativeRef === 'tests/source-purity.test.ts') return [];
    return ['.json', '.ts', '.sh', '.yml', '.yaml'].includes(path.extname(relativeRef))
      ? [relativeRef]
      : [];
  }
  return fs.readdirSync(absoluteRef, { withFileTypes: true })
    .flatMap((entry) => listFalseReadyScanSourceRefs(path.join(relativeRef, entry.name)))
    .sort();
}

function falseReadyLiteralParts(claimKey: string): string[] {
  return [
    `"${claimKey}": true`,
    `"${claimKey}": True`,
    `'${claimKey}': true`,
    `'${claimKey}': True`,
    `${claimKey}: true`,
    `${claimKey} = true`,
  ];
}

function collectFalseReadyClaimMatchesFromSource(
  sourceRef: string,
  source: string,
  claimKeys: string[],
): { path: string; claimKey: string }[] {
  return claimKeys.flatMap((claimKey) => (
    falseReadyLiteralParts(claimKey).some((literal) => source.includes(literal))
      ? [{ path: sourceRef, claimKey }]
      : []
  ));
}

function collectFalseReadyClaimMatches(claimKeys: string[]): { path: string; claimKey: string }[] {
  const scanRoots = ['agent', 'contracts', 'runtime', 'scripts', 'tests', 'package.json'];
  return scanRoots.flatMap((rootRef) => (
    listFalseReadyScanSourceRefs(rootRef).flatMap((sourceRef) => {
      const source = fs.readFileSync(path.join(repoRoot, sourceRef), 'utf8');
      return collectFalseReadyClaimMatchesFromSource(sourceRef, source, claimKeys);
    })
  ));
}

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
  assert.equal(materializerScan.repo_owned_generic_wrapper_materializer_count, 0);
  assert.deepEqual(asStrings(materializerScan.excluded_standard_surface_paths), [
    'agent/',
    'contracts/',
    'runtime/authority_functions/',
  ]);
  assert.deepEqual(asStrings(materializerScan.forbidden_materializer_roles_absent), [
    'repo_owned_cli_wrapper_materializer',
    'repo_owned_mcp_wrapper_materializer',
    'repo_owned_skill_wrapper_materializer',
    'repo_owned_product_entry_wrapper_materializer',
    'repo_owned_domain_action_adapter_wrapper_materializer',
    'repo_owned_status_read_model_materializer',
    'repo_owned_workbench_wrapper_materializer',
  ]);
  assert.equal(
    materializerScan.retained_materializer_role,
    'refs_only_target_agent_semantics_work_order_candidate_or_typed_blocker_materializer',
  );
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
  assert.equal(activeCallerScanPolicy.self_guard_may_prove_active_caller, false);
  const proofSourcePolicy = assertPolicyObject(activeCallerScanPolicy, 'proof_source_policy');
  assert.equal(proofSourcePolicy.policy_id, 'oma.script-active-caller-proof-source.v1');
  assert.equal(proofSourcePolicy.caller_proof_must_be_machine_scanned, true);
  assert.equal(proofSourcePolicy.package_script_import_shell_or_non_self_test_ref_required, true);
  assert.equal(proofSourcePolicy.self_guard_test_strings_count_as_caller, false);
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
      assert.ok(
        asStrings(entry.writes_only).includes('target_improvement_default_change_ref_policy_consumer_ref'),
        'target-improvement-policy should consume default change-ref mapping from the developer work-order policy contract',
      );
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
    if (entry.script_ref === 'scripts/check-source-structure.ts') {
      assert.deepEqual(asStrings(entry.contract_refs), [
        'contracts/source_structure_policy.json',
      ]);
      assert.ok(
        asStrings(entry.writes_only).includes('source_structure_line_budget_receipt_ref'),
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

test('developer work-order policy defaults are contract-owned and helper-projection free', () => {
  const contract = readJson(DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF);
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const morphologyPolicy = authorityFunctions.script_morphology_policy as JsonObject;
  const receipt = authorityFunctions.source_purity_scan_receipt as JsonObject;
  const retirementGate = asObjects(morphologyPolicy.script_to_pack_retirement_gates)
    .find((gate) => gate.gate_id === 'agent_evidence_and_external_suite_materializers');
  const activeConsumer = asObjects(morphologyPolicy.script_classifications)
    .find((entry) => entry.script_ref === 'scripts/lib/work-order-refs.ts');
  const retiredProjection = asObjects(morphologyPolicy.script_classifications)
    .find((entry) => entry.script_ref === 'scripts/lib/work-order-policy-constants.ts');
  const defaultForbiddenTargetPathsOrSurfaces = assertPolicyStringList(
    contract,
    'default_forbidden_target_paths_or_surfaces',
  );
  const defaultRuntimeRequiredSurfaceRefs = assertPolicyStringList(
    contract,
    'default_runtime_required_surface_refs',
  );
  const defaultRuntimeExpectedOutcomes = assertPolicyStringList(
    contract,
    'default_runtime_expected_outcomes',
  );
  const defaultTargetWorkspaceRequiredSurfaceRefs = assertPolicyStringList(
    contract,
    'default_target_workspace_required_surface_refs',
  );
  const defaultTargetWorkspaceExpectedOutcomes = assertPolicyStringList(
    contract,
    'default_target_workspace_expected_outcomes',
  );
  const defaultNoPatchCloseoutEvidence = assertPolicyStringList(
    contract,
    'default_no_patch_closeout_evidence',
  );
  const defaultSourcePatchCloseoutEvidence = assertPolicyStringList(
    contract,
    'default_source_patch_closeout_evidence',
  );
  const targetImprovementDefaultChangeRefPolicy = assertPolicyObject(
    contract,
    'target_improvement_default_change_ref_policy',
  );

  assert.equal(contract.surface_kind, 'developer_work_order_policy');
  assert.equal(contract.state, 'active_contract');
  assert.equal(
    contract.retired_script_projection_tombstone_ref,
    'scripts/lib/work-order-policy-constants.ts',
  );
  assert.equal(contract.retired_script_projection_no_resurrection, true);
  assert.equal(Object.hasOwn(contract, 'retired_script_projection_ref'), false);
  assert.deepEqual(asStrings(contract.active_policy_consumer_refs), [
    'scripts/lib/work-order-refs.ts',
  ]);
  assert.equal(contract.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(contract.authority_boundary.can_write_target_memory_body, false);
  assert.equal(contract.authority_boundary.can_write_target_artifact_body, false);
  assert.equal(contract.authority_boundary.can_authorize_target_quality_or_export, false);
  assert.equal(contract.authority_boundary.can_authorize_submission_readiness, false);
  assert.equal(contract.authority_boundary.can_promote_default_agent, false);

  assert.equal(
    fs.existsSync(path.join(repoRoot, 'scripts/lib/work-order-policy-constants.ts')),
    false,
    'developer work-order policy projection helper should be physically retired',
  );
  assert.equal(retiredProjection, undefined, 'retired work-order policy projection script should not be classified');
  assert.ok(activeConsumer, 'work-order refs helper should consume the developer work-order policy contract');
  assert.deepEqual(asStrings(activeConsumer.contract_refs), [
    DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF,
  ]);
  assert.ok(
    asStrings(activeConsumer.writes_only).includes('developer_work_order_policy_contract_consumer_ref'),
  );
  assert.equal(
    asStrings(receipt.scanned_script_refs).includes('scripts/lib/work-order-policy-constants.ts'),
    false,
    'retired work-order policy projection helper should not appear in scanned script refs',
  );
  assert.ok(retirementGate, 'agent evidence materializer gate should exist');
  assert.ok(
    asStrings(retirementGate.closed_retention_refs).includes(DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF),
    'stable developer work-order policy should be moved into a contract while script projection remains retained',
  );
  assert.ok(
    asStrings(retirementGate.closed_retention_refs)
      .includes(`${DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF}#/target_improvement_default_change_ref_policy`),
    'target improvement default change-ref mapping should be moved into the developer work-order policy contract',
  );

  assert.ok(defaultForbiddenTargetPathsOrSurfaces.includes('target domain truth surfaces'));
  assert.ok(defaultForbiddenTargetPathsOrSurfaces.includes('export verdict bodies'));
  assert.ok(defaultRuntimeRequiredSurfaceRefs.includes('target_agent_owner_receipt_contract'));
  assert.ok(defaultRuntimeRequiredSurfaceRefs.includes('default_executor_dispatch_execution'));
  assert.ok(
    defaultRuntimeExpectedOutcomes.some((entry) => entry.includes('no forbidden target domain truth')),
  );
  assert.ok(defaultTargetWorkspaceRequiredSurfaceRefs.includes('target_workspace_pyproject_or_lock'));
  assert.ok(defaultTargetWorkspaceRequiredSurfaceRefs.includes('target_repo_hygiene_status'));
  assert.ok(
    defaultTargetWorkspaceExpectedOutcomes.some((entry) => entry.includes('target checkout .venv')),
  );
  assert.ok(
    defaultNoPatchCloseoutEvidence.some((entry) => entry.includes('no target source patch')),
  );
  assert.ok(defaultSourcePatchCloseoutEvidence.includes('patch_traceability_matrix addressed'));
  assert.ok(defaultSourcePatchCloseoutEvidence.includes('temporary worktree cleaned after absorb'));
  assert.equal(targetImprovementDefaultChangeRefPolicy.surface_kind, 'target_improvement_default_change_ref_policy');
  assert.equal(targetImprovementDefaultChangeRefPolicy.state, 'active_contract_policy');
  assert.deepEqual(asStrings(targetImprovementDefaultChangeRefPolicy.active_policy_consumer_refs), [
    'scripts/lib/target-improvement-policy.ts',
  ]);
  assert.ok(asStrings(targetImprovementDefaultChangeRefPolicy.triggers).includes('owner-receipt'));
  assert.ok(asStrings(targetImprovementDefaultChangeRefPolicy.triggers).includes('production_acceptance'));
  assert.ok(
    asStrings(targetImprovementDefaultChangeRefPolicy.default_change_refs)
      .includes('target_agent_owner_receipt_contract_ref:target_agent/live-acceptance'),
  );
  assert.ok(
    asObjects(targetImprovementDefaultChangeRefPolicy.change_ref_mappings)
      .some((entry) => entry.token === 'live-acceptance'),
  );
  assert.equal(targetImprovementDefaultChangeRefPolicy.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(targetImprovementDefaultChangeRefPolicy.authority_boundary.can_write_target_owner_receipt_body, false);
  assert.equal(targetImprovementDefaultChangeRefPolicy.authority_boundary.can_authorize_target_quality_or_export, false);
});

test('standard Foundry policies are contract-owned and helper-projection free', () => {
  const contract = readJson(STANDARD_FOUNDRY_POLICIES_CONTRACT_REF);
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const morphologyPolicy = authorityFunctions.script_morphology_policy as JsonObject;
  const receipt = authorityFunctions.source_purity_scan_receipt as JsonObject;
  const retirementGate = asObjects(morphologyPolicy.script_to_pack_retirement_gates)
    .find((gate) => gate.gate_id === 'build_agent_baseline_and_stage_decomposition_materializers');
  const activeConsumer = asObjects(morphologyPolicy.script_classifications)
    .find((entry) => entry.script_ref === 'scripts/lib/stage-decomposition-pack-draft-parts/shared.ts');
  const retiredProjection = asObjects(morphologyPolicy.script_classifications)
    .find((entry) => entry.script_ref === 'scripts/lib/standard-foundry-policies.ts');
  const userStageLogRequiredFields = assertPolicyStringList(contract, 'user_stage_log_required_fields');
  const userStageLogContract = assertPolicyObject(contract, 'user_stage_log_contract');
  const stageProgressDeltaPolicy = assertPolicyObject(contract, 'stage_progress_delta_policy');
  const typedBlockerLineagePolicy = assertPolicyObject(contract, 'typed_blocker_lineage_policy');
  const seriesDesignProfile = assertPolicyObject(contract, 'series_design_profile');
  const forbiddenGenericOwnerRoles = assertPolicyStringList(contract, 'forbidden_generic_owner_roles');
  const stagePackDefaults = assertPolicyObject(contract, 'stage_pack_defaults');
  const sharedPolicyRelease = assertPolicyObject(contract, 'shared_policy_release');
  const artifactMorphologyPolicy = assertPolicyObject(seriesDesignProfile, 'artifact_morphology_policy');

  assert.equal(contract.surface_kind, 'standard_foundry_policies');
  assert.equal(contract.state, 'active_contract');
  assert.equal(
    contract.retired_script_projection_tombstone_ref,
    'scripts/lib/standard-foundry-policies.ts',
  );
  assert.equal(contract.retired_script_projection_no_resurrection, true);
  assert.equal(Object.hasOwn(contract, 'retired_script_projection_ref'), false);
  assert.deepEqual(asStrings(contract.active_policy_consumer_refs), [
    'scripts/lib/stage-decomposition-pack-draft-parts/shared.ts',
  ]);
  assert.equal(contract.authority_boundary.can_write_target_domain_truth, false);
  assert.equal(contract.authority_boundary.can_read_target_domain_body, false);
  assert.equal(contract.authority_boundary.can_authorize_target_quality_or_export, false);
  assert.equal(contract.authority_boundary.can_promote_default_agent, false);
  assert.equal(contract.authority_boundary.can_replace_opl_framework_or_agent_lab, false);

  assert.equal(
    fs.existsSync(path.join(repoRoot, 'scripts/lib/standard-foundry-policies.ts')),
    false,
    'standard Foundry policy projection helper should be physically retired',
  );
  assert.equal(retiredProjection, undefined, 'retired standard Foundry projection script should not be classified');
  assert.ok(activeConsumer, 'stage-decomposition shared helper should consume standard Foundry policies');
  assert.deepEqual(asStrings(activeConsumer.contract_refs), [
    STANDARD_FOUNDRY_POLICIES_CONTRACT_REF,
  ]);
  [
    'standard_foundry_policy_ref',
    'forbidden_generic_owner_roles_ref',
    'stage_pack_defaults_ref',
    'shared_policy_release_ref',
    'stage_progress_delta_policy_ref',
    'typed_blocker_lineage_policy_ref',
    'foundry_agent_series_design_profile_ref',
  ].forEach((writeRef) => {
    assert.ok(asStrings(activeConsumer.writes_only).includes(writeRef), `shared helper writes_only ${writeRef}`);
  });
  assert.equal(
    asStrings(receipt.scanned_script_refs).includes('scripts/lib/standard-foundry-policies.ts'),
    false,
    'retired standard Foundry projection helper should not appear in scanned script refs',
  );
  assert.ok(retirementGate, 'stage-decomposition materializer gate should exist');
  assert.ok(
    asStrings(retirementGate.closed_retention_refs).includes(STANDARD_FOUNDRY_POLICIES_CONTRACT_REF),
    'stable Foundry policy should be moved into a contract while script projection remains retained',
  );

  assert.ok(userStageLogRequiredFields.includes('stage_name'));
  assert.ok(userStageLogRequiredFields.includes('evidence_refs'));
  assert.ok(forbiddenGenericOwnerRoles.includes('generic_scheduler_owner'));
  assert.ok(forbiddenGenericOwnerRoles.includes('generic_cli_mcp_product_wrapper_owner'));
  assert.ok(forbiddenGenericOwnerRoles.includes('generated_surface_owner_in_domain_repo'));
  assert.equal(stagePackDefaults.stage_pack_conformance_version, 'standard-stage-pack.v2');
  assert.equal(stagePackDefaults.default_stage_executor_binding_ref, 'default_codex_cli');
  assert.equal(
    sharedPolicyRelease.policy_release_contract_ref,
    'contracts/opl-framework/foundry-agent-series-policy-release.json',
  );
  assert.equal(sharedPolicyRelease.domain_contract_policy_release_pin_required, true);
  assert.equal(sharedPolicyRelease.domain_adapter_must_not_copy_policy_body_as_authority, true);
  assert.deepEqual(asStrings(userStageLogContract.required_domain_semantic_fields), userStageLogRequiredFields);
  assert.equal(stageProgressDeltaPolicy.surface_kind, 'opl_stage_progress_delta_policy');
  assert.equal(Object.hasOwn(stageProgressDeltaPolicy, 'deliverable_delta_aliases'), false);
  assert.equal(Object.hasOwn(stageProgressDeltaPolicy, 'platform_delta_aliases'), false);
  assert.equal(stageProgressDeltaPolicy.platform_only_is_not_deliverable_progress, true);
  assert.equal(
    stageProgressDeltaPolicy.missing_delta_policy,
    'emit_zero_deliverable_delta_and_next_forced_delta_without_inventing_target_agent_work',
  );
  assert.equal(typedBlockerLineagePolicy.surface_kind, 'family-stall-lineage.v1');
  assert.equal(typedBlockerLineagePolicy.version, 'family-stall-lineage.v1');
  assert.equal(seriesDesignProfile.profile_id, 'opl_foundry_agent_series_design_profile.v1');
  assert.ok(asStrings(seriesDesignProfile.stage_pack_sections).includes('prompts'));
  assert.ok(asStrings(seriesDesignProfile.stage_pack_sections).includes('quality_gates'));
  assert.ok(asStrings(seriesDesignProfile.stage_pack_sections).includes('artifact_morphology'));
  assert.equal(artifactMorphologyPolicy.surface_kind, 'target_domain_artifact_morphology_policy');
  assert.equal(artifactMorphologyPolicy.required_for_new_target_agent_baseline, true);
  assert.equal(artifactMorphologyPolicy.required_contract_ref, 'contracts/artifact_morphology_contract.json');
  assert.ok(asStrings(artifactMorphologyPolicy.must_cover).includes('native_source_format'));
  assert.ok(asStrings(artifactMorphologyPolicy.must_cover).includes('asset_file_path_custody'));
  assert.ok(
    asStrings(artifactMorphologyPolicy.fail_closed_conditions)
      .includes('owner/source declared extent is silently reduced'),
  );
  assert.equal(artifactMorphologyPolicy.authority_boundary.oma_can_write_target_artifact_body, false);
  assert.equal(artifactMorphologyPolicy.authority_boundary.target_domain_owner_must_accept_artifact_shape, true);
});

test('script-to-pack gate receipt materializes machine gate without retirement or readiness authority', () => {
  const gateReceipt = readJson('contracts/script_to_pack_gate_receipt.json');
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const morphologyPolicy = authorityFunctions.script_morphology_policy as JsonObject;
  const sourceReceipt = authorityFunctions.source_purity_scan_receipt as JsonObject;
  const activeCallerScan = sourceReceipt.active_script_caller_scan as JsonObject;
  const gateSummary = gateReceipt.current_scan_summary as JsonObject;
  const boundary = asBooleanRecord(gateReceipt.authority_boundary);
  const reciprocalConsumptionPolicy = gateReceipt.reciprocal_consumption_policy as JsonObject;
  const readbackGuard = assertPolicyObject(morphologyPolicy, 'retirement_readback_cleanup_guard');
  const readbackGuardBoundary = asBooleanRecord(readbackGuard.authority_boundary);
  const readbackGuardClaims = asBooleanRecord(readbackGuard.claims);
  const scriptRefs = listScriptRefs();
  const gatedScriptRefs = [...new Set(
    asObjects(morphologyPolicy.script_to_pack_retirement_gates)
      .flatMap((gate) => asStrings(gate.tracked_script_refs)),
  )].sort();

  assert.equal(gateReceipt.surface_kind, 'oma_script_to_pack_gate_receipt');
  assert.equal(gateReceipt.receipt_ref, 'script-to-pack-gate-receipt:opl-meta-agent/current-script-morphology-policy');
  assert.equal(gateReceipt.receipt_status, 'current_script_morphology_machine_gate_passed');
  assert.equal(
    gateReceipt.closes_typed_blocker_ref,
    'oma-typed-blocker:target-owner-evidence-tail:script_to_pack_hygiene/missing-machine-gate-for-new-or-retired-script-policy',
  );
  assert.equal(gateReceipt.closes_tail_id, 'script_to_pack_hygiene');
  assert.equal(
    gateReceipt.closure_status,
    'machine_gate_landed_not_success_readiness_or_retirement',
  );
  assert.equal(
    sourceReceipt.script_to_pack_gate_receipt_ref,
    'contracts/script_to_pack_gate_receipt.json',
  );
  assert.equal(
    sourceReceipt.script_to_pack_gate_receipt_shape,
    gateReceipt.receipt_ref,
  );
  assert.equal(sourceReceipt.script_to_pack_gate_receipt_status, 'current_machine_gate_passed_not_retirement_or_parity_claim');
  assert.deepEqual(gateReceipt.machine_gate_inputs.script_scan_scope, morphologyPolicy.script_scan_scope);
  assert.deepEqual(
    gateReceipt.machine_gate_inputs.active_caller_scan_policy,
    morphologyPolicy.active_caller_scan_policy,
  );
  assert.deepEqual(
    gateReceipt.machine_gate_inputs.false_ready_claim_guard,
    morphologyPolicy.false_ready_claim_guard,
  );
  assert.deepEqual(
    gateReceipt.machine_gate_inputs.retirement_readback_cleanup_guard,
    readbackGuard,
  );
  assert.deepEqual(gateReceipt.machine_gate_inputs.allowed_classes, morphologyPolicy.allowed_classes);
  assert.deepEqual(gateReceipt.machine_gate_inputs.forbidden_roles, morphologyPolicy.forbidden_roles);
  assert.equal(readbackGuard.guard_id, 'oma.script_morphology.retirement_readback_cleanup_guard.v1');
  assert.equal(readbackGuard.state, 'readback_guard_available_physical_delete_not_authorized');
  assert.equal(
    readbackGuard.readback_surface_ref,
    'contracts/script_to_pack_gate_receipt.json#current_scan_summary',
  );
  assert.deepEqual(asStrings(readbackGuard.allowed_readback_outputs), [
    'script_classification_readback',
    'missing_evidence_worklist',
    'owner_delta_route',
    'typed_blocker_ref_shape',
    'no_resurrection_policy',
  ]);
  assert.deepEqual(asStrings(readbackGuard.forbidden_readback_outputs), [
    'physical_script_delete_operation',
    'owner_receipt_signature',
    'typed_blocker_instance_creation',
    'opl_primitive_parity_claim',
    'target_agent_ready_claim',
    'domain_ready_claim',
    'production_ready_claim',
    'app_registry_or_generated_hosted_readiness_claim',
    'default_promotion_or_default_caller_cutover_claim',
  ]);
  assert.deepEqual(asStrings(readbackGuard.required_before_cleanup_apply), [
    'opl_primitive_parity_receipt_ref',
    'no_active_caller_ref',
    'no_forbidden_write_proof_ref_where_applicable',
    'tombstone_or_provenance_ref',
    'target_owner_or_OPL_owner_decision_ref_when_parity_is_claimed',
    'owner_receipt://opl-meta-agent/script_physical_delete_or_tombstone_authorization',
  ]);
  assert.deepEqual(asStrings(readbackGuard.false_ready_claim_guard_keys), [
    'retirement_readback_cleanup_complete',
    'retirement_readback_guard_satisfied',
    'cleanup_readback_physical_delete_authorized',
    'claims_cleanup_readback_authorizes_delete',
    'claims_retirement_cleanup_applied',
  ]);
  asStrings(readbackGuard.false_ready_claim_guard_keys).forEach((claimKey) => {
    assert.ok(
      asStrings(morphologyPolicy.false_ready_claim_guard.forbidden_true_claim_keys).includes(claimKey),
      `cleanup readback guard key ${claimKey} should be scanned by the false-ready guard`,
    );
  });
  Object.entries(readbackGuardClaims).forEach(([claim, value]) => {
    assert.equal(value, false, `cleanup readback guard claim ${claim} must be false`);
  });
  assert.equal(readbackGuardBoundary.guard_can_identify_cleanup_candidates, true);
  assert.equal(readbackGuardBoundary.guard_can_route_owner_delta, true);
  [
    'guard_can_authorize_physical_delete',
    'guard_can_sign_owner_receipt',
    'guard_can_create_typed_blocker',
    'guard_can_claim_opl_primitive_parity',
    'guard_can_claim_target_agent_ready',
    'guard_can_claim_domain_ready',
    'guard_can_claim_production_ready',
    'guard_can_claim_app_or_registry_readiness',
    'guard_can_claim_generated_hosted_readiness',
    'guard_can_claim_default_promotion_or_cutover',
  ].forEach((flag) => {
    assert.equal(readbackGuardBoundary[flag], false, `${flag} must be false`);
  });
  assert.equal(gateSummary.source_purity_scan_status, sourceReceipt.status);
  assert.equal(gateSummary.active_script_caller_scan_status, activeCallerScan.status);
  assert.equal(gateSummary.active_caller_scan_policy_id, ACTIVE_CALLER_SCAN_POLICY_ID);
  assert.equal(gateSummary.scanned_script_count, scriptRefs.length);
  assert.equal(gateSummary.gated_script_count, gatedScriptRefs.length);
  assert.equal(gateSummary.orphan_script_count, 0);
  assert.equal(gateSummary.script_gate_count, asObjects(morphologyPolicy.script_to_pack_retirement_gates).length);
  assert.deepEqual(asStrings(gateSummary.scanned_script_refs).sort(), scriptRefs);
  assert.deepEqual(asStrings(gateSummary.gated_script_refs).sort(), gatedScriptRefs);
  assert.deepEqual(asStrings(gateReceipt.closed_current_machine_gate_refs), [
    'runtime/authority_functions/meta-agent-authority-functions.json#source_purity_scan_receipt.active_script_caller_scan',
    'runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy.active_caller_scan_policy',
    'runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy.false_ready_claim_guard',
    'runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy.retirement_readback_cleanup_guard',
    'runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy.script_to_pack_retirement_gates',
    'contracts/private_functional_surface_policy.json#allowed_opl_surface_consumption_refs',
    'tests/source-purity.test.ts#script-morphology-gate',
    'tests/source-purity-boundary.test.ts#source-shape-boundary',
  ]);
  [
    'OPL primitive parity for script policy',
    'physical script retirement',
    'cleanup readback physical delete authorization',
    'cleanup readback owner receipt signing',
    'cleanup readback typed blocker instance creation',
    'no-active-caller for retained scripts',
    'tombstone or provenance for future script retirement',
    'retirement readback cleanup completion',
    'target-agent readiness',
    'domain readiness',
    'production readiness',
    'App live rendering',
    'registry discovery live completion',
    'generated-hosted surface live readiness',
    'default promotion',
  ].forEach((claim) => {
    assert.ok(asStrings(gateReceipt.not_claimed_by_this_receipt).includes(claim));
  });
  assert.deepEqual(asStrings(gateReceipt.future_retirement_or_absorb_still_requires), [
    'opl_primitive_parity_receipt_ref',
    'no_active_caller_ref',
    'no_forbidden_write_proof_ref_where_applicable',
    'tombstone_or_provenance_ref',
    'target_owner_or_OPL_owner_decision_ref_when_parity_is_claimed',
  ]);
  assert.equal(
    reciprocalConsumptionPolicy.policy_id,
    'oma.script-to-pack-gate-receipt-consumption.v1',
  );
  assert.equal(reciprocalConsumptionPolicy.accepted_ref_shape, gateReceipt.accepted_ref_shape);
  assert.equal(reciprocalConsumptionPolicy.receipt_ref_field, 'script_to_pack_gate_receipt_refs');
  assert.equal(reciprocalConsumptionPolicy.contract_ref_field, 'script_to_pack_gate_receipt_ref');
  const requiredConsumers = asObjects(reciprocalConsumptionPolicy.required_consumers);
  assert.deepEqual(
    requiredConsumers.map((consumer) => consumer.contract_ref),
    asStrings(gateReceipt.consumed_by_refs),
    'script-to-pack receipt consumed_by_refs should be the reciprocal policy source',
  );
  requiredConsumers.forEach((consumer) => {
    const consumerContract = readJson(consumer.contract_ref as string);
    assertRepoRefExists(consumer.contract_ref as string);
    asStrings(consumer.must_reference_receipt_ref_at ?? []).forEach((refPath) => {
      const values = valuesAtDottedPath(consumerContract, refPath);
      assert.ok(
        values.includes(gateReceipt.receipt_ref as string),
        `${consumer.contract_ref} ${refPath} should include ${gateReceipt.receipt_ref}`,
      );
    });
    asStrings(consumer.must_reference_contract_ref_at ?? []).forEach((refPath) => {
      const values = valuesAtDottedPath(consumerContract, refPath);
      assert.ok(
        values.includes('contracts/script_to_pack_gate_receipt.json'),
        `${consumer.contract_ref} ${refPath} should include contracts/script_to_pack_gate_receipt.json`,
      );
    });
    asStrings(consumer.must_accept_ref_shape_at ?? []).forEach((refPath) => {
      const values = valuesAtDottedPath(consumerContract, refPath);
      assert.ok(
        values.includes(gateReceipt.accepted_ref_shape as string),
        `${consumer.contract_ref} ${refPath} should include ${gateReceipt.accepted_ref_shape}`,
      );
    });
    asStrings(consumer.must_keep_authority_false ?? []).forEach((refPath) => {
      const values = valuesAtDottedPath(consumerContract, refPath);
      assert.ok(values.length > 0, `${consumer.contract_ref} ${refPath} should resolve`);
      values.forEach((value) => {
        assert.equal(value, false, `${consumer.contract_ref} ${refPath} must be false`);
      });
    });
    asStrings(consumer.must_forbid_roles_at ?? []).forEach((refPath) => {
      const values = valuesAtDottedPath(consumerContract, refPath);
      [
        'OPL_primitive_parity_authority',
        'script_retirement_authority',
        'target_truth_writer',
        'owner_receipt_body_writer',
      ].forEach((forbiddenRole) => {
        assert.ok(
          values.includes(forbiddenRole),
          `${consumer.contract_ref} ${refPath} should forbid ${forbiddenRole}`,
        );
      });
    });
  });
  assert.deepEqual(asStrings(reciprocalConsumptionPolicy.fail_closed_conditions), [
    'consumed_by_ref_missing',
    'consumer_missing_receipt_ref',
    'consumer_missing_contract_ref',
    'consumer_missing_accepted_ref_shape',
    'consumer_missing_false_authority_guard',
    'consumer_claims_retirement_or_readiness_authority',
  ]);
  assert.equal(boundary.refs_only, true);
  assert.equal(boundary.can_create_runtime_truth, false);
  assert.equal(boundary.can_write_target_domain_truth, false);
  assert.equal(boundary.can_write_target_owner_receipt_body, false);
  assert.equal(boundary.can_claim_target_domain_ready, false);
  assert.equal(boundary.can_claim_domain_ready, false);
  assert.equal(boundary.can_claim_production_ready, false);
  assert.equal(boundary.can_claim_OPL_primitive_parity, false);
  assert.equal(boundary.can_authorize_script_retirement, false);
  assert.equal(boundary.can_own_agent_lab_runner, false);
  assert.equal(boundary.can_own_generated_interface, false);
  assert.equal(boundary.can_own_pack_compiler, false);
  assert.equal(boundary.can_own_work_order_lifecycle, false);
});
