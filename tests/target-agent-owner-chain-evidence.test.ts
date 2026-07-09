import assert from 'node:assert/strict';
import test from 'node:test';
import {
  asObjects,
  asStrings,
  readJson,
  assertContractRefExists,
  assertOptionalFalseFlags,
  assertRefsOnlyAuthorityBoundary,
  extendedTargetAuthorityFalseFields,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';

const ownerChainEvidenceRef = 'contracts/target_agent_owner_chain_evidence.json';
const liveProgressEvidenceRef = 'contracts/live_stage_run_progress_evidence.json';
const productionAcceptanceRef = 'contracts/production_acceptance/meta-agent-production-acceptance.json';
const scriptToPackGateRef = 'script-to-pack-gate-receipt:opl-meta-agent/current-script-morphology-policy';

function assertLiveProgressProjection(
  summary: JsonObject,
  liveProgress: JsonObject,
  label: string,
): void {
  const liveRefs = liveProgress.refs as JsonObject;
  assert.equal(summary.live_stage_run_progress_evidence_ref, liveProgressEvidenceRef, `${label}.live_stage_run_progress_evidence_ref`);
  assert.equal(summary.opl_consumption_status, liveProgress.opl_consumption_status, `${label}.opl_consumption_status`);
  assert.deepEqual(asStrings(summary.typed_blocker_refs), asStrings(liveRefs.typed_blocker_refs), `${label}.typed_blocker_refs`);
  assert.deepEqual(asStrings(summary.human_gate_refs), asStrings(liveRefs.human_gate_refs), `${label}.human_gate_refs`);
  assert.deepEqual(asStrings(summary.script_to_pack_gate_receipt_refs), [scriptToPackGateRef]);
  assert.equal(summary.open_tail_count, asObjects(liveProgress.typed_blockers).length);
  assertOptionalFalseFlags(summary, label);
}

test('target-agent owner-chain evidence preserves action ref shapes and live-progress linkage', () => {
  const profile = readJson('contracts/stage_run_kernel_profile.json');
  const actionCatalog = readJson('contracts/action_catalog.json');
  const evidence = readJson(ownerChainEvidenceRef);
  const productionAcceptance = readJson(productionAcceptanceRef);
  const liveProgress = readJson(liveProgressEvidenceRef);
  const scriptToPackGate = readJson('contracts/script_to_pack_gate_receipt.json');

  const canary = profile.agent_building_stage_run_canary as JsonObject;
  const actionIds = new Set(asObjects(actionCatalog.actions).map((action) => action.action_id));
  const readoutByAction = new Map(asObjects(evidence.opl_hosted_action_path_readout)
    .map((entry) => [entry.action_id, entry]));
  const liveProgressRefs = liveProgress.refs as JsonObject;
  const liveProgressBlockers = asObjects(liveProgress.typed_blockers);
  const liveProgressSummary = evidence.live_stage_run_progress_evidence_summary as JsonObject;
  const ownerTailClosure = evidence.target_agent_owner_evidence_tail_closure as JsonObject;
  const productionLiveProgressSummary = productionAcceptance.target_agent_live_stage_progress_summary as JsonObject;

  assert.equal(evidence.surface_kind, 'opl_meta_agent_target_agent_owner_chain_evidence');
  assert.equal(evidence.evidence_status, 'owner_chain_live_progress_ref_shapes_accepted');
  assert.equal(evidence.evidence_scope, 'opl_hosted_canary_not_target_repo_mutation');
  assertOptionalFalseFlags(evidence, 'ownerChainEvidence');
  assert.equal(evidence.target_artifact_authority_claimed, false);
  assert.equal(canary.target_agent_owner_chain_evidence_ref, ownerChainEvidenceRef);
  assert.equal(
    actionCatalog.registration_projection_evidence_contract_refs.target_agent_owner_chain_evidence_ref,
    ownerChainEvidenceRef,
  );
  Object.values(evidence.source_refs as JsonObject).forEach((ref) => assertContractRefExists(ref as string));

  const expectedActionRefShapes: Record<string, string[]> = {
    'build-agent-baseline': [
      'oma_owner_receipt_ref',
      'target_agent_owner_receipt_ref',
      'agent_lab_result_ref',
      'no_regression_ref',
    ],
    'takeover-target-agent-test': [
      'takeover_receipt_ref',
      'target_agent_typed_blocker_ref',
      'agent_lab_result_ref',
      'no_regression_ref',
    ],
    'improve-from-external-agent-lab-suite': [
      'developer_patch_work_order_ref',
      'work_order_currentness_ref',
      'target_owner_receipt_or_typed_blocker_ref',
      'no_regression_ref',
    ],
    'execute-external-work-order': [
      'external_work_order_delegation_ref',
      'work_order_execution_receipt_ref',
      'target_owner_receipt_or_typed_blocker_ref',
      'no_regression_ref',
    ],
  };
  Object.entries(expectedActionRefShapes).forEach(([actionId, acceptedRefShapes]) => {
    assert.ok(actionIds.has(actionId), `${actionId} should stay in action catalog`);
    const readout = readoutByAction.get(actionId) as JsonObject;
    assert.ok(readout, `${actionId} should have owner-chain readout`);
    assert.equal(readout.hosted_path_owner, 'one-person-lab/OPL generated surface');
    assert.equal(readout.uses_oma_runner_or_queue, false);
    assert.equal(readout.canary_modifies_external_target_repo, false);
    assert.equal(readout.canary_materializes_candidate_agent_body, false);
    assert.deepEqual(asStrings(readout.accepted_ref_shapes), acceptedRefShapes);
    assertRefsOnlyAuthorityBoundary(
      readout.authority_boundary as JsonObject,
      `${actionId}.authority_boundary`,
      extendedTargetAuthorityFalseFields,
    );
  });

  const refPolicy = evidence.accepted_ref_shape_policy as JsonObject;
  assert.deepEqual(asStrings((refPolicy.target_agent_owner_receipt_ref as JsonObject).accepted_ref_prefixes), [
    'target-owner-receipt:',
    'target-owner-receipt-ref:',
  ]);
  assert.deepEqual(asStrings((refPolicy.target_agent_typed_blocker_ref as JsonObject).accepted_ref_prefixes), [
    'typed-blocker:',
    'typed-blocker-ref:',
  ]);

  const canaryReadout = evidence.controlled_owner_chain_canary_readout as JsonObject;
  assert.equal(canaryReadout.no_external_target_repo_modified, true);
  assert.equal(canaryReadout.no_candidate_agent_body_generated, true);
  [
    'target_agent_owner_receipt_ref',
    'target_agent_typed_blocker_ref',
    'no_regression_ref',
  ].forEach((refClass) => {
    assert.ok(asStrings(canaryReadout.required_terminal_ref_classes).includes(refClass), refClass);
  });

  const humanGateClosure = evidence.stage_replay_human_gate_blocker_closure as JsonObject;
  const productionHumanGateSummary = productionAcceptance.stage_replay_human_gate_blocker_summary as JsonObject;
  assert.equal(humanGateClosure.closure_status, 'blocked_by_domain_owned_typed_blocker_ref');
  assert.equal(humanGateClosure.production_acceptance_summary_ref, `${productionAcceptanceRef}#/stage_replay_human_gate_blocker_summary`);
  assertContractRefExists(humanGateClosure.production_acceptance_summary_ref as string);
  assert.deepEqual(asStrings(humanGateClosure.typed_blocker_refs), asStrings(productionHumanGateSummary.typed_blocker_refs));
  assert.deepEqual(asStrings(humanGateClosure.owner_receipt_refs), []);
  assert.equal(humanGateClosure.success_receipt_count, 0);
  assertOptionalFalseFlags(humanGateClosure, 'humanGateClosure');
  assertRefsOnlyAuthorityBoundary(humanGateClosure.authority_boundary as JsonObject, 'humanGateClosure.authority_boundary', [
    'can_write_owner_receipt',
    'can_close_replay_success_path',
  ]);

  assertLiveProgressProjection(liveProgressSummary, liveProgress, 'ownerChain.liveProgressSummary');
  assert.equal(
    productionLiveProgressSummary.target_agent_owner_evidence_tail_closure_ref,
    liveProgressSummary.target_agent_owner_evidence_tail_closure_ref,
  );
  assertLiveProgressProjection(productionLiveProgressSummary, liveProgress, 'productionAcceptance.liveProgressSummary');

  assert.equal(ownerTailClosure.closure_status, 'blocked_by_domain_owned_typed_blocker_refs');
  assert.equal(ownerTailClosure.opl_consumption_status, liveProgressSummary.opl_consumption_status);
  assert.equal(ownerTailClosure.live_stage_run_progress_evidence_ref, liveProgressSummary.live_stage_run_progress_evidence_ref);
  assertOptionalFalseFlags(ownerTailClosure, 'ownerTailClosure');
  assert.deepEqual(asStrings(ownerTailClosure.owner_receipt_refs), []);
  assert.equal(ownerTailClosure.success_receipt_count, 0);
  assert.deepEqual(asStrings(ownerTailClosure.script_to_pack_gate_receipt_refs), [scriptToPackGateRef]);
  assert.deepEqual(
    asStrings(ownerTailClosure.typed_blocker_refs),
    liveProgressBlockers.map((blocker) => blocker.typed_blocker_ref as string),
  );
  asObjects(ownerTailClosure.tail_closure_items).forEach((item, index) => {
    const blocker = liveProgressBlockers[index];
    assert.equal(item.closure_status, 'blocked_by_domain_owned_typed_blocker_ref');
    assert.equal(item.typed_blocker_ref, blocker.typed_blocker_ref);
    assert.deepEqual(asStrings(item.next_owner_refs), asStrings(blocker.next_owner_refs));
    assert.deepEqual(asStrings(item.required_missing_evidence_refs), asStrings(blocker.required_missing_evidence_refs));
  });

  const closedStructureGate = asObjects(ownerTailClosure.closed_structure_gate_items)
    .find((item) => item.tail_id === 'script_to_pack_hygiene') as JsonObject;
  assert.ok(closedStructureGate, 'script_to_pack_hygiene should be closed as a structure gate');
  assert.equal(scriptToPackGate.receipt_ref, scriptToPackGateRef);
  assert.equal(scriptToPackGate.authority_boundary.can_authorize_script_retirement, false);
  assert.equal(scriptToPackGate.authority_boundary.can_claim_domain_ready, false);
  assert.equal(scriptToPackGate.authority_boundary.can_claim_production_ready, false);
  assertRefsOnlyAuthorityBoundary(ownerTailClosure.authority_boundary as JsonObject, 'ownerTailClosure.authority_boundary');
  assertRefsOnlyAuthorityBoundary(
    evidence.authority_boundary as JsonObject,
    'targetAgentOwnerChainEvidence.authority_boundary',
    extendedTargetAuthorityFalseFields,
  );
});

test('OMA domain-owner-chain scaleout projects live refs without target authority claims', () => {
  const evidence = readJson(ownerChainEvidenceRef);
  const liveProgress = readJson(liveProgressEvidenceRef);
  const scaleout = evidence.domain_owner_chain_scaleout as JsonObject;
  const liveRefs = liveProgress.refs as JsonObject;
  const liveBlockers = asObjects(liveProgress.typed_blockers);

  assert.equal(scaleout.status, 'domain_owned_typed_blocker_refs_recorded_not_ready_claim');
  assert.equal(scaleout.opl_consumption_status, liveProgress.opl_consumption_status);
  assert.equal(scaleout.ready_claim_authorized, false);
  assertOptionalFalseFlags(scaleout, 'scaleout');
  assert.equal(scaleout.target_artifact_authority_claimed, false);
  assert.equal(scaleout.live_stage_run_progress_evidence_ref, liveProgressEvidenceRef);
  assertContractRefExists(scaleout.live_stage_run_progress_evidence_ref as string);

  const backfillRefs = scaleout.opl_backfill_refs as JsonObject;
  assert.deepEqual(asStrings(backfillRefs.owner_receipt_refs), asStrings(liveRefs.owner_receipt_refs));
  assert.deepEqual(asStrings(backfillRefs.typed_blocker_refs), asStrings(liveRefs.typed_blocker_refs));
  assert.deepEqual(asStrings(backfillRefs.script_to_pack_gate_receipt_refs), [scriptToPackGateRef]);
  assert.deepEqual(asStrings(scaleout.blocked_tail_ids), [
    'stage_replay_human_gate',
    ...liveBlockers.map((blocker) => blocker.tail_id as string),
  ]);
  assert.deepEqual(asStrings(scaleout.closed_structure_tail_ids), ['script_to_pack_hygiene']);
  assert.deepEqual(scaleout.observed_ref_counts, {
    owner_receipt_ref_count: asStrings(liveRefs.owner_receipt_refs).length,
    typed_blocker_ref_count: asStrings(liveRefs.typed_blocker_refs).length,
    script_to_pack_gate_receipt_ref_count: 1,
    human_gate_ref_count: asStrings(liveRefs.human_gate_refs).length,
    work_order_execution_receipt_ref_count: 0,
    no_regression_ref_count: asStrings(liveRefs.no_regression_refs).length,
  });

  const boundary = scaleout.authority_boundary as JsonObject;
  assert.equal(boundary.oma_owns_owner_chain_refs, true);
  assert.equal(boundary.opl_can_consume_refs, true);
  assertRefsOnlyAuthorityBoundary(boundary, 'scaleout.authority_boundary');
});
