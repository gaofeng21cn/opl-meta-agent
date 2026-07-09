import assert from 'node:assert/strict';
import test from 'node:test';
import {
  asObjects,
  asStrings,
  readJson,
  assertContractRefExists,
  assertNoForbiddenAuthority,
  assertOptionalFalseFlags,
  assertRefsOnlyAuthorityBoundary,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';

const newAgentConsumptionEvidenceRef = 'contracts/production_acceptance/new_agent_consumption_evidence.json';

test('new-agent consumption evidence proves repeat scaffold consumption without readiness upgrade', () => {
  const acceptance = readJson('contracts/production_acceptance/meta-agent-production-acceptance.json');
  const evidence = readJson(newAgentConsumptionEvidenceRef);

  assert.equal(evidence.surface_kind, 'opl_meta_agent_new_agent_consumption_evidence');
  assert.equal(evidence.evidence_status, 'verified_new_agent_consumption_with_stage_pack_v2_conformance');
  assert.equal((evidence.target_agent as JsonObject).domain_id, 'publication-brief-agent');
  assert.equal((evidence.consumed_surfaces as JsonObject).build_agent_baseline_action, 'opl-meta-agent.build-agent-baseline');
  assert.equal((evidence.consumed_surfaces as JsonObject).generated_interface_status, 'ready');
  assert.equal((evidence.consumed_surfaces as JsonObject).structural_conformance_status, 'passed');
  assert.equal((evidence.consumed_surfaces as JsonObject).readiness_status, 'passed_with_production_evidence_tail');
  assert.equal((evidence.stage_pack_v2_consumption as JsonObject).status, 'passed');
  assert.equal((evidence.stage_pack_v2_consumption as JsonObject).executor_binding_ref, 'default_codex_cli');
  assert.deepEqual(asObjects((evidence.stage_pack_v2_consumption as JsonObject).blockers), []);

  const productionTail = evidence.production_evidence_tail as JsonObject;
  assert.equal(productionTail.status, 'open_tail_remains');
  assertOptionalFalseFlags(productionTail, 'productionTail');

  const fixtureRequirement = acceptance.generated_agent_fixture_requirement as JsonObject;
  assert.equal(fixtureRequirement.latest_new_agent_consumption_evidence_ref, newAgentConsumptionEvidenceRef);
  assert.equal(fixtureRequirement.current_scaffold_generator_drift_closed, true);
  assert.ok((fixtureRequirement.new_agent_consumption_repeat_cohort_count as number) >= 2);
  [
    'check-ref:generated-agent/progress-delta-policy-present',
    'check-ref:generated-agent/typed-blocker-lineage-policy-present',
    'check-ref:generated-agent/foundry-series-design-profile-present',
  ].forEach((checkRef) => {
    assert.ok(asStrings(fixtureRequirement.required_check_refs).includes(checkRef), checkRef);
  });

  const scaleout = evidence.repeat_consumption_scaleout as JsonObject;
  const cohorts = asObjects(scaleout.cohorts);
  const latestCohort = cohorts.at(-1) as JsonObject;
  assert.equal(scaleout.status, 'verified_repeat_new_agent_consumption_current_scaffold');
  assert.equal(scaleout.cohort_count, cohorts.length);
  assert.equal(scaleout.generator_drift_closed, true);
  assert.ok(asStrings(scaleout.closed_generator_drift_refs).includes('blocker:generated-target-stage-progress-delta-policy-missing'));
  assert.deepEqual(cohorts.map((cohort) => cohort.target_agent_id), [
    'publication-brief-agent',
    'handoff-analyst-agent',
  ]);
  assert.equal(latestCohort.readiness_status, 'passed_with_production_evidence_tail');
  assertOptionalFalseFlags(latestCohort, 'latestCohort');
  [
    'stage_pack_v2_conformance_passed',
    'progress_delta_policy_present',
    'typed_blocker_lineage_policy_present',
    'foundry_series_design_profile_present',
    'generated_interface_ready',
    'readiness_passed_with_production_evidence_tail',
  ].forEach((check) => {
    assert.ok(asStrings(scaleout.minimum_current_scaffold_consumption_checks).includes(check), check);
  });
  assertRefsOnlyAuthorityBoundary(scaleout.authority_boundary as JsonObject, 'repeatConsumptionScaleout.authority_boundary', [
    'can_claim_domain_ready',
    'can_claim_production_ready',
    'can_close_long_soak_gate',
    'can_promote_default_agent_without_gate',
    'can_write_opl_runtime_state',
  ]);

  const historicalFixtureLane = evidence.historical_fixture_proof_lane as JsonObject;
  assert.equal(historicalFixtureLane.status, 'historical_provenance_only');
  assert.equal(historicalFixtureLane.cannot_claim_current_public_entry, true);
  assert.equal(historicalFixtureLane.cannot_generate_default_stage_graph_without_closeout, true);
  assertNoForbiddenAuthority(evidence, 'newAgentConsumptionEvidence');
  assertRefsOnlyAuthorityBoundary(evidence.authority_boundary as JsonObject, 'newAgentConsumptionEvidence.authority_boundary', [
    'can_write_target_domain_truth',
    'can_write_target_domain_memory_body',
    'can_mutate_target_domain_artifact_body',
    'can_authorize_target_domain_quality_or_export',
    'can_promote_default_agent_without_gate',
    'can_claim_domain_ready',
    'can_claim_production_ready',
    'can_close_long_soak_gate',
    'can_write_opl_runtime_state',
  ]);
  assert.ok(asStrings(evidence.forbidden_claims).includes('new_agent_consumption_equals_long_soak_success'));
  asStrings(evidence.source_refs).forEach(assertContractRefExists);
});
