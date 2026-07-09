// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertRepoRefExists,
  asObjects,
  asStrings,
  readJson,
  type JsonObject,
} from '../support/contracts.ts';
import {
  ACTIVE_CALLER_SCAN_POLICY_ID,
  assertEveryFlagFalse,
  assertFalseFlags,
  assertPolicyObject,
  asBooleanRecord,
  valuesAtDottedPath,
  listScriptRefs,
} from '../support/source-purity.ts';

function assertIncludesAll(actual: string[], expected: string[], label: string): void {
  expected.forEach((entry) => assert.ok(actual.includes(entry), `${label} should include ${entry}`));
}

test('script-to-pack gate receipt mirrors source-purity gates without owning retirement authority', () => {
  const gateReceipt = readJson('contracts/script_to_pack_gate_receipt.json');
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const morphologyPolicy = authorityFunctions.script_morphology_policy as JsonObject;
  const sourceReceipt = authorityFunctions.source_purity_scan_receipt as JsonObject;
  const activeCallerScan = sourceReceipt.active_script_caller_scan as JsonObject;
  const gateSummary = gateReceipt.current_scan_summary as JsonObject;
  const boundary = asBooleanRecord(gateReceipt.authority_boundary);
  const reciprocalConsumptionPolicy = gateReceipt.reciprocal_consumption_policy as JsonObject;
  const testStructure = gateReceipt.machine_gate_inputs.source_purity_test_structure as JsonObject;
  const sourceRefIntegrityGuard = assertPolicyObject(morphologyPolicy, 'source_ref_integrity_guard');
  const readbackGuard = assertPolicyObject(morphologyPolicy, 'retirement_readback_cleanup_guard');
  const genericMaterializerGuard = assertPolicyObject(
    morphologyPolicy,
    'generic_materializer_no_resurrection_guard',
  );
  const materializerScan = sourceReceipt.generic_script_materializer_scan as JsonObject;
  const scriptRefs = listScriptRefs();
  const gatedScriptRefs = [...new Set(
    asObjects(morphologyPolicy.script_to_pack_retirement_gates)
      .flatMap((gate) => asStrings(gate.tracked_script_refs)),
  )].sort();

  assert.equal(gateReceipt.surface_kind, 'oma_script_to_pack_gate_receipt');
  assert.equal(gateReceipt.receipt_status, 'current_script_morphology_machine_gate_passed');
  assert.equal(gateReceipt.closure_status, 'machine_gate_landed_not_success_readiness_or_retirement');
  assert.equal(sourceReceipt.script_to_pack_gate_receipt_ref, 'contracts/script_to_pack_gate_receipt.json');
  [
    ['script_scan_scope', morphologyPolicy.script_scan_scope],
    ['active_caller_scan_policy', morphologyPolicy.active_caller_scan_policy],
    ['source_ref_integrity_guard', sourceRefIntegrityGuard],
    ['false_ready_claim_guard', morphologyPolicy.false_ready_claim_guard],
    ['retirement_readback_cleanup_guard', readbackGuard],
    ['generic_materializer_no_resurrection_guard', genericMaterializerGuard],
  ].forEach(([field, expected]) => {
    assert.deepEqual(gateReceipt.machine_gate_inputs[field], expected, `machine_gate_inputs.${field}`);
  });

  assert.deepEqual(testStructure, sourceReceipt.source_purity_test_structure);
  assert.equal(testStructure.structure_id, 'oma.source_purity_test_structure.v1');
  assert.equal(testStructure.anchor_test_ref, 'tests/source-purity.test.ts#script-morphology-gate');
  assertIncludesAll(asStrings(testStructure.case_module_refs), [
    'tests/source-purity/script-morphology.test-case.ts',
    'tests/source-purity/policy-projection.test-case.ts',
    'tests/source-purity/gate-receipt.test-case.ts',
  ], 'source-purity case modules');
  assert.equal(testStructure.support_module_ref, 'tests/support/source-purity.ts');
  assertEveryFlagFalse(asBooleanRecord(testStructure.authority_boundary), 'source-purity test structure boundary');

  assert.equal(sourceRefIntegrityGuard.guard_id, 'oma.script_morphology.source_ref_integrity_guard.v1');
  assertFalseFlags(asBooleanRecord(sourceRefIntegrityGuard.authority_boundary), [
    'guard_can_create_missing_refs',
    'guard_can_create_alias_files',
    'guard_can_authorize_physical_delete',
    'guard_can_claim_generated_hosted_readiness',
    'guard_can_claim_target_agent_ready',
  ], 'source-ref integrity boundary');

  assert.equal(readbackGuard.executable_readback_command_ref, 'npm run script-to-pack:readback');
  assert.equal(readbackGuard.full_readback_command_ref, 'npm run script-to-pack:readback:full');
  assertIncludesAll(asStrings(readbackGuard.required_before_cleanup_apply), [
    'opl_primitive_parity_receipt_ref',
    'no_active_caller_ref',
    'tombstone_or_provenance_ref',
    'owner_receipt://opl-meta-agent/script_physical_delete_or_tombstone_authorization',
  ], 'cleanup apply requirements');
  assertEveryFlagFalse(asBooleanRecord(readbackGuard.claims), 'cleanup readback guard claim');
  assert.equal(asBooleanRecord(readbackGuard.authority_boundary).guard_can_identify_cleanup_candidates, true);
  assertFalseFlags(asBooleanRecord(readbackGuard.authority_boundary), [
    'guard_can_authorize_physical_delete',
    'guard_can_sign_owner_receipt',
    'guard_can_create_typed_blocker',
    'guard_can_claim_target_agent_ready',
    'guard_can_claim_production_ready',
  ], 'cleanup readback guard boundary');

  assert.equal(gateSummary.source_purity_scan_status, sourceReceipt.status);
  assert.equal(gateSummary.active_script_caller_scan_status, activeCallerScan.status);
  assert.equal(gateSummary.active_caller_scan_policy_id, ACTIVE_CALLER_SCAN_POLICY_ID);
  assert.equal(gateSummary.source_ref_integrity_guard_id, sourceRefIntegrityGuard.guard_id);
  assert.equal(gateSummary.generic_materializer_no_resurrection_guard_id, genericMaterializerGuard.guard_id);
  assert.equal(gateSummary.generic_materializer_scan_status, materializerScan.status);
  [
    'repo_owned_generic_wrapper_materializer_count',
    'repo_owned_generic_runtime_materializer_count',
    'repo_owned_queue_or_attempt_ledger_materializer_count',
    'repo_owned_target_worktree_lifecycle_materializer_count',
  ].forEach((field) => assert.equal(gateSummary[field], 0, field));
  assert.equal(gateSummary.cleanup_readback_state, 'readback_available_cleanup_not_authorized');
  assert.equal(gateSummary.cleanup_candidate_count, 0);
  assert.equal(gateSummary.cleanup_readback_is_authority, false);
  assert.equal(gateSummary.cleanup_readback_can_authorize_delete, false);
  assert.equal(gateSummary.cleanup_readback_can_claim_retirement_complete, false);
  assert.equal(gateSummary.scanned_script_count, scriptRefs.length);
  assert.equal(gateSummary.gated_script_count, gatedScriptRefs.length);
  assert.equal(gateSummary.orphan_script_count, 0);
  assert.deepEqual(asStrings(gateSummary.scanned_script_refs).sort(), scriptRefs);
  assert.deepEqual(asStrings(gateSummary.gated_script_refs).sort(), gatedScriptRefs);

  assertIncludesAll(asStrings(gateReceipt.closed_current_machine_gate_refs), [
    'runtime/authority_functions/meta-agent-authority-functions.json#source_purity_scan_receipt.active_script_caller_scan',
    'runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy.source_ref_integrity_guard',
    'runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy.retirement_readback_cleanup_guard',
    'tests/source-purity.test.ts#script-morphology-gate',
  ], 'closed current machine gate refs');
  assertIncludesAll(asStrings(gateReceipt.not_claimed_by_this_receipt), [
    'physical script retirement',
    'target-agent readiness',
    'domain readiness',
    'production readiness',
    'default promotion',
  ], 'not claimed by receipt');
  assertIncludesAll(asStrings(gateReceipt.future_retirement_or_absorb_still_requires), [
    'opl_primitive_parity_receipt_ref',
    'no_active_caller_ref',
    'tombstone_or_provenance_ref',
  ], 'future retirement requirements');

  assert.equal(reciprocalConsumptionPolicy.policy_id, 'oma.script-to-pack-gate-receipt-consumption.v1');
  assert.equal(reciprocalConsumptionPolicy.accepted_ref_shape, gateReceipt.accepted_ref_shape);
  asObjects(reciprocalConsumptionPolicy.required_consumers).forEach((consumer) => {
    const consumerContract = readJson(consumer.contract_ref as string);
    assertRepoRefExists(consumer.contract_ref as string);
    asStrings(consumer.must_reference_receipt_ref_at ?? []).forEach((refPath) => {
      assert.ok(valuesAtDottedPath(consumerContract, refPath).includes(gateReceipt.receipt_ref as string));
    });
    asStrings(consumer.must_keep_authority_false ?? []).forEach((refPath) => {
      valuesAtDottedPath(consumerContract, refPath).forEach((value) => assert.equal(value, false));
    });
  });
  assertIncludesAll(asStrings(reciprocalConsumptionPolicy.fail_closed_conditions), [
    'consumer_missing_receipt_ref',
    'consumer_missing_false_authority_guard',
    'consumer_claims_retirement_or_readiness_authority',
  ], 'reciprocal consumption fail-closed conditions');

  assert.equal(boundary.refs_only, true);
  assertFalseFlags(boundary, [
    'can_create_runtime_truth',
    'can_write_target_domain_truth',
    'can_write_target_owner_receipt_body',
    'can_claim_target_domain_ready',
    'can_claim_domain_ready',
    'can_claim_production_ready',
    'can_authorize_script_retirement',
    'can_own_generated_interface',
  ], 'script-to-pack gate receipt boundary');
});
