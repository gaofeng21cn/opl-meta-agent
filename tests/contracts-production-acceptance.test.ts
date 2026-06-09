import test from 'node:test';
import {
  assert,
  asStrings,
  readJson,
  assertRepoRefExists,
  assertNoForbiddenAuthority,
  assertNoActiveMorphologyForbiddenOwnerTokens,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';

test('production acceptance evidence closes conformance evidence tail through refs-only acceptance receipt', () => {
  const acceptance = readJson('contracts/production_acceptance/meta-agent-production-acceptance.json');
  const newAgentConsumptionEvidenceRef = 'contracts/production_acceptance/new_agent_consumption_evidence.json';
  const newAgentConsumption = readJson(newAgentConsumptionEvidenceRef);

  assert.equal(acceptance.surface_kind, 'opl_meta_agent_production_acceptance_evidence');
  assert.equal(acceptance.domain_id, 'opl-meta-agent');
  assert.equal(acceptance.evidence_status, 'closed_by_domain_owned_acceptance_receipt');
  assert.equal(acceptance.evidence_tail_status, 'closed_by_domain_owned_acceptance_receipt');
  assert.equal(
    acceptance.receipt_ref,
    'production-acceptance-receipt:opl-meta-agent/target-agent-takeover-improve-loop/2026-05-19',
  );
  assert.equal(acceptance.doc_ref, 'docs/status.md');
  assert.ok(acceptance.next_verification_command_refs.includes('cmd:rtk npm test'));
  assert.ok(acceptance.next_verification_command_refs.includes('cmd:rtk npm run typecheck'));
  assert.ok(acceptance.refs.acceptance_receipt_refs.includes(acceptance.receipt_ref));
  assert.ok(acceptance.refs.doc_refs.includes('docs/status.md'));
  assert.ok(acceptance.refs.next_verification_command_refs.includes('cmd:rtk git diff --check'));
  assert.deepEqual(acceptance.refs.active_typed_blocker_refs, []);
  assert.ok(
    asStrings(acceptance.refs.historical_typed_blocker_refs)
      .includes('typed_blocker_ref://opl-meta-agent/production-consumption/long-soak-pending'),
  );
  assert.equal(asStrings(acceptance.refs.long_soak_refs).length, 1);
  assert.ok(asStrings(acceptance.refs.long_soak_refs)[0].startsWith('long_soak_ref://opl-meta-agent/'));
  assert.equal(asStrings(acceptance.refs.production_consumption_receipt_refs).length, 2);
  assert.deepEqual(acceptance.refs.new_agent_consumption_evidence_refs, [newAgentConsumptionEvidenceRef]);
  const stageReplayBlocker = acceptance.stage_replay_human_gate_blocker_summary as JsonObject;
  const stageReplayTarget = stageReplayBlocker.target_identity as JsonObject;
  const stageReplayBoundary = stageReplayBlocker.authority_boundary as JsonObject;
  assert.equal(
    stageReplayBlocker.surface_kind,
    'opl_meta_agent_stage_replay_human_gate_blocker_summary',
  );
  assert.equal(stageReplayBlocker.owner, 'opl-meta-agent');
  assert.equal(
    stageReplayBlocker.role,
    'domain_owned_body_free_typed_blocker_for_stage_replay_missing_receipt',
  );
  assert.equal(stageReplayTarget.domain_id, 'opl-meta-agent');
  assert.equal(stageReplayTarget.stage_id, 'stage-decomposition');
  assert.equal(stageReplayTarget.missing_ref, 'human_gate:oma_baseline_owner_review');
  assert.equal(stageReplayBlocker.missing_ref_kind, 'human_gate_ref');
  assert.equal(stageReplayBlocker.payload_path, 'typed_blocker_path');
  assert.deepEqual(asStrings(stageReplayBlocker.typed_blocker_refs), [
    'oma-typed-blocker:stage-replay-human-gate:stage-decomposition:oma_baseline_owner_review/baseline-owner-review-receipt-pending',
  ]);
  assert.equal(
    stageReplayBlocker.owner_chain_closure_ref,
    'contracts/target_agent_owner_chain_evidence.json#/stage_replay_human_gate_blocker_closure',
  );
  assertRepoRefExists((stageReplayBlocker.owner_chain_closure_ref as string).split('#')[0]);
  assert.equal(
    stageReplayBlocker.stage_replay_missing_receipt_ref,
    'opl://stage-replay-missing-receipt/opl-meta-agent%2Fstage-decomposition%2Fhuman_gate%3Aoma_baseline_owner_review',
  );
  assert.equal(stageReplayBlocker.closure_status, 'closed_as_typed_blocker_not_success');
  assert.equal(stageReplayBlocker.success_receipt_count, 0);
  assert.deepEqual(asStrings(stageReplayBlocker.owner_receipt_refs), []);
  assert.deepEqual(asStrings(stageReplayBlocker.no_regression_refs), [
    'no-regression-ref:opl-meta-agent/stage-replay-human-gate/oma_baseline_owner_review/no-target-repo-mutation',
  ]);
  assert.equal(stageReplayBlocker.success_claimed, false);
  assert.equal(stageReplayBlocker.human_gate_approval_claimed, false);
  assert.equal(stageReplayBlocker.domain_ready_claimed, false);
  assert.equal(stageReplayBlocker.production_ready_claimed, false);
  assert.equal(stageReplayBoundary.refs_only, true);
  assert.equal(stageReplayBoundary.can_requery_human, false);
  assert.equal(stageReplayBoundary.can_write_owner_receipt, false);
  assert.equal(stageReplayBoundary.can_write_target_domain_truth, false);
  assert.equal(stageReplayBoundary.can_write_target_domain_memory_body, false);
  assert.equal(stageReplayBoundary.can_mutate_target_domain_artifact_body, false);
  assert.equal(stageReplayBoundary.can_authorize_target_domain_quality_or_export, false);
  assert.equal(stageReplayBoundary.can_promote_default_agent_without_gate, false);
  assert.equal(stageReplayBoundary.can_close_replay_success_path, false);
  assertRepoRefExists((stageReplayBlocker.source_ref as string).split('#')[0]);
  assert.equal(
    acceptance.production_consumption_followthrough.status,
    'production_consumption_refs_projected',
  );
  assert.equal(acceptance.production_consumption_followthrough.production_consumption_ready, true);
  assert.equal(
    acceptance.production_consumption_followthrough.production_consumption_ready_semantics,
    'refs_only_current_cohort_consumption_gate_ready_not_production_readiness_verdict',
  );
  assert.equal(
    acceptance.production_consumption_followthrough.current_cohort_refs_only_consumption_ready,
    true,
  );
  assert.equal(
    acceptance.production_consumption_followthrough.production_readiness_verdict_claimed,
    false,
  );
  assert.equal(acceptance.production_consumption_followthrough.open_gate_count, 0);
  assert.equal(acceptance.production_consumption_followthrough.gate_count, 4);
  assert.equal(acceptance.production_consumption_followthrough.long_soak_claimed, false);
  assert.equal(acceptance.production_consumption_followthrough.verified_receipt_ref_count, 2);
  assert.equal(acceptance.production_consumption_followthrough.long_soak_ref_count, 1);
  assert.equal(acceptance.production_consumption_followthrough.active_typed_blocker_ref_count, 0);
  assert.equal(acceptance.production_consumption_followthrough.historical_typed_blocker_ref_count, 1);
  assert.deepEqual(acceptance.production_consumption_followthrough.active_typed_blocker_refs, []);
  assert.ok(
    asStrings(acceptance.production_consumption_followthrough.long_soak_refs)[0]
      .startsWith('long_soak_ref://opl-meta-agent/'),
  );
  assertRepoRefExists(acceptance.production_consumption_followthrough.historical_typed_blocker_artifact_ref);
  assert.ok(
    asStrings(acceptance.production_consumption_followthrough.future_cohort_required_evidence_refs)
      .includes('repeat_long_soak_receipt_ref'),
  );
  assert.equal(
    acceptance.production_consumption_followthrough.authority_boundary.can_claim_domain_ready,
    false,
  );
  assert.equal(
    acceptance.production_consumption_followthrough.authority_boundary.can_claim_production_ready,
    false,
  );
  assert.equal(
    acceptance.production_consumption_followthrough.authority_boundary.can_close_long_soak_gate,
    false,
  );
  const productionConsumptionBlocker = readJson(
    acceptance.production_consumption_followthrough.historical_typed_blocker_artifact_ref as string,
  );
  assert.equal(
    productionConsumptionBlocker.typed_blocker_ref,
    'typed_blocker_ref://opl-meta-agent/production-consumption/long-soak-pending',
  );
  assert.equal(productionConsumptionBlocker.blocker_status, 'historical_provenance');
  assert.equal(productionConsumptionBlocker.superseded_by_status, 'production_consumption_refs_projected');
  assert.equal(productionConsumptionBlocker.blocked_gate, 'long_soak_refs');
  assert.equal(productionConsumptionBlocker.production_consumption_ready, true);
  assert.equal(
    productionConsumptionBlocker.production_consumption_ready_semantics,
    'refs_only_current_cohort_consumption_gate_ready_not_production_readiness_verdict',
  );
  assert.equal(productionConsumptionBlocker.current_cohort_refs_only_consumption_ready, true);
  assert.equal(productionConsumptionBlocker.production_readiness_verdict_claimed, false);
  assert.equal(productionConsumptionBlocker.open_gate_count, 0);
  assert.equal(productionConsumptionBlocker.long_soak_claimed, false);
  assert.equal(productionConsumptionBlocker.active_blocker, false);
  assert.equal(productionConsumptionBlocker.historical_typed_blocker, true);
  assert.equal(asStrings(productionConsumptionBlocker.superseded_by_long_soak_refs).length, 1);
  assert.deepEqual(productionConsumptionBlocker.accepted_resolution_paths, [
    'real_long_soak_refs',
    'operator_long_soak_refs',
    'production_soak_refs',
    'agent_lab_rerun_long_soak_refs',
  ]);
  assertNoForbiddenAuthority(productionConsumptionBlocker, 'productionConsumptionBlocker');
  assert.equal(productionConsumptionBlocker.authority_boundary.can_claim_production_ready, false);
  assert.equal(acceptance.role, 'refs_only_target_agent_takeover_improve_loop_acceptance');
  assert.ok(acceptance.acceptance_scope.includes('production_live_soak_not_claimed_by_conformance'));
  assert.ok(acceptance.acceptance_scope.includes('domain_ready_not_claimed_by_conformance'));
  assert.equal(acceptance.conformance_state.structural_conformance, 'passed');
  assert.equal(acceptance.conformance_state.physical_source_morphology, 'passed');
  assert.equal(acceptance.conformance_state.not_domain_ready_authority_source, true);
  assert.equal(acceptance.conformance_state.not_production_soak_authority_source, true);
  assert.equal(Object.hasOwn(acceptance, 'external_agent_acceptance_chain'), false);
  assert.doesNotMatch(
    JSON.stringify(acceptance),
    /external_agent_acceptance_chain|external_agent_takeover|external-agent-takeover|takeover-external-agent-test/,
  );
  assert.equal(acceptance.target_agent_acceptance_chain.chain_status, 'receipt_chain_present');
  assert.ok(acceptance.target_agent_acceptance_chain.intake_refs.length > 0);
  assert.ok(acceptance.target_agent_acceptance_chain.test_handoff_refs.length > 0);
  assert.ok(acceptance.target_agent_acceptance_chain.proposal_materializer_refs.length > 0);
  assert.ok(acceptance.target_agent_acceptance_chain.review_audit_receipt_refs.length > 0);
  assert.deepEqual(
    acceptance.target_agent_acceptance_chain.new_agent_consumption_evidence_refs,
    [newAgentConsumptionEvidenceRef],
  );
  assert.deepEqual(acceptance.target_agent_acceptance_chain.active_typed_blocker_refs, []);
  assert.ok(
    asStrings(acceptance.target_agent_acceptance_chain.historical_typed_blocker_refs)
      .includes('typed_blocker_ref://opl-meta-agent/production-consumption/long-soak-pending'),
  );
  assert.equal(
    acceptance.acceptance_receipt.receipt_class,
    'target_agent_takeover_improve_loop_acceptance_receipt',
  );
  assert.deepEqual(acceptance.purpose_first_owner_delta_gate.delegated_surface_owners, {
    agent_lab_runner_delegated_to: 'one-person-lab',
    promotion_gate_delegated_to: 'one-person-lab',
    registry_delegated_to: 'one-person-lab',
    app_shell_delegated_to: 'one-person-lab-app via OPL/App contracts',
    target_worktree_lifecycle_delegated_to: 'one-person-lab work-order execute primitive',
    target_owner_closeout_delegated_to: 'target-domain via OPL',
  });
  assertNoActiveMorphologyForbiddenOwnerTokens(acceptance, 'productionAcceptance');
  assert.equal(acceptance.promotion_gate.promotion_status, 'gated');
  assert.ok(acceptance.promotion_gate.required_next_verification_command_refs.includes('cmd:rtk npm test'));
  assert.ok(acceptance.promotion_gate.required_next_verification_command_refs.includes('cmd:rtk npm run typecheck'));
  assert.ok(
    acceptance.generated_agent_fixture_requirement.required_check_refs.includes(
      'check-ref:generated-agent/stage-pack-v2-conformance-passed',
    ),
  );
  assert.ok(
    acceptance.generated_agent_fixture_requirement.required_check_refs.includes(
      'check-ref:generated-agent/default-codex-cli-binding-present',
    ),
  );
  assert.ok(
    acceptance.generated_agent_fixture_requirement.required_check_refs.includes(
      'check-ref:generated-agent/independent-gate-file-ref-present',
    ),
  );
  assert.equal(
    acceptance.generated_agent_fixture_requirement.latest_new_agent_consumption_evidence_ref,
    newAgentConsumptionEvidenceRef,
  );
  assert.ok(
    acceptance.generated_agent_fixture_requirement.required_check_refs.includes(
      'check-ref:generated-agent/no-target-domain-truth-write',
    ),
  );
  assertNoForbiddenAuthority(acceptance, 'productionAcceptance');
  assert.equal(acceptance.authority_boundary.target_domain_authority_writes_forbidden, true);

  [
    ...asStrings(acceptance.conformance_state.conformance_refs),
    ...asStrings(acceptance.target_agent_acceptance_chain.intake_refs),
    ...asStrings(acceptance.target_agent_acceptance_chain.test_handoff_refs),
    ...asStrings(acceptance.target_agent_acceptance_chain.proposal_materializer_refs),
    ...asStrings(acceptance.target_agent_acceptance_chain.review_audit_receipt_refs),
    ...asStrings(acceptance.acceptance_receipt.source_refs),
    ...asStrings(acceptance.generated_agent_fixture_requirement.verified_by_refs),
    ...asStrings(newAgentConsumption.source_refs),
    acceptance.generated_agent_fixture_requirement.latest_new_agent_consumption_evidence_ref,
    acceptance.doc_ref,
    ...asStrings(acceptance.refs.doc_refs),
  ].forEach(assertRepoRefExists);
});
