// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  asObjects,
  asStrings,
  readJson,
  readText,
  type JsonObject,
} from '../support/contracts.ts';
import {
  ACTIVE_CALLER_SCAN_POLICY_ID,
  assertEveryFlagFalse,
  assertFalseFlags,
  assertIncludesAll,
  assertPolicyObject,
  asBooleanRecord,
  collectActiveScriptCallerScan,
  collectFalseReadyClaimMatches,
  sourceRefIntegrityViolations,
  assertRepoLocalScriptRef,
  listGatedScriptRefs,
  listScriptRefs,
} from '../support/source-purity.ts';

const CORE_FALSE_READY_KEYS = [
  'generated_hosted_surface_live_ready',
  'default_promotion_complete',
  'target_agent_ready',
  'domain_ready',
  'production_ready',
];

test('script morphology source-purity gate protects current boundaries without implementation shape lock-in', () => {
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

  const takeoverGuard = assertPolicyObject(
    privatePolicy,
    'takeover_semantic_request_no_materialization_guard',
  );
  const takeoverSource = readText(String(takeoverGuard.script_ref));
  assert.equal(takeoverGuard.retained_role, 'work_order_semantic_request_authoring');
  asStrings(takeoverGuard.forbidden_source_tokens).forEach((token) => {
    assert.equal(takeoverSource.includes(token), false, `takeover source must not contain ${token}`);
  });
  assertEveryFlagFalse(
    asBooleanRecord(takeoverGuard.authority_boundary),
    'takeover semantic request materialization boundary',
  );

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

  const materializerScan = receipt.generic_script_materializer_scan as JsonObject;
  const genericMaterializerGuard = assertPolicyObject(morphologyPolicy, 'generic_materializer_no_resurrection_guard');
  assert.equal(materializerScan.status, 'passed');
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
  assertEveryFlagFalse(asBooleanRecord(genericMaterializerGuard.authority_boundary), 'generic materializer guard');

  const retirementGates = asObjects(morphologyPolicy.script_to_pack_retirement_gates);
  assert.ok(retirementGates.length > 0, 'script morphology should declare retirement gates');
  const gatedScriptRefs = listGatedScriptRefs(morphologyPolicy);
  assert.deepEqual(gatedScriptRefs, scripts);
  retirementGates.forEach((gate) => {
    assert.ok(asStrings(gate.tracked_script_refs).length > 0, `${gate.gate_id} should track scripts`);
    assertIncludesAll(asStrings(gate.required_before_retire_or_absorb), [
      'no_active_npm_or_test_caller_ref',
      'tombstone_or_provenance_ref',
    ], `${gate.gate_id} retirement requirements`);
  });

  const sourceRefIntegrityGuard = assertPolicyObject(morphologyPolicy, 'source_ref_integrity_guard');
  assert.deepEqual(asStrings(sourceRefIntegrityGuard.allowed_ref_roots), ['scripts/']);
  assert.deepEqual(asStrings(sourceRefIntegrityGuard.allowed_extensions), ['.ts', '.sh']);
  [
    ['../scripts/outside.ts', ['parent_directory_traversal', 'non_scripts_root']],
    ['/tmp/oma-script.ts', ['absolute_path', 'non_scripts_root']],
    ['human_doc:docs/status.md', ['human_doc_ref_as_machine_source_ref', 'non_scripts_root']],
  ].forEach(([scriptRef, expected]) => {
    assert.deepEqual(sourceRefIntegrityViolations(scriptRef as string), expected);
  });
  scripts.forEach(assertRepoLocalScriptRef);
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
  const computedActiveCallerScan = collectActiveScriptCallerScan(scripts);
  assert.equal(activeCallerScanPolicy.policy_id, ACTIVE_CALLER_SCAN_POLICY_ID);
  assert.equal(activeCallerScan.status, 'passed');
  assert.equal(activeCallerScan.orphan_script_count, 0);
  assert.equal(computedActiveCallerScan.status, 'passed');
  assert.equal(computedActiveCallerScan.orphan_script_count, 0);
  assert.equal(activeCallerScanPolicy.self_guard_may_prove_active_caller, false);

  const classifications = asObjects(morphologyPolicy.script_classifications);
  assert.deepEqual(classifications.map((entry) => entry.script_ref).sort(), scripts);
  assert.deepEqual(asStrings(receipt.scanned_script_refs).sort(), scripts);
  classifications.forEach((entry) => {
    assert.ok(asStrings(entry.classes).length > 0, `${entry.script_ref} should have at least one class`);
    assert.deepEqual(asStrings(entry.forbidden_roles), [], `${entry.script_ref} must not declare forbidden roles`);
    assert.ok(asStrings(entry.writes_only).length > 0, `${entry.script_ref} should declare refs-only writes`);
    asStrings(entry.classes).forEach((classId) => {
      assert.ok(asStrings(morphologyPolicy.allowed_classes).includes(classId));
    });
  });
  const takeoverClassification = classifications.find(
    (entry) => entry.script_ref === takeoverGuard.script_ref,
  );
  assert.ok(takeoverClassification);
  assert.ok(
    asStrings(takeoverClassification.classes).includes('work_order_semantic_request_authoring'),
  );

  assertIncludesAll(asStrings(receipt.retained_non_polluting_domain_authority_surfaces), [
    'agent/',
    'contracts/',
    'runtime/authority_functions/',
  ], 'retained non-polluting surfaces');
  assert.ok(asStrings(receipt.forbidden_long_term_composition_claims)
    .includes('repo_owned_generic_cli_mcp_skill_product_status_workbench_wrapper'));
});
