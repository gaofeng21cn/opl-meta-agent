import assert from 'node:assert/strict';
import test from 'node:test';
import {
  asStrings,
  readJson,
  readOwnerJson,
  oplSharedReleaseDependency,
  oplSharedReleaseCommit,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';
import {
  assertEveryFlagFalse,
  assertIncludesAll,
} from './support/source-purity.ts';

test('foundry agent series binds OMA to one shared lifecycle and schema owner', () => {
  const series = readJson('contracts/foundry_agent_series.json');
  const designProfile = series.series_design_profile as JsonObject;
  const domainProfile = series.domain_specific_profile as JsonObject;
  const vocabularyPolicy = domainProfile.target_agent_generic_vocabulary_policy as JsonObject;

  assert.equal(series.surface_kind, 'opl_foundry_agent_series_contract');
  assert.equal(series.version, 'foundry-agent-series.v1');
  assert.equal(series.owner, 'one-person-lab');
  assert.equal(series.domain_id, 'opl-meta-agent');
  assert.equal(series.stage_control_plane_ref, 'contracts/stage_control_plane.json');

  assert.equal(designProfile.profile_id, 'opl_foundry_agent_series_design_profile.v1');
  assertIncludesAll(asStrings(designProfile.shared_lifecycle_pipeline), [
    'domain_pack_interpretation',
    'stage_led_agent_execution',
    'owner_receipt_or_typed_blocker_closeout',
    'opl_refs_only_projection_and_recovery',
  ], 'shared lifecycle');
  assert.equal(designProfile.shared_closeout_contract.provider_completion_is_closeout, false);
  assert.equal(designProfile.shared_closeout_contract.completion_judgment_owner, 'domain_stage');
  assert.equal(designProfile.authority_invariants.opl_can_write_domain_truth, false);
  assert.equal(designProfile.authority_invariants.domain_owns_input_truth_and_output_authority, true);

  assert.equal(domainProfile.profile_id, 'oma_domain_specific_series_profile.v1');
  assert.equal(domainProfile.domain_design_center, 'agent_building_and_improvement');
  assert.equal(domainProfile.shared_opl_agent_lifecycle.stage_control_plane_ref, series.stage_control_plane_ref);
  assertEveryFlagFalse(
    domainProfile.authority_boundary as Record<string, boolean>,
    'domain-specific authority boundary',
  );
  assert.deepEqual(asStrings(vocabularyPolicy.allowed_top_level_suite_kinds), [
    'agent_lab_external_suite',
    'agent_production_evidence_suite',
  ]);
  assert.equal(vocabularyPolicy.oma_must_not_add_target_domain_compatibility_layer, true);

  assertIncludesAll(asStrings(series.required_stage_packets), [
    'stage_completion_policy',
    'progress_delta_policy',
    'typed_blocker_lineage_policy',
  ], 'required stage packets');
  assert.equal(series.domain_adapter_policy.no_parallel_progress_schema, true);
  assert.equal(series.domain_adapter_policy.no_parallel_blocker_lineage_schema, true);
  assert.equal(series.app_projection_policy.app_consumes_shared_progress_projection_only, true);
  assert.equal(series.app_projection_policy.app_can_read_domain_body, false);
  assert.equal(series.authority_boundary.generated_surface_can_claim_domain_ready, false);
});

test('foundry agent series pins the shared implementation and policy releases', () => {
  const series = readJson('contracts/foundry_agent_series.json');
  const packageJson = readJson('package.json');
  const packageLock = readJson('package-lock.json');
  const rootPackageLock = (packageLock.packages as JsonObject)[''] as JsonObject;
  const sharedPackageLock = (packageLock.packages as JsonObject)['node_modules/opl-framework-shared'] as JsonObject;
  const ownerPolicyRelease = readOwnerJson(
    series.shared_policy_release.policy_release_contract_ref as string,
  );

  assert.equal(series.contract_version_policy.current_version, series.version);
  assert.equal(series.contract_version_policy.domain_contract_ref, 'contracts/foundry_agent_series.json');
  assert.equal(series.shared_release_pin_strategy.owner_commit_pin_required, true);
  assert.equal(series.shared_release_pin_strategy.domain_dependency_pin_required, true);
  assert.equal((packageJson.dependencies as JsonObject)['opl-framework-shared'], oplSharedReleaseDependency);
  assert.equal((rootPackageLock.dependencies as JsonObject)['opl-framework-shared'], oplSharedReleaseDependency);
  assert.equal(String(sharedPackageLock.resolved).endsWith(`#${oplSharedReleaseCommit}`), true);

  assert.equal(ownerPolicyRelease.owner, 'one-person-lab');
  assert.equal(
    series.shared_policy_release.policy_bundle_fingerprint,
    ownerPolicyRelease.policy_bundle_fingerprint,
  );
  assert.equal(
    series.shared_policy_release.fingerprint_algorithm,
    ownerPolicyRelease.fingerprint_algorithm,
  );
  assert.equal(
    ownerPolicyRelease.domain_pin_requirements.domain_adapter_must_not_copy_policy_body_as_authority,
    true,
  );
});
