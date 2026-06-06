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
  const newAgentConsumption = readJson('contracts/production_acceptance/new_agent_consumption_evidence.json');

  assert.equal(acceptance.surface_kind, 'opl_meta_agent_production_acceptance_evidence');
  assert.equal(acceptance.domain_id, 'opl-meta-agent');
  assert.equal(acceptance.evidence_status, 'closed_by_domain_owned_acceptance_receipt');
  assert.equal(acceptance.evidence_tail_status, 'closed_by_domain_owned_acceptance_receipt');
  assert.equal(
    acceptance.receipt_ref,
    'production-acceptance-receipt:opl-meta-agent/external-agent-takeover-improve-loop/2026-05-19',
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
  assert.deepEqual(acceptance.refs.new_agent_consumption_evidence_refs, [
    'contracts/production_acceptance/new_agent_consumption_evidence.json',
  ]);
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
  assert.equal(acceptance.role, 'refs_only_external_agent_takeover_improve_loop_acceptance');
  assert.ok(acceptance.acceptance_scope.includes('production_live_soak_not_claimed_by_conformance'));
  assert.ok(acceptance.acceptance_scope.includes('domain_ready_not_claimed_by_conformance'));
  assert.equal(acceptance.conformance_state.structural_conformance, 'passed');
  assert.equal(acceptance.conformance_state.physical_source_morphology, 'passed');
  assert.equal(acceptance.conformance_state.not_domain_ready_authority_source, true);
  assert.equal(acceptance.conformance_state.not_production_soak_authority_source, true);
  assert.equal(acceptance.external_agent_acceptance_chain.chain_status, 'receipt_chain_present');
  assert.ok(acceptance.external_agent_acceptance_chain.intake_refs.length > 0);
  assert.ok(acceptance.external_agent_acceptance_chain.test_handoff_refs.length > 0);
  assert.ok(acceptance.external_agent_acceptance_chain.proposal_materializer_refs.length > 0);
  assert.ok(acceptance.external_agent_acceptance_chain.review_audit_receipt_refs.length > 0);
  assert.deepEqual(acceptance.external_agent_acceptance_chain.new_agent_consumption_evidence_refs, [
    'contracts/production_acceptance/new_agent_consumption_evidence.json',
  ]);
  assert.deepEqual(acceptance.external_agent_acceptance_chain.active_typed_blocker_refs, []);
  assert.ok(
    asStrings(acceptance.external_agent_acceptance_chain.historical_typed_blocker_refs)
      .includes('typed_blocker_ref://opl-meta-agent/production-consumption/long-soak-pending'),
  );
  assert.equal(
    acceptance.acceptance_receipt.receipt_class,
    'external_agent_takeover_improve_loop_acceptance_receipt',
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
    'contracts/production_acceptance/new_agent_consumption_evidence.json',
  );
  assert.ok(
    acceptance.generated_agent_fixture_requirement.required_check_refs.includes(
      'check-ref:generated-agent/no-target-domain-truth-write',
    ),
  );
  assert.equal(newAgentConsumption.surface_kind, 'opl_meta_agent_new_agent_consumption_evidence');
  assert.equal(newAgentConsumption.evidence_status, 'verified_new_agent_consumption_with_stage_pack_v2_conformance');
  assert.equal(newAgentConsumption.target_agent.domain_id, 'publication-brief-agent');
  assert.equal(newAgentConsumption.consumed_surfaces.build_agent_baseline_action, 'opl-meta-agent.build-agent-baseline');
  assert.equal(newAgentConsumption.consumed_surfaces.generated_interface_status, 'ready');
  assert.equal(newAgentConsumption.consumed_surfaces.structural_conformance_status, 'passed');
  assert.equal(newAgentConsumption.consumed_surfaces.readiness_status, 'passed_with_production_evidence_tail');
  assert.equal(newAgentConsumption.stage_pack_v2_consumption.status, 'passed');
  assert.equal(newAgentConsumption.stage_pack_v2_consumption.plane_version, 'standard-stage-pack.v2');
  assert.equal(newAgentConsumption.stage_pack_v2_consumption.executor_binding_ref, 'default_codex_cli');
  assert.equal(
    newAgentConsumption.stage_pack_v2_consumption.independent_gate_ref,
    'agent/quality_gates/agent-output-draft-quality-gate.md',
  );
  assert.deepEqual(newAgentConsumption.stage_pack_v2_consumption.blockers, []);
  assert.equal(newAgentConsumption.ai_reviewer_evaluation.no_shared_context, true);
  assert.equal(newAgentConsumption.ai_reviewer_evaluation.independent_attempt, true);
  assert.equal(
    newAgentConsumption.ai_reviewer_evaluation.verdict,
    'baseline_ready_with_owner_gate',
  );
  assert.equal(
    newAgentConsumption.production_evidence_tail.status,
    'open_tail_remains',
  );
  assert.equal(newAgentConsumption.production_evidence_tail.production_ready_claimed, false);
  assert.equal(newAgentConsumption.production_evidence_tail.domain_ready_claimed, false);
  assert.equal(newAgentConsumption.production_evidence_tail.default_promotion_claimed, false);
  assert.equal(newAgentConsumption.production_evidence_tail.long_soak_claimed, false);
  assert.equal(newAgentConsumption.historical_fixture_proof_lane.status, 'historical_provenance_only');
  assert.equal(newAgentConsumption.historical_fixture_proof_lane.used_fixture_runner, true);
  assert.equal(newAgentConsumption.historical_fixture_proof_lane.explicit_closeout_path_required_now, true);
  assert.equal(newAgentConsumption.historical_fixture_proof_lane.implicit_fixture_graph_retired, true);
  assert.equal(newAgentConsumption.historical_fixture_proof_lane.cannot_claim_current_public_entry, true);
  assert.equal(newAgentConsumption.historical_fixture_proof_lane.cannot_generate_default_stage_graph_without_closeout, true);
  assertNoForbiddenAuthority(newAgentConsumption, 'newAgentConsumption');
  assert.equal(newAgentConsumption.authority_boundary.can_claim_domain_ready, false);
  assert.equal(newAgentConsumption.authority_boundary.can_claim_production_ready, false);
  assert.equal(newAgentConsumption.authority_boundary.can_close_long_soak_gate, false);
  assert.ok(
    asStrings(newAgentConsumption.forbidden_claims)
      .includes('new_agent_consumption_equals_long_soak_success'),
  );
  assertNoForbiddenAuthority(acceptance, 'productionAcceptance');
  assert.equal(acceptance.authority_boundary.target_domain_authority_writes_forbidden, true);

  [
    ...asStrings(acceptance.conformance_state.conformance_refs),
    ...asStrings(acceptance.external_agent_acceptance_chain.intake_refs),
    ...asStrings(acceptance.external_agent_acceptance_chain.test_handoff_refs),
    ...asStrings(acceptance.external_agent_acceptance_chain.proposal_materializer_refs),
    ...asStrings(acceptance.external_agent_acceptance_chain.review_audit_receipt_refs),
    ...asStrings(acceptance.acceptance_receipt.source_refs),
    ...asStrings(acceptance.generated_agent_fixture_requirement.verified_by_refs),
    ...asStrings(newAgentConsumption.source_refs),
    acceptance.generated_agent_fixture_requirement.latest_new_agent_consumption_evidence_ref,
    acceptance.doc_ref,
    ...asStrings(acceptance.refs.doc_refs),
  ].forEach(assertRepoRefExists);
});
