// @ts-nocheck
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  assertRepoRefExists,
  asObjects,
  asStrings,
  repoRoot,
  readJson,
  type JsonObject,
} from '../support/contracts.ts';
import {
  ACTIVE_CALLER_SCAN_POLICY_ID,
  DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF,
  STANDARD_FOUNDRY_POLICIES_CONTRACT_REF,
  STAGE_NATIVE_ARTIFACT_VOCABULARY_CONTRACT_REF,
  assertEveryFlagFalse,
  assertFalseFlags,
  assertPolicyObject,
  asBooleanRecord,
  collectActiveScriptCallerScan,
  collectFalseReadyClaimMatches,
  collectFalseReadyClaimMatchesFromSource,
  sourceRefIntegrityViolations,
  assertRepoLocalScriptRef,
  listScriptRefs,
} from '../support/source-purity.ts';

const CORE_FALSE_READY_KEYS = [
  'generated_hosted_surface_live_ready',
  'default_promotion_complete',
  'cleanup_readback_physical_delete_authorized',
  'target_agent_ready',
  'domain_ready',
  'production_ready',
];

const CORE_RETIREMENT_GATE_IDS = [
  'agent_evidence_and_external_suite_materializers',
  'build_agent_baseline_and_stage_decomposition_materializers',
  'external_work_order_execution_delegation',
  'source_structure_and_stage_control_maintenance_helpers',
  'sync_json_bundle_shared_helper',
  'repo_shell_verification_wrappers',
  'retained_thin_authority_helpers_and_takeover_smoke',
];

function assertIncludesAll(actual: string[], expected: string[], label: string): void {
  expected.forEach((entry) => {
    assert.ok(actual.includes(entry), `${label} should include ${entry}`);
  });
}

function gateById(gates: JsonObject[], gateId: string): JsonObject {
  const gate = gates.find((entry) => entry.gate_id === gateId);
  assert.ok(gate, `${gateId} gate should exist`);
  return gate;
}

test('script morphology source-purity gate protects boundaries without implementation shape lock-in', () => {
  const privatePolicy = readJson('contracts/private_functional_surface_policy.json');
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const morphologyPolicy = authorityFunctions.script_morphology_policy as JsonObject;
  const receipt = authorityFunctions.source_purity_scan_receipt as JsonObject;
  const scripts = listScriptRefs();

  assert.ok(scripts.some((scriptRef) => scriptRef.endsWith('.ts')), 'source-purity scan should include TS scripts');
  assert.ok(scripts.some((scriptRef) => scriptRef.endsWith('.sh')), 'source-purity scan should include shell scripts');
  assert.deepEqual(asStrings(morphologyPolicy.allowed_classes), asObjects(privatePolicy.allowed_script_morphology_classes)
    .map((entry) => entry.class_id));
  assert.deepEqual(asStrings(morphologyPolicy.forbidden_roles), asStrings(privatePolicy.forbidden_script_roles));

  const falseReadyClaimGuard = assertPolicyObject(morphologyPolicy, 'false_ready_claim_guard');
  const falseReadyClaimKeys = asStrings(falseReadyClaimGuard.forbidden_true_claim_keys);
  assertIncludesAll(falseReadyClaimKeys, CORE_FALSE_READY_KEYS, 'false-ready guard');
  assertFalseFlags(asBooleanRecord(falseReadyClaimGuard.authority_boundary), [
    'oma_can_claim_app_live_rendering',
    'oma_can_claim_registry_live_discovery',
    'oma_can_claim_generated_hosted_live_ready',
    'oma_can_claim_default_promotion',
    'oma_can_claim_target_agent_ready',
  ], 'false-ready boundary');
  assert.deepEqual(collectFalseReadyClaimMatches(falseReadyClaimKeys), []);
  assert.deepEqual(
    collectFalseReadyClaimMatchesFromSource(
      'contracts/__source_purity_false_ready_probe.json',
      '{"generated_hosted_surface_live_ready": true}\n',
      falseReadyClaimKeys,
    ),
    [{ path: 'contracts/__source_purity_false_ready_probe.json', claimKey: 'generated_hosted_surface_live_ready' }],
  );

  const allowedOplSurfaceRefIds = new Set<string>();
  asObjects(privatePolicy.allowed_opl_surface_consumption_refs).forEach((surface) => {
    assert.equal(surface.surface_owner, 'one-person-lab', `${surface.surface_ref} should be OPL-owned`);
    assert.ok(asStrings(surface.allowed_script_classes).length > 0, `${surface.surface_ref} should allow classes`);
    asStrings(surface.allowed_script_classes).forEach((classId) => {
      assert.ok(asStrings(morphologyPolicy.allowed_classes).includes(classId));
    });
    assertFalseFlags(asBooleanRecord(surface.boundary), [
      'can_create_runtime_truth',
      'can_write_target_truth',
      'can_write_owner_receipt_body',
    ], `${surface.surface_ref} boundary`);
    assertEveryFlagFalse(asBooleanRecord(surface.boundary), `${surface.surface_ref} claim boundary`, (flag) =>
      flag.startsWith('can_claim_')
    );
    allowedOplSurfaceRefIds.add(surface.surface_ref as string);
  });

  const materializerScan = receipt.generic_script_materializer_scan as JsonObject;
  const genericMaterializerGuard = assertPolicyObject(morphologyPolicy, 'generic_materializer_no_resurrection_guard');
  assert.equal(materializerScan.status, 'passed');
  assert.equal(materializerScan.guard_id, genericMaterializerGuard.guard_id);
  [
    'repo_owned_generic_wrapper_materializer_count',
    'repo_owned_generic_runtime_materializer_count',
    'repo_owned_queue_or_attempt_ledger_materializer_count',
    'repo_owned_target_worktree_lifecycle_materializer_count',
  ].forEach((countField) => assert.equal(materializerScan[countField], 0, countField));
  assertIncludesAll(asStrings(genericMaterializerGuard.forbidden_materializer_roles), [
    'repo_owned_cli_wrapper_materializer',
    'repo_owned_generic_runtime_materializer',
    'repo_owned_target_worktree_lifecycle_materializer',
  ], 'generic materializer guard');
  assert.deepEqual(asStrings(materializerScan.allowed_outputs), asStrings(genericMaterializerGuard.allowed_outputs));
  assertEveryFlagFalse(asBooleanRecord(genericMaterializerGuard.authority_boundary), 'generic materializer guard');

  const retirementGates = asObjects(morphologyPolicy.script_to_pack_retirement_gates);
  assert.deepEqual(retirementGates.map((entry) => entry.gate_id), CORE_RETIREMENT_GATE_IDS);
  const gatedScriptRefs = [...new Set(retirementGates.flatMap((gate) => asStrings(gate.tracked_script_refs)))].sort();
  assert.deepEqual(gatedScriptRefs, scripts);
  retirementGates.forEach((gate) => {
    assert.ok(asStrings(gate.tracked_script_refs).length > 0, `${gate.gate_id} should track scripts`);
    assertIncludesAll(asStrings(gate.required_before_retire_or_absorb), [
      'no_active_npm_or_test_caller_ref',
      'tombstone_or_provenance_ref',
    ], `${gate.gate_id} retirement requirements`);
    assert.ok(asStrings(gate.forbidden_long_term_claims).length > 0);
  });

  const buildBaselineGate = gateById(retirementGates, 'build_agent_baseline_and_stage_decomposition_materializers');
  assert.equal(buildBaselineGate.retention_state, 'retained_current_authority_function');
  assertIncludesAll(asStrings(buildBaselineGate.closed_retention_refs), [
    STANDARD_FOUNDRY_POLICIES_CONTRACT_REF,
    STAGE_NATIVE_ARTIFACT_VOCABULARY_CONTRACT_REF,
    'retired-tail:opl-meta-agent/stage-decomposition-pack-draft/barrel-reexport-facade',
  ], 'stage materializer closed retention refs');
  assert.equal(fs.existsSync(path.join(repoRoot, 'scripts/lib/stage-decomposition-pack-draft.ts')), false);

  const externalSuiteGate = gateById(retirementGates, 'agent_evidence_and_external_suite_materializers');
  assertIncludesAll(asStrings(externalSuiteGate.closed_retention_refs), [
    DEVELOPER_WORK_ORDER_POLICY_CONTRACT_REF,
    'retired-tail:opl-meta-agent/target-improvement-policy/generic-external-agent-patch-ref-fallback',
  ], 'external suite closed retention refs');
  assert.ok(asStrings(externalSuiteGate.forbidden_long_term_claims).includes('generic_external_agent_patch_ref_fallback'));

  const retainedHelperGate = gateById(retirementGates, 'retained_thin_authority_helpers_and_takeover_smoke');
  assertIncludesAll(asStrings(retainedHelperGate.closed_retention_refs), [
    'retired-tail:opl-meta-agent/meta-agent-loop/reexport-facade',
  ], 'retained helper closed retention refs');
  assert.equal(fs.existsSync(path.join(repoRoot, 'scripts/lib/meta-agent-loop.ts')), false);

  const sourceRefIntegrityGuard = assertPolicyObject(morphologyPolicy, 'source_ref_integrity_guard');
  assert.deepEqual(asStrings(sourceRefIntegrityGuard.allowed_ref_roots), ['scripts/']);
  assert.deepEqual(asStrings(sourceRefIntegrityGuard.allowed_extensions), ['.ts', '.sh']);
  assertIncludesAll(asStrings(sourceRefIntegrityGuard.forbidden_ref_shapes), [
    'absolute_path',
    'parent_directory_traversal',
    'uri_or_url',
    'human_doc_ref_as_machine_source_ref',
    'non_scripts_root',
  ], 'source ref integrity guard');
  assert.deepEqual(sourceRefIntegrityViolations('../scripts/outside.ts'), [
    'parent_directory_traversal',
    'non_scripts_root',
  ]);
  assert.deepEqual(sourceRefIntegrityViolations('/tmp/oma-script.ts'), [
    'absolute_path',
    'non_scripts_root',
  ]);
  assert.deepEqual(sourceRefIntegrityViolations('human_doc:docs/status.md'), [
    'human_doc_ref_as_machine_source_ref',
    'non_scripts_root',
  ]);
  scripts.forEach(assertRepoLocalScriptRef);
  gatedScriptRefs.forEach(assertRepoLocalScriptRef);
  assertFalseFlags(asBooleanRecord(sourceRefIntegrityGuard.authority_boundary), [
    'guard_can_create_missing_refs',
    'guard_can_create_alias_files',
    'guard_can_authorize_physical_delete',
    'guard_can_claim_default_promotion_or_cutover',
    'guard_can_claim_generated_hosted_readiness',
    'guard_can_claim_target_agent_ready',
  ], 'source-ref integrity boundary');

  const activeCallerScan = assertPolicyObject(receipt, 'active_script_caller_scan');
  const activeCallerScanPolicy = assertPolicyObject(morphologyPolicy, 'active_caller_scan_policy');
  assert.equal(activeCallerScanPolicy.policy_id, ACTIVE_CALLER_SCAN_POLICY_ID);
  assert.deepEqual(activeCallerScan, collectActiveScriptCallerScan(scripts));
  assert.equal(activeCallerScan.status, 'passed');
  assert.equal(activeCallerScan.orphan_script_count, 0);
  assert.deepEqual(asStrings(activeCallerScanPolicy.self_guard_test_refs), [
    'tests/source-purity.test.ts',
    'tests/source-purity/',
  ]);
  assert.equal(activeCallerScanPolicy.self_guard_may_prove_active_caller, false);
  asObjects(activeCallerScan.caller_refs_by_script).forEach((entry) => {
    assert.ok(scripts.includes(entry.script_ref), `${entry.script_ref} should be scanned`);
    assert.ok(asStrings(entry.active_caller_refs).length > 0, `${entry.script_ref} should have an active caller`);
    asStrings(entry.active_caller_refs).forEach((callerRef) => {
      assert.equal(callerRef.startsWith('tests/source-purity.test.ts#test_ref'), false);
      if (!callerRef.startsWith('package.json#scripts.')) {
        assertRepoRefExists(callerRef.split('#')[0]);
      }
    });
  });

  const implementationRefs = new Map<string, string[]>();
  asObjects(authorityFunctions.functions).forEach((functionRef) => {
    asStrings(functionRef.implementation_refs).forEach((scriptRef) => {
      implementationRefs.set(scriptRef, [...(implementationRefs.get(scriptRef) ?? []), functionRef.authority_ref]);
    });
  });
  const classifications = asObjects(morphologyPolicy.script_classifications);
  assert.deepEqual(classifications.map((entry) => entry.script_ref).sort(), scripts);
  assert.deepEqual(asStrings(receipt.scanned_script_refs).sort(), scripts);
  classifications.forEach((entry) => {
    assertRepoRefExists(entry.script_ref);
    assert.ok(asStrings(entry.classes).length > 0, `${entry.script_ref} should have at least one class`);
    assert.deepEqual(asStrings(entry.forbidden_roles), [], `${entry.script_ref} must not declare forbidden roles`);
    assert.ok(asStrings(entry.writes_only).length > 0, `${entry.script_ref} should declare refs-only writes`);
    asStrings(entry.classes).forEach((classId) => {
      assert.ok(asStrings(morphologyPolicy.allowed_classes).includes(classId));
    });
    asStrings(entry.contract_refs ?? []).forEach(assertRepoRefExists);
    asStrings(entry.consumes_opl_surfaces ?? []).forEach((surfaceRef) => {
      assert.ok(allowedOplSurfaceRefIds.has(surfaceRef), `${entry.script_ref} consumes unsupported ${surfaceRef}`);
    });
    const declaredAuthorityRefs = asStrings(entry.authority_function_refs ?? []);
    const expectedAuthorityRefs = implementationRefs.get(entry.script_ref) ?? [];
    if (asStrings(entry.classes).includes('authority_function_implementation_ref')) {
      assert.deepEqual(declaredAuthorityRefs.sort(), expectedAuthorityRefs.sort());
      assert.ok(expectedAuthorityRefs.length > 0, `${entry.script_ref} should be a runtime authority implementation`);
    } else {
      assert.deepEqual(declaredAuthorityRefs, []);
      assert.equal(implementationRefs.has(entry.script_ref), false);
    }
  });

  const domainPack = classifications.find((entry) => entry.script_ref === 'scripts/lib/domain-pack.ts');
  assert.ok(domainPack);
  assert.deepEqual(asStrings(domainPack.classes), ['fixture_or_proof_helper']);
  assert.deepEqual(asStrings(domainPack.consumes_opl_surfaces ?? []), []);
  assertIncludesAll(asStrings(morphologyPolicy.forbidden_roles), [
    'pack_compiler_owner',
    'generated_interface_owner',
    'scaffold_generator_owner',
    'target_pack_authority',
  ], 'domain-pack inherited forbidden roles');

  assertIncludesAll(asStrings(receipt.retained_non_polluting_domain_authority_surfaces), [
    'agent/',
    'contracts/',
    'runtime/authority_functions/',
  ], 'retained non-polluting surfaces');
  assert.ok(
    asStrings(receipt.forbidden_long_term_composition_claims)
      .includes('repo_owned_generic_cli_mcp_skill_product_status_workbench_wrapper'),
  );
});
