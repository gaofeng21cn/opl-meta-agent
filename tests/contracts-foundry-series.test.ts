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
  assertExactFalseFlags,
  assertFalseFlags,
  assertIncludesAll,
} from './support/source-purity.ts';

test('foundry agent series binds OMA to one shared lifecycle and schema owner', () => {
  const series = readJson('contracts/foundry_agent_series.json');
  const designProfile = series.series_design_profile as JsonObject;
  const domainProfile = series.domain_specific_profile as JsonObject;
  const vocabularyPolicy = domainProfile.target_agent_generic_vocabulary_policy as JsonObject;
  const designAuthority = designProfile.authority_invariants as JsonObject;
  const seriesAuthority = series.authority_boundary as JsonObject;

  assert.equal(series.surface_kind, 'opl_foundry_agent_series_contract');
  assert.equal(series.version, 'foundry-agent-series.v1');
  assert.equal(series.owner, 'one-person-lab');
  assert.equal(series.domain_id, 'opl-meta-agent');
  assert.equal(series.stage_manifest_ref, 'agent/stages/manifest.json');
  assert.equal(series.stage_control_plane_ref, 'opl-generated:family_stage_control_plane');

  assert.equal(designProfile.profile_id, 'opl_foundry_agent_series_design_profile.v1');
  assertIncludesAll(asStrings(designProfile.shared_lifecycle_pipeline), [
    'domain_pack_interpretation',
    'stage_led_agent_execution',
    'owner_receipt_or_typed_blocker_closeout',
    'opl_refs_only_projection_and_recovery',
  ], 'shared lifecycle');
  assert.equal(designProfile.shared_closeout_contract.provider_completion_is_closeout, false);
  assert.equal(designProfile.shared_closeout_contract.completion_judgment_owner, 'domain_stage');
  const designAuthorityFalseKeys = [
    'opl_can_infer_domain_output',
    'opl_can_read_domain_body',
    'opl_can_write_domain_truth',
    'opl_can_authorize_quality_or_export',
  ];
  assert.deepEqual(
    Object.keys(designAuthority).sort(),
    [...designAuthorityFalseKeys, 'domain_owns_input_truth_and_output_authority'].sort(),
  );
  assertFalseFlags(designAuthority, designAuthorityFalseKeys, 'series design authority');
  assert.equal(designAuthority.domain_owns_input_truth_and_output_authority, true);

  assert.equal(domainProfile.profile_id, 'oma_domain_specific_series_profile.v1');
  assert.equal(domainProfile.domain_design_center, 'agent_building_and_improvement');
  assert.equal(domainProfile.shared_opl_agent_lifecycle.stage_manifest_ref, series.stage_manifest_ref);
  assert.equal(domainProfile.shared_opl_agent_lifecycle.stage_control_plane_ref, series.stage_control_plane_ref);
  assertExactFalseFlags(domainProfile.authority_boundary, [
    'can_write_target_domain_truth',
    'can_write_target_domain_memory_body',
    'can_mutate_target_domain_artifact_body',
    'can_authorize_target_domain_quality_or_export',
    'can_claim_target_domain_ready',
    'can_promote_default_agent_without_gate',
  ], 'domain-specific authority boundary');
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
  assert.deepEqual(Object.keys(seriesAuthority).sort(), [
    'opl_owns_series_contract',
    'domain_owns_truth_quality_artifact_memory_and_receipts',
    'app_owns_display_and_user_action_shell',
    'generated_surface_can_claim_domain_ready',
  ].sort());
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

  assert.deepEqual(feedbackPolicy, ownerSeriesContract.standard_feedback_self_evolution_trigger_policy);
  assert.equal(feedbackPolicy.feedback_capture_requires_developer_mode, false);
  assert.equal(feedbackPolicy.repo_fix_execution_requires_opl_developer_mode, true);
  assert.equal(feedbackPolicy.contract_can_trigger_execution, false);
  assert.equal(feedbackPolicy.developer_route_policy.manual_developer_mode_cannot_grant_direct_repo_write, true);
  const feedbackAuthorityFalseKeys = [
    'can_write_domain_truth',
    'can_mutate_artifact_body',
    'can_authorize_quality_or_export',
    'can_create_owner_receipt',
    'can_create_typed_blocker',
    'can_execute_repo_patch_without_developer_mode',
  ];
  assert.deepEqual(Object.keys(feedbackBoundary).sort(), [...feedbackAuthorityFalseKeys, 'refs_only'].sort());
  assert.equal(feedbackBoundary.refs_only, true);
  assertFalseFlags(feedbackBoundary, feedbackAuthorityFalseKeys, 'feedback trigger authority');
});
