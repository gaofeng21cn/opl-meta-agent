import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { readJson, root } from './support.mjs';
export function registerStageSurfaceTests() {
test('provider identity and stage routes are internally closed', () => {
  const identityContracts = [
    'contracts/capability_map.json',
    'contracts/domain_descriptor.json',
    'contracts/foundry_agent_series.json',
    'contracts/foundry_provider.json',
    'contracts/foundry_protocol_fixture_manifest.json',
    'contracts/foundry_protocol_improve_fixture_manifest.json',
    'contracts/memory_descriptor.json',
    'contracts/opl_agent_package_manifest.json',
    'contracts/opl_domain_manifest_registration.json',
    'contracts/pack_compiler_input.json',
  ].map(readJson);
  const provider = readJson('contracts/foundry_provider.json');
  const descriptor = readJson('contracts/domain_descriptor.json');
  const packageManifest = readJson('contracts/opl_agent_package_manifest.json');
  const actionCatalog = readJson('contracts/action_catalog.json');
  const manifest = readJson('agent/stages/manifest.json');
  const compiler = readJson('contracts/pack_compiler_input.json');
  const qualityPolicy = readJson('contracts/stage_quality_cycle_policy.json');
  const capabilityMap = readJson('contracts/capability_map.json');
  const expectedStageIds = [
    'mission-intake',
    'design-basis-admission',
    'target-agent-assessment',
    'stage-architecture',
    'agent-blueprint-authoring',
    'evaluation-design',
    'evidence-diagnosis',
    'evolution-proposal',
  ];
  const expectedStageKinds = {
    'mission-intake': 'intake',
    'design-basis-admission': 'source_preparation',
    'target-agent-assessment': 'review',
    'stage-architecture': 'planning',
    'agent-blueprint-authoring': 'creation',
    'evaluation-design': 'planning',
    'evidence-diagnosis': 'review',
    'evolution-proposal': 'revision',
  };
  const stageIds = new Set(manifest.stages.map((entry) => entry.stage_id));
  for (const contract of identityContracts) {
    assert.equal(contract.agent_id, 'oma');
    assert.equal(contract.package_id, 'oma');
    assert.equal(contract.domain_id, 'agent_engineering');
    if ('carrier_slug' in contract) assert.equal(contract.carrier_slug, 'opl-meta-agent');
  }
  assert.equal(packageManifest.kind, 'agent');
  assert.equal(packageManifest.domain_descriptor_ref, 'contracts/domain_descriptor.json');
  assert.equal(packageManifest.action_catalog_ref, 'contracts/action_catalog.json');
  assert.deepEqual(packageManifest.view_refs, []);
  assert.deepEqual(packageManifest.presentation, {
    display_name_i18n: {
      'en-US': packageManifest.display_name,
      'zh-CN': packageManifest.display_name,
    },
    description_i18n: {
      'en-US': 'OPL agent design, review, takeover, and evolution.',
      'zh-CN': 'OPL 智能体的设计、评审、接管与演进。',
    },
    session_routing_summary_i18n: {
      'en-US': 'Create, take over, or improve an Agent through OPL Foundry.',
      'zh-CN': '通过 OPL Foundry 创建、接管或改进智能体。',
    },
    home_shortcuts: [{
      shortcut_id: actionCatalog.actions[0].action_id,
      label_i18n: {
        'en-US': actionCatalog.actions[0].title,
        'zh-CN': '构建与迭代智能体',
      },
      default_visible: true,
      user_configurable: true,
      route: {
        route_kind: 'agent_package_shortcut',
        executor: 'codex_cli',
        codex_visible_entry: packageManifest.codex_surface.plugin_id,
      },
    }],
  });
  assert.equal(descriptor.kind, 'agent');
  assert.equal(descriptor.action_catalog_ref, packageManifest.action_catalog_ref);
  assert.deepEqual(descriptor.view_refs, []);
  assert.deepEqual(descriptor.public_action_ids, ['engineer-agent']);
  assert.deepEqual(actionCatalog.actions.map((action) => action.action_id), ['engineer-agent']);
  assert.deepEqual([...stageIds], expectedStageIds);
  assert.deepEqual(
    Object.fromEntries(manifest.stages.map((stage) => [stage.stage_id, stage.stage_kind])),
    expectedStageKinds,
  );
  assert.equal(compiler.canonical_agent_id, 'oma');
  assert.equal(manifest.target_domain_id, 'agent_engineering');
  assert.equal(manifest.owner, 'agent_engineering');
  assert.equal(qualityPolicy.domain_id, 'agent_engineering');
  assert.equal(qualityPolicy.owner, 'agent_engineering');
  assert.deepEqual(Object.keys(qualityPolicy.stages), expectedStageIds);

  const routedStageIds = new Set();
  assert.equal(provider.carrier_slug, 'opl-meta-agent');
  assert.deepEqual(Object.keys(descriptor.standard_agent_interface).sort(), [
    'progress',
    'routing',
    'runtime',
    'stage_catalog',
    'version',
    'workspace_binding',
  ]);
  assert.deepEqual(descriptor.standard_agent_interface.routing.workstream_ids, ['agent_engineering']);
  for (const operation of Object.values(provider.operations)) {
    for (const stageId of [operation.entry_stage_ref, operation.terminal_stage_ref, ...operation.required_stage_refs, ...operation.optional_stage_refs]) {
      assert.ok(stageIds.has(stageId), `missing provider stage ${stageId}`);
      routedStageIds.add(stageId);
    }
  }
  assert.deepEqual([...routedStageIds].sort(), [...stageIds].sort());
  assert.deepEqual(manifest.authority_boundary, {
    domain_truth_owner: 'agent_engineering',
    provider_owns_semantic_protocol_outputs: true,
    provider_owns_materialization_evaluation_versions_activation_or_rollback: false,
    opl_can_write_target_domain_truth: false,
    provider_completion_is_qualification: false,
  });
  for (const stage of manifest.stages) {
    stage.next_stage_refs.forEach((stageId) => assert.ok(stageIds.has(stageId), `missing next Stage ${stageId}`));
  }
  for (const capability of capabilityMap.capabilities) {
    capability.stage_refs.forEach((stageId) => assert.ok(stageIds.has(stageId), `missing capability Stage ${stageId}`));
  }
  const capabilityBySkillRef = new Map(
    capabilityMap.capabilities.map((entry) => [entry.physical_source_ref.ref, new Set(entry.stage_refs)]),
  );
  for (const stage of manifest.stages) {
    for (const skillRef of stage.skill_refs) {
      assert.ok(capabilityBySkillRef.has(skillRef), `Stage skill is not capability-indexed: ${skillRef}`);
      assert.ok(capabilityBySkillRef.get(skillRef).has(stage.stage_id), `capability map omits ${stage.stage_id} for ${skillRef}`);
    }
  }
});

test('generated surfaces resolve to real refs-only OMA targets without owner proof claims', () => {
  const handoff = readJson('contracts/generated_surface_handoff.json');
  const audit = readJson('contracts/functional_privatization_audit.json');
  const compiler = readJson('contracts/pack_compiler_input.json');
  const descriptor = readJson('contracts/domain_descriptor.json');
  const memory = readJson('contracts/memory_descriptor.json');
  const registration = readJson('contracts/opl_domain_manifest_registration.json');
  const expectedSurfaceIds = [
    'cli',
    'mcp',
    'skill',
    'product_entry_manifest',
    'domain_handler',
    'status_read_model',
    'workbench_drilldown',
  ];
  const moduleBySurface = new Map();

  assert.equal(handoff.surface_kind, 'opl_generated_surface_handoff_delta');
  assert.equal(handoff.schema_version, 1);
  assert.equal(handoff.defaults_profile, 'opl.hosted-foundry-generated-surface-handoff.v1');
  assert.equal(handoff.agent_id, 'oma');
  assert.deepEqual(handoff.generated_surface_ids, [
    'cli',
    'mcp',
    'skill',
    'product_entry',
    'openai',
    'ai_sdk',
    'status_read_model',
  ]);
  assert.equal('generated_surfaces' in handoff, false);
  assert.equal('handoff_surfaces' in handoff, false);
  assert.deepEqual(handoff.handoff_surface_overrides.map((surface) => surface.surface_id), expectedSurfaceIds);
  assert.equal(handoff.generated_surface_owner, 'one-person-lab');
  assert.equal(handoff.domain_repo_can_own_generated_surface, false);
  assert.equal(audit.defaults_profile, 'opl.standard-functional-privatization-audit.v1');
  assert.equal('private_functional_surface_admission_policy_ref' in audit, false);

  for (const [moduleIndex, module] of audit.modules.entries()) {
    assert.equal(module.classification, 'refs_only_domain_adapter');
    assert.equal('standardization_layer' in module, false);
    assert.ok(module.active_caller_status.startsWith('refs_only_'));
    assert.ok(module.active_callers.length > 0);
    assert.ok(module.migration_action.length > 0);
    assert.ok(module.retention_reason.length > 0);
    assert.deepEqual(module.bridge_exit_gate.keep_as_authority_adapter_refs, [
      `contracts/functional_privatization_audit.json#/modules/${moduleIndex}`,
    ]);
    assert.deepEqual(
      module.bridge_exit_gate.no_forbidden_write_refs,
      audit.bridge_exit_gate.no_forbidden_write_refs,
    );
    assert.deepEqual(module.bridge_exit_gate.provenance_refs, audit.bridge_exit_gate.provenance_refs);
    module.code_paths.forEach((relativePath) => {
      assert.ok(fs.statSync(path.join(root, relativePath)).isFile(), `missing refs-only target ${relativePath}`);
    });
    module.current_surface_refs.forEach((surfaceId) => {
      assert.equal(moduleBySurface.has(surfaceId), false, `duplicate target proof for ${surfaceId}`);
      moduleBySurface.set(surfaceId, module);
    });
  }

  for (const surface of handoff.handoff_surface_overrides) {
    assert.equal('owner' in surface, false);
    if (surface.target_role !== undefined) {
      assert.match(surface.target_role, /^(?:opl_generated_|opl_hosted_|refs_only_)/);
    }
    surface.current_paths.forEach((relativePath) => {
      assert.ok(fs.statSync(path.join(root, relativePath)).isFile(), `missing handoff target ${relativePath}`);
    });
    assert.ok(moduleBySurface.has(surface.surface_id), `missing active-caller module for ${surface.surface_id}`);
  }

  const foundryBindingSurface = handoff.handoff_surface_overrides.find(
    (surface) => surface.surface_id === 'domain_handler',
  );
  const foundryBindingModule = moduleBySurface.get('domain_handler');
  assert.equal(foundryBindingSurface.target_role, 'refs_only_foundry_provider_descriptor_target');
  assert.equal(foundryBindingModule.module_id, 'oma_foundry_binding_descriptor_refs');
  assert.equal(foundryBindingModule.active_caller_status.includes('domain_handler'), false);

  assert.deepEqual(memory.authority_boundary, {
    domain_memory_accept_reject_owner: 'oma',
    opl_can_write_memory_body: false,
    opl_can_accept_or_reject_writeback: false,
    opl_can_own_memory_verdict: false,
    opl_can_authorize_quality_or_export: false,
    provider_completion_is_memory_acceptance: false,
  });
  assert.equal(memory.memory_body_owner, 'oma');
  assert.equal(memory.memory_body_status, 'domain_owned_not_materialized_in_repo');
  assert.equal(memory.opl_projection_policy, 'locator_and_receipt_refs_only');
  memory.policy_refs.forEach((relativePath) => {
    assert.ok(fs.statSync(path.join(root, relativePath)).isFile(), `missing memory policy ref ${relativePath}`);
  });
  const projectionModule = moduleBySurface.get('status_read_model');
  assert.ok(projectionModule.code_paths.includes('contracts/memory_descriptor.json'));
  for (const surfaceId of ['status_read_model', 'workbench_drilldown']) {
    const surface = handoff.handoff_surface_overrides.find((entry) => entry.surface_id === surfaceId);
    assert.ok(surface.current_paths.includes('contracts/memory_descriptor.json'));
  }

  assert.deepEqual(audit.bridge_exit_gate.physical_delete_authorization_refs, []);
  assert.deepEqual(audit.authority_boundary, {
    domain_can_claim_generic_runtime_owner: false,
    domain_repo_can_own_generated_surface: false,
    oma_can_write_foundry_run_state: false,
    oma_can_materialize_or_evaluate: false,
    oma_can_create_version_or_change_activation: false,
    opl_can_write_target_domain_truth: false,
    provider_completion_is_qualification: false,
  });
  assert.equal(audit.retired_generated_surface_provenance.length, 1);
  audit.retired_generated_surface_provenance[0].provenance_refs.forEach((relativePath) => {
    assert.ok(fs.statSync(path.join(root, relativePath)).isFile(), `missing retirement provenance ${relativePath}`);
  });

  assert.ok(compiler.required_domain_pack_paths.includes('contracts/functional_privatization_audit.json'));
  assert.ok(compiler.required_domain_pack_paths.includes('contracts/memory_descriptor.json'));
  assert.equal(compiler.memory_descriptor_ref, 'contracts/memory_descriptor.json');
  assert.ok(compiler.declarative_domain_pack.includes('memory_policy'));
  assert.ok(compiler.declarative_domain_pack.length > 0);
  assert.equal(
    descriptor.standard_contract_refs.functional_privatization_audit,
    'contracts/functional_privatization_audit.json',
  );
  assert.equal(
    registration.domain_manifest.functional_privatization_audit_ref,
    'contracts/functional_privatization_audit.json',
  );
  assert.equal(descriptor.standard_contract_refs.memory_descriptor, 'contracts/memory_descriptor.json');
  assert.equal(registration.domain_manifest.memory_descriptor_ref, 'contracts/memory_descriptor.json');
});
}
