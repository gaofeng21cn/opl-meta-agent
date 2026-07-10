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
  const designAuthority = designProfile.authority_invariants as JsonObject;
  const seriesAuthority = series.authority_boundary as JsonObject;

  assert.equal(series.owner, 'one-person-lab');
  assert.equal(series.domain_id, 'opl-meta-agent');
  assert.equal(series.stage_manifest_ref, 'agent/stages/manifest.json');
  assert.equal(series.stage_control_plane_ref, 'opl-generated:family_stage_control_plane');

  assertIncludesAll(asStrings(designProfile.shared_lifecycle_pipeline), [
    'stage_led_agent_execution',
    'owner_receipt_or_typed_blocker_closeout',
  ], 'shared lifecycle');
  assert.equal(designProfile.shared_closeout_contract.provider_completion_is_closeout, false);
  assert.equal(designProfile.shared_closeout_contract.completion_judgment_owner, 'domain_stage');
  assert.equal(designAuthority.domain_owns_input_truth_and_output_authority, true);
  assertEveryFlagFalse(
    designAuthority as Record<string, boolean>,
    'series design authority',
    (field) => field !== 'domain_owns_input_truth_and_output_authority',
  );

  assert.equal(domainProfile.domain_design_center, 'agent_building_and_improvement');
  assert.equal(domainProfile.shared_opl_agent_lifecycle.stage_manifest_ref, series.stage_manifest_ref);
  assert.equal(domainProfile.shared_opl_agent_lifecycle.stage_control_plane_ref, series.stage_control_plane_ref);
  assertEveryFlagFalse(domainProfile.authority_boundary, 'domain-specific authority boundary');
  assert.ok(asStrings(vocabularyPolicy.allowed_top_level_suite_kinds).length > 0);
  assert.equal(vocabularyPolicy.oma_must_not_add_target_domain_compatibility_layer, true);

  assertIncludesAll(asStrings(series.required_stage_packets), [
    'progress_delta_policy',
    'typed_blocker_lineage_policy',
  ], 'required stage packets');
  assert.equal(series.app_projection_policy.app_consumes_shared_progress_projection_only, true);
  assert.equal(series.app_projection_policy.app_can_read_domain_body, false);
  assert.equal(seriesAuthority.opl_owns_series_contract, true);
  assert.equal(seriesAuthority.domain_owns_truth_quality_artifact_memory_and_receipts, true);
  assert.equal(seriesAuthority.app_owns_display_and_user_action_shell, true);
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
  const ownerSeriesContract = readOwnerJson('contracts/opl-framework/foundry-agent-series-contract.json');
  const feedbackPolicy = series.standard_feedback_self_evolution_trigger_policy as JsonObject;
  const feedbackBoundary = feedbackPolicy.authority_boundary as JsonObject;

  assert.equal(series.shared_release_pin_strategy.owner_commit_pin_required, true);
  assert.equal(series.shared_release_pin_strategy.domain_dependency_pin_required, true);
  assert.equal((packageJson.dependencies as JsonObject)['opl-framework-shared'], oplSharedReleaseDependency);
  assert.equal((rootPackageLock.dependencies as JsonObject)['opl-framework-shared'], oplSharedReleaseDependency);
  assert.equal(String(sharedPackageLock.resolved).endsWith(`#${oplSharedReleaseCommit}`), true);

  assert.equal(
    series.shared_policy_release.policy_bundle_fingerprint,
    ownerPolicyRelease.policy_bundle_fingerprint,
  );
  assert.equal(
    series.shared_policy_release.fingerprint_algorithm,
    ownerPolicyRelease.fingerprint_algorithm,
  );
  assert.deepEqual(feedbackPolicy, ownerSeriesContract.standard_feedback_self_evolution_trigger_policy);
  assert.equal(feedbackBoundary.refs_only, true);
  assertEveryFlagFalse(
    feedbackBoundary as Record<string, boolean>,
    'feedback trigger authority',
    (field) => field !== 'refs_only',
  );
});
