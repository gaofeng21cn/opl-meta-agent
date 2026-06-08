import test from 'node:test';
import {
  assert,
  asStrings,
  readJson,
  readOwnerJson,
  oplSharedReleaseDependency,
  oplSharedReleaseCommit,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';

test('foundry agent series contract binds OMA to shared Progress-First projection', () => {
  const series = readJson('contracts/foundry_agent_series.json');
  const packageJson = readJson('package.json');
  const packageLock = readJson('package-lock.json');

  assert.equal(series.surface_kind, 'opl_foundry_agent_series_contract');
  assert.equal(series.version, 'foundry-agent-series.v1');
  assert.equal(series.owner, 'one-person-lab');
  assert.equal(series.product_layer, 'foundry_agent');
  assert.equal(series.domain_id, 'opl-meta-agent');
  assert.equal(series.stage_control_plane_ref, 'contracts/stage_control_plane.json');
  assert.equal(series.stage_control_plane_target_domain_id, 'opl-meta-agent');
  assert.deepEqual(series.series_design_profile, {
    surface_kind: 'opl_foundry_agent_series_design_profile',
    version: 'foundry-agent-series-design-profile.v1',
    profile_id: 'opl_foundry_agent_series_design_profile.v1',
    profile_summary: 'All Foundry Agents share the same OPL domain-pack to stage-led execution to gate/receipt to handoff lifecycle; domain inputs, outputs, aliases, and authority functions vary by agent.',
    shared_lifecycle_pipeline: [
      'domain_material_intake',
      'domain_pack_interpretation',
      'stage_led_agent_execution',
      'independent_quality_gate_or_owner_review',
      'owner_receipt_or_typed_blocker_closeout',
      'artifact_or_deliverable_handoff',
      'opl_refs_only_projection_and_recovery',
    ],
    domain_io_profile: {
      input_slot: 'domain_materials_or_task_request',
      output_slot: 'domain_deliverable_or_owner_handoff',
      input_is_domain_specific: true,
      output_is_domain_specific: true,
      shared_runtime_interpretation: 'OPL treats input/output as opaque domain refs and projects identity, stage, progress, closeout, evidence, and recovery metadata only.',
    },
    stage_pack_sections: [
      'prompts',
      'stages',
      'skills',
      'knowledge',
      'quality_gates',
    ],
    shared_closeout_contract: {
      success_shape: 'domain_owner_receipt_ref',
      blocked_shape: 'domain_owned_typed_blocker_ref',
      route_back_shape: 'route_back_or_human_gate_ref',
      provider_completion_is_closeout: false,
    },
    authority_invariants: {
      opl_can_infer_domain_output: false,
      opl_can_read_domain_body: false,
      opl_can_write_domain_truth: false,
      opl_can_authorize_quality_or_export: false,
      domain_owns_input_truth_and_output_authority: true,
    },
  });
  assert.deepEqual(series.domain_specific_profile, {
    profile_id: 'oma_domain_specific_series_profile.v1',
    series_member_kind: 'opl_foundry_agent',
    series_peers: ['mas', 'mag', 'rca'],
    domain_design_center: 'agent_building_and_improvement',
    packaging_model: 'opl_generated_skill_surface_not_plugin_packaged',
    plugin_packaged_structure_required: false,
    shared_opl_agent_lifecycle: {
      shared_with_series_peers: true,
      lifecycle_packets: [
        'identity',
        'stage_control',
        'authority_boundary',
        'progress_projection',
        'currentness',
        'owner_receipt_or_typed_blocker_closeout',
        'app_projection',
      ],
      stage_control_plane_ref: 'contracts/stage_control_plane.json',
      app_projection_ref: 'contracts/generated_surface_handoff.json#/product_entry',
    },
    oma_specific_inputs: [
      'target_agent_spec_refs',
      'target_agent_evidence_refs',
      'agent_lab_handoff_refs',
      'owner_route_refs',
      'no_forbidden_write_proof_refs',
    ],
    oma_specific_outputs: [
      'candidate_agent_package_ref',
      'developer_patch_work_order_ref',
      'target_capability_improvement_candidate_ref',
      'mechanism_patch_proposal_ref',
      'typed_blocker_ref',
    ],
    series_difference: 'OMA builds and improves agents; MAS/MAG/RCA execute domain delivery. OMA uses the same OPL agent lifecycle packets while changing only the domain-specific input and output semantics.',
    target_agent_generic_vocabulary_policy: {
      top_level_command_family_scope: 'target_agent_generic_only',
      top_level_suite_kind_scope: 'target_agent_generic_only',
      allowed_top_level_suite_kinds: [
        'agent_lab_external_suite',
        'agent_production_evidence_suite',
      ],
      forbidden_domain_specific_suite_kind_prefixes: [
        'mas',
        'mag',
        'rca',
        'med_autoscience',
        'med_autogrant',
        'redcube_ai',
      ],
      domain_names_allowed_only_as: [
        'target_agent_id',
        'target_agent_ref',
        'owner_route_ref',
        'fixture_ref',
        'receipt_provenance_ref',
        'real_target_smoke_evidence_ref',
      ],
      oma_must_not_add_target_domain_compatibility_layer: true,
    },
    authority_boundary: {
      can_write_target_domain_truth: false,
      can_write_target_domain_memory_body: false,
      can_mutate_target_domain_artifact_body: false,
      can_authorize_target_domain_quality_or_export: false,
      can_claim_target_domain_ready: false,
      can_promote_default_agent_without_gate: false,
    },
  });
  assert.deepEqual(series.contract_version_policy, {
    current_version: 'foundry-agent-series.v1',
    domain_contract_ref: 'contracts/foundry_agent_series.json',
    exact_version_pin_required: true,
    compatible_version_range: ['foundry-agent-series.v1'],
    breaking_change_requires_new_version: true,
    domain_descriptor_must_reference_domain_contract: true,
  });
  assert.deepEqual(series.shared_release_pin_strategy, {
    owner_release_contract_ref: 'contracts/family-release/shared-owner-release.json',
    owner_commit_pin_required: true,
    domain_dependency_pin_required: true,
    supported_pin_sources: [
      'pyproject.toml',
      'uv.lock',
      'package.json',
      'package-lock.json',
    ],
    consumer_alignment_check: 'family:shared-release',
    domain_contract_version_pin_does_not_authorize_domain_truth: true,
  });
  assert.deepEqual(series.shared_policy_release, {
    policy_release_contract_ref: 'contracts/opl-framework/foundry-agent-series-policy-release.json',
    policy_bundle_fingerprint: 'sha256:5d77102e99e6e49acd88714cd94dcafe0969b8f2a5529928d753002ac3d4619d',
    fingerprint_algorithm: 'sha256:stable-json',
    domain_contract_policy_release_pin_required: true,
    domain_adapter_must_not_copy_policy_body_as_authority: true,
    consumer_alignment_check: 'foundry:policy-release',
  });
  assert.ok(asStrings(series.required_stage_packets).includes('progress_delta_policy'));
  assert.ok(asStrings(series.required_stage_packets).includes('typed_blocker_lineage_policy'));
  assert.ok(asStrings(series.shared_progress_projection_fields).includes('deliverable_progress_delta'));
  assert.ok(asStrings(series.shared_progress_projection_fields).includes('platform_repair_delta'));
  assert.equal(series.domain_adapter_policy.no_parallel_progress_schema, true);
  assert.equal(series.domain_adapter_policy.no_parallel_blocker_lineage_schema, true);
  assert.equal(series.app_projection_policy.app_consumes_shared_progress_projection_only, true);
  assert.equal(series.app_projection_policy.app_can_read_domain_body, false);
  assert.equal(series.authority_boundary.generated_surface_can_claim_domain_ready, false);
  assert.equal(series.workspace_topology_profile.default_profiles.one_off.project_collection_path, 'projects');
  assert.equal(series.workspace_topology_profile.default_profiles.rca_series.project_collection_path, 'projects');
  assert.equal(series.workspace_topology_profile.default_profiles.mas_portfolio.project_collection_path, 'projects');
  assert.deepEqual(
    series.workspace_topology_profile.workspace_initialization_policy.legacy_project_collection_aliases,
    ['deliverables', 'studies'],
  );
  assert.equal((packageJson.dependencies as JsonObject)['opl-framework-shared'], oplSharedReleaseDependency);
  const rootPackageLock = (packageLock.packages as JsonObject)[''] as JsonObject;
  assert.equal((rootPackageLock.dependencies as JsonObject)['opl-framework-shared'], oplSharedReleaseDependency);
  const sharedPackageLock = (packageLock.packages as JsonObject)['node_modules/opl-framework-shared'] as JsonObject;
  assert.equal(
    String(sharedPackageLock.resolved).endsWith(`#${oplSharedReleaseCommit}`),
    true,
    'opl-framework-shared lockfile entry must pin the OPL shared release commit',
  );
});

test('foundry agent series policy fingerprint matches the OPL owner release contract', () => {
  const series = readJson('contracts/foundry_agent_series.json');
  const ownerPolicyRelease = readOwnerJson(
    series.shared_policy_release.policy_release_contract_ref as string,
  );

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
