import assert from 'node:assert/strict';
import test from 'node:test';
import {
  asObjects,
  asStrings,
  readJson,
} from './support/contracts.ts';
import {
  assertExactFalseFlags,
  assertIncludesAll,
} from './support/source-purity.ts';

test('OMA Foundry Agent OS manifest retains domain authority and upcollects framework primitives', () => {
  const manifest = readJson('contracts/foundry-agent-os-domain-kernel-manifest.json');

  assert.equal(manifest.surface_kind, 'foundry_agent_os_domain_kernel_manifest');
  assert.equal(manifest.domain_id, 'opl-meta-agent');
  assert.equal(manifest.domain_agent_id, 'oma');
  assert.equal(manifest.owner, 'opl-meta-agent');
  assert.equal(manifest.role, 'w4_domain_kernel_manifest');

  assertIncludesAll(asStrings(manifest.domain_authority_kernel.retained_surfaces), [
    'agent_building_semantics',
    'stage_decomposition',
    'candidate_agent_package_materialization_policy',
    'developer_work_order_materialization',
    'owner_receipt_signer',
    'typed_blocker_materializer',
  ], 'retained domain authority');
  assert.equal(manifest.domain_authority_kernel.owner_receipt_signer, 'opl-meta-agent_authority_kernel');
  assert.equal(manifest.domain_authority_kernel.typed_blocker_signer, 'opl-meta-agent_authority_kernel');

  assertIncludesAll(asStrings(manifest.opl_upcollect_surfaces), [
    'agent_lab_runtime',
    'suite_execution',
    'generated_interface_bundle',
    'work_order_execute_absorb_cleanup',
    'console_current_owner_delta_projection',
  ], 'OPL upcollect surfaces');

  assert.equal(manifest.default_read_root.surface, 'current_owner_delta');
  assert.equal(manifest.default_read_root.projection_can_be_owner_answer, false);
});

test('OMA Foundry Agent OS manifest forbids framework and target-agent authority', () => {
  const manifest = readJson('contracts/foundry-agent-os-domain-kernel-manifest.json');
  const expectedFrameworkSurfaces = [
    'opl',
    'agent_lab',
    'vault',
    'console',
    'runway',
    'pack',
    'capability_registry',
  ];
  const frameworkAuthorityKeys = [
    'can_write_domain_truth',
    'can_sign_owner_receipt',
    'can_create_domain_typed_blocker',
    'can_authorize_quality_export_publication_or_review_verdict',
  ];
  const targetAuthorityKeys = [
    'can_write_target_domain_truth',
    'can_mutate_target_domain_artifact_body',
    'can_write_target_memory_body',
    'can_authorize_target_quality_or_export_verdict',
    'can_write_target_owner_receipt_body',
    'can_promote_default_agent_without_gate',
  ];
  const nonClaimKeys = [
    'target_agent_ready',
    'domain_ready',
    'quality_export_ready',
    'app_live_rendering_ready',
    'human_approval',
    'default_promotion',
    'physical_delete_authorized',
    'family_production_ready',
    'production_ready',
  ];

  assert.deepEqual(Object.keys(manifest.forbidden_authority_flags).sort(), [...expectedFrameworkSurfaces].sort());
  asObjects(Object.values(manifest.forbidden_authority_flags)).forEach((boundary, index) => {
    assertExactFalseFlags(boundary as Record<string, boolean>, frameworkAuthorityKeys, `forbidden_authority_flags[${index}]`);
  });
  assertExactFalseFlags(manifest.target_agent_forbidden_authority, targetAuthorityKeys, 'target authority');
  assertExactFalseFlags(manifest.non_claims, nonClaimKeys, 'non-claims');
});
