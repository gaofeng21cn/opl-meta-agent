import assert from 'node:assert/strict';
import test from 'node:test';
import {
  asObjects,
  asStrings,
  readJson,
} from './support/contracts.ts';
import type { JsonObject } from './support/contracts.ts';
import {
  assertEveryFlagFalse,
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

  asObjects(Object.values(manifest.forbidden_authority_flags)).forEach((boundary, index) => {
    assertEveryFlagFalse(boundary as Record<string, boolean>, `forbidden_authority_flags[${index}]`);
  });
  assertEveryFlagFalse(
    manifest.target_agent_forbidden_authority as Record<string, boolean>,
    'target_agent_forbidden_authority',
  );
  assertEveryFlagFalse(manifest.non_claims as Record<string, boolean>, 'non_claims');

  const expectedFrameworkSurfaces = [
    'opl',
    'agent_lab',
    'vault',
    'console',
    'runway',
    'pack',
    'capability_registry',
  ];
  assert.deepEqual(Object.keys(manifest.forbidden_authority_flags), expectedFrameworkSurfaces);
  expectedFrameworkSurfaces.forEach((surface) => {
    const boundary = manifest.forbidden_authority_flags[surface] as JsonObject;
    assert.equal(boundary.can_write_domain_truth, false);
    assert.equal(boundary.can_sign_owner_receipt, false);
    assert.equal(boundary.can_create_domain_typed_blocker, false);
  });
});
