import assert from 'node:assert/strict';
import test from 'node:test';
import {
  asStrings,
  readJson,
  assertContractRefExists,
  assertNoForbiddenAuthority,
  assertNoActiveMorphologyForbiddenOwnerTokens,
  assertOptionalFalseFlags,
  assertRefsOnlyAuthorityBoundary,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';

const productionAcceptanceRef = 'contracts/production_acceptance/meta-agent-production-acceptance.json';
const newAgentConsumptionEvidenceRef = 'contracts/production_acceptance/new_agent_consumption_evidence.json';
const liveProgressEvidenceRef = 'contracts/live_stage_run_progress_evidence.json';
const ownerTailClosureRef = 'contracts/target_agent_owner_chain_evidence.json#/target_agent_owner_evidence_tail_closure';
const productionLongSoakBlockerRef = 'typed_blocker_ref://opl-meta-agent/production-consumption/long-soak-pending';
const scriptToPackGateRef = 'script-to-pack-gate-receipt:opl-meta-agent/current-script-morphology-policy';

function assertSummaryMatchesLiveProgress(
  summary: JsonObject,
  liveProgress: JsonObject,
  label: string,
): void {
  const liveProgressRefs = liveProgress.refs as JsonObject;
  assert.equal(summary.live_stage_run_progress_evidence_ref, liveProgressEvidenceRef, `${label}.live_stage_run_progress_evidence_ref`);
  assert.equal(summary.target_agent_owner_evidence_tail_closure_ref, ownerTailClosureRef);
  assert.equal(summary.opl_consumption_status, liveProgress.opl_consumption_status, `${label}.opl_consumption_status`);
  assert.deepEqual(asStrings(summary.typed_blocker_refs), asStrings(liveProgressRefs.typed_blocker_refs), `${label}.typed_blocker_refs`);
  assert.deepEqual(asStrings(summary.human_gate_refs), asStrings(liveProgressRefs.human_gate_refs), `${label}.human_gate_refs`);
  assert.deepEqual(asStrings(summary.script_to_pack_gate_receipt_refs), [scriptToPackGateRef]);
  assert.deepEqual(asStrings(summary.owner_receipt_refs), []);
  assertOptionalFalseFlags(summary, label);
  assertRefsOnlyAuthorityBoundary(summary.authority_boundary as JsonObject, `${label}.authority_boundary`);
}

test('production acceptance records refs-only consumption without production-ready authority', () => {
  const acceptance = readJson(productionAcceptanceRef);
  const newAgentConsumption = readJson(newAgentConsumptionEvidenceRef);
  const liveProgress = readJson(liveProgressEvidenceRef);

  assert.equal(acceptance.surface_kind, 'opl_meta_agent_production_acceptance_evidence');
  assert.equal(acceptance.domain_id, 'opl-meta-agent');
  assert.equal(acceptance.evidence_status, 'closed_by_domain_owned_acceptance_receipt');
  assert.equal(acceptance.evidence_tail_status, 'closed_by_domain_owned_acceptance_receipt');
  assert.equal(acceptance.doc_ref, 'docs/status.md');
  assert.ok(asStrings(acceptance.next_verification_command_refs).includes('cmd:rtk npm test'));
  assert.ok(asStrings(acceptance.next_verification_command_refs).includes('cmd:rtk npm run typecheck'));
  assert.ok(asStrings((acceptance.refs as JsonObject).acceptance_receipt_refs).includes(acceptance.receipt_ref as string));
  assert.deepEqual(asStrings((acceptance.refs as JsonObject).active_typed_blocker_refs), []);
  assert.ok(asStrings((acceptance.refs as JsonObject).historical_typed_blocker_refs).includes(productionLongSoakBlockerRef));
  assert.deepEqual(asStrings((acceptance.refs as JsonObject).new_agent_consumption_evidence_refs), [newAgentConsumptionEvidenceRef]);
  assert.deepEqual(asStrings((acceptance.refs as JsonObject).target_agent_live_stage_progress_evidence_refs), [
    liveProgressEvidenceRef,
  ]);

  const stageReplayBlocker = acceptance.stage_replay_human_gate_blocker_summary as JsonObject;
  assert.equal(stageReplayBlocker.closure_status, 'closed_as_typed_blocker_not_success');
  assert.equal(stageReplayBlocker.success_receipt_count, 0);
  assert.deepEqual(asStrings(stageReplayBlocker.owner_receipt_refs), []);
  assert.ok(asStrings(stageReplayBlocker.typed_blocker_refs).length > 0);
  assertContractRefExists(stageReplayBlocker.owner_chain_closure_ref as string);
  assertContractRefExists(stageReplayBlocker.source_ref as string);
  assertOptionalFalseFlags(stageReplayBlocker, 'stageReplayBlocker');
  assertRefsOnlyAuthorityBoundary(stageReplayBlocker.authority_boundary as JsonObject, 'stageReplayBlocker.authority_boundary', [
    'can_requery_human',
    'can_write_owner_receipt',
    'can_write_target_domain_truth',
    'can_write_target_domain_memory_body',
    'can_mutate_target_domain_artifact_body',
    'can_authorize_target_domain_quality_or_export',
    'can_promote_default_agent_without_gate',
    'can_close_replay_success_path',
  ]);

  const liveProgressSummary = acceptance.target_agent_live_stage_progress_summary as JsonObject;
  assertSummaryMatchesLiveProgress(liveProgressSummary, liveProgress, 'liveProgressSummary');
  assertContractRefExists(liveProgressSummary.live_stage_run_progress_evidence_ref as string);
  assertContractRefExists(liveProgressSummary.target_agent_owner_evidence_tail_closure_ref as string);

  const followthrough = acceptance.production_consumption_followthrough as JsonObject;
  assert.equal(followthrough.status, 'production_consumption_refs_projected');
  assert.equal(followthrough.production_consumption_ready, true);
  assert.equal(
    followthrough.production_consumption_ready_semantics,
    'refs_only_current_cohort_consumption_gate_ready_not_production_readiness_verdict',
  );
  assert.equal(followthrough.production_readiness_verdict_claimed, false);
  assert.equal(followthrough.long_soak_claimed, false);
  assert.deepEqual(asStrings(followthrough.active_typed_blocker_refs), []);
  assert.ok(asStrings(followthrough.long_soak_refs)[0].startsWith('long_soak_ref://opl-meta-agent/'));
  assert.ok(asStrings(followthrough.historical_typed_blocker_refs).includes(productionLongSoakBlockerRef));
  assertContractRefExists(followthrough.historical_typed_blocker_artifact_ref as string);
  assertRefsOnlyAuthorityBoundary(followthrough.authority_boundary as JsonObject, 'productionConsumptionFollowthrough.authority_boundary', [
    'can_claim_domain_ready',
    'can_claim_production_ready',
    'can_close_long_soak_gate',
    'can_write_opl_runtime_state',
    'can_promote_default_agent_without_gate',
  ]);

  const productionConsumptionBlocker = readJson(followthrough.historical_typed_blocker_artifact_ref as string);
  assert.equal(productionConsumptionBlocker.typed_blocker_ref, productionLongSoakBlockerRef);
  assert.equal(productionConsumptionBlocker.blocker_status, 'historical_provenance');
  assert.equal(productionConsumptionBlocker.active_blocker, false);
  assert.equal(productionConsumptionBlocker.historical_typed_blocker, true);
  assert.equal(productionConsumptionBlocker.production_readiness_verdict_claimed, false);
  assert.equal(productionConsumptionBlocker.long_soak_claimed, false);
  assertNoForbiddenAuthority(productionConsumptionBlocker, 'productionConsumptionBlocker');

  assert.equal(acceptance.role, 'refs_only_target_agent_takeover_improve_loop_acceptance');
  assert.ok(asStrings(acceptance.acceptance_scope).includes('production_live_soak_not_claimed_by_conformance'));
  assert.ok(asStrings(acceptance.acceptance_scope).includes('domain_ready_not_claimed_by_conformance'));
  assert.equal((acceptance.conformance_state as JsonObject).not_domain_ready_authority_source, true);
  assert.equal((acceptance.conformance_state as JsonObject).not_production_soak_authority_source, true);
  assert.equal(Object.hasOwn(acceptance, 'external_agent_acceptance_chain'), false);
  assert.doesNotMatch(
    JSON.stringify(acceptance),
    /external_agent_acceptance_chain|external_agent_takeover|external-agent-takeover|takeover-external-agent-test/,
  );

  const acceptanceChain = acceptance.target_agent_acceptance_chain as JsonObject;
  assert.equal(acceptanceChain.chain_status, 'receipt_chain_present');
  assert.deepEqual(asStrings(acceptanceChain.new_agent_consumption_evidence_refs), [newAgentConsumptionEvidenceRef]);
  assert.deepEqual(asStrings(acceptanceChain.active_typed_blocker_refs), []);
  assert.ok(asStrings(acceptanceChain.historical_typed_blocker_refs).includes(productionLongSoakBlockerRef));

  const fixtureRequirement = acceptance.generated_agent_fixture_requirement as JsonObject;
  assert.equal(fixtureRequirement.latest_new_agent_consumption_evidence_ref, newAgentConsumptionEvidenceRef);
  assert.equal(fixtureRequirement.current_scaffold_generator_drift_closed, true);
  assert.ok((fixtureRequirement.new_agent_consumption_repeat_cohort_count as number) >= 2);
  [
    'check-ref:generated-agent/stage-pack-v2-conformance-passed',
    'check-ref:generated-agent/default-codex-cli-binding-present',
    'check-ref:generated-agent/independent-gate-file-ref-present',
    'check-ref:generated-agent/no-target-domain-truth-write',
  ].forEach((checkRef) => {
    assert.ok(asStrings(fixtureRequirement.required_check_refs).includes(checkRef), checkRef);
  });

  assertNoActiveMorphologyForbiddenOwnerTokens(acceptance, 'productionAcceptance');
  assertNoForbiddenAuthority(acceptance, 'productionAcceptance');
  assert.equal((acceptance.authority_boundary as JsonObject).target_domain_authority_writes_forbidden, true);

  [
    ...asStrings((acceptance.conformance_state as JsonObject).conformance_refs),
    ...asStrings(acceptanceChain.intake_refs),
    ...asStrings(acceptanceChain.test_handoff_refs),
    ...asStrings(acceptanceChain.proposal_materializer_refs),
    ...asStrings(acceptanceChain.review_audit_receipt_refs),
    ...asStrings((acceptance.acceptance_receipt as JsonObject).source_refs),
    ...asStrings(fixtureRequirement.verified_by_refs),
    ...asStrings(newAgentConsumption.source_refs),
    liveProgressSummary.live_stage_run_progress_evidence_ref as string,
    fixtureRequirement.latest_new_agent_consumption_evidence_ref as string,
    acceptance.doc_ref as string,
    ...asStrings((acceptance.refs as JsonObject).doc_refs),
  ].forEach(assertContractRefExists);
});
