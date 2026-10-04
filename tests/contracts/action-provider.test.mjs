import assert from 'node:assert/strict';
import test from 'node:test';
import { readJson } from './support.mjs';
export function registerActionProviderTests() {
test('OMA exposes one public Foundry action and two internal provider operations', () => {
  const catalog = readJson('contracts/action_catalog.json');
  const provider = readJson('contracts/foundry_provider.json');
  assert.equal(catalog.target_domain_id, 'agent_engineering');
  assert.deepEqual(catalog.actions.map((entry) => entry.action_id), ['engineer-agent']);
  assert.deepEqual(catalog.actions[0].execution_binding, {
    kind: 'foundry_binding',
    provider_manifest_ref: 'contracts/foundry_provider.json',
  });
  assert.deepEqual(Object.keys(provider.operations).sort(), ['design', 'diagnose']);
  assert.deepEqual(provider.projection_policy.public_action_ids, ['engineer-agent']);
  assert.deepEqual(provider.authority_boundary, {
    provider_owns_design_semantics: true,
    provider_owns_evaluation_semantics: true,
    provider_owns_evidence_diagnosis: true,
    provider_owns_evolution_proposals: true,
    provider_owns_foundry_run_state: false,
    provider_owns_candidate_materialization: false,
    provider_owns_evaluation_execution: false,
    provider_owns_versions_or_activation: false,
    provider_can_return_patch_or_work_order: false,
    provider_can_view_protected_test_bodies: false,
    opl_can_write_target_domain_truth: false,
  });
});

test('OMA descriptor routes reference-design source refs without duplicating provider selection', () => {
  const descriptor = readJson('contracts/domain_descriptor.json');
  const catalog = readJson('contracts/action_catalog.json');
  const projection = descriptor.source_material_consumer;

  assert.deepEqual(projection, {
    version: 'opl_source_material_consumer_projection.v1',
    role_bindings: {
      reference_design: {
        applicability: 'required',
        public_action_id: 'engineer-agent',
        request_ref_field: 'source_refs',
      },
    },
    provider_execution_at_ingest: 'not_applicable',
  });

  const binding = projection.role_bindings.reference_design;
  const action = catalog.actions.find((entry) => entry.action_id === binding.public_action_id);
  assert.ok(action);
  assert.ok(descriptor.public_action_ids.includes(binding.public_action_id));
  assert.equal(action.input_schema_ref, 'opl://foundry-protocol/DesignRequest');
  assert.ok(action.required_fields.includes(binding.request_ref_field));
  assert.deepEqual(action.execution_binding, {
    kind: 'foundry_binding',
    provider_manifest_ref: 'contracts/foundry_provider.json',
  });

  for (const duplicateProviderField of [
    'provider_id',
    'agent_id',
    'package_id',
    'provider_manifest_ref',
    'provider_operation',
    'operation',
  ]) {
    assert.equal(Object.hasOwn(projection, duplicateProviderField), false);
    assert.equal(Object.hasOwn(binding, duplicateProviderField), false);
  }
});
}
