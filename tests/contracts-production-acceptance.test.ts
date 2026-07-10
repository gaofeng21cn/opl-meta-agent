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
import { assertEveryFlagFalse, asBooleanRecord } from './support/source-purity.ts';

const productionAcceptanceRef = 'contracts/production_acceptance/meta-agent-production-acceptance.json';
const newAgentConsumptionEvidenceRef = 'contracts/production_acceptance/new_agent_consumption_evidence.json';
const liveProgressEvidenceRef = 'contracts/live_stage_run_progress_evidence.json';
const productionLongSoakBlockerRef = 'typed_blocker_ref://opl-meta-agent/production-consumption/long-soak-pending';

test('production acceptance records refs-only consumption without production-ready authority', () => {
  const acceptance = readJson(productionAcceptanceRef);
  const liveProgress = readJson(liveProgressEvidenceRef);

  assert.equal(acceptance.surface_kind, 'opl_meta_agent_production_acceptance_evidence');
  assert.equal(acceptance.domain_id, 'opl-meta-agent');
  assert.equal(acceptance.evidence_status, 'closed_by_domain_owned_acceptance_receipt');
  assert.equal(acceptance.evidence_tail_status, 'closed_by_domain_owned_acceptance_receipt');
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
  const replayBoundary = asBooleanRecord(stageReplayBlocker.authority_boundary);
  assert.equal(replayBoundary.refs_only, true);
  assertEveryFlagFalse(replayBoundary, 'stageReplayBlocker.authority_boundary', (field) => field !== 'refs_only');

  const liveProgressSummary = acceptance.target_agent_live_stage_progress_summary as JsonObject;
  assert.equal(liveProgressSummary.live_stage_run_progress_evidence_ref, liveProgressEvidenceRef);
  assert.equal(liveProgressSummary.opl_consumption_status, liveProgress.opl_consumption_status);
  assertOptionalFalseFlags(liveProgressSummary, 'liveProgressSummary');
  assertRefsOnlyAuthorityBoundary(liveProgressSummary.authority_boundary as JsonObject, 'liveProgressSummary.authority_boundary');
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
  const followthroughBoundary = asBooleanRecord(followthrough.authority_boundary);
  assert.equal(followthroughBoundary.refs_only, true);
  assertEveryFlagFalse(followthroughBoundary, 'productionConsumptionFollowthrough.authority_boundary', (field) => field !== 'refs_only');

  const productionConsumptionBlocker = readJson(followthrough.historical_typed_blocker_artifact_ref as string);
  assert.equal(productionConsumptionBlocker.typed_blocker_ref, productionLongSoakBlockerRef);
  assert.equal(productionConsumptionBlocker.active_blocker, false);
  assertNoForbiddenAuthority(productionConsumptionBlocker, 'productionConsumptionBlocker');

  assert.equal(Object.hasOwn(acceptance, 'external_agent_acceptance_chain'), false);
  assert.doesNotMatch(
    JSON.stringify(acceptance),
    /external_agent_acceptance_chain|external_agent_takeover|external-agent-takeover|takeover-external-agent-test/,
  );

  assertNoActiveMorphologyForbiddenOwnerTokens(acceptance, 'productionAcceptance');
  assertNoForbiddenAuthority(acceptance, 'productionAcceptance');
  assert.equal((acceptance.authority_boundary as JsonObject).target_domain_authority_writes_forbidden, true);

  [
    ...asStrings((acceptance.conformance_state as JsonObject).conformance_refs),
    ...asStrings((acceptance.acceptance_receipt as JsonObject).source_refs),
    liveProgressSummary.live_stage_run_progress_evidence_ref as string,
    acceptance.doc_ref as string,
    ...asStrings((acceptance.refs as JsonObject).doc_refs),
  ].forEach(assertContractRefExists);
});
