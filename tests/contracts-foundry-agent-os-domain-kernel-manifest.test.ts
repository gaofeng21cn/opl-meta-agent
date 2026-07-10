import assert from 'node:assert/strict';
import test from 'node:test';
import {
  asObjects,
  asStrings,
  readJson,
} from './support/contracts.ts';
import {
  assertEveryFlagFalse,
  assertFalseFlags,
  assertIncludesAll,
} from './support/source-purity.ts';

const requiredFrameworkSurfaces = 'opl agent_lab vault console runway pack capability_registry'.split(' ');
const frameworkAuthorityKeys = 'can_write_domain_truth can_sign_owner_receipt can_create_domain_typed_blocker can_authorize_quality_export_publication_or_review_verdict'.split(' ');
const targetAuthorityKeys = 'can_write_target_domain_truth can_mutate_target_domain_artifact_body can_write_target_memory_body can_authorize_target_quality_or_export_verdict can_write_target_owner_receipt_body can_promote_default_agent_without_gate'.split(' ');
const nonClaimKeys = 'target_agent_ready domain_ready quality_export_ready app_live_rendering_ready human_approval default_promotion physical_delete_authorized family_production_ready production_ready'.split(' ');

test('OMA Foundry Agent OS manifest retains domain authority and upcollects framework primitives', () => {
  const manifest = readJson('contracts/foundry-agent-os-domain-kernel-manifest.json');

  assert.equal(manifest.surface_kind, 'foundry_agent_os_domain_kernel_manifest');
  assert.equal(manifest.domain_id, 'opl-meta-agent');
  assert.equal(manifest.domain_agent_id, 'oma');
  assert.equal(manifest.owner, 'opl-meta-agent');
  assert.equal(manifest.role, 'w4_domain_kernel_manifest');

  assertIncludesAll(asStrings(manifest.domain_authority_kernel.retained_surfaces), [
    'agent_building_semantics',
    'owner_receipt_signer',
    'typed_blocker_materializer',
  ], 'retained domain authority');
  assert.equal(manifest.domain_authority_kernel.owner_receipt_signer, 'opl-meta-agent_authority_kernel');
  assert.equal(manifest.domain_authority_kernel.typed_blocker_signer, 'opl-meta-agent_authority_kernel');

  assertIncludesAll(asStrings(manifest.opl_upcollect_surfaces), [
    'agent_lab_runtime',
    'work_order_execute_absorb_cleanup',
  ], 'OPL upcollect surfaces');

  assert.equal(manifest.default_read_root.surface, 'current_owner_delta');
  assert.equal(manifest.default_read_root.projection_can_be_owner_answer, false);
});

test('OMA Foundry Agent OS manifest forbids framework and target-agent authority', () => {
  const manifest = readJson('contracts/foundry-agent-os-domain-kernel-manifest.json');
  assertIncludesAll(Object.keys(manifest.forbidden_authority_flags), requiredFrameworkSurfaces, 'framework surfaces');
  asObjects(Object.values(manifest.forbidden_authority_flags)).forEach((boundary, index) => {
    assertFalseFlags(boundary as Record<string, boolean>, frameworkAuthorityKeys, `forbidden_authority_flags[${index}]`);
    assertEveryFlagFalse(boundary as Record<string, boolean>, `forbidden_authority_flags[${index}]`);
  });
  assertFalseFlags(manifest.target_agent_forbidden_authority, targetAuthorityKeys, 'target authority');
  assertEveryFlagFalse(manifest.target_agent_forbidden_authority, 'target authority');
  assertFalseFlags(manifest.non_claims, nonClaimKeys, 'non-claims');
  assertEveryFlagFalse(manifest.non_claims, 'non-claims');
});
