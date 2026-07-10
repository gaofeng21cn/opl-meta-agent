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
  assertExactFalseFlags,
  assertEveryFlagFalse,
  assertIncludesAll,
  assertPolicyObject,
  asBooleanRecord,
  valuesAtDottedPath,
} from '../support/source-purity.ts';

const CLEANUP_READBACK_FALSE_AUTHORITY_KEYS = [
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
];

test('script-to-pack receipt projects the canonical morphology gate without owning it', () => {
  const gateReceipt = readJson('contracts/script_to_pack_gate_receipt.json');
  const authorityFunctions = readJson('runtime/authority_functions/meta-agent-authority-functions.json');
  const morphologyPolicy = authorityFunctions.script_morphology_policy as JsonObject;
  const sourceReceipt = authorityFunctions.source_purity_scan_receipt as JsonObject;
  const activeCallerScan = sourceReceipt.active_script_caller_scan as JsonObject;
  const materializerScan = sourceReceipt.generic_script_materializer_scan as JsonObject;
  const gateSummary = gateReceipt.current_scan_summary as JsonObject;
  const readbackGuard = assertPolicyObject(morphologyPolicy, 'retirement_readback_cleanup_guard');
  const reciprocalPolicy = gateReceipt.reciprocal_consumption_policy as JsonObject;
  const testStructure = gateReceipt.machine_gate_inputs.source_purity_test_structure as JsonObject;

  assert.equal(gateReceipt.surface_kind, 'oma_script_to_pack_gate_receipt');
  assert.equal(gateReceipt.receipt_status, 'current_script_morphology_machine_gate_passed');
  assert.equal(gateReceipt.closure_status, 'machine_gate_landed_not_success_readiness_or_retirement');
  assert.equal(sourceReceipt.script_to_pack_gate_receipt_ref, 'contracts/script_to_pack_gate_receipt.json');

  [
    ['script_scan_scope', morphologyPolicy.script_scan_scope],
    ['active_caller_scan_policy', morphologyPolicy.active_caller_scan_policy],
    ['source_ref_integrity_guard', morphologyPolicy.source_ref_integrity_guard],
    ['false_ready_claim_guard', morphologyPolicy.false_ready_claim_guard],
    ['retirement_readback_cleanup_guard', readbackGuard],
    ['generic_materializer_no_resurrection_guard', morphologyPolicy.generic_materializer_no_resurrection_guard],
  ].forEach(([field, expected]) => {
    assert.deepEqual(gateReceipt.machine_gate_inputs[field], expected, `machine_gate_inputs.${field}`);
  });

  assert.deepEqual(testStructure, sourceReceipt.source_purity_test_structure);
  assert.equal(testStructure.anchor_test_ref, 'tests/source-purity.test.ts#script-morphology-gate');
  asStrings(testStructure.case_module_refs).forEach(assertRepoRefExists);
  assertRepoRefExists(testStructure.support_module_ref as string);
  assertEveryFlagFalse(asBooleanRecord(testStructure.authority_boundary), 'source-purity test structure');

  [
    ['source_purity_scan_status', sourceReceipt.status],
    ['active_script_caller_scan_status', activeCallerScan.status],
    ['active_caller_scan_policy_id', morphologyPolicy.active_caller_scan_policy.policy_id],
    ['source_ref_integrity_guard_id', morphologyPolicy.source_ref_integrity_guard.guard_id],
    ['generic_materializer_no_resurrection_guard_id', morphologyPolicy.generic_materializer_no_resurrection_guard.guard_id],
    ['generic_materializer_scan_status', materializerScan.status],
  ].forEach(([field, expected]) => assert.equal(gateSummary[field], expected, field as string));
  assert.equal(gateSummary.orphan_script_count, 0);
  assert.equal(gateSummary.cleanup_candidate_count, 0);
  assert.equal(gateSummary.cleanup_readback_is_authority, false);
  assert.equal(gateSummary.cleanup_readback_can_authorize_delete, false);
  assert.equal(gateSummary.cleanup_readback_can_claim_retirement_complete, false);

  assert.equal(readbackGuard.executable_readback_command_ref, 'npm run script-to-pack:readback');
  assert.equal(readbackGuard.full_readback_command_ref, 'npm run script-to-pack:readback:full');
  assertEveryFlagFalse(asBooleanRecord(readbackGuard.claims), 'cleanup readback claims');
  const {
    guard_can_identify_cleanup_candidates: canIdentifyCleanupCandidates,
    guard_can_route_owner_delta: canRouteOwnerDelta,
    ...cleanupReadbackDeniedAuthority
  } = asBooleanRecord(readbackGuard.authority_boundary);
  assert.equal(canIdentifyCleanupCandidates, true);
  assert.equal(canRouteOwnerDelta, true);
  assertExactFalseFlags(
    cleanupReadbackDeniedAuthority,
    CLEANUP_READBACK_FALSE_AUTHORITY_KEYS,
    'cleanup readback authority boundary',
  );

  assertIncludesAll(asStrings(gateReceipt.not_claimed_by_this_receipt), [
    'physical script retirement',
    'target-agent readiness',
    'domain readiness',
    'production readiness',
    'default promotion',
  ], 'receipt non-claims');
  assertIncludesAll(asStrings(gateReceipt.future_retirement_or_absorb_still_requires), [
    'opl_primitive_parity_receipt_ref',
    'no_active_caller_ref',
    'tombstone_or_provenance_ref',
  ], 'future retirement requirements');

  assert.equal(reciprocalPolicy.accepted_ref_shape, gateReceipt.accepted_ref_shape);
  asObjects(reciprocalPolicy.required_consumers).forEach((consumer) => {
    assertRepoRefExists(consumer.contract_ref as string);
    const consumerContract = readJson(consumer.contract_ref as string);
    asStrings(consumer.must_reference_receipt_ref_at ?? []).forEach((refPath) => {
      assert.ok(valuesAtDottedPath(consumerContract, refPath).includes(gateReceipt.receipt_ref));
    });
    asStrings(consumer.must_keep_authority_false ?? []).forEach((refPath) => {
      valuesAtDottedPath(consumerContract, refPath).forEach((value) => assert.equal(value, false));
    });
  });
  assertIncludesAll(asStrings(reciprocalPolicy.fail_closed_conditions), [
    'consumer_missing_receipt_ref',
    'consumer_missing_false_authority_guard',
    'consumer_claims_retirement_or_readiness_authority',
  ], 'reciprocal fail-closed conditions');

  const boundary = asBooleanRecord(gateReceipt.authority_boundary);
  assert.equal(boundary.refs_only, true);
  assert.equal(boundary.not_generic_runtime_owner, true);
  assertEveryFlagFalse(
    boundary,
    'script-to-pack receipt authority',
    (field) => !['refs_only', 'not_generic_runtime_owner'].includes(field),
  );
});
