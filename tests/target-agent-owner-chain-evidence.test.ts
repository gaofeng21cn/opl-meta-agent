import test from 'node:test';
import {
  assert,
  asObjects,
  asStrings,
  readJson,
  assertRepoRefExists,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';

const requiredAuthorityFalseFlags = [
  'can_write_target_domain_truth',
  'can_write_target_domain_memory_body',
  'can_mutate_target_domain_artifact_body',
  'can_authorize_target_domain_quality_or_export',
  'can_claim_target_domain_ready',
  'can_claim_production_ready',
  'can_hold_target_artifact_authority',
  'can_write_target_owner_receipt_body',
  'can_promote_default_agent_without_gate',
  'can_manage_target_worktree_lifecycle',
  'can_own_generic_runner',
  'can_own_generic_queue_or_attempt_ledger',
];

function assertFalseAuthorityBoundary(surface: JsonObject, label: string): void {
  assert.equal(surface.refs_only, true, `${label}.refs_only`);
  requiredAuthorityFalseFlags.forEach((field) => {
    assert.equal(surface[field], false, `${label}.${field}`);
  });
}

test('target-agent owner-chain evidence accepts live-progress refs without target authority claims', () => {
  const profile = readJson('contracts/stage_run_kernel_profile.json');
  const actionCatalog = readJson('contracts/action_catalog.json');
  const evidence = readJson('contracts/target_agent_owner_chain_evidence.json');
  const productionAcceptance = readJson('contracts/production_acceptance/meta-agent-production-acceptance.json');
  const canary = profile.agent_building_stage_run_canary as JsonObject;
  const actionIds = new Set(asObjects(actionCatalog.actions).map((action) => action.action_id));
  const readouts = asObjects(evidence.opl_hosted_action_path_readout);
  const readoutByAction = new Map(readouts.map((entry) => [entry.action_id, entry]));
  const refPolicy = evidence.accepted_ref_shape_policy as JsonObject;
  const humanGateClosure = evidence.stage_replay_human_gate_blocker_closure as JsonObject;
  const humanGateTarget = humanGateClosure.target_identity as JsonObject;
  const humanGateBoundary = humanGateClosure.authority_boundary as JsonObject;
  const liveProgress = readJson('contracts/live_stage_run_progress_evidence.json');
  const liveProgressRefs = liveProgress.refs as JsonObject;
  const liveProgressBlockers = asObjects(liveProgress.typed_blockers);
  const liveProgressSummary = evidence.live_stage_run_progress_evidence_summary as JsonObject;
  const ownerTailClosure = evidence.target_agent_owner_evidence_tail_closure as JsonObject;
  const ownerTailBoundary = ownerTailClosure.authority_boundary as JsonObject;
  const productionHumanGateSummary = productionAcceptance.stage_replay_human_gate_blocker_summary as JsonObject;
  const productionLiveProgressSummary = productionAcceptance.target_agent_live_stage_progress_summary as JsonObject;

  assert.equal(evidence.surface_kind, 'opl_meta_agent_target_agent_owner_chain_evidence');
  assert.equal(evidence.version, 'target-agent-owner-chain-evidence.v1');
  assert.equal(evidence.owner, 'opl-meta-agent');
  assert.equal(evidence.evidence_status, 'owner_chain_live_progress_ref_shapes_accepted');
  assert.equal(evidence.evidence_scope, 'opl_hosted_canary_not_target_repo_mutation');
  assert.equal(evidence.target_agent_ready_claimed, false);
  assert.equal(evidence.production_ready_claimed, false);
  assert.equal(evidence.target_artifact_authority_claimed, false);

  assert.equal(
    canary.target_agent_owner_chain_evidence_ref,
    'contracts/target_agent_owner_chain_evidence.json',
  );
  assert.equal(
    actionCatalog.registration_projection_evidence_contract_refs.target_agent_owner_chain_evidence_ref,
    'contracts/target_agent_owner_chain_evidence.json',
  );
  assertRepoRefExists(evidence.source_refs.action_catalog_ref as string);
  assertRepoRefExists(evidence.source_refs.stage_run_kernel_profile_ref as string);
  assertRepoRefExists(evidence.source_refs.stage_run_canary_evidence_ref as string);
  assertRepoRefExists(evidence.source_refs.real_target_agent_scaleout_evidence_ref as string);
  assertRepoRefExists(evidence.source_refs.production_acceptance_ref as string);

  [
    'build-agent-baseline',
    'takeover-target-agent-test',
    'improve-from-external-agent-lab-suite',
    'execute-external-work-order',
  ].forEach((actionId) => {
    assert.ok(actionIds.has(actionId), `${actionId} should stay in action catalog`);
    assert.ok(readoutByAction.has(actionId), `${actionId} should have owner-chain readout`);
    const readout = readoutByAction.get(actionId) as JsonObject;
    assert.equal(readout.generated_action_contract_ref, `contracts/action_catalog.json#/actions/${actionId}`);
    assert.equal(readout.hosted_path_owner, 'one-person-lab/OPL generated surface');
    assert.equal(readout.uses_oma_runner_or_queue, false);
    assert.equal(readout.canary_modifies_external_target_repo, false);
    assert.equal(readout.canary_materializes_candidate_agent_body, false);
    assertFalseAuthorityBoundary(readout.authority_boundary as JsonObject, actionId);
  });

  assert.deepEqual(asStrings(readoutByAction.get('build-agent-baseline')?.accepted_ref_shapes), [
    'oma_owner_receipt_ref',
    'target_agent_owner_receipt_ref',
    'agent_lab_result_ref',
    'no_regression_ref',
  ]);
  assert.deepEqual(asStrings(readoutByAction.get('takeover-target-agent-test')?.accepted_ref_shapes), [
    'takeover_receipt_ref',
    'target_agent_typed_blocker_ref',
    'agent_lab_result_ref',
    'no_regression_ref',
  ]);
  assert.deepEqual(asStrings(readoutByAction.get('improve-from-external-agent-lab-suite')?.accepted_ref_shapes), [
    'developer_patch_work_order_ref',
    'work_order_currentness_ref',
    'target_owner_receipt_or_typed_blocker_ref',
    'no_regression_ref',
  ]);
  assert.deepEqual(asStrings(readoutByAction.get('execute-external-work-order')?.accepted_ref_shapes), [
    'external_work_order_delegation_ref',
    'work_order_execution_receipt_ref',
    'target_owner_receipt_or_typed_blocker_ref',
    'no_regression_ref',
  ]);

  assert.deepEqual(asStrings(refPolicy.target_agent_owner_receipt_ref.accepted_ref_prefixes), [
    'target-owner-receipt:',
    'target-owner-receipt-ref:',
  ]);
  assert.deepEqual(asStrings(refPolicy.target_agent_typed_blocker_ref.accepted_ref_prefixes), [
    'typed-blocker:',
    'typed-blocker-ref:',
  ]);
  assert.deepEqual(asStrings(refPolicy.work_order_execution_receipt_ref.accepted_ref_prefixes), [
    'work-order-execution-receipt:',
    'opl-work-order-execute-result:',
  ]);
  assert.deepEqual(asStrings(refPolicy.no_regression_ref.accepted_ref_prefixes), [
    'no-regression-ref:',
    'agent-lab-no-regression-ref:',
  ]);

  const canaryReadout = evidence.controlled_owner_chain_canary_readout as JsonObject;
  assert.equal(canaryReadout.canary_kind, 'target_agent_owner_chain_live_progress_evidence');
  assert.equal(canaryReadout.no_external_target_repo_modified, true);
  assert.equal(canaryReadout.no_candidate_agent_body_generated, true);
  assert.equal(canaryReadout.opl_hosted_path_required, true);
  assert.deepEqual(asStrings(canaryReadout.required_terminal_ref_classes), [
    'target_agent_owner_receipt_ref',
    'target_agent_typed_blocker_ref',
    'work_order_execution_receipt_ref',
    'no_regression_ref',
  ]);

  assert.equal(
    canary.stage_replay_human_gate_blocker_closure_ref,
    'contracts/target_agent_owner_chain_evidence.json#/stage_replay_human_gate_blocker_closure',
  );
  assert.equal(
    humanGateClosure.surface_kind,
    'opl_meta_agent_stage_replay_human_gate_owner_chain_closure',
  );
  assert.equal(humanGateClosure.closure_kind, 'human_gate_missing_receipt_typed_blocker_closure');
  assert.equal(humanGateClosure.closure_status, 'blocked_by_domain_owned_typed_blocker_ref');
  assert.equal(humanGateTarget.domain_id, 'opl-meta-agent');
  assert.equal(humanGateTarget.stage_id, 'stage-decomposition');
  assert.equal(humanGateTarget.missing_ref, 'human_gate:oma_baseline_owner_review');
  assert.equal(humanGateClosure.missing_ref_kind, 'human_gate_ref');
  assert.equal(
    humanGateClosure.stage_replay_missing_receipt_ref,
    'opl://stage-replay-missing-receipt/opl-meta-agent%2Fstage-decomposition%2Fhuman_gate%3Aoma_baseline_owner_review',
  );
  assert.equal(
    humanGateClosure.production_acceptance_summary_ref,
    'contracts/production_acceptance/meta-agent-production-acceptance.json#/stage_replay_human_gate_blocker_summary',
  );
  assertRepoRefExists((humanGateClosure.production_acceptance_summary_ref as string).split('#')[0]);
  assert.deepEqual(asStrings(humanGateClosure.accepted_ref_shapes), [
    'target_agent_typed_blocker_ref',
    'no_regression_ref',
  ]);
  assert.deepEqual(
    asStrings(humanGateClosure.typed_blocker_refs),
    asStrings(productionHumanGateSummary.typed_blocker_refs),
  );
  assert.deepEqual(asStrings(humanGateClosure.no_regression_refs), [
    'no-regression-ref:opl-meta-agent/stage-replay-human-gate/oma_baseline_owner_review/no-target-repo-mutation',
  ]);
  assert.equal(humanGateClosure.success_receipt_count, 0);
  assert.deepEqual(asStrings(humanGateClosure.owner_receipt_refs), []);
  assert.equal(humanGateClosure.blocker_reason, productionHumanGateSummary.blocker_reason);
  assert.equal(humanGateClosure.blocker_closure_status, 'closed_as_typed_blocker_not_success');
  assert.equal(humanGateClosure.success_claimed, false);
  assert.equal(humanGateClosure.human_gate_approval_claimed, false);
  assert.equal(humanGateClosure.target_agent_ready_claimed, false);
  assert.equal(humanGateClosure.domain_ready_claimed, false);
  assert.equal(humanGateClosure.production_ready_claimed, false);
  assert.equal(humanGateBoundary.refs_only, true);
  assert.equal(humanGateBoundary.can_requery_human, false);
  assert.equal(humanGateBoundary.can_write_owner_receipt, false);
  assert.equal(humanGateBoundary.can_write_target_domain_truth, false);
  assert.equal(humanGateBoundary.can_write_target_domain_memory_body, false);
  assert.equal(humanGateBoundary.can_mutate_target_domain_artifact_body, false);
  assert.equal(humanGateBoundary.can_authorize_target_domain_quality_or_export, false);
  assert.equal(humanGateBoundary.can_claim_target_domain_ready, false);
  assert.equal(humanGateBoundary.can_claim_production_ready, false);
  assert.equal(humanGateBoundary.can_promote_default_agent_without_gate, false);
  assert.equal(humanGateBoundary.can_close_replay_success_path, false);

  assert.equal(liveProgressSummary.surface_kind, 'opl_meta_agent_live_stage_run_progress_evidence_summary');
  assert.equal(liveProgressSummary.live_stage_run_progress_evidence_ref, 'contracts/live_stage_run_progress_evidence.json');
  assertRepoRefExists(liveProgressSummary.live_stage_run_progress_evidence_ref as string);
  assert.equal(
    liveProgressSummary.target_agent_owner_evidence_tail_closure_ref,
    'contracts/target_agent_owner_chain_evidence.json#/target_agent_owner_evidence_tail_closure',
  );
  assert.equal(liveProgressSummary.opl_consumption_status, 'not_ready_by_domain_owned_typed_blocker_refs');
  assert.deepEqual(
    asStrings(liveProgressSummary.typed_blocker_refs),
    asStrings(liveProgressRefs.typed_blocker_refs),
  );
  assert.deepEqual(
    asStrings(liveProgressSummary.human_gate_refs),
    asStrings(liveProgressRefs.human_gate_refs),
  );
  assert.equal(liveProgressSummary.open_tail_count, 5);
  assert.equal(liveProgressSummary.closed_success_count, 0);
  assert.equal(liveProgressSummary.target_agent_ready_claimed, false);
  assert.equal(liveProgressSummary.domain_ready_claimed, false);
  assert.equal(liveProgressSummary.production_ready_claimed, false);
  assert.equal(ownerTailClosure.surface_kind, 'opl_meta_agent_target_agent_owner_evidence_tail_closure');
  assert.equal(ownerTailClosure.owner, 'opl-meta-agent');
  assert.equal(ownerTailClosure.closure_kind, 'target_agent_owner_evidence_tail_typed_blocker_closure');
  assert.equal(ownerTailClosure.closure_status, 'blocked_by_domain_owned_typed_blocker_refs');
  assert.equal(ownerTailClosure.opl_consumption_status, liveProgressSummary.opl_consumption_status);
  assert.equal(ownerTailClosure.live_stage_run_progress_evidence_ref, liveProgressSummary.live_stage_run_progress_evidence_ref);
  assert.equal(
    ownerTailClosure.production_acceptance_summary_ref,
    'contracts/production_acceptance/meta-agent-production-acceptance.json#/target_agent_live_stage_progress_summary',
  );
  assert.equal(
    productionLiveProgressSummary.target_agent_owner_evidence_tail_closure_ref,
    liveProgressSummary.target_agent_owner_evidence_tail_closure_ref,
  );
  assert.equal(
    productionLiveProgressSummary.opl_consumption_status,
    liveProgressSummary.opl_consumption_status,
  );
  assert.equal(ownerTailClosure.closed_as_success, false);
  assert.equal(ownerTailClosure.success_claimed, false);
  assert.equal(ownerTailClosure.target_agent_ready_claimed, false);
  assert.equal(ownerTailClosure.domain_ready_claimed, false);
  assert.equal(ownerTailClosure.production_ready_claimed, false);
  assert.deepEqual(asStrings(ownerTailClosure.owner_receipt_refs), []);
  assert.equal(ownerTailClosure.success_receipt_count, 0);
  assert.equal(ownerTailClosure.open_tail_count, 5);
  assert.equal(ownerTailClosure.closed_success_count, 0);
  assert.deepEqual(
    asStrings(ownerTailClosure.typed_blocker_refs),
    liveProgressBlockers.map((blocker) => blocker.typed_blocker_ref as string),
  );
  assert.deepEqual(
    asObjects(ownerTailClosure.tail_closure_items).map((item) => item.tail_id),
    liveProgressBlockers.map((blocker) => blocker.tail_id),
  );
  asObjects(ownerTailClosure.tail_closure_items).forEach((item, index) => {
    const blocker = liveProgressBlockers[index];
    assert.equal(item.closure_status, 'blocked_by_domain_owned_typed_blocker_ref');
    assert.equal(item.typed_blocker_ref, blocker.typed_blocker_ref);
    assert.deepEqual(asStrings(item.next_owner_refs), asStrings(blocker.next_owner_refs));
    assert.deepEqual(
      asStrings(item.required_missing_evidence_refs),
      asStrings(blocker.required_missing_evidence_refs),
    );
  });
  assert.equal(ownerTailBoundary.refs_only, true);
  assert.equal(ownerTailBoundary.can_write_target_domain_truth, false);
  assert.equal(ownerTailBoundary.can_write_target_owner_receipt_body, false);
  assert.equal(ownerTailBoundary.can_claim_target_domain_ready, false);
  assert.equal(ownerTailBoundary.can_claim_domain_ready, false);
  assert.equal(ownerTailBoundary.can_claim_production_ready, false);
  assert.equal(ownerTailBoundary.can_promote_default_agent_without_gate, false);
  assertFalseAuthorityBoundary(evidence.authority_boundary as JsonObject, 'targetAgentOwnerChainEvidence');
});
