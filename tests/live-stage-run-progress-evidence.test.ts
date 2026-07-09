import assert from 'node:assert/strict';
import test from 'node:test';
import {
  asObjects,
  asStrings,
  readJson,
  assertContractRefExists,
  assertOptionalFalseFlags,
  assertRefsOnlyAuthorityBoundary,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';

const liveProgressEvidenceRef = 'contracts/live_stage_run_progress_evidence.json';
const ownerTailClosureRef = 'contracts/target_agent_owner_chain_evidence.json#/target_agent_owner_evidence_tail_closure';
const scriptToPackGateRef = 'script-to-pack-gate-receipt:opl-meta-agent/current-script-morphology-policy';

function assertTypedBlocker(blocker: JsonObject): void {
  const label = `typedBlocker.${blocker.tail_id as string}`;
  assert.equal(blocker.status, 'blocked_by_missing_external_or_target_owned_evidence', `${label}.status`);
  assert.ok(asStrings(blocker.required_missing_evidence_refs).length > 0, `${label}.required_missing_evidence_refs`);
  assert.ok(asStrings(blocker.next_owner_refs).length > 0, `${label}.next_owner_refs`);
  assertOptionalFalseFlags(blocker, label);
  assertRefsOnlyAuthorityBoundary(blocker.authority_boundary as JsonObject, `${label}.authority_boundary`);
}

function assertProgressSummary(summary: JsonObject, source: JsonObject, label: string): void {
  const refs = source.refs as JsonObject;
  assert.equal(summary.live_stage_run_progress_evidence_ref, liveProgressEvidenceRef, `${label}.live_stage_run_progress_evidence_ref`);
  assert.equal(summary.target_agent_owner_evidence_tail_closure_ref, source.target_agent_owner_evidence_tail_closure_ref);
  assert.equal(summary.opl_consumption_status, source.opl_consumption_status, `${label}.opl_consumption_status`);
  assert.deepEqual(asStrings(summary.typed_blocker_refs), asStrings(refs.typed_blocker_refs), `${label}.typed_blocker_refs`);
  assert.deepEqual(asStrings(summary.script_to_pack_gate_receipt_refs), [scriptToPackGateRef], `${label}.script_to_pack_gate_receipt_refs`);
  assert.equal(summary.open_tail_count, asObjects(source.typed_blockers).length, `${label}.open_tail_count`);
  assert.equal(summary.closed_structure_gate_count, 1, `${label}.closed_structure_gate_count`);
  assertOptionalFalseFlags(summary, label);
  assertRefsOnlyAuthorityBoundary(summary.authority_boundary as JsonObject, `${label}.authority_boundary`);
}

test('live StageRun progress evidence keeps typed blocker refs consumable without ready claims', () => {
  const evidence = readJson(liveProgressEvidenceRef);
  const ownerChain = readJson('contracts/target_agent_owner_chain_evidence.json');
  const productionAcceptance = readJson('contracts/production_acceptance/meta-agent-production-acceptance.json');
  const scriptToPackGate = readJson('contracts/script_to_pack_gate_receipt.json');

  const refs = evidence.refs as JsonObject;
  const blockers = asObjects(evidence.typed_blockers);
  const ownerChainSummary = ownerChain.live_stage_run_progress_evidence_summary as JsonObject;
  const ownerTailClosure = ownerChain.target_agent_owner_evidence_tail_closure as JsonObject;
  const productionSummary = productionAcceptance.target_agent_live_stage_progress_summary as JsonObject;

  assert.equal(evidence.surface_kind, 'domain_live_stage_run_progress_evidence');
  assert.equal(evidence.oma_surface_kind, 'opl_meta_agent_live_stage_run_progress_evidence');
  assert.equal(evidence.status, 'owner_typed_blocker_recorded_not_ready_claim');
  assert.equal(evidence.progress_status, 'blocked_by_domain_owned_typed_blockers');
  assert.equal(evidence.opl_consumption_status, 'not_ready_by_domain_owned_typed_blocker_refs');
  assert.equal(evidence.target_agent_owner_evidence_tail_closure_ref, ownerTailClosureRef);
  assertOptionalFalseFlags(evidence, 'liveProgressEvidence');

  assert.deepEqual(asStrings(refs.owner_receipt_refs), []);
  assert.deepEqual(asStrings(refs.human_gate_refs), [
    'human-gate-ref:opl-meta-agent/stage-decomposition/oma_baseline_owner_review',
  ]);
  assert.deepEqual(asStrings(refs.script_to_pack_gate_receipt_refs), [scriptToPackGateRef]);
  assert.deepEqual(asStrings(refs.typed_blocker_refs), [
    'oma-typed-blocker:stage-replay-human-gate:stage-decomposition:oma_baseline_owner_review/baseline-owner-review-receipt-pending',
    ...blockers.map((blocker) => blocker.typed_blocker_ref as string),
  ]);
  assert.ok(asStrings(refs.no_regression_refs).length > 0);
  asStrings(evidence.doc_refs).forEach(assertContractRefExists);

  blockers.forEach(assertTypedBlocker);

  assert.equal(scriptToPackGate.receipt_ref, scriptToPackGateRef);
  assert.equal(scriptToPackGate.closes_tail_id, 'script_to_pack_hygiene');
  assert.equal(scriptToPackGate.closure_status, 'machine_gate_landed_not_success_readiness_or_retirement');
  assertRefsOnlyAuthorityBoundary(scriptToPackGate.authority_boundary as JsonObject, 'scriptToPackGate.authority_boundary', [
    'can_claim_OPL_primitive_parity',
    'can_authorize_script_retirement',
    'can_claim_domain_ready',
    'can_claim_production_ready',
  ]);

  assert.equal(ownerTailClosure.surface_kind, 'opl_meta_agent_target_agent_owner_evidence_tail_closure');
  assert.equal(ownerTailClosure.closure_status, 'blocked_by_domain_owned_typed_blocker_refs');
  assert.equal(ownerTailClosure.live_stage_run_progress_evidence_ref, liveProgressEvidenceRef);
  assertContractRefExists(ownerTailClosure.production_acceptance_summary_ref as string);
  assertOptionalFalseFlags(ownerTailClosure, 'ownerTailClosure');
  assert.deepEqual(asStrings(ownerTailClosure.owner_receipt_refs), []);
  assert.equal(ownerTailClosure.success_receipt_count, 0);
  assert.equal(ownerTailClosure.open_tail_count, blockers.length);
  assert.deepEqual(
    asStrings(ownerTailClosure.typed_blocker_refs),
    blockers.map((blocker) => blocker.typed_blocker_ref as string),
  );
  assert.deepEqual(
    asObjects(ownerTailClosure.tail_closure_items).map((item) => item.tail_id),
    blockers.map((blocker) => blocker.tail_id),
  );
  assert.deepEqual(asStrings(ownerTailClosure.script_to_pack_gate_receipt_refs), [scriptToPackGateRef]);
  assertRefsOnlyAuthorityBoundary(ownerTailClosure.authority_boundary as JsonObject, 'ownerTailClosure.authority_boundary');

  const closedStructureGate = asObjects(ownerTailClosure.closed_structure_gate_items)
    .find((item) => item.tail_id === 'script_to_pack_hygiene') as JsonObject;
  assert.ok(closedStructureGate, 'script_to_pack_hygiene should stay represented as a closed structure gate');
  assert.equal(closedStructureGate.receipt_ref, scriptToPackGateRef);
  assert.equal(closedStructureGate.receipt_contract_ref, 'contracts/script_to_pack_gate_receipt.json');

  assertProgressSummary(ownerChainSummary, evidence, 'ownerChainSummary');
  assertProgressSummary(productionSummary, evidence, 'productionSummary');
  assertRefsOnlyAuthorityBoundary(evidence.authority_boundary as JsonObject, 'liveProgressEvidence.authority_boundary', [
    'can_write_target_domain_truth',
    'can_write_target_domain_memory_body',
    'can_mutate_target_domain_artifact_body',
    'can_authorize_target_domain_quality_or_export',
    'can_write_target_owner_receipt_body',
    'opl_can_sign_owner_receipt',
    'opl_can_create_typed_blocker',
    'opl_can_claim_domain_ready',
    'opl_can_claim_production_ready',
    'provider_completion_counts_as_domain_ready',
    'structural_conformance_counts_as_live_progress',
    'can_claim_target_domain_ready',
    'can_claim_domain_ready',
    'can_claim_production_ready',
    'can_promote_default_agent_without_gate',
  ]);
});
