import assert from 'node:assert/strict';
import test from 'node:test';
import {
  asStrings,
  readJson,
  readOwnerJson,
  oplSharedReleaseDependency,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';
import { assertEveryFlagFalse } from './support/source-purity.ts';

test('foundry agent series keeps only OMA identity and domain deltas beside canonical refs', () => {
  const series = readJson('contracts/foundry_agent_series.json');
  const domainProfile = series.domain_specific_profile as JsonObject;
  const vocabularyPolicy = domainProfile.target_agent_generic_vocabulary_policy as JsonObject;
  const seriesAuthority = series.authority_boundary as JsonObject;

  assert.equal(series.owner, 'opl-meta-agent');
  assert.equal(series.canonical_policy_export, 'opl-framework-shared/foundry-agent-series-policy');
  assert.equal(series.canonical_series_contract_ref, 'contracts/opl-framework/foundry-agent-series-contract.json');
  assert.equal(series.canonical_skeleton_contract_ref, 'contracts/opl-framework/standard-domain-agent-skeleton-contract.json');
  assert.equal(series.domain_id, 'opl-meta-agent');
  assert.equal(series.stage_manifest_ref, 'agent/stages/manifest.json');
  assert.equal(series.stage_control_plane_ref, 'opl-generated:family_stage_control_plane');
  for (const field of [
    'domain_can_write_other_domain_truth',
    'domain_can_write_other_domain_memory_body',
    'domain_can_mutate_other_domain_artifact_body',
    'domain_can_authorize_other_domain_quality_or_export',
  ]) {
    assert.equal(seriesAuthority[field], false, `series authority ${field}`);
  }

  for (const copiedCanonicalBody of [
    'series_design_profile',
    'workspace_topology_profile',
    'agent_membership_projection_policy',
    'standard_public_projection_policy',
    'standard_feedback_self_evolution_trigger_policy',
  ]) assert.equal(Object.hasOwn(series, copiedCanonicalBody), false, copiedCanonicalBody);

  assert.equal(domainProfile.domain_design_center, 'agent_building_and_improvement');
  assert.equal(domainProfile.shared_opl_agent_lifecycle.stage_manifest_ref, series.stage_manifest_ref);
  assert.equal(domainProfile.shared_opl_agent_lifecycle.stage_control_plane_ref, series.stage_control_plane_ref);
  assertEveryFlagFalse(domainProfile.authority_boundary, 'domain-specific authority boundary');
  assert.ok(asStrings(vocabularyPolicy.allowed_top_level_suite_kinds).length > 0);
  assert.equal(vocabularyPolicy.oma_must_not_add_target_domain_compatibility_layer, true);

  assertEveryFlagFalse(seriesAuthority as Record<string, boolean>, 'series authority');
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
  const ownerSharedRelease = readOwnerJson('contracts/family-release/shared-owner-release.json');
  const latestStable = ownerSharedRelease.latest_stable as JsonObject;
  assert.equal((packageJson.dependencies as JsonObject)['opl-framework-shared'], oplSharedReleaseDependency);
  assert.equal((rootPackageLock.dependencies as JsonObject)['opl-framework-shared'], oplSharedReleaseDependency);
  assert.match(String(latestStable.commit), /^[0-9a-f]{40}$/);
  assert.equal(String(sharedPackageLock.resolved).endsWith(`#${latestStable.commit}`), true);

  assert.equal(
    series.shared_policy_release.policy_bundle_fingerprint,
    ownerPolicyRelease.policy_bundle_fingerprint,
  );
  assert.equal(
    series.shared_policy_release.fingerprint_algorithm,
    ownerPolicyRelease.fingerprint_algorithm,
  );
  assert.equal(series.shared_policy_release.domain_adapter_must_not_copy_policy_body_as_authority, true);
});
