import test from 'node:test';
import {
  assert,
  asObjects,
  asStrings,
  readJson,
  assertRepoRefExists,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';

test('live StageRun progress evidence exposes OMA target-agent owner evidence blockers for OPL consumption', () => {
  const evidence = readJson('contracts/live_stage_run_progress_evidence.json');
  const ownerChain = readJson('contracts/target_agent_owner_chain_evidence.json');
  const productionAcceptance = readJson('contracts/production_acceptance/meta-agent-production-acceptance.json');
  const refs = evidence.refs as JsonObject;
  const blockers = asObjects(evidence.typed_blockers);
  const boundary = evidence.authority_boundary as JsonObject;
  const ownerChainSummary = ownerChain.live_stage_run_progress_evidence_summary as JsonObject;
  const ownerTailClosure = ownerChain.target_agent_owner_evidence_tail_closure as JsonObject;
  const productionSummary = productionAcceptance.target_agent_live_stage_progress_summary as JsonObject;

  assert.equal(evidence.surface_kind, 'domain_live_stage_run_progress_evidence');
  assert.equal(evidence.oma_surface_kind, 'opl_meta_agent_live_stage_run_progress_evidence');
  assert.equal(evidence.schema_ref, 'contracts/opl-framework/domain-live-stage-run-progress-evidence.schema.json');
  assert.equal(evidence.schema_version, 1);
  assert.equal(evidence.domain_id, 'opl-meta-agent');
  assert.equal(evidence.owner, 'opl-meta-agent');
  assert.equal(evidence.consumed_by, 'one-person-lab/OPL live StageRun progress consumer');
  assert.equal(evidence.status, 'owner_typed_blocker_recorded_not_ready_claim');
  assert.equal(evidence.progress_status, 'blocked_by_domain_owned_typed_blockers');
  assert.equal(evidence.opl_consumption_status, 'not_ready_by_domain_owned_typed_blocker_refs');
  assert.equal(
    evidence.target_agent_owner_evidence_tail_closure_ref,
    'contracts/target_agent_owner_chain_evidence.json#/target_agent_owner_evidence_tail_closure',
  );
  assert.equal(evidence.target_agent_ready_claimed, false);
  assert.equal(evidence.domain_ready_claimed, false);
  assert.equal(evidence.production_ready_claimed, false);

  assert.deepEqual(asStrings(refs.owner_receipt_refs), []);
  assert.deepEqual(asStrings(refs.human_gate_refs), [
    'human-gate-ref:opl-meta-agent/stage-decomposition/oma_baseline_owner_review',
  ]);
  assert.deepEqual(asStrings(refs.quality_or_export_receipt_refs), []);
  assert.deepEqual(asStrings(refs.long_soak_refs), []);
  assert.deepEqual(asStrings(refs.typed_blocker_refs), [
    'oma-typed-blocker:stage-replay-human-gate:stage-decomposition:oma_baseline_owner_review/baseline-owner-review-receipt-pending',
    ...blockers.map((blocker) => blocker.typed_blocker_ref as string),
  ]);
  assert.ok(asStrings(refs.no_regression_refs).length > 0);
  assert.ok(asStrings(evidence.doc_refs).includes('docs/status.md'));
  assert.ok(asStrings(evidence.next_verification_command_refs).includes('cmd:rtk npm test'));
  assert.ok(asStrings(evidence.next_verification_command_refs).includes('cmd:rtk npm run typecheck'));
  asStrings(evidence.doc_refs).forEach(assertRepoRefExists);

  assert.deepEqual(blockers.map((blocker) => blocker.tail_id), [
    'registry_app_consumption',
    'real_blocked_target_patch_loop_scaleout',
    'independent_codex_reviewer_attempt',
    'standard_target_agent_handoff_convergence',
    'script_to_pack_hygiene',
  ]);
  blockers.forEach((blocker) => {
    const blockerBoundary = blocker.authority_boundary as JsonObject;
    assert.equal(blocker.status, 'blocked_by_missing_external_or_target_owned_evidence');
    assert.equal(blocker.success_claimed, false, `${blocker.tail_id}.success_claimed`);
    assert.equal(blocker.target_agent_ready_claimed, false, `${blocker.tail_id}.target_agent_ready_claimed`);
    assert.equal(blocker.domain_ready_claimed, false, `${blocker.tail_id}.domain_ready_claimed`);
    assert.equal(blocker.production_ready_claimed, false, `${blocker.tail_id}.production_ready_claimed`);
    assert.ok(asStrings(blocker.required_missing_evidence_refs).length > 0);
    assert.ok(asStrings(blocker.next_owner_refs).length > 0);
    assert.equal(blockerBoundary.refs_only, true);
    assert.equal(blockerBoundary.can_write_target_domain_truth, false);
    assert.equal(blockerBoundary.can_write_target_owner_receipt_body, false);
    assert.equal(blockerBoundary.can_claim_target_domain_ready, false);
    assert.equal(blockerBoundary.can_claim_production_ready, false);
  });

  assert.equal(ownerTailClosure.surface_kind, 'opl_meta_agent_target_agent_owner_evidence_tail_closure');
  assert.equal(ownerTailClosure.owner, 'opl-meta-agent');
  assert.equal(ownerTailClosure.closure_kind, 'target_agent_owner_evidence_tail_typed_blocker_closure');
  assert.equal(ownerTailClosure.closure_status, 'blocked_by_domain_owned_typed_blocker_refs');
  assert.equal(ownerTailClosure.opl_consumption_status, 'not_ready_by_domain_owned_typed_blocker_refs');
  assert.equal(ownerTailClosure.live_stage_run_progress_evidence_ref, 'contracts/live_stage_run_progress_evidence.json');
  assert.equal(
    ownerTailClosure.production_acceptance_summary_ref,
    'contracts/production_acceptance/meta-agent-production-acceptance.json#/target_agent_live_stage_progress_summary',
  );
  assertRepoRefExists(ownerTailClosure.live_stage_run_progress_evidence_ref as string);
  assertRepoRefExists((ownerTailClosure.production_acceptance_summary_ref as string).split('#')[0]);
  assert.equal(ownerTailClosure.closed_as_success, false);
  assert.equal(ownerTailClosure.success_claimed, false);
  assert.equal(ownerTailClosure.target_agent_ready_claimed, false);
  assert.equal(ownerTailClosure.domain_ready_claimed, false);
  assert.equal(ownerTailClosure.production_ready_claimed, false);
  assert.deepEqual(asStrings(ownerTailClosure.owner_receipt_refs), []);
  assert.equal(ownerTailClosure.success_receipt_count, 0);
  assert.equal(ownerTailClosure.open_tail_count, blockers.length);
  assert.equal(ownerTailClosure.closed_success_count, 0);
  assert.deepEqual(
    asStrings(ownerTailClosure.typed_blocker_refs),
    blockers.map((blocker) => blocker.typed_blocker_ref as string),
  );
  assert.deepEqual(asStrings(ownerTailClosure.no_regression_refs), [
    'no-regression-ref:opl-meta-agent/target-owner-evidence-tail/no-target-domain-truth-write',
    'no-regression-ref:opl-meta-agent/target-owner-evidence-tail/no-target-owner-receipt-body',
  ]);
  assert.deepEqual(
    asObjects(ownerTailClosure.tail_closure_items).map((item) => item.tail_id),
    blockers.map((blocker) => blocker.tail_id),
  );
  asObjects(ownerTailClosure.tail_closure_items).forEach((item, index) => {
    const blocker = blockers[index];
    assert.equal(item.closure_status, 'blocked_by_domain_owned_typed_blocker_ref');
    assert.equal(item.typed_blocker_ref, blocker.typed_blocker_ref);
    assert.deepEqual(asStrings(item.next_owner_refs), asStrings(blocker.next_owner_refs));
    assert.deepEqual(
      asStrings(item.required_missing_evidence_refs),
      asStrings(blocker.required_missing_evidence_refs),
    );
  });
  const ownerTailBoundary = ownerTailClosure.authority_boundary as JsonObject;
  assert.equal(ownerTailBoundary.refs_only, true);
  assert.equal(ownerTailBoundary.can_write_target_domain_truth, false);
  assert.equal(ownerTailBoundary.can_write_target_owner_receipt_body, false);
  assert.equal(ownerTailBoundary.can_claim_target_domain_ready, false);
  assert.equal(ownerTailBoundary.can_claim_domain_ready, false);
  assert.equal(ownerTailBoundary.can_claim_production_ready, false);
  assert.equal(ownerTailBoundary.can_promote_default_agent_without_gate, false);

  assert.equal(boundary.refs_only, true);
  assert.equal(boundary.can_write_target_domain_truth, false);
  assert.equal(boundary.can_write_target_domain_memory_body, false);
  assert.equal(boundary.can_mutate_target_domain_artifact_body, false);
  assert.equal(boundary.can_authorize_target_domain_quality_or_export, false);
  assert.equal(boundary.can_write_target_owner_receipt_body, false);
  assert.equal(boundary.opl_can_sign_owner_receipt, false);
  assert.equal(boundary.opl_can_create_typed_blocker, false);
  assert.equal(boundary.opl_can_claim_domain_ready, false);
  assert.equal(boundary.opl_can_claim_production_ready, false);
  assert.equal(boundary.provider_completion_counts_as_domain_ready, false);
  assert.equal(boundary.structural_conformance_counts_as_live_progress, false);
  assert.equal(boundary.can_claim_target_domain_ready, false);
  assert.equal(boundary.can_claim_domain_ready, false);
  assert.equal(boundary.can_claim_production_ready, false);
  assert.equal(boundary.can_promote_default_agent_without_gate, false);

  assert.equal(
    ownerChainSummary.live_stage_run_progress_evidence_ref,
    'contracts/live_stage_run_progress_evidence.json',
  );
  assert.equal(
    ownerChainSummary.target_agent_owner_evidence_tail_closure_ref,
    evidence.target_agent_owner_evidence_tail_closure_ref,
  );
  assert.equal(ownerChainSummary.opl_consumption_status, evidence.opl_consumption_status);
  assert.deepEqual(
    asStrings(ownerChainSummary.typed_blocker_refs),
    asStrings(refs.typed_blocker_refs),
  );
  assert.equal(
    productionSummary.live_stage_run_progress_evidence_ref,
    'contracts/live_stage_run_progress_evidence.json',
  );
  assert.equal(
    productionSummary.target_agent_owner_evidence_tail_closure_ref,
    evidence.target_agent_owner_evidence_tail_closure_ref,
  );
  assert.equal(productionSummary.opl_consumption_status, evidence.opl_consumption_status);
  assert.deepEqual(
    asStrings(productionSummary.typed_blocker_refs),
    asStrings(refs.typed_blocker_refs),
  );
});
