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
  const productionSummary = productionAcceptance.target_agent_live_stage_progress_summary as JsonObject;

  assert.equal(evidence.surface_kind, 'opl_meta_agent_live_stage_run_progress_evidence');
  assert.equal(evidence.schema_version, 1);
  assert.equal(evidence.domain_id, 'opl-meta-agent');
  assert.equal(evidence.owner, 'opl-meta-agent');
  assert.equal(evidence.consumed_by, 'one-person-lab/OPL live StageRun progress consumer');
  assert.equal(evidence.progress_status, 'blocked_by_domain_owned_typed_blockers');
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

  assert.equal(boundary.refs_only, true);
  assert.equal(boundary.can_write_target_domain_truth, false);
  assert.equal(boundary.can_write_target_domain_memory_body, false);
  assert.equal(boundary.can_mutate_target_domain_artifact_body, false);
  assert.equal(boundary.can_authorize_target_domain_quality_or_export, false);
  assert.equal(boundary.can_write_target_owner_receipt_body, false);
  assert.equal(boundary.can_claim_target_domain_ready, false);
  assert.equal(boundary.can_claim_domain_ready, false);
  assert.equal(boundary.can_claim_production_ready, false);
  assert.equal(boundary.can_promote_default_agent_without_gate, false);

  assert.equal(
    ownerChainSummary.live_stage_run_progress_evidence_ref,
    'contracts/live_stage_run_progress_evidence.json',
  );
  assert.deepEqual(
    asStrings(ownerChainSummary.typed_blocker_refs),
    asStrings(refs.typed_blocker_refs),
  );
  assert.equal(
    productionSummary.live_stage_run_progress_evidence_ref,
    'contracts/live_stage_run_progress_evidence.json',
  );
  assert.deepEqual(
    asStrings(productionSummary.typed_blocker_refs),
    asStrings(refs.typed_blocker_refs),
  );
});
