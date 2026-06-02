import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { JsonObject } from '../scripts/lib/domain-pack.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(relativePath: string): JsonObject {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function asObjects(value: unknown): JsonObject[] {
  return value as JsonObject[];
}

function asStrings(value: unknown): string[] {
  return value as string[];
}

test('new-agent consumption evidence records repeat current-scaffold cohorts without readiness upgrade', () => {
  const acceptance = readJson('contracts/production_acceptance/meta-agent-production-acceptance.json');
  const evidence = readJson('contracts/production_acceptance/new_agent_consumption_evidence.json');

  assert.equal(acceptance.generated_agent_fixture_requirement.new_agent_consumption_repeat_cohort_count, 2);
  assert.equal(
    acceptance.generated_agent_fixture_requirement.latest_new_agent_consumption_cohort_ref,
    'new-agent-consumption:opl-meta-agent/handoff-analyst-agent/2026-06-01',
  );
  assert.equal(acceptance.generated_agent_fixture_requirement.current_scaffold_generator_drift_closed, true);
  [
    'check-ref:generated-agent/progress-delta-policy-present',
    'check-ref:generated-agent/typed-blocker-lineage-policy-present',
    'check-ref:generated-agent/foundry-series-design-profile-present',
  ].forEach((checkRef) => {
    assert.ok(acceptance.generated_agent_fixture_requirement.required_check_refs.includes(checkRef));
  });

  assert.equal(evidence.repeat_consumption_scaleout.status, 'verified_repeat_new_agent_consumption_current_scaffold');
  assert.equal(evidence.repeat_consumption_scaleout.cohort_count, 2);
  assert.equal(evidence.repeat_consumption_scaleout.generator_drift_closed, true);
  assert.ok(
    asStrings(evidence.repeat_consumption_scaleout.closed_generator_drift_refs)
      .includes('blocker:generated-target-stage-progress-delta-policy-missing'),
  );

  const cohorts = asObjects(evidence.repeat_consumption_scaleout.cohorts);
  assert.deepEqual(cohorts.map((cohort) => cohort.target_agent_id), [
    'publication-brief-agent',
    'handoff-analyst-agent',
  ]);
  const latestCohort = cohorts[1];
  assert.equal(latestCohort.stage_pack_v2_status, 'passed');
  assert.equal(latestCohort.progress_delta_policy_status, 'present');
  assert.equal(latestCohort.typed_blocker_lineage_policy_status, 'present');
  assert.equal(latestCohort.foundry_series_design_profile, 'opl_foundry_agent_series_design_profile.v1');
  assert.equal(latestCohort.structural_conformance_status, 'passed');
  assert.equal(latestCohort.generated_interface_status, 'ready');
  assert.equal(latestCohort.product_entry_descriptor_status, 'ready');
  assert.equal(latestCohort.workbench_descriptor_status, 'ready_from_stage_control_plane');
  assert.equal(latestCohort.readiness_status, 'passed_with_production_evidence_tail');
  assert.equal(latestCohort.production_ready_claimed, false);
  assert.equal(latestCohort.domain_ready_claimed, false);
  assert.equal(latestCohort.default_promotion_claimed, false);
  assert.equal(latestCohort.long_soak_claimed, false);
  assert.deepEqual(
    asStrings(evidence.repeat_consumption_scaleout.minimum_current_scaffold_consumption_checks),
    [
      'stage_pack_v2_conformance_passed',
      'progress_delta_policy_present',
      'typed_blocker_lineage_policy_present',
      'foundry_series_design_profile_present',
      'generated_interface_ready',
      'product_entry_descriptor_ready',
      'workbench_descriptor_ready',
      'readiness_passed_with_production_evidence_tail',
    ],
  );
  assert.equal(evidence.repeat_consumption_scaleout.authority_boundary.can_claim_domain_ready, false);
  assert.equal(evidence.repeat_consumption_scaleout.authority_boundary.can_claim_production_ready, false);
  assert.equal(evidence.repeat_consumption_scaleout.authority_boundary.can_close_long_soak_gate, false);
  assert.equal(evidence.repeat_consumption_scaleout.authority_boundary.can_promote_default_agent_without_gate, false);
});
