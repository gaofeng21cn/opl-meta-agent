// @ts-nocheck
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
} from '../support/contracts.ts';
import {
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
} from '../support/source-purity.ts';

test('script-to-pack gate receipt materializes machine gate without retirement or readiness authority', () => {
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
  const sourceRefBoundary = asBooleanRecord(sourceRefIntegrityGuard.authority_boundary);
  const readbackGuard = assertPolicyObject(morphologyPolicy, 'retirement_readback_cleanup_guard');
  const readbackGuardBoundary = asBooleanRecord(readbackGuard.authority_boundary);
  const readbackGuardClaims = asBooleanRecord(readbackGuard.claims);
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
    gateReceipt.machine_gate_inputs.source_ref_integrity_guard,
    sourceRefIntegrityGuard,
  );
  assert.deepEqual(
    gateReceipt.machine_gate_inputs.false_ready_claim_guard,
    morphologyPolicy.false_ready_claim_guard,
  );
  assert.deepEqual(
    gateReceipt.machine_gate_inputs.retirement_readback_cleanup_guard,
    readbackGuard,
  );
  assert.deepEqual(
    gateReceipt.machine_gate_inputs.generic_materializer_no_resurrection_guard,
    genericMaterializerGuard,
  );
  assert.deepEqual(testStructure, sourceReceipt.source_purity_test_structure);
  assert.equal(testStructure.structure_id, 'oma.source_purity_test_structure.v1');
  assert.equal(testStructure.anchor_test_ref, 'tests/source-purity.test.ts#script-morphology-gate');
  assert.deepEqual(asStrings(testStructure.case_module_refs), [
    'tests/source-purity/script-morphology.test-case.ts',
    'tests/source-purity/policy-projection.test-case.ts',
    'tests/source-purity/gate-receipt.test-case.ts',
  ]);
  assert.equal(testStructure.support_module_ref, 'tests/support/source-purity.ts');
  assert.deepEqual(asStrings(testStructure.self_guard_test_refs), [
    'tests/source-purity.test.ts',
    'tests/source-purity/',
  ]);
  assert.equal(testStructure.no_second_truth_policy.anchor_test_remains_receipt_ref, true);
  assert.equal(testStructure.no_second_truth_policy.case_modules_cannot_prove_active_script_callers, true);
  assert.equal(testStructure.no_second_truth_policy.case_modules_cannot_claim_retirement_or_readiness, true);
  const testStructureBoundary = asBooleanRecord(testStructure.authority_boundary);
  Object.entries(testStructureBoundary).forEach(([claim, value]) => {
    assert.equal(value, false, `source-purity test structure boundary ${claim} must be false`);
  });
  assert.deepEqual(gateReceipt.machine_gate_inputs.allowed_classes, morphologyPolicy.allowed_classes);
  assert.deepEqual(gateReceipt.machine_gate_inputs.forbidden_roles, morphologyPolicy.forbidden_roles);
  assert.equal(sourceRefIntegrityGuard.guard_id, 'oma.script_morphology.source_ref_integrity_guard.v1');
  assert.equal(sourceRefIntegrityGuard.state, 'repo_local_script_refs_declared_no_second_truth');
  assert.equal(
    sourceRefIntegrityGuard.readback_surface_ref,
    'contracts/script_to_pack_gate_receipt.json#current_scan_summary',
  );
  assert.deepEqual(asStrings(sourceRefIntegrityGuard.guarded_ref_collections), [
    'script_morphology_policy.script_classifications[*].script_ref',
    'script_morphology_policy.script_to_pack_retirement_gates[*].tracked_script_refs',
    'source_purity_scan_receipt.scanned_script_refs',
    'source_purity_scan_receipt.active_script_caller_scan.caller_refs_by_script[*].script_ref',
    'contracts/script_to_pack_gate_receipt.json#current_scan_summary.scanned_script_refs',
    'contracts/script_to_pack_gate_receipt.json#current_scan_summary.gated_script_refs',
  ]);
  assert.equal(sourceRefIntegrityGuard.required_ref_shape, 'repo_local_relative_path_under_scripts');
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
    assert.equal(sourceRefBoundary[flag], false, `${flag} must be false`);
  });
  assert.equal(readbackGuard.guard_id, 'oma.script_morphology.retirement_readback_cleanup_guard.v1');
  assert.equal(readbackGuard.state, 'readback_guard_available_physical_delete_not_authorized');
  assert.equal(
    readbackGuard.readback_surface_ref,
    'contracts/script_to_pack_gate_receipt.json#current_scan_summary',
  );
  assert.equal(readbackGuard.executable_readback_command_ref, 'npm run script-to-pack:readback');
  assert.equal(readbackGuard.full_readback_command_ref, 'npm run script-to-pack:readback:full');
  assert.equal(readbackGuard.executable_readback_surface_kind, 'oma_script_to_pack_retirement_cleanup_compact_readback');
  assert.equal(readbackGuard.full_readback_surface_kind, 'oma_script_to_pack_retirement_cleanup_readback');
  assert.equal(
    readbackGuard.compact_cleanup_summary_id,
    'oma.script_to_pack_retirement_cleanup.compact_summary.v1',
  );
  assert.equal(
    readbackGuard.direct_readback_compact_summary_output_ref,
    'script-to-pack-readback.compact_cleanup_summary',
  );
  assert.equal(
    readbackGuard.direct_readback_full_detail_output_ref,
    'script-to-pack-readback-full.cleanup_candidates',
  );
  assert.equal(readbackGuard.compact_summary_role, 'direct_readback_short_form_not_second_script_inventory');
  assert.equal(
    readbackGuard.readback_materialization_policy.source_of_truth,
    'contracts/script_to_pack_gate_receipt.json + runtime/authority_functions/meta-agent-authority-functions.json',
  );
  assert.equal(readbackGuard.readback_materialization_policy.script_rows_are_derived_from_existing_retirement_gates, true);
  assert.equal(readbackGuard.readback_materialization_policy.compact_summary_is_derived_from_same_script_rows, true);
  assert.equal(readbackGuard.readback_materialization_policy.compact_summary_must_not_replace_full_candidate_rows, true);
  assert.equal(readbackGuard.readback_materialization_policy.retained_current_rows_are_separate_from_cleanup_candidates, true);
  assert.equal(readbackGuard.readback_materialization_policy.can_materialize_missing_evidence_worklist, true);
  assert.equal(readbackGuard.readback_materialization_policy.can_materialize_retained_current_worklist, true);
  assert.equal(readbackGuard.readback_materialization_policy.can_materialize_owner_delta_route, true);
  assert.equal(readbackGuard.readback_materialization_policy.can_materialize_typed_blocker_ref_shape, true);
  assert.equal(readbackGuard.readback_materialization_policy.must_not_create_second_script_inventory, true);
  assert.equal(readbackGuard.readback_materialization_policy.must_not_create_owner_receipt_or_typed_blocker_instance, true);
  assert.deepEqual(asStrings(readbackGuard.allowed_readback_outputs), [
    'script_classification_readback',
    'missing_evidence_worklist',
    'retained_current_worklist',
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
  assert.equal(gateSummary.source_ref_integrity_guard_id, sourceRefIntegrityGuard.guard_id);
  assert.equal(gateSummary.source_ref_integrity_status, 'passed');
  assert.equal(gateSummary.source_ref_integrity_checked_ref_count, scriptRefs.length);
  assert.equal(gateSummary.source_ref_integrity_invalid_ref_count, 0);
  assert.equal(gateSummary.generic_materializer_no_resurrection_guard_id, genericMaterializerGuard.guard_id);
  assert.equal(gateSummary.generic_materializer_scan_status, materializerScan.status);
  assert.equal(gateSummary.repo_owned_generic_wrapper_materializer_count, 0);
  assert.equal(gateSummary.repo_owned_generic_runtime_materializer_count, 0);
  assert.equal(gateSummary.repo_owned_queue_or_attempt_ledger_materializer_count, 0);
  assert.equal(gateSummary.repo_owned_target_worktree_lifecycle_materializer_count, 0);
  assert.equal(gateSummary.cleanup_readback_command_ref, 'npm run script-to-pack:readback');
  assert.equal(gateSummary.full_cleanup_readback_command_ref, 'npm run script-to-pack:readback:full');
  assert.equal(gateSummary.cleanup_readback_surface_kind, 'oma_script_to_pack_retirement_cleanup_compact_readback');
  assert.equal(gateSummary.full_cleanup_readback_surface_kind, 'oma_script_to_pack_retirement_cleanup_readback');
  assert.equal(gateSummary.cleanup_readback_state, 'readback_available_cleanup_not_authorized');
  assert.equal(
    gateSummary.compact_cleanup_summary_id,
    'oma.script_to_pack_retirement_cleanup.compact_summary.v1',
  );
  assert.equal(
    gateSummary.compact_cleanup_summary_output_ref,
    'script-to-pack-readback.compact_cleanup_summary',
  );
  assert.equal(gateSummary.compact_cleanup_candidate_count, 0);
  assert.equal(gateSummary.compact_retained_current_count, scriptRefs.length);
  assert.equal(gateSummary.compact_cleanup_apply_candidate_count, 0);
  assert.equal(gateSummary.compact_cleanup_missing_evidence_item_count, 0);
  assert.equal(gateSummary.compact_cleanup_sample_candidate_count, 0);
  assert.equal(gateSummary.cleanup_candidate_count, 0);
  assert.equal(gateSummary.retained_current_count, scriptRefs.length);
  assert.equal(gateSummary.cleanup_apply_candidate_count, 0);
  assert.equal(
    gateSummary.cleanup_readback_authority_ref,
    'runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy.retirement_readback_cleanup_guard',
  );
  assert.equal(gateSummary.cleanup_readback_is_authority, false);
  assert.equal(gateSummary.cleanup_readback_can_authorize_delete, false);
  assert.equal(gateSummary.cleanup_readback_can_claim_retirement_complete, false);
  assert.equal(gateSummary.compact_cleanup_readback_can_authorize_delete, false);
  assert.equal(gateSummary.compact_cleanup_readback_can_claim_retirement_complete, false);
  assert.equal(
    gateSummary.repo_owned_generic_wrapper_materializer_count,
    materializerScan.repo_owned_generic_wrapper_materializer_count,
  );
  assert.equal(
    gateSummary.repo_owned_generic_runtime_materializer_count,
    materializerScan.repo_owned_generic_runtime_materializer_count,
  );
  assert.equal(
    gateSummary.repo_owned_queue_or_attempt_ledger_materializer_count,
    materializerScan.repo_owned_queue_or_attempt_ledger_materializer_count,
  );
  assert.equal(
    gateSummary.repo_owned_target_worktree_lifecycle_materializer_count,
    materializerScan.repo_owned_target_worktree_lifecycle_materializer_count,
  );
  assert.equal(gateSummary.scanned_script_count, scriptRefs.length);
  assert.equal(gateSummary.gated_script_count, gatedScriptRefs.length);
  assert.equal(gateSummary.orphan_script_count, 0);
  assert.equal(gateSummary.script_gate_count, asObjects(morphologyPolicy.script_to_pack_retirement_gates).length);
  assert.deepEqual(asStrings(gateSummary.active_caller_scan_self_guard_refs), [
    'tests/source-purity.test.ts',
    'tests/source-purity/',
  ]);
  assert.deepEqual(asStrings(gateSummary.scanned_script_refs).sort(), scriptRefs);
  assert.deepEqual(asStrings(gateSummary.gated_script_refs).sort(), gatedScriptRefs);
  assert.deepEqual(asStrings(gateReceipt.closed_current_machine_gate_refs), [
    'runtime/authority_functions/meta-agent-authority-functions.json#source_purity_scan_receipt.active_script_caller_scan',
    'runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy.active_caller_scan_policy',
    'runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy.source_ref_integrity_guard',
    'runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy.false_ready_claim_guard',
    'runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy.retirement_readback_cleanup_guard',
    'runtime/authority_functions/meta-agent-authority-functions.json#source_purity_scan_receipt.generic_script_materializer_scan',
    'runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy.generic_materializer_no_resurrection_guard',
    'runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy.script_to_pack_retirement_gates',
    'contracts/private_functional_surface_policy.json#allowed_opl_surface_consumption_refs',
    'tests/source-purity.test.ts#script-morphology-gate',
    'tests/support/source-purity.ts#source-purity-test-structure',
    'tests/source-purity-boundary.test.ts#source-shape-boundary',
    'npm-script:script-to-pack:readback',
    'npm-script:script-to-pack:readback:full',
    'runtime/authority_functions/meta-agent-authority-functions.json#script_morphology_policy.retirement_readback_cleanup_guard.executable_readback_command_ref',
  ]);
  [
    'OPL primitive parity for script policy',
    'physical script retirement',
    'cleanup readback physical delete authorization',
    'source-ref integrity physical delete authorization',
    'source-ref integrity readiness or parity claim',
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
    'generic runtime or wrapper materializer ownership',
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
